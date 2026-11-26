"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  Clock,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
  Download,
  Settings,
  Code,
  Layers,
  Phone,
} from "lucide-react";
import Logo from "@/components/Logo";

export interface InterviewHeaderControlsProps {
  roleTitle: string;
  levelTitle: string;
  timeRemaining: number;
  formatTime: (time: number) => string;
  isMicOn: boolean;
  toggleMic: () => void;
  isCameraOn: boolean;
  toggleCamera: () => void;
  isScreenSharing: boolean;
  isMuted: boolean;
  toggleMute: () => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  downloadTranscript: () => void;
  showDebugPanel: boolean;
  setShowDebugPanel: React.Dispatch<React.SetStateAction<boolean>>;
  hasCodeEditor: boolean;
  isTechCategory: boolean;
  showCodeEditor: boolean;
  setShowCodeEditor: (show: boolean) => void;
  showWhiteboard: boolean;
  setShowWhiteboard: (show: boolean) => void;
  technicalDrawerTab: "code" | "whiteboard";
  setTechnicalDrawerTab: (tab: "code" | "whiteboard") => void;
  isEndingInterview: boolean;
  onConfirmEndClick: () => void;
}

export function InterviewHeaderControls({
  roleTitle,
  levelTitle,
  timeRemaining,
  formatTime,
  isMicOn,
  toggleMic,
  isCameraOn,
  toggleCamera,
  isScreenSharing,
  isMuted,
  toggleMute,
  isFullscreen,
  toggleFullscreen,
  downloadTranscript,
  showDebugPanel,
  setShowDebugPanel,
  hasCodeEditor,
  isTechCategory,
  showCodeEditor,
  setShowCodeEditor,
  showWhiteboard,
  setShowWhiteboard,
  technicalDrawerTab,
  setTechnicalDrawerTab,
  isEndingInterview,
  onConfirmEndClick,
}: InterviewHeaderControlsProps) {
  return (
    <header className="shrink-0 bg-white/95 backdrop-blur-md border-b border-[#E8D9CC] px-4 sm:px-6 py-2.5 sm:py-3 sticky top-0 z-40 shadow-xs">
      <div className="max-w-none w-full mx-auto flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: TopPlaced Brand & Role Badge */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/learner" className="flex items-center group">
            <Logo size="sm" showBadge={false} variant="light" />
          </Link>

          {/* Center/Left: Interview Role & Difficulty */}
          <div className="hidden sm:flex items-center gap-2 pl-3 sm:pl-4 border-l border-[#E8D9CC]">
            <span className="px-2.5 py-1 rounded-full bg-[#FFFCF8] border border-[#E8D9CC] text-[#E85D04] font-semibold text-xs flex items-center gap-1.5">
              <Sparkles size={12} className="text-[#E85D04]" />
              <span>AI Interview</span>
            </span>
            <span className="text-xs font-bold text-[#111827]">
              {roleTitle}
            </span>
            <span className="text-[#64748B] text-xs">•</span>
            <span className="text-xs font-mono font-medium text-[#64748B] capitalize">
              {levelTitle}
            </span>
          </div>
        </div>

        {/* Right: Controls & End Interview */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Interview Timer */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#FFFCF8] border border-[#E8D9CC] shadow-2xs">
            <Clock size={15} className="text-[#E85D04]" />
            <span className="font-mono text-xs sm:text-sm font-bold tracking-wider text-[#111827]">
              {formatTime(timeRemaining)}
            </span>
          </div>

          {/* Mic Toggle */}
          <button
            onClick={toggleMic}
            aria-label={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
            className={`min-h-[44px] min-w-[44px] p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04] ${
              isMicOn
                ? "bg-[#FFFCF8] text-[#E85D04] border-[#E8D9CC] hover:bg-[#FFFCF8]/80"
                : "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
            }`}
            title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
          >
            {isMicOn ? <Mic size={16} /> : <MicOff size={16} />}
          </button>

          {/* Camera Toggle */}
          <button
            onClick={toggleCamera}
            aria-label={isCameraOn ? "Turn Camera Off" : "Turn Camera On"}
            className={`min-h-[44px] min-w-[44px] p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04] ${
              isCameraOn
                ? "bg-[#FFFCF8] text-[#E85D04] border-[#E8D9CC] hover:bg-[#FFFCF8]/80"
                : "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
            }`}
            title={isCameraOn ? "Turn Camera Off" : "Turn Camera On"}
          >
            {isCameraOn ? <Video size={16} /> : <VideoOff size={16} />}
          </button>

          {/* Screen Share Action Button */}
          <button
            onClick={() => {
              const el = document.getElementById("screen-share-card");
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
              }
            }}
            aria-label={isScreenSharing ? "Screen Share Active (Click to view)" : "Live Screen Sharing"}
            className={`min-h-[44px] min-w-[44px] p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04] ${
              isScreenSharing
                ? "bg-[#FFFCF8] text-[#E85D04] border-[#E8D9CC] shadow-2xs"
                : "bg-white text-[#64748B] border-[#E8D9CC] hover:bg-[#FFFCF8]"
            }`}
            title={isScreenSharing ? "Screen Share Active (Click to view)" : "Live Screen Sharing"}
          >
            <Monitor size={16} />
            {isScreenSharing && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse motion-reduce:animate-none" />
            )}
          </button>

          {/* Speaker Toggle */}
          <button
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute AI Voice" : "Mute AI Voice"}
            className={`min-h-[44px] min-w-[44px] p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04] ${
              !isMuted
                ? "bg-white text-[#64748B] border-[#E8D9CC] hover:bg-[#FFFCF8]"
                : "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
            }`}
            title={isMuted ? "Unmute AI Voice" : "Mute AI Voice"}
          >
            {!isMuted ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            className="hidden sm:inline-flex min-h-[44px] min-w-[44px] p-2 rounded-xl bg-white text-[#64748B] border border-[#E8D9CC] hover:bg-[#FFFCF8] transition-all cursor-pointer items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04]"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          {/* Download Transcript */}
          <button
            onClick={downloadTranscript}
            aria-label="Download Session Transcript"
            className="hidden md:inline-flex min-h-[44px] min-w-[44px] p-2 rounded-xl bg-white text-[#64748B] border border-[#E8D9CC] hover:bg-[#FFFCF8] transition-all cursor-pointer items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04]"
            title="Download Session Transcript"
          >
            <Download size={16} />
          </button>

          {/* Diagnostics / Settings Toggle */}
          <button
            onClick={() => setShowDebugPanel((prev) => !prev)}
            aria-label="Session Diagnostics"
            aria-expanded={showDebugPanel}
            className={`min-h-[44px] min-w-[44px] p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04] ${
              showDebugPanel
                ? "bg-[#FFFCF8] border-[#E8D9CC] text-[#E85D04]"
                : "bg-white text-[#64748B] border-[#E8D9CC] hover:bg-[#FFFCF8]"
            }`}
            title="Session Diagnostics"
          >
            <Settings size={16} />
          </button>

          {/* Technical Code Editor Toggle (Only for technical interviews) */}
          {hasCodeEditor && isTechCategory && (
            <button
              onClick={() => {
                setShowCodeEditor(!showCodeEditor);
                if (!showCodeEditor) setTechnicalDrawerTab("code");
              }}
              aria-label={showCodeEditor ? "Hide Code Editor" : "Show Code Editor"}
              aria-expanded={showCodeEditor}
              className={`min-h-[44px] min-w-[44px] p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04] ${
                showCodeEditor && technicalDrawerTab === "code"
                  ? "bg-gradient-to-r from-[#E85D04] to-[#E85D04] text-white font-bold border-transparent shadow-xs"
                  : "bg-white text-[#64748B] border-[#E8D9CC] hover:bg-[#FFFCF8]"
              }`}
              title={showCodeEditor ? "Hide Code Editor" : "Show Code Editor"}
            >
              <Code size={16} />
            </button>
          )}

          {/* System Design Whiteboard Toggle (Available for Technical & Architecture tracks) */}
          {isTechCategory && (
            <button
              onClick={() => {
                if (showWhiteboard && technicalDrawerTab === "whiteboard") {
                  setShowWhiteboard(false);
                } else {
                  setShowWhiteboard(true);
                  setTechnicalDrawerTab("whiteboard");
                }
              }}
              aria-label={
                showWhiteboard
                  ? "Hide System Design Whiteboard"
                  : "Open System Design Whiteboard"
              }
              aria-expanded={showWhiteboard}
              className={`min-h-[44px] min-w-[44px] p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04] ${
                showWhiteboard && technicalDrawerTab === "whiteboard"
                  ? "bg-gradient-to-r from-[#E85D04] to-[#E85D04] text-white font-bold border-transparent shadow-xs"
                  : "bg-white text-[#64748B] border-[#E8D9CC] hover:bg-[#FFFCF8]"
              }`}
              title={
                showWhiteboard
                  ? "Hide System Design Whiteboard"
                  : "Open System Design Whiteboard"
              }
            >
              <Layers size={16} />
            </button>
          )}

          {/* End Interview Button */}
          <button
            onClick={onConfirmEndClick}
            disabled={isEndingInterview}
            aria-label="End Interview"
            className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 min-h-[44px] px-3.5 sm:px-4 py-2 rounded-xl flex items-center space-x-1.5 text-xs font-semibold transition-all shadow-2xs cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          >
            <Phone size={13} />
            <span>{isEndingInterview ? "Ending..." : "End Interview"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default InterviewHeaderControls;
