"use client";

import React, { useState } from "react";
import { Lock, AlertTriangle, Volume2, RefreshCw } from "lucide-react";
import CameraCalibrationModal from "@/components/proctoring/CameraCalibrationModal";
import ProctoringWarningModal from "@/components/proctoring/ProctoringWarningModal";
import { enterFullscreen, isDocumentFullscreen } from "@/lib/proctoring/fullscreenHelper";

export interface InterviewModalsProps {
  isFullscreenLocked: boolean;
  interviewStarted: boolean;
  interviewCompleted: boolean;
  setIsFullscreenLocked: (locked: boolean) => void;
  activeWarningModal: any;
  acknowledgeWarning: () => void;
  isTerminated: boolean;
  onTerminate: () => void;
  showCalibrationModal: boolean;
  setShowCalibrationModal: (show: boolean) => void;
  setHasCalibrated: (calibrated: boolean) => void;
  unlockBrowserAudio: () => void;
  isWindowLockedOut: boolean;
  proctorViolationCount: number;
  unlockWindow: () => void;
  isConnectionSuspended: boolean;
  reconnectCountdown: number;
  showStartingPopup: boolean;
  setShowStartingPopup: (show: boolean) => void;
  startError: string | null;
  onRetryStart: () => void;
  isStartingInterview: boolean;
  sessionId: string;
  popupTimer: number;
  onStartNowModalClick: () => void;
  onDismissStartingPopup: () => void;
  showConfirmEnd: boolean;
  setShowConfirmEnd: (show: boolean) => void;
  isFreeInterview: boolean;
  onConfirmEnd: () => void;
  isEndingInterview: boolean;
  isAutoplayBlocked: boolean;
  onEnableVoiceClick: () => void;
}

export function InterviewModals({
  isFullscreenLocked,
  interviewStarted,
  interviewCompleted,
  setIsFullscreenLocked,
  activeWarningModal,
  acknowledgeWarning,
  isTerminated,
  onTerminate,
  showCalibrationModal,
  setShowCalibrationModal,
  setHasCalibrated,
  unlockBrowserAudio,
  isWindowLockedOut,
  proctorViolationCount,
  unlockWindow,
  isConnectionSuspended,
  reconnectCountdown,
  showStartingPopup,
  setShowStartingPopup,
  startError,
  onRetryStart,
  isStartingInterview,
  sessionId,
  popupTimer,
  onStartNowModalClick,
  onDismissStartingPopup,
  showConfirmEnd,
  setShowConfirmEnd,
  isFreeInterview,
  onConfirmEnd,
  isEndingInterview,
  isAutoplayBlocked,
  onEnableVoiceClick,
}: InterviewModalsProps) {
  const [relockError, setRelockError] = useState<string | null>(null);
  const [isRelocking, setIsRelocking] = useState(false);

  const handleReLockWindow = async () => {
    setIsRelocking(true);
    setRelockError(null);
    try {
      const success = await enterFullscreen();
      if (success || isDocumentFullscreen()) {
        setIsFullscreenLocked(true);
        setRelockError(null);
        if (unlockWindow) {
          unlockWindow();
        }
      } else {
        setRelockError("Fullscreen request was denied or blocked. Please grant permissions and click to retry.");
      }
    } catch (err: any) {
      setRelockError(err?.message || "Failed to enter fullscreen mode. Please try again.");
    } finally {
      setIsRelocking(false);
    }
  };

  return (
    <>
      {/* Proctoring Sticky Header if Window Unlocked */}
      {!isFullscreenLocked && interviewStarted && !interviewCompleted && (
        <div className="shrink-0 bg-rose-50 border-b border-rose-200 text-rose-700 px-4 py-2.5 text-center text-xs font-semibold flex flex-wrap items-center justify-between gap-2 z-50 shadow-xs">
          <div className="flex items-center space-x-2">
            <Lock size={14} className="text-rose-600 animate-pulse shrink-0" />
            <span>
              {relockError ? relockError : "Window Lock Broken: Fullscreen Exited! Suspicious activity is being recorded in your audit timeline."}
            </span>
          </div>
          <button
            onClick={handleReLockWindow}
            disabled={isRelocking}
            className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded-lg text-xs font-semibold transition shadow-xs cursor-pointer flex items-center space-x-1.5 disabled:opacity-60"
          >
            {isRelocking && <RefreshCw size={12} className="animate-spin" />}
            <span>{isRelocking ? "Locking..." : relockError ? "Retry Re-Lock" : "Re-Lock Window"}</span>
          </button>
        </div>
      )}

      {/* 3-Warning Proctoring System Modal */}
      <ProctoringWarningModal
        modalData={activeWarningModal}
        onAcknowledge={() => {
          acknowledgeWarning();
          if (isTerminated) {
            onTerminate();
          }
        }}
      />

      {/* Pre-Interview Camera Calibration & Quality Check Modal */}
      <CameraCalibrationModal
        isOpen={showCalibrationModal && !interviewStarted}
        onProceed={() => {
          unlockBrowserAudio();
          setShowCalibrationModal(false);
          setHasCalibrated(true);
        }}
        onCancel={() => {
          unlockBrowserAudio();
          setShowCalibrationModal(false);
          setHasCalibrated(true);
        }}
      />

      {/* Security Focus Lockout Modal (Window/Tab Switched) */}
      {isWindowLockedOut && interviewStarted && !interviewCompleted && (
        <div className="fixed inset-0 z-[120] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8D9CC] rounded-2xl max-w-lg w-full p-6 sm:p-8 text-center shadow-xl">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center text-2xl font-bold">
              🔒
            </div>
            <h2 className="text-xl font-bold text-[#111827] mb-2 tracking-tight">
              Window Focus Required
            </h2>
            <p className="text-[#64748B] text-xs sm:text-sm mb-5 leading-relaxed">
              Window switching, minimizing the browser, or tab navigation has been logged in your audit timeline. Please return to fullscreen mode to continue.
            </p>
            <div className="bg-[#FFFCF8] border border-[#E8D9CC] rounded-xl p-3.5 mb-6 text-xs text-[#475569] text-left space-y-1.5">
              <p className="font-bold text-[#111827]">
                Total Proctoring Events: {proctorViolationCount}
              </p>
              <p>• All window blur and focus changes are recorded with timestamps for reviewer context.</p>
              <p>• Re-locking fullscreen allows you to continue your responses without interruption.</p>
            </div>
            <button
              onClick={async () => {
                if (unlockWindow) {
                  await unlockWindow();
                }
                const isFs = isDocumentFullscreen();
                if (isFs) {
                  setIsFullscreenLocked(true);
                } else {
                  const entered = await enterFullscreen();
                  if (entered || isDocumentFullscreen()) {
                    setIsFullscreenLocked(true);
                  }
                }
              }}
              className="w-full py-3 bg-gradient-to-r from-[#E85D04] to-[#E85D04] hover:from-[#C84F04] hover:to-[#E85D04] text-white font-bold rounded-xl transition shadow-md shadow-orange-500/20 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>🔒 Re-Lock Window & Resume Interview</span>
            </button>
          </div>
        </div>
      )}

      {/* Network & Hardware Connection Interrupted Modal */}
      {isConnectionSuspended && interviewStarted && !interviewCompleted && (
        <div className="fixed inset-0 z-[130] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8D9CC] rounded-2xl max-w-lg w-full p-6 sm:p-8 text-center shadow-xl space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center text-2xl font-bold animate-pulse">
              📡
            </div>
            <h2 className="text-xl font-bold text-[#111827] tracking-tight">
              Connection Interrupted
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
              Network or webcam stream disconnected. Interview timer is <strong>paused</strong>. Reconnecting in:
            </p>
            <div className="text-4xl font-extrabold text-[#E85D04] font-mono">
              {reconnectCountdown}s
            </div>
            <p className="text-xs text-slate-400">
              Evaluation audio and questions are paused until connection resumes.
            </p>
          </div>
        </div>
      )}

      {/* Starting Popup */}
      {showStartingPopup && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8D9CC] rounded-2xl w-full max-w-md p-6 sm:p-8 text-center shadow-xl">
            {startError ? (
              <div className="space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center text-xl">
                  ⚠️
                </div>
                <h3 className="text-lg font-bold text-[#111827]">Could Not Start Interview</h3>
                <p className="text-[#64748B] text-xs leading-relaxed">{startError}</p>
                <div className="flex space-x-2 pt-2">
                  <button
                    onClick={onRetryStart}
                    className="flex-1 bg-gradient-to-r from-[#E85D04] to-[#E85D04] hover:from-[#C84F04] hover:to-[#E85D04] text-white text-xs font-bold py-2.5 rounded-xl transition shadow-md shadow-orange-500/20 cursor-pointer"
                  >
                    Retry Start
                  </button>
                  <button
                    onClick={() => setShowStartingPopup(false)}
                    className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-[#E8D9CC] text-[#334155] text-xs font-semibold rounded-xl transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-[#E85D04] border-t-transparent animate-spin flex items-center justify-center">
                  <span className="text-lg font-bold text-[#E85D04] font-mono">
                    {popupTimer > 0 ? popupTimer : "..."}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#111827] mb-2 tracking-tight">
                  {isStartingInterview && !sessionId ? "Preparing your interview..." : "Starting your interview..."}
                </h3>
                <p className="text-[#64748B] text-xs sm:text-sm mb-6 leading-relaxed">
                  {isStartingInterview && !sessionId
                    ? "Our AI interviewer is creating your personalized questions. Please ensure your camera and microphone are ready."
                    : "Please ensure your camera is enabled, your face is centered, and your microphone is ready."}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={onDismissStartingPopup}
                    className="text-xs font-semibold text-[#64748B] hover:text-[#111827] px-4 py-2.5 rounded-xl border border-[#E8D9CC] hover:bg-slate-50 transition cursor-pointer"
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    onClick={onStartNowModalClick}
                    className="text-xs text-white bg-gradient-to-r from-[#E85D04] to-[#E85D04] hover:from-[#C84F04] hover:to-[#E85D04] px-5 py-2.5 rounded-xl transition font-bold shadow-md shadow-orange-500/20 cursor-pointer flex items-center gap-2"
                  >
                    {isStartingInterview && !sessionId ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin inline-block" />
                        Enter Session
                      </>
                    ) : (
                      "Start Now"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm End Interview Modal */}
      {showConfirmEnd && (
        <div className="fixed inset-0 z-[90] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8D9CC] rounded-2xl w-full max-w-md p-6 sm:p-7 shadow-xl">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-800/60 text-amber-400 flex items-center justify-center mr-3 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-lg font-bold text-[#111827] tracking-tight">
                Confirm End Interview
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-[#64748B] mb-5 leading-relaxed">
              Are you sure you want to end this interview now?
              {!isFreeInterview
                ? " Your interview evaluation scorecard will be compiled based on the questions answered so far."
                : " This session is part of your free interview quota."}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowConfirmEnd(false)}
                className="flex-1 px-4 py-2.5 bg-white hover:bg-slate-50 border border-[#E8D9CC] text-[#334155] font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmEnd(false);
                  onConfirmEnd();
                }}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl transition shadow-xs cursor-pointer"
              >
                Yes, End Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instant Ending & Transition Overlay */}
      {isEndingInterview && (
        <div className="fixed inset-0 z-[150] bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 border-4 border-[#E85D04] border-t-transparent rounded-full animate-spin mb-4"></div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#111827] mb-2 tracking-tight">
            Finalizing Interview & Compiling Results...
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] max-w-md leading-relaxed">
            Securing your audio transcript, proctoring audit, and competency scorecard. Redirecting...
          </p>
        </div>
      )}

      {/* Browser Autoplay Blocked Notification Banner */}
      {isAutoplayBlocked && (
        <button
          type="button"
          onClick={onEnableVoiceClick}
          className="shrink-0 w-full bg-amber-50 border-b border-amber-200 text-amber-900 py-2.5 px-4 text-xs font-semibold flex items-center justify-between shadow-2xs transition hover:bg-amber-100/80 cursor-pointer z-50 sticky top-0"
        >
          <span className="flex items-center gap-2">
            <Volume2 size={16} className="text-amber-600 animate-pulse" />
            <span>Audio permission required: Click here to hear the AI interviewer speak your question.</span>
          </span>
          <span className="bg-[#E85D04] text-white px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-xs">
            Enable Voice
          </span>
        </button>
      )}
    </>
  );
}

export default InterviewModals;
