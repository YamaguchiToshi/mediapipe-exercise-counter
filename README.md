# FitAI Counter (MediaPipe 運動回数カウンター)

Webカメラの映像から **Google MediaPipe Pose** を用いて骨格・姿勢をリアルタイム解析し、スクワットおよび両手上げ下げ運動（アームレイズ）の回数カウントとフォーム判定を行うWebアプリケーションです。

🌐 **ライブデモ (GitHub Pages)**: [https://yamaguchitoshi.github.io/mediapipe-exercise-counter/](https://yamaguchitoshi.github.io/mediapipe-exercise-counter/)

---

## 🌟 主な機能

1. **AIによるリアルタイム骨格姿勢解析**
   - **完全ブラウザ内ローカル処理**: WebAssembly & WebGL（GPU）で動作し、カメラ映像は外部サーバーに送信されません。
   - **骨格・関節角度のオーバーレイ描画**: カメラ映像上にAI骨格線を描画し、膝や腕の屈曲・挙上角度をリアルタイム表示。

2. **2種類のトレーニング種目対応**
   - 🏋️ **スクワット (Squat)**: 股関節・膝・足首の3点角度から深さを測定。浅いスクワット時の「もっと深く！」注意や最深部到達時のチャイム音。
   - 🙌 **両手上げ下げ (Arm Raise)**: 腰・肩・手首/肘のなす角から腕の挙上角度を測定。左右対称性のチェックや頭上到達判定。

3. **リアルタイムフィードバック & サウンド**
   - **Web Audio API**: 到達チャイム音、カウント音、達成ファンファーレ音。
   - **Web Speech API**: 日本語によるリアルタイムカウント読み上げ（「1回」「2回」…「目標達成！」）。

4. **トレーニング統計 & 履歴**
   - セッションタイマー、消費カロリー計算（METs基準）、ペース（回/分）、左右の関節角度リアルタイムメーター。
   - 目標回数設定（フリー / 10回 / 20回 / 30回 / 50回）とプログレスバー、目標達成時の紙吹雪演出。
   - 過去のワークアウト履歴保存（LocalStorage）。

5. **柔軟なカスタマイズ**
   - 難易度切り替え（初級 / 中級 / 上級）
   - カメラミラー（自撮り反転）ON/OFF
   - 音声ガイド・効果音 ON/OFF
   - 骨格描画 ON/OFF
   - 体重設定（カロリー計算用）

---

## 🛠 技術スタック

- **フレームワーク**: Next.js 16 (React 19, TypeScript, App Router)
- **スタイリング**: Tailwind CSS v4
- **姿勢推定エンジン**: `@mediapipe/tasks-vision` (MediaPipe PoseLandmarker)
- **アイコン & エフェクト**: `lucide-react`, `canvas-confetti`
- **音声**: Web Audio API (シンセサイザー), Web Speech API (音声合成)
- **ホスティング**: GitHub Pages (GitHub Actions CI/CD)

---

## 🚀 はじめ方

### 1. リポジトリのクローン & パッケージインストール

```bash
git clone https://github.com/YamaguchiToshi/mediapipe-exercise-counter.git
cd mediapipe-exercise-counter
npm install
```

### 2. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

### 3. Cloudflare Web Analytics の設定 (任意)

アクセス解析を行いたい場合は、`.env.local` または GitHub リポジトリの Secrets にトークンを設定してください。

```bash
NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN="your_token_here"
```

---

## 💡 ご利用のコツ

- カメラから **約2〜3メートル** 離れ、頭から足元（または上半身）が画面に収まるように立ってください。
- スクワットは横向き〜斜め45度、両手上げ下げ運動は正面を向いて行うと最も安定して測定されます。

