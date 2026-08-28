'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Flame, Timer, Gauge, Sparkles, Check, Dumbbell, Hand } from 'lucide-react';
import { RepDetail, ExerciseType } from '../types/exercise';

interface WorkoutCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestart: () => void;
  exerciseType: ExerciseType;
  totalReps: number;
  elapsedSeconds: number;
  caloriesBurned: number;
  paceRpm: number;
  reps: RepDetail[];
}

export const WorkoutCompleteModal: React.FC<WorkoutCompleteModalProps> = ({
  isOpen,
  onClose,
  onRestart,
  exerciseType,
  totalReps,
  elapsedSeconds,
  caloriesBurned,
  paceRpm,
  reps,
}) => {
  useEffect(() => {
    if (isOpen) {
      const end = Date.now() + 2.5 * 1000;
      const colors = ['#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

      (function frame() {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: colors,
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const perfectRepsCount = reps.filter((r) => r.quality === 'perfect').length;
  const perfectPercentage = reps.length > 0 ? Math.round((perfectRepsCount / reps.length) * 100) : 0;
  const exerciseName = exerciseType === 'arm_raise' ? '両手上げ下げ運動' : 'スクワット';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in flex flex-col text-center relative">
        {/* Glowing Top Badge */}
        <div className="pt-8 pb-4 px-6 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 p-1 shadow-lg shadow-amber-500/30 flex items-center justify-center mb-4">
            <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-amber-400">
              <Trophy className="w-10 h-10 animate-bounce" />
            </div>
          </div>

          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            目標達成！おめでとうございます！
          </h2>
          <p className="text-sm text-cyan-300 mt-1 font-semibold flex items-center justify-center gap-1.5">
            {exerciseType === 'arm_raise' ? <Hand className="w-4 h-4" /> : <Dumbbell className="w-4 h-4" />}
            <span>{exerciseName} 完遂！</span>
          </p>
        </div>

        {/* Stats Grid */}
        <div className="p-6 pt-2 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Reps */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 flex flex-col items-center">
              <span className="text-[11px] text-slate-400 font-semibold mb-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                総回数
              </span>
              <span className="text-2xl font-black font-mono text-cyan-400">
                {totalReps} <span className="text-xs font-sans text-slate-400">回</span>
              </span>
            </div>

            {/* Time */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 flex flex-col items-center">
              <span className="text-[11px] text-slate-400 font-semibold mb-1 flex items-center gap-1">
                <Timer className="w-3.5 h-3.5 text-blue-400" />
                所要時間
              </span>
              <span className="text-2xl font-black font-mono text-white">
                {formatTime(elapsedSeconds)}
              </span>
            </div>

            {/* Calories */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 flex flex-col items-center">
              <span className="text-[11px] text-slate-400 font-semibold mb-1 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                消費カロリー
              </span>
              <span className="text-2xl font-black font-mono text-orange-400">
                {caloriesBurned} <span className="text-xs font-sans text-slate-400">kcal</span>
              </span>
            </div>

            {/* Form Quality */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 flex flex-col items-center">
              <span className="text-[11px] text-slate-400 font-semibold mb-1 flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                完全達成率
              </span>
              <span className="text-2xl font-black font-mono text-emerald-400">
                {perfectPercentage}%
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <span>平均ペース</span>
            <span className="font-bold text-white font-mono">{paceRpm} 回 / 分</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={onRestart}
            className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>もう一度行う</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>閉じる</span>
          </button>
        </div>
      </div>
    </div>
  );
};
