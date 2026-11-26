"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { cleanTranscriptText } from "@/utils/transcript-cleaner";

/**
 * Normalizes BCP-47 browser language codes to ElevenLabs Scribe supported ISO codes.
 * Returns null for auto-detection, preventing HTTP 400 parameter errors on 'en-IN'/'en-US'.
 */
function normalizeElevenLabsLanguage(langCode: string | null): string | null {
  if (!langCode) return null;
  const code = langCode.trim().toLowerCase();
  if (code === "auto" || code === "none" || code === "" || code === "default") {
    return null;
  }
  if (["en-us", "en-in", "en-gb", "en-au", "en-ca", "en-nz", "en-za", "en"].includes(code)) {
    return "eng";
  }
  if (["hi-in", "hi"].includes(code)) return "hin";
  if (["ta-in", "ta"].includes(code)) return "tam";
  if (["te-in", "te"].includes(code)) return "tel";
  if (["bn-in", "bn"].includes(code)) return "ben";
  if (["es-es", "es-mx", "es"].includes(code)) return "spa";
  if (["fr-fr", "fr-ca", "fr"].includes(code)) return "fra";
  if (["de-de", "de"].includes(code)) return "deu";

  if (code.length === 3 && /^[a-z]+$/.test(code)) return code;
  if (code.length === 2 && /^[a-z]+$/.test(code)) return code;

  return null;
}

export interface UseSpeechRecognitionEngineProps {
  speechLangRef: React.MutableRefObject<string>;
  isAISpeakingRef: React.MutableRefObject<boolean>;
  isListeningRef: React.MutableRefObject<boolean>;
  transcriptRef: React.MutableRefObject<string>;
  sessionBaseTranscriptRef: React.MutableRefObject<string>;
  voiceStateRef: React.MutableRefObject<string>;
  interviewCompletedRef: React.MutableRefObject<boolean>;
  lastSpokenTimestampRef: React.MutableRefObject<number>;
  onTranscriptChange: (text: string) => void;
  onVoiceStateChange: (state: string) => void;
  onWarning: (message: string) => void;
  setIsListening: (isListening: boolean) => void;
  onSttLatencyChange?: (latency: number) => void;
  apiUrl?: string;
  field?: string;
  category?: string;
  currentQuestionText?: string;
  level?: string;
  brainSttPrompt?: string;
  brainVocabulary?: string[];
}

export interface UseSpeechRecognitionEngineReturn {
  startFreshRecognition: () => void;
  startAudioRecordingWithStream: (stream: MediaStream) => void;
  stopAudioRecording: () => void;
  stopAndGetAudioBlob: () => Promise<Blob | null>;
  transcribeAudio: (audioBlobOverride?: Blob) => Promise<string>;
  transcribeWithWhisper: (audioBlobOverride?: Blob) => Promise<string>;
  recognitionRef: React.MutableRefObject<any>;
  mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>;
  audioChunksRef: React.MutableRefObject<Blob[]>;
  recordedAudioBlobRef: React.MutableRefObject<Blob | null>;
  recognitionStartingRef: React.MutableRefObject<boolean>;
  recognitionStopRequestedRef: React.MutableRefObject<boolean>;
  useFallbackSTT: boolean;
  isTranscribingAudio: boolean;
  sttLatency: number | null;
}

export function useSpeechRecognitionEngine({
  speechLangRef,
  isAISpeakingRef,
  isListeningRef,
  transcriptRef,
  sessionBaseTranscriptRef,
  voiceStateRef,
  interviewCompletedRef,
  lastSpokenTimestampRef,
  onTranscriptChange,
  onVoiceStateChange,
  onWarning,
  setIsListening,
  onSttLatencyChange,
  apiUrl,
  field,
  category,
  currentQuestionText,
  level,
  brainSttPrompt,
  brainVocabulary,
}: UseSpeechRecognitionEngineProps): UseSpeechRecognitionEngineReturn {
  const [useFallbackSTT, setUseFallbackSTT] = useState(false);
  const [isTranscribingAudio, setIsTranscribingAudio] = useState(false);
  const [sttLatency, setSttLatency] = useState<number | null>(null);

  const recognitionRef = useRef<any>(null);
  const recognitionStartingRef = useRef(false);
  const recognitionStopRequestedRef = useRef(false);

  // Dedicated committed sentences tracker to prevent duplicate / repeating words
  const committedFinalRef = useRef<string>("");
  const interimTextRef = useRef<string>("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordedAudioBlobRef = useRef<Blob | null>(null);
  const sttRequestSeqRef = useRef<number>(0);

  const effectiveApiUrl =
    apiUrl ||
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    "http://localhost:5000";

  // Fresh recognition cycle: Chrome Web Speech provides real-time visual feedback,
  // while ElevenLabs Scribe STT provides authoritative accuracy upon turn completion.
  const startFreshRecognition = useCallback(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("SpeechRecognition is not supported; using authoritative ElevenLabs Scribe STT.");
      setUseFallbackSTT(true);
      return;
    }

    // Clean up old instance completely before creating a new one
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    try {
      const instance = new SpeechRecognition();
      instance.continuous = true;
      instance.interimResults = true;
      instance.lang = speechLangRef.current || "en-US";

      recognitionRef.current = instance;

      instance.onstart = () => {
        recognitionStartingRef.current = false;
        isListeningRef.current = true;
        setIsListening(true);
        onVoiceStateChange("LISTENING");
        const existing = (
          sessionBaseTranscriptRef.current ||
          transcriptRef.current ||
          ""
        ).trim();
        if (existing && existing !== "Listening... Speak naturally") {
          committedFinalRef.current = existing;
          onTranscriptChange(existing);
        } else {
          onTranscriptChange("Listening... Speak naturally");
        }
        console.log("[VOICE] Microphone listening active in", instance.lang);
      };

      instance.onresult = (event: any) => {
        // While AI is speaking, discard incoming tokens to prevent speaker echo
        if (isAISpeakingRef.current) {
          return;
        }

        let newFinalChunk = "";
        let newInterimChunk = "";

        // Process only current session results without compounding previous runs
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const spokenText = result?.[0]?.transcript?.trim() || "";

          if (!spokenText) continue;

          if (result.isFinal) {
            newFinalChunk += (newFinalChunk ? " " : "") + spokenText;
          } else {
            newInterimChunk += (newInterimChunk ? " " : "") + spokenText;
          }
        }

        // Commit newly finalized text only once
        if (newFinalChunk) {
          const base = committedFinalRef.current.trim();
          if (!base) {
            committedFinalRef.current = newFinalChunk;
          } else if (!base.toLowerCase().endsWith(newFinalChunk.toLowerCase())) {
            committedFinalRef.current = `${base} ${newFinalChunk}`;
          }
        }

        interimTextRef.current = newInterimChunk;

        // Build composite non-duplicating display transcript
        const base = committedFinalRef.current.trim();
        let fullText = base;
        if (newInterimChunk) {
          fullText = base ? `${base} ${newInterimChunk}` : newInterimChunk;
        }

        fullText = cleanTranscriptText(fullText);

        if (fullText) {
          transcriptRef.current = fullText;
          onTranscriptChange(fullText);
          lastSpokenTimestampRef.current = Date.now();
          onVoiceStateChange("USER_SPEAKING");
        }
      };

      instance.onerror = (event: any) => {
        const error = event?.error;
        console.warn("⚠️ SpeechRecognition notice:", error);

        if (error === "not-allowed" || error === "service-not-allowed") {
          isListeningRef.current = false;
          setIsListening(false);
          onTranscriptChange("Microphone permission was blocked.");
          onWarning(
            "Chrome blocked microphone/speech recognition. Click the lock icon near the website address, allow Microphone, then reload the interview."
          );
          return;
        }

        if (error === "audio-capture") {
          isListeningRef.current = false;
          setIsListening(false);
          onTranscriptChange("Microphone could not be accessed.");
          onWarning(
            "Microphone could not be accessed. Check that the correct microphone is selected and that no other application is exclusively using it."
          );
          return;
        }
      };

      instance.onend = () => {
        recognitionStartingRef.current = false;

        // Sync stable committed text before restarting
        if (committedFinalRef.current && committedFinalRef.current.trim()) {
          sessionBaseTranscriptRef.current = committedFinalRef.current.trim();
        }

        // Auto-restart with a FRESH instance so Chrome never throws InvalidStateError
        if (
          isListeningRef.current &&
          !recognitionStopRequestedRef.current &&
          !interviewCompletedRef.current
        ) {
          window.setTimeout(() => {
            if (
              isListeningRef.current &&
              !recognitionStopRequestedRef.current &&
              !interviewCompletedRef.current
            ) {
              startFreshRecognition();
            }
          }, 40);
        } else {
          setIsListening(false);
        }
      };

      recognitionStartingRef.current = true;
      instance.start();
    } catch (e: any) {
      recognitionStartingRef.current = false;
      console.warn("⚠️ Error starting speech recognition instance:", e);
    }
  }, [
    speechLangRef,
    isAISpeakingRef,
    isListeningRef,
    transcriptRef,
    sessionBaseTranscriptRef,
    interviewCompletedRef,
    lastSpokenTimestampRef,
    onTranscriptChange,
    onVoiceStateChange,
    onWarning,
    setIsListening,
  ]);

  // Teardown recognition on unmount
  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      recognitionStopRequestedRef.current = true;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onstart = null;
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }
    };
  }, [isListeningRef]);

  // MediaRecorder for high-fidelity audio chunks passed to ElevenLabs Scribe
  const startAudioRecordingWithStream = (stream: MediaStream) => {
    try {
      const audioTracks = stream.getAudioTracks().filter((t) => t.readyState === "live");
      if (audioTracks.length === 0) {
        console.warn("⚠️ No live audio tracks available for MediaRecorder");
        return;
      }

      audioTracks.forEach((track) => {
        track.enabled = true;
      });

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }

      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/ogg")
        ? "audio/ogg"
        : "";

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(new MediaStream(audioTracks), options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (audioChunksRef.current.length > 0) {
          const blob = new Blob(audioChunksRef.current, {
            type: mimeType || "audio/webm",
          });
          recordedAudioBlobRef.current = blob;
          console.log("🎙️ Audio blob captured for ElevenLabs Scribe STT:", blob.size, "bytes");
        }
      };

      mediaRecorder.start(100);
      console.log("🎙️ High-gain Audio Recorder actively capturing speech for Scribe STT");
    } catch (err) {
      console.error("❌ Failed to start audio recorder with stream:", err);
    }
  };

  const stopAudioRecording = () => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
        console.log("🛑 Background audio recorder stopped");
      }
    } catch (err) {
      console.warn("Error stopping background audio recorder:", err);
    }
  };

  /**
   * Authoritative audio retrieval: gracefully flushes MediaRecorder and yields the complete Blob.
   * Flushes encoder buffer with requestData(), resolves immediately if stopped, or awaits stop event.
   */
  const stopAndGetAudioBlob = useCallback(async (): Promise<Blob | null> => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      if (audioChunksRef.current.length > 0) {
        const mime = recorder?.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: mime });
        recordedAudioBlobRef.current = blob;
        audioChunksRef.current = [];
        return blob;
      }
      if (recordedAudioBlobRef.current && recordedAudioBlobRef.current.size > 0) {
        return recordedAudioBlobRef.current;
      }
      return null;
    }

    return new Promise<Blob | null>((resolve) => {
      const mime = recorder.mimeType || "audio/webm";

      const finalizeBlob = () => {
        if (audioChunksRef.current.length > 0) {
          const blob = new Blob(audioChunksRef.current, { type: mime });
          recordedAudioBlobRef.current = blob;
          audioChunksRef.current = [];
          resolve(blob);
        } else {
          resolve(recordedAudioBlobRef.current);
        }
      };

      const safetyTimer = setTimeout(() => {
        finalizeBlob();
      }, 700);

      let stopFired = false;

      const onDataAvailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
        if (stopFired) {
          clearTimeout(safetyTimer);
          setTimeout(finalizeBlob, 20);
        }
      };

      const onStop = () => {
        stopFired = true;
        // Wait a brief tick to capture the final dataavailable event from requestData/stop
        setTimeout(() => {
          clearTimeout(safetyTimer);
          recorder.removeEventListener("dataavailable", onDataAvailable);
          finalizeBlob();
        }, 35);
      };

      recorder.addEventListener("dataavailable", onDataAvailable);
      recorder.addEventListener("stop", onStop, { once: true });

      try {
        // Explicitly flush pending encoder buffer, then wait for dataavailable + stop
        if (typeof recorder.requestData === "function" && recorder.state === "recording") {
          recorder.requestData();
        }
        recorder.stop();
      } catch (err) {
        clearTimeout(safetyTimer);
        finalizeBlob();
      }
    });
  }, []);

  // Authoritative ElevenLabs Scribe STT transcription (with Whisper fallback)
  const transcribeAudio = async (audioBlobOverride?: Blob): Promise<string> => {
    const seq = ++sttRequestSeqRef.current;
    let blob = audioBlobOverride || recordedAudioBlobRef.current;

    // If no blob available yet and recorder is still active, stop and retrieve it
    if (!blob && mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      blob = await stopAndGetAudioBlob();
    }

    if (!blob || blob.size < 150) {
      console.log(`[STT] Audio blob too small or empty (${blob?.size || 0} bytes), returning empty transcript.`);
      return "";
    }

    setIsTranscribingAudio(true);

    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");
      
      // Send normalized ISO language code (or omit if auto) to prevent ElevenLabs HTTP 400
      const normLang = normalizeElevenLabsLanguage(speechLangRef.current);
      if (normLang) {
        formData.append("language_code", normLang);
      }
      
      if (field) formData.append("field", field);
      if (category) formData.append("category", category);
      if (currentQuestionText) formData.append("question", currentQuestionText);
      if (level) formData.append("experience_level", level);

      let transcriptText = "";
      const sttStart = Date.now();

      // 1. Primary: FastAPI backend /interview/transcribe (ElevenLabs Scribe STT)
      try {
        const response = await fetch(`${effectiveApiUrl}/interview/transcribe`, {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          transcriptText = (data.transcript || "").trim();
          console.log(`[STT] Scribe backend response: engine=${data.engine || "elevenlabs-scribe"}, chars=${transcriptText.length}`);
        }
      } catch (backendErr) {
        console.warn("Backend STT endpoint unreachable, trying Next.js API route:", backendErr);
      }

      // 2. Fallback: Next.js /api/speech-to-text (ElevenLabs Scribe STT / Whisper)
      if (!transcriptText) {
        try {
          const localRes = await fetch("/api/speech-to-text", {
            method: "POST",
            body: formData,
          });

          if (localRes.ok) {
            const localData = await localRes.json();
            transcriptText = (localData.transcript || "").trim();
            console.log(`[STT] Local STT response: source=${localData.source || "elevenlabs-scribe"}, chars=${transcriptText.length}`);
          }
        } catch (localErr) {
          console.warn("Local speech-to-text route failed:", localErr);
        }
      }

      // Discard stale responses if newer STT request was initiated
      if (seq !== sttRequestSeqRef.current) {
        console.log(`[STT] Discarding stale transcription response (seq ${seq} vs current ${sttRequestSeqRef.current})`);
        return "";
      }

      const latency = Date.now() - sttStart;
      setSttLatency(latency);
      onSttLatencyChange?.(latency);

      if (transcriptText) {
        const cleaned = cleanTranscriptText(transcriptText);
        committedFinalRef.current = cleaned;
        interimTextRef.current = "";
        onTranscriptChange(cleaned);
        transcriptRef.current = cleaned;
        sessionBaseTranscriptRef.current = cleaned;
        console.log("✨ ElevenLabs Scribe successfully transcribed candidate utterance:", cleaned);
        return cleaned;
      }
    } catch (error) {
      console.warn("STT transcription notice:", error);
    } finally {
      if (seq === sttRequestSeqRef.current) {
        setIsTranscribingAudio(false);
      }
    }
    return "";
  };

  // Alias for backward compatibility with existing component references
  const transcribeWithWhisper = transcribeAudio;

  return {
    startFreshRecognition,
    startAudioRecordingWithStream,
    stopAudioRecording,
    stopAndGetAudioBlob,
    transcribeAudio,
    transcribeWithWhisper,
    recognitionRef,
    mediaRecorderRef,
    audioChunksRef,
    recordedAudioBlobRef,
    recognitionStartingRef,
    recognitionStopRequestedRef,
    useFallbackSTT,
    isTranscribingAudio,
    sttLatency,
  };
}

export default useSpeechRecognitionEngine;
