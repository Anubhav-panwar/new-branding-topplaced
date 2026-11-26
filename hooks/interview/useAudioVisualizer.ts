"use client";

import { useState, useRef, useEffect } from "react";

export interface UseAudioVisualizerProps {
  mediaStream: MediaStream | null;
  isAISpeakingRef: React.MutableRefObject<boolean>;
  isListeningRef: React.MutableRefObject<boolean>;
  voiceStateRef: React.MutableRefObject<string>;
  onSpeechStarted?: () => void;
}

export interface UseAudioVisualizerReturn {
  audioVolume: number;
  audioContextRef: React.MutableRefObject<AudioContext | null>;
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
}

export function useAudioVisualizer({
  mediaStream,
  isAISpeakingRef,
  isListeningRef,
  voiceStateRef,
  onSpeechStarted,
}: UseAudioVisualizerProps): UseAudioVisualizerReturn {
  // Real-time Mic Voice Level / Equalizer Visualizer State (0 to 100)
  const [audioVolume, setAudioVolume] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const onSpeechStartedRef = useRef(onSpeechStarted);
  onSpeechStartedRef.current = onSpeechStarted;

  // Hook Web Audio API to mediaStream for live visual audio decibels
  useEffect(() => {
    if (!mediaStream) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(mediaStream);

      // Clean Audio Pipeline:
      // Conservative rumble filter (85Hz) to cut table bumps, laptop fan vibration, and 50/60Hz AC hum.
      const highPassFilter = audioCtx.createBiquadFilter();
      highPassFilter.type = "highpass";
      highPassFilter.frequency.value = 85;

      source.connect(highPassFilter);
      highPassFilter.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateMeter = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setAudioVolume(normalized);

        // VAD (Voice Activity Detection):
        if (!isAISpeakingRef.current) {
          if (isListeningRef.current) {
            if (normalized > 16 && voiceStateRef.current === "LISTENING") {
              console.log("[VAD] Speech started");
              onSpeechStartedRef.current?.();
            }
          }
        }

        animFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();

      return () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        if (audioCtx.state !== "closed") audioCtx.close().catch(() => {});
      };
    } catch (e) {
      console.warn("Audio meter init failed:", e);
    }
  }, [mediaStream, isAISpeakingRef, isListeningRef, voiceStateRef]);

  return {
    audioVolume,
    audioContextRef,
    analyserRef,
  };
}

export default useAudioVisualizer;

