"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Monitor,
  Square,
  AlertCircle,
  CheckCircle2,
  Shield,
  Sparkles,
  Maximize2,
  Minimize2,
  Loader2,
  RefreshCw,
  X,
  AlertTriangle,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { mediaDeviceManager } from "@/lib/media/MediaDeviceManager";

export interface ScreenAnalysisData {
  summary: string;
  visibleApplication: string;
  technicalObservations: string[];
  interviewRelevantActivity: string[];
  concerns: string[];
  needsFollowUp: boolean;
  analyzedAt?: string;
  unauthorizedContentDetected?: boolean;
  notificationDetected?: boolean;
  detectedViolationType?: string | null;
  detectedViolations?: string[];
  screenRecordingDetected?: boolean;
  interviewCancelled?: boolean;
  cancellationReason?: string;
}

export interface ScreenShareAnalysisProps {
  sessionId: string;
  token?: string;
  apiBaseUrl?: string;
  defaultIntervalSeconds?: number;
  compact?: boolean;
  initialStream?: MediaStream | null;
  interviewStarted?: boolean;
  onAnalysisResult?: (data: ScreenAnalysisData) => void;
  onSharingStateChange?: (isSharing: boolean) => void;
  onScreenShareStopped?: (reason: string) => void;
  onScreenRecordingDetected?: (reason: string) => void;
  onProctoringViolation?: (violation: {
    type: "SCREEN_SHARE_STOPPED" | "UNAUTHORIZED_TAB_DETECTED" | "SCREEN_NOTIFICATION_DETECTED" | "SCREEN_RECORDING_DETECTED";
    message: string;
    details?: any;
  }) => void;
  className?: string;
}

export default function ScreenShareAnalysis({
  sessionId,
  token,
  apiBaseUrl,
  defaultIntervalSeconds = 5,
  compact = false,
  initialStream = null,
  interviewStarted = false,
  onAnalysisResult,
  onSharingStateChange,
  onScreenShareStopped,
  onScreenRecordingDetected,
  onProctoringViolation,
  className = "",
}: ScreenShareAnalysisProps) {
  // Config & Base URL
  const baseUrl = (
    apiBaseUrl ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000"
  ).replace(/\/$/, "");

  // Helper to obtain active screen stream from initialStream prop or mediaDeviceManager
  const getActiveStream = useCallback((): MediaStream | null => {
    const candidate =
      initialStream ||
      (typeof window !== "undefined"
        ? mediaDeviceManager.getState().screenStream
        : null);
    if (candidate) {
      const liveTracks = candidate
        .getVideoTracks()
        .filter((t) => t.readyState === "live" && t.enabled);
      if (liveTracks.length > 0) {
        return candidate;
      }
    }
    return null;
  }, [initialStream]);

  // State management - initialized from active screen stream if already verified in pre-interview setup
  const [isSharing, setIsSharing] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stream =
      initialStream || mediaDeviceManager.getState().screenStream;
    return Boolean(
      stream?.getVideoTracks().some((t) => t.readyState === "live" && t.enabled)
    );
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [intervalSeconds, setIntervalSeconds] = useState(defaultIntervalSeconds);
  const [lastAnalysis, setLastAnalysis] = useState<ScreenAnalysisData | null>(null);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<Date | null>(null);
  const [analysisCount, setAnalysisCount] = useState(0);

  // Status & Error messages
  const [statusMessage, setStatusMessage] = useState<string | null>(() => {
    const stream =
      typeof window !== "undefined"
        ? initialStream || mediaDeviceManager.getState().screenStream
        : null;
    return stream?.getVideoTracks().some((t) => t.readyState === "live" && t.enabled)
      ? "Screen sharing active. Capturing live observations."
      : null;
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [quotaWarning, setQuotaWarning] = useState<string | null>(null);

  // Proctoring & Screen Interruption States
  const [screenShareInterrupted, setScreenShareInterrupted] = useState(false);
  const [showStopConfirmModal, setShowStopConfirmModal] = useState(false);
  const [isRecordingCancelled, setIsRecordingCancelled] = useState(false);
  const [recordingCancelReason, setRecordingCancelReason] = useState("");
  const [proctorAlert, setProctorAlert] = useState<{
    type: string;
    title: string;
    message: string;
    violations: string[];
    timestamp: Date;
  } | null>(null);

  // Modals
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(true);

  // References
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isAnalyzingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Callback ref that binds active stream to video element as soon as it mounts in DOM
  const bindVideoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      videoRef.current = node;
      const activeStream = streamRef.current || getActiveStream();
      if (node && activeStream) {
        const liveTracks = activeStream
          .getVideoTracks()
          .filter((t) => t.readyState === "live" && t.enabled);
        if (liveTracks.length > 0 && node.srcObject !== activeStream) {
          node.srcObject = activeStream;
          node
            .play()
            .catch((err) =>
              console.warn("[ScreenShareAnalysis] Video play error:", err)
            );
        }
      }
    },
    [getActiveStream]
  );

  // Notify parent of sharing state changes
  useEffect(() => {
    onSharingStateChange?.(isSharing);
  }, [isSharing, onSharingStateChange]);

  // Clean up all tracks and active timers
  const stopAllMediaTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn("Error stopping screen share track:", e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    isAnalyzingRef.current = false;
  }, []);

  // Stop sharing handler with proctoring enforcement
  const stopSharing = useCallback(
    (reason?: string, isIntentionalUserAction: boolean = false) => {
      stopAllMediaTracks();
      mediaDeviceManager.stopScreenShare();
      setIsSharing(false);
      setIsAnalyzing(false);

      if (interviewStarted) {
        setScreenShareInterrupted(true);
        const stopReason = reason || "Screen sharing was stopped during the active interview.";
        setStatusMessage("⚠️ Screen sharing interrupted. Continuous sharing required for proctoring compliance.");
        onScreenShareStopped?.(stopReason);
        onProctoringViolation?.({
          type: "SCREEN_SHARE_STOPPED",
          message: "Screen sharing was interrupted or stopped during the active interview. Screen sharing must remain continuously active.",
          details: { reason: stopReason, isIntentional: isIntentionalUserAction },
        });
      } else {
        if (reason) {
          setStatusMessage(reason);
        } else {
          setStatusMessage("Screen sharing stopped.");
        }
      }
    },
    [stopAllMediaTracks, interviewStarted, onScreenShareStopped, onProctoringViolation]
  );

  // Automatically adopt verified screen stream without re-prompting
  useEffect(() => {
    const activeStream = getActiveStream();
    if (!activeStream) return;

    console.log(
      "📺 [ScreenShareAnalysis] Preserving and adopting active screen stream without prompt:",
      activeStream
    );
    streamRef.current = activeStream;

    // Attach native stop sharing listener
    activeStream.getVideoTracks().forEach((track) => {
      track.onended = () => {
        console.log("🛑 Screen share track stopped via native browser control.");
        stopSharing("Screen sharing was stopped via native browser controls.");
      };
    });

    if (videoRef.current && videoRef.current.srcObject !== activeStream) {
      videoRef.current.srcObject = activeStream;
      videoRef.current.play().catch((err) => {
        console.warn("[ScreenShareAnalysis] Auto-play screen video notice:", err);
      });
    }

    setIsSharing(true);
    setScreenShareInterrupted(false);
    setStatusMessage("Screen sharing active. Capturing live observations.");
    onSharingStateChange?.(true);
  }, [getActiveStream, stopSharing, onSharingStateChange]);

  // Cleanup on unmount: only clean timers & abort controllers.
  // The actual MediaStream tracks are retained in MediaDeviceManager across transitions.
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      isAnalyzingRef.current = false;
    };
  }, []);

  // Capture frame from video and post to AI analysis API
  const captureAndAnalyzeFrame = useCallback(async () => {
    // Prevent concurrent analysis requests
    if (isAnalyzingRef.current) {
      return;
    }

    const video = videoRef.current;
    if (!video || !streamRef.current || video.readyState < 2) {
      return;
    }

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }

    // Resolve authentication token
    const effectiveToken =
      token ||
      (typeof window !== "undefined"
        ? localStorage.getItem("token") || ""
        : "");

    if (!effectiveToken) {
      setErrorMessage("Authentication token not found. Please log in again.");
      return;
    }

    try {
      // 1. Off-screen canvas frame extraction with downscaling to max 960px
      const maxWidth = 960;
      const scale = Math.min(1, maxWidth / video.videoWidth);
      const targetWidth = Math.round(video.videoWidth * scale);
      const targetHeight = Math.round(video.videoHeight * scale);

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

      // Quality: 0.55 JPEG for fast transmission (~40-90KB)
      const dataUrl = canvas.toDataURL("image/jpeg", 0.55);

      isAnalyzingRef.current = true;
      setIsAnalyzing(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      let response = await fetch(`${baseUrl}/proctoring/screen/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${effectiveToken}`,
        },
        body: JSON.stringify({
          sessionId: sessionId || "session_active",
          image: dataUrl,
          timestamp: new Date().toISOString(),
        }),
        signal: controller.signal,
      });

      if (response.status === 404) {
        response = await fetch(`${baseUrl}/interview/screen/analyze`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${effectiveToken}`,
          },
          body: JSON.stringify({
            sessionId: sessionId || "session_active",
            image: dataUrl,
            timestamp: new Date().toISOString(),
          }),
          signal: controller.signal,
        });
      }

      clearTimeout(timeoutId);

      if (response.ok) {
        const data: ScreenAnalysisData = await response.json();
        setLastAnalysis(data);
        setLastAnalysisTime(new Date());
        setAnalysisCount((prev) => prev + 1);
        setQuotaWarning(null);
        setErrorMessage(null);
        setStatusMessage(null);
        onAnalysisResult?.(data);

        // CRITICAL CHECK: Active Screen Recording Software Detected -> CANCEL INTERVIEW
        if (data.screenRecordingDetected || data.interviewCancelled) {
          const reasonMsg = data.cancellationReason || "Prohibited screen recording software detected on your shared screen.";
          setIsRecordingCancelled(true);
          setRecordingCancelReason(reasonMsg);
          stopAllMediaTracks();
          mediaDeviceManager.stopScreenShare();
          setIsSharing(false);
          setIsAnalyzing(false);
          onScreenRecordingDetected?.(reasonMsg);
          onProctoringViolation?.({
            type: "SCREEN_RECORDING_DETECTED",
            message: reasonMsg,
            details: { isCritical: true, violations: data.detectedViolations },
          });
          return;
        }

        // AI Proctoring Monitoring: Detect unauthorized tabs, cheat tools, or notifications
        if (data.unauthorizedContentDetected) {
          const reasonMsg = data.detectedViolations && data.detectedViolations.length > 0
            ? data.detectedViolations.join("; ")
            : "Unauthorized application, browser tab, or AI tool visible on screen.";
          setProctorAlert({
            type: "UNAUTHORIZED_TAB_DETECTED",
            title: "Unauthorized Content Detected on Screen",
            message: reasonMsg,
            violations: data.detectedViolations || [],
            timestamp: new Date(),
          });
          if (interviewStarted) {
            onProctoringViolation?.({
              type: "UNAUTHORIZED_TAB_DETECTED",
              message: reasonMsg,
              details: { violations: data.detectedViolations },
            });
          }
        } else if (data.notificationDetected) {
          const reasonMsg = data.detectedViolations && data.detectedViolations.length > 0
            ? data.detectedViolations.join("; ")
            : "Pop-up notification or incoming message preview detected on screen.";
          setProctorAlert({
            type: "SCREEN_NOTIFICATION_DETECTED",
            title: "Screen Notification / Pop-up Detected",
            message: reasonMsg,
            violations: data.detectedViolations || [],
            timestamp: new Date(),
          });
          if (interviewStarted) {
            onProctoringViolation?.({
              type: "SCREEN_NOTIFICATION_DETECTED",
              message: reasonMsg,
              details: { violations: data.detectedViolations },
            });
          }
        } else {
          // Clear active proctor alert once compliant
          setProctorAlert(null);
        }
      } else if (response.status === 503 || response.status === 429) {
        // OpenAI quota or rate limit exceeded: Non-blocking warning!
        const errJson = await response.json().catch(() => ({}));
        setQuotaWarning(
          errJson.detail ||
            "AI screen analysis is temporarily unavailable (OpenAI quota exceeded). Live screen preview remains active."
        );
      } else if (response.status === 401) {
        setErrorMessage("Authentication session expired. Please re-login.");
      } else if (response.status === 403) {
        setErrorMessage("Unauthorized to analyze screen for this interview session.");
      } else {
        const errJson = await response.json().catch(() => ({}));
        setErrorMessage(errJson.detail || "Screen analysis failed.");
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.warn("Screen analysis request timed out.");
      } else {
        console.warn("Screen analysis request error:", err);
        setErrorMessage("Network error connecting to screen analysis service.");
      }
    } finally {
      isAnalyzingRef.current = false;
      setIsAnalyzing(false);
      abortControllerRef.current = null;
    }
  }, [baseUrl, sessionId, token, onAnalysisResult]);

  // Manage interval loop when sharing is active
  useEffect(() => {
    if (!isSharing) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Run first frame analysis shortly after stream stabilizes (1.2s)
    const initialTimer = setTimeout(() => {
      captureAndAnalyzeFrame();
    }, 1200);

    // Set recurring timer
    timerRef.current = setInterval(() => {
      captureAndAnalyzeFrame();
    }, intervalSeconds * 1000);

    return () => {
      clearTimeout(initialTimer);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isSharing, intervalSeconds, captureAndAnalyzeFrame]);

  // Request screen display media from browser
  const handleStartScreenShare = async () => {
    setErrorMessage(null);
    setStatusMessage(null);
    setQuotaWarning(null);

    // Check browser support
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getDisplayMedia
    ) {
      setErrorMessage(
        "Screen sharing is not supported by your browser. Please use Chrome, Edge, Brave, or Firefox on a desktop computer."
      );
      setShowConsentModal(false);
      return;
    }

    try {
      setShowConsentModal(false);

      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "monitor",
          frameRate: { ideal: 15, max: 30 },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        } as any,
        audio: false,
      });

      streamRef.current = displayStream;

      // Listen for native browser "Stop Sharing" button
      displayStream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          stopSharing("Screen sharing was stopped via native browser controls.");
        };
      });

      if (videoRef.current) {
        videoRef.current.srcObject = displayStream;
        await videoRef.current.play().catch(() => {});
      }

      setIsSharing(true);
      setScreenShareInterrupted(false);
      setStatusMessage("Screen sharing active. Capturing live observations.");
    } catch (err: any) {
      console.warn("Screen share permission or device error:", err);
      if (err.name === "NotAllowedError" || err.message?.includes("Permission denied")) {
        setErrorMessage("Screen sharing permission was canceled or denied.");
      } else {
        setErrorMessage(err.message || "Failed to start screen sharing.");
      }
      stopAllMediaTracks();
      setIsSharing(false);
    }
  };

  return (
    <div className={`flex flex-col bg-white rounded-2xl border border-[#E8D9CC] shadow-xl overflow-hidden ${className}`}>
      {/* ========================================================================= */}
      {/* 1. Header Bar with Status and Action Buttons */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-[#E8D9CC] bg-white">
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              isSharing
                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                : "bg-[#FFFCF8] text-[#E85D04] border border-[#E8D9CC]"
            }`}
          >
            <Monitor size={15} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#111827]">Screen Analysis</span>
              {isSharing && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Live
                </span>
              )}
            </div>
            <span className="text-[10px] text-[#64748B]">
              {isSharing
                ? isAnalyzing
                  ? "Analyzing frame..."
                  : `Capturing every ${intervalSeconds}s`
                : "Offline"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {!isSharing ? (
            <button
              type="button"
              onClick={() => setShowConsentModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#E85D04] text-white hover:bg-[#C84F04] transition-all shadow-md shadow-orange-500/20 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04]"
            >
              <Monitor size={13} />
              <span>Share Screen</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (interviewStarted) {
                  setShowStopConfirmModal(true);
                } else {
                  stopSharing();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-950/40 text-rose-400 border border-rose-500/40 hover:bg-rose-900/50 transition-all shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            >
              <Square size={12} className="fill-rose-400" />
              <span>Stop Sharing</span>
            </button>
          )}

          {isSharing && (
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#111827] hover:bg-slate-100 border border-transparent hover:border-[#E8D9CC] transition-colors cursor-pointer"
              title="Expand screen preview"
            >
              <Maximize2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Video Preview Section (Visible when active) */}
      {/* ========================================================================= */}
      {isSharing ? (
        <div className="p-3 bg-white">
          <div className="w-full aspect-video rounded-xl overflow-hidden relative bg-[#FFFCF8] border border-[#E8D9CC] shadow-inner group">
            <video
              ref={bindVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain"
            />

            {/* Top Overlay Proctoring Badge */}
            <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-[#0E0C08]/85 backdrop-blur-xs px-2.5 py-1 rounded-md text-[10px] font-mono border shadow-xs">
              {lastAnalysis?.screenRecordingDetected ? (
                <span className="text-rose-400 font-bold flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  <span>Prohibited Screen Recorder</span>
                </span>
              ) : lastAnalysis?.unauthorizedContentDetected ? (
                <span className="text-rose-400 font-bold flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>Unauthorized Tool Detected</span>
                </span>
              ) : (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>AI Proctor: Desktop Monitored</span>
                </span>
              )}
            </div>

            {/* Analysis Activity Spinner */}
            {isAnalyzing && (
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-md text-[10px] text-[#E85D04] font-medium border border-[#E8D9CC] shadow-xs animate-pulse">
                <Loader2 size={11} className="animate-spin text-[#E85D04]" />
                <span>AI Analyzing</span>
              </div>
            )}

            {/* Bottom App & Scan Now Tag */}
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
              {lastAnalysis?.visibleApplication && (
                <div className="bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-md text-[10px] text-[#111827] font-bold border border-[#E8D9CC] shadow-xs flex items-center gap-1">
                  <span className="text-[#E85D04]">App:</span>
                  <span className="truncate max-w-[140px]">{lastAnalysis.visibleApplication}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => captureAndAnalyzeFrame()}
                disabled={isAnalyzing}
                className="bg-[#0E0C08]/80 hover:bg-[#0E0C08] text-[#E85D04] text-[10px] font-mono px-2 py-0.5 rounded-md border border-[#E8D9CC] flex items-center gap-1 cursor-pointer transition shadow-xs"
                title="Trigger immediate AI screen scan"
              >
                <RefreshCw size={10} className={isAnalyzing ? "animate-spin" : ""} />
                <span>Scan</span>
              </button>
            </div>

            {/* Hover Expand Action */}
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="absolute bottom-2 right-2 p-1.5 rounded-md bg-[#0E0C08]/80 hover:bg-[#0E0C08] text-[#111827] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
              title="Expand preview"
            >
              <Maximize2 size={13} />
            </button>
          </div>

          {/* Quick Frequency Selector */}
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#64748B] font-mono px-0.5">
            <span className="flex items-center gap-1">
              <Clock size={11} />
              <span>Interval:</span>
              <select
                value={intervalSeconds}
                onChange={(e) => setIntervalSeconds(Number(e.target.value))}
                className="ml-1 bg-white border border-[#E8D9CC] rounded px-1.5 py-0.5 text-[10px] font-sans text-[#111827] focus:outline-none focus:border-[#E85D04]"
              >
                <option value={3}>3s (Fast)</option>
                <option value={5}>5s (Default)</option>
                <option value={10}>10s (Eco)</option>
              </select>
            </span>
            <span>Frames Analyzed: {analysisCount}</span>
          </div>
        </div>
      ) : (
        <div className="p-4 flex flex-col items-center justify-center text-center bg-white/40">
          <div className="w-10 h-10 rounded-xl bg-white border border-[#E8D9CC] flex items-center justify-center text-[#64748B] mb-2 shadow-sm">
            <Monitor size={18} />
          </div>
          <p className="text-xs font-semibold text-[#111827]">No Screen Shared</p>
          <p className="text-[11px] text-[#64748B] max-w-[240px] mt-0.5">
            Share your window or editor to allow TopPlaced AI to observe your live solution.
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. Screen Interrupted Banner & Proctoring Alerts */}
      {/* ========================================================================= */}
      {screenShareInterrupted && (
        <div className="mx-3 my-3 p-3.5 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-950 shadow-sm animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 font-bold shadow-xs">
              <AlertTriangle size={17} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-950">
                  ⚠️ Screen Sharing Interrupted
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-amber-200 text-amber-950 border border-amber-300">
                  Integrity Warning
                </span>
              </div>
              <p className="text-[11.5px] text-amber-900 mt-1 leading-relaxed">
                You stopped screen sharing while your interview is active. Screen sharing is mandatory for live proctoring compliance.
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleStartScreenShare}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#E85D04] text-white hover:bg-[#C84F04] active:scale-95 transition shadow-md shadow-orange-500/20 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04]"
                >
                  <Monitor size={13} />
                  <span>Re-Share Screen Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Proctor Alert: Unauthorized Tabs or Notification Pop-ups */}
      {proctorAlert && isSharing && (
        <div className="mx-3 my-2 p-3 rounded-xl bg-rose-50 border border-rose-300 shadow-xs animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-rose-100 border border-rose-300 flex items-center justify-center shrink-0 text-rose-700 mt-0.5">
              <AlertTriangle size={14} className="animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                  <span>{proctorAlert.title}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-rose-200 text-rose-900 font-semibold">
                    Proctoring Warning
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => setProctorAlert(null)}
                  className="text-rose-400 hover:text-rose-700 p-0.5 rounded cursor-pointer"
                  title="Dismiss notification badge"
                >
                  <X size={13} />
                </button>
              </div>
              <p className="text-[11px] text-rose-800 mt-0.5 leading-relaxed font-medium">
                {proctorAlert.message}
              </p>
              {proctorAlert.violations && proctorAlert.violations.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {proctorAlert.violations.map((v, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-rose-200 text-[10px] text-rose-900 font-semibold shadow-2xs"
                    >
                      <AlertCircle size={10} className="text-rose-600" />
                      {v}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-rose-600 font-semibold mt-1">
                👉 Please close unauthorized tabs or notification pop-ups immediately to avoid further proctoring penalties.
              </p>
            </div>
          </div>
        </div>
      )}

      {quotaWarning && (
        <div className="mx-3 my-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2 shadow-2xs">
          <AlertTriangle size={14} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <p className="font-semibold text-amber-950">AI Analysis Paused</p>
            <p className="text-amber-800">{quotaWarning}</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mx-3 my-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 shadow-2xs">
          <AlertCircle size={14} className="text-rose-600 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">{errorMessage}</p>
        </div>
      )}

      {statusMessage && !errorMessage && !quotaWarning && !screenShareInterrupted && (
        <div className="mx-3 my-2 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-1.5">
          <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. Latest AI Observation Panel */}
      {/* ========================================================================= */}
      {lastAnalysis && isSharing && (
        <div className="border-t border-[#E8D9CC] bg-white p-3 text-xs">
          <div
            className="flex items-center justify-between cursor-pointer select-none mb-2"
            onClick={() => setShowDetails(!showDetails)}
          >
            <div className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-[#E85D04]" />
              <span className="font-bold text-[#111827] text-[11px]">Latest AI Observation</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-[#64748B]">
              {lastAnalysisTime && (
                <span>{lastAnalysisTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
              )}
              {showDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </div>
          </div>

          {showDetails && (
            <div className="space-y-2.5 pt-1">
              {/* Summary */}
              <div className="p-2.5 rounded-xl bg-white border border-[#E8D9CC] shadow-sm">
                <p className="text-[11.5px] text-[#64748B] leading-relaxed">
                  {lastAnalysis.summary}
                </p>
              </div>

              {/* Technical Observations */}
              {lastAnalysis.technicalObservations && lastAnalysis.technicalObservations.length > 0 && (
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#64748B] block mb-1">
                    Technical Observations
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {lastAnalysis.technicalObservations.map((obs, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-0.5 rounded-md bg-white border border-[#E8D9CC] text-[10.5px] text-[#111827] shadow-sm"
                      >
                        {obs}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Interview-Relevant Activity */}
              {lastAnalysis.interviewRelevantActivity && lastAnalysis.interviewRelevantActivity.length > 0 && (
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#E85D04] block mb-1">
                    Interview-Relevant Activity
                  </span>
                  <ul className="space-y-1">
                    {lastAnalysis.interviewRelevantActivity.map((act, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-1.5 text-[11px] text-[#111827] bg-white p-1.5 rounded-lg border border-[#E8D9CC]"
                      >
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Concerns (Objectively framed, only if detected) */}
              {lastAnalysis.concerns && lastAnalysis.concerns.length > 0 && (
                <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-200">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-amber-800 block mb-0.5">
                    Noted Activity
                  </span>
                  <ul className="space-y-0.5 text-[10.5px] text-amber-900">
                    {lastAnalysis.concerns.map((c, idx) => (
                      <li key={idx}>• {c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. Pre-Sharing Candidate Consent Modal */}
      {/* ========================================================================= */}
      {showConsentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E8D9CC] max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 text-[#111827]">
            <div className="flex items-center justify-between pb-2 border-b border-[#E8D9CC]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FFFCF8] border border-[#E8D9CC] text-[#E85D04] flex items-center justify-center">
                  <Shield size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#111827]">Live Screen Sharing Consent</h3>
                  <span className="text-[11px] text-[#64748B]">Privacy & AI Analysis Transparency</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConsentModal(false)}
                className="p-1 rounded-lg text-[#64748B] hover:text-[#111827] hover:bg-slate-100 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#64748B] leading-relaxed">
              <div className="p-3 rounded-xl bg-white border border-[#E8D9CC] space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-base">🖥️</span>
                  <div>
                    <strong className="text-[#111827]">Voluntary Selection:</strong> You choose whether to share your whole screen, a specific window (e.g. IDE), or a browser tab.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-base">🤖</span>
                  <div>
                    <strong className="text-[#111827]">Real-time AI Observation:</strong> Screenshots from the chosen screen are periodically transmitted to the AI service (~every 5s) to assist the AI in understanding your coding or design solution.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-base">🔒</span>
                  <div>
                    <strong className="text-[#111827]">Privacy Protection:</strong> TopPlaced AI never persists screenshot images to disk or database storage.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-base">🛑</span>
                  <div>
                    <strong className="text-[#111827]">Immediate Control:</strong> You can stop sharing at any moment from this interface or browser controls.
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-[#64748B]">
                By proceeding, you authorize TopPlaced AI to capture compressed snapshots from your selected screen during this active interview.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E8D9CC]">
              <button
                type="button"
                onClick={() => setShowConsentModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] bg-white border border-[#E8D9CC] hover:text-[#111827] hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartScreenShare}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#E85D04] hover:bg-[#C84F04] transition shadow-md shadow-orange-500/20 cursor-pointer flex items-center gap-1.5"
              >
                <Monitor size={13} />
                <span>I Understand &amp; Start Sharing</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. High-Resolution Screen Preview Modal */}
      {/* ========================================================================= */}
      {isExpanded && isSharing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0E0C08] rounded-2xl border border-white/20 max-w-4xl w-full p-4 shadow-2xl flex flex-col space-y-3">
            <div className="flex items-center justify-between text-[#111827] pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-bold">Expanded Shared Screen Preview</span>
                {lastAnalysis?.visibleApplication && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-[#111827] font-mono">
                    {lastAnalysis.visibleApplication}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded-lg text-[#111827]/70 hover:text-[#111827] hover:bg-white/10 transition"
              >
                <Minimize2 size={16} />
              </button>
            </div>

            <div className="w-full aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center">
              <video
                ref={(node) => {
                  if (node && streamRef.current) {
                    node.srcObject = streamRef.current;
                    node.play().catch(() => {});
                  }
                }}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />
            </div>

            {lastAnalysis && (
              <div className="p-3 bg-white/10 rounded-xl text-xs text-[#111827]/90 space-y-1">
                <span className="font-semibold text-amber-300">Observation:</span>
                <p>{lastAnalysis.summary}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. Stop Sharing Active Interview Warning Modal */}
      {/* ========================================================================= */}
      {showStopConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-rose-500/40 max-w-md w-full p-5 shadow-2xl space-y-4 text-[#111827]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#111827]">Stop Screen Sharing?</h4>
                <p className="text-xs text-rose-700 font-medium">Active Interview Proctoring Restriction</p>
              </div>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              Screen sharing is mandatory throughout your technical interview. Stopping screen sharing now will immediately record an <strong>Integrity Warning</strong> and deduct proctoring points.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E8D9CC]">
              <button
                type="button"
                onClick={() => setShowStopConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#111827] bg-white border border-[#E8D9CC] hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer"
              >
                Cancel (Keep Sharing)
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowStopConfirmModal(false);
                  stopSharing("Candidate intentionally confirmed stopping screen sharing during active interview.", true);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#111827] bg-rose-600 hover:bg-rose-700 transition shadow-xs cursor-pointer"
              >
                Stop Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. Fullscreen Critical Cancellation Overlay: Screen Recording Detected */}
      {/* ========================================================================= */}
      {isRecordingCancelled && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0B0F19] rounded-2xl border-2 border-rose-500/80 max-w-lg w-full p-6 shadow-[0_0_50px_rgba(244,63,94,0.35)] text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-500 mx-auto shadow-inner">
              <AlertTriangle size={32} className="animate-pulse" />
            </div>
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase tracking-widest">
                Security Policy Disqualification
              </span>
              <h3 className="text-xl font-bold text-[#111827] pt-1">
                Interview Cancelled &amp; Terminated
              </h3>
            </div>
            <p className="text-xs text-rose-200/90 leading-relaxed max-w-md mx-auto">
              {recordingCancelReason || "Prohibited screen recording software or screen capture activity was detected on your system. In accordance with examination integrity regulations, this interview session has been permanently cancelled."}
            </p>
            <div className="p-3 rounded-xl bg-black/60 border border-rose-500/20 text-[11px] text-slate-300 text-left font-mono space-y-1">
              <div className="flex items-center gap-2 text-rose-400 font-semibold">
                <span>● Incident Type:</span>
                <span>SCREEN_RECORDING_DETECTED</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Audit telemetry and video evidence logs have been archived with candidate ID.
              </p>
            </div>
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.location.href = "/learner/dashboard";
                  }
                }}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-[#111827] bg-rose-600 hover:bg-rose-700 active:scale-95 transition shadow-lg cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
