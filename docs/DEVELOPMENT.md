# FitAI Counter 開発ドキュメント (Technical Documentation)

本ドキュメントは、Webカメラと **Google MediaPipe Pose** を用いた運動姿勢解析・回数自動カウントWebアプリケーション「**FitAI Counter** (MediaPipe Exercise Counter)」のアーキテクチャ、アルゴリズム仕様、コンポーネント構成、デプロイ構成を網羅した技術資料です。

---

## 1. プロジェクト概要

| 項目 | 内容 |
| :--- | :--- |
| **アプリ名** | FitAI Counter (MediaPipe Exercise Counter) |
| **リポジトリ** | [YamaguchiToshi/mediapipe-exercise-counter](https://github.com/YamaguchiToshi/mediapipe-exercise-counter) |
| **ライブデモ** | [https://yamaguchitoshi.github.io/mediapipe-exercise-counter/](https://yamaguchitoshi.github.io/mediapipe-exercise-counter/) |
| **開発言語** | TypeScript / React 19 / Next.js 16 (App Router) |
| **主な用途** | Webカメラを用いた「スクワット」および「両手上げ下げ運動（アームレイズ）」の回数カウントと姿勢・フォーム判定 |

---

## 2. システムアーキテクチャ & 技術スタック

### 2.1 全体構成図
```mermaid
graph TD
    UserCam[Webカメラ映像] --> NextApp[Next.js クライアント App]
    NextApp --> VideoElem[<video> 要素]
    VideoElem --> MPPose[MediaPipe Tasks Vision (PoseLandmarker)]
    MPPose --> LandmarkData[33点 3D骨格ランドマーク]
    
    LandmarkData --> GeomCalc[幾何学計算 & EMA平滑化]
    GeomCalc --> StateMachine[エクササイズ状態機械 (State Machine)]
    
    StateMachine -->|角度・骨格情報| CanvasOverlay[Canvas リアルタイム骨格描画]
    StateMachine -->|カウント・ステータス| StateUI[UI・メトリクス・プログレス]
    StateMachine -->|トリガー音| WebAudio[Web Audio API (効果音)]
    StateMachine -->|日本語音声| WebSpeech[Web Speech API (音声読み上げ)]
    
    StateUI --> LocalStorage[LocalStorage ワークアウト履歴]
```

### 2.2 技術スタック選定理由

| 技術 / ライブラリ | バージョン | 役割と選定理由 |
| :--- | :--- | :--- |
| **Next.js** | 16.3.3 | App Router による高速なクライアントSPA構築、静的エクスポート (`output: 'export'`) |
| **React** | 19.2.8 | 高速なコンポーネントレンダリングとカスタムフックによる状態管理 |
| **TypeScript** | 5.x | 型安全性、幾何学データやランドマーク型の堅牢な管理 |
| **Tailwind CSS** | 4.x | モダンで高視認性なダーク・サイバー系フィットネスUIデザイン |
| **@mediapipe/tasks-vision** | 0.10.14 | Google公式の最新WASM/WebGL姿勢推定エンジン（33点ランドマーク） |
| **lucide-react** | 最新 | 直感的なアイコンセット |
| **canvas-confetti** | 1.9.4 | 目標達成時のお祝い紙吹雪アニメーション |
| **Web Audio API** | Native | 外部音声ファイル不要の低遅延シンセサイザー効果音生成 |
| **Web Speech API** | Native | ブラウザ組み込みの自然な日本語音声合成によるリアルタイムコーチング |
| **GitHub Actions** | CI/CD | `main` ブランチへのプッシュで GitHub Pages へ自動ビルド＆デプロイ |

---

## 3. 運動解析アルゴリズム & 仕様詳細

### 3.1 ランドマーク幾何学計算 (`src/utils/geometry.ts`)

#### ① 3点間の角度計算（ベクトルの内積と逆余弦）
点 $A$, $B$（頂点）, $C$ において：
$$\vec{v_1} = A - B, \quad \vec{v_2} = C - B$$
$$\cos(\theta) = \frac{\vec{v_1} \cdot \vec{v_2}}{\|\vec{v_1}\| \|\vec{v_2}\|}$$
$$\theta = \arccos(\text{clamp}(\cos(\theta), -1, 1)) \times \frac{180}{\pi}$$

#### ② 指数移動平均（EMA: Exponential Moving Average）によるジッター除去
カメラの微細なノイズによる角度のブレを防止するため、平滑化係数 $\alpha = 0.35$ でフィルタリング：
$$\text{Smoothed}_t = \alpha \times \text{Raw}_t + (1 - \alpha) \times \text{Smoothed}_{t-1}$$

---

### 3.2 スクワット (Squat) 判定仕様

- **対象関節**:
  - 左脚: 股関節 (23) - 左膝 (25) - 左足首 (27)
  - 右脚: 股関節 (24) - 右膝 (26) - 右足首 (28)
- **状態遷移マシン**:
  ```mermaid
  stateDiagram-v2
      [*] --> UP: 直立 (Angle >= 160°)
      UP --> DESCENDING: 腰を落とし始める (Angle < 145°)
      DESCENDING --> BOTTOM: 目標深さに到達 (Angle <= TargetAngle)
      DESCENDING --> UP: 浅いまま戻る (Angle >= 155°) [判定: TOO_SHALLOW (不成立)]
      BOTTOM --> ASCENDING: 立ち上がり始める (Angle > TargetAngle + 10°)
      ASCENDING --> UP: 完全に立ち上がる (Angle >= 160°) [カウント + 1 / 成否記録]
  ```
- **難易度別 閾値設定**:
  - **初級 (Easy)**: 目標角度 $105^\circ$ 以下（ハーフスクワット）
  - **中級 (Normal)**: 目標角度 $95^\circ$ 以下（パラレルスクワット / 床と平行）
  - **上級 (Hard)**: 目標角度 $85^\circ$ 以下（フルスクワット）

---

### 3.3 両手上げ下げ (Arm Raise) 判定仕様

- **対象関節**:
  - 左腕: 左腰 (23) - 左肩 (11) - 左手首 (15) / 左肘 (13)
  - 右腕: 右腰 (24) - 右肩 (12) - 右手首 (16) / 右肘 (14)
- **状態遷移マシン**:
  ```mermaid
  stateDiagram-v2
      [*] --> DOWN: 腕を下ろした状態 (Angle <= 45°)
      DOWN --> RAISING: 腕を上げ始める (Angle > 60°)
      RAISING --> PEAK: 目標挙上角度に到達 (Angle >= TargetAngle)
      RAISING --> DOWN: 上げきらずに戻す (Angle <= 55°) [判定: TOO_LOW (不成立)]
      PEAK --> LOWERING: 腕を下ろし始める (Angle < TargetAngle - 15°)
      LOWERING --> DOWN: 完全に下ろす (Angle <= 50°) [カウント + 1 / 成否記録]
  ```
- **左右バランスチェック**:
  - 左右の腕角度差が $40^\circ$ 以上の場合、「左右両方の手を同時に上げてください」とフィードバック。
- **難易度別 閾値設定**:
  - **初級 (Easy)**: 目標角度 $130^\circ$ 以上（肩の高さ〜やや上）
  - **中級 (Normal)**: 目標角度 $150^\circ$ 以上（頭上近く）
  - **上級 (Hard)**: 目標角度 $165^\circ$ 以上（真上までフルレンジ）

---

## 4. UI / UX & コンポーネント設計

```
src/
├── app/
│   ├── layout.tsx         # ルートレイアウト・メタデータ
│   ├── page.tsx           # メイン画面（運動種目タブ、コントロールバー）
│   └── globals.css        # Tailwind CSS スタイル
├── components/
│   ├── CameraView.tsx     # ビデオ・骨格Canvas・リアルタイム深度/挙上バー
│   ├── CounterDisplay.tsx # 特大カウント表示・ステージバッジ・目標進捗バー
│   ├── MetricsPanel.tsx   # タイマー・カロリー・ペース・左右関節角度メーター
│   ├── SettingsModal.tsx  # 難易度・目標回数・音声・カメラミラー・体重設定
│   ├── HistoryPanel.tsx   # 現セッション詳細ログ & 過去履歴（LocalStorage）
│   └── WorkoutCompleteModal.tsx # 目標達成モーダル（紙吹雪 & サマリー）
├── hooks/
│   ├── useExerciseDetector.ts # 姿勢解析ループ・ステートマシン統合フック
│   └── useSquatDetector.ts    # 後方互換性エイリアス
├── types/
│   ├── exercise.ts        # 運動状態・設定・セッション等の型定義
│   └── squat.ts           # 後方互換性エイリアス
└── utils/
    ├── audio.ts           # Web Audio API シンセ音 & Web Speech API 音声合成
    ├── geometry.ts        # 幾何学角度計算 & EMA スムーサー
    └── mediapipe.ts       # MediaPipe 初期化 & 骨格Canvas描画ロジック
```

---

## 5. 消費カロリー & ペース計算ロジック

### ① 消費カロリー算出式
厚生労働省および運動生理学の **METs (Metabolic Equivalents)** 基準を採用：
$$\text{基礎消費 (kcal)} = \text{METs} \times 3.5 \times \text{体重(kg)} \div 200 \times \frac{\text{経過時間(秒)}}{60}$$
$$\text{レップ消費 (kcal)} = \text{回数} \times \text{レップ係数}$$
- **スクワット**: $5.0 \text{ METs}$、レップ係数 $0.35 \text{ kcal/rep}$
- **両手上げ下げ**: $3.8 \text{ METs}$、レップ係数 $0.25 \text{ kcal/rep}$

### ② ペース算出式
$$\text{ペース (回/分)} = \frac{\text{総回数}}{\text{経過時間(秒)} \div 60}$$

---

## 6. デプロイ & CI/CD パイプライン

### GitHub Pages 自動デプロイ設定
- **静的エクスポート (`next.config.ts`)**:
  - `output: 'export'`
  - 本番環境ビルド時に `basePath: '/mediapipe-exercise-counter'` を付与。
- **GitHub Actions (`.github/workflows/deploy.yml`)**:
  - `push` to `main` をトリガーに、Node.js 20 環境で `npm ci` ➜ `npm run build` ➜ `actions/deploy-pages@v4` で自動デプロイ。
