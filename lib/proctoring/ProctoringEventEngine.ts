/**
 * Proctoring Event Engine
 * Centralized temporal event evaluation, incident aggregation, and multi-signal correlation.
 * 
 * Strict 3-Warning Proctoring Rules:
 * 1. No single detection becomes a warning automatically.
 * 2. Normal human behavior (brief glance, looking down/away <5s, posture shift, glasses adjustment) NEVER consumes a warning.
 * 3. Simultaneous signals (e.g. hand + occlusion + dark frame) are aggregated into ONE incident.
 * 4. Continuous behavior (e.g. face missing for 20s) remains ONE incident and NEVER generates multiple warnings.
 * 5. Warnings are only triggered after sustained temporal thresholds (>=5s) and server validation.
 */

import {
  ProctoringEvent,
  ProctoringEventType,
  EventSeverity,
  ProctoringSignalLevel,
  ProctoringConfig,
  DEFAULT_PROCTORING_CONFIG,
  AggregatedIncident,
} from "./types";
import { FrameAnalysisResult } from "./ComputerVisionPipeline";

interface ActiveIncidentState {
  incidentId: string;
  primaryType: ProctoringEventType;
  eventTypes: Set<ProctoringEventType>;
  startTime: number;
  lastActiveTime: number;
  lastSentTime?: number;
  durationMs: number;
  confidence: number;
  reason: string;
  source: "camera" | "browser" | "system" | "screen";
  hasTriggered: boolean;
  metadata: Record<string, any>;
}

export class ProctoringEventEngine {
  private config: ProctoringConfig;
  private timeline: ProctoringEvent[] = [];
  
  // Active continuous incident tracking
  private activeIncident: ActiveIncidentState | null = null;
  private normalStateStartTime: number = Date.now();

  // Repeated discrete event counters (with timestamps)
  private tabSwitchTimestamps: number[] = [];
  private fullscreenExitTimestamps: number[] = [];
  private recentGazeDeviationTimestamps: number[] = [];
  private recentSignalsWindow: { type: ProctoringEventType; timestamp: number }[] = [];

  // Gaze sustained tracking
  private gazeStartTime: number | null = null;

  // Callbacks
  private onEventLoggedCallback?: (event: ProctoringEvent) => void;
  private onIncidentValidatedCallback?: (incident: AggregatedIncident) => void;
  private onIncidentResolvedCallback?: (incidentId: string) => void;
  private onSignalLevelChangeCallback?: (level: ProctoringSignalLevel) => void;

  private currentSignalLevel: ProctoringSignalLevel = "NORMAL";

  constructor(
    config: Partial<ProctoringConfig> = {},
    callbacks?: {
      onEvent?: (event: ProctoringEvent) => void;
      onIncidentValidated?: (incident: AggregatedIncident) => void;
      onIncidentResolved?: (incidentId: string) => void;
      onSignalChange?: (level: ProctoringSignalLevel) => void;
    }
  ) {
    this.config = { ...DEFAULT_PROCTORING_CONFIG, ...config };
    if (callbacks) {
      this.onEventLoggedCallback = callbacks.onEvent;
      this.onIncidentValidatedCallback = callbacks.onIncidentValidated;
      this.onIncidentResolvedCallback = callbacks.onIncidentResolved;
      this.onSignalLevelChangeCallback = callbacks.onSignalChange;
    }
  }

  /**
   * Process a single analyzed vision frame with temporal smoothing & aggregation
   */
  public processVisionFrame(result: FrameAnalysisResult, now: number = Date.now()) {
    // Detect anomaly condition
    let currentIncidentType: ProctoringEventType | null = null;
    const detectedSignals: ProctoringEventType[] = [];
    let reason = "";

    // 1. PRIMARY: Real-time Mobile Phone & Unauthorized Electronic Device Detection
    // Showing a phone directly to webcam takes highest priority and MUST NOT be masked by face framing or obstruction
    const phoneTrack = result.phoneTrack;
    const isPhoneDetected = Boolean(phoneTrack && phoneTrack.detected);
    const phoneConf = phoneTrack?.confidence || 0;
    const relatedSignals: string[] = [];

    if (isPhoneDetected && phoneConf >= (this.config.phoneConfidenceThreshold || 0.40)) {
      currentIncidentType = "mobile_phone_detected";
      detectedSignals.push("mobile_phone_detected");
      detectedSignals.push("POSSIBLE_EXTERNAL_DEVICE");
      relatedSignals.push("Mobile phone detected");

      const position = phoneTrack?.position || "PHONE_VISIBLE";
      if (position === "PHONE_IN_FRONT_OF_CAMERA") {
        detectedSignals.push("PHONE_IN_FRONT_OF_CAMERA" as any);
        relatedSignals.push("Phone directly in front of camera");
        reason = "Mobile phone detected directly in front of camera. Please remove unauthorized devices from your surroundings.";
      } else if (position === "PHONE_NEAR_FACE") {
        detectedSignals.push("PHONE_NEAR_FACE");
        relatedSignals.push("Phone near face");
        reason = "Mobile phone detected near face. Please remove unauthorized devices from your surroundings.";
      } else if (phoneTrack?.handNearPhone) {
        detectedSignals.push("HAND_NEAR_FACE");
        relatedSignals.push("Phone held in hand");
        reason = "Mobile phone detected held in hand. Please remove unauthorized devices from your surroundings.";
      } else {
        reason = "Mobile phone detected. Please remove unauthorized devices from your surroundings.";
      }

      if (phoneTrack?.handNearPhone && result.gazeDirection === "DOWN") {
        detectedSignals.push("STRONG_EXTERNAL_DEVICE_SIGNAL");
        relatedSignals.push("Phone interaction with downward gaze");
      }
    }
    // 2. Camera Obstruction (only when no phone is visible in front of lens)
    else if (result.isObstructed || result.handNearCamera || result.avgLuminance < 14) {
      currentIncidentType = "CAMERA_OBSTRUCTION";
      detectedSignals.push("CAMERA_OBSTRUCTION");
      if (result.avgLuminance < 14) detectedSignals.push("BLACK_FRAME");
      reason = "Camera appears to be obstructed, covered, or dark.";
    }
    // 3. Multiple Faces (Step 5)
    else if (result.personCount > 1) {
      currentIncidentType = "MULTIPLE_FACES";
      detectedSignals.push("MULTIPLE_FACES");
      reason = `Multiple people detected in camera frame (${result.personCount} individuals).`;
    }
    // 4. Face Missing or Candidate Moved Out of Frame (Steps 4 & 6)
    else if (
      result.facePresence === "FACE_MISSING" ||
      result.facePresence === "FACE_OUT_OF_FRAME" ||
      result.facePresence === "FACE_PARTIALLY_VISIBLE" ||
      result.facePresence === "FACE_TOO_FAR"
    ) {
      currentIncidentType = result.facePresence === "FACE_MISSING" ? "FACE_MISSING" : "FACE_OUT_OF_FRAME";
      detectedSignals.push(currentIncidentType);
      detectedSignals.push("FACE_OUT_OF_FRAME");
      reason =
        result.facePresence === "FACE_MISSING"
          ? "Candidate face not detected in camera frame. Please stay centered."
          : "Candidate moved out of center camera frame. Please stay centered and visible.";
    }
    // 5. Face Occluded (hand covering face for sustained period - Step 7)
    else if (result.faceOccluded && result.handNearFace) {
      currentIncidentType = "FACE_OCCLUDED";
      detectedSignals.push("FACE_OCCLUDED");
      detectedSignals.push("HAND_NEAR_FACE");
      reason = "Face is covered or obstructed by hand. Please keep your face clearly visible.";
    }
    else if (result.possibleExternalDevice && !isPhoneDetected) {
      // Gesture fallback (e.g. hand held to ear)
      currentIncidentType = "POSSIBLE_EXTERNAL_DEVICE";
      detectedSignals.push("POSSIBLE_EXTERNAL_DEVICE");
      relatedSignals.push("Handheld gesture near face");
      reason = "Potential handheld device detected near head.";
    }
    // 6. Gaze Deviation & Pattern Detection (Sections 6 & 7)
    else if (result.gazeDirection !== "CENTER" && result.gazeDirection !== "UNKNOWN") {
      if (!this.gazeStartTime) {
        this.gazeStartTime = now;
      }
      const gazeDuration = now - this.gazeStartTime;
      // Strict threshold: sustained off-screen gaze > 2.5s (Section 6)
      if (gazeDuration >= this.config.gazeDeviationThresholdMs) {
        // Gaze pattern detection: check if candidate has repeated off-screen looks in last 60s (Section 7)
        const sixtySecAgo = now - 60000;
        this.recentGazeDeviationTimestamps = this.recentGazeDeviationTimestamps.filter((t) => t > sixtySecAgo);

        if (this.recentGazeDeviationTimestamps.length >= 2) {
          currentIncidentType = "ESCALATE_GAZE_PATTERN";
          detectedSignals.push("ESCALATE_GAZE_PATTERN");
          detectedSignals.push("GAZE_DEVIATION");
          reason = "Repeated off-screen attention pattern detected (multiple sustained deviations during interview).";
        } else {
          currentIncidentType = "GAZE_DEVIATION";
          detectedSignals.push("GAZE_DEVIATION");
          if (result.gazeDirection === "LEFT" || result.gazeDirection === "RIGHT") {
            reason = `Looking away to the ${result.gazeDirection.toLowerCase()} side. Please maintain eye contact with the screen.`;
          } else if (result.gazeDirection === "DOWN") {
            reason = "Looking down away from screen. Please keep your focus on the interview.";
          } else {
            reason = "Off-screen attention detected. Please look directly at the interview.";
          }
        }
      }
    } else {
      // Normal gaze / brief glance (<1.0s) is strictly ignored per Section 20
      this.gazeStartTime = null;
    }

    // Multi-Signal Escalation (Section 12)
    if (currentIncidentType) {
      // Register into sliding window (6s)
      this.recentSignalsWindow = this.recentSignalsWindow.filter((s) => now - s.timestamp <= 6000);
      this.recentSignalsWindow.push({ type: currentIncidentType, timestamp: now });

      const hasRecentTab = this.recentSignalsWindow.some((s) => s.type === "TAB_SWITCH" || s.type === "WINDOW_BLUR");
      const hasRecentCameraObs = this.recentSignalsWindow.some((s) => s.type === "CAMERA_OBSTRUCTION" || s.type === "BLACK_FRAME");
      const hasRecentDevice = this.recentSignalsWindow.some((s) => s.type === "POSSIBLE_EXTERNAL_DEVICE" || s.type === "STRONG_EXTERNAL_DEVICE_SIGNAL");

      if (hasRecentTab && (currentIncidentType === "GAZE_DEVIATION" || currentIncidentType === "ESCALATE_GAZE_PATTERN")) {
        currentIncidentType = "MULTI_SIGNAL";
        detectedSignals.push("MULTI_SIGNAL");
        detectedSignals.push("TAB_SWITCH");
        reason = "Multiple proctoring signals: Gaze deviation combined with window/tab switch.";
      } else if (hasRecentCameraObs && (currentIncidentType === "FACE_MISSING" || currentIncidentType === "FACE_OUT_OF_FRAME")) {
        currentIncidentType = "MULTI_SIGNAL";
        detectedSignals.push("MULTI_SIGNAL");
        detectedSignals.push("CAMERA_OBSTRUCTION");
        reason = "Multiple proctoring signals: Face missing combined with camera obstruction.";
      } else if (hasRecentDevice && currentIncidentType === "MULTIPLE_FACES") {
        currentIncidentType = "MULTI_SIGNAL";
        detectedSignals.push("MULTI_SIGNAL");
        detectedSignals.push("POSSIBLE_EXTERNAL_DEVICE");
        reason = "Multiple proctoring signals: Multiple individuals present alongside external device.";
      }
    }

    // Evaluate active incident lifecycle
    if (currentIncidentType) {
      this.normalStateStartTime = 0; // Not normal

      if (!this.activeIncident) {
        // Start a brand new continuous incident candidate
        const incidentId = `inc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        this.activeIncident = {
          incidentId,
          primaryType: currentIncidentType,
          eventTypes: new Set(detectedSignals),
          startTime: now,
          lastActiveTime: now,
          durationMs: 0,
          confidence: phoneConf > 0.5 ? Math.max(phoneConf, 0.88) : 0.88,
          reason,
          source: "camera",
          hasTriggered: false,
          metadata: {
            personCount: result.personCount,
            luminance: result.avgLuminance,
            position: phoneTrack?.position || "NONE",
            boundingBox: phoneTrack?.boundingBox,
            objectClass: phoneTrack?.objectClass || "cell phone",
            status: "confirmed",
            review_status: "pending",
            signals: relatedSignals.length > 0 ? relatedSignals : Array.from(new Set(detectedSignals)),
            confidence: phoneConf || 0.88,
            detectionStartTime: phoneTrack?.detectionStartTime || new Date(now).toISOString(),
            confirmationTime: phoneTrack?.confirmationTime || new Date(now).toISOString(),
            engineEmitTime: new Date(now).toISOString(),
          },
        };
      } else {
        // Continuous incident in progress - aggregate any additional signals
        this.activeIncident.lastActiveTime = now;
        this.activeIncident.durationMs = now - this.activeIncident.startTime;
        detectedSignals.forEach((sig) => this.activeIncident?.eventTypes.add(sig));
        if (phoneConf > this.activeIncident.confidence) {
          this.activeIncident.confidence = phoneConf;
        }
        if (phoneTrack?.position) {
          this.activeIncident.metadata.position = phoneTrack.position;
        }
        if (relatedSignals.length > 0) {
          const prev = this.activeIncident.metadata.signals || [];
          this.activeIncident.metadata.signals = Array.from(new Set([...prev, ...relatedSignals]));
        }

        // Upgrade primaryType if a higher-severity signal occurs during same incident
        const curTypeStr = String(currentIncidentType);
        if (
          curTypeStr === "MULTI_SIGNAL" ||
          curTypeStr === "mobile_phone_detected" ||
          curTypeStr === "STRONG_EXTERNAL_DEVICE_SIGNAL" ||
          curTypeStr === "MULTIPLE_FACES" ||
          curTypeStr === "CAMERA_OBSTRUCTION"
        ) {
          this.activeIncident.primaryType = currentIncidentType;
          this.activeIncident.reason = reason;
        }

        // Determine appropriate temporal threshold
        const thresholdMs = this.getThresholdForType(this.activeIncident.primaryType);

        // Check if duration has passed threshold and warning has NOT yet triggered, or periodic reminder for sustained violation
        const isInitialTrigger = this.activeIncident.durationMs >= thresholdMs && !this.activeIncident.hasTriggered;
        const isSustainedFollowup =
          this.activeIncident.hasTriggered &&
          now - (this.activeIncident.lastSentTime || 0) >= 4500;

        if (isInitialTrigger || isSustainedFollowup) {
          this.activeIncident.hasTriggered = true;
          this.activeIncident.lastSentTime = now;

          if (this.activeIncident.primaryType === "GAZE_DEVIATION" || this.activeIncident.primaryType === "ESCALATE_GAZE_PATTERN") {
            this.recentGazeDeviationTimestamps.push(now);
          }

          // Log primary proctoring event to timeline
          const event: ProctoringEvent = {
            event_type: this.activeIncident.primaryType,
            timestamp: new Date(now).toISOString(),
            duration_ms: this.activeIncident.durationMs,
            confidence: this.activeIncident.confidence,
            severity: this.getSeverityForType(this.activeIncident.primaryType),
            source: "camera",
            metadata: {
              ...this.activeIncident.metadata,
              allSignals: Array.from(this.activeIncident.eventTypes),
              incidentId: this.activeIncident.incidentId,
              reason: this.activeIncident.reason,
            },
          };

          this.timeline.push(event);
          if (this.onEventLoggedCallback) {
            this.onEventLoggedCallback(event);
          }

          // Trigger aggregated incident for server-authoritative warning evaluation
          if (this.onIncidentValidatedCallback) {
            this.onIncidentValidatedCallback({
              incidentId: this.activeIncident.incidentId,
              primaryType: this.activeIncident.primaryType,
              eventTypes: Array.from(this.activeIncident.eventTypes),
              durationMs: this.activeIncident.durationMs,
              confidence: this.activeIncident.confidence,
              reason: this.activeIncident.reason,
              source: "camera",
              metadata: this.activeIncident.metadata,
            });
          }
        }
      }
    } else {
      // No active anomaly on this frame
      if (this.normalStateStartTime === 0) {
        this.normalStateStartTime = now;
      }

      // If user has returned to normal (1000ms for phone removal, 3000ms for posture/gaze), resolve continuous incident
      const resolveWaitTime =
        this.activeIncident &&
        (this.activeIncident.primaryType === "mobile_phone_detected" ||
          this.activeIncident.primaryType === "MOBILE_PHONE_DETECTED" ||
          this.activeIncident.primaryType === "POSSIBLE_EXTERNAL_DEVICE" ||
          this.activeIncident.primaryType === "PHONE_NEAR_FACE")
          ? 1000
          : 3000;

      if (this.activeIncident && now - this.normalStateStartTime >= resolveWaitTime) {
        const resolvedId = this.activeIncident.incidentId;
        this.activeIncident = null;
        if (this.onIncidentResolvedCallback) {
          this.onIncidentResolvedCallback(resolvedId);
        }
      }
    }

    this.recalculateSignalLevel();
  }

  /**
   * Log discrete system/browser events (e.g. Tab switch, Fullscreen exit)
   * Single occurrence = logged as INFO/LOW (no warning).
   * Repeated occurrences (>= threshold within 5m) = aggregated into warning incident.
   */
  public logDiscreteEvent(
    eventType: ProctoringEventType,
    durationMs: number = 0,
    metadata: Record<string, any> = {},
    source: "browser" | "system" | "camera" | "screen" = "browser"
  ) {
    const now = Date.now();
    const event: ProctoringEvent = {
      event_type: eventType,
      timestamp: new Date(now).toISOString(),
      duration_ms: durationMs,
      confidence: 1.0,
      severity: "LOW",
      source,
      metadata,
    };

    this.timeline.push(event);
    if (this.onEventLoggedCallback) {
      this.onEventLoggedCallback(event);
    }

    // Register into multi-signal sliding window (6s)
    this.recentSignalsWindow = this.recentSignalsWindow.filter((s) => now - s.timestamp <= 6000);
    this.recentSignalsWindow.push({ type: eventType, timestamp: now });

    // Clean up timestamps older than 5 minutes
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    this.tabSwitchTimestamps = this.tabSwitchTimestamps.filter((t) => t > fiveMinutesAgo);
    this.fullscreenExitTimestamps = this.fullscreenExitTimestamps.filter((t) => t > fiveMinutesAgo);

    if (eventType === "TAB_SWITCH" || eventType === "WINDOW_BLUR") {
      const lastTabSwitch = this.tabSwitchTimestamps[this.tabSwitchTimestamps.length - 1] || 0;
      if (now - lastTabSwitch > 5000) {
        this.tabSwitchTimestamps.push(now);
      }

      // In Strict Mode (tabSwitchThresholdCount: >= 2), requires repeated distinct focus losses
      if (this.tabSwitchTimestamps.length >= (this.config.tabSwitchThresholdCount || 2)) {
        const incidentId = `inc_tab_${now}`;
        if (this.onIncidentValidatedCallback) {
          this.onIncidentValidatedCallback({
            incidentId,
            primaryType: "TAB_SWITCH",
            eventTypes: ["TAB_SWITCH"],
            durationMs,
            confidence: 0.95,
            reason: "Browser tab switch or window loss of focus detected.",
            source: "browser",
            metadata: { count: this.tabSwitchTimestamps.length },
          });
        }
      }
    } else if (eventType === "FULLSCREEN_EXIT") {
      const lastFsExit = this.fullscreenExitTimestamps[this.fullscreenExitTimestamps.length - 1] || 0;
      if (now - lastFsExit > 5000) {
        this.fullscreenExitTimestamps.push(now);
      }

      // Requires repeated exits to escalate warning count
      if (this.fullscreenExitTimestamps.length >= (this.config.fullscreenExitThresholdCount || 2)) {
        const incidentId = `inc_fs_${now}`;
        if (this.onIncidentValidatedCallback) {
          this.onIncidentValidatedCallback({
            incidentId,
            primaryType: "FULLSCREEN_EXIT",
            eventTypes: ["FULLSCREEN_EXIT"],
            durationMs,
            confidence: 0.95,
            reason: "Fullscreen mode was exited during the active interview.",
            source: "browser",
            metadata: { count: this.fullscreenExitTimestamps.length },
          });
        }
      }
    } else if (
      eventType === "CAMERA_DISCONNECTED" ||
      eventType === "BLACK_FRAME" ||
      eventType === "NO_VIDEO_FRAME" ||
      eventType === "VIRTUAL_CAMERA_DETECTED"
    ) {
      const incidentId = `inc_cam_${now}`;
      if (this.onIncidentValidatedCallback) {
        this.onIncidentValidatedCallback({
          incidentId,
          primaryType: eventType,
          eventTypes: [eventType],
          durationMs: durationMs || 1500,
          confidence: 0.95,
          reason: metadata.description || "Camera connection was disabled, blocked, or switched to virtual feed.",
          source: "camera",
          metadata,
        });
      }
    } else if (eventType === "WHISPER_DETECTED" || eventType === "AUDIO_ANOMALY") {
      const incidentId = `inc_audio_${now}`;
      if (this.onIncidentValidatedCallback) {
        this.onIncidentValidatedCallback({
          incidentId,
          primaryType: eventType,
          eventTypes: [eventType],
          durationMs: durationMs || 1800,
          confidence: 0.90,
          reason: metadata.description || "Secondary background speech or whisper detected.",
          source: "system",
          metadata,
        });
      }
    } else if (eventType === "DUAL_MONITOR") {
      const incidentId = `inc_mon_${now}`;
      if (this.onIncidentValidatedCallback) {
        this.onIncidentValidatedCallback({
          incidentId,
          primaryType: "DUAL_MONITOR",
          eventTypes: ["DUAL_MONITOR"],
          durationMs: 0,
          confidence: 0.95,
          reason: metadata.description || "Secondary display or dual monitor detected.",
          source: "system",
          metadata,
        });
      }
    } else if (eventType === "BOT_TYPING_DETECTED") {
      const incidentId = `inc_bot_${now}`;
      if (this.onIncidentValidatedCallback) {
        this.onIncidentValidatedCallback({
          incidentId,
          primaryType: "BOT_TYPING_DETECTED",
          eventTypes: ["BOT_TYPING_DETECTED"],
          durationMs: 0,
          confidence: 0.95,
          reason: metadata.description || "Unnatural automated keystroke cadence detected.",
          source: "system",
          metadata,
        });
      }
    } else if (eventType === "SCREEN_SHARE_STOPPED") {
      const incidentId = `inc_screen_stop_${now}`;
      if (this.onIncidentValidatedCallback) {
        this.onIncidentValidatedCallback({
          incidentId,
          primaryType: "SCREEN_SHARE_STOPPED",
          eventTypes: ["SCREEN_SHARE_STOPPED"],
          durationMs: durationMs || 0,
          confidence: 1.0,
          reason: metadata.reason || "Screen sharing was stopped during the active interview. Screen sharing must remain continuously active.",
          source: "screen",
          metadata,
        });
      }
    } else if (eventType === "UNAUTHORIZED_TAB_DETECTED") {
      const incidentId = `inc_unauth_tab_${now}`;
      if (this.onIncidentValidatedCallback) {
        this.onIncidentValidatedCallback({
          incidentId,
          primaryType: "UNAUTHORIZED_TAB_DETECTED",
          eventTypes: ["UNAUTHORIZED_TAB_DETECTED"],
          durationMs: durationMs || 0,
          confidence: 0.95,
          reason: metadata.reason || "Unauthorized tab, AI cheating assistant, or communication app detected on your shared screen.",
          source: "screen",
          metadata,
        });
      }
    } else if (eventType === "SCREEN_NOTIFICATION_DETECTED") {
      const incidentId = `inc_screen_notif_${now}`;
      if (this.onIncidentValidatedCallback) {
        this.onIncidentValidatedCallback({
          incidentId,
          primaryType: "SCREEN_NOTIFICATION_DETECTED",
          eventTypes: ["SCREEN_NOTIFICATION_DETECTED"],
          durationMs: durationMs || 0,
          confidence: 0.90,
          reason: metadata.reason || "Pop-up notification or incoming message preview detected on screen. Please close external communication apps.",
          source: "screen",
          metadata,
        });
      }
    } else if (eventType === "SCREEN_RECORDING_DETECTED") {
      const incidentId = `inc_rec_${now}`;
      if (this.onIncidentValidatedCallback) {
        this.onIncidentValidatedCallback({
          incidentId,
          primaryType: "SCREEN_RECORDING_DETECTED",
          eventTypes: ["SCREEN_RECORDING_DETECTED"],
          durationMs: 0,
          confidence: 1.0,
          reason: metadata.reason || "Unauthorized screen recording software or screenshot capture attempt detected.",
          source: "screen",
          metadata: { ...metadata, isCritical: true },
        });
      }
    }

    this.recalculateSignalLevel();
  }

  private getThresholdForType(type: ProctoringEventType): number {
    switch (type) {
      case "CAMERA_OBSTRUCTION":
        return this.config.cameraObstructionThresholdMs || 2000;
      case "POSSIBLE_EXTERNAL_DEVICE":
      case "mobile_phone_detected":
      case "MOBILE_PHONE_DETECTED":
      case "STRONG_EXTERNAL_DEVICE_SIGNAL":
      case "PHONE_NEAR_FACE":
        return 500; // 0.5s confirmation threshold for responsive phone detection (filters transient glances <0.5s)
      case "FACE_MISSING":
      case "FACE_OUT_OF_FRAME":
        return this.config.faceMissingThresholdMs || 2000;
      case "MULTIPLE_FACES":
        return this.config.multipleFacesThresholdMs || 1500;
      case "FACE_OCCLUDED":
        return this.config.handOcclusionThresholdMs || 2000;
      case "GAZE_DEVIATION":
      case "ESCALATE_GAZE_PATTERN":
        return this.config.gazeDeviationThresholdMs || 2500;
      case "MULTI_SIGNAL":
        return 1500;
      case "WHISPER_DETECTED":
      case "AUDIO_ANOMALY":
        return 1500;
      case "SCREEN_RECORDING_DETECTED":
        return 0; // Immediate zero-latency trigger
      default:
        return 2000;
    }
  }

  private getSeverityForType(eventType: ProctoringEventType): EventSeverity {
    switch (eventType) {
      case "mobile_phone_detected":
      case "MOBILE_PHONE_DETECTED":
      case "CAMERA_OBSTRUCTION":
      case "MULTIPLE_FACES":
      case "POSSIBLE_EXTERNAL_DEVICE":
      case "STRONG_EXTERNAL_DEVICE_SIGNAL":
      case "PHONE_NEAR_FACE":
      case "DUAL_MONITOR":
      case "VIRTUAL_CAMERA_DETECTED":
      case "BOT_TYPING_DETECTED":
      case "CAMERA_DISCONNECTED":
      case "TAB_SWITCH":
      case "MULTI_SIGNAL":
      case "SCREEN_SHARE_STOPPED":
      case "UNAUTHORIZED_TAB_DETECTED":
      case "SCREEN_RECORDING_DETECTED":
        return "HIGH";
      case "FACE_MISSING":
      case "FULLSCREEN_EXIT":
      case "GAZE_DEVIATION":
      case "ESCALATE_GAZE_PATTERN":
      case "FACE_OCCLUDED":
      case "FACE_OUT_OF_FRAME":
      case "AUDIO_ANOMALY":
      case "WHISPER_DETECTED":
      case "CONNECTION_INTERRUPTED":
      case "SCREEN_NOTIFICATION_DETECTED":
        return "MEDIUM";
      case "HAND_NEAR_FACE":
      case "HAND_OVER_FACE":
      case "HAND_OVER_CAMERA":
        return "LOW";
      default:
        return "INFO";
    }
  }

  /**
   * Recalculate combined signal level for HUD / proctoring summary
   */
  private recalculateSignalLevel() {
    const highEvents = this.timeline.filter((e) => e.severity === "HIGH").length;
    const mediumEvents = this.timeline.filter((e) => e.severity === "MEDIUM").length;
    const totalEvents = this.timeline.length;

    let level: ProctoringSignalLevel = "NORMAL";
    if (highEvents >= 1 || mediumEvents >= 2 || totalEvents >= 5) {
      level = "REVIEW_RECOMMENDED";
    } else if (mediumEvents >= 1 || totalEvents >= 2) {
      level = "ATTENTION";
    }

    if (level !== this.currentSignalLevel) {
      this.currentSignalLevel = level;
      if (this.onSignalLevelChangeCallback) {
        this.onSignalLevelChangeCallback(level);
      }
    }
  }

  public getTimeline(): ProctoringEvent[] {
    return [...this.timeline];
  }

  public getSignalLevel(): ProctoringSignalLevel {
    return this.currentSignalLevel;
  }

  public reset() {
    this.timeline = [];
    this.activeIncident = null;
    this.normalStateStartTime = Date.now();
    this.tabSwitchTimestamps = [];
    this.fullscreenExitTimestamps = [];
    this.recentGazeDeviationTimestamps = [];
    this.recentSignalsWindow = [];
    this.gazeStartTime = null;
    this.currentSignalLevel = "NORMAL";
  }
}
