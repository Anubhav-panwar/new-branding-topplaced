/**
 * Computer Vision Pipeline (Production MediaPipe Tasks Vision)
 * 
 * Implements real camera-based computer vision for proctoring:
 * 1. Real Face Detection & Tracking (FaceLandmarker with 478 landmarks)
 * 2. Multi-Face Detection (True person count from neural inference)
 * 3. Face Position & Normalized Bounding Box (FACE_PRESENT, FACE_MISSING, FACE_OUT_OF_FRAME, FACE_TOO_FAR, FACE_TOO_CLOSE)
 * 4. Real Eye & Gaze Tracking (Iris landmarks 468, 473 + Head Pose yaw/pitch)
 * 5. Real Hand Detection & Landmarks (HandLandmarker with 21 3D points per hand)
 * 6. Face Occlusion & Hand Over Face Detection
 * 7. Camera Obstruction & Black Frame Verification
 * 8. Phone / Handheld Device Detection (Pose + gesture near ear/face)
 * 
 * Runs 100% locally in browser via WebAssembly / WebGL GPU delegate.
 * Zero raw frames uploaded to servers.
 */

import {
  FacePresenceState,
  GazeDirection,
  CameraQualityMetrics,
  PhoneDetectionTrack,
  PhonePosition,
} from "./types";

export interface FrameAnalysisResult {
  avgLuminance: number;
  frameDelta: number;
  facePresence: FacePresenceState;
  faceCenter: { x: number; y: number };
  faceDimensions: { width: number; height: number };
  personCount: number;
  gazeDirection: GazeDirection;
  gazeDeviationRatio: number;
  isObstructed: boolean;
  handPresent: boolean;
  handNearFace: boolean;
  faceOccluded: boolean;
  handNearCamera: boolean;
  possibleExternalDevice: boolean;
  phoneTrack?: PhoneDetectionTrack;
  quality: CameraQualityMetrics;
}

export class ComputerVisionPipeline {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private prevFrameData: Uint8ClampedArray | null = null;
  private width = 160;
  private height = 120;

  // MediaPipe Vision Tasks Instances
  private faceLandmarker: any = null;
  private handLandmarker: any = null;
  private objectDetector: any = null;
  private isModelLoading = false;
  private isModelReady = false;
  private isFaceReady = false;
  private isObjectReady = false;
  private lastInferenceTime = 0;
  private isDestroyed = false;

  // Temporal confirmation buffer for phone & electronic device detection
  private phoneDetectionBuffer: Array<{
    score: number;
    box?: { originX: number; originY: number; width: number; height: number };
    timestamp: number;
    category: string;
    position: PhonePosition;
    handNearPhone: boolean;
  }> = [];

  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext("2d", { willReadFrequently: true })!;
    this.prevFrameData = new Uint8ClampedArray(this.width * this.height * 4);

    if (typeof window !== "undefined") {
      this.initMediaPipe().catch((err) => {
        console.warn("[Proctoring CV] MediaPipe initialization error (using fallback):", err);
      });
    }
  }

  /**
   * Safe teardown releasing all WASM and WebGL memory contexts.
   */
  public destroy(): void {
    this.isDestroyed = true;
    try {
      if (this.faceLandmarker) {
        this.faceLandmarker.close();
        this.faceLandmarker = null;
      }
      if (this.handLandmarker) {
        this.handLandmarker.close();
        this.handLandmarker = null;
      }
      if (this.objectDetector) {
        this.objectDetector.close();
        this.objectDetector = null;
      }
    } catch (e) {
      console.warn("[Proctoring CV] Error closing MediaPipe models:", e);
    }
    this.prevFrameData = null;
    this.ctx = null;
    this.canvas = null;
    this.isModelReady = false;
    this.isModelLoading = false;
  }

  /**
   * Initializes MediaPipe Vision Tasks with GPU acceleration and fallback to CPU.
   * Serves models locally from /models/ (pre-bundled) with Google Storage CDN fallback.
   */
  public async init(): Promise<void> {
    return this.initMediaPipe();
  }

  public async initMediaPipe(): Promise<void> {
    if (this.isDestroyed || this.isModelReady || this.isModelLoading || typeof window === "undefined") {
      return;
    }

    this.isModelLoading = true;

    try {
      // Dynamic import to prevent SSR bundling issues in Next.js
      const { FilesetResolver, FaceLandmarker, HandLandmarker, ObjectDetector } = await import(
        "@mediapipe/tasks-vision"
      );

      // Resolve WASM from local public bundle or official fast CDN
      let vision: any = null;
      try {
        vision = await FilesetResolver.forVisionTasks("/models/wasm");
      } catch (localWasmErr) {
        console.info("[Proctoring CV] Using CDN WASM resolver:", localWasmErr);
        vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm"
        );
      }

      // Initialize FaceLandmarker (GPU first, CPU fallback)
      try {
        this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "/models/face_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numFaces: 4,
          minFaceDetectionConfidence: 0.45,
          minFacePresenceConfidence: 0.45,
          minTrackingConfidence: 0.45,
          outputFaceBlendshapes: false,
        });
      } catch (gpuFaceErr) {
        console.warn("[Proctoring CV] GPU delegate for FaceLandmarker failed, trying CPU / CDN:", gpuFaceErr);
        this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "CPU",
          },
          runningMode: "VIDEO",
          numFaces: 4,
          minFaceDetectionConfidence: 0.45,
          minFacePresenceConfidence: 0.45,
          minTrackingConfidence: 0.45,
          outputFaceBlendshapes: false,
        });
      }

      // Initialize HandLandmarker (GPU first, CPU fallback)
      try {
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "/models/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.45,
          minHandPresenceConfidence: 0.45,
          minTrackingConfidence: 0.45,
        });
      } catch (gpuHandErr) {
        console.warn("[Proctoring CV] GPU delegate for HandLandmarker failed, trying CPU / CDN:", gpuHandErr);
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "CPU",
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.45,
          minHandPresenceConfidence: 0.45,
          minTrackingConfidence: 0.45,
        });
      }

      // Initialize ObjectDetector for real-time smartphone & device detection (Section 22)
      const CDN_OBJECT_MODEL =
        "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite";

      try {
        this.objectDetector = await ObjectDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "/models/efficientdet_lite0.tflite",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          scoreThreshold: 0.30,
        });
      } catch (gpuObjErr) {
        console.warn("[Proctoring CV] GPU delegate for local ObjectDetector failed, trying CPU fallback:", gpuObjErr);
        try {
          this.objectDetector = await ObjectDetector.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: "/models/efficientdet_lite0.tflite",
              delegate: "CPU",
            },
            runningMode: "VIDEO",
            scoreThreshold: 0.30,
          });
        } catch (cpuObjErr) {
          console.warn("[Proctoring CV] Local ObjectDetector failed, trying CDN fallback:", cpuObjErr);
          try {
            this.objectDetector = await ObjectDetector.createFromOptions(vision, {
              baseOptions: {
                modelAssetPath: CDN_OBJECT_MODEL,
                delegate: "GPU",
              },
              runningMode: "VIDEO",
              scoreThreshold: 0.30,
            });
          } catch (cdnGpuErr) {
            try {
              this.objectDetector = await ObjectDetector.createFromOptions(vision, {
                baseOptions: {
                  modelAssetPath: CDN_OBJECT_MODEL,
                  delegate: "CPU",
                },
                runningMode: "VIDEO",
                scoreThreshold: 0.30,
              });
            } catch (cdnCpuErr) {
              console.error("[Proctoring CV] All ObjectDetector initialization attempts failed:", cdnCpuErr);
            }
          }
        }
      }

      this.isFaceReady = Boolean(this.faceLandmarker);
      this.isObjectReady = Boolean(this.objectDetector);
      this.isModelReady = Boolean(this.faceLandmarker || this.objectDetector);
      console.log(
        `🚀 [Proctoring CV] MediaPipe Vision Pipeline initialized! Face: ${this.isFaceReady}, Object: ${this.isObjectReady}, Hand: ${Boolean(this.handLandmarker)}`
      );
    } catch (err) {
      console.warn("⚠️ [Proctoring CV] MediaPipe could not load, running hybrid vision fallback:", err);
      this.isModelReady = false;
    } finally {
      this.isModelLoading = false;
    }
  }

  /**
   * Primary frame evaluation method running on the live webcam element.
   */
  public analyzeFrame(video: HTMLVideoElement): FrameAnalysisResult | null {
    if (!video || video.readyState < 2 || video.paused || !this.ctx) {
      return null;
    }

    try {
      // 1. Offscreen canvas analysis for luminance, motion delta, and obstruction
      this.ctx.drawImage(video, 0, 0, this.width, this.height);
      const frame = this.ctx.getImageData(0, 0, this.width, this.height);
      const data = frame.data;
      const totalPixels = this.width * this.height;

      let totalLum = 0;
      let totalDelta = 0;
      const prev = this.prevFrameData;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        totalLum += lum;

        if (prev) {
          const diff = Math.abs(r - prev[i]) + Math.abs(g - prev[i + 1]) + Math.abs(b - prev[i + 2]);
          if (diff > 40) {
            totalDelta++;
          }
        }
      }

      if (this.prevFrameData) {
        this.prevFrameData.set(data);
      }
      const avgLuminance = totalLum / totalPixels;

      // 2. Real Neural Vision Inference via MediaPipe
      const now = performance.now();
      // Ensure strictly increasing timestamp for MediaPipe VIDEO mode
      const timestamp = now > this.lastInferenceTime ? now : this.lastInferenceTime + 1;
      this.lastInferenceTime = timestamp;

      if (this.isModelReady && this.faceLandmarker) {
        return this.analyzeWithMediaPipe(video, timestamp, avgLuminance, totalDelta);
      }

      // If MediaPipe is still initializing, use fallback canvas analysis
      return this.analyzeFallbackCanvas(data, totalPixels, avgLuminance, totalDelta);
    } catch (err) {
      console.warn("[Proctoring CV] Frame inference error:", err);
      return null;
    }
  }

  /**
   * MediaPipe Neural Analysis: FaceLandmarker (478 pts) + HandLandmarker (21 pts x 2)
   */
  private analyzeWithMediaPipe(
    video: HTMLVideoElement,
    timestamp: number,
    avgLuminance: number,
    totalDelta: number
  ): FrameAnalysisResult {
    let faceResult: any = null;
    let handResult: any = null;

    try {
      faceResult = this.faceLandmarker.detectForVideo(video, timestamp);
    } catch (e) {
      console.debug("[Proctoring CV] Face detect call note:", e);
    }

    if (this.handLandmarker) {
      try {
        handResult = this.handLandmarker.detectForVideo(video, timestamp);
      } catch (e) {
        console.debug("[Proctoring CV] Hand detect call note:", e);
      }
    }

    let objectResult: any = null;
    if (this.objectDetector) {
      try {
        objectResult = this.objectDetector.detectForVideo(video, timestamp);
      } catch (e) {
        console.debug("[Proctoring CV] Object detect call note:", e);
      }
    }

    // 1. Face Count & Multi-Person Detection (Step 5)
    const detectedFaces = faceResult?.faceLandmarks || [];
    const personCount = detectedFaces.length;

    // Default Face Metrics
    let facePresence: FacePresenceState = "FACE_MISSING";
    let faceCenterX = 0.5;
    let faceCenterY = 0.5;
    let faceWidth = 0;
    let faceHeight = 0;
    let faceMinX = 0;
    let faceMaxX = 0;
    let faceMinY = 0;
    let faceMaxY = 0;

    // Gaze Metrics
    let gazeDirection: GazeDirection = "CENTER";
    let gazeDeviationRatio = 0.0;

    // 2. Face Position & Normalized Bounding Box (Steps 4 & 6)
    if (personCount > 0) {
      const landmarks = detectedFaces[0]; // Candidate primary face

      let minX = 1;
      let maxX = 0;
      let minY = 1;
      let maxY = 0;

      for (let i = 0; i < landmarks.length; i++) {
        const pt = landmarks[i];
        if (pt.x < minX) minX = pt.x;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.y > maxY) maxY = pt.y;
      }

      faceMinX = minX;
      faceMaxX = maxX;
      faceMinY = minY;
      faceMaxY = maxY;
      faceWidth = maxX - minX;
      faceHeight = maxY - minY;
      faceCenterX = (minX + maxX) / 2;
      faceCenterY = (minY + maxY) / 2;

      // Classify Face Position & Distance
      if (faceWidth < 0.10 || faceHeight < 0.10) {
        facePresence = "FACE_TOO_FAR";
      } else if (faceWidth > 0.88) {
        facePresence = "FACE_TOO_CLOSE";
      } else if (faceCenterX < 0.15 || faceCenterX > 0.85 || faceCenterY < 0.12 || faceCenterY > 0.88) {
        facePresence = "FACE_OUT_OF_FRAME";
      } else {
        facePresence = "FACE_PRESENT";
      }

      // 3. Eye Landmarks & Iris Gaze Tracking (Steps 9 & 10)
      if (landmarks.length >= 478) {
        // Left Eye: Outer 33, Inner 133, Iris Center 468
        const leftOuter = landmarks[33];
        const leftInner = landmarks[133];
        const leftIris = landmarks[468];

        // Right Eye: Inner 362, Outer 263, Iris Center 473
        const rightInner = landmarks[362];
        const rightOuter = landmarks[263];
        const rightIris = landmarks[473];

        // Head Pose Landmarks: Nose 1, Left Cheek 234, Right Cheek 454, Forehead 10, Chin 152
        const nose = landmarks[1];
        const leftCheek = landmarks[234];
        const rightCheek = landmarks[454];
        const forehead = landmarks[10];
        const chin = landmarks[152];

        // Horizontal Iris Offset within eye socket (0.0 to 1.0, centered ~0.50)
        const leftEyeSpan = Math.max(0.001, leftInner.x - leftOuter.x);
        const rightEyeSpan = Math.max(0.001, rightOuter.x - rightInner.x);
        const leftRatio = (leftIris.x - leftOuter.x) / leftEyeSpan;
        const rightRatio = (rightIris.x - rightInner.x) / rightEyeSpan;
        const avgIrisRatio = (leftRatio + rightRatio) / 2;

        // Head Yaw (horizontal rotation): Nose position relative to cheek span (centered ~0.50)
        const cheekSpan = Math.max(0.001, rightCheek.x - leftCheek.x);
        const headYawRatio = (nose.x - leftCheek.x) / cheekSpan;

        // Head Pitch (vertical rotation): Nose position relative to face height (centered ~0.55 - 0.65)
        const faceVerticalSpan = Math.max(0.001, chin.y - forehead.y);
        const headPitchRatio = (nose.y - forehead.y) / faceVerticalSpan;

        // Composite Horizontal Gaze: Combines Iris offset (40%) + Head Pose Yaw (60%)
        const irisBias = avgIrisRatio - 0.50; // -0.5 (looking left) to +0.5 (looking right)
        const headBias = headYawRatio - 0.50;
        const compositeYaw = headBias * 0.65 + irisBias * 0.35;

        // Smooth Gaze Classification
        if (compositeYaw < -0.14) {
          gazeDirection = "LEFT";
          gazeDeviationRatio = Math.min(1.0, Math.abs(compositeYaw) * 3.5);
        } else if (compositeYaw > 0.14) {
          gazeDirection = "RIGHT";
          gazeDeviationRatio = Math.min(1.0, Math.abs(compositeYaw) * 3.5);
        } else if (headPitchRatio > 0.72) {
          gazeDirection = "DOWN";
          gazeDeviationRatio = Math.min(1.0, (headPitchRatio - 0.72) * 4.0);
        } else if (headPitchRatio < 0.44) {
          gazeDirection = "UP";
          gazeDeviationRatio = Math.min(1.0, (0.44 - headPitchRatio) * 4.0);
        } else {
          gazeDirection = "CENTER";
          gazeDeviationRatio = 0.0;
        }
      }
    } else {
      facePresence = "FACE_MISSING";
    }

    // 4. Real Hand Detection & Landmark Analysis (Steps 7 & 8)
    const detectedHands = handResult?.landmarks || [];
    const handPresent = detectedHands.length > 0;
    let handNearFace = false;
    let faceOccluded = false;
    let handNearCamera = false;
    let possibleExternalDevice = false;

    if (handPresent) {
      for (let h = 0; h < detectedHands.length; h++) {
        const handPoints = detectedHands[h];

        // Hand bounding box
        let hMinX = 1;
        let hMaxX = 0;
        let hMinY = 1;
        let hMaxY = 0;

        let pointsInsideFaceBox = 0;

        for (let p = 0; p < handPoints.length; p++) {
          const pt = handPoints[p];
          if (pt.x < hMinX) hMinX = pt.x;
          if (pt.x > hMaxX) hMaxX = pt.x;
          if (pt.y < hMinY) hMinY = pt.y;
          if (pt.y > hMaxY) hMaxY = pt.y;

          // Check if hand landmark overlaps candidate face
          if (
            personCount > 0 &&
            pt.x >= faceMinX &&
            pt.x <= faceMaxX &&
            pt.y >= faceMinY &&
            pt.y <= faceMaxY
          ) {
            pointsInsideFaceBox++;
          }
        }

        const hWidth = hMaxX - hMinX;
        const hHeight = hMaxY - hMinY;

        // If >= 4 of the 21 hand landmarks fall inside the face box -> True Face Occlusion
        if (pointsInsideFaceBox >= 4) {
          handNearFace = true;
          faceOccluded = true;
        } else if (pointsInsideFaceBox >= 1) {
          handNearFace = true;
        }

        // Hand proximity to ear / side of head with bent arm gesture -> Phone detection
        if (personCount > 0) {
          const wrist = handPoints[0]; // Landmark 0 is wrist
          const indexFinger = handPoints[8];
          const distToLeftEar = Math.hypot(wrist.x - faceMinX, wrist.y - (faceMinY + faceHeight * 0.4));
          const distToRightEar = Math.hypot(wrist.x - faceMaxX, wrist.y - (faceMinY + faceHeight * 0.4));

          if ((distToLeftEar < 0.12 || distToRightEar < 0.12) && indexFinger.y < wrist.y) {
            possibleExternalDevice = true;
          }
        }

        // Hand covering the camera lens (hand bounding box covers >= 60% of viewport)
        if (hWidth > 0.60 && hHeight > 0.60) {
          handNearCamera = true;
        }
      }
    }

    // 5. Real Smartphone & Handheld Device Object Detection (Section 22)
    let bestRawPhoneDetection: {
      score: number;
      categoryName: string;
      position: PhonePosition;
      boundingBox?: { originX: number; originY: number; width: number; height: number };
      handNearPhone: boolean;
    } | null = null;

    if (objectResult && objectResult.detections) {
      const vWidth = video.videoWidth || 640;
      const vHeight = video.videoHeight || 480;

      for (const det of objectResult.detections) {
        for (const cat of det.categories) {
          const name = (cat.categoryName || "").toLowerCase();
          const score = cat.score || 0;

          // Check if detected object is a cell phone, mobile phone, telephone, or handheld device
          const isPhoneClass =
            name.includes("cell phone") ||
            name.includes("mobile phone") ||
            name.includes("phone") ||
            name.includes("telephone") ||
            name === "cellphone";
          const isSecondaryDeviceClass = name.includes("remote") || name.includes("laptop");

          if ((isPhoneClass || isSecondaryDeviceClass) && score >= 0.35) {
            const box = det.boundingBox;
            const normX = box ? Math.max(0, box.originX / vWidth) : 0.5;
            const normY = box ? Math.max(0, box.originY / vHeight) : 0.5;
            const normW = box ? Math.min(1, box.width / vWidth) : 0.2;
            const normH = box ? Math.min(1, box.height / vHeight) : 0.2;
            const phoneCenterX = normX + normW / 2;
            const phoneCenterY = normY + normH / 2;

            let position: PhonePosition = "PHONE_VISIBLE";
            let handNearPhone = false;

            // Analyze phone position relative to hands
            if (handPresent) {
              for (let h = 0; h < detectedHands.length; h++) {
                const handPoints = detectedHands[h];
                for (let p = 0; p < handPoints.length; p++) {
                  const pt = handPoints[p];
                  if (
                    pt.x >= normX - 0.10 &&
                    pt.x <= normX + normW + 0.10 &&
                    pt.y >= normY - 0.10 &&
                    pt.y <= normY + normH + 0.10
                  ) {
                    handNearPhone = true;
                    break;
                  }
                }
                if (handNearPhone) break;
              }
            }

            // Analyze phone position relative to face & camera
            const distToFace = Math.hypot(phoneCenterX - faceCenterX, phoneCenterY - faceCenterY);
            if (
              (normW >= 0.16 || normH >= 0.16) &&
              phoneCenterX >= 0.20 &&
              phoneCenterX <= 0.80 &&
              phoneCenterY >= 0.15 &&
              phoneCenterY <= 0.85
            ) {
              // Phone shown directly in front of camera
              position = "PHONE_IN_FRONT_OF_CAMERA";
            } else if (distToFace < 0.28 || (normY < faceCenterY + 0.15 && Math.abs(phoneCenterX - faceCenterX) < 0.35)) {
              position = "PHONE_NEAR_FACE";
            } else if (handNearPhone) {
              position = "PHONE_IN_HAND";
            } else if (normY > 0.55) {
              position = "PHONE_ON_DESK";
            }

            if (!bestRawPhoneDetection || score > bestRawPhoneDetection.score) {
              bestRawPhoneDetection = {
                score,
                categoryName: cat.categoryName || "cell phone",
                position,
                boundingBox: box
                  ? { originX: normX, originY: normY, width: normW, height: normH }
                  : undefined,
                handNearPhone,
              };
            }
          }
        }
      }
    }

    // Temporal confirmation buffer (filter transient noise / confirm real phones)
    const nowTime = Date.now();
    // Prune buffer older than 2500ms
    this.phoneDetectionBuffer = this.phoneDetectionBuffer.filter((d) => nowTime - d.timestamp <= 2500);

    if (bestRawPhoneDetection) {
      this.phoneDetectionBuffer.push({
        score: bestRawPhoneDetection.score,
        box: bestRawPhoneDetection.boundingBox,
        timestamp: nowTime,
        category: bestRawPhoneDetection.categoryName,
        position: bestRawPhoneDetection.position,
        handNearPhone: bestRawPhoneDetection.handNearPhone,
      });
    }

    // Determine confirmation:
    // 1. Clear phone detection (score >= 0.55) confirms immediately on 1st frame
    // 2. Phone held in front of camera, in hand, or near face with score >= 0.40 confirms on 1st frame
    // 3. Medium confidence (score >= 0.35) confirmed across >= 2 sampled frames in last 2s
    const recentDetections = this.phoneDetectionBuffer;
    const hasHighConf = recentDetections.some((d) => d.score >= 0.55);
    const hasFrontOrHand = recentDetections.some(
      (d) =>
        (d.position === "PHONE_IN_FRONT_OF_CAMERA" ||
          d.position === "PHONE_IN_HAND" ||
          d.position === "PHONE_NEAR_FACE") &&
        d.score >= 0.40
    );
    const hasMultipleFrames = recentDetections.length >= 2;

    const isConfirmedPhone = hasHighConf || hasFrontOrHand || hasMultipleFrames;

    let phoneTrack: PhoneDetectionTrack = {
      detected: false,
      objectClass: "none",
      confidence: 0,
      position: "NONE",
      handNearPhone: false,
      timestamp: nowTime,
    };

    if (isConfirmedPhone && recentDetections.length > 0) {
      const best = recentDetections.reduce((prev, cur) => (cur.score > prev.score ? cur : prev), recentDetections[0]);
      const avgScore = recentDetections.reduce((sum, d) => sum + d.score, 0) / recentDetections.length;
      // Boosted confirmed score reflects multi-frame temporal certainty
      const finalConfidence = Math.min(0.98, Math.max(best.score, avgScore * 1.1));
      const firstDetectionTime = recentDetections[0]?.timestamp || nowTime;

      phoneTrack = {
        detected: true,
        objectClass: best.category || "cell phone",
        confidence: Number(finalConfidence.toFixed(2)),
        position: best.position,
        boundingBox: best.box,
        handNearPhone: best.handNearPhone,
        timestamp: nowTime,
        detectionStartTime: new Date(firstDetectionTime).toISOString(),
        confirmationTime: new Date(nowTime).toISOString(),
      };
      possibleExternalDevice = true;
    }

    // 6. Camera Obstruction (Step 8)
    // If a phone is confirmed in front of camera, it is an external device, NOT a camera failure
    let isObstructed = false;
    if (!phoneTrack.detected) {
      if (avgLuminance < 14 || (handNearCamera && avgLuminance < 45) || (handNearCamera && personCount === 0)) {
        isObstructed = true;
      }
    }

    // 7. Quality Metrics
    const quality = this.computeQuality(
      avgLuminance,
      facePresence,
      faceCenterX,
      faceCenterY,
      isObstructed,
      personCount
    );

    return {
      avgLuminance,
      frameDelta: totalDelta,
      facePresence,
      faceCenter: { x: faceCenterX, y: faceCenterY },
      faceDimensions: { width: faceWidth, height: faceHeight },
      personCount,
      gazeDirection,
      gazeDeviationRatio,
      isObstructed,
      handPresent,
      handNearFace,
      faceOccluded,
      handNearCamera,
      possibleExternalDevice,
      phoneTrack,
      quality,
    };
  }

  /**
   * Resilient fallback while MediaPipe initializes in background (or on low-spec hardware).
   */
  private analyzeFallbackCanvas(
    data: Uint8ClampedArray,
    totalPixels: number,
    avgLuminance: number,
    totalDelta: number
  ): FrameAnalysisResult {
    let skinPixels = 0;
    let weightedXSum = 0;
    let weightedYSum = 0;
    let minX = this.width;
    let maxX = 0;
    let minY = this.height;
    let maxY = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const px = (i / 4) % this.width;
      const py = Math.floor((i / 4) / this.width);

      const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
      const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
      if (cb >= 77 && cb <= 127 && cr >= 133 && cr <= 173) {
        skinPixels++;
        weightedXSum += px / this.width;
        weightedYSum += py / this.height;
        if (px < minX) minX = px;
        if (px > maxX) maxX = px;
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;
      }
    }

    const skinRatio = skinPixels / totalPixels;
    let facePresence: FacePresenceState = "FACE_PRESENT";
    let personCount = 1;

    if (skinRatio < 0.025 || skinPixels < 40) {
      facePresence = "FACE_MISSING";
      personCount = 0;
    }

    const cx = skinPixels > 0 ? weightedXSum / skinPixels : 0.5;
    const cy = skinPixels > 0 ? weightedYSum / skinPixels : 0.5;
    const w = skinPixels > 0 ? (maxX - minX) / this.width : 0;
    const h = skinPixels > 0 ? (maxY - minY) / this.height : 0;
    const isObstructed = avgLuminance < 14;

    const quality = this.computeQuality(avgLuminance, facePresence, cx, cy, isObstructed, personCount);

    return {
      avgLuminance,
      frameDelta: totalDelta,
      facePresence,
      faceCenter: { x: cx, y: cy },
      faceDimensions: { width: w, height: h },
      personCount,
      gazeDirection: "CENTER",
      gazeDeviationRatio: 0.0,
      isObstructed,
      handPresent: false,
      handNearFace: false,
      faceOccluded: false,
      handNearCamera: false,
      possibleExternalDevice: false,
      phoneTrack: {
        detected: false,
        objectClass: "none",
        confidence: 0,
        position: "NONE",
        handNearPhone: false,
        timestamp: Date.now(),
      },
      quality,
    };
  }

  private computeQuality(
    lum: number,
    presence: FacePresenceState,
    cx: number,
    cy: number,
    isObstructed: boolean,
    personCount: number
  ): CameraQualityMetrics {
    let score = 100;
    const recommendations: string[] = [];

    // Lighting check (optimal 30 - 190)
    const brightness = Math.round((lum / 255) * 100);
    if (lum < 30) {
      score -= 30;
      recommendations.push("Increase room lighting or face a light source.");
    } else if (lum > 225) {
      score -= 20;
      recommendations.push("Reduce bright backlighting or glare.");
    }

    // Face Visibility
    let faceVisibility = 100;
    if (presence === "FACE_MISSING") {
      score -= 50;
      faceVisibility = 0;
      recommendations.push("Ensure your face is clearly visible inside the camera frame.");
    } else if (presence === "FACE_TOO_FAR") {
      score -= 15;
      faceVisibility = 50;
      recommendations.push("Move slightly closer to the camera.");
    } else if (presence === "FACE_TOO_CLOSE") {
      score -= 15;
      faceVisibility = 50;
      recommendations.push("Move slightly back from the camera.");
    }

    // Centering
    const faceCentered = Math.abs(cx - 0.5) < 0.20 && Math.abs(cy - 0.5) < 0.20;
    if (!faceCentered && presence === "FACE_PRESENT") {
      score -= 15;
      recommendations.push("Position yourself in the center of the camera frame.");
    }

    // Obstruction
    if (isObstructed) {
      score -= 50;
      recommendations.push("Remove any objects or hands blocking the camera lens.");
    }

    // Person Count
    const onePersonVisible = personCount === 1;
    if (personCount > 1) {
      score -= 20;
      recommendations.push("Ensure only you are in the camera view.");
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      brightness,
      sharpness: 92,
      faceVisibility,
      faceCentered,
      onePersonVisible,
      isObstructed,
      recommendations: recommendations.length > 0 ? recommendations : ["Camera setup looks optimal."],
    };
  }

  public getModelStatus(): {
    isReady: boolean;
    isFaceReady: boolean;
    isObjectReady: boolean;
    isLoading: boolean;
  } {
    return {
      isReady: this.isModelReady,
      isFaceReady: this.isFaceReady,
      isObjectReady: this.isObjectReady,
      isLoading: this.isModelLoading,
    };
  }
}

// Shared persistent instance across modal and interview session to prevent duplicate WebGL/WASM loading
let sharedPipelineInstance: ComputerVisionPipeline | null = null;

export function getSharedVisionPipeline(): ComputerVisionPipeline {
  if (!sharedPipelineInstance) {
    sharedPipelineInstance = new ComputerVisionPipeline();
  }
  return sharedPipelineInstance;
}
