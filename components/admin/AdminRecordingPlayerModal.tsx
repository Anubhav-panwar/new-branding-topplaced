"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  Download,
  AlertCircle,
  Video,
  Mic,
  Clock,
  HardDrive,
  Calendar,
  ShieldCheck,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  AdminModal,
  AdminModalCloseButton,
  AdminStatusBadge,
  ADMIN_BTN_PRIMARY,
  ADMIN_BTN_GHOST,
  ADMIN_INNER_TILE_CLASS,
} from "./AdminRedSunUI";
import { getApiBaseUrl } from "@/lib/adminApi";

export interface AdminRecordingModalData {
  sessionId: string;
  candidateName?: string;
  userName?: string;
  candidateEmail?: string;
  userEmail?: string;
  filename?: string;
  mimeType?: string;
  duration?: number;
  durationFormatted?: string;
  fileSize?: number;
  fileSizeFormatted?: string;
  sizeBytes?: number;
  streamUrl?: string;
  downloadUrl?: string;
  downloadToken?: string;
  status?: string;
  createdAt?: string | Date;
  expiresAt?: string | Date;
  daysRemaining?: number;
  remainingDays?: number;
  interviewCategory?: string;
  track?: string;
  role?: string;
}

interface AdminRecordingPlayerModalProps {
  recording: AdminRecordingModalData | null;
  onClose: () => void;
  onDownload?: (sessionId: string) => Promise<void> | void;
  isDownloading?: boolean;
}

export function AdminRecordingPlayerModal({
  recording,
  onClose,
  onDownload,
  isDownloading = false,
}: AdminRecordingPlayerModalProps) {
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);

  // Check if audio format
  const isAudio = Boolean(
    recording?.mimeType?.toLowerCase().startsWith("audio/") ||
      recording?.filename?.toLowerCase().endsWith(".wav") ||
      recording?.filename?.toLowerCase().endsWith(".mp3") ||
      recording?.filename?.toLowerCase().endsWith(".ogg")
  );

  // Resolve media stream URL
  const resolveMediaUrl = useCallback(
    (rawUrl?: string): string => {
      if (!rawUrl) return "";
      if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://") || rawUrl.startsWith("blob:")) {
        return rawUrl;
      }
      const apiBase = getApiBaseUrl().replace(/\/$/, "");
      const cleanPath = rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`;
      return `${apiBase}${cleanPath}`;
    },
    []
  );

  const streamSrc = resolveMediaUrl(recording?.streamUrl || recording?.downloadUrl);

  // Reset player on new recording
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(recording?.duration || 0);
    setMediaError(null);
    setIsBuffering(false);
  }, [recording]);

  // Sync fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const togglePlay = () => {
    const media = mediaRef.current;
    if (!media) return;
    if (isPlaying) {
      media.pause();
      setIsPlaying(false);
    } else {
      media
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          setMediaError("Playback error: " + (err.message || "Unable to play media stream."));
          setIsPlaying(false);
        });
    }
  };

  const handleTimeUpdate = () => {
    const media = mediaRef.current;
    if (!media) return;
    setCurrentTime(media.currentTime);
  };

  const handleLoadedMetadata = () => {
    const media = mediaRef.current;
    if (!media) return;
    if (media.duration && !isNaN(media.duration) && isFinite(media.duration)) {
      setDuration(media.duration);
    } else if (recording?.duration) {
      setDuration(recording.duration);
    }
    setMediaError(null);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const media = mediaRef.current;
    if (!media) return;
    const seekTo = parseFloat(e.target.value);
    media.currentTime = seekTo;
    setCurrentTime(seekTo);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const media = mediaRef.current;
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (media) {
      media.volume = newVol;
      media.muted = newVol === 0;
    }
    setIsMuted(newVol === 0);
  };

  const toggleMute = () => {
    const media = mediaRef.current;
    if (!media) return;
    const nextMuted = !isMuted;
    media.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted && volume === 0) {
      setVolume(0.5);
      media.volume = 0.5;
    }
  };

  const handleSpeedCycle = () => {
    const media = mediaRef.current;
    const speeds = [0.75, 1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackSpeed(nextSpeed);
    if (media) {
      media.playbackRate = nextSpeed;
    }
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;
    try {
      if (!document.fullscreenElement) {
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.warn("Fullscreen toggle error:", err);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (!recording) return null;

  const candidateDisplay =
    recording.candidateName || recording.userName || "Candidate";
  const emailDisplay = recording.candidateEmail || recording.userEmail;
  const daysLeft =
    recording.daysRemaining ?? recording.remainingDays ?? 10;

  return (
    <AdminModal onClose={onClose} maxWidth="max-w-4xl">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#E8D9CC] pb-3 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#E85D04]/10 border border-[#E85D04]/30 flex items-center justify-center text-[#E85D04] shrink-0">
              {isAudio ? <Mic size={20} /> : <Video size={20} />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-[#2B211C] truncate">
                  {candidateDisplay}
                </h3>
                <AdminStatusBadge tone="emerald">
                  <ShieldCheck size={11} />
                  <span>{recording.status ? `Status: ${String(recording.status).toUpperCase()}` : "Verified & Stored"}</span>
                </AdminStatusBadge>
                {daysLeft > 0 ? (
                  <AdminStatusBadge tone="amber">
                    <Clock size={11} />
                    <span>{daysLeft}d retention left</span>
                  </AdminStatusBadge>
                ) : (
                  <AdminStatusBadge tone="rose">Expired</AdminStatusBadge>
                )}
              </div>
              <p className="text-xs text-[#70645C] font-mono truncate mt-0.5">
                Session ID: {recording.sessionId}
                {recording.createdAt
                  ? ` • Recorded: ${new Date(recording.createdAt).toLocaleDateString()}`
                  : ""}
                {emailDisplay ? ` • ${emailDisplay}` : ""}
              </p>
            </div>
          </div>

          <AdminModalCloseButton onClick={onClose} />
        </div>

        {/* Media Player Container */}
        <div
          ref={containerRef}
          className="relative rounded-2xl overflow-hidden bg-black border border-[#E8D9CC] shadow-md group select-none"
        >
          {isAudio ? (
            /* Audio Player Mode */
            <div className="h-64 sm:h-80 flex flex-col items-center justify-center bg-gradient-to-br from-[#20140e] via-[#2B211C] to-[#1a100a] p-6 text-center">
              <audio
                ref={mediaRef as any}
                src={streamSrc}
                preload="metadata"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onWaiting={() => setIsBuffering(true)}
                onPlaying={() => {
                  setIsBuffering(false);
                  setIsPlaying(true);
                }}
                onPause={() => setIsPlaying(false)}
                onError={() => {
                  setIsBuffering(false);
                  setMediaError(
                    "Unable to stream audio recording. The media stream may have expired or is unavailable."
                  );
                }}
              />

              {/* Animated waveform visualizer */}
              <div className="flex items-center gap-1.5 h-20 mb-4">
                {Array.from({ length: 28 }).map((_, idx) => {
                  const heights = [
                    "h-4",
                    "h-8",
                    "h-14",
                    "h-10",
                    "h-16",
                    "h-6",
                    "h-12",
                    "h-18",
                    "h-9",
                    "h-14",
                  ];
                  const hClass = isPlaying
                    ? heights[idx % heights.length]
                    : "h-3";
                  return (
                    <div
                      key={idx}
                      className={`w-1.5 rounded-full bg-[#E85D04] transition-all duration-300 ${hClass} ${
                        isPlaying ? "opacity-90" : "opacity-35"
                      }`}
                      style={{
                        animation: isPlaying
                          ? `pulse ${(idx % 5) * 0.2 + 0.6}s infinite ease-in-out`
                          : "none",
                      }}
                    />
                  );
                })}
              </div>

              <div className="text-white text-sm font-semibold">
                Voice Interview Audio Track
              </div>
              <div className="text-[#E8D9CC] text-xs font-mono mt-1">
                {recording.mimeType || "audio/webm"} &bull; Range 206 Streaming
              </div>
            </div>
          ) : (
            /* Video Player Mode */
            <div className="relative min-h-[320px] max-h-[500px] flex items-center justify-center bg-black">
              <video
                ref={mediaRef as any}
                src={streamSrc}
                preload="metadata"
                playsInline
                className="w-full max-h-[500px] object-contain"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onWaiting={() => setIsBuffering(true)}
                onPlaying={() => {
                  setIsBuffering(false);
                  setIsPlaying(true);
                }}
                onPause={() => setIsPlaying(false)}
                onError={() => {
                  setIsBuffering(false);
                  setMediaError(
                    "Unable to stream video recording. The file may be unavailable, corrupted, or expired."
                  );
                }}
                onClick={togglePlay}
              />
            </div>
          )}

          {/* Buffering Overlay */}
          {isBuffering && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-20">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/80 border border-[#E85D04]/40 text-white text-xs font-medium">
                <Loader2 size={16} className="animate-spin text-[#E85D04]" />
                <span>Buffering media stream...</span>
              </div>
            </div>
          )}

          {/* Error Overlay */}
          {mediaError && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-30 space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <AlertCircle size={24} />
              </div>
              <div className="space-y-1 max-w-md">
                <h4 className="text-sm font-bold text-white">Stream Error</h4>
                <p className="text-xs text-rose-200">{mediaError}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMediaError(null);
                  if (mediaRef.current) {
                    mediaRef.current.load();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FFFCF8] text-xs font-semibold text-[#2B211C] hover:bg-white cursor-pointer"
              >
                <RefreshCw size={13} />
                <span>Retry Stream</span>
              </button>
            </div>
          )}

          {/* Custom Controls Bar */}
          <div className="bg-gradient-to-t from-black/95 via-black/80 to-transparent p-3 sm:p-4 space-y-2 z-10">
            {/* Scrubber / Progress Bar */}
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max={duration > 0 ? duration : 100}
                step="0.1"
                value={currentTime}
                onChange={handleSeek}
                aria-label="Seek time"
                className="w-full h-1.5 rounded-lg appearance-none bg-white/20 accent-[#E85D04] hover:bg-white/30 cursor-pointer transition-all"
              />
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between text-white text-xs gap-3 flex-wrap">
              {/* Left: Play/Pause, Rewind, Time */}
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label={isPlaying ? "Pause" : "Play"}
                  className="w-8 h-8 rounded-full bg-[#E85D04] hover:bg-[#E85D04] text-white flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (mediaRef.current) {
                      mediaRef.current.currentTime = Math.max(0, currentTime - 10);
                    }
                  }}
                  title="Rewind 10s"
                  aria-label="Rewind 10 seconds"
                  className="p-1.5 text-white/80 hover:text-white cursor-pointer transition-colors"
                >
                  <RotateCcw size={15} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (mediaRef.current) {
                      mediaRef.current.currentTime = Math.min(duration, currentTime + 10);
                    }
                  }}
                  title="Forward 10s"
                  aria-label="Forward 10 seconds"
                  className="p-1.5 text-white/80 hover:text-white cursor-pointer transition-colors"
                >
                  <RotateCw size={15} />
                </button>

                <span className="font-mono text-xs text-white/90">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              {/* Right: Volume, Speed, Fullscreen */}
              <div className="flex items-center gap-3">
                {/* Volume Slider */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={toggleMute}
                    aria-label={isMuted ? "Unmute" : "Mute"}
                    className="p-1 text-white/80 hover:text-white cursor-pointer"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX size={15} />
                    ) : volume < 0.5 ? (
                      <Volume1 size={15} />
                    ) : (
                      <Volume2 size={15} />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    aria-label="Volume"
                    className="w-14 sm:w-20 h-1 rounded-lg appearance-none bg-white/20 accent-[#E85D04] cursor-pointer"
                  />
                </div>

                {/* Speed Toggle */}
                <button
                  type="button"
                  onClick={handleSpeedCycle}
                  title="Playback Speed"
                  className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white font-mono text-[11px] font-semibold cursor-pointer transition-colors"
                >
                  {playbackSpeed}x
                </button>

                {/* Fullscreen (video only) */}
                {!isAudio && (
                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    className="p-1.5 text-white/80 hover:text-white cursor-pointer transition-colors"
                  >
                    {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Metadata Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
          <div className={`${ADMIN_INNER_TILE_CLASS} p-3 space-y-1`}>
            <div className="flex items-center gap-1.5 text-[10px] text-[#70645C] uppercase font-mono">
              <HardDrive size={11} />
              <span>File Size</span>
            </div>
            <div className="font-bold text-[#2B211C] font-mono text-xs">
              {recording.fileSizeFormatted ||
                (recording.sizeBytes || recording.fileSize
                  ? `${Math.round(((recording.sizeBytes || recording.fileSize || 0) / (1024 * 1024)) * 100) / 100} MB`
                  : "N/A")}
            </div>
          </div>

          <div className={`${ADMIN_INNER_TILE_CLASS} p-3 space-y-1`}>
            <div className="flex items-center gap-1.5 text-[10px] text-[#70645C] uppercase font-mono">
              <Clock size={11} />
              <span>Duration</span>
            </div>
            <div className="font-bold text-[#2B211C] font-mono text-xs">
              {recording.durationFormatted ||
                (recording.duration ? `${Math.round(recording.duration)}s` : "N/A")}
            </div>
          </div>

          <div className={`${ADMIN_INNER_TILE_CLASS} p-3 space-y-1`}>
            <div className="flex items-center gap-1.5 text-[10px] text-[#70645C] uppercase font-mono">
              {isAudio ? <Mic size={11} /> : <Video size={11} />}
              <span>Format</span>
            </div>
            <div className="font-bold text-[#2B211C] font-mono text-xs truncate">
              {recording.mimeType || (isAudio ? "audio/webm" : "video/webm")}
            </div>
          </div>

          <div className={`${ADMIN_INNER_TILE_CLASS} p-3 space-y-1`}>
            <div className="flex items-center gap-1.5 text-[10px] text-[#70645C] uppercase font-mono">
              <Calendar size={11} />
              <span>Recording Date</span>
            </div>
            <div className="font-bold text-[#2B211C] font-mono text-xs truncate">
              {recording.createdAt
                ? new Date(recording.createdAt).toLocaleDateString()
                : "N/A"}
            </div>
          </div>

          <div className={`${ADMIN_INNER_TILE_CLASS} p-3 space-y-1`}>
            <div className="flex items-center gap-1.5 text-[10px] text-[#70645C] uppercase font-mono">
              <Clock size={11} />
              <span>Retention</span>
            </div>
            <div className="font-bold text-[#E85D04] font-mono text-xs">
              {daysLeft > 0 ? `${daysLeft} days remaining` : "Expired"}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E8D9CC]">
          <div className="text-xs text-[#70645C] font-mono truncate max-w-sm">
            Filename:{" "}
            <span className="text-[#2B211C]">
              {recording.filename || `interview_${recording.sessionId}.webm`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={ADMIN_BTN_GHOST}
            >
              Close
            </button>

            {onDownload && (
              <button
                type="button"
                onClick={() => onDownload(recording.sessionId)}
                disabled={isDownloading}
                className={ADMIN_BTN_PRIMARY}
              >
                {isDownloading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Download size={14} />
                )}
                <span>
                  {isDownloading ? "Downloading..." : "Download Original File"}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </AdminModal>
  );
}
