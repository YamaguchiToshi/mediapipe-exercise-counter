'use client';

import React from 'react';
import { Timer, Flame, Gauge, RotateCcw } from 'lucide-react';
import { 
  ExerciseDifficulty, 
  ExerciseType,
  SQUAT_DIFFICULTY_SETTINGS,
  ARM_RAISE_DIFFICULTY_SETTINGS
} from '../types/exercise';

interface MetricsPanelProps {
  exerciseType: ExerciseType;
  elapsedSeconds: number;
  caloriesBurned: number;
  paceRpm: number;
  leftAngle: number | null;
  rightAngle: number | null;
  difficulty: ExerciseDifficulty;
  onReset: () => void;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({
  exerciseType,
  elapsedSeconds,
  caloriesBurned,
  paceRpm,
  leftAngle,
  rightAngle,
  difficulty,
  onReset,
}) => {
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isArmRaise = exerciseType === 'arm_raise';
  const diffConfig = isArmRaise
    ? ARM_RAISE_DIFFICULTY_SETTINGS[difficulty]
    : SQUAT_DIFFICULTY_SETTINGS[difficulty];

  // Helper for angle color
  const getAngleColor = (angle: number | null) => {
    if (angle === null) return 'text-slate-500';
    if (isArmRaise) {
      if (angle >= diffConfig.targetAngle) return 'text-emerald-400 font-bold';
      if (angle >= diffConfig.targetAngle - 20) return 'text-amber-400 font-bold';
      return 'text-cyan-400 font-medium';
    } else {
      if (angle <= diffConfig.targetAngle) return 'text-emerald-400 font-bold';
      if (angle <= diffConfig.targetAngle + 20) return 'text-amber-400 font-bold';
      return 'text-cyan-400 font-medium';
    }
  };

  const labelTitle = isArmRaise 
    ? `腕の挙上角度 (Target: ${diffConfig.targetAngle}°以上)`
    : `膝の屈曲角度 (Target: ${diffConfig.targetAngle}°以下)`;

  const leftLabel = isArmRaise ? '左腕' : '左膝';
  const rightLabel = isArmRaise ? '右腕' : '右膝';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-md shadow-xl flex flex-col gap-4">
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-3 gap-3">
        {/* Time */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1 text-slate-400 text-xs mb-1">
            <Timer className="w-3.5 h-3.5 text-blue-400" />
            <span>時間</span>
          </div>
          <span className="text-xl md:text-2xl font-bold font-mono text-white">
            {formatTime(elapsedSeconds)}
          </span>
        </div>

        {/* Calories */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1 text-slate-400 text-xs mb-1">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>カロリー</span>
          </div>
          <span className="text-xl md:text-2xl font-bold font-mono text-white">
            {caloriesBurned} <span className="text-[10px] text-slate-400 font-sans">kcal</span>
          </span>
        </div>

        {/* Pace */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1 text-slate-400 text-xs mb-1">
            <Gauge className="w-3.5 h-3.5 text-emerald-400" />
            <span>ペース</span>
          </div>
          <span className="text-xl md:text-2xl font-bold font-mono text-white">
            {paceRpm} <span className="text-[10px] text-slate-400 font-sans">回/分</span>
          </span>
        </div>
      </div>

      {/* Realtime Joint Angles Indicator */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2.5">
          <span className="font-semibold text-slate-300">{labelTitle}</span>
          <span className="text-[11px] text-slate-500">リアルタイム</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Left Side */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-lg p-2.5 flex items-center justify-between">
            <span className="text-xs text-slate-400">{leftLabel}</span>
            <span className={`text-base font-mono ${getAngleColor(leftAngle)}`}>
              {leftAngle !== null ? `${leftAngle}°` : '--'}
            </span>
          </div>

          {/* Right Side */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-lg p-2.5 flex items-center justify-between">
            <span className="text-xs text-slate-400">{rightLabel}</span>
            <span className={`text-base font-mono ${getAngleColor(rightAngle)}`}>
              {rightAngle !== null ? `${rightAngle}°` : '--'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer: Reset Button */}
      <div className="flex justify-end pt-1">
        <button
          onClick={onReset}
          className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>カウントをリセット</span>
        </button>
      </div>
    </div>
  );
};
