"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  Clock,
  Eye,
  Camera,
  Layers,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  X,
  Play,
  Pause,
  Video,
} from "lucide-react";
import { ProctoringEvent, ProctoringSignalLevel } from "@/lib/proctoring/types";

interface ProctoringTimelineViewProps {
  events: ProctoringEvent[];
  signalLevel?: ProctoringSignalLevel;
  totalViolations?: number;
  initialCollapsed?: boolean;
  sessionId?: string;
  onDismissIncident?: (incidentId: string) => void;
}

export default function ProctoringTimelineView({
  events = [],
  signalLevel = "NORMAL",
  totalViolations,
  initialCollapsed = false,
  sessionId,
  onDismissIncident,
}: ProctoringTimelineViewProps) {
  const [isExpanded, setIsExpanded] = useState(!initialCollapsed);
  const [selectedSnapshot, setSelectedSnapshot] = useState<string | null>(null);
  const [activeReplayFrames, setActiveReplayFrames] = useState<string[] | null>(null);
  const [currentReplayIndex, setCurrentReplayIndex] = useState(0);
  const [isPlayingReplay, setIsPlayingReplay] = useState(true);

  React.useEffect(() => {
    if (!activeReplayFrames || activeReplayFrames.length === 0 || !isPlayingReplay) return;
    const interval = setInterval(() => {
      setCurrentReplayIndex((prev) => (prev + 1) % activeReplayFrames.length);
    }, 350);
    return () => clearInterval(interval);
  }, [activeReplayFrames, isPlayingReplay]);

  const getSeverityBadge = (severity?: string) => {
    switch ((severity || "INFO").toUpperCase()) {
      case "HIGH":
        return "bg-rose-500/15 text-rose-300 border-rose-500/30";
      case "MEDIUM":
        return "bg-amber-500/15 text-amber-300 border-amber-500/30";
      case "LOW":
        return "bg-blue-500/15 text-blue-300 border-blue-500/30";
      default:
        return "bg-slate-700/30 text-[#475569] border-slate-700/50";
    }
  };

  const getSignalBadge = (level: ProctoringSignalLevel = "NORMAL") => {
    switch (level) {
      case "REVIEW_RECOMMENDED":
        return {
          bg: "bg-rose-50 border-rose-200 text-rose-800",
          title: "Review Recommended",
          desc: "Multiple independent visual or browser events were recorded. Reviewing context is recommended.",
          icon: <ShieldAlert className="text-rose-400" size={20} />,
        };
      case "ATTENTION":
        return {
          bg: "bg-amber-50 border-amber-200 text-amber-800",
          title: "Attention Required",
          desc: "Minor occurrences recorded (e.g. temporary gaze shift or brief window switch).",
          icon: <AlertCircle className="text-amber-400" size={20} />,
        };
      case "NORMAL":
      default:
        return {
          bg: "bg-emerald-50 border-emerald-200 text-emerald-800",
          title: "Verified (Normal Compliance)",
          desc: "Candidate remained consistently visible and focused on the evaluation window.",
          icon: <ShieldCheck className="text-emerald-400" size={20} />,
        };
    }
  };

  const signalInfo = getSignalBadge(signalLevel);

  return (
    <div className="bg-white border border-[#F1D2B8] rounded-2xl p-5 shadow-lg space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[#FFF0E6] text-[#F26A0A] border border-[#F1D2B8]">
            <Layers size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#111827] flex items-center space-x-2">
              <span>Proctoring Audit & Incident Timeline</span>
              <span className="text-xs font-normal text-[#64748B]">({events.length} events logged)</span>
            </h3>
            <p className="text-xs text-[#64748B]">
              Objective contextual timeline of camera and browser integrity signals
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded-lg bg-white/[0.05] text-[#475569] hover:text-[#111827] hover:bg-white/[0.1] transition"
        >
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Signal Level Banner */}
      <div className={`p-4 rounded-xl border flex items-start space-x-3 ${signalInfo.bg}`}>
        <div className="shrink-0 mt-0.5">{signalInfo.icon}</div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold">{signalInfo.title}</h4>
            <span className="text-[11px] font-mono opacity-80 uppercase tracking-wider">
              Signal: {signalLevel}
            </span>
          </div>
          <p className="text-xs mt-1 leading-relaxed opacity-90">{signalInfo.desc}</p>
        </div>
      </div>

      {/* Chronological Timeline */}
      {isExpanded && (
        <div className="pt-2">
          {events.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              <ShieldCheck className="mx-auto text-emerald-400 mb-2 opacity-80" size={32} />
              No suspicious events or interruptions recorded during this session.
            </div>
          ) : (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/[0.08]">
              {events.map((event, idx) => {
                const rawType = (event as any).event_type || (event as any).eventType || (event as any).type || "OBSERVATION";
                const typeStr = String(rawType);
                const displayTitle = (typeStr === "POSSIBLE_EXTERNAL_DEVICE" || typeStr === "STRONG_EXTERNAL_DEVICE_SIGNAL")
                  ? "Potential External Device"
                  : typeStr.replace(/_/g, " ");

                const timestampVal = event.timestamp || (event as any).timestamp;
                const date = timestampVal ? new Date(timestampVal) : new Date();
                const timeStr = !isNaN(date.getTime())
                  ? date.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  : "--:--:--";

                const durationMs = Number(event.duration_ms || (event as any).durationMs || 0);
                const durationSec = durationMs > 0 ? (durationMs / 1000).toFixed(1) + "s" : "";
                const severity = String(event.severity || (event as any).severity || "INFO");

                return (
                  <div key={idx} className="relative group">
                    {/* Timeline Node Dot */}
                    <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-[#101421] border-2 border-[#F26A0A]"></div>

                    <div className="bg-[#141926] border border-white/[0.08] rounded-xl p-3.5 hover:border-white/20 transition">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[#64748B] font-semibold">{timeStr}</span>
                          <span className="text-slate-600">•</span>
                          <span className="font-bold text-slate-200">
                            {displayTitle}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {durationSec && (
                            <span className="text-[11px] text-[#64748B] font-mono bg-black/40 px-2 py-0.5 rounded border border-white/[0.06]">
                              {durationSec}
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getSeverityBadge(
                              severity
                            )}`}
                          >
                            {severity}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-[#64748B] leading-relaxed">
                        {event.metadata?.message ||
                          event.metadata?.description ||
                          (event as any).message ||
                          `Proctoring observation recorded from ${event.source || "monitoring"} source.`}
                      </p>

                      {/* Section 22: Admin Review for External Device */}
                      {(typeStr === "POSSIBLE_EXTERNAL_DEVICE" ||
                        typeStr === "STRONG_EXTERNAL_DEVICE_SIGNAL" ||
                        typeStr === "PHONE_NEAR_FACE") && (
                        <div className="mt-2.5 p-2.5 rounded-lg bg-black/50 border border-white/[0.08] space-y-1.5 text-[11px]">
                          <div className="flex items-center justify-between text-[#475569]">
                            <span className="text-[#64748B]">Timestamp:</span>
                            <span className="font-mono text-slate-200">{timeStr}</span>
                          </div>
                          {durationSec && (
                            <div className="flex items-center justify-between text-[#475569]">
                              <span className="text-[#64748B]">Duration:</span>
                              <span className="font-mono text-slate-200">{durationSec}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-[#475569]">
                            <span className="text-[#64748B]">Confidence:</span>
                            <span className="font-mono font-bold text-amber-400">
                              {Math.round((event.confidence || (event as any).confidenceScore || 0.85) * 100)}%
                            </span>
                          </div>
                          {event.metadata?.signals && Array.isArray(event.metadata.signals) && (
                            <div className="pt-1 border-t border-white/[0.08]">
                              <span className="text-[#64748B] block mb-1 text-[10px] uppercase font-semibold">Related signals:</span>
                              <div className="space-y-0.5">
                                {event.metadata.signals.map((sig: string, sIdx: number) => (
                                  <div key={sIdx} className="text-emerald-400 flex items-center space-x-1.5 font-medium">
                                    <span className="text-[#E85D04]">✓</span>
                                    <span>{sig}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-1 border-t border-white/[0.08] text-[10px]">
                            <span className="text-[#64748B]">Status:</span>
                            <span className="font-bold text-rose-400 uppercase tracking-wider">REVIEW REQUIRED</span>
                          </div>
                        </div>
                      )}

                      <div className="mt-2.5 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center space-x-3">
                          {event.snapshot && (
                            <button
                              onClick={() => {
                                setActiveReplayFrames(null);
                                setSelectedSnapshot(event.snapshot!);
                              }}
                              className="text-[11px] text-[#E85D04] hover:text-[#F26A0A] hover:underline flex items-center space-x-1"
                            >
                              <ImageIcon size={12} />
                              <span>View Snapshot</span>
                            </button>
                          )}

                          {((event.replayFrames && event.replayFrames.length > 1) ||
                            ((event.metadata?.replayFrames || (event as any).replay_frames) &&
                              (event.metadata?.replayFrames || (event as any).replay_frames).length > 1)) && (
                            <button
                              onClick={() => {
                                const frames = event.replayFrames || event.metadata?.replayFrames || (event as any).replay_frames;
                                setSelectedSnapshot(null);
                                setCurrentReplayIndex(0);
                                setIsPlayingReplay(true);
                                setActiveReplayFrames(frames);
                              }}
                              className="text-[11px] text-amber-300 hover:underline flex items-center space-x-1 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20 font-medium"
                            >
                              <Video size={12} className="text-amber-400" />
                              <span>3s Video Replay</span>
                            </button>
                          )}
                        </div>

                        {onDismissIncident && (event.metadata?.incidentId || (event as any).incidentId) && (
                          <button
                            onClick={() => onDismissIncident(event.metadata?.incidentId || (event as any).incidentId)}
                            className="text-[10px] text-[#64748B] hover:text-amber-300 px-2 py-0.5 rounded bg-black/40 border border-white/[0.08] hover:border-amber-500/40 transition"
                          >
                            Dismiss Flag
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Snapshot Preview Modal */}
      {selectedSnapshot && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121623] border border-white/10 rounded-2xl max-w-md w-full p-4 relative shadow-2xl">
            <button
              onClick={() => setSelectedSnapshot(null)}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/[0.05] text-[#475569] hover:text-[#111827] hover:bg-white/10 transition"
            >
              <X size={18} />
            </button>
            <h4 className="text-sm font-bold text-[#111827] mb-3">Audit Evidence Snapshot</h4>
            <div className="rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-white/10">
              <img
                src={selectedSnapshot}
                alt="Audit Snapshot"
                className="w-full h-full object-contain"
              />
            </div>
            <p className="text-xs text-[#64748B] mt-2 text-center">
              Timestamped visual frame logged for authorized reviewer auditing.
            </p>
          </div>
        </div>
      )}

      {/* 3-Second Animated Incident Replay Modal */}
      {activeReplayFrames && activeReplayFrames.length > 0 && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121623] border border-amber-500/30 rounded-2xl max-w-md w-full p-4 relative shadow-[0_0_40px_rgba(245,158,11,0.15)]">
            <button
              onClick={() => setActiveReplayFrames(null)}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/[0.05] text-[#475569] hover:text-[#111827] hover:bg-white/10 transition"
            >
              <X size={18} />
            </button>

            <div className="flex items-center space-x-2 mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <h4 className="text-sm font-bold text-[#111827]">3-Second Incident Replay</h4>
              <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Frame {currentReplayIndex + 1}/{activeReplayFrames.length}
              </span>
            </div>

            <div className="rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center relative border border-white/10">
              <img
                src={activeReplayFrames[currentReplayIndex]}
                alt="Incident Replay Frame"
                className="w-full h-full object-contain transition-opacity duration-150"
              />
            </div>

            {/* Replay Controls & Frame Scrubber */}
            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={() => setIsPlayingReplay(!isPlayingReplay)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-[#111827] text-xs font-semibold transition"
              >
                {isPlayingReplay ? <Pause size={14} /> : <Play size={14} />}
                <span>{isPlayingReplay ? "Pause" : "Play"}</span>
              </button>

              <div className="flex items-center space-x-1.5">
                {activeReplayFrames.map((_, fIdx) => (
                  <button
                    key={fIdx}
                    onClick={() => {
                      setIsPlayingReplay(false);
                      setCurrentReplayIndex(fIdx);
                    }}
                    className={`h-2 rounded-full transition-all ${
                      fIdx === currentReplayIndex
                        ? "w-6 bg-amber-400"
                        : "w-2 bg-slate-700 hover:bg-slate-500"
                    }`}
                  />
                ))}
              </div>
            </div>

            <p className="text-[11px] text-[#64748B] mt-2 text-center">
              Consecutive 500ms chronological frames captured during the infraction window.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
