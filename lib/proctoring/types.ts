/**
 * AI Camera Proctoring & Interview Security Engine - Type Definitions
 * Phase 4: Modular, Privacy-Conscious, Non-Accusatory Integrity Architecture
 */

export type ProctoringEventType =
  | "FACE_MISSING"
  | "FACE_OUT_OF_FRAME"
  | "MULTIPLE_FACES"
  | "FACE_OCCLUDED"
  | "HAND_NEAR_FACE"
  | "HAND_OVER_FACE"
  | "HAND_OVER_CAMERA"
  | "CAMERA_OBSTRUCTION"
  | "POSSIBLE_EXTERNAL_DEVICE"
  | "STRONG_EXTERNAL_DEVICE_SIGNAL"
  | "PHONE_NEAR_FACE"
  | "MOBILE_PHONE_DETECTED"
  | "mobile_phone_detected"
  | "GAZE_DEVIATION"
  | "ESCALATE_GAZE_PATTERN"
  | "MULTI_SIGNAL"
  | "TAB_SWITCH"
  | "WINDOW_BLUR"
  | "FULLSCREEN_EXIT"
  | "CAMERA_DISCONNECTED"
  | "BLACK_FRAME"
  | "DUAL_MONITOR"
  | "AUDIO_ANOMALY"
  | "WHISPER_DETECTED"
  | "VIRTUAL_CAMERA_DETECTED"
  | "BOT_TYPING_DETECTED"
  | "NO_VIDEO_FRAME"
  | "CONNECTION_INTERRUPTED"
  | "SCREEN_SHARE_STOPPED"
  | "UNAUTHORIZED_TAB_DETECTED"
  | "SCREEN_NOTIFICATION_DETECTED"
  | "SCREEN_RECORDING_DETECTED";

export type PhonePosition =
  | "PHONE_NEAR_FACE"
  | "PHONE_IN_FRONT_OF_CAMERA"
  | "MOBILE_PHONE_DETECTED"
  | "mobile_phone_detected"
  | "PHONE_IN_HAND"
  | "PHONE_ON_DESK"
  | "PHONE_VISIBLE"
  | "NONE";

export interface PhoneDetectionTrack {
  detected: boolean;
  objectClass: string;
  confidence: number;
  position: PhonePosition;
  boundingBox?: { originX: number; originY: number; width: number; height: number };
  handNearPhone: boolean;
  timestamp: number;
  detectionStartTime?: string;
  confirmationTime?: string;
}

export type EventSeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH";

export type ProctoringSignalLevel = "NORMAL" | "ATTENTION" | "REVIEW_RECOMMENDED";

export type CameraHealthState =
  | "CAMERA_OK"
  | "CAMERA_PERMISSION_DENIED"
  | "CAMERA_DISCONNECTED"
  | "NO_VIDEO_FRAME"
  | "BLACK_FRAME"
  | "POSSIBLE_OBSTRUCTION"
  | "VIRTUAL_CAMERA_DETECTED";

export type FacePresenceState =
  | "FACE_PRESENT"
  | "FACE_MISSING"
  | "FACE_OUT_OF_FRAME"
  | "FACE_PARTIALLY_VISIBLE"
  | "FACE_TOO_FAR"
  | "FACE_TOO_CLOSE";

export type GazeDirection = "CENTER" | "LEFT" | "RIGHT" | "UP" | "DOWN" | "UNKNOWN";

export interface ProctoringEvent {
  event_type: ProctoringEventType;
  timestamp: string;
  duration_ms: number;
  confidence: number;
  severity: EventSeverity;
  source: "camera" | "browser" | "system" | "screen" ;
  metadata: Record<string, any>;
  snapshot?: string;
  replayFrames?: string[]; // 3-second animated incident frame sequence
}



export interface LiveProctoringMetrics {
  cameraHealth: CameraHealthState;
  facePresence: FacePresenceState;
  personCount: number;
  gazeDirection: GazeDirection;
  isObstructed: boolean;
  handNearFace: boolean;
  deviceDetected: boolean;
  cameraQualityScore: number;
  signalLevel: ProctoringSignalLevel;
  totalEventsCount: number;
}

export interface CameraQualityMetrics {
  score: number; // 0 - 100
  brightness: number; // 0 - 100
  sharpness: number; // 0 - 100
  faceVisibility: number; // 0 - 100
  faceCentered: boolean;
  onePersonVisible: boolean;
  isObstructed?: boolean;
  recommendations: string[];
}

export type ProctoringStatus =
  | "NORMAL"
  | "WARNING_1"
  | "WARNING_2"
  | "FINAL_WARNING"
  | "PROCTORING_REVIEW_REQUIRED";

export type WarningPolicyAction = "FLAG_ONLY" | "TERMINATE_INTERVIEW";

export interface WarningHistoryEntry {
  warningNumber: number; // 1, 2, or 3
  timestamp: string;
  incidentId: string;
  eventTypes: ProctoringEventType[];
  duration: number; // in seconds
  confidence: number;
  reason: string;
  actionTaken: "WARNING_ISSUED" | "FLAGGED_FOR_REVIEW" | "TERMINATED";
}

export interface ActiveWarningModalData {
  warningNumber: number; // 1, 2, 3
  title: string;
  message?: string;
  primaryMessage: string;
  secondaryMessage: string;
  reason: string;
  timestamp: string;
  isFinal: boolean;
  policyAction: WarningPolicyAction;
  incidentId?: string;
}

export interface AggregatedIncident {
  incidentId: string;
  primaryType: ProctoringEventType;
  eventTypes: ProctoringEventType[];
  durationMs: number;
  confidence: number;
  reason: string;
  source: "camera" | "browser" | "system" | "screen";
  metadata?: Record<string, any>;
}

export interface WarningState {
  warningCount: number; // 0, 1, 2, 3 (capped at 3)
  maxWarnings: number; // 3
  proctoringStatus: ProctoringStatus;
  lastWarningAt: string | null;
  warningCooldownUntil: string | null;
  activeIncidentId: string | null;
  warningHistory: WarningHistoryEntry[];
  finalWarningAction: WarningPolicyAction;
  isCooldownActive: boolean;
  activeWarningModal: ActiveWarningModalData | null;
}

export interface ProctoringConfig {
  proctoringMode: "STRICT" | "STANDARD";
  sampleFps: number; // default 5 fps
  faceMissingThresholdMs: number; // 2000ms (Strict: 2s)
  faceOutOfFrameThresholdMs: number; // 2000ms (Strict: 2s)
  multipleFacesThresholdMs: number; // 1500ms (Strict: 1.5s)
  cameraObstructionThresholdMs: number; // 2000ms (Strict: 2s)
  handOcclusionThresholdMs: number; // 2000ms (Strict: 2s)
  gazeDeviationThresholdMs: number; // 2500ms (Strict: 2.5s)
  phoneDetectionThresholdMs: number; // 2000ms (Strict: 2s)
  phoneConfidenceThreshold: number; // 0.60
  strongPhoneConfidenceThreshold: number; // 0.80
  warningCooldownSeconds: number; // 30 seconds
  warningCooldownMs: number; // 30000ms
  tabSwitchThresholdCount: number; // 1 (Strict: immediate validated event)
  fullscreenExitThresholdCount: number; // 1 (Strict: immediate validated event)
  finalWarningAction: WarningPolicyAction; // default "FLAG_ONLY"
  enableFullscreenLock: boolean; // default true
  enableTabSwitchLock: boolean; // default true
}

export const DEFAULT_PROCTORING_CONFIG: ProctoringConfig = {
  proctoringMode: "STRICT",
  sampleFps: 5,
  faceMissingThresholdMs: 2000,
  faceOutOfFrameThresholdMs: 2000,
  multipleFacesThresholdMs: 1500,
  cameraObstructionThresholdMs: 2000,
  handOcclusionThresholdMs: 2000,
  gazeDeviationThresholdMs: 2500,
  phoneDetectionThresholdMs: 2000,
  phoneConfidenceThreshold: 0.60,
  strongPhoneConfidenceThreshold: 0.80,
  warningCooldownSeconds: 30,
  warningCooldownMs: 30000,
  tabSwitchThresholdCount: 2,
  fullscreenExitThresholdCount: 2,
  finalWarningAction: "TERMINATE_INTERVIEW",
  enableFullscreenLock: true,
  enableTabSwitchLock: true,
};
