/**
 * useProctoring React Hook
 * Integrates Camera Health, Vision Pipeline, Event Engine, and Browser Security controls.
 * 
 * Strict 3-Warning Proctoring Integration:
 * - Authoritative Server State: Restored from MongoDB session state on mount/refresh (prevents tampering).
 * - Multi-Signal Aggregation: Groups concurrent vision/browser signals into single validated incidents.
 * - Cooldown & De-duplication: Prevents double-counting and ignores continuous anomalies.
 * - Exact warning modal management with respectful, non-accusatory language.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  LiveProctoringMetrics,
  ProctoringEvent,
  ProctoringSignalLevel,
  CameraQualityMetrics,
  ProctoringConfig,
  DEFAULT_PROCTORING_CONFIG,
  WarningState,
  ActiveWarningModalData,
  AggregatedIncident,
  ProctoringEventType,
} from "./types";
import { CameraHealthMonitor } from "./CameraHealthMonitor";
import { getSharedVisionPipeline, ComputerVisionPipeline } from "./ComputerVisionPipeline";
import { ProctoringEventEngine } from "./ProctoringEventEngine";
import { isDocumentFullscreen, enterFullscreen } from "./fullscreenHelper";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface UseProctoringOptions {
  sessionId?: string;
  token?: string | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  mediaStream: MediaStream | null;
  isActive: boolean;
  config?: Partial<ProctoringConfig>;
  onTerminateRequired?: () => void;
  isAISpeaking?: boolean;
  isCandidateAnswering?: boolean;
  isCodingActive?: boolean;
}

export function useProctoring({
  sessionId,
  token,
  videoRef,
  mediaStream,
  isActive,
  config = {},
  onTerminateRequired,
  isAISpeaking = false,
  isCandidateAnswering = false,
  isCodingActive = false,
}: UseProctoringOptions) {
  const mergedConfig = useMemo(() => {
    return { ...DEFAULT_PROCTORING_CONFIG, ...config };
  }, [
    config?.sampleFps,
    config?.warningCooldownSeconds,
    config?.faceMissingThresholdMs,
    config?.multipleFacesThresholdMs,
    config?.cameraObstructionThresholdMs,
    config?.handOcclusionThresholdMs,
    config?.gazeDeviationThresholdMs,
    config?.finalWarningAction,
  ]);

  const [metrics, setMetrics] = useState<LiveProctoringMetrics>({
    cameraHealth: "CAMERA_OK",
    facePresence: "FACE_PRESENT",
    personCount: 1,
    gazeDirection: "CENTER",
    isObstructed: false,
    handNearFace: false,
    deviceDetected: false,
    cameraQualityScore: 95,
    signalLevel: "NORMAL",
    totalEventsCount: 0,
  });

  const [activeWarning, setActiveWarning] = useState<string | null>(null);
  const [cameraQuality, setCameraQuality] = useState<CameraQualityMetrics | null>(null);
  const [eventsTimeline, setEventsTimeline] = useState<ProctoringEvent[]>([]);
  const [isWindowLockedOut, setIsWindowLockedOut] = useState(false);

  // Authoritative 3-Warning State
  const [warningState, setWarningState] = useState<WarningState>({
    warningCount: 0,
    maxWarnings: 3,
    proctoringStatus: "NORMAL",
    lastWarningAt: null,
    warningCooldownUntil: null,
    activeIncidentId: null,
    warningHistory: [],
    finalWarningAction: mergedConfig.finalWarningAction || "TERMINATE_INTERVIEW",
    isCooldownActive: false,
    activeWarningModal: null,
  });

  // Network connection resilience & freeze
  const [isConnectionSuspended, setIsConnectionSuspended] = useState(false);
  const [reconnectCountdown, setReconnectCountdown] = useState(45);

  // Core internal engines
  const healthMonitorRef = useRef<CameraHealthMonitor | null>(null);
  const visionPipelineRef = useRef<ComputerVisionPipeline | null>(null);
  const eventEngineRef = useRef<ProctoringEventEngine | null>(null);

  // 3-Second Incident Replay Ring Buffer (holds rolling snapshots for video playback)
  const recentFramesRingBufferRef = useRef<string[]>([]);
  const lastSnapshotTimeRef = useRef<number>(0);
  const snapshotCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Keystroke Dynamics refs (Bot & Extension auto-typer detection)
  const recentKeyIntervalsRef = useRef<number[]>([]);
  const lastKeyTimeRef = useRef<number>(0);
  const lastBotWarningRef = useRef<number>(0);

  // Debouncing refs
  const lastBlurTimestampRef = useRef<number>(0);
  const warningTimeoutRef = useRef<any>(null);
  const blurDebounceTimeoutRef = useRef<any>(null);
  const interviewStartTimeRef = useRef<number>(0);

  // Reset counters and register start time when proctoring becomes active
  useEffect(() => {
    if (isActive) {
      interviewStartTimeRef.current = Date.now();
      eventEngineRef.current?.reset();
    }
  }, [isActive]);

  // Live refs to avoid stale closures in requestAnimationFrame loops
  const isAISpeakingRef = useRef(isAISpeaking);
  useEffect(() => {
    isAISpeakingRef.current = isAISpeaking;
  }, [isAISpeaking]);

  const isCandidateAnsweringRef = useRef(isCandidateAnswering);
  useEffect(() => {
    isCandidateAnsweringRef.current = isCandidateAnswering;
  }, [isCandidateAnswering]);

  // Reusable snapshot capture helper (allocates zero DOM nodes per call)
  const captureSnapshot = useCallback((): string => {
    try {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return "";
      if (!snapshotCanvasRef.current) {
        snapshotCanvasRef.current = document.createElement("canvas");
        snapshotCanvasRef.current.width = 160;
        snapshotCanvasRef.current.height = 120;
      }
      const snapCanvas = snapshotCanvasRef.current;
      const sCtx = snapCanvas.getContext("2d", { willReadFrequently: true });
      if (!sCtx) return "";
      sCtx.drawImage(video, 0, 0, 160, 120);
      return snapCanvas.toDataURL("image/jpeg", 0.4);
    } catch {
      return "";
    }
  }, [videoRef]);

  // Restore Authoritative Warning State on Mount or Session Change (Anti-Tampering)
  useEffect(() => {
    if (!sessionId) return;

    let isMounted = true;
    async function restoreServerState() {
      try {
        const res = await fetch(`${API_URL}/proctoring/session/${sessionId}/state`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data && data.state) {
            setWarningState((prev) => ({
              ...prev,
              warningCount: data.state.warningCount ?? 0,
              maxWarnings: data.state.maxWarnings ?? 3,
              proctoringStatus: data.state.proctoringStatus ?? "NORMAL",
              lastWarningAt: data.state.lastWarningAt ?? null,
              warningCooldownUntil: data.state.warningCooldownUntil ?? null,
              activeIncidentId: data.state.activeIncidentId ?? null,
              warningHistory: data.state.warningHistory ?? [],
              finalWarningAction: data.state.finalWarningAction ?? prev.finalWarningAction,
              isCooldownActive: data.state.isCooldownActive ?? false,
              activeWarningModal: data.state.activeWarningModal ?? null,
            }));
          }
        }
      } catch (err) {
        console.warn("[Proctoring] Could not fetch authoritative session state:", err);
      }
    }

    restoreServerState();
    return () => {
      isMounted = false;
    };
  }, [sessionId, token]);

  // Transmit event to backend (fire & forget, non-blocking)
  const syncEventToBackend = useCallback(
    (event: ProctoringEvent) => {
      if (!sessionId) return;

      const snapshot =
        event.severity === "HIGH" ||
        event.event_type === "mobile_phone_detected" ||
        event.event_type === "MOBILE_PHONE_DETECTED" ||
        event.event_type === "POSSIBLE_EXTERNAL_DEVICE" ||
        event.event_type === "MULTIPLE_FACES" ||
        event.event_type === "CAMERA_OBSTRUCTION"
          ? captureSnapshot()
          : undefined;

      fetch(`${API_URL}/proctoring/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          sessionId,
          interview_id: sessionId,
          eventType: event.event_type,
          event_type: event.event_type,
          message: event.metadata?.reason || event.metadata?.message || `Proctoring event: ${event.event_type}`,
          severity: event.severity.toLowerCase(),
          confidence: event.confidence,
          status: "confirmed",
          review_status: "pending",
          details: { ...event.metadata, ...(snapshot ? { snapshot } : {}) },
          timestamp: event.timestamp,
        }),
      }).catch(() => {
        // Fallback endpoint if needed
        fetch(`${API_URL}/api/interviews/proctoring/log`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            interview_id: sessionId,
            eventType: event.event_type,
            event_type: event.event_type,
            severity: event.severity.toLowerCase(),
            confidence: event.confidence,
            status: "confirmed",
            review_status: "pending",
            details: event.metadata,
          }),
        }).catch(() => {});
      });
    },
    [sessionId, token, captureSnapshot]
  );

  // Submit Aggregated Incident to Server for 3-Warning Validation
  const submitIncidentToServer = useCallback(
    async (incident: AggregatedIncident) => {
      const activeSession = sessionId || "active_interview_session";
      const frontendWarningTime = new Date().toISOString();

      const isPhoneIncident =
        incident.primaryType === "mobile_phone_detected" ||
        incident.primaryType === "MOBILE_PHONE_DETECTED" ||
        incident.primaryType === "POSSIBLE_EXTERNAL_DEVICE" ||
        incident.primaryType === "STRONG_EXTERNAL_DEVICE_SIGNAL" ||
        incident.primaryType === "PHONE_NEAR_FACE";

      // 1. OPTIMISTIC IMMEDIATE LOCAL WARNING:
      // Instantly trigger UI feedback for the candidate without waiting for network round-trip
      setWarningState((prev) => {
        if (prev.activeWarningModal && prev.activeWarningModal.incidentId === incident.incidentId) {
          return prev;
        }
        const newCount = Math.min(prev.maxWarnings, prev.warningCount + 1);
        const isFinal = newCount >= prev.maxWarnings;

        const primaryMsg = isPhoneIncident
          ? "Mobile phone detected. Please remove unauthorized devices from your surroundings."
          : isFinal
          ? "Final Warning: Maximum proctoring infractions reached. The interview session is terminating."
          : `Proctoring Infraction: ${incident.primaryType.replace(/_/g, " ")}.`;

        const modalData: ActiveWarningModalData = {
          warningNumber: newCount,
          title: isPhoneIncident
            ? "Mobile Phone Detected"
            : isFinal
            ? "Proctoring Terminated: Maximum Warnings Exceeded"
            : `Warning ${newCount} of ${prev.maxWarnings}`,
          primaryMessage: primaryMsg,
          secondaryMessage: isPhoneIncident
            ? "Please ensure your interview area is clear of mobile phones or handheld devices."
            : isFinal
            ? "Maximum proctoring infractions recorded. Your session is ending and being flagged for review."
            : "Please remain centered in frame, keep your webcam active, and maintain exam integrity.",
          reason: incident.reason || "Mobile phone detected in camera frame.",
          timestamp: frontendWarningTime,
          isFinal,
          policyAction: isFinal ? "TERMINATE_INTERVIEW" : "FLAG_ONLY",
          incidentId: incident.incidentId,
        };

        setActiveWarning(isPhoneIncident ? primaryMsg : `${modalData.title}: ${modalData.primaryMessage}`);

        if (isFinal) {
          setTimeout(() => {
            if (onTerminateRequiredRef.current) {
              onTerminateRequiredRef.current();
            }
          }, 1500);
        }

        return {
          ...prev,
          warningCount: newCount,
          proctoringStatus: isFinal ? "PROCTORING_REVIEW_REQUIRED" : (`WARNING_${newCount}` as any),
          activeWarningModal: modalData,
        };
      });

      // 2. DISPATCH TO BACKEND ASYNCHRONOUSLY WITH FULL FORENSIC TIMESTAMPS
      try {
        const payloadMetadata = {
          ...(incident.metadata || {}),
          frontendWarningTime,
          detectionStartTime: incident.metadata?.detectionStartTime,
          confirmationTime: incident.metadata?.confirmationTime,
          isCodingActive,
        };

        const res = await fetch(`${API_URL}/proctoring/incident`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            sessionId: activeSession,
            incidentId: incident.incidentId,
            eventTypes: incident.eventTypes,
            durationMs: incident.durationMs,
            confidence: incident.confidence,
            reason: incident.reason,
            source: incident.source,
            metadata: payloadMetadata,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.warningState) {
            const modal = data.warningModalData || data.modalData;
            setWarningState((prev) => ({
              ...prev,
              warningCount: data.warningState.warningCount ?? data.warningCount,
              maxWarnings: data.warningState.maxWarnings ?? 3,
              proctoringStatus: data.warningState.proctoringStatus ?? data.proctoringStatus,
              lastWarningAt: data.warningState.lastWarningAt,
              warningCooldownUntil: data.warningState.warningCooldownUntil,
              activeIncidentId: data.warningState.activeIncidentId,
              warningHistory: data.warningState.warningHistory ?? prev.warningHistory,
              isCooldownActive: data.warningState.isCooldownActive,
              activeWarningModal: modal || prev.activeWarningModal,
            }));

            // Check if policy requires termination
            if (
              data.warningState.proctoringStatus === "PROCTORING_REVIEW_REQUIRED" ||
              (data.warningState.warningCount ?? 0) >= (data.warningState.maxWarnings ?? 3) ||
              data.warningState.finalWarningAction === "TERMINATE_INTERVIEW"
            ) {
              if (onTerminateRequiredRef.current) {
                onTerminateRequiredRef.current();
              }
            }
          }
        }
      } catch (err) {
        console.warn("[Proctoring] Server incident submission failed; optimistic warning modal remains active:", err);
      }
    },
    [sessionId, token, isCodingActive, onTerminateRequired]
  );

  // Notify backend when continuous incident is resolved
  const resolveIncidentOnServer = useCallback(
    (incidentId: string) => {
      // Clear active phone warning banner when phone is removed from camera
      setActiveWarning((current) => {
        if (current && (current.toLowerCase().includes("phone") || current.toLowerCase().includes("device"))) {
          return null;
        }
        return current;
      });

      if (!sessionId) return;
      fetch(`${API_URL}/proctoring/incident/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ sessionId, incidentId }),
      }).catch(() => {});
    },
    [sessionId, token]
  );

  // Acknowledge Active Warning Modal
  const acknowledgeWarning = useCallback(async () => {
    const currentWarningNum = warningState.warningCount;
    setWarningState((prev) => ({ ...prev, activeWarningModal: null }));
    setActiveWarning(null);

    if (sessionId) {
      try {
        await fetch(`${API_URL}/proctoring/acknowledge`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            sessionId,
            warningNumber: currentWarningNum,
          }),
        });
      } catch (err) {
        console.warn("[Proctoring] Failed to acknowledge warning:", err);
      }
    }
  }, [sessionId, token, warningState.warningCount]);

  // Dynamic callback refs to prevent re-instantiating engines on every render
  const onTerminateRequiredRef = useRef(onTerminateRequired);
  useEffect(() => {
    onTerminateRequiredRef.current = onTerminateRequired;
  }, [onTerminateRequired]);

  const syncEventToBackendRef = useRef(syncEventToBackend);
  useEffect(() => {
    syncEventToBackendRef.current = syncEventToBackend;
  }, [syncEventToBackend]);

  const submitIncidentToServerRef = useRef(submitIncidentToServer);
  useEffect(() => {
    submitIncidentToServerRef.current = submitIncidentToServer;
  }, [submitIncidentToServer]);

  const resolveIncidentOnServerRef = useRef(resolveIncidentOnServer);
  useEffect(() => {
    resolveIncidentOnServerRef.current = resolveIncidentOnServer;
  }, [resolveIncidentOnServer]);

  // Initialize engines once with shared pipeline singleton
  useEffect(() => {
    if (!healthMonitorRef.current) {
      healthMonitorRef.current = new CameraHealthMonitor((healthState) => {
        setMetrics((prev) => ({ ...prev, cameraHealth: healthState }));
        if (healthState !== "CAMERA_OK") {
          if (healthState === "VIRTUAL_CAMERA_DETECTED") {
            setActiveWarning("Virtual camera detected (OBS/ManyCam/DroidCam). Please switch to a physical hardware webcam.");
            eventEngineRef.current?.logDiscreteEvent(
              "VIRTUAL_CAMERA_DETECTED",
              0,
              { state: healthState, description: "Virtual camera software feed detected. Real physical webcam required." },
              "camera"
            );
          } else if (healthState === "CAMERA_DISCONNECTED" || healthState === "NO_VIDEO_FRAME") {
            setActiveWarning("Camera connection lost. Please reconnect your camera.");
            eventEngineRef.current?.logDiscreteEvent(
              "CAMERA_DISCONNECTED",
              0,
              { state: healthState, description: "Camera connection lost. Please reconnect your camera." },
              "camera"
            );
          } else {
            eventEngineRef.current?.logDiscreteEvent(
              healthState === "BLACK_FRAME" ? "BLACK_FRAME" : "CAMERA_DISCONNECTED",
              0,
              { state: healthState },
              "camera"
            );
          }
        }
      });
    }

    visionPipelineRef.current = getSharedVisionPipeline();

    if (!eventEngineRef.current) {
      eventEngineRef.current = new ProctoringEventEngine(mergedConfig, {
        onEvent: (event) => {
          if (
            event.severity === "HIGH" ||
            event.event_type === "POSSIBLE_EXTERNAL_DEVICE" ||
            event.event_type === "MULTIPLE_FACES" ||
            event.event_type === "CAMERA_OBSTRUCTION" ||
            event.event_type === "VIRTUAL_CAMERA_DETECTED"
          ) {
            event.replayFrames = [...recentFramesRingBufferRef.current];
          }
          // Cap timeline to last 50 events in memory to prevent browser heap explosion
          setEventsTimeline((prev) => {
            const next = [...prev, event];
            return next.length > 50 ? next.slice(next.length - 50) : next;
          });
          setMetrics((prev) => ({ ...prev, totalEventsCount: prev.totalEventsCount + 1 }));
          syncEventToBackendRef.current(event);
        },
        onIncidentValidated: (incident) => {
          submitIncidentToServerRef.current(incident);
        },
        onIncidentResolved: (incidentId) => {
          resolveIncidentOnServerRef.current(incidentId);
        },
        onSignalChange: (signalLevel) => {
          setMetrics((prev) => ({ ...prev, signalLevel }));
        },
      });
    }

    return () => {
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    };
  }, [mergedConfig]);

  // Main visual sampling loop (runs at sampleFps, default 5 FPS = 200ms)
  useEffect(() => {
    if (!isActive || !mediaStream) return;

    let isProcessing = false;
    const intervalMs = Math.round(1000 / (mergedConfig.sampleFps || 5));
    const interval = setInterval(() => {
      if (isProcessing) return; // Prevent concurrent frame piling

      const video = videoRef.current;
      const pipeline = visionPipelineRef.current;
      const engine = eventEngineRef.current;
      const health = healthMonitorRef.current;

      if (!video || !pipeline || !engine || !health) return;
      if (video.readyState < 2 || video.paused || video.ended) return;

      isProcessing = true;
      try {
        const result = pipeline.analyzeFrame(video);
        if (result) {
          health.checkHealth(video, mediaStream, result.avgLuminance, result.frameDelta);
          engine.processVisionFrame(result);

          // Only capture snapshot when an anomaly or incident occurs (max once per 3s)
          const hasAnomaly =
            result.personCount > 1 ||
            result.facePresence !== "FACE_PRESENT" ||
            result.isObstructed ||
            result.possibleExternalDevice ||
            result.faceOccluded;

          if (hasAnomaly) {
            const now = Date.now();
            if (now - lastSnapshotTimeRef.current > 3000) {
              lastSnapshotTimeRef.current = now;
              const snap = captureSnapshot();
              if (snap) {
                recentFramesRingBufferRef.current = [snap];
              }
            }
          }

          // Strict Camera Recovery (Section 11)
          if (
            result.facePresence === "FACE_PRESENT" &&
            result.personCount === 1 &&
            !result.isObstructed &&
            health.getHealthyState() === "CAMERA_OK"
          ) {
            setActiveWarning((prev) =>
              prev === "Camera connection lost. Please reconnect your camera." ? null : prev
            );
          }

          setCameraQuality(result.quality);
          setMetrics((prev) => ({
            ...prev,
            facePresence: result.facePresence,
            personCount: result.personCount,
            gazeDirection: result.gazeDirection,
            isObstructed: result.isObstructed,
            handNearFace: result.handNearFace,
            deviceDetected: result.possibleExternalDevice,
            cameraQualityScore: result.quality.score,
          }));
        }
      } catch (loopErr) {
        console.warn("[Proctoring CV] Frame processing note:", loopErr);
      } finally {
        isProcessing = false;
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isActive, mediaStream, mergedConfig.sampleFps, videoRef, captureSnapshot]);

  // Browser security: Tab Switching & Visibility Change
  useEffect(() => {
    if (!isActive) return;

    const STARTUP_GRACE_PERIOD_MS = 10000; // 10s grace period after interview activation

    const handleVisibilityChange = () => {
      // Ignore during initial 10-second startup grace period
      if (Date.now() - interviewStartTimeRef.current < STARTUP_GRACE_PERIOD_MS) {
        return;
      }

      if (document.hidden) {
        const now = Date.now();
        if (now - lastBlurTimestampRef.current > 3000) {
          lastBlurTimestampRef.current = now;
          setIsWindowLockedOut(true);
          eventEngineRef.current?.logDiscreteEvent(
            "TAB_SWITCH",
            0,
            { description: "Browser tab switched or minimized." },
            "browser"
          );
        }
      }
    };

    const handleWindowBlur = () => {
      // Ignore during initial 10-second startup grace period
      if (Date.now() - interviewStartTimeRef.current < STARTUP_GRACE_PERIOD_MS) {
        return;
      }
      // If document is hidden, visibilitychange already handles TAB_SWITCH. Avoid double counting.
      if (document.hidden) {
        return;
      }

      // Debounce window blur by 2.5s to prevent false positives when user interacts with browser UI/screen share toolbar
      if (blurDebounceTimeoutRef.current) {
        clearTimeout(blurDebounceTimeoutRef.current);
      }
      blurDebounceTimeoutRef.current = setTimeout(() => {
        if (typeof document !== "undefined" && document.hasFocus && document.hasFocus()) {
          return;
        }
        const now = Date.now();
        if (now - lastBlurTimestampRef.current > 3000) {
          lastBlurTimestampRef.current = now;
          setIsWindowLockedOut(true);
          eventEngineRef.current?.logDiscreteEvent(
            "WINDOW_BLUR",
            0,
            { description: "Browser window lost focus." },
            "browser"
          );
        }
      }, 2500);
    };

    const handleWindowFocus = () => {
      if (blurDebounceTimeoutRef.current) {
        clearTimeout(blurDebounceTimeoutRef.current);
        blurDebounceTimeoutRef.current = null;
      }
    };

    const handleFullscreenChange = () => {
      // Ignore during initial startup grace period
      if (Date.now() - interviewStartTimeRef.current < STARTUP_GRACE_PERIOD_MS) {
        return;
      }

      if (!isDocumentFullscreen()) {
        setActiveWarning("Please return to fullscreen mode to continue the interview.");
        eventEngineRef.current?.logDiscreteEvent(
          "FULLSCREEN_EXIT",
          0,
          { description: "Fullscreen mode was exited." },
          "browser"
        );
      } else {
        setActiveWarning((prev) =>
          prev === "Please return to fullscreen mode to continue the interview." ? null : prev
        );
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setActiveWarning("Right-click context menu is restricted during the interview.");
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = setTimeout(() => setActiveWarning(null), 3000);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Keystroke Dynamics & AI Auto-Typer Bot Detection
      const now = Date.now();
      if (lastKeyTimeRef.current > 0) {
        const interval = now - lastKeyTimeRef.current;
        if (interval < 1000) {
          recentKeyIntervalsRef.current.push(interval);
          if (recentKeyIntervalsRef.current.length > 25) {
            recentKeyIntervalsRef.current.shift();
            const sum = recentKeyIntervalsRef.current.reduce((a, b) => a + b, 0);
            const avg = sum / recentKeyIntervalsRef.current.length;
            const variance =
              recentKeyIntervalsRef.current.reduce((a, b) => a + Math.pow(b - avg, 2), 0) /
              recentKeyIntervalsRef.current.length;

            // Superhuman burst: average interval < 20ms or near-zero variance (< 12)
            if ((avg < 20 || variance < 10) && now - lastBotWarningRef.current > 15000) {
              lastBotWarningRef.current = now;
              eventEngineRef.current?.logDiscreteEvent(
                "BOT_TYPING_DETECTED",
                0,
                {
                  avgIntervalMs: Math.round(avg),
                  variance: Math.round(variance),
                  description: "Unnatural robotic keystroke cadence detected (possible AI auto-typer extension).",
                },
                "system"
              );
            }
          }
        } else {
          recentKeyIntervalsRef.current = [];
        }
      }
      lastKeyTimeRef.current = now;

      // Screen Recording / Screenshot Shortcuts Trapping & Instant Cancellation
      const isPrintScreen = e.key === "PrintScreen" || e.code === "PrintScreen" || (e as any).keyCode === 44;
      const isWinGameBarRecord = (e.altKey && e.key?.toLowerCase() === "r") || (e.altKey && e.key?.toLowerCase() === "g");
      const isScreenSnipping = e.shiftKey && (e.key?.toLowerCase() === "s" || e.code === "KeyS") && (e.metaKey || (e as any).getModifierState?.("OS") || (e as any).getModifierState?.("Meta"));
      const isMacScreenCapture = e.metaKey && e.shiftKey && ["3", "4", "5"].includes(e.key);
      const isObsOrShadowplayRecord = (e.ctrlKey && e.shiftKey && (e.key?.toLowerCase() === "r" || e.code === "KeyR")) || (e.altKey && e.key === "F9");

      if (isPrintScreen || isWinGameBarRecord || isScreenSnipping || isMacScreenCapture || isObsOrShadowplayRecord) {
        e.preventDefault();
        e.stopPropagation();
        try {
          if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText("");
          }
        } catch {}

        console.error("🛑 SCREEN RECORDING / SCREENSHOT ATTEMPT DETECTED! Cancelling interview.");
        eventEngineRef.current?.logDiscreteEvent(
          "SCREEN_RECORDING_DETECTED",
          0,
          {
            reason: "Screen recording shortcut or screenshot key attempt detected (PrintScreen / Win+Alt+R / Snipping Tool).",
            shortcut: e.key,
            isCritical: true,
          },
          "screen"
        );
        onTerminateRequired?.();
        return;
      }

      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "i", "J", "j", "C", "c"].includes(e.key)) ||
        (e.ctrlKey && ["u", "U", "p", "P", "s", "S", "n", "N", "t", "T"].includes(e.key)) ||
        (e.altKey && e.key === "Tab")
      ) {
        e.preventDefault();
        setActiveWarning("Prohibited keyboard shortcut restricted during proctoring.");
        if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
        warningTimeoutRef.current = setTimeout(() => setActiveWarning(null), 3500);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen" || e.code === "PrintScreen" || (e as any).keyCode === 44) {
        e.preventDefault();
        try {
          if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText("");
          }
        } catch {}
        console.error("🛑 PrintScreen key released! Cancelling interview.");
        eventEngineRef.current?.logDiscreteEvent(
          "SCREEN_RECORDING_DETECTED",
          0,
          {
            reason: "PrintScreen key capture attempt detected.",
            isCritical: true,
          },
          "screen"
        );
        onTerminateRequired?.();
      }
    };

    const handleClipboard = (e: ClipboardEvent) => {
      e.preventDefault();
      setActiveWarning("Copy and paste actions are restricted during the interview.");
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = setTimeout(() => setActiveWarning(null), 3000);
    };

    // Multi-Monitor / Dual Screen hardware check
    if (typeof window !== "undefined" && window.screen) {
      if ((window.screen as any).isExtended || window.screen.availWidth > window.screen.width * 1.5) {
        eventEngineRef.current?.logDiscreteEvent(
          "DUAL_MONITOR",
          0,
          { description: "Extended display or secondary monitor setup detected." },
          "system"
        );
      }
    }

    const handleMouseLeave = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastBlurTimestampRef.current > 4000) {
        // If cursor moves outside window viewport horizontally (likely moving to adjacent monitor)
        if (e.clientX <= 2 || e.clientX >= window.innerWidth - 2) {
          lastBlurTimestampRef.current = now;
          eventEngineRef.current?.logDiscreteEvent(
            "DUAL_MONITOR",
            0,
            { description: "Cursor moved across window boundary towards secondary screen." },
            "browser"
          );
        }
      }
    };

    const handleAuxClick = (e: MouseEvent) => {
      // Middle-click paste protection
      if (e.button === 1) {
        e.preventDefault();
        setActiveWarning("Middle-click action restricted during proctoring.");
        if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
        warningTimeoutRef.current = setTimeout(() => setActiveWarning(null), 3000);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setActiveWarning("Drag-and-drop insertion is restricted during the interview.");
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = setTimeout(() => setActiveWarning(null), 3000);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    document.addEventListener("copy", handleClipboard);
    document.addEventListener("cut", handleClipboard);
    document.addEventListener("paste", handleClipboard);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("auxclick", handleAuxClick);
    document.addEventListener("drop", handleDrop);

    return () => {
      if (blurDebounceTimeoutRef.current) {
        clearTimeout(blurDebounceTimeoutRef.current);
        blurDebounceTimeoutRef.current = null;
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("copy", handleClipboard);
      document.removeEventListener("cut", handleClipboard);
      document.removeEventListener("paste", handleClipboard);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("auxclick", handleAuxClick);
      document.removeEventListener("drop", handleDrop);
    };
  }, [isActive]);

  // Ambient Audio & Whisper Anomaly Detection (Speech frequency monitoring)
  useEffect(() => {
    if (!isActive || !mediaStream) return;

    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let animId: number | null = null;
    let whisperDurationMs = 0;
    let lastWhisperCheck = Date.now();
    let lastAudioViolationTimestamp = 0;

    try {
      const audioTracks = mediaStream.getAudioTracks();
      if (!audioTracks || audioTracks.length === 0) return;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      audioCtx = new AudioContextClass();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;

      source = audioCtx.createMediaStreamSource(mediaStream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkAudio = () => {
        if (!analyser) return;
        const now = Date.now();
        const delta = now - lastWhisperCheck;
        lastWhisperCheck = now;

        analyser.getByteFrequencyData(dataArray);

        // Analyze human voice frequency spectrum (approx 300Hz - 3400Hz)
        // With sampleRate ~48kHz, bin width ~ 48000 / 256 = 187.5 Hz
        // Bins 2 to 18 correspond to ~375Hz - ~3375Hz
        let speechBandSum = 0;
        let count = 0;
        for (let i = 2; i <= 18 && i < bufferLength; i++) {
          speechBandSum += dataArray[i];
          count++;
        }
        const avgSpeechEnergy = count > 0 ? speechBandSum / count : 0;

        // If AI is speaking or candidate is actively speaking their answer,
        // do NOT treat voice energy as an external voice or unauthorized conversation.
        if (isAISpeakingRef.current || isCandidateAnsweringRef.current) {
          whisperDurationMs = 0;
          animId = requestAnimationFrame(checkAudio);
          return;
        }

        // Voice energy analysis (speech band ~300Hz - 3400Hz)
        // Detects sustained loud external speech/conversation (> 75 energy for >= 4.5s)
        if (avgSpeechEnergy > 75) {
          whisperDurationMs += delta;
          if (whisperDurationMs >= 4500 && now - lastAudioViolationTimestamp > 15000) {
            lastAudioViolationTimestamp = now;
            whisperDurationMs = 0;
            const eventType: ProctoringEventType = "AUDIO_ANOMALY";
            const desc = "External voice or unauthorized conversation detected.";
            setActiveWarning(desc);
            setTimeout(() => {
              setActiveWarning((curr) => (curr === desc ? null : curr));
            }, 4000);
            eventEngineRef.current?.logDiscreteEvent(
              eventType,
              4500,
              { energy: Math.round(avgSpeechEnergy), description: desc },
              "system"
            );
          }
        } else {
          whisperDurationMs = Math.max(0, whisperDurationMs - delta * 0.5);
        }

        animId = requestAnimationFrame(checkAudio);
      };

      animId = requestAnimationFrame(checkAudio);
    } catch (err) {
      console.warn("[Proctoring] Audio analysis init skipped:", err);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (audioCtx && audioCtx.state !== "closed") {
        audioCtx.close().catch(() => {});
      }
    };
  }, [isActive, mediaStream]);

  // Network Connection Drop Resilience (Offline detection & timer suspension)
  useEffect(() => {
    if (!isActive) return;

    let countdownTimer: any = null;

    const handleOffline = () => {
      setIsConnectionSuspended(true);
      setReconnectCountdown(45);
      eventEngineRef.current?.logDiscreteEvent(
        "CONNECTION_INTERRUPTED",
        0,
        { description: "Candidate device network connection dropped." },
        "system"
      );

      countdownTimer = setInterval(() => {
        setReconnectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    const handleOnline = () => {
      setIsConnectionSuspended(false);
      if (countdownTimer) clearInterval(countdownTimer);
      setReconnectCountdown(45);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      if (countdownTimer) clearInterval(countdownTimer);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [isActive]);

  const unlockWindow = useCallback(async (): Promise<boolean> => {
    try {
      const entered = await enterFullscreen();
      if (entered || isDocumentFullscreen()) {
        setIsWindowLockedOut(false);
        setActiveWarning((prev) =>
          prev === "Please return to fullscreen mode to continue the interview." ? null : prev
        );
        return true;
      }
    } catch (err) {
      console.warn("[Proctoring] Fullscreen re-lock failed:", err);
    }
    // If not verified fullscreen, do not clear locked-out status
    return false;
  }, []);

  return {
    metrics,
    activeWarning,
    cameraQuality,
    eventsTimeline,
    isWindowLockedOut,
    isConnectionSuspended,
    reconnectCountdown,
    unlockWindow,
    captureSnapshot,
    warningState,
    warningCount: warningState.warningCount,
    maxWarnings: warningState.maxWarnings,
    proctoringStatus: warningState.proctoringStatus,
    activeWarningModal: warningState.activeWarningModal,
    acknowledgeWarning,
    isTerminated:
      warningState.proctoringStatus === "PROCTORING_REVIEW_REQUIRED" ||
      warningState.warningCount >= warningState.maxWarnings ||
      warningState.finalWarningAction === "TERMINATE_INTERVIEW",
    logDiscreteEvent: (
      eventType: ProctoringEventType,
      durationMs: number = 0,
      metadata: Record<string, any> = {},
      source: "browser" | "system" | "camera" | "screen" = "camera"
    ) => {
      eventEngineRef.current?.logDiscreteEvent(eventType, durationMs, metadata, source);
    },
    resetProctoring: () => {
      eventEngineRef.current?.reset();
      healthMonitorRef.current?.reset();
      setEventsTimeline([]);
    },
  };
}
