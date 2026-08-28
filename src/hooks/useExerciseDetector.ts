'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { PoseLandmarker } from '@mediapipe/tasks-vision';
import { 
  ExerciseType,
  ExerciseStage, 
  ExerciseFeedback, 
  ExerciseSettings, 
  SQUAT_DIFFICULTY_SETTINGS,
  ARM_RAISE_DIFFICULTY_SETTINGS, 
  RepDetail, 
  LandmarkPoint 
} from '../types/exercise';
import { calculateAngle, calculateArmElevationAngle, AngleSmoother } from '../utils/geometry';
import { initPoseLandmarker, drawPoseSkeleton } from '../utils/mediapipe';
import { soundManager } from '../utils/audio';

export interface UseExerciseDetectorProps {
  settings: ExerciseSettings;
  onRepCount?: (count: number, repDetail: RepDetail) => void;
  onTargetReached?: () => void;
}

export function useExerciseDetector({
  settings,
  onRepCount,
  onTargetReached,
}: UseExerciseDetectorProps) {
  // State
  const [isLoadingModel, setIsLoadingModel] = useState<boolean>(true);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [repCount, setRepCount] = useState<number>(0);
  const [currentStage, setCurrentStage] = useState<ExerciseStage>('UP');
  const [currentFeedback, setCurrentFeedback] = useState<ExerciseFeedback>('STAND_READY');
  
  // Real-time joint angles
  const [leftAngle, setLeftAngle] = useState<number | null>(null);
  const [rightAngle, setRightAngle] = useState<number | null>(null);
  const [activeAngle, setActiveAngle] = useState<number | null>(null);
  const [progressPercentage, setProgressPercentage] = useState<number>(0);

  const [repHistory, setRepHistory] = useState<RepDetail[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // References
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Angle smoothers
  const leftSmoother = useRef(new AngleSmoother(0.35));
  const rightSmoother = useRef(new AngleSmoother(0.35));

  // State machine tracking refs
  const stageRef = useRef<ExerciseStage>('UP');
  const repCountRef = useRef<number>(0);
  const extremeAngleInRepRef = useRef<number>(settings.exerciseType === 'squat' ? 180 : 0);
  const repStartTimeRef = useRef<number>(0);
  const targetReachedInRepRef = useRef<boolean>(false);
  const hasAnnouncedTargetRef = useRef<boolean>(false);

  // Sync ref with state
  repCountRef.current = repCount;

  // Initialize MediaPipe PoseLandmarker
  useEffect(() => {
    let mounted = true;

    async function loadModel() {
      try {
        setIsLoadingModel(true);
        const landmarker = await initPoseLandmarker();
        if (mounted) {
          poseLandmarkerRef.current = landmarker;
          setIsLoadingModel(false);
        }
      } catch (err) {
        console.error('Failed to load PoseLandmarker:', err);
        if (mounted) {
          setCameraError('AI姿勢検出モデルの読み込みに失敗しました。');
          setIsLoadingModel(false);
        }
      }
    }

    loadModel();

    return () => {
      mounted = false;
    };
  }, []);

  // Timer for session duration
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCameraActive && sessionStartTime) {
      timer = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - sessionStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isCameraActive, sessionStartTime]);

  // Handle camera start
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: settings.facingMode,
        },
        audio: false,
      });

      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
        if (!sessionStartTime) {
          setSessionStartTime(Date.now());
        }
      }
    } catch (err) {
      console.error('Error opening camera:', err);
      setCameraError('カメラの起動に失敗しました。カメラへのアクセスを許可してください。');
      setIsCameraActive(false);
    }
  }, [settings.facingMode, sessionStartTime]);

  // Handle camera stop
  const stopCamera = useCallback(() => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    leftSmoother.current.reset();
    rightSmoother.current.reset();
  }, []);

  // Reset current session counter
  const resetSession = useCallback(() => {
    setRepCount(0);
    repCountRef.current = 0;
    setRepHistory([]);
    setSessionStartTime(isCameraActive ? Date.now() : null);
    setElapsedSeconds(0);
    
    if (settings.exerciseType === 'squat') {
      stageRef.current = 'UP';
      setCurrentStage('UP');
      setCurrentFeedback('STAND_READY');
      extremeAngleInRepRef.current = 180;
    } else {
      stageRef.current = 'DOWN';
      setCurrentStage('DOWN');
      setCurrentFeedback('ARMS_DOWN_READY');
      extremeAngleInRepRef.current = 0;
    }

    targetReachedInRepRef.current = false;
    hasAnnouncedTargetRef.current = false;
  }, [isCameraActive, settings.exerciseType]);

  // Reset state whenever exerciseType changes
  useEffect(() => {
    resetSession();
  }, [settings.exerciseType, resetSession]);

  // Main Detection Loop
  useEffect(() => {
    if (!isCameraActive || !poseLandmarkerRef.current || !videoRef.current) {
      return;
    }

    let isRunning = true;
    const isArmRaise = settings.exerciseType === 'arm_raise';
    const diffConfig = isArmRaise 
      ? ARM_RAISE_DIFFICULTY_SETTINGS[settings.difficulty] 
      : SQUAT_DIFFICULTY_SETTINGS[settings.difficulty];

    const processFrame = () => {
      if (!isRunning) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const landmarker = poseLandmarkerRef.current;

      if (
        video &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        landmarker &&
        canvas
      ) {
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;

        if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
          canvas.width = videoWidth;
          canvas.height = videoHeight;
        }

        const ctx = canvas.getContext('2d');
        const nowInMs = performance.now();

        const result = landmarker.detectForVideo(video, nowInMs);

        if (result.landmarks && result.landmarks.length > 0) {
          const landmarks = result.landmarks[0] as LandmarkPoint[];

          let rawLeft: number | null = null;
          let rawRight: number | null = null;

          if (isArmRaise) {
            // Arm Raise Mode (Hip-Shoulder-Wrist / Elbow)
            const leftHip = landmarks[23];
            const rightHip = landmarks[24];
            const leftShoulder = landmarks[11];
            const rightShoulder = landmarks[12];
            const leftElbow = landmarks[13];
            const rightElbow = landmarks[14];
            const leftWrist = landmarks[15];
            const rightWrist = landmarks[16];

            if (leftHip && leftShoulder && (leftWrist || leftElbow)) {
              rawLeft = calculateArmElevationAngle(leftHip, leftShoulder, leftWrist, leftElbow);
            }
            if (rightHip && rightShoulder && (rightWrist || rightElbow)) {
              rawRight = calculateArmElevationAngle(rightHip, rightShoulder, rightWrist, rightElbow);
            }
          } else {
            // Squat Mode (Hip-Knee-Ankle)
            const leftHip = landmarks[23];
            const rightHip = landmarks[24];
            const leftKnee = landmarks[25];
            const rightKnee = landmarks[26];
            const leftAnkle = landmarks[27];
            const rightAnkle = landmarks[28];

            if (leftHip && leftKnee && leftAnkle &&
                (!leftHip.visibility || leftHip.visibility > 0.35) &&
                (!leftKnee.visibility || leftKnee.visibility > 0.35) &&
                (!leftAnkle.visibility || leftAnkle.visibility > 0.35)) {
              rawLeft = calculateAngle(leftHip, leftKnee, leftAnkle);
            }
            if (rightHip && rightKnee && rightAnkle &&
                (!rightHip.visibility || rightHip.visibility > 0.35) &&
                (!rightKnee.visibility || rightKnee.visibility > 0.35) &&
                (!rightAnkle.visibility || rightAnkle.visibility > 0.35)) {
              rawRight = calculateAngle(rightHip, rightKnee, rightAnkle);
            }
          }

          // Smooth angles
          const smoothedLeft = rawLeft !== null ? leftSmoother.current.update(rawLeft) : null;
          const smoothedRight = rawRight !== null ? rightSmoother.current.update(rawRight) : null;

          setLeftAngle(smoothedLeft);
          setRightAngle(smoothedRight);

          // Combined primary angle
          let currentAngle: number | null = null;
          if (isArmRaise) {
            // For arm raises, take average or minimum of both arms to ensure both are raised
            if (smoothedLeft !== null && smoothedRight !== null) {
              currentAngle = Math.round(((smoothedLeft + smoothedRight) / 2) * 10) / 10;
            } else {
              currentAngle = smoothedLeft ?? smoothedRight;
            }
          } else {
            // For squats, take the lower angle
            if (smoothedLeft !== null && smoothedRight !== null) {
              currentAngle = Math.min(smoothedLeft, smoothedRight);
            } else {
              currentAngle = smoothedLeft ?? smoothedRight;
            }
          }

          setActiveAngle(currentAngle);

          if (currentAngle !== null) {
            if (isArmRaise) {
              // ============================================
              // ARM RAISE STATE MACHINE
              // ============================================
              const span = diffConfig.targetAngle - diffConfig.baseAngle; // e.g. 150 - 45 = 105
              const progress = Math.max(0, Math.min(100, Math.round(((currentAngle - diffConfig.baseAngle) / span) * 100)));
              setProgressPercentage(progress);

              if (currentAngle > extremeAngleInRepRef.current) {
                extremeAngleInRepRef.current = currentAngle;
              }

              const stage = stageRef.current as string;

              // Asymmetry check
              const isAsymmetrical = (smoothedLeft !== null && smoothedRight !== null && Math.abs(smoothedLeft - smoothedRight) > 40);

              if (stage === 'DOWN' || stage === 'UP') {
                if (currentAngle > diffConfig.baseAngle + 15) {
                  stageRef.current = 'RAISING';
                  setCurrentStage('RAISING');
                  setCurrentFeedback(isAsymmetrical ? 'USE_BOTH_ARMS' : 'RAISING_ARMS');
                  repStartTimeRef.current = Date.now();
                  extremeAngleInRepRef.current = currentAngle;
                  targetReachedInRepRef.current = false;
                  hasAnnouncedTargetRef.current = false;
                } else {
                  setCurrentFeedback('ARMS_DOWN_READY');
                }
              } else if (stage === 'RAISING') {
                if (isAsymmetrical) {
                  setCurrentFeedback('USE_BOTH_ARMS');
                } else {
                  setCurrentFeedback('RAISING_ARMS');
                }

                if (currentAngle >= diffConfig.targetAngle) {
                  stageRef.current = 'PEAK';
                  setCurrentStage('PEAK');
                  setCurrentFeedback('PEAK_REACHED');
                  targetReachedInRepRef.current = true;

                  if (!hasAnnouncedTargetRef.current) {
                    hasAnnouncedTargetRef.current = true;
                    if (settings.soundEnabled) {
                      soundManager.playBottomHit();
                    }
                  }
                } else if (currentAngle <= diffConfig.baseAngle + 10) {
                  // Dropped arms without reaching peak
                  stageRef.current = 'DOWN';
                  setCurrentStage('DOWN');
                  setCurrentFeedback('TOO_LOW');
                  if (settings.soundEnabled) {
                    soundManager.playWarning();
                  }
                  if (settings.voiceEnabled) {
                    soundManager.speak('両手を高く上まで上げて！');
                  }
                }
              } else if (stage === 'PEAK') {
                if (currentAngle < diffConfig.targetAngle - 15) {
                  stageRef.current = 'LOWERING';
                  setCurrentStage('LOWERING');
                  setCurrentFeedback('LOWERING_ARMS');
                }
              } else if (stage === 'LOWERING') {
                if (currentAngle <= diffConfig.baseAngle + 5) {
                  // Completed arm raise rep!
                  const newCount = repCountRef.current + 1;
                  const duration = Math.max(0.5, (Date.now() - repStartTimeRef.current) / 1000);
                  const isPerfect = extremeAngleInRepRef.current >= diffConfig.targetAngle + 10;

                  const repDetail: RepDetail = {
                    repNumber: newCount,
                    exerciseType: 'arm_raise',
                    minAngleLeft: smoothedLeft ?? 0,
                    minAngleRight: smoothedRight ?? 0,
                    peakAngle: extremeAngleInRepRef.current,
                    durationSec: Math.round(duration * 10) / 10,
                    quality: isPerfect ? 'perfect' : 'good',
                    timestamp: Date.now(),
                  };

                  setRepCount(newCount);
                  setRepHistory((prev) => [repDetail, ...prev]);

                  stageRef.current = 'DOWN';
                  setCurrentStage('DOWN');
                  setCurrentFeedback(isPerfect ? 'PERFECT_REP' : 'GOOD_REP');

                  if (settings.soundEnabled) {
                    soundManager.playRepCount();
                  }
                  if (settings.voiceEnabled) {
                    soundManager.speak(`${newCount}`);
                  }

                  if (onRepCount) {
                    onRepCount(newCount, repDetail);
                  }

                  if (settings.targetReps > 0 && newCount >= settings.targetReps) {
                    if (settings.soundEnabled) {
                      setTimeout(() => soundManager.playWorkoutComplete(), 300);
                    }
                    if (settings.voiceEnabled) {
                      setTimeout(() => soundManager.speak('目標達成！お疲れ様でした！', true), 500);
                    }
                    if (onTargetReached) {
                      onTargetReached();
                    }
                  }

                  extremeAngleInRepRef.current = 0;
                  targetReachedInRepRef.current = false;
                  hasAnnouncedTargetRef.current = false;
                } else if (currentAngle > diffConfig.targetAngle) {
                  stageRef.current = 'PEAK';
                  setCurrentStage('PEAK');
                }
              }
            } else {
              // ============================================
              // SQUAT STATE MACHINE
              // ============================================
              const span = diffConfig.baseAngle - diffConfig.targetAngle; // 160 - 95 = 65
              const progress = Math.max(0, Math.min(100, Math.round(((diffConfig.baseAngle - currentAngle) / span) * 100)));
              setProgressPercentage(progress);

              if (currentAngle < extremeAngleInRepRef.current) {
                extremeAngleInRepRef.current = currentAngle;
              }

              const stage = stageRef.current as string;

              if (stage === 'UP' || stage === 'DOWN') {
                if (currentAngle < diffConfig.baseAngle - 15) {
                  stageRef.current = 'DESCENDING';
                  setCurrentStage('DESCENDING');
                  setCurrentFeedback('GOING_DOWN');
                  repStartTimeRef.current = Date.now();
                  extremeAngleInRepRef.current = currentAngle;
                  targetReachedInRepRef.current = false;
                  hasAnnouncedTargetRef.current = false;
                } else {
                  setCurrentFeedback('STAND_READY');
                }
              } else if (stage === 'DESCENDING') {
                if (currentAngle <= diffConfig.targetAngle) {
                  stageRef.current = 'BOTTOM';
                  setCurrentStage('BOTTOM');
                  setCurrentFeedback('DEEP_ENOUGH');
                  targetReachedInRepRef.current = true;

                  if (!hasAnnouncedTargetRef.current) {
                    hasAnnouncedTargetRef.current = true;
                    if (settings.soundEnabled) {
                      soundManager.playBottomHit();
                    }
                  }
                } else if (currentAngle > diffConfig.baseAngle - 5) {
                  stageRef.current = 'UP';
                  setCurrentStage('UP');
                  setCurrentFeedback('TOO_SHALLOW');
                  if (settings.soundEnabled) {
                    soundManager.playWarning();
                  }
                  if (settings.voiceEnabled) {
                    soundManager.speak('もっと深くしゃがんで！');
                  }
                }
              } else if (stage === 'BOTTOM') {
                if (currentAngle > diffConfig.targetAngle + 10) {
                  stageRef.current = 'ASCENDING';
                  setCurrentStage('ASCENDING');
                  setCurrentFeedback('PUSH_UP');
                }
              } else if (stage === 'ASCENDING') {
                if (currentAngle >= diffConfig.baseAngle) {
                  const newCount = repCountRef.current + 1;
                  const duration = Math.max(0.5, (Date.now() - repStartTimeRef.current) / 1000);
                  const isPerfect = extremeAngleInRepRef.current <= diffConfig.targetAngle - 5;

                  const repDetail: RepDetail = {
                    repNumber: newCount,
                    exerciseType: 'squat',
                    minAngleLeft: smoothedLeft ?? 0,
                    minAngleRight: smoothedRight ?? 0,
                    peakAngle: extremeAngleInRepRef.current,
                    durationSec: Math.round(duration * 10) / 10,
                    quality: isPerfect ? 'perfect' : 'good',
                    timestamp: Date.now(),
                  };

                  setRepCount(newCount);
                  setRepHistory((prev) => [repDetail, ...prev]);

                  stageRef.current = 'UP';
                  setCurrentStage('UP');
                  setCurrentFeedback(isPerfect ? 'PERFECT_REP' : 'GOOD_REP');

                  if (settings.soundEnabled) {
                    soundManager.playRepCount();
                  }
                  if (settings.voiceEnabled) {
                    soundManager.speak(`${newCount}`);
                  }

                  if (onRepCount) {
                    onRepCount(newCount, repDetail);
                  }

                  if (settings.targetReps > 0 && newCount >= settings.targetReps) {
                    if (settings.soundEnabled) {
                      setTimeout(() => soundManager.playWorkoutComplete(), 300);
                    }
                    if (settings.voiceEnabled) {
                      setTimeout(() => soundManager.speak('目標達成！お疲れ様でした！', true), 500);
                    }
                    if (onTargetReached) {
                      onTargetReached();
                    }
                  }

                  extremeAngleInRepRef.current = 180;
                  targetReachedInRepRef.current = false;
                  hasAnnouncedTargetRef.current = false;
                } else if (currentAngle < diffConfig.targetAngle) {
                  stageRef.current = 'BOTTOM';
                  setCurrentStage('BOTTOM');
                }
              }
            }
          }

          // Draw skeleton on canvas
          if (ctx && settings.skeletonEnabled) {
            drawPoseSkeleton(ctx, landmarks, videoWidth, videoHeight, {
              exerciseType: settings.exerciseType,
              leftAngle: smoothedLeft,
              rightAngle: smoothedRight,
              isPeakReached: targetReachedInRepRef.current,
              targetAngle: diffConfig.targetAngle,
            });
          } else if (ctx) {
            ctx.clearRect(0, 0, videoWidth, videoHeight);
          }
        } else {
          setCurrentFeedback('NO_PERSON');
          if (ctx) {
            ctx.clearRect(0, 0, videoWidth, videoHeight);
          }
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(processFrame);
    };

    animationFrameIdRef.current = requestAnimationFrame(processFrame);

    return () => {
      isRunning = false;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [
    isCameraActive,
    settings.exerciseType,
    settings.difficulty,
    settings.skeletonEnabled,
    settings.soundEnabled,
    settings.voiceEnabled,
    settings.targetReps,
    onRepCount,
    onTargetReached,
  ]);

  // Calorie estimation:
  // Squat MET: ~5.0
  // Arm raise MET: ~3.8
  const met = settings.exerciseType === 'squat' ? 5.0 : 3.8;
  const calPerRep = settings.exerciseType === 'squat' ? 0.35 : 0.25;
  const caloriesBurned = Math.round(
    (repCount * calPerRep + (elapsedSeconds / 60) * (met * 3.5 * settings.userWeightKg / 200)) * 10
  ) / 10;

  const paceRpm = elapsedSeconds > 5 ? Math.round((repCount / (elapsedSeconds / 60)) * 10) / 10 : 0;

  return {
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
  };
}

// Backward compatibility alias
export const useSquatDetector = useExerciseDetector;
