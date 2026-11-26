"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, AlertTriangle, ShieldCheck, Mic, MicOff, SunMedium } from "lucide-react";
import { getSharedVisionPipeline } from "@/lib/proctoring/ComputerVisionPipeline";
import { CameraQualityMetrics } from "@/lib/proctoring/types";

interface CameraCalibrationModalProps {
  isOpen: boolean;
  onProceed: () => void;
  onCancel?: () => void;
}

export default function CameraCalibrationModal({
  isOpen,
  onProceed,
  onCancel,
}: CameraCalibrationModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [micAvailable, setMicAvailable] = useState<boolean>(false);
  const [quality, setQuality] = useState<CameraQualityMetrics>({
    score: 85,
    brightness: 70,
    sharpness: 90,
    faceVisibility: 95,
    faceCentered: true,
    onePersonVisible: true,
    recommendations: ["Position yourself comfortably in the center of the camera."],
  });
  const [isCalibrating, setIsCalibrating] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let activeStream: MediaStream | null = null;
    let micStream: MediaStream | null = null;
    const pipeline = getSharedVisionPipeline();
    pipeline.init().catch((e: any) => console.warn("[Calibration] CV init:", e));

    async function initDevices() {
      // 1. Initialize Camera
      try {
        setCameraError(null);
        const s = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        activeStream = s;
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      } catch (err: any) {
        setCameraError("Camera access is required for this interview. Please grant camera permission.");
      }

      // 2. Check Microphone
      try {
        setMicError(null);
        const m = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStream = m;
        setMicAvailable(true);
      } catch (err: any) {
        setMicAvailable(false);
        setMicError("Microphone access is required for voice responses. Please grant microphone permission.");
      }
    }

    initDevices();

    const interval = setInterval(() => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        const result = pipeline.analyzeFrame(videoRef.current);
        if (result) {
          setQuality(result.quality);
          setIsCalibrating(false);
        }
      }
    }, 300);

    return () => {
      clearInterval(interval);
      if (activeStream) {
        activeStream.getTracks().forEach((t) => {
          t.stop();
          t.enabled = false;
        });
      }
      if (micStream) {
        micStream.getTracks().forEach((t) => {
          t.stop();
          t.enabled = false;
        });
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Strict 6 Gate Criteria
  const isCameraConnected = Boolean(stream && !cameraError);
  const isOneFaceDetected = quality.onePersonVisible && quality.faceVisibility > 25;
  const isFaceSufficientlyVisible = quality.faceVisibility >= 50 && quality.faceCentered;
  const isCameraUnobstructed = !quality.isObstructed && quality.brightness > 15;
  const isLightingAdequate = quality.brightness >= 25 && quality.brightness <= 85;
  const isMicReady = micAvailable && !micError;

  const allPassed =
    isCameraConnected &&
    isOneFaceDetected &&
    isFaceSufficientlyVisible &&
    isCameraUnobstructed &&
    isLightingAdequate &&
    isMicReady;

  // Specific actionable advice if not ready
  let gateProblem = "";
  if (!isCameraConnected) {
    gateProblem = "Camera not detected. Please connect or grant camera permissions.";
  } else if (!isMicReady) {
    gateProblem = "Microphone unavailable. Please grant microphone access to proceed.";
  } else if (quality.faceVisibility < 25) {
    gateProblem = "No face detected. Please move directly into the camera frame.";
  } else if (!quality.onePersonVisible) {
    gateProblem = "Multiple people detected. Only one candidate is allowed in frame.";
  } else if (!isFaceSufficientlyVisible) {
    gateProblem = "Face partially hidden or off-center. Please center your face in view.";
  } else if (quality.isObstructed || quality.brightness <= 15) {
    gateProblem = "Camera is obstructed or too dark. Please remove any objects in front of the lens.";
  } else if (!isLightingAdequate) {
    gateProblem = quality.brightness < 25
      ? "Lighting is too dark. Please increase room lighting."
      : "Lighting is too bright or washed out. Please adjust your light source.";
  }

  return (
    <div className="fixed inset-0 z-[150] bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white border border-[#F1D2B8] rounded-2xl max-w-xl w-full p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#F1D2B8] mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[#FFF0E6] text-[#F26A0A] border border-[#F1D2B8]">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#302016]">Interview Security Pre-Check</h3>
              <p className="text-xs text-[#68574B]">Strict mode environment & hardware verification</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-[#64748B] block font-mono">Status</span>
            <span
              className={`text-xs font-bold font-mono px-2.5 py-0.5 rounded-full ${
                allPassed ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              {allPassed ? "VERIFIED" : "ACTION REQUIRED"}
            </span>
          </div>
        </div>

        {/* Video Preview */}
        <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-video border border-[#F1D2B8] mb-4 shadow-inner">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Guide Overlay */}
          <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-[#F26A0A]/30 rounded-xl m-8 flex items-center justify-center">
            <div className="w-28 h-36 rounded-full border border-[#F26A0A]/20"></div>
          </div>

          <div className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-sm px-2.5 py-1 rounded-md text-xs flex items-center space-x-2 text-slate-200 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Live Security Preview</span>
          </div>
        </div>

        {/* Actionable Issue Banner */}
        {!allPassed && gateProblem && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start space-x-2 animate-pulse">
            <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 font-bold">Action Required Before Starting</p>
              <p>{gateProblem}</p>
            </div>
          </div>
        )}

        {/* 6 Hard Checklist Requirements */}
        <div className="grid grid-cols-2 gap-2 text-xs mb-4">
          <div className="flex items-center space-x-2 p-2 rounded-xl bg-[#F7EFE5] border border-[#F1D2B8]">
            {isCameraConnected ? (
              <CheckCircle2 size={14} className="text-emerald-400" />
            ) : (
              <AlertTriangle size={14} className="text-rose-400" />
            )}
            <span className="text-[#334155]">1. Camera Connected</span>
          </div>

          <div className="flex items-center space-x-2 p-2 rounded-xl bg-[#F7EFE5] border border-[#F1D2B8]">
            {isOneFaceDetected ? (
              <CheckCircle2 size={14} className="text-emerald-400" />
            ) : (
              <AlertTriangle size={14} className="text-amber-400" />
            )}
            <span className="text-[#334155]">2. Exactly 1 Person</span>
          </div>

          <div className="flex items-center space-x-2 p-2 rounded-xl bg-[#F7EFE5] border border-[#F1D2B8]">
            {isFaceSufficientlyVisible ? (
              <CheckCircle2 size={14} className="text-emerald-400" />
            ) : (
              <AlertTriangle size={14} className="text-amber-400" />
            )}
            <span className="text-[#334155]">3. Face Fully Visible</span>
          </div>

          <div className="flex items-center space-x-2 p-2 rounded-xl bg-[#F7EFE5] border border-[#F1D2B8]">
            {isCameraUnobstructed ? (
              <CheckCircle2 size={14} className="text-emerald-400" />
            ) : (
              <AlertTriangle size={14} className="text-rose-400" />
            )}
            <span className="text-[#334155]">4. Lens Unobstructed</span>
          </div>

          <div className="flex items-center space-x-2 p-2 rounded-xl bg-[#F7EFE5] border border-[#F1D2B8]">
            {isLightingAdequate ? (
              <CheckCircle2 size={14} className="text-emerald-400" />
            ) : (
              <AlertTriangle size={14} className="text-amber-400" />
            )}
            <span className="text-[#334155]">5. Adequate Lighting</span>
          </div>

          <div className="flex items-center space-x-2 p-2 rounded-xl bg-[#F7EFE5] border border-[#F1D2B8]">
            {isMicReady ? (
              <CheckCircle2 size={14} className="text-emerald-400" />
            ) : (
              <AlertTriangle size={14} className="text-rose-400" />
            )}
            <span className="text-[#334155]">6. Microphone Available</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl border border-white/10 text-[#334155] hover:bg-white/[0.05] text-xs font-semibold transition"
            >
              Cancel
            </button>
          )}
          <button
            onClick={() => {
              if (stream) {
                stream.getTracks().forEach((t) => {
                  t.stop();
                  t.enabled = false;
                });
              }
              if (videoRef.current) {
                videoRef.current.srcObject = null;
              }
              onProceed();
            }}
            disabled={!allPassed}
            className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition ${
              allPassed
                ? "bg-gradient-to-r from-[#F26A0A] to-[#E85D04] hover:from-[#C84F04] hover:to-[#F26A0A] text-white shadow-md shadow-orange-500/20 cursor-pointer"
                : "bg-slate-800 text-slate-500 cursor-not-allowed opacity-60"
            }`}
          >
            <span>{allPassed ? "Start Proctored Interview" : "Resolve Issues to Begin"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
