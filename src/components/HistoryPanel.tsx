'use client';

import React, { useState, useEffect } from 'react';
import { History, Award, Calendar, Trash2, Dumbbell, Hand } from 'lucide-react';
import { RepDetail, WorkoutSession } from '../types/exercise';

interface HistoryPanelProps {
  currentReps: RepDetail[];
}

const STORAGE_KEY = 'squat_counter_workout_history';

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ currentReps }) => {
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [savedSessions, setSavedSessions] = useState<WorkoutSession[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedSessions(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const clearHistory = () => {
    if (window.confirm('過去のワークアウト履歴をすべて削除しますか？')) {
      localStorage.removeItem(STORAGE_KEY);
      setSavedSessions([]);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-md shadow-xl flex flex-col gap-4">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">ログ & 履歴</h3>
            <span className="text-xs text-slate-500">Rep details & past sessions</span>
          </div>
        </div>

        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'current'
                ? 'bg-slate-800 text-cyan-300 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            現在のセッション ({currentReps.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-slate-800 text-cyan-300 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            過去の記録 ({savedSessions.length})
          </button>
        </div>
      </div>

      {/* Content for Current Reps */}
      {activeTab === 'current' && (
        <div className="space-y-2">
          {currentReps.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              まだ運動の記録はありません。カメラを開始して運動を行ってください。
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
              {currentReps.map((rep) => {
                const isArm = rep.exerciseType === 'arm_raise';
                return (
                  <div
                    key={rep.repNumber}
                    className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center font-mono font-bold text-cyan-400">
                        {rep.repNumber}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-200">
                          {isArm ? '最高挙上: ' : '最深部: '}
                          <strong className="text-white font-mono">{rep.peakAngle}°</strong>
                          <span className="text-[10px] text-slate-400 ml-1.5">
                            (L:{rep.minAngleLeft}° / R:{rep.minAngleRight}°)
                          </span>
                        </span>
                        <span className="text-[10px] text-slate-400">所要時間: {rep.durationSec} 秒</span>
                      </div>
                    </div>

                    <div>
                      {rep.quality === 'perfect' ? (
                        <span className="px-2 py-0.5 rounded-full bg-purple-950/60 border border-purple-500/40 text-purple-300 text-[10px] font-bold">
                          ★ Perfect
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                          Good
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Content for Saved Sessions History */}
      {activeTab === 'history' && (
        <div className="space-y-2">
          {savedSessions.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              保存された過去のワークアウト記録はありません。
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-end">
                <button
                  onClick={clearHistory}
                  className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>履歴全削除</span>
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2 pr-1 text-xs">
                {savedSessions.map((session) => {
                  const isArm = session.exerciseType === 'arm_raise';
                  return (
                    <div
                      key={session.id}
                      className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-amber-400">
                          {isArm ? <Hand className="w-4 h-4" /> : <Award className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white font-mono">{session.totalReps} 回</span>
                            <span className="text-[10px] text-cyan-400 font-semibold">
                              {isArm ? '両手上げ下げ' : 'スクワット'}
                            </span>
                            <span className="text-[10px] text-slate-500">({session.difficulty})</span>
                          </div>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {session.date}
                          </span>
                        </div>
                      </div>

                      <div className="text-right text-[11px] text-slate-400">
                        <div>{session.caloriesBurned} kcal</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {Math.floor(session.durationSeconds / 60)}分{session.durationSeconds % 60}秒
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
