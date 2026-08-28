'use client';

import React from 'react';
import { Trophy, Flame, Activity, CheckCircle2, Dumbbell, Hand } from 'lucide-react';
import { 
  ExerciseStage, 
  ExerciseDifficulty, 
  ExerciseType,
  SQUAT_DIFFICULTY_SETTINGS,
  ARM_RAISE_DIFFICULTY_SETTINGS 
} from '../types/exercise';

interface CounterDisplayProps {
  exerciseType: ExerciseType;
  repCount: number;
  targetReps: number;
  currentStage: ExerciseStage;
  difficulty: ExerciseDifficulty;
  lastRepQuality?: 'perfect' | 'good' | 'shallow' | null;
}

const STAGE_LABELS: Record<string, { label: string; color: string; badgeBg: string }> = {
  // Squat stages
  UP: {
    label: '直立 (Ready)',
    color: 'text-cyan-400',
    badgeBg: 'bg-cyan-950/60 border-cyan-500/30 text-cyan-300',
  },
  DESCENDING: {
    label: '腰を落とし中...',
    color: 'text-amber-400',
    badgeBg: 'bg-amber-950/60 border-amber-500/30 text-amber-300',
  },
  BOTTOM: {
    label: '最深部到達！',
    color: 'text-emerald-400',
    badgeBg: 'bg-emerald-950/70 border-emerald-400 text-emerald-200',
  },
  ASCENDING: {
    label: '立ち上がり中...',
    color: 'text-blue-400',
    badgeBg: 'bg-blue-950/60 border-blue-500/30 text-blue-300',
  },

  // Arm Raise stages
  DOWN: {
    label: '下ろした状態 (Ready)',
    color: 'text-cyan-400',
    badgeBg: 'bg-cyan-950/60 border-cyan-500/30 text-cyan-300',
  },
  RAISING: {
    label: '腕を上げ中...',
    color: 'text-amber-400',
    badgeBg: 'bg-amber-950/60 border-amber-500/30 text-amber-300',
  },
  PEAK: {
    label: '最高点到達！',
    color: 'text-emerald-400',
    badgeBg: 'bg-emerald-950/70 border-emerald-400 text-emerald-200',
  },
  LOWERING: {
    label: '腕を下ろし中...',
    color: 'text-blue-400',
    badgeBg: 'bg-blue-950/60 border-blue-500/30 text-blue-300',
  },
};

export const CounterDisplay: React.FC<CounterDisplayProps> = ({
  exerciseType,
  repCount,
  targetReps,
  currentStage,
  difficulty,
  lastRepQuality,
}) => {
  const stageInfo = STAGE_LABELS[currentStage] || STAGE_LABELS.UP;
  const targetProgress = targetReps > 0 ? Math.min(100, Math.round((repCount / targetReps) * 100)) : 0;
  const remainingReps = targetReps > 0 ? Math.max(0, targetReps - repCount) : null;
  
  const diffConfig = exerciseType === 'arm_raise' 
    ? ARM_RAISE_DIFFICULTY_SETTINGS[difficulty] 
    : SQUAT_DIFFICULTY_SETTINGS[difficulty];

  const exerciseTitle = exerciseType === 'arm_raise' ? 'Arm Raise Counter' : 'Squat Counter';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-xl flex flex-col justify-between relative overflow-hidden">
      {/* Background Accent Glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Info */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            {exerciseType === 'arm_raise' ? <Hand className="w-5 h-5" /> : <Dumbbell className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{exerciseTitle}</h2>
            <span className="text-xs text-slate-500 font-medium">{diffConfig.name}</span>
          </div>
        </div>

        {/* Stage Status Badge */}
        <div className={`px-3 py-1 rounded-full border text-xs font-semibold backdrop-blur-sm ${stageInfo.badgeBg} transition-all duration-200`}>
          {stageInfo.label}
        </div>
      </div>

      {/* Main Counter Number */}
      <div className="my-6 flex flex-col items-center justify-center z-10">
        <div className="relative">
          <span className="text-8xl md:text-9xl font-black tracking-tighter bg-gradient-to-br from-white via-slate-100 to-slate-400 bg-clip-text text-transparent drop-shadow-sm font-mono select-none">
            {repCount}
          </span>
          <span className="absolute -top-1 -right-8 text-sm md:text-base font-bold text-cyan-400 uppercase tracking-widest">
            回
          </span>
        </div>

        {/* Last Rep Feedback Pill */}
        {lastRepQuality && (
          <div className="mt-2 animate-bounce">
            {lastRepQuality === 'perfect' && (
              <span className="px-3 py-0.5 rounded-full bg-purple-900/60 border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center gap-1 shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5" /> Perfect Full Motion!
              </span>
            )}
            {lastRepQuality === 'good' && (
              <span className="px-3 py-0.5 rounded-full bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1 shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5" /> Good Rep!
              </span>
            )}
          </div>
        )}
      </div>

      {/* Target Progress Bar */}
      {targetReps > 0 ? (
        <div className="z-10 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              目標: <strong className="text-white font-mono">{targetReps}回</strong>
            </span>
            <span className="text-cyan-400 font-semibold font-mono">
              {remainingReps === 0 ? '目標達成！🎉' : `あと ${remainingReps} 回 (${targetProgress}%)`}
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
              style={{ width: `${targetProgress}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="z-10 flex items-center justify-between text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <span className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-orange-400" />
            フリーモード（無制限）
          </span>
          <span className="text-slate-500 font-medium">自分のペースで継続中</span>
        </div>
      )}
    </div>
  );
};
