'use client';

import React, { RefObject } from 'react';
import { Camera, CameraOff, Sparkles, AlertTriangle, Eye } from 'lucide-react';
import { ExerciseFeedback, ExerciseStage, ExerciseType } from '../types/exercise';

interface CameraViewProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  isCameraActive: boolean;
  isLoadingModel: boolean;
  cameraError: string | null;
  mirrorCamera: boolean;
  currentFeedback: ExerciseFeedback;
  currentStage: ExerciseStage;
  progressPercentage: number;
  activeAngle: number | null;
  targetAngle: number;
  exerciseType: ExerciseType;
  onStartCamera: () => void;
  onStopCamera: () => void;
}

const FEEDBACK_INFO: Record<ExerciseFeedback, { text: string; bg: string; border: string; textCol: string }> = {
  // Squat Feedbacks
  STAND_READY: {
    text: '直立姿勢をキープしてください',
    bg: 'bg-slate-900/80',
    border: 'border-cyan-500/40',
    textCol: 'text-cyan-300',
  },
  GOING_DOWN: {
    text: 'ゆっくり腰を落としましょう',
    bg: 'bg-amber-950/80',
    border: 'border-amber-500/60',
    textCol: 'text-amber-300',
  },
  DEEP_ENOUGH: {
    text: 'Good depth! そのまま立ち上がって！',
    bg: 'bg-emerald-950/90',
    border: 'border-emerald-400',
    textCol: 'text-emerald-300',
  },
  PUSH_UP: {
    text: '力強く立ち上がりましょう！',
    bg: 'bg-blue-950/80',
    border: 'border-blue-400/60',
    textCol: 'text-blue-300',
  },
  TOO_SHALLOW: {
    text: '浅いです！もう少し深くしゃがんで！',
    bg: 'bg-rose-950/90',
    border: 'border-rose-500',
    textCol: 'text-rose-300',
  },

  // Arm Raise Feedbacks
  ARMS_DOWN_READY: {
    text: '両手を下ろして準備してください',
    bg: 'bg-slate-900/80',
    border: 'border-cyan-500/40',
    textCol: 'text-cyan-300',
  },
  RAISING_ARMS: {
    text: '両手を頭上まで上げましょう！',
    bg: 'bg-amber-950/80',
    border: 'border-amber-500/60',
    textCol: 'text-amber-300',
  },
  PEAK_REACHED: {
    text: '最高到達点！そのまま腕を下ろして！',
    bg: 'bg-emerald-950/90',
    border: 'border-emerald-400',
    textCol: 'text-emerald-300',
  },
  LOWERING_ARMS: {
    text: 'ゆっくり両手を下ろしましょう',
    bg: 'bg-blue-950/80',
    border: 'border-blue-400/60',
    textCol: 'text-blue-300',
  },
  TOO_LOW: {
    text: '高さが足りません！腕を上まで上げて！',
    bg: 'bg-rose-950/90',
    border: 'border-rose-500',
    textCol: 'text-rose-300',
  },
  USE_BOTH_ARMS: {
    text: '左右両方の手を同時に上げてください',
    bg: 'bg-amber-950/90',
    border: 'border-amber-500',
    textCol: 'text-amber-300',
  },

  // Common
  GOOD_REP: {
    text: 'ナイス！素晴らしいフォームです！',
    bg: 'bg-emerald-900/90',
    border: 'border-emerald-400',
    textCol: 'text-emerald-200',
  },
  PERFECT_REP: {
    text: 'パーフェクト！完璧な動作です！',
    bg: 'bg-purple-950/90',
    border: 'border-purple-400',
    textCol: 'text-purple-200',
  },
  NO_PERSON: {
    text: '全身が映る位置に立ってください',
    bg: 'bg-slate-900/90',
    border: 'border-slate-600',
    textCol: 'text-slate-300',
  },
};

export const CameraView: React.FC<CameraViewProps> = ({
  videoRef,
  canvasRef,
  isCameraActive,
  isLoadingModel,
  cameraError,
  mirrorCamera,
  currentFeedback,
  currentStage,
  progressPercentage,
  activeAngle,
  targetAngle,
  exerciseType,
  onStartCamera,
  onStopCamera,
}) => {
  const feedback = FEEDBACK_INFO[currentFeedback] || FEEDBACK_INFO.STAND_READY;
  const isTargetReached = currentStage === 'BOTTOM' || currentStage === 'PEAK';
  const isMoving = currentStage === 'DESCENDING' || currentStage === 'RAISING';

  return (
    <div className="relative w-full aspect-[4/3] md:aspect-[16/9] max-h-[65vh] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
      {/* Video Element */}
      <video
        ref={videoRef}
        className={`w-full h-full object-cover ${mirrorCamera ? '-scale-x-100' : ''}`}
        playsInline
        muted
      />

      {/* Canvas for Pose Skeleton */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${
          mirrorCamera ? '-scale-x-100' : ''
        }`}
      />

      {/* Overlay: Not Active / Loading States */}
      {!isCameraActive && (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-900/95 to-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
          {isLoadingModel ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin"></div>
                <div className="absolute inset-2 rounded-full border-4 border-emerald-500/20 border-b-emerald-400 animate-spin animate-reverse"></div>
              </div>
              <div>
                <p className="text-lg font-semibold text-white">MediaPipe AI モデル準備中...</p>
                <p className="text-sm text-slate-400 mt-1">高精度な姿勢推定エンジンをロードしています</p>
              </div>
            </div>
          ) : (
            <div className="max-w-md flex flex-col items-center space-y-5">
              <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
                <Camera className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {exerciseType === 'arm_raise' ? '両手上げ下げ運動をはじめる' : 'スクワット姿勢解析をはじめる'}
                </h3>
                <p className="text-sm text-slate-400 mt-2">
                  カメラを起動して、頭から足元まで全身（上半身）が画面に収まるように少し離れて立ってください。
                </p>
              </div>

              {cameraError && (
                <div className="p-3 bg-rose-950/60 border border-rose-600/50 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}

              <button
                onClick={onStartCamera}
                className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-5 h-5" />
                <span>カメラを開始する</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Active Camera Overlays */}
      {isCameraActive && (
        <>
          {/* Top Feedback Banner */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 max-w-[90%] transition-all duration-300">
            <div
              className={`px-5 py-2.5 rounded-full border backdrop-blur-md shadow-lg flex items-center gap-2.5 animate-fade-in ${feedback.bg} ${feedback.border}`}
            >
              <div
                className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                  isTargetReached
                    ? 'bg-emerald-400'
                    : isMoving
                    ? 'bg-amber-400'
                    : 'bg-cyan-400'
                }`}
              />
              <span className={`text-sm md:text-base font-bold tracking-wide ${feedback.textCol}`}>
                {feedback.text}
              </span>
            </div>
          </div>

          {/* Right Side Progress Gauge */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center bg-slate-950/75 backdrop-blur-md p-3 rounded-2xl border border-slate-800/80 shadow-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              {exerciseType === 'arm_raise' ? '挙上度' : '深さ'}
            </span>
            <div className="relative w-4 h-44 bg-slate-800/90 rounded-full overflow-hidden flex flex-col-reverse p-0.5 border border-slate-700">
              {/* Target Marker Line */}
              <div 
                className="absolute left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] z-10"
                style={{ bottom: '100%' }}
              />
              
              {/* Progress fill bar */}
              <div
                className={`w-full rounded-full transition-all duration-100 ${
                  progressPercentage >= 100
                    ? 'bg-gradient-to-t from-emerald-500 to-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]'
                    : progressPercentage > 60
                    ? 'bg-gradient-to-t from-cyan-500 to-amber-400'
                    : 'bg-cyan-500'
                }`}
                style={{ height: `${Math.min(100, Math.max(5, progressPercentage))}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-cyan-300 mt-2">
              {progressPercentage}%
            </span>
            {activeAngle !== null && (
              <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                {Math.round(activeAngle)}°
              </span>
            )}
          </div>

          {/* Bottom Left Camera Controls Floating Pill */}
          <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
            <button
              onClick={onStopCamera}
              className="p-2.5 bg-slate-900/80 hover:bg-rose-950/80 border border-slate-700 hover:border-rose-500/60 rounded-xl text-slate-300 hover:text-rose-300 backdrop-blur-md transition-all shadow-md cursor-pointer"
              title="カメラを停止"
            >
              <CameraOff className="w-4 h-4" />
            </button>
            <div className="px-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded-xl backdrop-blur-md text-[11px] text-slate-300 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>AI解析中</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
