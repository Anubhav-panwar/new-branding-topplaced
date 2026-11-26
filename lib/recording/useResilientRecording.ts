/**
 * TopPlaced AI — useResilientRecording Hook
 * 
 * Unifies CompositedStreamRecorder (Option A: Screen + PiP Webcam + Mixed Audio)
 * with ProgressiveRecordingManager (10s slices, IndexedDB persistence, exponential backoff upload).
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { CompositedStreamRecorder } from "./CompositedStreamRecorder";
import { ProgressiveRecordingManager } from "./ProgressiveRecordingManager";

export interface UseResilientRecordingProps {
  sessionId: string;
  apiBaseUrl: string;
  token?: string;
  webcamStream: MediaStream | null;
  screenStream: MediaStream | null;
  audioStream: MediaStream | null;
  interviewStarted: boolean;
  interviewCompleted: boolean;
}

export function useResilientRecording({
  sessionId,
  apiBaseUrl,
  token,
  webcamStream,
  screenStream,
  audioStream,
  interviewStarted,
  interviewCompleted,
}: UseResilientRecordingProps) {
  const compositorRef = useRef<CompositedStreamRecorder | null>(null);
  const managerRef = useRef<ProgressiveRecordingManager | null>(null);

  const [uploadProgress, setUploadProgress] = useState<{
    uploadedChunks: number;
    totalChunks: number;
    percentage: number;
  }>({ uploadedChunks: 0, totalChunks: 0, percentage: 0 });

  const [isRecording, setIsRecording] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Initialize and start recording when interview begins
  useEffect(() => {
    if (interviewStarted && !interviewCompleted && !isRecording && sessionId) {
      try {
        // 1. Initialize Composited Stream (Screen + PiP Webcam + Audio)
        const compositor = new CompositedStreamRecorder({
          width: 1280,
          height: 720,
          frameRate: 25,
        });
        compositorRef.current = compositor;

        const compositedMediaStream = compositor.initialize(
          webcamStream,
          screenStream,
          audioStream
        );

        // 2. Initialize Progressive Chunk Recorder
        const manager = new ProgressiveRecordingManager({
          sessionId,
          apiBaseUrl,
          token,
          chunkDurationMs: 10000, // 10-second chunks
          onUploadProgress: (progress) => setUploadProgress(progress),
          onError: (err) => console.warn("Recording manager error:", err),
        });
        managerRef.current = manager;

        manager.start(compositedMediaStream).then(() => {
          setIsRecording(true);
        });
      } catch (err) {
        console.warn("Could not start resilient recording:", err);
      }
    }
  }, [interviewStarted, interviewCompleted, sessionId, apiBaseUrl, token, isRecording]);

  // Dynamically update screen stream when screen share is toggled
  useEffect(() => {
    if (compositorRef.current && isRecording) {
      compositorRef.current.updateScreenStream(screenStream);
    }
  }, [screenStream, isRecording]);

  // Dynamically update webcam stream
  useEffect(() => {
    if (compositorRef.current && isRecording) {
      compositorRef.current.updateWebcamStream(webcamStream);
    }
  }, [webcamStream, isRecording]);

  // Dynamically update audio stream
  useEffect(() => {
    if (compositorRef.current && isRecording) {
      compositorRef.current.updateAudioStream(audioStream);
    }
  }, [audioStream, isRecording]);

  // Unload warning if recording is actively uploading
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isRecording || isFinalizing) {
        e.preventDefault();
        e.returnValue = "An interview recording is in progress. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isRecording, isFinalizing]);

  // Finalize method called when interview finishes
  const stopAndFinalizeRecording = useCallback(async (): Promise<void> => {
    if (!managerRef.current) return;
    setIsFinalizing(true);
    try {
      await managerRef.current.stopAndFinalize();
    } catch (e) {
      console.warn("Error finalizing recording:", e);
    } finally {
      if (compositorRef.current) {
        compositorRef.current.stop();
        compositorRef.current = null;
      }
      setIsRecording(false);
      setIsFinalizing(false);
    }
  }, []);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (compositorRef.current) {
        compositorRef.current.stop();
        compositorRef.current = null;
      }
      if (managerRef.current) {
        managerRef.current.destroy();
        managerRef.current = null;
      }
    };
  }, []);

  return {
    isRecording,
    isFinalizing,
    uploadProgress,
    stopAndFinalizeRecording,
  };
}
