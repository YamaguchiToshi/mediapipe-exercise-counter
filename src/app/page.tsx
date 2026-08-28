'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Dumbbell, 
  Hand,
  Settings as SettingsIcon, 
  Volume2, 
  VolumeX, 
  Play, 
  Square, 
  RotateCcw, 
  Sparkles, 
  Info,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { 
  ExerciseSettings, 
  ExerciseType, 
  WorkoutSession, 
  RepDetail, 
  SQUAT_DIFFICULTY_SETTINGS,
  ARM_RAISE_DIFFICULTY_SETTINGS
} from '../types/exercise';
import { useExerciseDetector } from '../hooks/useExerciseDetector';
import { CameraView } from '../components/CameraView';
import { CounterDisplay } from '../components/CounterDisplay';
import { MetricsPanel } from '../components/MetricsPanel';
import { SettingsModal } from '../components/SettingsModal';
import { HistoryPanel } from '../components/HistoryPanel';
import { WorkoutCompleteModal } from '../components/WorkoutCompleteModal';

const DEFAULT_SETTINGS: ExerciseSettings = {
  exerciseType: 'squat',
  difficulty: 'normal',
  targetReps: 10,
  soundEnabled: true,
  voiceEnabled: true,
  skeletonEnabled: true,
  mirrorCamera: true,
  facingMode: 'user',
  userWeightKg: 60,
};

const STORAGE_SETTINGS_KEY = 'exercise_counter_user_settings';
const STORAGE_SESSIONS_KEY = 'squat_counter_workout_history';

export default function HomePage() {
  const [settings, setSettings] = useState<ExerciseSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState<boolean>(false);
  const [lastRepQuality, setLastRepQuality] = useState<'perfect' | 'good' | 'shallow' | null>(null);

  // Load saved settings on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (stored) {
        setSettings((prev) => ({ ...prev, ...JSON.parse(stored) }));
      }
    } catch {
      // ignore
    }
  }, []);

  const updateSettings = useCallback((newSettings: Partial<ExerciseSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  // Save completed session to LocalStorage
  const handleSaveSession = useCallback(
    (reps: RepDetail[], totalReps: number, durationSec: number, calories: number, pace: number) => {
      if (totalReps === 0) return;
      try {
        const history: WorkoutSession[] = JSON.parse(
          localStorage.getItem(STORAGE_SESSIONS_KEY) || '[]'
        );
        const newSession: WorkoutSession = {
          id: Date.now().toString(),
          date: new Date().toLocaleDateString('ja-JP', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          exerciseType: settings.exerciseType,
          totalReps,
          durationSeconds: durationSec,
          caloriesBurned: calories,
          difficulty: settings.difficulty,
          avgPaceRpm: pace,
          reps,
        };
        const updated = [newSession, ...history].slice(0, 30);
        localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
    },
    [settings.exerciseType, settings.difficulty]
  );

  const handleRepCount = useCallback((count: number, repDetail: RepDetail) => {
    setLastRepQuality(repDetail.quality);
    setTimeout(() => {
      setLastRepQuality(null);
    }, 2000);
  }, []);

  const handleTargetReached = useCallback(() => {
    setIsCompleteModalOpen(true);
  }, []);

  // Exercise Detector Hook
  const {
    videoRef,
    canvasRef,
    isLoadingModel,
    isCameraActive,
    cameraError,
    startCamera,
    stopCamera,
    resetSession,
    repCount,
    currentStage,
    currentFeedback,
    leftAngle,
    rightAngle,
    activeAngle,
    progressPercentage,
    repHistory,
    elapsedSeconds,
    caloriesBurned,
    paceRpm,
  } = useExerciseDetector({
    settings,
    onRepCount: handleRepCount,
    onTargetReached: handleTargetReached,
  });

  const handleEndAndSave = () => {
    if (repCount > 0) {
      handleSaveSession(repHistory, repCount, elapsedSeconds, caloriesBurned, paceRpm);
    }
    stopCamera();
    resetSession();
  };

  const handleRestartFromModal = () => {
    handleSaveSession(repHistory, repCount, elapsedSeconds, caloriesBurned, paceRpm);
    setIsCompleteModalOpen(false);
    resetSession();
    if (!isCameraActive) {
      startCamera();
    }
  };

  const currentDiffConfig = settings.exerciseType === 'arm_raise'
    ? ARM_RAISE_DIFFICULTY_SETTINGS[settings.difficulty]
    : SQUAT_DIFFICULTY_SETTINGS[settings.difficulty];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950 font-sans">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
            {settings.exerciseType === 'arm_raise' ? <Hand className="w-5 h-5" /> : <Dumbbell className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
                FitAI Counter
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 font-bold">
                MediaPipe Pose
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              AIカメラによるリアルタイム運動カウント・姿勢分析
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Sound Toggle */}
          <button
            onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              settings.soundEnabled
                ? 'bg-slate-900 border-slate-700 text-cyan-400 hover:border-cyan-500/50'
                : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title="効果音のON/OFF"
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{settings.soundEnabled ? '音: ON' : '音: OFF'}</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 sm:px-3.5 sm:py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <SettingsIcon className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">設定</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Exercise Selection Tabs Bar */}
        <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 p-1.5 rounded-2xl backdrop-blur-md shadow-md">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => updateSettings({ exerciseType: 'squat' })}
              className={`px-4 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                settings.exerciseType === 'squat'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Dumbbell className="w-4 h-4" />
              <span>スクワット</span>
            </button>

            <button
              onClick={() => updateSettings({ exerciseType: 'arm_raise' })}
              className={`px-4 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                settings.exerciseType === 'arm_raise'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Hand className="w-4 h-4" />
              <span>両手上げ下げ (アームレイズ)</span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 px-3">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {settings.exerciseType === 'squat' ? '膝の角度を解析中' : '両腕の挙上角度を解析中'}
            </span>
          </div>
        </div>

        {/* Main Grid: Left is Camera & Live Guidance, Right is Counters & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Camera View */}
          <div className="lg:col-span-7 space-y-4">
            <CameraView
              videoRef={videoRef}
              canvasRef={canvasRef}
              isCameraActive={isCameraActive}
              isLoadingModel={isLoadingModel}
              cameraError={cameraError}
              mirrorCamera={settings.mirrorCamera}
              currentFeedback={currentFeedback}
              currentStage={currentStage}
              progressPercentage={progressPercentage}
              activeAngle={activeAngle}
              targetAngle={currentDiffConfig.targetAngle}
              exerciseType={settings.exerciseType}
              onStartCamera={startCamera}
              onStopCamera={stopCamera}
            />

            {/* Camera Control Bar */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2">
                {!isCameraActive ? (
                  <button
                    onClick={startCamera}
                    disabled={isLoadingModel}
                    className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>トレーニング開始</span>
                  </button>
                ) : (
                  <button
                    onClick={handleEndAndSave}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg shadow-rose-600/25 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>終了して記録</span>
                  </button>
                )}

                <button
                  onClick={resetSession}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                  title="カウンターをリセット"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">リセット</span>
                </button>
              </div>

              {/* Privacy Notice */}
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>完全ローカル解析 (映像は外部送信されません)</span>
              </div>
            </div>
          </div>

          {/* Right Column: Counters, Metrics & History */}
          <div className="lg:col-span-5 space-y-6">
            {/* Big Counter Display */}
            <CounterDisplay
              exerciseType={settings.exerciseType}
              repCount={repCount}
              targetReps={settings.targetReps}
              currentStage={currentStage}
              difficulty={settings.difficulty}
              lastRepQuality={lastRepQuality}
            />

            {/* Metrics Panel (Time, Cal, Pace, Angles) */}
            <MetricsPanel
              exerciseType={settings.exerciseType}
              elapsedSeconds={elapsedSeconds}
              caloriesBurned={caloriesBurned}
              paceRpm={paceRpm}
              leftAngle={leftAngle}
              rightAngle={rightAngle}
              difficulty={settings.difficulty}
              onReset={resetSession}
            />

            {/* History & Rep Logs */}
            <HistoryPanel currentReps={repHistory} />
          </div>
        </div>

        {/* How to use Guide Footer Card */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 text-slate-400 text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-200 text-sm mb-1">
                {settings.exerciseType === 'arm_raise' ? '両手上げ下げ運動のコツ' : '効果的なスクワット解析のコツ'}
              </h4>
              {settings.exerciseType === 'arm_raise' ? (
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li>正面を向いて立ち、両手を体側（下）から頭上高くしっかりとバンザイするように上げます。</li>
                  <li>左右両方の腕がしっかり上がると最高点（Target: {currentDiffConfig.targetAngle}°以上）を検知します。</li>
                  <li>腕を完全に下ろした位置（45°以下）に戻すと1回カウントされます。</li>
                </ul>
              ) : (
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li>カメラから約2〜3m離れ、頭から足首まで全身がフレームに収まるようにしてください。</li>
                  <li>真横または斜め45度を向くと、膝の角度が最も正確に測定されます。</li>
                  <li>太ももが床と平行になる深さ（膝角度95°前後）までしっかり腰を落とし、完全に立ち上がると1回カウントされます。</li>
                </ul>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
      />

      {/* Workout Complete Fanfare Modal */}
      <WorkoutCompleteModal
        isOpen={isCompleteModalOpen}
        onClose={() => {
          handleSaveSession(repHistory, repCount, elapsedSeconds, caloriesBurned, paceRpm);
          setIsCompleteModalOpen(false);
        }}
        onRestart={handleRestartFromModal}
        exerciseType={settings.exerciseType}
        totalReps={repCount}
        elapsedSeconds={elapsedSeconds}
        caloriesBurned={caloriesBurned}
        paceRpm={paceRpm}
        reps={repHistory}
      />
    </div>
  );
}
