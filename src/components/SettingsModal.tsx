'use client';

import React from 'react';
import { X, Sliders, Volume2, VolumeX, Mic, MicOff, UserCheck, Eye, EyeOff, FlipHorizontal, Dumbbell, Hand } from 'lucide-react';
import { 
  ExerciseSettings, 
  ExerciseDifficulty, 
  ExerciseType,
  SQUAT_DIFFICULTY_SETTINGS, 
  ARM_RAISE_DIFFICULTY_SETTINGS 
} from '../types/exercise';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ExerciseSettings;
  onUpdateSettings: (newSettings: Partial<ExerciseSettings>) => void;
}

const PRESET_TARGETS = [0, 10, 20, 30, 50];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const isArmRaise = settings.exerciseType === 'arm_raise';
  const difficultyMap = isArmRaise ? ARM_RAISE_DIFFICULTY_SETTINGS : SQUAT_DIFFICULTY_SETTINGS;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2 text-white font-bold">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <span>設定 & カスタマイズ</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Exercise Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              トレーニング種目
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onUpdateSettings({ exerciseType: 'squat' })}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  !isArmRaise
                    ? 'bg-cyan-500/10 border-cyan-500 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-700">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs">スクワット</div>
                  <div className="text-[11px] opacity-75">下半身・脚力強化</div>
                </div>
              </button>

              <button
                onClick={() => onUpdateSettings({ exerciseType: 'arm_raise' })}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  isArmRaise
                    ? 'bg-cyan-500/10 border-cyan-500 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-700">
                  <Hand className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs">両手上げ下げ</div>
                  <div className="text-[11px] opacity-75">肩・背中・有酸素</div>
                </div>
              </button>
            </div>
          </div>

          {/* Difficulty Section */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              難易度 ({isArmRaise ? '腕の目標挙上角度' : 'スクワットの深さ判定'})
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {(Object.keys(difficultyMap) as ExerciseDifficulty[]).map((diff) => {
                const config = difficultyMap[diff];
                const isSelected = settings.difficulty === diff;
                return (
                  <button
                    key={diff}
                    onClick={() => onUpdateSettings({ difficulty: diff })}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-cyan-500/10 border-cyan-500 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-bold text-xs">{config.name}</span>
                    <span className="text-[11px] opacity-80 mt-1">
                      {isArmRaise ? `${config.targetAngle}°以上` : `${config.targetAngle}°以下`}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {difficultyMap[settings.difficulty].description}
            </p>
          </div>

          {/* Target Reps Section */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              目標回数
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_TARGETS.map((target) => {
                const isSelected = settings.targetReps === target;
                return (
                  <button
                    key={target}
                    onClick={() => onUpdateSettings({ targetReps: target })}
                    className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 border-transparent text-white shadow-md'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {target === 0 ? 'フリー(無制限)' : `${target}回`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              音声・表示オプション
            </label>

            {/* Sound FX Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-slate-950/50 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-3">
                {settings.soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-cyan-400" />
                ) : (
                  <VolumeX className="w-5 h-5 text-slate-500" />
                )}
                <div>
                  <p className="text-xs font-semibold text-white">効果音</p>
                  <p className="text-[11px] text-slate-400">カウント時・到達時のチャイム音</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
                className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
              />
            </div>

            {/* Voice Synthesis Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-slate-950/50 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-3">
                {settings.voiceEnabled ? (
                  <Mic className="w-5 h-5 text-emerald-400" />
                ) : (
                  <MicOff className="w-5 h-5 text-slate-500" />
                )}
                <div>
                  <p className="text-xs font-semibold text-white">音声ガイド (日本語)</p>
                  <p className="text-[11px] text-slate-400">「1回」「両手を上げて」などの音声読み上げ</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.voiceEnabled}
                onChange={(e) => onUpdateSettings({ voiceEnabled: e.target.checked })}
                className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
              />
            </div>

            {/* Skeleton Overlay Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-slate-950/50 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-3">
                {settings.skeletonEnabled ? (
                  <Eye className="w-5 h-5 text-purple-400" />
                ) : (
                  <EyeOff className="w-5 h-5 text-slate-500" />
                )}
                <div>
                  <p className="text-xs font-semibold text-white">骨格スケルトン表示</p>
                  <p className="text-[11px] text-slate-400">カメラ上にAI骨格線と角度バッジを描画</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.skeletonEnabled}
                onChange={(e) => onUpdateSettings({ skeletonEnabled: e.target.checked })}
                className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
              />
            </div>

            {/* Mirror Mode Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-slate-950/50 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-3">
                <FlipHorizontal className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-xs font-semibold text-white">カメラ鏡像反転 (ミラー)</p>
                  <p className="text-[11px] text-slate-400">自撮りカメラのように左右反転表示</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.mirrorCamera}
                onChange={(e) => onUpdateSettings({ mirrorCamera: e.target.checked })}
                className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
              />
            </div>

            {/* User Weight */}
            <div className="flex items-center justify-between p-3.5 bg-slate-950/50 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-3">
                <UserCheck className="w-5 h-5 text-amber-400" />
                <div>
                  <p className="text-xs font-semibold text-white">体重 (kg)</p>
                  <p className="text-[11px] text-slate-400">消費カロリーの計算に使用</p>
                </div>
              </div>
              <input
                type="number"
                min="30"
                max="200"
                value={settings.userWeightKg}
                onChange={(e) => onUpdateSettings({ userWeightKg: Number(e.target.value) || 60 })}
                className="w-20 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-right font-mono font-bold text-white focus:outline-none focus:border-cyan-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            完了
          </button>
        </div>
      </div>
    </div>
  );
};
