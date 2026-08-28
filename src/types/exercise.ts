export type ExerciseType = 'squat' | 'arm_raise';

export type SquatStage = 'UP' | 'DESCENDING' | 'BOTTOM' | 'ASCENDING';
export type ArmRaiseStage = 'DOWN' | 'RAISING' | 'PEAK' | 'LOWERING';
export type ExerciseStage = SquatStage | ArmRaiseStage;

export type SquatFeedback = 
  | 'STAND_READY'
  | 'GOING_DOWN'
  | 'DEEP_ENOUGH'
  | 'PUSH_UP'
  | 'TOO_SHALLOW'
  | 'GOOD_REP'
  | 'PERFECT_REP'
  | 'NO_PERSON';

export type ArmRaiseFeedback =
  | 'ARMS_DOWN_READY'
  | 'RAISING_ARMS'
  | 'PEAK_REACHED'
  | 'LOWERING_ARMS'
  | 'TOO_LOW'
  | 'USE_BOTH_ARMS'
  | 'GOOD_REP'
  | 'PERFECT_REP'
  | 'NO_PERSON';

export type ExerciseFeedback = SquatFeedback | ArmRaiseFeedback;

export type ExerciseDifficulty = 'easy' | 'normal' | 'hard';

export interface ExerciseDifficultyConfig {
  name: string;
  // For squat: target knee angle (e.g. 105, 95, 85)
  // For arm raise: target arm elevation angle (e.g. 130, 150, 165)
  targetAngle: number;
  baseAngle: number; // Squat: upAngle (160), Arm raise: downAngle (45)
  description: string;
}

export const SQUAT_DIFFICULTY_SETTINGS: Record<ExerciseDifficulty, ExerciseDifficultyConfig> = {
  easy: {
    name: '初級 (Easy)',
    targetAngle: 105,
    baseAngle: 155,
    description: '浅めのハーフスクワット。膝への負担を抑えたい方向け',
  },
  normal: {
    name: '中級 (Normal)',
    targetAngle: 95,
    baseAngle: 160,
    description: '標準的なパラレルスクワット。太ももが床と平行になる深さ',
  },
  hard: {
    name: '上級 (Hard)',
    targetAngle: 85,
    baseAngle: 165,
    description: '深いフルスクワット。最大の筋トレ効果を狙う方向け',
  },
};

export const ARM_RAISE_DIFFICULTY_SETTINGS: Record<ExerciseDifficulty, ExerciseDifficultyConfig> = {
  easy: {
    name: '初級 (Easy)',
    targetAngle: 130,
    baseAngle: 55,
    description: '肩の高さ〜やや上まで腕を上げる軽めの運動',
  },
  normal: {
    name: '中級 (Normal)',
    targetAngle: 150,
    baseAngle: 45,
    description: '頭上近くまでしっかりと両腕を上げる標準運動',
  },
  hard: {
    name: '上級 (Hard)',
    targetAngle: 165,
    baseAngle: 35,
    description: '両腕を真上まで完全に伸ばし切るフルレンジ運動',
  },
};

export interface ExerciseSettings {
  exerciseType: ExerciseType;
  difficulty: ExerciseDifficulty;
  targetReps: number; // 0 for infinite/free mode
  soundEnabled: boolean;
  voiceEnabled: boolean;
  skeletonEnabled: boolean;
  mirrorCamera: boolean;
  facingMode: 'user' | 'environment';
  userWeightKg: number;
}

export interface RepDetail {
  repNumber: number;
  exerciseType: ExerciseType;
  minAngleLeft: number;
  minAngleRight: number;
  peakAngle: number;
  durationSec: number;
  quality: 'perfect' | 'good' | 'shallow';
  timestamp: number;
}

export interface WorkoutSession {
  id: string;
  date: string;
  exerciseType: ExerciseType;
  totalReps: number;
  durationSeconds: number;
  caloriesBurned: number;
  difficulty: ExerciseDifficulty;
  avgPaceRpm: number;
  reps: RepDetail[];
}

export interface LandmarkPoint {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

// Backward compatibility alias
export type SquatSettings = ExerciseSettings;
export type SquatDifficulty = ExerciseDifficulty;
export const DIFFICULTY_SETTINGS = SQUAT_DIFFICULTY_SETTINGS;
