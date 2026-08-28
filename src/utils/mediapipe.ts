import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import { LandmarkPoint, ExerciseType } from '../types/exercise';

// Connection indices for human skeleton
export const POSE_CONNECTIONS: [number, number][] = [
  // Face
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],
  [9, 10],
  // Upper body
  [11, 12], // Shoulders
  [11, 13], [13, 15], // Left arm
  [12, 14], [14, 16], // Right arm
  [11, 23], [12, 24], // Torso sides
  [23, 24], // Hips
  // Lower body
  [23, 25], [25, 27], [27, 29], [29, 31], [27, 31], // Left leg & foot
  [24, 26], [26, 28], [28, 30], [30, 32], [28, 32], // Right leg & foot
];

const LEG_CONNECTIONS = new Set([
  '23-25', '25-27', '27-29', '29-31', '27-31',
  '24-26', '26-28', '28-30', '30-32', '28-32',
  '23-24'
]);

const ARM_CONNECTIONS = new Set([
  '11-13', '13-15', '12-14', '14-16', '11-12', '11-23', '12-24'
]);

let poseLandmarkerInstance: PoseLandmarker | null = null;

/**
 * Initializes the MediaPipe PoseLandmarker instance
 */
export async function initPoseLandmarker(): Promise<PoseLandmarker> {
  if (poseLandmarkerInstance) {
    return poseLandmarkerInstance;
  }

  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
  );

  poseLandmarkerInstance = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  return poseLandmarkerInstance;
}

export interface DrawSkeletonOptions {
  exerciseType: ExerciseType;
  leftAngle: number | null;
  rightAngle: number | null;
  isPeakReached: boolean;
  targetAngle: number;
}

/**
 * Draws skeleton, joints, and real-time angle labels on canvas
 */
export function drawPoseSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: LandmarkPoint[],
  width: number,
  height: number,
  options: DrawSkeletonOptions
) {
  ctx.clearRect(0, 0, width, height);

  if (!landmarks || landmarks.length === 0) return;

  const { exerciseType, leftAngle, rightAngle, isPeakReached, targetAngle } = options;
  const isArmRaise = exerciseType === 'arm_raise';

  // Highlight color
  let activeStrokeColor = '#06b6d4'; // Cyan default
  let glowColor = 'rgba(6, 182, 212, 0.4)';

  if (isPeakReached) {
    activeStrokeColor = '#10b981'; // Emerald/Green for reaching target (bottom or peak)
    glowColor = 'rgba(16, 185, 129, 0.6)';
  } else {
    if (isArmRaise) {
      const avgArm = ((leftAngle ?? 0) + (rightAngle ?? 0)) / 2;
      if (avgArm > targetAngle - 25) {
        activeStrokeColor = '#f59e0b';
        glowColor = 'rgba(245, 158, 11, 0.5)';
      }
    } else {
      const minAngle = Math.min(leftAngle ?? 180, rightAngle ?? 180);
      if (minAngle < targetAngle + 20) {
        activeStrokeColor = '#f59e0b';
        glowColor = 'rgba(245, 158, 11, 0.5)';
      }
    }
  }

  // Draw bone lines
  for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
    const p1 = landmarks[startIdx];
    const p2 = landmarks[endIdx];

    if (!p1 || !p2 || (p1.visibility && p1.visibility < 0.4) || (p2.visibility && p2.visibility < 0.4)) {
      continue;
    }

    const connKey1 = `${startIdx}-${endIdx}`;
    const connKey2 = `${endIdx}-${startIdx}`;
    const isHighlighted = isArmRaise
      ? ARM_CONNECTIONS.has(connKey1) || ARM_CONNECTIONS.has(connKey2)
      : LEG_CONNECTIONS.has(connKey1) || LEG_CONNECTIONS.has(connKey2);

    ctx.beginPath();
    ctx.moveTo(p1.x * width, p1.y * height);
    ctx.lineTo(p2.x * width, p2.y * height);

    if (isHighlighted) {
      ctx.strokeStyle = activeStrokeColor;
      ctx.lineWidth = 6;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 12;
    } else {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 0;
    }

    ctx.lineCap = 'round';
    ctx.stroke();
  }

  ctx.shadowBlur = 0; // Reset shadow

  // Draw joint landmarks
  landmarks.forEach((p, idx) => {
    if (p.visibility && p.visibility < 0.4) return;

    const x = p.x * width;
    const y = p.y * height;

    const isPrimaryJoint = isArmRaise
      ? idx === 11 || idx === 12 || idx === 13 || idx === 14 || idx === 15 || idx === 16 // Shoulders, Elbows, Wrists
      : idx === 25 || idx === 26 || idx === 23 || idx === 24 || idx === 27 || idx === 28; // Hips, Knees, Ankles

    const isKeyVertex = isArmRaise ? (idx === 11 || idx === 12) : (idx === 25 || idx === 26);

    ctx.beginPath();
    if (isKeyVertex) {
      ctx.arc(x, y, 9, 0, 2 * Math.PI);
      ctx.fillStyle = isPeakReached ? '#10b981' : '#f59e0b';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
    } else if (isPrimaryJoint) {
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = '#06b6d4';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
    } else {
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 1.5;
    }

    ctx.fill();
    ctx.stroke();
  });

  // Render Angle Badges
  const drawAngleBadge = (jointPt: LandmarkPoint, angle: number | null, label: string, isLeft: boolean) => {
    if (angle === null || (jointPt.visibility && jointPt.visibility < 0.4)) return;

    const kx = jointPt.x * width;
    const ky = jointPt.y * height;
    const offsetX = isLeft ? 25 : -95;
    const offsetY = -10;

    const badgeX = kx + offsetX;
    const badgeY = ky + offsetY;

    ctx.fillStyle = isPeakReached ? 'rgba(6, 78, 59, 0.85)' : 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = isPeakReached ? '#34d399' : '#38bdf8';
    ctx.lineWidth = 1.5;

    const text = `${label}: ${Math.round(angle)}°`;
    ctx.font = 'bold 13px ui-monospace, monospace';
    const textWidth = ctx.measureText(text).width;

    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, textWidth + 16, 26, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isPeakReached ? '#6ee7b7' : '#e0f2fe';
    ctx.fillText(text, badgeX + 8, badgeY + 18);
  };

  if (isArmRaise) {
    if (landmarks[11]) drawAngleBadge(landmarks[11], leftAngle, '左腕', true);
    if (landmarks[12]) drawAngleBadge(landmarks[12], rightAngle, '右腕', false);
  } else {
    if (landmarks[25]) drawAngleBadge(landmarks[25], leftAngle, '左膝', true);
    if (landmarks[26]) drawAngleBadge(landmarks[26], rightAngle, '右膝', false);
  }
}
