"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { CompositedStreamRecorder } from "@/lib/recording/CompositedStreamRecorder";
import { ProgressiveRecordingManager } from "@/lib/recording/ProgressiveRecordingManager";
import { mediaDeviceManager } from "@/lib/media/MediaDeviceManager";

export interface UseSessionRecordingProps {
  sessionId: string;
  token?: string | null;
  mediaStream: MediaStream | null;
  mediaStreamRef?: React.MutableRefObject<MediaStream | null>;
  verifiedScreenStream: MediaStream | null;
  interviewStarted: boolean;
  interviewCompleted: boolean;
  apiUrl?: string;
}

export interface UseSessionRecordingReturn {
  startFullSessionRecording: (camStream: MediaStream) => void;
  stopAndUploadFullSessionRecording: (effectiveSessionId: string) => Promise<void>;
  addRemoteAudioStream: (stream: MediaStream | null) => void;
  removeRemoteAudioStream: (stream: MediaStream | null) => void;
  flushBeforeUnload: () => void;
  isRecording: boolean;
  compositedStreamRecorderRef: React.MutableRefObject<CompositedStreamRecorder | null>;
  progressiveRecordingManagerRef: React.MutableRefObject<ProgressiveRecordingManager | null>;
}

export function useSessionRecording({
  sessionId,
  token,
  mediaStream,
  mediaStreamRef,
  verifiedScreenStream,
  interviewStarted,
  interviewCompleted,
  apiUrl,
}: UseSessionRecordingProps): UseSessionRecordingReturn {
  // Full Interview Session Recording (Option A: Composited Screen + PiP Webcam + Mixed Audio)
  const compositedStreamRecorderRef = useRef<CompositedStreamRecorder | null>(null);
  const progressiveRecordingManagerRef = useRef<ProgressiveRecordingManager | null>(null);
  const remoteAudioQueueRef = useRef<Set<MediaStream>>(new Set());
  const [isRecording, setIsRecording] = useState(false);

  const addRemoteAudioStream = useCallback((stream: MediaStream | null) => {
    if (!stream || stream.getAudioTracks().length === 0) return;
    remoteAudioQueueRef.current.add(stream);
    if (compositedStreamRecorderRef.current) {
      compositedStreamRecorderRef.current.addRemoteAudioStream(stream);
    }
  }, []);

  const removeRemoteAudioStream = useCallback((stream: MediaStream | null) => {
    if (!stream) return;
    remoteAudioQueueRef.current.delete(stream);
    if (compositedStreamRecorderRef.current) {
      compositedStreamRecorderRef.current.removeRemoteAudioStream(stream);
    }
  }, []);

  const flushBeforeUnload = useCallback(() => {
    if (progressiveRecordingManagerRef.current) {
      progressiveRecordingManagerRef.current.flushOnUnload();
    }
  }, []);

  const startFullSessionRecording = useCallback(
    (camStream: MediaStream) => {
      if (typeof window === "undefined" || typeof MediaRecorder === "undefined") return;
      if (!camStream || camStream.getTracks().length === 0) return;
      // Wait for real backend sessionId so progressive chunks never upload under an orphan timestamp ID
      if (!sessionId) return;
      if (progressiveRecordingManagerRef.current) {
        return; // Already active
      }

      try {
        const baseApi = (
          apiUrl ||
          process.env.NEXT_PUBLIC_API_URL ||
          "http://localhost:5000"
        ).replace(/\/$/, "");
        const effectiveToken =
          token ||
          (typeof window !== "undefined"
            ? localStorage.getItem("token") || localStorage.getItem("access_token") || ""
            : "");

        // 1. Initialize Composited Stream (Screen Base + PiP Webcam + Mixed Audio)
        const activeScreen = verifiedScreenStream || mediaDeviceManager.getState().screenStream;
        const compositor = new CompositedStreamRecorder({
          width: 1280,
          height: 720,
          frameRate: 25,
        });
        compositedStreamRecorderRef.current = compositor;
        const compStream = compositor.initialize(camStream, activeScreen, camStream);
        remoteAudioQueueRef.current.forEach((remoteStream) => {
          compositor.addRemoteAudioStream(remoteStream);
        });

        // 2. Initialize Progressive Chunk Recorder (10s slices, IndexedDB resilience)
        const manager = new ProgressiveRecordingManager({
          sessionId,
          apiBaseUrl: baseApi,
          token: effectiveToken,
          chunkDurationMs: 10000,
          onError: (err) => console.warn("Progressive recording error:", err),
        });
        progressiveRecordingManagerRef.current = manager;

        manager
          .start(compStream)
          .then(() => {
            setIsRecording(true);
            console.log(
              "🎥 Progressive Composited Recording active (Screen + PiP Webcam + Mixed Audio, 10s chunks) for:",
              sessionId
            );
          })
          .catch((startErr) => {
            console.warn("Progressive recording start failed:", startErr);
            progressiveRecordingManagerRef.current = null;
            setIsRecording(false);
          });
      } catch (err) {
        console.warn("Could not start progressive session recording:", err);
        setIsRecording(false);
      }
    },
    [sessionId, token, verifiedScreenStream, apiUrl]
  );

  // Dynamically update compositor screen stream
  useEffect(() => {
    if (compositedStreamRecorderRef.current) {
      compositedStreamRecorderRef.current.updateScreenStream(verifiedScreenStream);
    }
  }, [verifiedScreenStream]);

  // Dynamically update compositor webcam and audio stream
  useEffect(() => {
    if (compositedStreamRecorderRef.current && mediaStream) {
      compositedStreamRecorderRef.current.updateWebcamStream(mediaStream);
      compositedStreamRecorderRef.current.updateAudioStream(mediaStream);
    }
  }, [mediaStream]);

  const stopAndUploadFullSessionRecording = useCallback(
    async (effectiveSessionId: string): Promise<void> => {
      console.log("🎬 Finalizing and stopping resilient session recording for:", effectiveSessionId);
      setIsRecording(false);

      // Stop progressive manager and flush pending chunks to backend
      if (progressiveRecordingManagerRef.current) {
        try {
          const res = await progressiveRecordingManagerRef.current.stopAndFinalize();
          console.log("✅ Progressive recording finalized successfully:", res);
        } catch (finalizeErr) {
          console.warn("Error finalizing progressive recording:", finalizeErr);
        } finally {
          progressiveRecordingManagerRef.current = null;
        }
      }

      // Stop compositor rendering loop
      if (compositedStreamRecorderRef.current) {
        try {
          compositedStreamRecorderRef.current.stop();
        } catch (e) {}
        compositedStreamRecorderRef.current = null;
      }
      remoteAudioQueueRef.current.clear();
    },
    []
  );

  useEffect(() => {
    if (interviewStarted && !interviewCompleted && sessionId) {
      const stream = mediaStreamRef ? mediaStreamRef.current || mediaStream : mediaStream;
      if (stream && !progressiveRecordingManagerRef.current) {
        startFullSessionRecording(stream);
      }
    }
  }, [interviewStarted, interviewCompleted, sessionId, mediaStream, mediaStreamRef, startFullSessionRecording]);

  return {
    startFullSessionRecording,
    stopAndUploadFullSessionRecording,
    addRemoteAudioStream,
    removeRemoteAudioStream,
    flushBeforeUnload,
    isRecording,
    compositedStreamRecorderRef,
    progressiveRecordingManagerRef,
  };
}

export default useSessionRecording;

