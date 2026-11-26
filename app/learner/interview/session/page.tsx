"use client";

import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  Settings,
  Play,
  Square,
  Send,
  Code,
  Terminal,
  FileText,
  Clock,
  User,
  Bot,
  AlertTriangle,
  Loader2,
  Monitor,
  Lock,
} from "lucide-react";
import {
  isDocumentFullscreen,
  enterFullscreen,
  exitFullscreen,
  subscribeToFullscreenChanges,
} from "@/lib/proctoring/fullscreenHelper";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import CodeEditor from "@/components/CodeEditor";
import AIAvatar from "@/components/AIAvatar";
import ScreenShareAnalysis from "@/components/interview/ScreenShareAnalysis";
import PreInterviewSetupScreen from "@/components/interview/PreInterviewSetupScreen";
import { mediaDeviceManager } from "@/lib/media/MediaDeviceManager";
import { useSessionRecording } from "@/hooks/interview/useSessionRecording";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useProctoring } from "@/lib/proctoring/useProctoring";
import CameraCalibrationModal from "@/components/proctoring/CameraCalibrationModal";
import ProctoringWarningModal from "@/components/proctoring/ProctoringWarningModal";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  initializeInterview,
  sendMessageToAI,
  markInterviewSessionStarted,
  executeCode,
  completeInterview,
  buildUserProfile,
  buildInterviewConfig,
  getConversationHistory,
  getInterviewQuestion,
} from "@/utils/api-helpers";
import {
  StartInterviewPayload,
  ChatConversationPayload,
  CodeExecutionPayload,
} from "@/types/interview-payloads";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

function InterviewSessionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, token } = useSelector((state: RootState) => state.auth);

  // Interview configuration
  const level = searchParams.get("level");
  const category = searchParams.get("category");
  const duration = searchParams.get("duration");
  const hasCodeEditorParam = searchParams.get("hasCodeEditor");
  const selectedLanguage = searchParams.get("language"); // Get selected language from URL

  // Get the correct language for the category
  const config = buildInterviewConfig(
    level || "mid",
    category || "fullstack",
    duration || "45"
  );
  const hasCodeEditor =
    hasCodeEditorParam !== null
      ? hasCodeEditorParam === "true"
      : config.hasCodeEditor;
  const defaultLanguage = selectedLanguage || config.language; // Use selected language first, fallback to config

  // State management
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const latestMediaStreamRef = useRef<MediaStream | null>(null);
  latestMediaStreamRef.current = mediaStream;
  const [timeRemaining, setTimeRemaining] = useState(
    parseInt(duration || "45") * 60
  );
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      type: "ai" | "user";
      content: string;
      timestamp: Date;
    }>
  >([]);
  const [userInput, setUserInput] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState(defaultLanguage); // Use the selected language from URL or fallback to mapped language
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewCompleted, setInterviewCompleted] = useState(false);
  const [hasCompletedDeviceSetup, setHasCompletedDeviceSetup] = useState(false);
  const [verifiedScreenStream, setVerifiedScreenStream] = useState<MediaStream | null>(null);
  const [isStartingInterview, setIsStartingInterview] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const sessionIdRef = useRef<string>("");
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [showCalibrationModal, setShowCalibrationModal] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const questionAskedAtRef = useRef<number>(Date.now());
  const isTurnInFlightRef = useRef<boolean>(false);
  const hasTimeExpiredRef = useRef<boolean>(false);
  const pendingTimeUpEndRef = useRef<boolean>(false);
  const activeSessionIdRef = useRef<string>("");

  // Full Session Video Recording (Option A: Composited Screen + PiP Webcam + Mixed Audio)
  const {
    isRecording,
    startFullSessionRecording,
    stopAndUploadFullSessionRecording,
    flushBeforeUnload,
  } = useSessionRecording({
    sessionId,
    token,
    mediaStream,
    mediaStreamRef,
    verifiedScreenStream,
    interviewStarted,
    interviewCompleted,
    apiUrl: API_URL,
  });

  // Enterprise AI Proctoring Hook Integration
  const {
    metrics: proctorMetrics,
    activeWarning: proctorWarning,
    cameraQuality,
    eventsTimeline: proctorEventsTimeline,
    isWindowLockedOut,
    isConnectionSuspended,
    reconnectCountdown,
    unlockWindow,
    captureSnapshot,
    warningState,
    warningCount,
    maxWarnings,
    proctoringStatus,
    activeWarningModal,
    acknowledgeWarning,
    isTerminated,
    logDiscreteEvent,
  } = useProctoring({
    sessionId: sessionId || undefined,
    token,
    videoRef,
    mediaStream,
    isActive: Boolean(mediaStream) && !isEnding && interviewStarted,
    config: {
      finalWarningAction: "TERMINATE_INTERVIEW",
    },
    onTerminateRequired: () => {
      handleEndInterview("proctoring_review_required");
    },
  });

  const tabSwitchCount = proctorEventsTimeline.filter(
    (e) => e.event_type === "TAB_SWITCH" || e.event_type === "WINDOW_BLUR"
  ).length;

  // Cleanup media streams (stable callback so state updates never trigger spurious track teardown)
  const cleanupMediaStreams = useCallback(() => {
    const streamsToStop = new Set<MediaStream>();
    if (mediaStreamRef.current) {
      streamsToStop.add(mediaStreamRef.current);
      mediaStreamRef.current = null;
    }
    if (latestMediaStreamRef.current) {
      streamsToStop.add(latestMediaStreamRef.current);
      latestMediaStreamRef.current = null;
    }

    streamsToStop.forEach((stream) => {
      try {
        stream.getTracks().forEach((track) => {
          track.stop();
          track.enabled = false;
        });
      } catch (e) {}
    });
    setMediaStream(null);

    if (videoRef.current) {
      try {
        if (videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          if (stream.getTracks) {
            stream.getTracks().forEach((track) => {
              track.stop();
              track.enabled = false;
            });
          }
          videoRef.current.srcObject = null;
        }
        videoRef.current.pause();
        videoRef.current.src = "";
      } catch (e) {}
    }

    try {
      mediaDeviceManager.cleanupAll();
    } catch (e) {}

    setIsMicOn(false);
    setIsCameraOn(false);
  }, []);

  // Check free trial usage
  useEffect(() => {
    const checkFreeTrialUsage = async () => {
      try {
        const response = await fetch(
          `${API_URL}/users/${user?._id}/interview-usage`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();

        if (data.freeInterviewsUsed >= 2 && !data.hasPaidPlan) {
          setWarningMessage(
            "You have used your 2 free interviews. Please upgrade to continue."
          );
          setShowWarning(true);
          setTimeout(() => {
            router.push("/pricing");
          }, 3000);
        }
      } catch (error) {
        console.error("Error checking trial usage:", error);
      }
    };

    if (user?._id && token) {
      checkFreeTrialUsage();
    }
  }, [user, token, router]);

  // Prevent navigation and accidental page leave
  useEffect(() => {
    if (!interviewStarted) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue =
        "Are you sure you want to leave the interview? Your progress will be lost.";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [interviewStarted]);

  // Synchronize fullscreen state across window events and handle auto-lock
  useEffect(() => {
    const syncState = () => {
      const active = isDocumentFullscreen();
      setIsFullscreen(active);
    };

    syncState();

    const unsubscribe = subscribeToFullscreenChanges((active) => {
      setIsFullscreen(active);
      if (!active && interviewStarted && !isEnding) {
        setWarningMessage("Window lock broken: Fullscreen was exited! Please re-lock fullscreen to continue.");
        setShowWarning(true);
      }
    });

    if (interviewStarted && !isEnding && !isDocumentFullscreen()) {
      enterFullscreen().catch(() => {});
    }

    return () => {
      unsubscribe();
    };
  }, [interviewStarted, isEnding]);
  // Initialize camera and microphone (only after interview start if no stream is active)
  useEffect(() => {
    if (!interviewStarted || mediaStreamRef.current) {
      return;
    }

    async function initializeMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        mediaStreamRef.current = stream;
        setMediaStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Failed to access media devices:", err);
        setWarningMessage(
          "Camera and microphone access is required for the interview."
        );
        setShowWarning(true);
      }
    }

    initializeMedia();
  }, [interviewStarted]);

  // Ensure camera and microphone are killed if candidate navigates away or reloads
  useEffect(() => {
    const handleUnload = () => {
      flushBeforeUnload();
      cleanupMediaStreams();
    };
    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
    };
  }, [flushBeforeUnload, cleanupMediaStreams]);

  // Timer countdown (freezes if connection is interrupted)
  useEffect(() => {
    if (!interviewStarted || isConnectionSuspended) return;

    const endedOnceRef = { current: false };
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (!endedOnceRef.current) {
            endedOnceRef.current = true;
            hasTimeExpiredRef.current = true;
            clearInterval(timer);
            if (isTurnInFlightRef.current) {
              pendingTimeUpEndRef.current = true;
            } else {
              handleEndInterview("time_up");
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [interviewStarted, isConnectionSuspended]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      cleanupMediaStreams();
      // Exit fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(console.error);
      }
    };
  }, [cleanupMediaStreams]);
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const toggleMic = () => {
    if (mediaStream) {
      mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMicOn;
      });
      setIsMicOn(!isMicOn);
    }
  };

  const toggleCamera = () => {
    if (mediaStream) {
      const willBeOn = !isCameraOn;
      mediaStream.getVideoTracks().forEach((track) => {
        track.enabled = willBeOn;
      });
      setIsCameraOn(willBeOn);
      if (!willBeOn) {
        setWarningMessage("Webcam disabled! Continuous video is strictly required for this proctored interview.");
        setShowWarning(true);
      }
    }
  };

  const startInterview = async () => {
    // Initialize interview with comprehensive payload
    let activeSessionId = `session_${Date.now()}_${user?._id}`;
    let introMessage = "";
    let firstQText = "";
    hasTimeExpiredRef.current = false;
    pendingTimeUpEndRef.current = false;
    isTurnInFlightRef.current = false;

    try {
      const initPayload: StartInterviewPayload = {
        user: buildUserProfile(user),
        configuration: buildInterviewConfig(
          level || "mid",
          category || "fullstack",
          duration || "45"
        ),
        context: {
          sessionId: activeSessionId,
          startTime: new Date().toISOString(),
          userAgent: navigator.userAgent,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          isFreeInterview: true,
          deviceInfo: {
            platform: navigator.platform || "Unknown",
            browser: navigator.userAgent.split(" ").pop() || "Unknown",
            screenResolution: `${screen.width}x${screen.height}`,
          },
        },
        preferences: {
          voiceEnabled: false,
          cameraEnabled: false,
          microphoneEnabled: true,
          fullscreenMode: false,
        },
      };

      const response = await initializeInterview(initPayload);
      console.log("Interview initialized:", response);
      if (response?.sessionId) {
        activeSessionId = response.sessionId;
      }
      introMessage = (response?.message || "").trim();
      firstQText = (response?.firstQuestion?.question || "").trim();
    } catch (error) {
      console.error("Error recording interview start:", error);
    }

    setSessionId(activeSessionId);
    activeSessionIdRef.current = activeSessionId;
    sessionIdRef.current = activeSessionId;
    setInterviewStarted(true);
    setIsAISpeaking(true);
    questionAskedAtRef.current = Date.now();

    markInterviewSessionStarted(activeSessionId, 0, token).catch((err) => {
      console.warn("Notice marking session started:", err);
    });

    let welcomeMessage = firstQText;
    if (firstQText && introMessage) {
      welcomeMessage =
        firstQText.toLowerCase().startsWith("hi ") || firstQText.toLowerCase().startsWith("welcome")
          ? firstQText
          : `${introMessage}\n\n${firstQText}`;
    } else if (!welcomeMessage) {
      welcomeMessage =
        introMessage ||
        `Hello! I'm your AI interviewer for today's ${category} interview at ${level} level. This session will last ${duration || "45"} minutes. Let's begin with a brief introduction - please tell me about your background and relevant experience.`;
    }

    setCurrentQuestion(firstQText || welcomeMessage);
    setMessages([
      {
        id: Date.now().toString(),
        type: "ai",
        content: welcomeMessage,
        timestamp: new Date(),
      },
    ]);

    setTimeout(() => {
      setIsAISpeaking(false);
    }, 1000);
  };

  const handleDeviceSetupCompleteAndStart = useCallback(async () => {
    setStartError(null);
    setIsStartingInterview(true);
    try {
      const compositeStream = mediaDeviceManager.getCompositeInterviewStream();
      mediaStreamRef.current = compositeStream;
      setMediaStream(compositeStream);

      if (videoRef.current) {
        videoRef.current.srcObject = compositeStream;
        videoRef.current.play().catch((e) => console.warn("Video play notice:", e));
      }

      const devState = mediaDeviceManager.getState();
      if (devState.screenStream) {
        setVerifiedScreenStream(devState.screenStream);
        setIsScreenSharing(true);
      }

      enterFullscreen().catch(() => {});
      await startInterview();
      setHasCompletedDeviceSetup(true);
    } catch (err: any) {
      setStartError(err.message || "Failed to start interview session.");
    } finally {
      setIsStartingInterview(false);
    }
  }, [category, duration, level, user]);

  useEffect(() => {
    if (interviewStarted && mediaStream && videoRef.current) {
      if (videoRef.current.srcObject !== mediaStream) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch((err) => console.warn("Video play notice:", err));
      }
    }
  }, [interviewStarted, mediaStream]);

  const sendMessage = async () => {
    const trimmedInput = userInput.trim();
    if (!trimmedInput || isEnding || hasTimeExpiredRef.current) return;

    const effectiveSessionId = sessionId || activeSessionIdRef.current;
    if (!effectiveSessionId) {
      // Ensure the interview was started and a sessionId is available
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          type: "ai" as const,
          content:
            "❌ No active session. Click 'Start Interview' before sending messages.",
          timestamp: new Date(),
        },
      ]);
      return;
    }

    const userMessage = {
      id: Date.now().toString(),
      type: "user" as const,
      content: trimmedInput,
      timestamp: new Date(),
    };

    const totalSecs = (parseInt(duration || "45") || 45) * 60;
    const elapsedSecs = Math.max(0, totalSecs - timeRemaining);
    const measuredResponseTime = Math.max(
      1,
      Math.round((Date.now() - questionAskedAtRef.current) / 1000)
    );

    setMessages((prev) => [...prev, userMessage]);
    setUserInput("");
    setIsAISpeaking(true);
    isTurnInFlightRef.current = true;
    let backendCompleted = false;

    try {
      // Send comprehensive AI conversation payload
      const conversationPayload: ChatConversationPayload = {
        sessionId: effectiveSessionId,
        user: {
          id: user?._id || "",
          name: user?.name || "",
          level: level || "mid",
          category: category || "fullstack",
        },
        message: {
          id: userMessage.id,
          type: "user",
          content: trimmedInput,
          timestamp: new Date().toISOString(),
        },
        conversationHistory: messages.map((msg) => ({
          id: msg.id,
          type: msg.type,
          content: msg.content,
          timestamp: msg.timestamp.toISOString(),
        })),
        currentContext: {
          questionNumber: messages.filter((m) => m.type === "ai").length + 1,
          timeElapsed: elapsedSecs,
          timeRemaining,
          currentTopic: category || "general",
          difficulty: level || "mid",
          expectedResponseType: hasCodeEditor
            ? "code"
            : ("text" as "text" | "code" | "explanation"),
        },
        userPerformance: {
          responseTime: measuredResponseTime,
          communicationScore: 85,
          confidenceLevel: 75,
        },
        responseTime: measuredResponseTime,
        metadata: {
          elapsedSeconds: elapsedSecs,
          timeRemaining,
          durationMinutes: parseInt(duration || "45") || 45,
        },
        interviewState: {
          tabSwitchCount: 0,
          violations: [],
          isFullscreen: false,
          microphoneActive: true,
          cameraActive: false,
        },
        codeContext: hasCodeEditor
          ? {
              hasCodeEditor: true,
              currentCode: code,
              language,
              codeSubmissions: messages.filter((m) => m.content.includes("```"))
                .length,
            }
          : undefined,
      };

      const response = await sendMessageToAI(conversationPayload);

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai" as const,
        content:
          response.aiResponse ||
          response.response ||
          "Thank you. Let's explore that further.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      const nextQ = response.currentQuestion?.question || response.nextQuestion;
      if (nextQ) {
        setCurrentQuestion(nextQ);
        questionAskedAtRef.current = Date.now();
      }

      if (response.isCompleted) {
        backendCompleted = true;
        pendingTimeUpEndRef.current = false;
        const reason = response.terminationReason || "time_up";
        setTimeout(() => {
          handleEndInterview(reason);
        }, 1500);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai" as const,
        content:
          "I apologize, but I encountered a technical issue. Let's continue with the next question.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      isTurnInFlightRef.current = false;
      setIsAISpeaking(false);
      if (pendingTimeUpEndRef.current && !backendCompleted) {
        pendingTimeUpEndRef.current = false;
        setTimeout(() => {
          handleEndInterview("time_up");
        }, 1500);
      }
    }
  };

  const runCode = async () => {
    if (!code.trim()) return;

    try {
      const codePayload: CodeExecutionPayload = {
        sessionId: `session_${Date.now()}_${user?._id}`,
        user: {
          id: user?._id || "",
          name: user?.name || "",
          level: level || "mid",
          category: category || "fullstack",
        },
        code: {
          content: code,
          language,
          questionContext: currentQuestion || "Code execution",
          submissionNumber:
            messages.filter((m) => m.content.includes("Code execution result"))
              .length + 1,
          timestamp: new Date().toISOString(),
        },
        interviewContext: {
          timeElapsed: parseInt(duration || "45") * 60 - timeRemaining,
          currentQuestion: currentQuestion || "Code Challenge",
          expectedOutput: undefined,
          testCases: [],
        },
        executionEnvironment: {
          timeout: 30,
          memoryLimit: "128MB",
          allowedLibraries: ["standard"],
        },
      };

      const result = await executeCode(codePayload);

      const codeResultMessage = {
        id: Date.now().toString(),
        type: "ai" as const,
        content: `Code execution result:\n\`\`\`\n${
          result.output || result.error
        }\n\`\`\`\n\n${result.feedback || "Good work! Let's continue."}`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, codeResultMessage]);
    } catch (error) {
      console.error("Error executing code:", error);
    }
  };

  const handleEndInterview = async (customTerminationReason?: string) => {
    if (isEnding) return;
    setIsEnding(true);

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    const effectiveSessionId = sessionId || activeSessionIdRef.current || sessionIdRef.current || `session_${Date.now()}_${user?._id}`;
    activeSessionIdRef.current = effectiveSessionId;
    sessionIdRef.current = effectiveSessionId;
    try {
      await stopAndUploadFullSessionRecording(effectiveSessionId);
    } catch (e) {
      console.warn("Notice finalizing session recording:", e);
    }
    setInterviewCompleted(true);

    cleanupMediaStreams();

    // Send comprehensive completion payload
    try {
      const configuredDurationSecs = Math.max(60, (parseInt(duration || "45") || 45) * 60);
      const elapsedTimeSecs = Math.max(0, configuredDurationSecs - timeRemaining);
      const answeredCount = messages.filter((m) => m.type === "user").length;
      const completionPayload = {
        sessionId: effectiveSessionId,
        user: buildUserProfile(user),
        configuration: buildInterviewConfig(
          level || "mid",
          category || "fullstack",
          duration || "45"
        ),
        results: {
          status: (customTerminationReason === "screen_recording_detected" || tabSwitchCount >= 3 ? "terminated" : "completed") as
            | "terminated"
            | "completed"
            | "incomplete",
          endTime: new Date().toISOString(),
          totalTimeSpent: elapsedTimeSecs,
          questionsAnswered: answeredCount,
          totalQuestions: null,
          completionPercentage: Math.min(
            100,
            Math.round((elapsedTimeSecs / configuredDurationSecs) * 100)
          ),
          terminationReason: (customTerminationReason === "screen_recording_detected"
            ? "violations"
            : tabSwitchCount >= 3
            ? "violations"
            : customTerminationReason === "time_up" || timeRemaining <= 0
            ? "time_up"
            : "user_ended") as
            | "time_up"
            | "user_ended"
            | "violations"
            | "technical_error",
        },
        conversationHistory: messages.map((msg) => ({
          id: msg.id,
          type: msg.type,
          content: msg.content,
          timestamp: msg.timestamp.toISOString(),
        })),
        codeSubmissions: hasCodeEditor
          ? [
              {
                questionId: "final_code",
                question: currentQuestion || "Final code submission",
                code,
                language,
                submittedAt: new Date().toISOString(),
                executionResult: undefined,
              },
            ]
          : undefined,
        violations: proctorEventsTimeline,
        performanceMetrics: {
          averageResponseTime: 30,
          totalSpeakingTime: 0,
          totalListeningTime: 0,
          communicationQuality: 75,
          technicalAccuracy: 70,
          problemSolvingApproach: 80,
        },
        deviceMetrics: {
          tabSwitchCount: proctorEventsTimeline.filter(
            (e) => e.event_type === "TAB_SWITCH" || e.event_type === "WINDOW_BLUR"
          ).length,
          fullscreenExits: proctorEventsTimeline.filter(
            (e) => e.event_type === "FULLSCREEN_EXIT"
          ).length,
          microphoneIssues: 0,
          cameraIssues: proctorEventsTimeline.filter(
            (e) => e.event_type === "CAMERA_DISCONNECTED" || e.event_type === "BLACK_FRAME"
          ).length,
          networkInterruptions: 0,
        },
        aiAnalysis: {
          strengths: [],
          improvements: [],
          detailedFeedback: {},
          recommendations: [],
        },
      };

      await completeInterview(completionPayload);
    } catch (error) {
      console.error("Error recording interview completion:", error);
    }

    // Cleanup media streams
    cleanupMediaStreams();

    // Exit fullscreen
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (error) {
        console.error("Error exiting fullscreen:", error);
      }
    }

    setInterviewStarted(false);
    setIsFullscreen(false);

    // Store results for the results page and redirect with sessionId
    const finalSessionId = sessionId || sessionIdRef.current || `session_${Date.now()}_${user?._id}`;

    // Clear active session data
    localStorage.removeItem("active_interview_session");
    localStorage.removeItem("interview_start_time");

    localStorage.setItem("lastInterviewSessionId", finalSessionId);
    router.push(`/learner/interview/results?id=${finalSessionId}`);
  };

  const getLanguageOptions = () => {
    switch (category) {
      case "frontend":
        return [
          "javascript",
          "typescript",
          "html",
          "css",
          "react",
          "vue",
          "angular",
          "sass",
          "nextjs",
        ];
      case "backend":
        return [
          "javascript",
          "python",
          "java",
          "go",
          "csharp",
          "php",
          "ruby",
          "rust",
          "cpp",
          "c",
          "scala",
          "kotlin",
        ];
      case "fullstack":
        return [
          "javascript",
          "typescript",
          "python",
          "java",
          "php",
          "ruby",
          "go",
          "rust",
          "csharp",
        ];
      case "mobile":
        return [
          "react-native",
          "flutter",
          "swift",
          "kotlin",
          "java",
          "dart",
          "objective-c",
          "xamarin",
          "ionic",
          "cordova",
        ];
      case "sql":
        return ["sql"];
      case "data-analyst":
        return ["python", "r", "sql"];
      case "aws":
        return ["yaml", "json", "bash"];
      default:
        return [
          "javascript",
          "python",
          "java",
          "typescript",
          "go",
          "rust",
          "cpp",
        ];
    }
  };

  if (!hasCompletedDeviceSetup && !interviewStarted) {
    return (
      <PreInterviewSetupScreen
        interviewRole={category || "Technical Interview"}
        interviewLevel={level || "Intermediate"}
        interviewDuration={duration || "45"}
        isStarting={isStartingInterview}
        startError={startError}
        interviewId={sessionId || "session_" + (category || "fullstack")}
        onStartInterview={handleDeviceSetupCompleteAndStart}
        onRetryStart={handleDeviceSetupCompleteAndStart}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFCF8] text-[#2B211C]">
      <Navbar />

      {/* Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 bg-[#FFFCF8] text-[#2B211C]/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8D9CC] rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-xl">
            <AlertTriangle size={48} className="text-[#E85D04] mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-3 text-[#111827]">
              Interview Warning
            </h3>
            <p className="text-[#64748B] text-sm mb-6">{warningMessage}</p>
            {warningMessage.toLowerCase().includes("fullscreen") ? (
              <button
                onClick={async () => {
                  const entered = await enterFullscreen();
                  if (entered || isDocumentFullscreen()) {
                    setIsFullscreen(true);
                    setShowWarning(false);
                  }
                }}
                className="w-full py-2.5 bg-gradient-to-r from-[#E85D04] to-[#E85D04] hover:from-[#C84F04] hover:to-[#E85D04] text-white font-bold rounded-xl transition shadow-md shadow-orange-500/20 cursor-pointer"
              >
                🔒 Re-Lock Window
              </button>
            ) : (
              <button
                onClick={() => setShowWarning(false)}
                className="w-full py-2.5 bg-gradient-to-r from-[#E85D04] to-[#E85D04] hover:from-[#C84F04] hover:to-[#E85D04] text-white font-bold rounded-xl transition shadow-md shadow-orange-500/20 cursor-pointer"
              >
                I Understand
              </button>
            )}
          </div>
        </div>
      )}

      {/* Proctoring Sticky Header if Window Unlocked */}
      {!isFullscreen && interviewStarted && !isEnding && (
        <div className="shrink-0 bg-rose-50 border-b border-rose-200 text-rose-700 px-4 py-2.5 text-center text-xs font-semibold flex flex-wrap items-center justify-between gap-2 z-50 shadow-xs">
          <div className="flex items-center space-x-2">
            <Lock size={14} className="text-rose-600 animate-pulse shrink-0" />
            <span>
              Window Lock Broken: Fullscreen Exited! Suspicious activity is being recorded in your audit timeline.
            </span>
          </div>
          <button
            onClick={async () => {
              const entered = await enterFullscreen();
              if (entered || isDocumentFullscreen()) {
                setIsFullscreen(true);
                setShowWarning(false);
              }
            }}
            className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded-lg text-xs font-semibold transition shadow-xs cursor-pointer"
          >
            Re-Lock Window
          </button>
        </div>
      )}

      <div className="pt-16 pb-24 md:pb-0">
        {/* Header Bar */}
        <div className="bg-[#FFFFFF] border-b border-[#E8D9CC] px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center flex-wrap gap-2 md:space-x-4">
              <div className="flex items-center space-x-2">
                <Clock size={20} className="text-[#E85D04]" />
                <span className="font-mono text-lg">
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <div className="text-sm text-gray-400">
                {category?.toUpperCase()} • {level?.toUpperCase()} Level
              </div>
              {tabSwitchCount > 0 && (
                <div className="text-sm text-red-400">
                  Tab Switches: {tabSwitchCount}/3
                </div>
              )}
            </div>

            <div className="flex items-center flex-wrap gap-2">
              <button
                onClick={toggleMic}
                className={`p-2 rounded-full ${
                  isMicOn
                    ? "bg-[#E85D04]/15 text-[#E85D04]"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
              </button>

              <button
                onClick={toggleCamera}
                className={`p-2 rounded-full ${
                  isCameraOn
                    ? "bg-[#E85D04]/15 text-[#E85D04]"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {isCameraOn ? <Video size={20} /> : <VideoOff size={20} />}
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById("session-screen-share-card");
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                  }
                }}
                className={`p-2 rounded-full transition-all ${
                  isScreenSharing
                    ? "bg-[#E85D04]/15 text-[#E85D04] ring-1 ring-[#E85D04]"
                    : "bg-white/10 text-white/80 hover:bg-white/20"
                }`}
                title={isScreenSharing ? "Screen Share Active (Click to view)" : "Live Screen Sharing"}
              >
                <Monitor size={20} />
              </button>


              <button
                onClick={() => handleEndInterview()}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Phone size={16} />
                <span>End Interview</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-120px)]">
          {/* Left Panel - Video and Chat */}
          <div className="w-full lg:w-1/2 flex flex-col border-r-0 lg:border-r border-[#E8D9CC]">
            {/* Video Section */}
            <div className="h-auto lg:h-1/2 bg-[#FFFFFF] p-3 sm:p-4">
              <div className="grid grid-cols-2 gap-2 sm:gap-4 h-full">
                {/* User Video */}
                <div className="bg-[#FFFCF8] rounded-lg overflow-hidden relative aspect-video sm:aspect-square ring-1 ring-[#E85D04]/20">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-[#FFFCF8] text-[#2B211C]/50 px-2 py-1 rounded text-sm">
                    You
                  </div>
                  {/* Live HUD Badge - Section 18: PROCTORING ● ACTIVE / ● ACTION REQUIRED */}
                  <div className="absolute top-2 left-2 z-10 flex flex-col space-y-1">
                    <div
                      className={`backdrop-blur-md text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center space-x-1.5 shadow-sm border ${
                        proctorMetrics.signalLevel === "NORMAL" && !activeWarningModal
                          ? "bg-[#FFFCF8] text-[#2B211C]/80 border-[#E8D9CC] text-emerald-300"
                          : "bg-red-950/80 border-red-500/50 text-red-300"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          proctorMetrics.signalLevel === "NORMAL" && !activeWarningModal
                            ? "bg-emerald-400 animate-pulse"
                            : "bg-red-400 animate-ping"
                        }`}
                      ></span>
                      <span className="font-bold tracking-wider">PROCTORING</span>
                      <span className="text-gray-500">|</span>
                      <span>
                        {proctorMetrics.signalLevel === "NORMAL" && !activeWarningModal
                          ? "● ACTIVE"
                          : "● ACTION REQUIRED"}
                      </span>
                      {warningCount > 0 && (
                        <>
                          <span className="text-gray-500">|</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                            Warning: {warningCount}/3
                          </span>
                        </>
                      )}
                    </div>
                    {isRecording && (
                      <div
                        data-testid="recording-active-badge"
                        className="backdrop-blur-md text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-600/90 text-white border border-red-400/50 w-fit flex items-center gap-1.5 shadow-sm"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <span>REC</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Avatar */}
                <div className="bg-[#FFFCF8] rounded-lg overflow-hidden relative aspect-video sm:aspect-square">
                  <AIAvatar isActive={isAISpeaking} />
                  <div className="absolute bottom-2 left-2 bg-[#FFFCF8] text-[#2B211C]/50 px-2 py-1 rounded text-sm">
                    AI Interviewer
                  </div>
                </div>
              </div>

              {/* Live Proctoring Status Panel (Step 21) */}
              <div className="mt-3 bg-[#FFFCF8] border border-gray-800/80 rounded-lg p-2.5 text-[11px] grid grid-cols-2 sm:grid-cols-5 gap-2 shadow-inner">
                <div className="flex items-center space-x-1.5 text-gray-400">
                  <span>Camera:</span>
                  <span className="text-emerald-400 font-medium flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>{proctorMetrics.cameraHealth === "CAMERA_OK" ? "Connected" : "Reconnecting"}</span>
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 text-gray-400">
                  <span>Face:</span>
                  <span className={`font-medium flex items-center space-x-1 ${proctorMetrics.facePresence === "FACE_PRESENT" ? "text-emerald-400" : "text-amber-400"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${proctorMetrics.facePresence === "FACE_PRESENT" ? "bg-emerald-400" : "bg-amber-400"}`}></span>
                    <span>{proctorMetrics.facePresence === "FACE_PRESENT" ? "Detected" : "Checking"}</span>
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 text-gray-400">
                  <span>People:</span>
                  <span className="text-gray-200 font-mono font-medium">{proctorMetrics.personCount || 1}</span>
                </div>
                <div className="flex items-center space-x-1.5 text-gray-400">
                  <span>Camera:</span>
                  <span className={`font-medium flex items-center space-x-1 ${!proctorMetrics.isObstructed ? "text-emerald-400" : "text-rose-400"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${!proctorMetrics.isObstructed ? "bg-emerald-400" : "bg-rose-400"}`}></span>
                    <span>{!proctorMetrics.isObstructed ? "Clear" : "Obstructed"}</span>
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 text-gray-400">
                  <span>Proctoring:</span>
                  <span className={`font-medium flex items-center space-x-1 ${proctorMetrics.signalLevel === "NORMAL" && !activeWarningModal ? "text-emerald-400" : "text-amber-400"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${proctorMetrics.signalLevel === "NORMAL" && !activeWarningModal ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`}></span>
                    <span>{proctorMetrics.signalLevel === "NORMAL" && !activeWarningModal ? "ACTIVE" : "ACTION REQUIRED"}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Live Screen Share & AI Analysis Card */}
            <div id="session-screen-share-card" className="p-3 bg-[#FFFFFF] border-b border-[#E8D9CC]">
              <ScreenShareAnalysis
                sessionId={sessionId || `session_${user?._id || "active"}`}
                token={token}
                apiBaseUrl={API_URL}
                defaultIntervalSeconds={5}
                initialStream={verifiedScreenStream || mediaDeviceManager.getState().screenStream}
                interviewStarted={interviewStarted && !isEnding}
                onSharingStateChange={(sharing) => setIsScreenSharing(sharing)}
                onScreenShareStopped={(reason) => {
                  console.warn("Screen share stopped during active interview:", reason);
                  logDiscreteEvent?.(
                    "SCREEN_SHARE_STOPPED",
                    0,
                    { reason, description: "Candidate stopped screen sharing during the active interview." },
                    "screen"
                  );
                }}
                onScreenRecordingDetected={(reason) => {
                  console.error("🛑 Screen recording detected! Immediately terminating session:", reason);
                  handleEndInterview("screen_recording_detected");
                }}
                onProctoringViolation={(violation) => {
                  console.warn("AI Screen Proctoring violation:", violation);
                  logDiscreteEvent?.(
                    violation.type,
                    0,
                    { reason: violation.message, ...(violation.details || {}) },
                    "screen"
                  );
                  if (violation.type === "SCREEN_RECORDING_DETECTED") {
                    handleEndInterview("screen_recording_detected");
                  }
                }}
              />
            </div>

            {/* Chat Section */}
            <div className="h-auto lg:h-1/2 flex flex-col bg-[#FFFFFF]">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.type === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[90%] sm:max-w-[80%] p-3 rounded-lg ${
                        message.type === "user"
                          ? "bg-[#E85D04] text-white"
                          : "bg-[#FFFCF8] text-white"
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        {message.type === "user" ? (
                          <User size={16} />
                        ) : (
                          <Bot size={16} className="text-[#E85D04]" />
                        )}
                        <span className="text-xs opacity-70">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="whitespace-pre-wrap">
                        {message.content}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-3 sm:p-4 border-t border-[#E8D9CC]">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type your response..."
                    className="flex-1 bg-[#FFFCF8] border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#E85D04]"
                    disabled={!interviewStarted || isAISpeaking}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={
                      !interviewStarted || isAISpeaking || !userInput.trim()
                    }
                    className="btn-primary px-4 py-2 disabled:opacity-50"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Code Editor (if applicable) */}
          {hasCodeEditor ? (
            <div className="w-full lg:w-1/2 flex flex-col">
              <div className="bg-[#FFFFFF] border-b border-[#E8D9CC] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Code size={20} className="text-[#E85D04]" />
                    <span className="font-semibold">Code Editor</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="bg-[#FFFCF8] border border-gray-600 rounded px-3 py-1 text-sm"
                    >
                      {getLanguageOptions().map((lang) => (
                        <option key={lang} value={lang}>
                          {lang.toUpperCase()}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={runCode}
                      className="btn-primary px-4 py-1 text-sm flex items-center space-x-1"
                    >
                      <Terminal size={14} />
                      <span>Run</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <CodeEditor
                  value={code}
                  onChange={setCode}
                  language={language}
                  theme="dark"
                />
              </div>
            </div>
          ) : (
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#FFFFFF]">
              <div className="text-center">
                <FileText size={48} className="text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Interview Notes</h3>
                <p className="text-gray-400">
                  This interview focuses on behavioral and conceptual questions.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Start Interview Overlay */}
        {!interviewStarted && (
          <div className="fixed inset-0 bg-[#FFFCF8] text-[#2B211C]/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="glass-card p-6 sm:p-8 text-center w-[92%] max-w-md">
              <h2 className="text-2xl font-bold mb-4">Ready to Start?</h2>
              <p className="text-gray-400 mb-6">
                Your {category} interview at {level} level is about to begin.
                Duration: {duration} minutes.
              </p>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
                <p className="text-yellow-400 text-sm">
                  <strong>Important:</strong> This interview will be in
                  fullscreen mode. Tab switching is monitored and limited to 3
                  attempts.
                </p>
              </div>
              <button
                onClick={() => setShowCalibrationModal(true)}
                className="btn-primary w-full sm:w-auto px-8 py-3 text-lg flex items-center justify-center mx-auto"
              >
                <Play className="h-5 w-5 mr-2" />
                Start Interview
              </button>
            </div>
          </div>
        )}

        {/* 3-Warning Proctoring System Modal */}
        <ProctoringWarningModal
          modalData={activeWarningModal}
          onAcknowledge={() => {
            acknowledgeWarning();
            if (isTerminated) {
              handleEndInterview();
            }
          }}
        />

        {/* Pre-Interview Camera Calibration & Quality Check Modal */}
        <CameraCalibrationModal
          isOpen={showCalibrationModal && !interviewStarted}
          onProceed={() => {
            setShowCalibrationModal(false);
            startInterview();
          }}
          onCancel={() => {
            setShowCalibrationModal(false);
            startInterview();
          }}
        />

        {/* Security Focus Lockout Modal (Window/Tab Switched) */}
        {isWindowLockedOut && interviewStarted && !isEnding && (
          <div className="fixed inset-0 bg-[#FFFCF8] text-[#2B211C]/95 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-[#121212] border-2 border-red-500/80 rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-[0_0_50px_rgba(239,68,68,0.25)] space-y-5">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
                <AlertTriangle size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Window Focus Lost
                </h3>
                <p className="text-sm text-gray-300">
                  Switching tabs or minimizing the interview window violates proctoring policy and is strictly logged.
                </p>
              </div>
              <button
                onClick={unlockWindow}
                className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold rounded-xl transition duration-200 shadow-lg shadow-red-500/20"
              >
                Return to Interview
              </button>
            </div>
          </div>
        )}

        {/* Network & Hardware Connection Interrupted Modal */}
        {isConnectionSuspended && interviewStarted && !isEnding && (
          <div className="fixed inset-0 bg-[#FFFCF8] text-[#2B211C]/95 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <div className="bg-[#121212] border-2 border-amber-500/80 rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-[0_0_50px_rgba(245,158,11,0.25)] space-y-5">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 animate-pulse">
                <AlertTriangle size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Connection Interrupted
                </h3>
                <p className="text-sm text-gray-300">
                  Network or camera feed lost. Interview timer is <strong>paused</strong>. Please reconnect within:
                </p>
                <div className="mt-3 text-3xl font-black text-amber-400 font-mono">
                  {reconnectCountdown}s
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Session content has been temporarily paused to protect evaluation integrity.
              </p>
            </div>
          </div>
        )}


        {/* Ending Interview Loader */}
        {isEnding && (
          <div className="fixed inset-0 bg-[#FFFCF8] text-[#2B211C]/90 backdrop-blur-sm z-[70] flex flex-col items-center justify-center">
            <Loader2 className="w-16 h-16 text-[#E85D04] animate-spin mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Ending Interview...
            </h2>
            <p className="text-gray-400">
              Please wait while we save your progress.
            </p>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

export default function InterviewSessionPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div>Loading...</div>}>
        <InterviewSessionContent />
      </Suspense>
    </ProtectedRoute>
  );
}
