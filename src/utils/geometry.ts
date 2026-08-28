import { LandmarkPoint } from '../types/exercise';

/**
 * Calculates the angle (in degrees) between three 2D/3D points: A - B - C (at vertex B)
 * Example:
 * - Squat: Hip(A) - Knee(B) - Ankle(C)
 * - Arm Raise: Hip(A) - Shoulder(B) - Wrist(C)
 */
export function calculateAngle(
  pointA: LandmarkPoint,
  pointB: LandmarkPoint,
  pointC: LandmarkPoint
): number {
  // Vector BA
  const v1 = {
    x: pointA.x - pointB.x,
    y: pointA.y - pointB.y,
  };
  // Vector BC
  const v2 = {
    x: pointC.x - pointB.x,
    y: pointC.y - pointB.y,
  };

  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

  if (mag1 * mag2 === 0) return 180;

  let cosAngle = dot / (mag1 * mag2);
  // Clamp cosAngle to [-1, 1] for numeric safety
  cosAngle = Math.max(-1, Math.min(1, cosAngle));

  const radians = Math.acos(cosAngle);
  const degrees = (radians * 180) / Math.PI;

  return Math.round(degrees * 10) / 10;
}

/**
 * Calculates arm elevation angle (Hip - Shoulder - Wrist or Elbow)
 */
export function calculateArmElevationAngle(
  hip: LandmarkPoint,
  shoulder: LandmarkPoint,
  wrist: LandmarkPoint,
  elbow?: LandmarkPoint
): number {
  // If wrist is well detected, use Hip-Shoulder-Wrist, fallback to Hip-Shoulder-Elbow
  const targetArmPoint = (wrist && (!wrist.visibility || wrist.visibility > 0.3)) ? wrist : (elbow ?? wrist);
  return calculateAngle(hip, shoulder, targetArmPoint);
}

/**
 * Calculates torso inclination angle relative to vertical axis
 */
export function calculateTorsoAngle(
  shoulder: LandmarkPoint,
  hip: LandmarkPoint
): number {
  const dx = shoulder.x - hip.x;
  const dy = shoulder.y - hip.y;

  const angleRad = Math.atan2(Math.abs(dx), Math.abs(dy));
  return Math.round(((angleRad * 180) / Math.PI) * 10) / 10;
}

/**
 * Exponential Moving Average (EMA) smoothing for stable angle readings
 */
export class AngleSmoother {
  private smoothedValue: number | null = null;
  private alpha: number;

  constructor(alpha: number = 0.35) {
    this.alpha = alpha;
  }

  update(raw: number): number {
    if (this.smoothedValue === null || isNaN(this.smoothedValue)) {
      this.smoothedValue = raw;
    } else {
      this.smoothedValue = this.alpha * raw + (1 - this.alpha) * this.smoothedValue;
    }
    return Math.round(this.smoothedValue * 10) / 10;
  }

  reset(): void {
    this.smoothedValue = null;
  }
}
