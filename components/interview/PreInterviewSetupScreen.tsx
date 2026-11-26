"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Camera,
  Mic,
  Monitor,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Play,
  ShieldCheck,
  Lock,
  Volume2,
  Sparkles,
  Info,
  Check,
  VideoOff,
  MicOff,
  FileText,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import {
  mediaDeviceManager,
  MediaDeviceState,
} from "@/lib/media/MediaDeviceManager";

interface PreInterviewSetupScreenProps {
  interviewRole?: string;
  interviewLevel?: string;
  interviewDuration?: string;
  isStarting?: boolean;
  startError?: string | null;
  onStartInterview: () => void;
  onRetryStart?: () => void;
  interviewId?: string;
}

type SetupStep = 1 | 2 | 3;

export default function PreInterviewSetupScreen({
  interviewRole = "Technical Interview",
  interviewLevel = "Intermediate",
  interviewDuration = "30",
  isStarting = false,
  startError = null,
  onStartInterview,
  onRetryStart,
  interviewId,
}: PreInterviewSetupScreenProps) {
  const [currentStep, setCurrentStep] = useState<SetupStep>(1);
  const [deviceState, setDeviceState] = useState<MediaDeviceState>(() =>
    mediaDeviceManager.getState()
  );

  

  const [isTestingCamera, setIsTestingCamera] = useState(false);
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [isTestingScreen, setIsTestingScreen] = useState(false);

  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);

  // Subscribe to MediaDeviceManager state updates
  useEffect(() => {
    const unsubscribe = mediaDeviceManager.subscribe((newState) => {
      setDeviceState(newState);
    });

    mediaDeviceManager.enumerateDevices();

    return () => {
      unsubscribe();
    };
  }, []);

  // Re-bind camera stream to preview whenever camera stream changes or user navigates to Step 1
  useEffect(() => {
    if (currentStep === 1 && cameraVideoRef.current && deviceState.cameraStream) {
      if (cameraVideoRef.current.srcObject !== deviceState.cameraStream) {
        cameraVideoRef.current.srcObject = deviceState.cameraStream;
        cameraVideoRef.current
          .play()
          .catch((err) => console.warn("[Setup] Camera play warning:", err));
      }
    }
  }, [currentStep, deviceState.cameraStream]);

  // Re-bind screen stream to preview whenever screen stream changes or user navigates to Step 3
  useEffect(() => {
    if (currentStep === 3 && screenVideoRef.current && deviceState.screenStream) {
      if (screenVideoRef.current.srcObject !== deviceState.screenStream) {
        screenVideoRef.current.srcObject = deviceState.screenStream;
        screenVideoRef.current
          .play()
          .catch((err) => console.warn("[Setup] Screen play warning:", err));
      }
    }
  }, [currentStep, deviceState.screenStream]);

  // Handle Camera Test
  const handleTestCamera = async (deviceId?: string) => {
    setIsTestingCamera(true);
    try {
      await mediaDeviceManager.testCamera(deviceId);
    } finally {
      setIsTestingCamera(false);
    }
  };

  // Handle Microphone Test
  const handleTestMic = async (deviceId?: string) => {
    setIsTestingMic(true);
    try {
      await mediaDeviceManager.testMicrophone(deviceId);
    } finally {
      setIsTestingMic(false);
    }
  };

  // Handle Screen Share Test
  const handleTestScreen = async () => {
    setIsTestingScreen(true);
    try {
      await mediaDeviceManager.testScreenShare();
    } finally {
      setIsTestingScreen(false);
    }
  };

  // Stop Screen Share manually
  const handleStopScreen = () => {
    mediaDeviceManager.stopScreenShare();
  };

  // Calculate readiness states
  const isCameraReady = deviceState.isCameraReady;
  const isMicReady =
    deviceState.isMicrophoneReady && deviceState.hasAudioInputDetected;
  const isEntireScreen = deviceState.isEntireScreen ?? true;
  const isSingleWindowShared = Boolean(
    deviceState.isScreenReady && deviceState.screenDisplaySurface && !deviceState.isEntireScreen
  );
  const isScreenReady = deviceState.isScreenReady && !isSingleWindowShared;

  // Total mandatory setup requirements (Camera, Mic, Screen)
  const isMandatorySetupPassed = isCameraReady && isMicReady && isScreenReady;

  // Steps configuration
  const stepsConfig = [
    {
      step: 1 as SetupStep,
      title: "Camera",
      subtitle: "Webcam & Face Framing",
      icon: Camera,
      isCompleted: isCameraReady,
      isRequired: true,
    },
    {
      step: 2 as SetupStep,
      title: "Microphone",
      subtitle: "Audio Levels & Mic Check",
      icon: Mic,
      isCompleted: isMicReady,
      isRequired: true,
    },
    {
      step: 3 as SetupStep,
      title: "Screen Sharing",
      subtitle: "Entire Screen Stream",
      icon: Monitor,
      isCompleted: isScreenReady,
      isRequired: true,
    },
    
  ];

  return (
    <div className="min-h-screen h-full w-full overflow-y-auto bg-[#FFFCF8] text-[#111827] flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 select-none">
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-white border border-[#E8D9CC] rounded-3xl p-6 sm:p-7 shadow-sm shadow-[0_4px_20px_rgba(48,32,22,0.06)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8D9CC] pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-mono font-bold text-[#E85D04] tracking-wider uppercase">
                  Pre-Interview System Check
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
                Hardware & Security Setup
              </h1>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                Complete the step-by-step setup to calibrate your devices before beginning your AI interview.
              </p>
            </div>

            {/* Target Role & Level Badges */}
            <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-1.5 shrink-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E8D9CC] text-xs font-bold text-[#111827]">
                <Sparkles size={13} className="text-[#E85D04]" />
                <span>{interviewRole}</span>
              </div>
              <div className="inline-flex items-center gap-2 text-[11px] font-mono text-[#64748B]">
                <span>Level: {interviewLevel}</span>
                <span>•</span>
                <span>{interviewDuration} mins</span>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* STEP WIZARD NAVIGATION BAR */}
          {/* ============================================================== */}
          <div className="pt-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              {stepsConfig.map((item) => {
                const StepIcon = item.icon;
                const isActive = currentStep === item.step;
                const isDone = item.isCompleted;

                return (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => setCurrentStep(item.step)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04] ${
                      isActive
                        ? "bg-[#E85D04] text-white border-[#E85D04] shadow-md shadow-orange-500/20 font-bold scale-[1.02]"
                        : isDone
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100/60"
                        : "bg-white border-[#E8D9CC] text-[#64748B] hover:bg-slate-50 hover:text-[#111827] hover:border-slate-300"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs transition ${
                        isActive
                          ? "bg-white text-[#E85D04] shadow-xs"
                          : isDone
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-100 text-[#64748B] border border-[#E8D9CC]"
                      }`}
                    >
                      {isDone ? <Check size={14} className="stroke-[3]" /> : item.step}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-xs font-bold truncate ${
                            isActive ? "text-white" : isDone ? "text-emerald-700 font-bold" : "text-[#111827]"
                          }`}
                        >
                          {item.title}
                        </span>
                        {isDone && !isActive && (
                          <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                        )}
                      </div>
                      <span
                        className={`text-[10px] block truncate ${
                          isActive ? "text-white/80 font-medium" : "text-[#64748B]"
                        }`}
                      >
                        {isDone ? "Ready" : item.isRequired ? "Required" : "Optional"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Visual Progress Bar */}
            <div className="mt-4 w-full bg-[#151D26] h-1.5 rounded-full overflow-hidden border border-[#E8D9CC]">
              <div
                className="h-full bg-[#E85D04] transition-all duration-300"
                style={{
                  width: `${
                    currentStep === 1
                      ? 25
                      : currentStep === 2
                      ? 50
                      : currentStep === 3
                      ? 75
                      : 100
                  }%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Start Error Banner (if any) */}
        {startError && (
          <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 shadow-xs flex items-start gap-3 text-rose-900">
            <AlertCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs sm:text-sm space-y-1">
              <span className="font-bold block">Interview Launch Error</span>
              <p>{startError}</p>
              {onRetryStart && (
                <button
                  onClick={onRetryStart}
                  className="mt-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-[#111827] font-semibold text-xs rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw size={12} />
                  <span>Retry Start</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 1: CAMERA SETUP CARD */}
        {/* ============================================================== */}
        {currentStep === 1 && (
          <div className="bg-white border border-[#E8D9CC] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8D9CC] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#FFFCF8] border border-[#E8D9CC] text-[#E85D04] flex items-center justify-center font-bold">
                  <Camera size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#111827]">Step 1: Webcam & Face Calibration</h2>
                  <p className="text-xs text-[#64748B]">
                    Verify your camera feed, lighting, and center your face inside the framing box.
                  </p>
                </div>
              </div>

              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border self-start sm:self-auto ${
                  isCameraReady
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                    : "bg-amber-50 text-amber-800 border-amber-300"
                }`}
              >
                {isCameraReady ? "✓ Camera Verified" : "Action Required"}
              </span>
            </div>

            {/* Video Preview Viewport */}
            <div className="w-full max-w-xl mx-auto h-72 sm:h-80 rounded-2xl bg-[#FFFCF8] overflow-hidden relative border-2 border-[#E8D9CC] flex items-center justify-center shadow-inner">
              <video
                ref={cameraVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transform scale-x-[-1] ${
                  isCameraReady ? "block" : "hidden"
                }`}
              />

              {!isCameraReady && (
                <div className="text-center p-6 space-y-3">
                  <VideoOff size={36} className="text-[#64748B] mx-auto" />
                  <p className="text-sm font-semibold text-[#111827]">
                    Camera is not active yet.
                  </p>
                  <p className="text-xs text-[#64748B] max-w-sm">
                    Click &quot;Allow &amp; Test Camera&quot; below to grant browser permission and verify your live webcam feed.
                  </p>
                </div>
              )}

              {/* Live Framing Overlay when ready */}
              {isCameraReady && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center border-2 border-dashed border-emerald-500/40 m-6 rounded-2xl">
                  <div className="absolute top-3 left-3 bg-[#111827]/85 backdrop-blur-xs px-2.5 py-1 rounded-lg text-xs font-mono text-emerald-300 flex items-center gap-1.5 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Live Webcam Verified</span>
                  </div>
                  <div className="absolute bottom-3 text-center text-xs text-white bg-[#111827]/85 backdrop-blur-xs px-3 py-1 rounded-lg border border-white/15">
                    Keep your face centered &amp; upright
                  </div>
                </div>
              )}
            </div>

            {/* Camera selector if multiple */}
            {deviceState.cameras.length > 1 && (
              <div className="max-w-xl mx-auto space-y-1.5">
                <label className="text-xs font-semibold text-[#111827] block">
                  Select Video Input Device
                </label>
                <select
                  value={deviceState.selectedCameraId || ""}
                  onChange={(e) => handleTestCamera(e.target.value)}
                  className="w-full text-xs bg-white border border-[#E8D9CC] rounded-xl px-3 py-2 text-[#111827] focus:outline-none focus:border-[#E85D04] focus-visible:ring-2 focus-visible:ring-[#E85D04]"
                >
                  {deviceState.cameras.map((cam) => (
                    <option key={cam.deviceId} value={cam.deviceId}>
                      {cam.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Error display */}
            {deviceState.cameraError && (
              <div className="max-w-xl mx-auto bg-rose-50 border border-rose-300 rounded-2xl p-3 text-xs text-rose-800">
                <strong>Camera Error:</strong> {deviceState.cameraError}
              </div>
            )}

            {/* Action Row */}
            <div className="max-w-xl mx-auto pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleTestCamera(deviceState.selectedCameraId || undefined)}
                disabled={isTestingCamera}
                className={`w-full sm:w-auto px-5 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04] ${
                  isCameraReady
                    ? "bg-white hover:bg-slate-50 text-[#111827] border border-[#E8D9CC] hover:border-slate-300"
                    : "bg-[#E85D04] hover:bg-[#C84F04] text-white font-bold shadow-md shadow-orange-500/20"
                }`}
              >
                <RefreshCw size={13} className={isTestingCamera ? "animate-spin" : ""} />
                <span>
                  {isCameraReady
                    ? "Re-check Camera"
                    : isTestingCamera
                    ? "Requesting Access..."
                    : "Allow & Test Camera"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                disabled={!isCameraReady}
                className={`w-full sm:w-auto px-6 py-2.5 min-h-[44px] rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04] ${
                  isCameraReady
                    ? "bg-[#E85D04] hover:bg-[#C84F04] text-white shadow-md shadow-orange-500/20 cursor-pointer"
                    : "bg-white text-slate-500 border border-[#E8D9CC] cursor-not-allowed"
                }`}
              >
                <span>Continue to Microphone Setup</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 2: MICROPHONE SETUP CARD */}
        {/* ============================================================== */}
        {currentStep === 2 && (
          <div className="bg-white border border-[#E8D9CC] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8D9CC] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#FFFCF8] border border-[#E8D9CC] text-[#E85D04] flex items-center justify-center font-bold">
                  <Mic size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#111827]">Step 2: Microphone & Audio Calibration</h2>
                  <p className="text-xs text-[#64748B]">
                    Verify that your microphone captures crisp audio and live voice volume is detected.
                  </p>
                </div>
              </div>

              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border self-start sm:self-auto ${
                  isMicReady
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                    : "bg-amber-50 text-amber-800 border-amber-300"
                }`}
              >
                {isMicReady ? "✓ Mic Verified" : "Action Required"}
              </span>
            </div>

            {/* Acoustic Meter Viewport */}
            <div className="w-full max-w-xl mx-auto h-72 sm:h-80 rounded-2xl bg-[#FFFCF8] p-6 border-2 border-[#E8D9CC] flex flex-col justify-between shadow-inner">
              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#E85D04]">
                  Acoustic Decibel Activity
                </span>
                <span className="font-mono font-bold text-sm bg-white px-3 py-1 rounded-lg border border-[#E8D9CC] text-[#111827]">
                  {deviceState.audioLevel}% Volume
                </span>
              </div>

              {/* Large Dynamic Equalizer Bars */}
              <div className="flex items-end justify-center gap-2 h-36 my-auto">
                {[0.3, 0.6, 0.9, 1.3, 1.6, 1.4, 1.1, 0.8, 0.5, 0.9, 1.4, 1.2, 0.7, 0.4].map(
                  (multiplier, idx) => {
                    const barHeight = deviceState.isMicrophoneReady
                      ? Math.max(
                          8,
                          Math.min(
                            110,
                            Math.round(
                              ((deviceState.audioLevel * multiplier) / 100) * 110
                            )
                          )
                        )
                      : 8;

                    const isLit =
                      deviceState.isMicrophoneReady && deviceState.audioLevel > 6;

                    return (
                      <div
                        key={idx}
                        style={{ height: `${barHeight}px` }}
                        className={`w-3 sm:w-3.5 rounded-full transition-all duration-75 ${
                          isLit
                            ? "bg-gradient-to-t from-emerald-600 to-[#E85D04] shadow-sm shadow-emerald-500/40"
                            : deviceState.isMicrophoneReady
                            ? "bg-emerald-200"
                            : "bg-[#E8D9CC]"
                        }`}
                      />
                    );
                  }
                )}
              </div>

              {/* Status prompt */}
              <div className="text-center">
                {isMicReady ? (
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-300">
                    <CheckCircle2 size={14} className="text-emerald-700" />
                    <span>Live Voice Input Detected & Verified</span>
                  </div>
                ) : deviceState.isMicrophoneReady ? (
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 text-amber-900 border border-amber-300 text-xs font-semibold animate-pulse">
                    <span>🗣️</span>
                    <span>Speak into your mic (say &quot;Testing, 1 2 3&quot;) to verify audio levels...</span>
                  </div>
                ) : (
                  <span className="text-xs text-[#64748B]">
                    Click &quot;Allow & Test Microphone&quot; below to enable audio detection.
                  </span>
                )}
              </div>
            </div>

            {/* Mic selector if multiple */}
            {deviceState.microphones.length > 1 && (
              <div className="max-w-xl mx-auto space-y-1.5">
                <label className="text-xs font-semibold text-[#111827] block">
                  Select Audio Input Device
                </label>
                <select
                  value={deviceState.selectedMicrophoneId || ""}
                  onChange={(e) => handleTestMic(e.target.value)}
                  className="w-full text-xs bg-white border border-[#E8D9CC] rounded-xl px-3 py-2 text-[#111827] focus:outline-none focus:border-[#E85D04] focus-visible:ring-2 focus-visible:ring-[#E85D04]"
                >
                  {deviceState.microphones.map((mic) => (
                    <option key={mic.deviceId} value={mic.deviceId}>
                      {mic.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Error display */}
            {deviceState.microphoneError && (
              <div className="max-w-xl mx-auto bg-rose-50 border border-rose-300 rounded-2xl p-3 text-xs text-rose-800">
                <strong>Microphone Error:</strong> {deviceState.microphoneError}
              </div>
            )}

            {/* Action Row */}
            <div className="max-w-xl mx-auto pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-[#111827] border border-[#E8D9CC] hover:border-slate-300 transition cursor-pointer flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04]"
              >
                <ArrowLeft size={13} />
                <span>Back to Camera</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleTestMic(deviceState.selectedMicrophoneId || undefined)}
                  disabled={isTestingMic}
                  className="px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-[#111827] border border-[#E8D9CC] hover:border-slate-300 transition cursor-pointer flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04]"
                >
                  <RefreshCw size={13} className={isTestingMic ? "animate-spin" : ""} />
                  <span>{isTestingMic ? "Listening..." : "Re-test Mic"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  disabled={!isMicReady}
                  className={`flex-1 sm:flex-none px-6 py-2.5 min-h-[44px] rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04] ${
                    isMicReady
                      ? "bg-[#E85D04] hover:bg-[#C84F04] text-white shadow-md shadow-orange-500/20 cursor-pointer"
                      : "bg-white text-slate-500 border border-[#E8D9CC] cursor-not-allowed"
                  }`}
                >
                  <span>Continue to Screen Sharing</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 3: SCREEN SHARING SETUP CARD */}
        {/* ============================================================== */}
        {currentStep === 3 && (
          <div className="bg-white border border-[#E8D9CC] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8D9CC] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#FFFCF8] border border-[#E8D9CC] text-[#E85D04] flex items-center justify-center font-bold">
                  <Monitor size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#111827]">Step 3: Screen Share Calibration</h2>
                  <p className="text-xs text-[#64748B]">
                    Share your Entire Screen so AI proctoring and code evaluation can observe your workspace.
                  </p>
                </div>
              </div>

              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border self-start sm:self-auto ${
                  isScreenReady
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                    : isSingleWindowShared
                    ? "bg-amber-50 text-amber-900 border-amber-300"
                    : "bg-amber-50 text-amber-800 border-amber-300"
                }`}
              >
                {isScreenReady
                  ? "✓ Entire Screen Verified"
                  : isSingleWindowShared
                  ? "⚠️ Single Window Detected"
                  : "Action Required"}
              </span>
            </div>

            {/* Screen Share Preview Container */}
            <div className="w-full max-w-xl mx-auto h-72 sm:h-80 rounded-2xl bg-[#FFFCF8] overflow-hidden relative border-2 border-[#E8D9CC] flex items-center justify-center shadow-inner">
              <video
                ref={screenVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-contain ${
                  deviceState.isScreenReady ? "block" : "hidden"
                }`}
              />

              {!deviceState.isScreenReady && (
                <div className="text-center p-6 space-y-3">
                  <Monitor size={36} className="text-gray-500 mx-auto" />
                  <p className="text-sm font-semibold text-gray-300">
                    Screen is not shared yet.
                  </p>
                  <p className="text-xs text-gray-400 max-w-sm">
                    Click &quot;Share Screen&quot; below and select your <strong>Entire Screen</strong> when the browser prompt appears.
                  </p>
                </div>
              )}

              {/* Status Badges Overlay */}
              {deviceState.isScreenReady && (
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  {isScreenReady ? (
                    <div className="bg-emerald-600/90 text-[#111827] text-xs font-mono px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-md backdrop-blur-xs">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      <span>Entire Screen Verified</span>
                    </div>
                  ) : (
                    <div className="bg-amber-600/90 text-[#111827] text-xs font-mono px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-md backdrop-blur-xs">
                      <AlertTriangle size={12} />
                      <span>Window Only (Change Required)</span>
                    </div>
                  )}
                </div>
              )}

              {/* Live AI Proctoring HUD Overlay Banner */}
              {isScreenReady && (
                <div className="absolute bottom-3 left-3 right-3 bg-[#0E0C08]/85 border border-emerald-500/40 backdrop-blur-md px-3 py-2 rounded-xl text-xs text-[#111827] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="font-bold text-emerald-400">AI Proctoring Active:</span>
                    <span className="text-slate-300 text-[11px]">Workspace Monitored • Clean</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold uppercase">Real-Time</span>
                </div>
              )}
            </div>

            {/* Single Window / Tab Warning Banner */}
            {isSingleWindowShared && (
              <div className="max-w-xl mx-auto bg-amber-50 border-2 border-amber-400/80 rounded-2xl p-4 text-xs text-amber-950 space-y-2 shadow-xs">
                <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
                  <AlertTriangle size={16} className="text-amber-600" />
                  <span>Entire Screen Required for AI Proctoring</span>
                </div>
                <p className="text-xs leading-relaxed text-amber-900/90">
                  You shared a <strong>Single Window or Browser Tab</strong>. TopPlaced AI proctoring requires sharing your <strong>Entire Screen</strong> so code editor, terminal, and browser activities can be verified without blind spots.
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleTestScreen}
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs"
                  >
                    Change to Entire Screen
                  </button>
                </div>
              </div>
            )}

            {/* Important Guidance Note */}
            {!isSingleWindowShared && (
              <div className="max-w-xl mx-auto bg-white border border-[#E8D9CC] rounded-2xl p-3.5 text-xs text-[#64748B] space-y-1">
                <div className="flex items-center gap-2 font-bold text-[#111827]">
                  <Info size={14} className="text-[#E85D04]" />
                  <span>AI Screen Integrity & Proctoring Protection</span>
                </div>
                <p className="text-[11.5px] leading-relaxed text-[#64748B]">
                  During the interview, AI vision monitors for unauthorized AI tools (ChatGPT, Claude), search queries for answers, and screen recording software (OBS, Loom). Stopping sharing during an active interview triggers an audit infraction.
                </p>
              </div>
            )}

            {/* Error display */}
            {deviceState.screenError && (
              <div className="max-w-xl mx-auto bg-rose-50 border border-rose-300 rounded-2xl p-3 text-xs text-rose-800">
                <strong>Screen Share Notice:</strong> {deviceState.screenError}
              </div>
            )}

            {/* Action Row */}
            <div className="max-w-xl mx-auto pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-[#111827] border border-[#E8D9CC] hover:border-slate-300 transition cursor-pointer flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04]"
              >
                <ArrowLeft size={13} />
                <span>Back to Mic</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {isScreenReady ? (
                  <button
                    type="button"
                    onClick={handleStopScreen}
                    className="px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                  >
                    Change Screen
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleTestScreen}
                    disabled={isTestingScreen}
                    className="px-5 py-2.5 min-h-[44px] rounded-xl text-xs font-bold bg-[#E85D04] hover:bg-[#C84F04] text-white shadow-md shadow-orange-500/20 transition cursor-pointer flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04]"
                  >
                    <Monitor size={14} />
                    <span>{isTestingScreen ? "Opening Prompt..." : "Share Screen"}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onStartInterview}
                  disabled={!isMandatorySetupPassed || isStarting}
                  className={`flex-1 sm:flex-none px-8 py-3 min-h-[44px] rounded-xl text-xs font-bold transition flex items-center justify-center gap-2.5 shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04] ${
                    isMandatorySetupPassed && !isStarting
                      ? "bg-gradient-to-r from-[#E85D04] to-[#E85D04] hover:from-[#C84F04] hover:to-[#E85D04] text-white shadow-md shadow-orange-500/20 cursor-pointer"
                      : "bg-white text-slate-500 border border-[#E8D9CC] cursor-not-allowed shadow-none"
                  }`}
                >
                  {isStarting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                      <span>Launching Proctored Session...</span>
                    </>
                  ) : (
                    <>
                      <Play size={15} className="fill-current" />
                      <span>Start Interview 🚀</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* INTERVIEW INSTRUCTIONS & GUIDELINES ACCORDION / FOOTER */}
        {/* ============================================================== */}
        <div className="bg-white border border-[#E8D9CC] rounded-3xl p-6 shadow-sm space-y-4 text-[#111827]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E8D9CC]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FFFCF8] border border-[#E8D9CC] flex items-center justify-center text-[#E85D04]">
                <FileText size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                  <span>Mandatory Interview Instructions & Guidelines</span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#FFFCF8] text-[#E85D04] border border-[#E8D9CC] uppercase">
                    Read Before Starting
                  </span>
                </h3>
              </div>
            </div>

            <span className="text-xs font-mono font-semibold text-rose-700 bg-rose-50 px-3 py-1 rounded-lg border border-rose-200">
              Strict 3 Warnings Policy
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-[#FFFCF8] border border-[#E8D9CC] rounded-xl p-3.5 space-y-1.5">
              <div className="w-7 h-7 rounded-lg bg-[#FFFCF8] border border-[#E8D9CC] text-[#E85D04] flex items-center justify-center">
                <Camera size={14} />
              </div>
              <h4 className="text-xs font-bold text-[#111827]">1. Face Centered</h4>
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                Stay centered in your webcam frame with good front lighting throughout.
              </p>
            </div>

            <div className="bg-[#FFFCF8] border border-[#E8D9CC] rounded-xl p-3.5 space-y-1.5">
              <div className="w-7 h-7 rounded-lg bg-[#FFFCF8] border border-[#E8D9CC] text-[#E85D04] flex items-center justify-center">
                <Lock size={14} />
              </div>
              <h4 className="text-xs font-bold text-[#111827]">2. Fullscreen Lock</h4>
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                The session operates in locked fullscreen. Tab switches trigger warnings.
              </p>
            </div>

            <div className="bg-[#FFFCF8] border border-[#E8D9CC] rounded-xl p-3.5 space-y-1.5">
              <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
                <AlertCircle size={14} />
              </div>
              <h4 className="text-xs font-bold text-[#111827]">3. No Extra Devices</h4>
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                Phones, earphones, notes, or external monitors are prohibited.
              </p>
            </div>

            <div className="bg-[#FFFCF8] border border-[#E8D9CC] rounded-xl p-3.5 space-y-1.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                <Volume2 size={14} />
              </div>
              <h4 className="text-xs font-bold text-[#111827]">4. Quiet Room</h4>
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                Sit in a quiet space without background voices for clear audio transcription.
              </p>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-1.5">
              <div className="w-7 h-7 rounded-lg bg-rose-100 border border-rose-200 text-rose-700 flex items-center justify-center">
                <AlertTriangle size={14} />
              </div>
              <h4 className="text-xs font-bold text-rose-800">5. No Screen Recording</h4>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                Screen recording or capture software will instantly cancel the interview.
              </p>
            </div>
          </div>
        </div>

        {/* Privacy & Zero-Prompt Guarantee */}
        <div className="bg-white border border-[#E8D9CC] rounded-2xl p-4 sm:p-5 text-xs text-[#64748B] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={18} className="text-[#E85D04] shrink-0" />
            <p className="text-[11.5px] leading-relaxed text-[#64748B]">
              Verified media tracks transfer seamlessly into your interview session without repeated browser permission prompts. Real-time AI evaluation guarantees zero storage of raw private streams.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
