"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface SpeechQueueItem {
  id: string;
  text: string;
  audioUrl: string;
}

export interface UseInterviewAudioQueueProps {
  isMutedRef: React.MutableRefObject<boolean>;
  isMicOnRef: React.MutableRefObject<boolean>;
  interviewStartedRef: React.MutableRefObject<boolean>;
  interviewCompletedRef: React.MutableRefObject<boolean>;
  isAISpeakingRef: React.MutableRefObject<boolean>;
  isListeningRef: React.MutableRefObject<boolean>;
  startListeningRef: React.MutableRefObject<() => void>;
  stopListeningRef: React.MutableRefObject<(() => Promise<void> | void) | null>;
  isEndingInterview: boolean;
  token?: string | null;
  apiUrl?: string;
  onVoiceStateChange?: (state: string) => void;
  onStartQuestionAnswerTimer?: () => void;
  onStopQuestionAnswerTimer?: () => void;
  onTtsLatencyChange?: (latency: number) => void;
  onRemoteAudioStream?: (stream: MediaStream | null) => void;
}

export interface UseInterviewAudioQueueReturn {
  aiSpeechQueue: SpeechQueueItem[];
  setAiSpeechQueue: React.Dispatch<React.SetStateAction<SpeechQueueItem[]>>;
  isProcessingQueue: boolean;
  isAISpeaking: boolean;
  isAudioPlaying: boolean;
  currentAudioUrl: string | null;
  spokenCharIndex: number;
  spokenRatio: number;
  isAutoplayBlocked: boolean;
  setIsAutoplayBlocked: React.Dispatch<React.SetStateAction<boolean>>;
  pendingFirstAudioRef: React.MutableRefObject<string | null>;
  speechSynthesisRef: React.MutableRefObject<SpeechSynthesis | null>;
  currentAudioRef: React.MutableRefObject<HTMLAudioElement | null>;
  setSpokenCharIndex: React.Dispatch<React.SetStateAction<number>>;
  setSpokenRatio: React.Dispatch<React.SetStateAction<number>>;
  setIsProcessingQueue: React.Dispatch<React.SetStateAction<boolean>>;
  addToSpeechQueue: (text: string, audioUrl?: string) => void;
  playAIAudio: (audioUrl: string, text: string) => void;
  playAIAudioDirect: (audioUrl: string, rawText: string) => Promise<void>;
  stopAudio: () => void;
  stopActiveAudioInstance: () => void;
  unlockBrowserAudio: () => void;
  cleanTextForSpeech: (rawText: string) => string;
}

export function useInterviewAudioQueue({
  isMutedRef,
  isMicOnRef,
  interviewStartedRef,
  interviewCompletedRef,
  isAISpeakingRef,
  isListeningRef,
  startListeningRef,
  stopListeningRef,
  isEndingInterview,
  token,
  apiUrl,
  onVoiceStateChange,
  onStartQuestionAnswerTimer,
  onStopQuestionAnswerTimer,
  onTtsLatencyChange,
  onRemoteAudioStream,
}: UseInterviewAudioQueueProps): UseInterviewAudioQueueReturn {
  const [aiSpeechQueue, setAiSpeechQueue] = useState<SpeechQueueItem[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [spokenCharIndex, setSpokenCharIndex] = useState<number>(Infinity);
  const [spokenRatio, setSpokenRatio] = useState<number>(1);
  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState(false);

  const pendingFirstAudioRef = useRef<string | null>(null);
  const audioUnlockedRef = useRef(false);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioGenerationRef = useRef(0);
  const speechProgressTickerRef = useRef<NodeJS.Timeout | null>(null);

  const aiSpeechQueueRef = useRef<SpeechQueueItem[]>([]);
  const isProcessingQueueRef = useRef(false);
  const playAIAudioDirectRef = useRef<(audioUrl: string, rawText: string) => Promise<void>>(
    (() => Promise.resolve()) as any
  );

  const effectiveApiUrl =
    apiUrl ||
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    "http://localhost:5000";

  // Clean raw AI response for human TTS playback
  const cleanTextForSpeech = useCallback((rawText: string): string => {
    let text = rawText || "";

    const splitMarkers = [
      "**Score:",
      "**Detailed Analysis:**",
      "✅ **Strengths:**",
      "📊 **Score:",
    ];

    for (const marker of splitMarkers) {
      const index = text.indexOf(marker);
      if (index >= 0) {
        text = text.slice(0, index);
      }
    }

    return text
      .replace(
        /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
        ""
      )
      .replace(/\*\*/g, "")
      .replace(/__/g, "")
      .replace(/`/g, "")
      .replace(/^\s*[-•]\s+/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }, []);

  // Stop only active playing audio element/utterance without wiping queue
  const stopActiveAudioInstance = useCallback(() => {
    if (speechProgressTickerRef.current) {
      clearInterval(speechProgressTickerRef.current);
      speechProgressTickerRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    activeUtteranceRef.current = null;
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current.onended = null;
        currentAudioRef.current.onerror = null;
        currentAudioRef.current.ontimeupdate = null;
      } catch {}
      currentAudioRef.current = null;
    }
    setSpokenCharIndex(Infinity);
    setSpokenRatio(1);
  }, []);

  // Stop all currently playing AI audio/TTS and clear queue
  const stopAudio = useCallback(() => {
    audioGenerationRef.current += 1;
    stopActiveAudioInstance();
    aiSpeechQueueRef.current = [];
    setAiSpeechQueue([]);
    isProcessingQueueRef.current = false;
    setIsProcessingQueue(false);
    setIsAISpeaking(false);
    isAISpeakingRef.current = false;
    setIsAudioPlaying(false);
    setCurrentAudioUrl(null);
  }, [stopActiveAudioInstance, isAISpeakingRef]);

  // Unlocks browser audio on first candidate interaction
  const unlockBrowserAudio = useCallback(() => {
    if (audioUnlockedRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        ctx
          .resume()
          .then(() => {
            const buffer = ctx.createBuffer(1, 1, 22050);
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.start(0);
          })
          .catch(() => {});
      }
    } catch {}

    try {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.resume();
        const silentUtterance = new SpeechSynthesisUtterance(" ");
        silentUtterance.volume = 0;
        silentUtterance.rate = 10;
        window.speechSynthesis.speak(silentUtterance);
      }
    } catch {}

    audioUnlockedRef.current = true;
    setIsAutoplayBlocked(false);
  }, []);

  const startListeningAfterAISpeech = useCallback(() => {
    if (
      isMutedRef.current ||
      !isMicOnRef.current ||
      !interviewStartedRef.current ||
      interviewCompletedRef.current
    ) {
      return;
    }

    window.setTimeout(() => {
      if (
        !isMutedRef.current &&
        isMicOnRef.current &&
        interviewStartedRef.current &&
        !interviewCompletedRef.current
      ) {
        console.log("🎤 AI finished -> starting user's turn & starting answer countdown");
        startListeningRef.current?.();
        onStartQuestionAnswerTimer?.();
      }
    }, 350);
  }, [
    isMutedRef,
    isMicOnRef,
    interviewStartedRef,
    interviewCompletedRef,
    startListeningRef,
    onStartQuestionAnswerTimer,
  ]);

  // Direct AI audio playback with fallback cascades
  const playAIAudioDirect = useCallback(
    async (audioUrl: string, rawText: string) => {
      stopActiveAudioInstance();
      onStopQuestionAnswerTimer?.();

      if (isMutedRef.current || interviewCompletedRef.current || isEndingInterview) return;

      const text = cleanTextForSpeech(rawText);
      if (!text) {
        startListeningAfterAISpeech();
        return;
      }

      // Stop candidate's mic while AI is speaking
      if (isListeningRef.current) {
        try {
          stopListeningRef.current?.();
        } catch {}
      }

      const generation = audioGenerationRef.current + 1;
      audioGenerationRef.current = generation;
      const ttsStart = Date.now();

      setIsAISpeaking(true);
      isAISpeakingRef.current = true;
      setIsAudioPlaying(true);
      setCurrentAudioUrl(audioUrl || null);
      onVoiceStateChange?.("AI_SPEAKING");
      setSpokenCharIndex(0);
      setSpokenRatio(0);
      if (speechProgressTickerRef.current) {
        clearInterval(speechProgressTickerRef.current);
        speechProgressTickerRef.current = null;
      }
      console.log("[TTS] Started speaking:", text.slice(0, 60));

      return new Promise<void>((resolve) => {
        let settled = false;

        const finish = () => {
          if (settled) return;
          settled = true;

          if (speechProgressTickerRef.current) {
            clearInterval(speechProgressTickerRef.current);
            speechProgressTickerRef.current = null;
          }
          setSpokenCharIndex(Infinity);
          setSpokenRatio(1);

          if (generation !== audioGenerationRef.current) {
            resolve();
            return;
          }

          activeUtteranceRef.current = null;
          currentAudioRef.current = null;
          setIsAISpeaking(false);
          isAISpeakingRef.current = false;
          setIsAudioPlaying(false);
          setCurrentAudioUrl(null);
          console.log("[TTS] Finished");

          if (interviewCompletedRef.current || isEndingInterview) {
            resolve();
            return;
          }

          onVoiceStateChange?.("LISTENING");
          startListeningAfterAISpeech();
          resolve();
        };

        const attachAudioProgress = (audioElem: HTMLAudioElement) => {
          audioElem.ontimeupdate = () => {
            if (audioElem.duration && !isNaN(audioElem.duration) && audioElem.duration > 0) {
              const ratio = Math.min(Math.max(audioElem.currentTime / audioElem.duration, 0), 1);
              setSpokenRatio(ratio);
              setSpokenCharIndex(Math.floor(ratio * text.length));
            }
          };
          const startT = Date.now();
          if (speechProgressTickerRef.current) clearInterval(speechProgressTickerRef.current);
          speechProgressTickerRef.current = setInterval(() => {
            if (settled || generation !== audioGenerationRef.current) {
              if (speechProgressTickerRef.current) clearInterval(speechProgressTickerRef.current);
              return;
            }
            if (audioElem.duration && !isNaN(audioElem.duration) && audioElem.duration > 0) {
              const ratio = Math.min(Math.max(audioElem.currentTime / audioElem.duration, 0), 1);
              setSpokenRatio(ratio);
              setSpokenCharIndex(Math.floor(ratio * text.length));
            } else {
              const elapsedSec = (Date.now() - startT) / 1000;
              const approx = Math.floor(elapsedSec * 15);
              setSpokenCharIndex((prev) => Math.max(prev, Math.min(approx, text.length)));
              if (text.length > 0) {
                setSpokenRatio((prev) => Math.max(prev, Math.min(approx / text.length, 0.98)));
              }
            }
          }, 100);
        };

        const playBrowserTTS = () => {
          if (
            settled ||
            generation !== audioGenerationRef.current ||
            interviewCompletedRef.current ||
            isEndingInterview
          ) {
            resolve();
            return;
          }

          if (isMutedRef.current) {
            finish();
            return;
          }

          if (typeof window === "undefined" || !("speechSynthesis" in window)) {
            playBackendTTS();
            return;
          }

          const synth = speechSynthesisRef.current || window.speechSynthesis;
          speechSynthesisRef.current = synth;

          try {
            synth.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            activeUtteranceRef.current = utterance;

            utterance.rate = 0.95;
            utterance.pitch = 1.02;
            utterance.volume = 1;

            const chooseVoice = () => {
              const voices = synth.getVoices();
              if (!voices || voices.length === 0) return;

              const naturalVoiceMatch =
                voices.find(
                  (v) =>
                    /natural|neural|online/i.test(v.name) &&
                    /aria|jenny|guy|sonia|neerja/i.test(v.name)
                ) ||
                voices.find((v) => /google\s+uk\s+english\s+female/i.test(v.name)) ||
                voices.find((v) => /google\s+us\s+english/i.test(v.name)) ||
                voices.find(
                  (v) => /google/i.test(v.name) && v.lang?.toLowerCase().startsWith("en")
                ) ||
                voices.find((v) =>
                  /samantha|victoria|karen|daniel|serena/i.test(v.name)
                ) ||
                voices.find((v) =>
                  /microsoft\s+(zira|david|mark|hazel)/i.test(v.name)
                ) ||
                voices.find((v) => v.lang?.toLowerCase() === "en-us") ||
                voices.find((v) => v.lang?.toLowerCase().startsWith("en")) ||
                voices[0];

              if (naturalVoiceMatch) {
                utterance.voice = naturalVoiceMatch;
                console.log("🎙️ AI Voice selected:", naturalVoiceMatch.name);
              }
            };

            chooseVoice();

            if (synth.getVoices().length === 0) {
              synth.addEventListener("voiceschanged", chooseVoice, { once: true });
            }

            utterance.onboundary = (event: SpeechSynthesisEvent) => {
              if (typeof event.charIndex === "number") {
                const charIdx = event.charIndex + (event.charLength || 5);
                setSpokenCharIndex(charIdx);
                if (text.length > 0) {
                  setSpokenRatio(Math.min(charIdx / text.length, 1));
                }
              }
            };

            utterance.onstart = () => {
              onTtsLatencyChange?.(Date.now() - ttsStart);
              const startT = Date.now();
              if (speechProgressTickerRef.current) clearInterval(speechProgressTickerRef.current);
              speechProgressTickerRef.current = setInterval(() => {
                if (settled || generation !== audioGenerationRef.current) {
                  if (speechProgressTickerRef.current)
                    clearInterval(speechProgressTickerRef.current);
                  return;
                }
                const elapsedSec = (Date.now() - startT) / 1000;
                const approxIdx = Math.floor(elapsedSec * 16);
                setSpokenCharIndex((prev) => Math.max(prev, Math.min(approxIdx, text.length)));
                if (text.length > 0) {
                  setSpokenRatio((prev) =>
                    Math.max(prev, Math.min(approxIdx / text.length, 0.98))
                  );
                }
              }, 100);
            };

            utterance.onend = () => finish();

            utterance.onerror = (event: any) => {
              if (generation !== audioGenerationRef.current) {
                resolve();
                return;
              }
              console.warn("⚠️ Browser TTS failed:", event?.error);
              activeUtteranceRef.current = null;
              finish();
            };

            setTimeout(() => {
              if (generation === audioGenerationRef.current && !settled) {
                synth.speak(utterance);
                console.log("🔊 Browser TTS speaking:", text.slice(0, 60));
              }
            }, 30);
          } catch (error) {
            console.warn("⚠️ Could not start browser TTS:", error);
            finish();
          }
        };

        const playBackendTTS = () => {
          if (
            settled ||
            generation !== audioGenerationRef.current ||
            interviewCompletedRef.current ||
            isEndingInterview
          ) {
            resolve();
            return;
          }

          const voicePreference =
            process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || "alloy";

          fetch(`${effectiveApiUrl}/api/text-to-speech`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              text,
              voice_id: voicePreference,
              model_id: "eleven_turbo_v2_5",
            }),
          })
            .then(async (response) => {
              if (!response.ok) {
                return fetch("/api/text-to-speech", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    text,
                    voice_id: voicePreference,
                  }),
                }).then((localRes) => {
                  if (!localRes.ok) throw new Error(`TTS HTTP ${localRes.status}`);
                  return localRes.json();
                });
              }
              return response.json();
            })
            .then((data) => {
              if (
                settled ||
                generation !== audioGenerationRef.current ||
                interviewCompletedRef.current ||
                isEndingInterview
              ) {
                resolve();
                return;
              }

              if (isMutedRef.current) {
                finish();
                return;
              }

              if (data?.useBrowserTTS) {
                playBrowserTTS();
                return;
              }

              let src = data?.audioUrl || "";
              if (!src && data?.audioContent) {
                src = String(data.audioContent).startsWith("data:")
                  ? data.audioContent
                  : `data:audio/mpeg;base64,${data.audioContent}`;
              }

              if (!src) {
                playBrowserTTS();
                return;
              }

              const audio = new Audio(src);
              audio.preload = "auto";
              currentAudioRef.current = audio;
              setCurrentAudioUrl(src);
              attachAudioProgress(audio);
              audio.addEventListener(
                "playing",
                () => {
                  try {
                    const capFn = (audio as any).captureStream || (audio as any).mozCaptureStream;
                    if (typeof capFn === "function") {
                      const captured: MediaStream = capFn.call(audio);
                      if (captured && captured.getAudioTracks().length > 0) {
                        onRemoteAudioStream?.(captured);
                      }
                    }
                  } catch {}
                },
                { once: true }
              );

              audio.onended = finish;
              audio.onerror = () => {
                console.warn(
                  "⚠️ Neural TTS audio playback failed, falling back to browser voice."
                );
                currentAudioRef.current = null;
                playBrowserTTS();
              };

              const playPromise = audio.play();
              if (playPromise !== undefined) {
                playPromise
                  .then(() => {
                    setIsAutoplayBlocked(false);
                    pendingFirstAudioRef.current = null;
                    console.log("✅ ElevenLabs/Neural TTS audio playing");
                  })
                  .catch((autoplayErr) => {
                    console.warn(
                      "⚠️ Autoplay blocked, falling back to browser TTS:",
                      autoplayErr
                    );
                    setIsAutoplayBlocked(true);
                    pendingFirstAudioRef.current = text;
                    audio.onended = null;
                    audio.onerror = null;
                    currentAudioRef.current = null;
                    playBrowserTTS();
                  });
              }
            })
            .catch((error) => {
              console.warn(
                "⚠️ ElevenLabs service unavailable, falling back to browser TTS:",
                error
              );
              playBrowserTTS();
            });
        };

        if (audioUrl) {
          try {
            const audio = new Audio(audioUrl);
            audio.preload = "auto";
            currentAudioRef.current = audio;
            attachAudioProgress(audio);
            audio.addEventListener(
              "playing",
              () => {
                try {
                  const capFn = (audio as any).captureStream || (audio as any).mozCaptureStream;
                  if (typeof capFn === "function") {
                    const captured: MediaStream = capFn.call(audio);
                    if (captured && captured.getAudioTracks().length > 0) {
                      onRemoteAudioStream?.(captured);
                    }
                  }
                } catch {}
              },
              { once: true }
            );

            audio.onended = finish;
            audio.onerror = () => {
              currentAudioRef.current = null;
              playBackendTTS();
            };

            const playPromise = audio.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  setIsAutoplayBlocked(false);
                  pendingFirstAudioRef.current = null;
                  console.log("✅ Direct audio URL playing");
                })
                .catch((err) => {
                  console.warn(
                    "⚠️ Direct audioUrl autoplay blocked, falling back to browser TTS:",
                    err
                  );
                  setIsAutoplayBlocked(true);
                  pendingFirstAudioRef.current = text;
                  audio.onended = null;
                  audio.onerror = null;
                  currentAudioRef.current = null;
                  playBrowserTTS();
                });
            }
          } catch {
            playBackendTTS();
          }
        } else {
          playBackendTTS();
        }
      });
    },
    [
      cleanTextForSpeech,
      isEndingInterview,
      token,
      effectiveApiUrl,
      isMutedRef,
      interviewCompletedRef,
      isAISpeakingRef,
      isListeningRef,
      stopListeningRef,
      startListeningAfterAISpeech,
      stopActiveAudioInstance,
      onStopQuestionAnswerTimer,
      onVoiceStateChange,
      onTtsLatencyChange,
    ]
  );

  useEffect(() => {
    playAIAudioDirectRef.current = playAIAudioDirect;
  }, [playAIAudioDirect]);

  // Serial queue processor
  const processNextInQueue = useCallback(async () => {
    if (
      isProcessingQueueRef.current ||
      interviewCompletedRef.current ||
      isEndingInterview
    )
      return;
    if (aiSpeechQueueRef.current.length === 0) return;

    isProcessingQueueRef.current = true;
    setIsProcessingQueue(true);

    try {
      while (
        aiSpeechQueueRef.current.length > 0 &&
        !interviewCompletedRef.current &&
        !isEndingInterview
      ) {
        const nextItem = aiSpeechQueueRef.current[0];
        if (nextItem && nextItem.text) {
          console.log("🔊 Speaking queue item:", nextItem.text.slice(0, 50));
          await playAIAudioDirectRef.current(nextItem.audioUrl, nextItem.text);
        }
        aiSpeechQueueRef.current.shift();
        setAiSpeechQueue([...aiSpeechQueueRef.current]);
      }
    } catch (error) {
      console.error("Error processing speech queue item:", error);
    } finally {
      isProcessingQueueRef.current = false;
      setIsProcessingQueue(false);
    }
  }, [isEndingInterview, interviewCompletedRef]);

  const addToSpeechQueue = useCallback(
    (text: string, audioUrl: string = "") => {
      if (interviewCompletedRef.current || isEndingInterview || !text || !text.trim()) {
        console.log("🛑 Suppressing speech queue: interview ended, ending, or empty text");
        return;
      }
      const id = `speech_${Date.now()}_${Math.random()}`;
      aiSpeechQueueRef.current.push({ id, text: text.trim(), audioUrl });
      setAiSpeechQueue([...aiSpeechQueueRef.current]);
      processNextInQueue();
    },
    [processNextInQueue, isEndingInterview, interviewCompletedRef]
  );

  useEffect(() => {
    if (!isProcessingQueueRef.current && aiSpeechQueue.length > 0) {
      processNextInQueue();
    }
  }, [aiSpeechQueue, processNextInQueue]);

  // Public AI Audio Play (adds to queue)
  const playAIAudio = useCallback(
    (audioUrl: string, text: string) => {
      if (interviewCompletedRef.current || isEndingInterview || !text?.trim()) return;
      addToSpeechQueue(text, audioUrl);
    },
    [addToSpeechQueue, isEndingInterview, interviewCompletedRef]
  );

  return {
    aiSpeechQueue,
    setAiSpeechQueue,
    isProcessingQueue,
    isAISpeaking,
    isAudioPlaying,
    currentAudioUrl,
    spokenCharIndex,
    spokenRatio,
    isAutoplayBlocked,
    setIsAutoplayBlocked,
    pendingFirstAudioRef,
    speechSynthesisRef,
    currentAudioRef,
    setSpokenCharIndex,
    setSpokenRatio,
    setIsProcessingQueue,
    addToSpeechQueue,
    playAIAudio,
    playAIAudioDirect,
    stopAudio,
    stopActiveAudioInstance,
    unlockBrowserAudio,
    cleanTextForSpeech,
  };
}

export default useInterviewAudioQueue;
