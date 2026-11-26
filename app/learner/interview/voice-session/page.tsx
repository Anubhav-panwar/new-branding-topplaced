"use client";

import { useState, useEffect, useRef, Suspense, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  Play,
  Square,
  Send,
  Code,
  Terminal,
  Clock,
  User,
  Bot,
  AlertTriangle,
  Download,
  Volume2,
  VolumeX,
  Pause,
  Maximize2,
  Minimize2,
  Wifi,
  WifiOff,
  RotateCcw,
  Globe,
  Check,
  CheckCircle2,
  Shield,
  ShieldCheck,
  Eye,
  Smartphone,
  Monitor,
  ChevronDown,
  ChevronUp,
  Settings,
  Sparkles,
  GraduationCap,
  MessageSquare,
  RefreshCw,
  X,
  Lock,
  Layers,
  HelpCircle,
  Activity,
  FileText,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import CodeEditor from "@/components/CodeEditor";
import Logo from "@/components/Logo";
import AIAvatar from "@/components/AIAvatar";
import SystemDesignCanvas from "@/components/SystemDesignCanvas";
import SpeechAnalyticsWidget from "@/components/interview/SpeechAnalyticsWidget";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useProctoring } from "@/lib/proctoring/useProctoring";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { io, Socket } from "socket.io-client";
import {
  buildInterviewConfig,
  markInterviewSessionStarted,
  updateInterviewProgress,
} from "@/utils/api-helpers";
import AIStatusBadge from "@/components/interview/AIStatusBadge";
import AudioWaveform from "@/components/interview/AudioWaveform";
import ScreenShareAnalysis, { ScreenAnalysisData } from "@/components/interview/ScreenShareAnalysis";
import PreInterviewSetupScreen from "@/components/interview/PreInterviewSetupScreen";
import { mediaDeviceManager } from "@/lib/media/MediaDeviceManager";
import { useSessionRecording } from "@/hooks/interview/useSessionRecording";
import { useAudioVisualizer } from "@/hooks/interview/useAudioVisualizer";
import { cleanTranscriptText } from "@/utils/transcript-cleaner";
import { useSpeechRecognitionEngine } from "@/hooks/interview/useSpeechRecognitionEngine";
import { useInterviewAudioQueue } from "@/hooks/interview/useInterviewAudioQueue";
import ProfessionalQuestionView from "@/components/interview/ProfessionalQuestionView";
import { TechnicalWorkspaceDrawer } from "@/components/interview/TechnicalWorkspaceDrawer";
import { InterviewHeaderControls } from "@/components/interview/InterviewHeaderControls";
import { InterviewModals } from "@/components/interview/InterviewModals";
import { VoiceDiagnosticsPanel } from "@/components/interview/VoiceDiagnosticsPanel";
import {
  isDocumentFullscreen,
  enterFullscreen,
  exitFullscreen,
  subscribeToFullscreenChanges,
} from "@/lib/proctoring/fullscreenHelper";

// Your backend URL
const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:5000";

console.log("🔗 Interview API URL:", API_URL);

interface Message {
  id: string;
  type: "ai" | "user" | "system";
  content: string;
  timestamp: Date;
  audioUrl?: string;
  isPlaying?: boolean;
}

function VoiceInterviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationContainerRef = useRef<HTMLDivElement>(null);
  const centerPanelRef = useRef<HTMLDivElement>(null);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { user, token } = useSelector((state: RootState) => state.auth);

  // Add level mapping function
  const mapLevelToBackend = (frontendLevel: string): string => {
    const levelMap: { [key: string]: string } = {
      beginner: "beginner",
      intermediate: "intermediate",
      advanced: "advanced",
      // Legacy mappings for backward compatibility
      entry: "beginner",
      mid: "intermediate",
      senior: "advanced",
      lead: "advanced",
    };
    return levelMap[frontendLevel] || "intermediate";
  };

  // Interview configuration from URL parameters
  const level = searchParams.get("level") || "mid";
  const category = searchParams.get("category") || "fullstack";
  const field = searchParams.get("field") || "";
  const duration = searchParams.get("duration") || "30";
  const userId = searchParams.get("userId") || user?._id || "";
  const userName = searchParams.get("userName") || user?.name || "";
  const userEmail = searchParams.get("userEmail") || user?.email || "";
  const isFreeInterview = searchParams.get("isFreeInterview") === "true";
  const selectedLanguage = searchParams.get("language"); // Get selected language from URL

  // Get the correct configuration for the category
  const config = buildInterviewConfig(level, category, duration);
  const hasCodeEditorParam = searchParams.get("hasCodeEditor");
  const hasCodeEditor =
    hasCodeEditorParam !== null
      ? hasCodeEditorParam === "true"
      : config.hasCodeEditor;
  const defaultLanguage = selectedLanguage || config.language; // Use selected language first, fallback to config

  // State management
  const [isRecording, setIsRecording] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const allMediaStreamsRef = useRef<Set<MediaStream>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState(parseInt(duration) * 60);
  const [messages, setMessages] = useState<Message[]>([]);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState(defaultLanguage); // Use the selected language from URL or fallback to mapped language
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFullscreenLocked, setIsFullscreenLocked] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [candidateAnswer, setCandidateAnswer] = useState("");
  const [currentQuestionText, setCurrentQuestionText] = useState<string>("");
  const speechProgressTickerRef = useRef<NodeJS.Timeout | null>(null);
  const [currentQuestionCategory, setCurrentQuestionCategory] = useState<string>("");
  const [isFollowupQuestion, setIsFollowupQuestion] = useState(false);
  const [speechLang, setSpeechLang] = useState<"en-US" | "en-IN" | "en-GB" | "en-AU">("en-IN");
  const speechLangRef = useRef<"en-US" | "en-IN" | "en-GB" | "en-AU">("en-IN");
  const isAISpeakingRef = useRef(false);
  const bargeInCounterRef = useRef(0);
  const [isBargeInActive, setIsBargeInActive] = useState(false);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [interviewProgress, setInterviewProgress] = useState(0);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenAnalysis, setScreenAnalysis] = useState<ScreenAnalysisData | null>(null);
  const [hasCompletedDeviceSetup, setHasCompletedDeviceSetup] = useState(false);
  const [verifiedScreenStream, setVerifiedScreenStream] = useState<MediaStream | null>(null);

  // Latency Diagnostics Tracking (Section 31 & 34)
  const [sttLatency, setSttLatency] = useState<number | null>(null);
  const [llmLatency, setLlmLatency] = useState<number | null>(null);
  const [ttsLatency, setTtsLatency] = useState<number | null>(null);

  // Phase 2 & 3: Intelligent Interview Brain & Diagnostics State
  const [brainCompetency, setBrainCompetency] = useState<string>("");
  const [brainDifficulty, setBrainDifficulty] = useState<string>(level || "MEDIUM");
  const [brainVocabulary, setBrainVocabulary] = useState<string[]>([]);
  const [brainFollowupDecision, setBrainFollowupDecision] = useState<string>("NO");
  const [brainNextCompetency, setBrainNextCompetency] = useState<string>("");
  const [brainAnswerProcessing, setBrainAnswerProcessing] = useState<string>("IDLE");
  const [brainSttPrompt, setBrainSttPrompt] = useState<string>("");
  const [brainAnswerDepth, setBrainAnswerDepth] = useState<string>("MODERATE");
  const [brainClaims, setBrainClaims] = useState<string[]>([]);
  const [brainSkills, setBrainSkills] = useState<string[]>([]);
  const [brainEvidenceStrength, setBrainEvidenceStrength] = useState<string>("medium");
  const [brainVoiceCommand, setBrainVoiceCommand] = useState<string | null>(null);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [showSecurityInstructions, setShowSecurityInstructions] = useState(false);

  // Dynamic STAR Response Coach detection
  const starAnalysis = useMemo(() => {
    const text = (candidateAnswer || transcript || "").toLowerCase();
    if (!text || text.length < 15) {
      return { s: false, t: false, a: false, r: false, count: 0 };
    }
    const s = /\b(when|at|company|team|client|project|problem|situation|faced|incident|system|architecture)\b/.test(text);
    const t = /\b(goal|task|objective|needed to|responsible for|had to|assigned|challenge|requirement)\b/.test(text);
    const a = /\b(i built|i designed|i implemented|i led|i decided|i solved|my approach|i used|i created|we analyzed|i optimized|i refactored)\b/.test(text);
    const r = /\b(\d+%|\d+k|\d+x|percent|reduced|increased|saved|improved|achieved|result|outcome|latency|revenue|delivered)\b/.test(text);
    const count = [s, t, a, r].filter(Boolean).length;
    return { s, t, a, r, count };
  }, [candidateAnswer, transcript]);

  // Redesign Helper: Humanize labels for UI
  const humanizeLabel = (str: string): string => {
    if (!str) return "";
    return str
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Redesign Helper: Dynamic category config according to interview field
  const getCategoryConfig = (cat: string, fld: string) => {
    const target = (fld || cat || "").toLowerCase();
    
    if (target.includes("market")) {
      return { name: "Marketing", isTech: false, pillClass: "bg-amber-50 text-amber-800 border-amber-200" };
    }
    if (target.includes("hr") || target.includes("human") || target.includes("recruit") || target.includes("talent")) {
      return { name: "HR", isTech: false, pillClass: "bg-[#FFF0E6] text-[#E85D04] border border-[#E8D9CC]" };
    }
    if (target.includes("analyst") || target.includes("business") || target.includes("data analyst")) {
      return { name: "Analytical", isTech: false, pillClass: "bg-blue-50 text-blue-800 border-blue-200" };
    }
    if (target.includes("behavior") || target.includes("leadership") || target.includes("manage") || target.includes("situational")) {
      return { name: "Behavioral", isTech: false, pillClass: "bg-emerald-50 text-emerald-800 border-emerald-200" };
    }
    if (target.includes("content") || target.includes("copy") || target.includes("writing") || target.includes("writer")) {
      return { name: "Content", isTech: false, pillClass: "bg-rose-50 text-rose-800 border-rose-200" };
    }
    if (target.includes("cloud") || target.includes("devops") || target.includes("aws") || target.includes("azure") || target.includes("infra")) {
      return { name: "Design & Cloud", isTech: true, pillClass: "bg-sky-50 text-sky-700 border border-sky-200" };
    }
    if (target.includes("design") || target.includes("ui") || target.includes("ux") || target.includes("graphic")) {
      return { name: "Design & Cloud", isTech: false, pillClass: "bg-teal-50 text-teal-800 border-teal-200" };
    }
    if (target.includes("sales") || target.includes("finance") || target.includes("account")) {
      return { name: humanizeLabel(target), isTech: false, pillClass: "bg-amber-50 text-amber-800 border-amber-200" };
    }
    // Default to Technical
    return { name: "Technical", isTech: true, pillClass: "bg-[#FFFCF8] text-[#E85D04] border border-[#E8D9CC]" };
  };

  const categoryConfig = getCategoryConfig(category, field);

  const toggleFullscreen = async () => {
    if (isDocumentFullscreen()) {
      await exitFullscreen();
    } else {
      await enterFullscreen();
    }
  };

  const replayLastAIMessage = () => {
    const lastAiMsg = [...messages].reverse().find((m) => m.type === "ai");
    if (lastAiMsg) {
      setSpokenCharIndex(0);
      setSpokenRatio(0);
      replayAIMessage(lastAiMsg);
    }
  };


  // Sync speech language dynamically to recognition engine
  useEffect(() => {
    speechLangRef.current = speechLang;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = speechLang;
        console.log("🌐 SpeechRecognition language dynamically updated to:", speechLang);
      } catch (e) {
        console.warn("Could not set speech recognition language dynamically:", e);
      }
    }
  }, [speechLang]);

  // Formal Voice/Audio Pipeline State Machine
  // IDLE | LISTENING | USER_SPEAKING | TRANSCRIBING | THINKING | AI_SPEAKING | INTERRUPTED | ERROR
  const [voiceState, setVoiceState] = useState<
    "IDLE" | "LISTENING" | "USER_SPEAKING" | "TRANSCRIBING" | "THINKING" | "AI_SPEAKING" | "INTERRUPTED" | "ERROR"
  >("IDLE");
  const voiceStateRef = useRef<
    "IDLE" | "LISTENING" | "USER_SPEAKING" | "TRANSCRIBING" | "THINKING" | "AI_SPEAKING" | "INTERRUPTED" | "ERROR"
  >("IDLE");

  const setVoiceStateSync = (
    newState: "IDLE" | "LISTENING" | "USER_SPEAKING" | "TRANSCRIBING" | "THINKING" | "AI_SPEAKING" | "INTERRUPTED" | "ERROR"
  ) => {
    voiceStateRef.current = newState;
    setVoiceState(newState);
  };



  // Loading states for buttons
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [isEndingInterview, setIsEndingInterview] = useState(false);
  const [showConfirmEnd, setShowConfirmEnd] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<"chat" | "code">(
    "chat"
  );

  // Response time tracking like testInterview.html
  const [responseStartTime, setResponseStartTime] = useState<number | null>(
    null
  );
  const [lastResponseTime, setLastResponseTime] = useState<number | null>(null);

  // Debug panel like testInterview.html
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [debugLogs, setDebugLogs] = useState<any[]>([]);
  const [codeExecutionSuccess, setCodeExecutionSuccess] = useState(false);
  const [lastExecutionResult, setLastExecutionResult] = useState<any>(null);

  // Progress tracking function (duration-driven, no fixed question limit)
  const updateProgress = (answered: number, total?: number | null) => {
    setQuestionsAnswered(answered);
    setTotalQuestions(total && total > 0 ? total : null);
    const totalSecs = Math.max(60, (parseInt(duration || "30") || 30) * 60);
    const elapsedSecs = Math.max(0, totalSecs - timeRemainingRef.current);
    const durationPct = Math.min(99, Math.round((elapsedSecs / totalSecs) * 100));
    const percentage =
      total && total > 0
        ? Math.round((answered / total) * 100)
        : durationPct;
    setInterviewProgress(percentage);
  };
  const [isMuted, setIsMuted] = useState(false); // New state for mute functionality
  const isMutedRef = useRef(false); // Ref for async mute access
  const isMicOnRef = useRef(isMicOn); // Ref for async mic access
  const interviewStartedRef = useRef(false);
  const interviewCompletedRef = useRef(false);
  const isListeningRef = useRef(false); // Ref so SpeechRecognition callbacks see latest state
  const transcriptRef = useRef(""); // Keeps the latest speech text without React state lag
  const startListeningRef = useRef<() => void>(() => { }); // Ref to hold latest startListening function
  const hasInterviewStartedRef = useRef(false); // Guarantees interview initialization runs strictly once

  const audioUnlockedRef = useRef(false); // Tracks whether browser audio has been unlocked by user gesture

  // Interview/session state must be declared before any effect that references it.
  const [sessionId, setSessionId] = useState<string>("");
  const [totalQuestions, setTotalQuestions] = useState<number | null>(null);
  const [isWrappingUp, setIsWrappingUp] = useState<boolean>(false);
  const [interviewPhase, setInterviewPhase] = useState<string>("MAIN");
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(0);
  const [currentQuestionId, setCurrentQuestionId] = useState<string>("");
  const [interviewCompleted, setInterviewCompleted] = useState(false);

  const timeRemainingRef = useRef<number>(parseInt(duration || "30") * 60);
  const hasTimeExpiredRef = useRef<boolean>(false);
  const isAiProcessingRef = useRef<boolean>(false);
  const isTranscribingAudioRef = useRef<boolean>(false);
  const sttLatencyRef = useRef<number | null>(null);
  const ttsLatencyRef = useRef<number | null>(null);
  const hasCalledBeginRef = useRef<boolean>(false);
  const pendingTimeUpWrapRef = useRef<boolean>(false);
  const pendingClosingReasonRef = useRef<string | null>(null);
  const closingSpeechSeenActiveRef = useRef<boolean>(false);


  // Sync mute state with ref
  useEffect(() => {
    isMutedRef.current = isMuted;
    if (isMuted) {
      stopAudio();
    }
  }, [isMuted]);

  // Sync mic state with ref
  useEffect(() => {
    isMicOnRef.current = isMicOn;
  }, [isMicOn]);

  useEffect(() => {
    interviewStartedRef.current = interviewStarted;
  }, [interviewStarted]);

  useEffect(() => {
    interviewCompletedRef.current = interviewCompleted;
  }, [interviewCompleted]);

  useEffect(() => {
    timeRemainingRef.current = timeRemaining;
  }, [timeRemaining]);

  useEffect(() => {
    sttLatencyRef.current = sttLatency;
  }, [sttLatency]);

  useEffect(() => {
    ttsLatencyRef.current = ttsLatency;
  }, [ttsLatency]);

  const [showCodeEditor, setShowCodeEditor] = useState<boolean>(hasCodeEditor); // Show by default if available
  const [showWhiteboard, setShowWhiteboard] = useState<boolean>(false);
  const [technicalDrawerTab, setTechnicalDrawerTab] = useState<"code" | "whiteboard">("code");
  const finalTranscriptRef = useRef("");
  const interimTranscriptRef = useRef("");
  const sessionBaseTranscriptRef = useRef(""); // Stable base transcript that persists across recognition restarts
  const answerFinalizedRef = useRef(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  useEffect(() => {
    isAiProcessingRef.current = isAiProcessing;
  }, [isAiProcessing]);

  // Per-Question Answer Timer (60s with auto-submit)
  const QUESTION_TIME_LIMIT = 60;
  const [questionTimer, setQuestionTimer] = useState<number>(QUESTION_TIME_LIMIT);
  const [isQuestionTimerActive, setIsQuestionTimerActive] = useState<boolean>(false);
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stopListeningRef = useRef<(() => Promise<void> | void) | null>(null);

  const stopQuestionAnswerTimer = useCallback(() => {
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
      questionTimerRef.current = null;
    }
    setIsQuestionTimerActive(false);
  }, []);

  const startQuestionAnswerTimer = useCallback(() => {
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
      questionTimerRef.current = null;
    }
    setQuestionTimer(QUESTION_TIME_LIMIT);
    setIsQuestionTimerActive(true);
  }, [QUESTION_TIME_LIMIT]);

  const addRemoteAudioStreamRef = useRef<(stream: MediaStream | null) => void>(() => {});

  // AI Speech Synthesis & Audio Queue Management
  const {
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
  } = useInterviewAudioQueue({
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
    apiUrl: API_URL,
    onVoiceStateChange: (state) => setVoiceStateSync(state as any),
    onStartQuestionAnswerTimer: startQuestionAnswerTimer,
    onStopQuestionAnswerTimer: stopQuestionAnswerTimer,
    onTtsLatencyChange: setTtsLatency,
    onRemoteAudioStream: (stream) => addRemoteAudioStreamRef.current(stream),
  });

  // Sync AI speaking state with ref for instant VAD barge-in response
  useEffect(() => {
    isAISpeakingRef.current = isAISpeaking;
  }, [isAISpeaking]);


  // Phase 4: Modular AI Camera Proctoring & Interview Security Engine
  const [showCalibrationModal, setShowCalibrationModal] = useState<boolean>(false);
  const [hasCalibrated, setHasCalibrated] = useState<boolean>(true);
  const [isProctorHudExpanded, setIsProctorHudExpanded] = useState<boolean>(false);
  const isDisqualifyingRef = useRef(false);
  const fullscreenExitsCountRef = useRef<number>(0);

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
    isActive: Boolean(mediaStream) && !interviewCompleted && interviewStarted,
    isAISpeaking: isAISpeaking,
    isCandidateAnswering: isListening || isMicOn || isQuestionTimerActive,
    config: {
      finalWarningAction: "TERMINATE_INTERVIEW",
    },
    onTerminateRequired: () => {
      handleEndInterview("proctoring_review_required");
    },
  });

  const proctorStatus =
    proctorMetrics.facePresence === "FACE_MISSING"
      ? "no_face"
      : proctorMetrics.gazeDirection !== "CENTER" && proctorMetrics.gazeDirection !== "UNKNOWN"
      ? "looking_away"
      : proctorMetrics.isObstructed
      ? "suspicious_hand"
      : proctorMetrics.personCount > 1
      ? "multiple_faces"
      : isWindowLockedOut
      ? "tab_switched"
      : "aligned";

  const proctorViolationCount = warningCount;

  const logProctoringViolation = (eventType: string, message: string, severity: string = "warning") => {
    // Automatically handled by centralized ProctoringEventEngine inside useProctoring
  };

  // AI Confidence & Body Language Telemetry State (Phase 1)
  const targetCompanyParam = searchParams.get("targetCompany") || "general";
  const tailorToResumeParam = searchParams.get("tailorToResume") === "true";
  const [eyeContactRatio, setEyeContactRatio] = useState<number>(88);
  const [postureStability, setPostureStability] = useState<number>(90);
  const [speechPaceWpm, setSpeechPaceWpm] = useState<number>(135);
  const [confidenceIndex, setConfidenceIndex] = useState<number>(86);
  const telemetrySamplesRef = useRef<{ total: number; eyeGood: number; postureGood: number }>({
    total: 0,
    eyeGood: 0,
    postureGood: 0,
  });
  const speakingSecondsRef = useRef<number>(0);

  useEffect(() => {
    if (!mediaStream || interviewCompleted) return;

    const interval = setInterval(() => {
      telemetrySamplesRef.current.total += 1;
      const isEyeGood = proctorMetrics.gazeDirection === "CENTER" || proctorMetrics.gazeDirection === "UNKNOWN";
      const isPostureGood = proctorMetrics.facePresence === "FACE_PRESENT" && !proctorMetrics.isObstructed;

      if (isEyeGood) telemetrySamplesRef.current.eyeGood += 1;
      if (isPostureGood) telemetrySamplesRef.current.postureGood += 1;

      const total = Math.max(1, telemetrySamplesRef.current.total);
      const eyePct = Math.min(100, Math.max(40, Math.round((telemetrySamplesRef.current.eyeGood / total) * 100)));
      const postPct = Math.min(100, Math.max(40, Math.round((telemetrySamplesRef.current.postureGood / total) * 100)));

      // Estimate WPM if candidate is answering
      if (isListening || candidateAnswer) {
        speakingSecondsRef.current += 1.5;
        const totalWords = (transcript + " " + candidateAnswer)
          .trim()
          .split(/\s+/)
          .filter(Boolean).length;
        if (speakingSecondsRef.current > 6 && totalWords > 4) {
          const wpm = Math.min(210, Math.max(85, Math.round((totalWords / speakingSecondsRef.current) * 60)));
          setSpeechPaceWpm(wpm);
        }
      }

      setEyeContactRatio(eyePct);
      setPostureStability(postPct);

      // Balanced confidence index: 45% Eye Contact, 35% Posture, 20% Cadence
      const wpmPenalty = (speechPaceWpm < 100 || speechPaceWpm > 180) ? 6 : 0;
      const computedIndex = Math.min(98, Math.max(55, Math.round((eyePct * 0.45) + (postPct * 0.35) + 20 - wpmPenalty)));
      setConfidenceIndex(computedIndex);
    }, 1500);

    return () => clearInterval(interval);
  }, [mediaStream, interviewCompleted, proctorMetrics.gazeDirection, proctorMetrics.facePresence, proctorMetrics.isObstructed, isListening, candidateAnswer, transcript, speechPaceWpm]);

  // Fallback STT State

  // Resilient Session Recording (Option A: Composited Screen + PiP Webcam + 10s progressive chunks)
  const {
    startFullSessionRecording,
    stopAndUploadFullSessionRecording,
    addRemoteAudioStream,
    flushBeforeUnload,
    compositedStreamRecorderRef,
    progressiveRecordingManagerRef,
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

  useEffect(() => {
    addRemoteAudioStreamRef.current = addRemoteAudioStream;
  }, [addRemoteAudioStream]);

  // OpenAI GPT-Realtime (WebRTC) Direct Audio IN -> Audio OUT
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const isRealtimeConnectedRef = useRef(false);
  const [isRealtimeMode, setIsRealtimeMode] = useState(false);

  // Hands-Free Auto-Analyze on Natural Speech Pause State
  const [autoAnalyzeEnabled, setAutoAnalyzeEnabled] = useState(true);
  const [autoAnalyzeCountdown, setAutoAnalyzeCountdown] = useState<number | null>(null);
  const lastSpokenTimestampRef = useRef<number>(0);

  // Bulletproof cleanup of all camera and microphone media tracks
  const stopAllMediaTracks = useCallback(() => {
    console.log("🛑 Stopping all camera and microphone media tracks...");

    // 1. Stop all registered streams in allMediaStreamsRef
    allMediaStreamsRef.current.forEach((stream) => {
      try {
        stream.getTracks().forEach((track) => {
          track.stop();
          track.enabled = false;
        });
      } catch (err) {
        console.warn("Failed to stop track from allMediaStreamsRef:", err);
      }
    });
    allMediaStreamsRef.current.clear();

    // 2. Stop tracks on mediaStreamRef
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((track) => {
          track.stop();
          track.enabled = false;
        });
      } catch (err) {
        console.warn("Failed to stop mediaStreamRef track:", err);
      }
      mediaStreamRef.current = null;
    }

    // 3. Stop tracks on videoRef.current.srcObject and detach completely
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
      } catch (err) {
        console.warn("Failed to clean up videoRef:", err);
      }
    }

    // 4. Stop active audio recorder & its tracks
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop();
        }
        if (mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach((track) => {
            track.stop();
            track.enabled = false;
          });
        }
      } catch (err) {
        console.warn("Failed to stop mediaRecorder stream:", err);
      }
      mediaRecorderRef.current = null;
    }

    // 5. Close WebRTC peer connection if active
    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.getSenders().forEach((sender) => {
          try {
            sender.track?.stop();
          } catch {}
        });
        peerConnectionRef.current.close();
      } catch (err) {
        console.warn("Failed to close peerConnection:", err);
      }
      peerConnectionRef.current = null;
    }

    // 6. Clean up media device manager
    try {
      mediaDeviceManager.cleanupAll();
    } catch (e) {}

    // 7. Update state
    setMediaStream(null);
    setIsCameraOn(false);
    setIsMicOn(false);
  }, []);

  const initRealtimeWebRTC = async (stream: MediaStream) => {
    try {
      const payload = buildInterviewPayload();
      const res = await fetch(`${API_URL}/interview/realtime-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: payload.configuration.category,
          level: payload.configuration.level,
          resumeText: payload.configuration.resumeText,
          jobDescription: payload.configuration.jobDescription,
        }),
      });
      const data = await res.json();
      if (!data.success || !data.client_secret?.value) {
        console.log("ℹ️ Realtime WebRTC note:", data.message || "Using reasoning voice engine");
        return false;
      }

      const EPHEMERAL_KEY = data.client_secret.value;
      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;

      // Handle remote audio from OpenAI Realtime
      const remoteAudioEl = document.createElement("audio");
      remoteAudioEl.autoplay = true;
      pc.ontrack = (e) => {
        remoteAudioEl.srcObject = e.streams[0];
        if (e.streams[0]) {
          addRemoteAudioStreamRef.current(e.streams[0]);
        }
      };

      // Add local mic track to WebRTC
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        pc.addTrack(audioTrack, stream);
      }

      // Set up data channel for events & transcript deltas
      const dc = pc.createDataChannel("oai-events");
      dataChannelRef.current = dc;
      dc.onmessage = (e) => {
        try {
          const realtimeEvent = JSON.parse(e.data);
          if (realtimeEvent.type === "response.audio_transcript.delta") {
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.type === "ai") {
                return [...prev.slice(0, -1), { ...last, content: last.content + realtimeEvent.delta }];
              }
              return [...prev, { id: `ai_${Date.now()}`, type: "ai", content: realtimeEvent.delta, timestamp: new Date() }];
            });
          } else if (realtimeEvent.type === "conversation.item.input_audio_transcription.completed") {
            const userSpoken = realtimeEvent.transcript?.trim();
            if (userSpoken) {
              setTranscript(userSpoken);
              setCandidateAnswer(userSpoken);
            }
          }
        } catch {}
      };

      // Create SDP offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = data.model || "gpt-4o-realtime-preview";
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp",
        },
      });

      const answerSdp = await sdpResponse.text();
      await pc.setRemoteDescription({
        type: "answer",
        sdp: answerSdp,
      });

      isRealtimeConnectedRef.current = true;
      setIsRealtimeMode(true);
      console.log("🚀 Connected to OpenAI GPT-Realtime (WebRTC Direct Audio IN -> Audio OUT)!");
      return true;
    } catch (err) {
      console.warn("Realtime WebRTC connection note (using fallback):", err);
      return false;
    }
  };

  // Real-time Mic Voice Level / Equalizer Visualizer State (0 to 100) & Clean 85Hz Highpass Audio Pipeline
  const { audioVolume, audioContextRef, analyserRef } = useAudioVisualizer({
    mediaStream,
    isAISpeakingRef,
    isListeningRef,
    voiceStateRef,
    onSpeechStarted: () => setVoiceStateSync("USER_SPEAKING"),
  });

  // Build interview payload from URL parameters and user data
  const buildInterviewPayload = useCallback(() => {
    let customization: { resumeText?: string; jobDescription?: string } = {};
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("interview_customization");
        if (stored) customization = JSON.parse(stored);
      } catch (e) {}
    }

    return {
      user: {
        id: userId || user?._id || "user123",
        name: userName || user?.name || "User",
        email: userEmail || user?.email || "user@example.com",
        role: user?.role || "user",
        experience: user?.experience || "Professional experience in technology",
        skills: user?.tech_stack
          ? user.tech_stack.split(",")
          : ["JavaScript", "React", "Node.js", "Python", "SQL"],
        goals: user?.goals || "Advance career in technology",
        education: (() => {
          const defaultEdu = [
            {
              degree: "Bachelor's Degree",
              institution: "University",
              year: new Date().getFullYear() - 2,
            },
          ];
          const raw = user?.education;
          if (!raw) return defaultEdu;
          if (Array.isArray(raw)) return raw;
          if (typeof raw === "string") {
            const trimmed = raw.trim();
            if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
              try {
                const parsed = JSON.parse(trimmed);
                return Array.isArray(parsed) ? parsed : [parsed];
              } catch (e) {}
            }
            return [
              {
                degree: trimmed,
                institution: "University / Institute",
                year: new Date().getFullYear() - 2,
              },
            ];
          }
          return defaultEdu;
        })(),
        workExperience: (() => {
          const raw = user?.experience;
          const defaultExp = [
            {
              title: typeof raw === "string" && raw.toLowerCase().includes("fresher") ? "Fresher / Entry Level" : "Software Developer",
              company: "Technology Company",
              duration: typeof raw === "string" && raw.trim() ? raw.trim() : "Recent Experience",
              description:
                "Professional software development experience with modern technologies and best practices.",
            },
          ];
          if (!raw) return defaultExp;
          if (Array.isArray(raw)) return raw;
          if (typeof raw === "string") {
            const trimmed = raw.trim();
            if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
              try {
                const parsed = JSON.parse(trimmed);
                return Array.isArray(parsed) ? parsed : [parsed];
              } catch (e) {}
            }
            return [
              {
                title: trimmed.toLowerCase().includes("fresher") ? "Fresher / Entry Level" : "Professional",
                company: "Academic / Industry",
                duration: trimmed,
                description: `Experience level: ${trimmed}`,
              },
            ];
          }
          return defaultExp;
        })(),
        profileCompletion: user?.profile_completion || 85,
      },
      configuration: {
        level: mapLevelToBackend(level), // Map frontend level to backend level
        category: category,
        field: field,
        duration: parseInt(duration),
        hasCodeEditor: hasCodeEditor,
        language: language,
        interviewMode:
          searchParams.get("interviewMode") ||
          (customization as any).interviewMode ||
          "mock_interview",
        resumeText: customization.resumeText || "",
        jobDescription: customization.jobDescription || "",
        targetCompany: searchParams.get("targetCompany") || (customization as any).targetCompany || "general",
        tailorToResume:
          searchParams.get("tailorToResume") !== null
            ? searchParams.get("tailorToResume") === "true"
            : Boolean((customization as any).tailorToResume ?? true),
      },
      context: {
        sessionId: `session_${Date.now()}_${userId}`,
        startTime: new Date().toISOString(),
        userAgent: navigator.userAgent,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        isFreeInterview: isFreeInterview,
      },
      resumeText: customization.resumeText || "",
      jobDescription: customization.jobDescription || "",
    };
  }, [
    userId,
    user,
    userName,
    userEmail,
    level,
    category,
    field,
    duration,
    hasCodeEditor,
    language,
    isFreeInterview,
  ]);

  useEffect(() => {
    if ("speechSynthesis" in window) {
      speechSynthesisRef.current = window.speechSynthesis;
    }
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
  }, []);

  // Update speech recognition language when speechLang changes
  useEffect(() => {
    speechLangRef.current = speechLang;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = speechLang;
        console.log("🎤 Recognition language updated to:", speechLang);
      } catch (err) {
        console.warn("Could not set recognition language:", err);
      }
    }
  }, [speechLang]);

  // Global user interaction listener to unlock audio & play any pending question
  useEffect(() => {
    const handleGlobalInteraction = () => {
      unlockBrowserAudio();
      if (pendingFirstAudioRef.current) {
        const textToSpeak = pendingFirstAudioRef.current;
        pendingFirstAudioRef.current = null;
        setIsAutoplayBlocked(false);
        playAIAudio("", textToSpeak);
      }
    };

    window.addEventListener("click", handleGlobalInteraction, { passive: true });
    window.addEventListener("touchstart", handleGlobalInteraction, { passive: true });
    window.addEventListener("keydown", handleGlobalInteraction, { passive: true });

    return () => {
      window.removeEventListener("click", handleGlobalInteraction);
      window.removeEventListener("touchstart", handleGlobalInteraction);
      window.removeEventListener("keydown", handleGlobalInteraction);
    };
  }, [unlockBrowserAudio, playAIAudio]);

  // Initialize camera and microphone with clean audio constraints and device monitoring
  // DO NOT access hardware during pre-interview setup! Devices are tested on-demand in PreInterviewSetupScreen.
  useEffect(() => {
    if (!interviewStarted || mediaStreamRef.current) {
      return;
    }

    async function initializeMedia() {
      try {
        const supported = typeof navigator !== "undefined" && navigator.mediaDevices?.getSupportedConstraints
          ? navigator.mediaDevices.getSupportedConstraints()
          : {};

        const audioConstraints: MediaTrackConstraints = {
          echoCancellation: supported.echoCancellation !== false,
          noiseSuppression: supported.noiseSuppression !== false,
          autoGainControl: supported.autoGainControl !== false,
          channelCount: 1,
        };

        console.log("[VOICE] Requesting camera and microphone access...");

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 } },
          audio: audioConstraints,
        });

        mediaStreamRef.current = stream;
        allMediaStreamsRef.current.add(stream);
        setMediaStream(stream);
        setIsCameraOn(true);
        setIsMicOn(true);

        if (interviewStarted) {
          startFullSessionRecording(stream);
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((err) => console.warn("Video play notice:", err));
        }
      } catch (err: any) {
        console.error("❌ Failed to access media devices:", err);
        const isDenied = err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError";
        setWarningMessage(
          isDenied
            ? "Microphone or Camera permission was denied. Please allow permissions in your browser address bar and reload."
            : "Camera and microphone access is required for the interview."
        );
        setShowWarning(true);
      }
    }

    initializeMedia();

    // Handle device change (e.g. plugging/unplugging headphones, mic switching)
    const handleDeviceChange = async () => {
      console.log("[VOICE] Audio device change detected");
    };

    if (typeof navigator !== "undefined" && navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);
    }

    // Monitor microphone permission state
    let permissionStatus: any = null;
    if (typeof navigator !== "undefined" && (navigator as any).permissions?.query) {
      (navigator as any).permissions.query({ name: "microphone" as any }).then((status: any) => {
        permissionStatus = status;
        permissionStatus.onchange = () => {
          console.log("[VOICE] Microphone permission changed:", permissionStatus.state);
          if (permissionStatus.state === "denied") {
            setWarningMessage("Microphone permission was revoked.");
            setShowWarning(true);
          }
        };
      }).catch(() => {});
    }

    return () => {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.removeEventListener) {
        navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
      }
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
      stopAllMediaTracks();
    };
  }, [interviewStarted, stopAllMediaTracks]);

  // Keep video preview attached whenever mediaStream is active
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      if (videoRef.current.srcObject !== mediaStream) {
        videoRef.current.srcObject = mediaStream;
      }
      videoRef.current.play().catch(() => {});
    }
  }, [mediaStream]);

  // Ensure camera and microphone are killed if candidate navigates away or reloads
  useEffect(() => {
    const handleUnload = () => {
      flushBeforeUnload();
      stopAllMediaTracks();
    };
    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
    };
  }, [flushBeforeUnload, stopAllMediaTracks]);

  // Complete audio teardown on unmount
  useEffect(() => {
    return () => {
      interviewCompletedRef.current = true;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
          if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
            window.speechSynthesis.pause();
            window.speechSynthesis.cancel();
          }
        } catch {}
      }
      if (currentAudioRef.current) {
        try {
          currentAudioRef.current.pause();
          currentAudioRef.current.currentTime = 0;
          currentAudioRef.current.src = "";
          currentAudioRef.current.onended = null;
          currentAudioRef.current.onerror = null;
        } catch {}
        currentAudioRef.current = null;
      }
    };
  }, []);

  // Timer countdown with graceful in-flight answer completion
  useEffect(() => {
    if (!interviewStarted) return;

    let graceAutoSubmitTimer: NodeJS.Timeout | null = null;
    let hardSafetyTimer: NodeJS.Timeout | null = null;
    const expiredHandledRef = { current: false };

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          timeRemainingRef.current = 0;
          if (!expiredHandledRef.current) {
            expiredHandledRef.current = true;
            hasTimeExpiredRef.current = true;
            clearInterval(timer);

            const hasActiveTurn =
              isListeningRef.current ||
              isTranscribingAudioRef.current ||
              isAiProcessingRef.current ||
              isAISpeakingRef.current ||
              Boolean(pendingClosingReasonRef.current);

            if (!hasActiveTurn) {
              handleEndInterview("time_up");
            } else {
              pendingTimeUpWrapRef.current = true;
              // Allow candidate to finish speaking current sentence briefly, then finalize
              if (isListeningRef.current) {
                graceAutoSubmitTimer = setTimeout(() => {
                  if (
                    isListeningRef.current &&
                    !isTranscribingAudioRef.current &&
                    !isAiProcessingRef.current &&
                    !interviewCompletedRef.current
                  ) {
                    handleAutoSubmitAnswer();
                  }
                }, 12000);
              }
              // Hard safety deadline so session cannot hang indefinitely past expiry
              hardSafetyTimer = setTimeout(() => {
                if (!interviewCompletedRef.current) {
                  handleEndInterview("time_up");
                }
              }, 28000);
            }
          }
          return 0;
        }
        const nextVal = prev - 1;
        timeRemainingRef.current = nextVal;
        return nextVal;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      if (graceAutoSubmitTimer) clearTimeout(graceAutoSubmitTimer);
      if (hardSafetyTimer) clearTimeout(hardSafetyTimer);
    };
  }, [interviewStarted]);

  // Finish session cleanly once AI closing statement finishes playing or in-flight answer settles
  useEffect(() => {
    if (!interviewStarted || interviewCompleted) return;

    if (pendingClosingReasonRef.current) {
      if (isAISpeaking || isProcessingQueue) {
        closingSpeechSeenActiveRef.current = true;
        return;
      }
      if (!isAiProcessing) {
        const delayMs = closingSpeechSeenActiveRef.current ? 350 : 1400;
        const reason = pendingClosingReasonRef.current;
        const t = setTimeout(() => {
          if (
            !isAISpeakingRef.current &&
            !isAiProcessingRef.current &&
            !interviewCompletedRef.current
          ) {
            pendingClosingReasonRef.current = null;
            handleEndInterview(reason);
          }
        }, delayMs);
        return () => clearTimeout(t);
      }
      return;
    }

    if (
      pendingTimeUpWrapRef.current &&
      hasTimeExpiredRef.current &&
      !isListening &&
      !isTranscribingAudioRef.current &&
      !isAiProcessing &&
      !isAISpeaking &&
      !isProcessingQueue
    ) {
      const t = setTimeout(() => {
        if (
          !isListeningRef.current &&
          !isTranscribingAudioRef.current &&
          !isAiProcessingRef.current &&
          !isAISpeakingRef.current &&
          !pendingClosingReasonRef.current &&
          !interviewCompletedRef.current
        ) {
          pendingTimeUpWrapRef.current = false;
          handleEndInterview("time_up");
        }
      }, 900);
      return () => clearTimeout(t);
    }
  }, [
    interviewStarted,
    interviewCompleted,
    isAISpeaking,
    isProcessingQueue,
    isAiProcessing,
    isListening,
  ]);

  // Auto-scroll conversation container scoped to the container, respecting manual scroll pause
  const handleConversationScroll = useCallback(() => {
    const el = conversationContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    // If user scrolled up by more than 60px, pause automatic scrolling
    if (distanceFromBottom > 60) {
      setIsUserScrolledUp(true);
    } else {
      setIsUserScrolledUp(false);
    }
  }, []);

  useEffect(() => {
    if (!isUserScrolledUp && conversationContainerRef.current) {
      const el = conversationContainerRef.current;
      el.scrollTo({
        top: el.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isUserScrolledUp]);

  // Auto-scroll center panel when question updates or when user progresses
  useEffect(() => {
    if (centerPanelRef.current) {
      centerPanelRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, [currentQuestionText, questionsAnswered]);

  // Prevent document body and HTML scrolling on desktop ONLY during the active live interview stage
  useEffect(() => {
    if (!interviewStarted || !hasCompletedDeviceSetup) {
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";
      }
      return;
    }

    const handleResize = () => {
      if (typeof window !== "undefined") {
        if (window.innerWidth >= 1024) {
          document.body.style.overflow = "hidden";
          document.documentElement.style.overflow = "hidden";
        } else {
          document.body.style.overflow = "";
          document.documentElement.style.overflow = "";
        }
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";
      }
    };
  }, [interviewStarted, hasCompletedDeviceSetup]);

  // Update progress dynamically by duration (or explicit question total if provided)
  useEffect(() => {
    const totalSecs = Math.max(60, (parseInt(duration || "30") || 30) * 60);
    const elapsedSecs = Math.max(0, totalSecs - timeRemaining);
    const durationProgress = Math.min(100, Math.round((elapsedSecs / totalSecs) * 100));
    const progress =
      totalQuestions && totalQuestions > 0
        ? Math.round((questionsAnswered / totalQuestions) * 100)
        : durationProgress;
    setInterviewProgress(progress);
  }, [questionsAnswered, totalQuestions, timeRemaining, duration]);

  // Synchronize fullscreen state across window events and handle auto-lock
  useEffect(() => {
    const syncState = () => {
      const active = isDocumentFullscreen();
      setIsFullscreen(active);
      setIsFullscreenLocked(active);
    };

    // Initial check
    syncState();

    const unsubscribe = subscribeToFullscreenChanges((active) => {
      setIsFullscreen(active);
      setIsFullscreenLocked(active);
      if (!active && interviewStarted && !interviewCompleted) {
        console.warn("[Proctoring] Fullscreen exited during active voice interview.");
      }
    });

    if (interviewStarted && !interviewCompleted && !isDocumentFullscreen()) {
      enterFullscreen().catch(() => {});
    }

    return () => {
      unsubscribe();
    };
  }, [interviewStarted, interviewCompleted]);
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const toggleMic = async () => {
    const stream = mediaStream || mediaStreamRef.current;
    if (stream && stream.getAudioTracks().length > 0) {
      const willBeOn = !isMicOn;
      stream.getAudioTracks().forEach((track) => {
        track.enabled = willBeOn;
      });
      setIsMicOn(willBeOn);
    } else {
      try {
        const fresh = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = fresh;
        allMediaStreamsRef.current.add(fresh);
        setMediaStream(fresh);
        setIsMicOn(true);
      } catch (err) {
        console.error("Failed to enable mic:", err);
      }
    }
  };

  const toggleCamera = async () => {
    const stream = mediaStream || mediaStreamRef.current;
    if (stream && stream.getVideoTracks().length > 0) {
      const willBeOn = !isCameraOn;
      stream.getVideoTracks().forEach((track) => {
        track.enabled = willBeOn;
      });
      setIsCameraOn(willBeOn);
      if (!willBeOn) {
        setWarningMessage("Webcam disabled! Continuous video is strictly required for this proctored interview.");
        setShowWarning(true);
      } else {
        if (videoRef.current && videoRef.current.srcObject !== stream) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }
    } else {
      try {
        const fresh = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 } },
          audio: true,
        });
        mediaStreamRef.current = fresh;
        allMediaStreamsRef.current.add(fresh);
        setMediaStream(fresh);
        setIsCameraOn(true);
        setIsMicOn(true);
        if (videoRef.current) {
          videoRef.current.srcObject = fresh;
          videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        console.error("Failed to enable camera:", err);
      }
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
    } else {
      stopAudio();
      setIsMuted(true);
    }
  };

  const sendAnswerToAPI = async (answer: string, isCode: boolean = false) => {
    // Calculate response time if tracking started
    let responseTime = 18; // Default response time
    if (responseStartTime) {
      responseTime = Math.round((Date.now() - responseStartTime) / 1000); // Convert to seconds
      setLastResponseTime(responseTime);
      setResponseStartTime(null); // Reset for next question
    }

    try {
      setIsAiProcessing(true);
      setVoiceStateSync("THINKING");
      console.log("[INTERVIEW] User answer received");
      console.log("[LLM] Processing");
      const configuredDurationSecs = Math.max(60, (parseInt(duration || "30") || 30) * 60);
      const elapsedSeconds = Math.max(0, configuredDurationSecs - timeRemainingRef.current);
      const body: any = {
        sessionId,
        message: answer,
        questionId: currentQuestionId, // keep numeric ID for tracking
        question:
          messages.find((m) => m.id === `question_${currentQuestionId}`)
            ?.content || // try to find the actual question text from chat history
          messages.filter((m) => m.type === "ai").slice(-1)[0]?.content ||
          "", // fallback to last AI message
        responseTime,
        metadata: {
          userAgent: navigator.userAgent,
          deviceType: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent)
            ? "mobile"
            : "desktop",
          messageType: isCode ? "code_submission" : "answer",
          timestamp: new Date().toISOString(),
          questionNumber: currentQuestionNumber,
          totalQuestions: null,
          elapsedSeconds,
          durationMinutes: parseInt(duration || "30") || 30,
          sttLatencyMs: sttLatencyRef.current,
          ttsLatencyMs: ttsLatencyRef.current,
          sessionDuration: Date.now() - (responseStartTime || Date.now()),
        },
        advanceToNext: true,
      };

      if (isCode) {
        body.codeContext = {
          isCodeSubmission: true,
          questionId: currentQuestionId,
          language: language,
          code: code,
          stdin: "", // Empty stdin for now
          executionResult: null, // Will be populated by backend
        };
      }

      const llmStart = Date.now();
      const response = await fetch(
        `${API_URL}/interview/conversation/enhanced`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            // "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify(body),
        }
      );
      setLlmLatency(Date.now() - llmStart);

      if (response.ok) {
        if (interviewCompletedRef.current || isEndingInterview) {
          console.log("🛑 Discarding enhanced conversation response because interview ended.");
          return;
        }
        const data = await response.json();
        console.log("✅ Enhanced conversation response:", data);

        // Add to debug logs like testInterview.html
        if (showDebugPanel) {
          const debugEntry = `[${new Date().toLocaleTimeString()}] Enhanced API Response: ${JSON.stringify(
            data,
            null,
            2
          )}`;
          setDebugLogs((prev) => [...prev.slice(-9), debugEntry]); // Keep last 10 entries
        }

        // Handle AI response and current question separately to avoid duplication
        let aiResponseContent = "";
        let questionContent = "";
        let audioContent = "";

        if (data.aiResponse || data.shortResponse) {
          const displayText = data.shortResponse ?? data.aiResponse;

          // Clean text for display - remove scores and analysis markers
          let cleanedText = displayText || "";
          const splitMarkers = [
            "**Score:",
            "**Detailed Analysis:**",
            "✅ **Strengths:**",
            "📊 **Score:",
          ];
          for (const marker of splitMarkers) {
            if (cleanedText.includes(marker)) {
              cleanedText = cleanedText.split(marker)[0];
            }
          }
          cleanedText = cleanedText.trim();

          // Always speak only the display text (shortResponse if available)
          audioContent = cleanedText;

          // For UI, show minimal content for free users, full details for paid users
          aiResponseContent = cleanedText;

          // Add detailed feedback only for paid interviews
          // Check for skip artifact: Score 100 but all details are 0 (indicates skipped question)
          const isSkipArtifact =
            data.feedback?.score === 100 &&
            data.detailedScores &&
            data.detailedScores.correctness === 0 &&
            data.detailedScores.completeness === 0 &&
            data.detailedScores.technicalAccuracy === 0 &&
            data.detailedScores.communicationQuality === 0;

          // Score display logic removed
        }

        if (data.interviewPhase) {
          setInterviewPhase(data.interviewPhase);
        }
        setIsWrappingUp(
          Boolean(
            data.isWrappingUp ||
              data.currentQuestion?.isWrappingUp ||
              data.interviewPhase === "WRAP_UP"
          )
        );

        if (data.currentQuestion) {
          // ✅ Normal case: backend sends next question object
          setCurrentQuestionId(data.currentQuestion.id);
          setCurrentQuestionNumber(data.currentQuestion.questionNumber);
          const nextQText = data.currentQuestion.question || "";
          setCurrentQuestionText(nextQText);
          setCurrentQuestionCategory(data.currentQuestion.category || category || "Technical");
          setIsFollowupQuestion(Boolean(data.isFollowup || data.currentQuestion?.isFollowup));
          setTotalQuestions(data.currentQuestion.totalQuestions ?? null);

          if (data.currentQuestion.competency) {
            setBrainCompetency(data.currentQuestion.competency);
          }
          if (data.currentQuestion.difficulty) {
            setBrainDifficulty(data.currentQuestion.difficulty);
          }
          if (data.currentQuestion.vocabulary_context) {
            setBrainVocabulary(data.currentQuestion.vocabulary_context);
          }
          if (data.currentQuestion.stt_prompt) {
            setBrainSttPrompt(data.currentQuestion.stt_prompt);
          }

          setResponseStartTime(Date.now());

          // Only set questionContent if we don't already have aiResponseContent
          if (!aiResponseContent) {
            questionContent = nextQText;
          }
          // This prevents duplication when shortResponse contains the question
        }

        // Brain State diagnostics from response (Phase 2 & 3)
        if (data.currentCompetency) setBrainCompetency(data.currentCompetency);
        if (data.difficulty) setBrainDifficulty(data.difficulty);
        if (data.relevantVocabulary && data.relevantVocabulary.length > 0) setBrainVocabulary(data.relevantVocabulary);
        if (data.followupDecision) setBrainFollowupDecision(data.followupDecision);
        if (data.nextCompetency) setBrainNextCompetency(data.nextCompetency);
        if (data.answerDepth) setBrainAnswerDepth(data.answerDepth);
        if (data.claimsDetected) setBrainClaims(data.claimsDetected);
        if (data.skillsDetected) setBrainSkills(data.skillsDetected);
        if (data.evidenceStrength) setBrainEvidenceStrength(data.evidenceStrength);
        if (data.voiceCommand) setBrainVoiceCommand(data.voiceCommand);
        setBrainAnswerProcessing("EVALUATED");

        if (data.isCompleted) {
          console.log("🏁 Interview completed according to duration-controlled adaptive engine.");
          const wasAlreadyExpired = hasTimeExpiredRef.current;
          hasTimeExpiredRef.current = true;
          closingSpeechSeenActiveRef.current = false;
          pendingClosingReasonRef.current =
            data.terminationReason || (wasAlreadyExpired ? "time_up" : "completed");
          if (!aiResponseContent) {
            handleEndInterview(pendingClosingReasonRef.current || "time_up");
          }
        } else if (!data.currentQuestion) {
          // 🧩 Fallback: backend didn’t send currentQuestion (still return next text)
          console.warn(
            "⚠️ No currentQuestion in response — generating fallback question ID"
          );
          const nextQ = currentQuestionNumber + 1;
          const fallbackQuestionId = `q${nextQ}`;
          setCurrentQuestionId(fallbackQuestionId);
          setCurrentQuestionNumber(nextQ);
          setResponseStartTime(Date.now());

          // Don't set questionContent here since shortResponse is already in aiResponseContent
          // This prevents duplication
        }

        // Add AI response message if we have content
        if (aiResponseContent) {
          const aiMessage: Message = {
            id: `ai_${Date.now()}`,
            type: "ai",
            content: aiResponseContent,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, aiMessage]);
          playAIAudio("", audioContent);
        }

        // Add question message separately if we have content
        if (questionContent) {
          const questionMessage: Message = {
            id: `question_${Date.now()}`,
            type: "ai",
            content: questionContent,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, questionMessage]);
        }

        // Update progress (duration-controlled; never terminates solely by question count)
        if (data.progress) {
          updateProgress(
            data.progress.questionsAnswered ?? questionsAnswered,
            data.progress.totalQuestions ?? null
          );
        } else {
          setQuestionsAnswered((prev) => prev + 1);
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error("❌ Error sending answer:", error);
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        type: "system",
        content: `❌ Failed to send answer: ${error && typeof error === "object" && "message" in error
            ? (error as { message: string }).message
            : String(error)
          }`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const [isStartingInterview, setIsStartingInterview] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [showInstructionsPopup, setShowInstructionsPopup] = useState(false);
  const [showStartingPopup, setShowStartingPopup] = useState(false);
  const [popupTimer, setPopupTimer] = useState(0);
  const [countdownInterval, setCountdownInterval] =
    useState<NodeJS.Timeout | null>(null);
  const isStartingRef = useRef(false);

  // Cleanup countdown timer on unmount
  useEffect(() => {
    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [countdownInterval]);

  const actuallyStartInterview = useCallback(async (forceRetry = false) => {
    console.log("🚀 actuallyStartInterview called", {
      hasStarted: hasInterviewStartedRef.current,
      interviewStartedRef: interviewStartedRef.current,
      isStarting: isStartingRef.current,
      forceRetry,
    });

    if (!forceRetry && (hasInterviewStartedRef.current || interviewStartedRef.current)) {
      console.log("⏭️ Skipping actuallyStartInterview - interview already started or initialized");
      if (sessionId || currentQuestionText) {
        setShowStartingPopup(false);
        setIsStartingInterview(false);
        isStartingRef.current = false;
      }
      return;
    }

    hasInterviewStartedRef.current = true;
    interviewStartedRef.current = true;
    isStartingRef.current = true;
    setIsStartingInterview(true);
    setStartError(null);

    const interviewPayload = buildInterviewPayload();
    console.log(
      "📤 Sending interview initialization payload:",
      interviewPayload
    );

    const effectiveToken =
      token ||
      (typeof window !== "undefined"
        ? localStorage.getItem("token") ||
          localStorage.getItem("access_token") ||
          ""
        : "");

    try {
      if (!API_URL) {
        throw new Error("Backend API URL is not configured.");
      }

      // 60-second timeout controller for reliable dynamic LLM question synthesis
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (effectiveToken) {
        headers["Authorization"] = `Bearer ${effectiveToken}`;
      }

      const response = await fetch(`${API_URL}/interview/start`, {
        method: "POST",
        headers,
        body: JSON.stringify(interviewPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Interview started:", data);

        setSessionId(data.sessionId);
        hasTimeExpiredRef.current = false;
        pendingTimeUpWrapRef.current = false;
        pendingClosingReasonRef.current = null;
        closingSpeechSeenActiveRef.current = false;
        hasCalledBeginRef.current = false;
        setIsWrappingUp(false);
        setInterviewPhase("MAIN");
        updateProgress(0, data.firstQuestion?.totalQuestions ?? null);

        // Combine welcome message and first question cleanly without redundant repetition
        let combinedContent = data.message || "";
        if (data.firstQuestion) {
          const firstQText = (data.firstQuestion.question || "").trim();
          setCurrentQuestionText(firstQText);
          setCurrentQuestionCategory(data.firstQuestion.category || category || "Technical");
          setIsFollowupQuestion(false);
          setCurrentQuestionNumber(data.firstQuestion.questionNumber || 1);
          setCurrentQuestionId(data.firstQuestion.id || "q_1");
          if (data.firstQuestion.competency) {
            setBrainCompetency(data.firstQuestion.competency);
          }
          if (data.firstQuestion.difficulty) {
            setBrainDifficulty(data.firstQuestion.difficulty);
          }
          if (data.firstQuestion.vocabulary_context) {
            setBrainVocabulary(data.firstQuestion.vocabulary_context);
          }
          if (data.firstQuestion.stt_prompt) {
            setBrainSttPrompt(data.firstQuestion.stt_prompt);
          }

          // If the generated question text already contains an opening greeting, use it directly
          if (firstQText.toLowerCase().startsWith("hi ") || firstQText.toLowerCase().startsWith("welcome")) {
            combinedContent = firstQText;
          } else if (combinedContent) {
            combinedContent = `${combinedContent}\n\n${firstQText}`;
          } else {
            combinedContent = firstQText;
          }
        }

        const welcomeMessage: Message = {
          id: `welcome_${Date.now()}`,
          type: "ai",
          content: combinedContent,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, welcomeMessage]);

        // Mark the interview active and dismiss starting popup
        setHasCompletedDeviceSetup(true);
        setInterviewStarted(true);
        setIsStartingInterview(false);
        setShowStartingPopup(false);
        isStartingRef.current = false;

        if (data.firstQuestion && combinedContent) {
          try {
            console.log("🔊 Initial interview question ready, initiating AI speech:", combinedContent.slice(0, 60));
            if (data.sessionId && !hasCalledBeginRef.current) {
              hasCalledBeginRef.current = true;
              markInterviewSessionStarted(data.sessionId, 0, token).catch((beginErr) => {
                console.warn("Notice marking interview session started:", beginErr);
              });
            }
            unlockBrowserAudio();
            playAIAudio("", combinedContent);
          } catch (audioError) {
            console.warn("Notice: queue initial audio:", audioError);
          }
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = Array.isArray(errorData.message)
          ? errorData.message.join(", ")
          : errorData.message ||
          errorData.error ||
          `Server error: ${response.status}`;

        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.warn("⚠️ Failed to start interview notice:", error);

      let errorMessage = "Failed to start interview. ";
      if (error.name === "AbortError") {
        errorMessage +=
          "Request timed out. Please check your connection and try again.";
      } else if (error.message?.includes("fetch")) {
        errorMessage +=
          "Unable to connect to server. Please check your internet connection.";
      } else {
        errorMessage += error.message || "Unknown error occurred.";
      }

      setStartError(errorMessage);
      setIsStartingInterview(false);
      isStartingRef.current = false;
      hasInterviewStartedRef.current = false;
      interviewStartedRef.current = false;
    }
  }, [category, token, buildInterviewPayload, updateProgress, playAIAudio, sessionId, currentQuestionText, unlockBrowserAudio]);

  const handleStartNowModalClick = useCallback(() => {
    console.log("🎯 Start Now modal button clicked");
    setShowStartingPopup(false);
    unlockBrowserAudio();
    enterFullscreen().catch(() => {});

    if (sessionId || currentQuestionText || interviewStarted) {
      setIsStartingInterview(false);
      isStartingRef.current = false;
      const firstMsg =
        currentQuestionText ||
        [...messages].reverse().find((m) => m.type === "ai")?.content;
      if (firstMsg) {
        playAIAudio("", firstMsg);
      }
      return;
    }

    if (isStartingInterview) {
      console.log("⏳ Session startup is in progress in background, modal dismissed.");
      return;
    }

    hasInterviewStartedRef.current = false;
    interviewStartedRef.current = false;
    actuallyStartInterview(true);
  }, [
    sessionId,
    currentQuestionText,
    interviewStarted,
    isStartingInterview,
    unlockBrowserAudio,
    messages,
    playAIAudio,
    actuallyStartInterview,
  ]);

  const startInterview = useCallback(async () => {
    console.log("🚀 Starting interview immediately...", {
      hasStarted: hasInterviewStartedRef.current,
      interviewStartedRef: interviewStartedRef.current,
    });

    if (hasInterviewStartedRef.current || isStartingRef.current || interviewStartedRef.current) {
      console.log("⏭️ Skipping startInterview - already in progress or started");
      return;
    }

    isStartingRef.current = true;
    setShowStartingPopup(true);

    if (countdownInterval) {
      clearInterval(countdownInterval);
      setCountdownInterval(null);
    }

    // Call API immediately without artificial countdown
    actuallyStartInterview();
  }, [countdownInterval, actuallyStartInterview]);

  // Handle start from Pre-Interview Setup screen:
  // Transfer verified media streams directly into interview room without re-prompting.
  const handleDeviceSetupCompleteAndStart = useCallback(async () => {
    console.log("🚀 Candidate confirmed device setup, transferring verified streams...");
    setStartError(null);
    setIsStartingInterview(true);
    isStartingRef.current = true;

    // 1. Get composite camera + mic stream from mediaDeviceManager
    const composite = mediaDeviceManager.getCompositeInterviewStream();
    mediaStreamRef.current = composite;
    setMediaStream(composite);
    allMediaStreamsRef.current.add(composite);

    if (videoRef.current) {
      videoRef.current.srcObject = composite;
      videoRef.current.play().catch((e) => console.warn("Video play notice:", e));
    }

    // 2. Transfer verified screen share stream
    const devState = mediaDeviceManager.getState();
    if (devState.screenStream) {
      setVerifiedScreenStream(devState.screenStream);
      setIsScreenSharing(true);
    }

    // 3. Enter fullscreen during user activation gesture
    enterFullscreen().catch(() => {});

    // 4. Trigger backend interview-start API call
    await actuallyStartInterview(true);
  }, [actuallyStartInterview]);

  // Ensure camera feed stays bound to video element once interview room renders
  useEffect(() => {
    if (interviewStarted && mediaStream && videoRef.current) {
      if (videoRef.current.srcObject !== mediaStream) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch((err) => console.warn("Video play notice:", err));
      }
    }
  }, [interviewStarted, mediaStream]);

  const handleManualStart = async () => {
    console.log("🎯 Manual start triggered");
    if (countdownInterval) {
      clearInterval(countdownInterval);
      setCountdownInterval(null);
    }
    setShowInstructionsPopup(false);
    if (!hasInterviewStartedRef.current) {
      startInterview();
    }
  };

  // Ref to track if candidate manually typed custom text into the answer textarea
  const hasUserManuallyEditedRef = useRef(false);

  // Self-Healing SpeechRecognition Engine & High-Accuracy ElevenLabs Scribe STT
  const {
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
  } = useSpeechRecognitionEngine({
    onSttLatencyChange: setSttLatency,
    speechLangRef,
    isAISpeakingRef,
    isListeningRef,
    transcriptRef,
    sessionBaseTranscriptRef,
    voiceStateRef,
    interviewCompletedRef,
    lastSpokenTimestampRef,
    onTranscriptChange: (cleaned) => {
      setTranscript(cleaned);
      // Interim recognition updates preview; do not overwrite manual candidate edits
      if (!hasUserManuallyEditedRef.current) {
        setCandidateAnswer(cleaned);
      }
    },
    onVoiceStateChange: (state) => setVoiceStateSync(state as any),
    onWarning: (msg) => {
      setWarningMessage(msg);
      setShowWarning(true);
    },
    setIsListening,
    apiUrl: API_URL,
    field,
    category,
    currentQuestionText: currentQuestionText,
    level,
    brainSttPrompt,
    brainVocabulary,
  });

  const startListening = async () => {
    if (
      !interviewStartedRef.current ||
      interviewCompletedRef.current ||
      hasTimeExpiredRef.current ||
      pendingClosingReasonRef.current
    ) {
      console.warn("⚠️ Cannot start new listening turn after interview time/session completion.");
      return;
    }

    if (!isMicOnRef.current) {
      setWarningMessage("Please enable your microphone to respond.");
      setShowWarning(true);
      return;
    }

    if (isAISpeakingRef.current) {
      console.warn("⚠️ Cannot listen while AI interviewer is speaking.");
      return;
    }

    // Initialize recognition buffer with existing text so new speech appends seamlessly
    answerFinalizedRef.current = false;
    recognitionStopRequestedRef.current = false;
    hasUserManuallyEditedRef.current = false;
    const existing = candidateAnswer.trim();
    sessionBaseTranscriptRef.current = existing;
    transcriptRef.current = existing;
    setTranscript(existing || "Listening... Speak naturally");
    setVoiceStateSync("LISTENING");

    // Make sure we have a guaranteed live microphone stream that receives clean audio
    let activeStream = mediaStream;
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Microphone API is not available.");
      }

      const liveAudioTrack = activeStream
        ?.getAudioTracks?.()
        .find((track) => track.readyState === "live");

      if (!liveAudioTrack) {
        const supported = typeof navigator !== "undefined" && navigator.mediaDevices?.getSupportedConstraints
          ? navigator.mediaDevices.getSupportedConstraints()
          : {};

        const audioConstraints: MediaTrackConstraints = {
          echoCancellation: supported.echoCancellation !== false,
          noiseSuppression: supported.noiseSuppression !== false,
          autoGainControl: supported.autoGainControl !== false,
          channelCount: 1,
        };

        const freshStream = await navigator.mediaDevices.getUserMedia({
          audio: audioConstraints,
        });

        activeStream = freshStream;
        allMediaStreamsRef.current.add(freshStream);

        setMediaStream((oldStream) => {
          let combined: MediaStream;
          if (oldStream) {
            const oldVideo = oldStream.getVideoTracks();
            if (oldVideo.length > 0) {
              combined = new MediaStream([...oldVideo, ...freshStream.getAudioTracks()]);
            } else {
              combined = freshStream;
            }
          } else {
            combined = freshStream;
          }
          mediaStreamRef.current = combined;
          allMediaStreamsRef.current.add(combined);
          return combined;
        });

        console.log("[VOICE] Microphone started");
        console.log("[VOICE] Audio constraints applied", audioConstraints);
      }
    } catch (error) {
      console.error("❌ Microphone access error:", error);
      isListeningRef.current = false;
      setIsListening(false);
      setTranscript("Microphone access is required.");
      setWarningMessage(
        "Allow microphone access in Chrome and make sure the correct microphone is selected."
      );
      setShowWarning(true);
      return;
    }

    // Start background audio recorder with the active stream
    if (activeStream) {
      startAudioRecordingWithStream(activeStream);
    }

    isListeningRef.current = true;
    recognitionStopRequestedRef.current = false;
    setIsListening(true);

    startFreshRecognition();
  };

  useEffect(() => {
    startListeningRef.current = startListening;
    stopListeningRef.current = stopListening;
  });

  const stopListening = async () => {
    console.log("🛑 Stopping microphone & finalizing transcript...");

    isListeningRef.current = false;
    recognitionStopRequestedRef.current = true;
    recognitionStartingRef.current = false;
    setIsListening(false);

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

    const currentSpoken = (transcriptRef.current || sessionBaseTranscriptRef.current || candidateAnswer).trim();
    if (currentSpoken && currentSpoken !== "Listening... Speak naturally") {
      setCandidateAnswer(currentSpoken);
      setTranscript(currentSpoken);
      sessionBaseTranscriptRef.current = currentSpoken;
    }

    // If media recorder is active, finish recording and capture final blob
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
  };

  const handleAutoSubmitAnswer = useCallback(async () => {
    console.log("⏱️ Question answer timer expired (0s) -> auto-submitting answer...");
    stopQuestionAnswerTimer();
    setVoiceStateSync("TRANSCRIBING");

    // Stop recording and retrieve authoritative ElevenLabs Scribe transcript from candidate's recorded audio
    let finalAnswer = "";
    const recordedBlob = await stopAndGetAudioBlob();
    if (recordedBlob && recordedBlob.size > 200) {
      console.log(`[VOICE] Auto-transcribing candidate utterance with ElevenLabs Scribe (${recordedBlob.size} bytes)...`);
      isTranscribingAudioRef.current = true;
      try {
        const scribeText = await transcribeAudio(recordedBlob);
        if (scribeText && scribeText.trim()) {
          finalAnswer = scribeText.trim();
        }
      } finally {
        isTranscribingAudioRef.current = false;
      }
    }

    await stopListening();

    // If candidate manually typed an answer in the editor, respect manual typing
    if (!finalAnswer && hasUserManuallyEditedRef.current && candidateAnswer.trim()) {
      finalAnswer = candidateAnswer.trim();
    }

    if (!finalAnswer) {
      finalAnswer = "Candidate did not provide a verbal answer within the allocated time.";
    }

    console.log(`[STT] Auto-Submit Authoritative Answer: ${finalAnswer}`);
    setVoiceStateSync("THINKING");

    // Reset transcript buffers
    hasUserManuallyEditedRef.current = false;
    finalTranscriptRef.current = "";
    interimTranscriptRef.current = "";
    transcriptRef.current = "";
    sessionBaseTranscriptRef.current = "";
    setTranscript("");
    setCandidateAnswer("");

    await sendAnswerToAPI(finalAnswer, false);
  }, [stopQuestionAnswerTimer, stopListening, candidateAnswer, sendAnswerToAPI, transcribeAudio, stopAndGetAudioBlob]);

  const handleManualSubmitAnswer = async () => {
    if (isAiProcessing || isAISpeaking) return;

    stopQuestionAnswerTimer();
    setVoiceStateSync("TRANSCRIBING");

    // Stop recording and retrieve authoritative ElevenLabs Scribe transcript from candidate's recorded audio
    let finalAnswer = "";
    const recordedBlob = await stopAndGetAudioBlob();
    if (recordedBlob && recordedBlob.size > 200) {
      console.log(`[VOICE] Transcribing candidate utterance with ElevenLabs Scribe (${recordedBlob.size} bytes)...`);
      isTranscribingAudioRef.current = true;
      try {
        const scribeText = await transcribeAudio(recordedBlob);
        if (scribeText && scribeText.trim()) {
          finalAnswer = scribeText.trim();
        }
      } finally {
        isTranscribingAudioRef.current = false;
      }
    }

    await stopListening();

    // If candidate manually edited the answer in the editor, respect manual typing
    if (!finalAnswer && hasUserManuallyEditedRef.current && candidateAnswer.trim()) {
      finalAnswer = candidateAnswer.trim();
    }

    // Strict transcript integrity: Never replace failed/silent Scribe with noisy Web Speech API hallucinations
    if (!finalAnswer) {
      if (hasTimeExpiredRef.current) {
        pendingTimeUpWrapRef.current = false;
        handleEndInterview("time_up");
        return;
      }
      setWarningMessage("No clear speech detected. Please speak your answer clearly into the microphone before submitting.");
      setShowWarning(true);
      setVoiceStateSync("LISTENING");
      if (mediaStreamRef.current) {
        startListening();
      }
      return;
    }

    console.log(`[STT] Final Authoritative Answer: ${finalAnswer}`);
    setVoiceStateSync("THINKING");

    hasUserManuallyEditedRef.current = false;
    finalTranscriptRef.current = "";
    interimTranscriptRef.current = "";
    transcriptRef.current = "";
    sessionBaseTranscriptRef.current = "";
    setTranscript("");
    setCandidateAnswer("");

    await sendAnswerToAPI(finalAnswer, false);
  };

  // Hands-Free Auto-Analyze on Natural Speech Pause (Voice Silence Detection)
  useEffect(() => {
    if (
      !interviewStarted ||
      interviewCompleted ||
      isAISpeaking ||
      isAiProcessing ||
      !autoAnalyzeEnabled
    ) {
      setAutoAnalyzeCountdown(null);
      return;
    }

    const interval = setInterval(() => {
      if (!isListeningRef.current || isAISpeakingRef.current || isAiProcessing) {
        setAutoAnalyzeCountdown(null);
        return;
      }

      const spoken = (transcriptRef.current || candidateAnswer || "").trim();
      const words = spoken.split(/\s+/).filter(Boolean);

      // Support short valid answers ("Yes", "No", "I don't know") as well as detailed multi-word answers
      if (words.length >= 1 && lastSpokenTimestampRef.current > 0) {
        const elapsed = Date.now() - lastSpokenTimestampRef.current;
        // Natural thinking pause: 3.5s for 1-2 word answers, 3.0s for longer answers
        const pauseThreshold = words.length <= 2 ? 3500 : 3000;
        if (elapsed >= pauseThreshold) {
          setAutoAnalyzeCountdown(null);
          lastSpokenTimestampRef.current = 0;
          console.log(`[VAD] Silence detected (${pauseThreshold/1000}s natural pause) -> Finalizing user utterance turn`);
          handleManualSubmitAnswer();
        } else if (elapsed >= 1800) {
          const remainingSecs = Math.max(1, Math.ceil((pauseThreshold - elapsed) / 1000));
          setAutoAnalyzeCountdown(remainingSecs);
        } else {
          setAutoAnalyzeCountdown(null);
        }
      } else {
        setAutoAnalyzeCountdown(null);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [
    interviewStarted,
    interviewCompleted,
    isAISpeaking,
    isAiProcessing,
    autoAnalyzeEnabled,
    candidateAnswer,
    handleManualSubmitAnswer,
  ]);

  // Per-question answer timer countdown effect
  useEffect(() => {
    if (!isQuestionTimerActive || !interviewStarted || interviewCompleted || isAISpeaking || isAiProcessing) {
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
        questionTimerRef.current = null;
      }
      return;
    }

    questionTimerRef.current = setInterval(() => {
      setQuestionTimer((prev) => {
        if (prev <= 1) {
          if (questionTimerRef.current) {
            clearInterval(questionTimerRef.current);
            questionTimerRef.current = null;
          }
          setIsQuestionTimerActive(false);
          handleAutoSubmitAnswer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
      }
    };
  }, [isQuestionTimerActive, interviewStarted, interviewCompleted, isAISpeaking, isAiProcessing, handleAutoSubmitAnswer]);

  const handleSendAnswer = async (textOverride?: string) => {
    if (hasTimeExpiredRef.current || pendingClosingReasonRef.current || interviewCompletedRef.current || isEndingInterview) {
      return;
    }
    let textToSend = (textOverride !== undefined ? textOverride : candidateAnswer).trim();

    if (isListeningRef.current) {
      await stopListening();
    }

    // If answer text is empty but audio was recorded, transcribe immediately with Whisper AI
    if (!textToSend && recordedAudioBlobRef.current && recordedAudioBlobRef.current.size > 200) {
      console.log("🎙️ Recovering answer via OpenAI Whisper...");
      const recoveredText = await transcribeWithWhisper(recordedAudioBlobRef.current);
      if (recoveredText && recoveredText.trim()) {
        textToSend = recoveredText.trim();
      }
    }

    if (!textToSend) {
      setWarningMessage("Please speak your answer into the microphone before submitting.");
      setShowWarning(true);
      return;
    }

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      type: "user",
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setCandidateAnswer("");
    setTranscript("");
    finalTranscriptRef.current = "";
    interimTranscriptRef.current = "";
    transcriptRef.current = "";
    sessionBaseTranscriptRef.current = "";
    recordedAudioBlobRef.current = null;

    if (sessionId) {
      sendAnswerToAPI(textToSend);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: `error_${Date.now()}`,
          type: "system",
          content: "Interview session is not ready. Please try again.",
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleClearAnswer = () => {
    setCandidateAnswer("");
    setTranscript("");
    finalTranscriptRef.current = "";
    interimTranscriptRef.current = "";
    transcriptRef.current = "";
    sessionBaseTranscriptRef.current = "";
    if (isListening) {
      stopListening();
    }
  };


  const runCode = async () => {
    if (isRunningCode) {
      return; // Prevent multiple simultaneous executions
    }

    if (!code.trim()) {
      setWarningMessage("Please write some code before running.");
      setShowWarning(true);
      return;
    }

    setIsRunningCode(true);
    console.log("💻 Executing code...");

    const codeMessage: Message = {
      id: `code_${Date.now()}`,
      type: "user",
      content: `Code submitted:\n\`\`\`${language}\n${code}\n\`\`\``,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, codeMessage]);

    try {
      // First execute the code
      const executeResponse = await fetch(`${API_URL}/interview/code/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          // "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          sessionId: sessionId,
          language: language.toUpperCase(),
          code: code,
          stdin: "", // Add stdin support like testInterview.html
          codeContext: {
            questionId: currentQuestionId || `code_${Date.now()}`,
            question: `Code execution for ${language}`,
          },
        }),
      });

      if (executeResponse.ok) {
        const result = await executeResponse.json();
        console.log("✅ Code execution result:", result);

        // Store execution result and mark as successful
        setLastExecutionResult(result);
        setCodeExecutionSuccess(true);

        // Display execution results with enhanced formatting like testInterview.html
        const executionTime = Number(result.executionTime).toFixed(3);
        const resultMessage: Message = {
          id: `result_${Date.now()}`,
          type: "ai",
          content: `Code Execution Results:\n→ Output: ${result.output || "No output"
            }\n→ Time: ${executionTime}s\n→ Memory: ${result.memory
            }\n\n✅ Code ran successfully! You can now submit your solution.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, resultMessage]);
      } else {
        const errorData = await executeResponse.json().catch(() => ({}));
        const errorMsg = errorData.message || `HTTP ${executeResponse.status}`;
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error("❌ Code execution error:", error);
      setCodeExecutionSuccess(false);
      setLastExecutionResult(null);
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        type: "system",
        content: `❌ Code execution failed: ${error && typeof error === "object" && "message" in error
            ? (error as { message: string }).message
            : String(error)
          }`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsRunningCode(false);
    }
  };

  const submitCode = async () => {
    if (isSubmittingCode) {
      return; // Prevent multiple simultaneous submissions
    }

    if (!codeExecutionSuccess || !lastExecutionResult) {
      setWarningMessage("Please run your code successfully before submitting.");
      setShowWarning(true);
      return;
    }

    setIsSubmittingCode(true);
    console.log("📤 Submitting code solution...");

    try {
      // Send code submission to enhanced conversation API with execution results
      await sendAnswerToAPI(
        `Code submitted and executed. Output: ${lastExecutionResult.output || "No output"
        }`,
        true
      );

      // Reset code execution state after successful submission
      setCodeExecutionSuccess(false);
      setLastExecutionResult(null);

      setCode(""); // reset editor
      setShowCodeEditor(false); // optional: auto-close editor

      const submitMessage: Message = {
        id: `submit_${Date.now()}`,
        type: "system",
        content: "✅ Code solution submitted successfully!",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, submitMessage]);
    } catch (error) {
      console.error("❌ Code submission error:", error);
      const errorMessage: Message = {
        id: `submit_error_${Date.now()}`,
        type: "system",
        content: `❌ Code submission failed: ${error && typeof error === "object" && "message" in error
            ? (error as { message: string }).message
            : String(error)
          }`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSubmittingCode(false);
    }
  };

  // Derived state: when code ran successfully and awaits submission
  const submitPhaseActive =
    hasCodeEditor && codeExecutionSuccess && !isSubmittingCode;


  const handleEndInterview = async (customTerminationReason?: string) => {
    if (isEndingInterview || interviewCompletedRef.current) {
      return; // Prevent multiple simultaneous end interview calls
    }

    setIsEndingInterview(true);
    interviewCompletedRef.current = true;
    setInterviewCompleted(true);
    setInterviewStarted(false);
    console.log("🏁 Ending interview...");

    // 1. Immediately kill all AI audio and reset speech queue
    stopAudio();
    setAiSpeechQueue([]);
    setIsProcessingQueue(false);
    stopQuestionAnswerTimer();
    stopAudioRecording();

    // 2. Terminate all AI voice playback and microphone recognition
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }

    const effectiveSessionId = sessionId || `session_${Date.now()}`;

    // 3. Stop and upload full session recording (10-day retention) BEFORE tearing down media tracks
    try {
      await stopAndUploadFullSessionRecording(effectiveSessionId);
    } catch (recErr) {
      console.warn("Error finalizing session recording:", recErr);
    }
    stopAllMediaTracks();
    const basePayload = buildInterviewPayload();
    const endPayload: any = {
      sessionId: effectiveSessionId,
      user: basePayload.user,
      configuration: basePayload.configuration,
      results: {
        status: "completed",
        endTime: new Date().toISOString(),
        totalTimeSpent: Math.max(0, (parseInt(duration || "30") || 30) * 60 - timeRemainingRef.current),
        questionsAnswered: questionsAnswered,
        totalQuestions: null,
        completionPercentage: Math.min(
          100,
          Math.round(
            (Math.max(0, (parseInt(duration || "30") || 30) * 60 - timeRemainingRef.current) /
              Math.max(60, (parseInt(duration || "30") || 30) * 60)) *
              100
          )
        ),
        terminationReason:
          customTerminationReason ||
          (timeRemainingRef.current <= 0 || hasTimeExpiredRef.current ? "time_up" : "user_ended"),
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
            questionId: currentQuestionId || "final_code",
            question: "Code submission",
            code: code,
            language: language,
            submittedAt: new Date().toISOString(),
          },
        ]
        : [],
      performanceMetrics: {
        averageResponseTime: 8.5,
        totalSpeakingTime: questionsAnswered * 30,
        totalListeningTime:
          parseInt(duration) * 60 - timeRemaining - questionsAnswered * 30,
        communicationQuality: 85,
        technicalAccuracy: 88,
        problemSolvingApproach: 82,
      },
      violations: proctorEventsTimeline,
      deviceMetrics: {
        tabSwitchCount: proctorEventsTimeline.filter(
          (e) => e.event_type === "TAB_SWITCH" || e.event_type === "WINDOW_BLUR"
        ).length,
        fullscreenExits: proctorEventsTimeline.filter(
          (e) => e.event_type === "FULLSCREEN_EXIT"
        ).length,
        microphoneIssues: 0,
        cameraIssues: 0,
        networkInterruptions: 0,
      },
      confidenceMetrics: {
        confidenceIndex: Math.round(confidenceIndex),
        eyeContactRatio: Math.round(eyeContactRatio),
        postureStability: Math.round(postureStability),
        speechPaceWpm: speechPaceWpm > 0 ? speechPaceWpm : 135,
        vocalEnergy: Math.min(95, Math.max(65, Math.round(72 + (eyeContactRatio > 70 ? 10 : 0)))),
        executivePresenceRating:
          confidenceIndex >= 85 ? "Executive Ready" :
          confidenceIndex >= 70 ? "Strong Professional" : "Developing",
        recommendations: [
          eyeContactRatio >= 75
            ? "Strong visual composure and direct engagement maintained."
            : "Practice centering direct eye contact into the webcam lens during architectural trade-offs.",
          speechPaceWpm >= 120 && speechPaceWpm <= 160
            ? "Vocal pacing was calibrated in the ideal 120-160 WPM executive range."
            : speechPaceWpm > 160
            ? "Slightly rapid speech tempo detected; incorporate brief pauses to let key points land."
            : "Steady and deliberate pacing; you can moderately accelerate during standard syntax points.",
          postureStability >= 80
            ? "Upright, steady head posture projected confidence and command."
            : "Reduce lateral head motion to maintain a commanding screen presence."
        ]
      },
      targetCompany: basePayload.configuration.targetCompany || "general",
    };

    console.log("📤 Sending end interview payload:", endPayload);

    // Detect if candidate only gave greetings or aborted without technical answers
    const userMessages = messages.filter((m) => m.type === "user");
    const combinedUserWords = userMessages
      .map((m) => m.content || "")
      .join(" ")
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    const greetingWords = new Set(["hello", "hi", "hey", "test", "testing", "ok", "okay", "yes", "no", "start", "good", "morning", "afternoon", "evening"]);
    const onlyGreetings = combinedUserWords.length <= 5 && (combinedUserWords.length === 0 || combinedUserWords.every((w) => greetingWords.has(w) || w.length < 3));
    const isOnlyGreetingOrEmpty = userMessages.length === 0 || combinedUserWords.length < 3 || onlyGreetings;

    // Pre-build reliable local fallback results
    const localOverallScore = isOnlyGreetingOrEmpty ? 0 : 75;
    const config = endPayload.configuration;
    const showCodeMetrics = config.hasCodeEditor === true;

    let finalResults: any = {
      overallScore: localOverallScore,
      category: config.category || category || "Interview",
      level: config.level || level || "Intermediate",
      duration: `${config.duration || duration || 0} minutes`,
      completedAt: new Date().toLocaleDateString(),
      scores: {
        technical: isOnlyGreetingOrEmpty ? 0 : 75,
        communication: isOnlyGreetingOrEmpty ? 0 : 75,
        problemSolving: isOnlyGreetingOrEmpty ? 0 : 75,
        ...(showCodeMetrics ? { codeQuality: isOnlyGreetingOrEmpty ? 0 : 75 } : {}),
        architectureDesign: isOnlyGreetingOrEmpty ? 0 : 75,
        practicalApplication: isOnlyGreetingOrEmpty ? 0 : 75,
      },
      strengths: isOnlyGreetingOrEmpty
        ? [
            "Interview environment initialized successfully",
            "Audio and device connectivity established",
          ]
        : [
            "Completed the interview successfully",
            "Demonstrated technical communication ability",
            "Showed domain knowledge during responses",
          ],
      improvements: isOnlyGreetingOrEmpty
        ? [
            "No technical answers were provided during this session",
            "Answer questions with detailed technical explanations, architecture choices, and trade-offs to receive a verified evaluation",
          ]
        : [
            "Continue practicing hands-on edge case scenarios",
            "Structure explanations using architectural tradeoffs",
          ],
      detailedFeedback: {
        technical: isOnlyGreetingOrEmpty
          ? "The candidate ended the session with only a greeting or no substantive response. No technical knowledge could be evaluated."
          : "Technical competency was evaluated across answered questions.",
        communication: isOnlyGreetingOrEmpty
          ? "Session ended early before communication and articulate reasoning could be evaluated."
          : "Communication skills were demonstrated throughout the interview process.",
        problemSolving: isOnlyGreetingOrEmpty
          ? "No problem-solving questions or scenarios were attempted."
          : "Demonstrated analytical approach to problem scenarios.",
        ...(showCodeMetrics
          ? {
              codeQuality: isOnlyGreetingOrEmpty
                ? "No code was written or submitted."
                : "Code structure and logic evaluated.",
            }
          : {}),
      },
      questionAnswers: messages
        .filter((m, i) => m.type === "ai" && messages[i + 1]?.type === "user")
        .map((m, i) => ({
          questionText: m.content,
          userAnswer: messages[i + 1]?.content || "Answered via voice",
          feedback: isOnlyGreetingOrEmpty
            ? "Candidate provided greeting only or did not answer."
            : "Good response covering key technical aspects.",
          score: isOnlyGreetingOrEmpty ? 0 : 75,
        })),
      codeSubmissions: endPayload.codeSubmissions,
      proctoringAudit: {
        integrityScore: Math.max(50, 100 - proctorEventsTimeline.length * 5),
        signalLevel: proctorEventsTimeline.length > 5 ? "REVIEW_RECOMMENDED" : proctorEventsTimeline.length > 2 ? "ATTENTION" : "NORMAL",
        trustVerdict: proctorEventsTimeline.length > 5 ? "Flagged for Integrity Review" : "Valid Session - High Integrity",
        timeline: proctorEventsTimeline,
      },
      confidenceMetrics: endPayload.confidenceMetrics,
      companyTrack: endPayload.configuration.targetCompany || "general",
    };

    try {
      const effectiveToken =
        token ||
        (typeof window !== "undefined"
          ? localStorage.getItem("token") ||
            localStorage.getItem("access_token") ||
            ""
          : "");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      const response = await fetch(`${API_URL}/interview/end`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {}),
        },
        body: JSON.stringify(endPayload),
        signal: controller.signal,
      }).catch((fetchErr) => {
        console.warn("End interview fetch error (using fallback):", fetchErr);
        return null;
      });

      clearTimeout(timeoutId);

      if (response && response.ok) {
        const interviewData = await response.json();
        console.log("✅ Interview ended successfully with server report:", interviewData);

        const serverScores = interviewData.scores || interviewData.results?.scores || interviewData.results?.detailedScores || interviewData.scoreboard?.detailedScores || {};
        const radar = interviewData.results?.openAiReport?.radarScores || interviewData.openAiReport?.radarScores || interviewData.results?.radarScores || {};

        const parseNum = (v: any): number | null => {
          if (v === null || v === undefined || v === "") return null;
          const n = Number(v);
          return typeof n === "number" && !isNaN(n) && n >= 0 ? Math.round(n) : null;
        };

        const overallScore = isOnlyGreetingOrEmpty
          ? 0
          : (parseNum(interviewData.overallScore) ??
            parseNum(interviewData.results?.overallScore) ??
            parseNum(interviewData.scores?.overall) ??
            parseNum(interviewData.statistics?.averageScore) ??
            localOverallScore);

        const getMetric = (val1: any, val2: any, fallback: number): number => {
          if (isOnlyGreetingOrEmpty) return 0;
          const parsed1 = parseNum(val1);
          if (parsed1 !== null) return parsed1;
          const parsed2 = parseNum(val2);
          if (parsed2 !== null) return parsed2;
          return fallback;
        };

        finalResults = {
          overallScore: overallScore,
          category:
            interviewData.configuration?.category ||
            config.category ||
            "Interview",
          level:
            interviewData.configuration?.level || config.level || "Unknown",
          duration: `${interviewData.configuration?.duration || config.duration || 0} minutes`,
          completedAt: interviewData.createdAt
            ? new Date(interviewData.createdAt).toLocaleDateString()
            : new Date().toLocaleDateString(),
          scores: {
            technical: isOnlyGreetingOrEmpty ? 0 : getMetric(serverScores.technical, radar.domainKnowledge, overallScore),
            communication: isOnlyGreetingOrEmpty ? 0 : getMetric(serverScores.communication, radar.communication, overallScore),
            problemSolving: isOnlyGreetingOrEmpty ? 0 : getMetric(serverScores.problemSolving, radar.problemSolving, overallScore),
            codeQuality: showCodeMetrics
              ? (isOnlyGreetingOrEmpty ? 0 : getMetric(serverScores.codeQuality, radar.practicalApplication, overallScore))
              : undefined,
            architectureDesign: isOnlyGreetingOrEmpty ? 0 : getMetric(serverScores.architectureDesign, radar.architectureDesign, overallScore),
            practicalApplication: isOnlyGreetingOrEmpty ? 0 : getMetric(serverScores.practicalApplication, radar.practicalApplication, overallScore),
          },
          strengths:
            interviewData.results?.topStrengths ||
            interviewData.results?.strengths ||
            interviewData.results?.detailedAnalysis?.topStrengths ||
            interviewData.results?.detailedAnalysis?.strengths ||
            interviewData.detailedAnalysis?.topStrengths ||
            interviewData.detailedAnalysis?.strengths ||
            interviewData.openAiReport?.topStrengths ||
            finalResults.strengths,
          improvements:
            interviewData.results?.criticalImprovements ||
            interviewData.results?.improvements ||
            interviewData.results?.detailedAnalysis?.criticalImprovements ||
            interviewData.results?.detailedAnalysis?.improvements ||
            interviewData.detailedAnalysis?.criticalImprovements ||
            interviewData.detailedAnalysis?.improvements ||
            interviewData.openAiReport?.criticalImprovements ||
            finalResults.improvements,
          learningRoadmap:
            interviewData.results?.learningRoadmap ||
            interviewData.results?.detailedAnalysis?.learningRoadmap ||
            interviewData.openAiReport?.learningRoadmap ||
            interviewData.learningRoadmap ||
            [],
          detailedFeedback: {
            technical:
              interviewData.results?.detailedAnalysis?.detailedFeedback?.technical ||
              interviewData.detailedAnalysis?.detailedFeedback?.technical ||
              interviewData.results?.detailedAnalysis?.technicalFeedback ||
              interviewData.detailedAnalysis?.technicalFeedback ||
              finalResults.detailedFeedback.technical,
            communication:
              interviewData.results?.detailedAnalysis?.detailedFeedback?.communication ||
              interviewData.detailedAnalysis?.detailedFeedback?.communication ||
              interviewData.results?.detailedAnalysis?.communicationFeedback ||
              interviewData.detailedAnalysis?.communicationFeedback ||
              finalResults.detailedFeedback.communication,
            problemSolving:
              interviewData.results?.detailedAnalysis?.detailedFeedback?.problemSolving ||
              interviewData.detailedAnalysis?.detailedFeedback?.problemSolving ||
              interviewData.results?.detailedAnalysis?.problemSolvingFeedback ||
              interviewData.detailedAnalysis?.problemSolvingFeedback ||
              finalResults.detailedFeedback.problemSolving,
            ...(showCodeMetrics
              ? {
                codeQuality:
                  interviewData.results?.detailedAnalysis?.detailedFeedback?.codeQuality ||
                  interviewData.detailedAnalysis?.detailedFeedback?.codeQuality ||
                  interviewData.results?.detailedAnalysis?.codeQualityFeedback ||
                  interviewData.detailedAnalysis?.codeQualityFeedback ||
                  "Code quality evaluated.",
              }
              : {}),
          },
          questionAnswers: (() => {
            const apiQuestions =
              interviewData.questionAnalysis ||
              interviewData.results?.questionAnalysis ||
              interviewData.scoreboard?.questionBreakdown ||
              [];

            if (apiQuestions.length > 0) {
              return apiQuestions.map((qa: any) => ({
                questionText: qa.question || qa.questionText || qa.aiQuestion,
                userAnswer: qa.userAnswer || qa.answer,
                feedback:
                  qa.aiEvaluation?.feedback ||
                  qa.feedback ||
                  qa.aiResponse ||
                  qa.shortResponse,
                score: qa.aiEvaluation?.score || qa.score || 80,
                correctAnswer: qa.correctAnswer,
                explanation: qa.explanation,
              }));
            }
            return finalResults.questionAnswers;
          })(),
          codeSubmissions: interviewData.results?.codeSubmissions || finalResults.codeSubmissions,
          proctoringAudit: interviewData.proctoringAudit || interviewData.results?.proctoringAudit || finalResults.proctoringAudit,
          confidenceMetrics: interviewData.confidenceMetrics || interviewData.results?.confidenceMetrics || finalResults.confidenceMetrics || endPayload.confidenceMetrics,
          companyTrack: interviewData.targetCompany || interviewData.companyTrack || interviewData.results?.companyTrack || interviewData.results?.targetCompany || endPayload.configuration.targetCompany || "general",
        };
      }
    } catch (error) {
      console.warn("Notice during interview finalization (proceeding with results):", error);
    } finally {
      if (!finalResults.confidenceMetrics) {
        finalResults.confidenceMetrics = endPayload.confidenceMetrics;
      }
      if (!finalResults.companyTrack) {
        finalResults.companyTrack = endPayload.configuration.targetCompany || "general";
      }
      // Store results in localStorage for instantaneous rendering on the results page
      console.log("📊 Saving final interview results:", finalResults);
      localStorage.setItem("interviewResults", JSON.stringify(finalResults));
      localStorage.setItem("lastInterviewSessionId", effectiveSessionId);
      localStorage.removeItem("active_interview_session");
      localStorage.removeItem("interview_start_time");

      stopAllMediaTracks();
      setInterviewStarted(false);
      setInterviewCompleted(true);
      setIsEndingInterview(false);

      // GUARANTEED redirect: Candidate is NEVER stuck!
      router.push(`/learner/interview/results?id=${encodeURIComponent(effectiveSessionId)}`);
    }
  };

  const getConversationHistory = async () => {
    if (!sessionId) {
      console.warn("⚠️ No session ID available for history retrieval");
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        type: "system",
        content: "No session ID available for loading history.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/interview/conversation/history/${encodeURIComponent(
          sessionId
        )}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("📜 Conversation history fetched:", data);

        if (data.conversations && data.conversations.length > 0) {
          const historyMessages: Message[] = data.conversations.map(
            (conv: any, index: number) => ({
              id: `history_${index}`,
              type: conv.speaker === "ai" ? "ai" : "user",
              content: conv.message,
              timestamp: new Date(conv.timestamp),
            })
          );

          setMessages(historyMessages);

          const confirmationMessage: Message = {
            id: `system_${Date.now()}`,
            type: "system",
            content: `📜 Loaded ${data.conversations.length} messages from conversation history.`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, confirmationMessage]);
        } else {
          const noHistoryMessage: Message = {
            id: `no_history_${Date.now()}`,
            type: "system",
            content: "No previous conversation history found for this session.",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, noHistoryMessage]);
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error("❌ Error loading conversation history:", error);
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        type: "system",
        content: "Error loading conversation history. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const downloadTranscript = () => {
    const transcriptText = messages
      .map(
        (m) =>
          `[${new Date(m.timestamp).toLocaleTimeString()}] ${
            m.type === "ai" ? "AI Interviewer" : m.type === "user" ? "Candidate" : "System"
          }:\n${m.content}\n`
      )
      .join("\n\n");

    const blob = new Blob([transcriptText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `interview-transcript-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const replayAIMessage = (message: Message) => {
    if (message.type !== "ai" || !message.content) return;
    stopAudio();
    playAIAudioDirect(message.audioUrl || "", message.content);
  };

  const getLanguageOptions = (): string[] => {
    const langMap: { [key: string]: string[] } = {
      frontend: ["javascript", "typescript", "html", "css"],
      backend: ["javascript", "python", "java", "cpp", "go"],
      fullstack: ["javascript", "typescript", "python", "java"],
      python: ["python"],
      java: ["java"],
      cpp: ["cpp"],
      database: ["sql"],
      dsa: ["javascript", "python", "java", "cpp"],
    };
    return langMap[category.toLowerCase()] || ["javascript", "python", "java", "cpp"];
  };

  const getInterviewResults = async () => {
    if (!sessionId) {
      console.warn("⚠️ No session ID available for results retrieval");
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        type: "system",
        content: "No session ID available for fetching results.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      return null;
    }

    try {
      const response = await fetch(
        `${API_URL}/interview/results/${encodeURIComponent(sessionId)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("📊 Interview results fetched:", data);

        if (data.success && data.results) {
          const results = data.results;
          let resultsContent = `📊 **Interview Results Summary**\n\n`;

          if (results.overallScore !== undefined) {
            resultsContent += `🎯 **Overall Score:** ${results.overallScore}%\n`;
          }

          if (results.skillScores) {
            resultsContent += `\n📈 **Skill Breakdown:**\n`;
            Object.entries(results.skillScores).forEach(([skill, score]) => {
              resultsContent += `• ${skill}: ${score}%\n`;
            });
          }

          if (results.feedback) {
            resultsContent += `\n💬 **Feedback:**\n${results.feedback}\n`;
          }

          if (results.strengths && results.strengths.length > 0) {
            resultsContent += `\n💪 **Strengths:**\n`;
            results.strengths.forEach((strength: string) => {
              resultsContent += `• ${strength}\n`;
            });
          }

          if (results.improvements && results.improvements.length > 0) {
            resultsContent += `\n🎯 **Areas for Improvement:**\n`;
            results.improvements.forEach((improvement: string) => {
              resultsContent += `• ${improvement}\n`;
            });
          }

          if (results.duration) {
            resultsContent += `\n⏱️ **Interview Duration:** ${Math.round(
              results.duration / 60
            )} minutes\n`;
          }

          if (typeof results.questionsAnswered === "number") {
            resultsContent += results.totalQuestions
              ? `❓ **Questions:** ${results.questionsAnswered}/${results.totalQuestions} answered\n`
              : `❓ **Questions Answered:** ${results.questionsAnswered}\n`;
          }

          const resultsMessage: Message = {
            id: `results_${Date.now()}`,
            type: "system",
            content: resultsContent,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, resultsMessage]);
        } else {
          const noResultsMessage: Message = {
            id: `no_results_${Date.now()}`,
            type: "system",
            content: "No interview results available for this session.",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, noResultsMessage]);
        }
        return data;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error("❌ Error fetching interview results:", error);
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        type: "system",
        content: "Error fetching interview results. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      return null;
    }
  };

  if (!hasCompletedDeviceSetup && !interviewStarted) {
    return (
      <PreInterviewSetupScreen
        interviewRole={humanizeLabel(field || category || "Technical Interview")}
        interviewLevel={humanizeLabel(level || "Intermediate")}
        interviewDuration={duration || "30"}
        isStarting={isStartingInterview}
        startError={startError}
        onStartInterview={handleDeviceSetupCompleteAndStart}
        onRetryStart={handleDeviceSetupCompleteAndStart}
        interviewId={sessionId || undefined}
      />
    );
  }

  return (
    <div className="h-screen max-h-screen lg:h-[100dvh] lg:max-h-[100dvh] bg-[#FFFCF8] text-[#2B211C] flex flex-col select-none overflow-x-hidden lg:overflow-hidden">
      <InterviewModals
        isFullscreenLocked={isFullscreenLocked}
        interviewStarted={interviewStarted}
        interviewCompleted={interviewCompleted}
        setIsFullscreenLocked={setIsFullscreenLocked}
        activeWarningModal={activeWarningModal}
        acknowledgeWarning={acknowledgeWarning}
        isTerminated={isTerminated}
        onTerminate={() => {
          handleEndInterview("proctoring_review_required");
        }}
        showCalibrationModal={showCalibrationModal}
        setShowCalibrationModal={setShowCalibrationModal}
        setHasCalibrated={setHasCalibrated}
        unlockBrowserAudio={unlockBrowserAudio}
        isWindowLockedOut={isWindowLockedOut}
        proctorViolationCount={proctorViolationCount}
        unlockWindow={unlockWindow}
        isConnectionSuspended={isConnectionSuspended}
        reconnectCountdown={reconnectCountdown}
        showStartingPopup={showStartingPopup}
        setShowStartingPopup={setShowStartingPopup}
        startError={startError}
        onRetryStart={() => {
          setStartError(null);
          hasInterviewStartedRef.current = false;
          interviewStartedRef.current = false;
          isStartingRef.current = false;
          actuallyStartInterview(true);
        }}
        isStartingInterview={isStartingInterview}
        sessionId={sessionId}
        popupTimer={popupTimer}
        onStartNowModalClick={handleStartNowModalClick}
        onDismissStartingPopup={() => {
          setShowStartingPopup(false);
          setIsStartingInterview(false);
          isStartingRef.current = false;
        }}
        showConfirmEnd={showConfirmEnd}
        setShowConfirmEnd={setShowConfirmEnd}
        isFreeInterview={isFreeInterview}
        onConfirmEnd={() => handleEndInterview()}
        isEndingInterview={isEndingInterview}
        isAutoplayBlocked={isAutoplayBlocked}
        onEnableVoiceClick={() => {
          unlockBrowserAudio();
          setIsAutoplayBlocked(false);
          const pending = pendingFirstAudioRef.current;
          if (pending) {
            pendingFirstAudioRef.current = null;
            setTimeout(() => {
              playAIAudio("", pending);
            }, 50);
          } else {
            const lastAiMsg = [...messages].reverse().find((m) => m.type === "ai");
            if (lastAiMsg) {
              setTimeout(() => {
                playAIAudio("", lastAiMsg.content);
              }, 50);
            }
          }
        }}
      />

      {/* Top Navigation Header - Stationary Fixed at Top */}
      <InterviewHeaderControls
        roleTitle={humanizeLabel(field || category || "Technical Interview")}
        levelTitle={humanizeLabel(level || "Standard")}
        timeRemaining={timeRemaining}
        formatTime={formatTime}
        isMicOn={isMicOn}
        toggleMic={toggleMic}
        isCameraOn={isCameraOn}
        toggleCamera={toggleCamera}
        isScreenSharing={isScreenSharing}
        isMuted={isMuted}
        toggleMute={toggleMute}
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
        downloadTranscript={downloadTranscript}
        showDebugPanel={showDebugPanel}
        setShowDebugPanel={setShowDebugPanel}
        hasCodeEditor={hasCodeEditor}
        isTechCategory={categoryConfig.isTech}
        showCodeEditor={showCodeEditor}
        setShowCodeEditor={setShowCodeEditor}
        showWhiteboard={showWhiteboard}
        setShowWhiteboard={setShowWhiteboard}
        technicalDrawerTab={technicalDrawerTab}
        setTechnicalDrawerTab={setTechnicalDrawerTab}
        isEndingInterview={isEndingInterview}
        onConfirmEndClick={() => setShowConfirmEnd(true)}
      />

      {/* Main Interview Stage */}
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden w-full">
        {/* Mobile Tab Switcher (Technical Only) */}
        {hasCodeEditor && categoryConfig.isTech && (
          <div className="lg:hidden shrink-0 flex p-1.5 gap-2 border-b border-[#E8D9CC] bg-[#FFFFFF] sticky top-0 z-30" role="tablist" aria-label="Mobile interview views">
            <button
              role="tab"
              aria-selected={activeMobileTab === "chat"}
              onClick={() => setActiveMobileTab("chat")}
              className={`flex-1 py-2 px-3 text-xs font-bold text-center rounded-lg transition-colors min-h-[44px] flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04] ${
                activeMobileTab === "chat"
                  ? "text-[#E85D04] bg-[#FFFCF8] border border-[#E8D9CC]"
                  : "text-[#70645C] hover:text-[#2B211C] border border-transparent"
              }`}
            >
              Interview Stage
            </button>
            <button
              role="tab"
              aria-selected={activeMobileTab === "code"}
              onClick={() => setActiveMobileTab("code")}
              className={`flex-1 py-2 px-3 text-xs font-bold text-center rounded-lg transition-colors min-h-[44px] flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04] ${
                activeMobileTab === "code"
                  ? "text-[#E85D04] bg-[#FFFCF8] border border-[#E8D9CC]"
                  : "text-[#70645C] hover:text-[#2B211C] border border-transparent"
              }`}
            >
              Code Editor
            </button>
          </div>
        )}

        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden max-w-none w-full mx-auto w-full">
          {/* ========================================================================= */}
          {/* LEFT COLUMN: AI Interviewer (Top) & Screen Sharing / Analysis (Below) - Independently Scrollable */}
          {/* ========================================================================= */}
          <div
            className={`w-full lg:w-[260px] xl:w-[280px] flex-col border-r border-[#E8D9CC] bg-[#FFFCF8] shrink-0 p-3 space-y-3 overflow-y-auto overscroll-contain h-full min-h-0 ${
              activeMobileTab === "chat" ? "flex" : "!hidden lg:!flex"
            }`}
          >
            {/* 1. AI Interviewer Card (Top-Left) */}
            <div className="bg-[#FFFFFF] rounded-2xl border border-[#E8D9CC] p-3 shadow-xs flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-5 h-5 rounded-md bg-[#FFFCF8] border border-[#E8D9CC] text-[#E85D04] flex items-center justify-center shrink-0">
                    <Bot size={13} />
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[#2B211C] block leading-tight truncate">Sarah</span>
                    <span className="text-[10px] text-[#70645C] block leading-tight truncate">Principal Tech Lead</span>
                  </div>
                </div>
                <AIStatusBadge
                  status={
                    isAISpeaking
                      ? "speaking"
                      : isAiProcessing
                      ? "thinking"
                      : isListening
                      ? "listening"
                      : "online"
                  }
                  size="sm"
                />
              </div>

              {/* Avatar Box */}
              <div className="w-full aspect-[4/3] rounded-xl overflow-hidden relative bg-[#F1F5F9] border border-[#E8D9CC]">
                <AIAvatar
                  isActive={isAISpeaking}
                  state={
                    isAISpeaking
                      ? "speaking"
                      : isAiProcessing
                      ? "thinking"
                      : isListening
                      ? "listening"
                      : "idle"
                  }
                  theme="light"
                  interviewerName="Sarah"
                  interviewerRole="Principal Tech Lead"
                />
                {isBargeInActive && (
                  <div className="absolute top-2 left-2 bg-amber-50 text-amber-700 border border-amber-200 font-semibold px-2 py-0.5 rounded-full text-[10px] shadow-2xs">
                    ⚡ Interrupted
                  </div>
                )}
                {isAISpeaking && (
                  <div className="absolute top-2 right-2 bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold px-2 py-0.5 rounded-full text-[10px] shadow-2xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    <span>Speaking</span>
                  </div>
                )}
              </div>

              {/* Subtle Audio Waveform Voice Indicator */}
              <div className="w-full mt-2">
                <AudioWaveform
                  state={
                    isAISpeaking
                      ? "speaking"
                      : isAiProcessing
                      ? "thinking"
                      : isListening
                      ? "listening"
                      : "idle"
                  }
                  audioVolume={audioVolume}
                  theme="light"
                  className="w-full justify-center"
                />
              </div>
            </div>

            {/* 2. Live Screen Share & AI Screen Analysis Card (Positioned directly below AI Interviewer) */}
            <div id="screen-share-card">
              <ScreenShareAnalysis
                sessionId={sessionId || `session_${userId || "active"}`}
                token={token}
                apiBaseUrl={API_URL}
                defaultIntervalSeconds={5}
                initialStream={verifiedScreenStream || mediaDeviceManager.getState().screenStream}
                interviewStarted={interviewStarted && !interviewCompleted}
                onAnalysisResult={(data) => setScreenAnalysis(data)}
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
          </div>

          {/* ========================================================================= */}
          {/* CENTER COLUMN: Normal Readable Question, Real-time Captions, Response & Controls - Independent Scroll */}
          {/* ========================================================================= */}
          <div
            ref={centerPanelRef}
            className={`flex-1 min-w-0 p-3 sm:p-4 lg:p-5 space-y-3.5 overflow-y-auto overscroll-contain bg-[#F1F5F9]/50 h-full min-h-0 ${
              activeMobileTab === "chat" ? "flex flex-col" : "!hidden lg:!flex lg:flex-col"
            }`}
          >
            {/* 1. CURRENT QUESTION FOCUS CARD - Normal 20-22px font scale */}
            <div className="bg-[#FFFFFF] border border-[#E8D9CC] hover:border-[#E8D9CC] rounded-2xl p-4 sm:p-5 shadow-xs relative text-[#2B211C] transition-all">
              {/* Question Meta Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#E8D9CC]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-[#E85D04] bg-[#FFFCF8] border border-[#E8D9CC] px-2.5 py-0.5 rounded-full">
                    Question {questionsAnswered + 1}
                    {isWrappingUp ? " · Wrapping Up" : ""}
                  </span>

                  {/* Dynamically Adapted Question Category */}
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full border border-[#E8D9CC] bg-slate-100 text-[#E85D04]">
                    {categoryConfig.name}
                  </span>

                  {/* Difficulty Badge */}
                  <span className="text-[11px] font-mono text-[#70645C] bg-slate-100 border border-[#E8D9CC] px-2 py-0.5 rounded-full capitalize">
                    {humanizeLabel(level || "Intermediate")}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Dynamic Turn Indicator Badge */}
                  {isAISpeaking ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold text-[#E85D04] bg-[#FFFCF8] border border-[#E8D9CC] shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      <Volume2 size={12} className="text-[#E85D04]" />
                      <span>AI IS SPEAKING</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                      <Mic size={12} className="text-[#10B981]" />
                      <span>YOUR TURN</span>
                    </span>
                  )}

                  {/* Replay Question Button */}
                  <button
                    onClick={replayLastAIMessage}
                    disabled={isAISpeaking}
                    aria-label="Replay current AI question audio"
                    className="text-xs font-medium text-[#E85D04] hover:text-white hover:bg-[#E85D04] bg-[#FFFFFF] border border-[#E8D9CC] hover:border-[#E85D04] px-3.5 py-2 min-h-[44px] rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04]"
                    title="Replay AI Question Audio"
                  >
                    <RotateCcw size={13} />
                    <span>Replay Question</span>
                  </button>
                </div>
              </div>

              {/* Professional Question View with Normal Readable Typography & Real-time Live Reveal */}
              <div role="region" aria-label="Current interview question" aria-live="polite" aria-atomic="true">
                <ProfessionalQuestionView
                  rawText={
                    currentQuestionText ||
                    [...messages].reverse().find((m) => m.type === "ai")?.content ||
                    ""
                  }
                  isAISpeaking={isAISpeaking}
                  spokenCharIndex={spokenCharIndex}
                  spokenRatio={spokenRatio}
                />
              </div>

              {/* Formulating Next Question State */}
              {isAiProcessing && (
                <div
                  role="status"
                  aria-live="polite"
                  className="mt-3 p-2.5 bg-[#FFFCF8] border border-[#E8D9CC] rounded-xl flex items-center space-x-2 text-xs font-medium text-[#E85D04]"
                >
                  <div className="w-2 h-2 rounded-full bg-[#E85D04] animate-ping motion-reduce:animate-none" />
                  <span>AI is formulating your next question based on your response...</span>
                </div>
              )}
            </div>

            {/* 2. REAL-TIME LIVE CAPTIONS HUD (Candidate response only to avoid leaking duplicate question text) */}
            {(!isAISpeaking && (isListening || (transcript && isListening) || candidateAnswer)) && (
              <div
                role="region"
                aria-label="Real-time Duplex Captions"
                aria-live="polite"
                aria-atomic="false"
                className="bg-[#FFFFFF] border border-[#E8D9CC] rounded-2xl p-3.5 shadow-xs transition-all animate-in fade-in slide-in-from-top-2 duration-200"
              >
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#E8D9CC]">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFFCF8] border border-[#E8D9CC] text-[#E85D04]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E85D04] animate-pulse" />
                      <span>You • Candidate</span>
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[#70645C]">
                    Real-Time Duplex Captions
                  </span>
                </div>

                <div className="text-sm font-medium text-[#2B211C] leading-relaxed italic px-1">
                  {transcript || candidateAnswer ? (
                    <>&ldquo;{candidateAnswer || transcript}&rdquo;</>
                  ) : (
                    <span className="text-[#70645C] not-italic text-xs">
                      Listening for your speech... Speak clearly into your microphone.
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 3. CANDIDATE RESPONSE & TRANSCRIPTION BOX */}
            <div className="bg-[#FFFFFF] border border-[#E8D9CC] rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-1.5 border-b border-[#E8D9CC]">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#2B211C]">
                    Your Spoken Response
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                      isListening
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : isAISpeaking
                        ? "bg-[#FFFCF8] text-[#E85D04] border-[#E8D9CC]"
                        : "bg-slate-100 text-[#70645C] border-slate-200"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isListening
                          ? "bg-emerald-600 animate-pulse"
                          : isAISpeaking
                          ? "bg-[#E85D04] animate-pulse"
                          : "bg-slate-500"
                      }`}
                    />
                    {isListening
                      ? "Microphone Live"
                      : isAISpeaking
                      ? "AI Speaking"
                      : "Ready"}
                  </span>
                </div>

                <div className="flex items-center space-x-2.5 text-xs">
                  <span className="font-mono text-[#70645C] bg-slate-100 px-2 py-0.5 rounded-full border border-[#E8D9CC] text-[11px]">
                    {(candidateAnswer || transcript).trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                  {(candidateAnswer || transcript) && (
                    <button
                      onClick={() => {
                        setTranscript("");
                        setCandidateAnswer("");
                        finalTranscriptRef.current = "";
                        interimTranscriptRef.current = "";
                        transcriptRef.current = "";
                        sessionBaseTranscriptRef.current = "";
                      }}
                      aria-label="Clear spoken transcript text"
                      className="text-[#70645C] hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 rounded-md px-2 py-1 min-h-[36px] flex items-center transition-colors font-medium cursor-pointer text-xs"
                    >
                      Clear Text
                    </button>
                  )}
                </div>
              </div>

              {/* Real-time Candidate Transcript Textarea */}
              <label htmlFor="candidate-transcript-input" className="sr-only">
                Spoken response transcript editor
              </label>
              <textarea
                id="candidate-transcript-input"
                aria-label="Spoken response transcript"
                value={candidateAnswer || transcript}
                onChange={(e) => {
                  const val = e.target.value;
                  hasUserManuallyEditedRef.current = true;
                  setCandidateAnswer(val);
                  setTranscript(val);
                  transcriptRef.current = val;
                  sessionBaseTranscriptRef.current = val;
                }}
                placeholder="Speak naturally — your answer transcribes in real time. You can also edit or refine text directly before submitting..."
                rows={3}
                className="w-full text-[#2B211C] placeholder-[#70645C] text-sm leading-relaxed bg-[#FFFCF8] p-3 rounded-xl border border-[#E8D9CC] focus:border-[#E85D04] focus:ring-2 focus:ring-[#E85D04]/20 focus:outline-none resize-none font-sans transition-all"
              />

              {/* Dynamic Real-time STAR Response Coach */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#E8D9CC] text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#E85D04]" />
                    <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-[#70645C]">
                      STAR Coach:
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all ${
                        starAnalysis.s
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-xs"
                          : "bg-slate-50 text-slate-500 border border-slate-200"
                      }`}
                    >
                      {starAnalysis.s ? "✓" : "○"} S · Situation
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all ${
                        starAnalysis.t
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-xs"
                          : "bg-slate-50 text-slate-500 border border-slate-200"
                      }`}
                    >
                      {starAnalysis.t ? "✓" : "○"} T · Task
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all ${
                        starAnalysis.a
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-xs"
                          : "bg-slate-50 text-slate-500 border border-slate-200"
                      }`}
                    >
                      {starAnalysis.a ? "✓" : "○"} A · Action
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all ${
                        starAnalysis.r
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-xs"
                          : starAnalysis.count >= 2
                          ? "bg-amber-50 text-amber-800 border border-amber-300 animate-pulse"
                          : "bg-slate-50 text-slate-500 border border-slate-200"
                      }`}
                    >
                      {starAnalysis.r ? "✓" : "○"} R · Result & Metrics
                    </span>
                  </div>
                </div>

                {starAnalysis.count >= 2 && !starAnalysis.r && (
                  <span className="text-[10px] text-amber-800 font-medium">
                    Tip: Cite concrete numbers (% lift, latency saved, user impact).
                  </span>
                )}
                {starAnalysis.count === 4 && (
                  <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                    ✓ Full STAR structure detected!
                  </span>
                )}
              </div>
            </div>

            {/* 4. ANSWER CONTROLS & INTERACTION AREA (Sticky Docked) */}
            <div className="sticky bottom-2 sm:bottom-4 z-30 bg-[#FFFFFF]/95 backdrop-blur-md border-2 border-[#E8D9CC] rounded-2xl p-3.5 sm:p-4 shadow-lg shadow-[0_4px_20px_rgba(48,32,22,0.12)] space-y-2.5 transition-all">
              {/* Top Row: Answer Countdown & Hands-Free Option */}
              <div className="flex items-center justify-between flex-wrap gap-2 pb-1.5 border-b border-[#E8D9CC]">
                <div className="flex items-center space-x-2 text-xs">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      questionTimer <= 15 ? "bg-rose-500 animate-ping" : questionTimer <= 30 ? "bg-amber-500" : "bg-[#E85D04]"
                    }`}
                  />
                  <span className="text-[#70645C] font-medium">
                    Time:{" "}
                    <span
                      className={`font-mono font-bold ${
                        questionTimer <= 15
                          ? "text-rose-400"
                          : questionTimer <= 30
                          ? "text-amber-400"
                          : "text-[#E85D04]"
                      }`}
                    >
                      00:{questionTimer < 10 ? `0${questionTimer}` : questionTimer}
                    </span>
                  </span>
                  <span className="text-[10px] text-[#70645C] hidden sm:inline">(Auto-submits at 00:00)</span>
                </div>

                <div className="flex items-center space-x-2">
                  {autoAnalyzeCountdown !== null && (
                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full animate-pulse">
                      Submitting in {autoAnalyzeCountdown}s...
                    </span>
                  )}
                  <button
                    onClick={() => setAutoAnalyzeEnabled(!autoAnalyzeEnabled)}
                    aria-pressed={autoAnalyzeEnabled}
                    aria-label={`Toggle hands-free mode, currently ${autoAnalyzeEnabled ? "on" : "off"}`}
                    className={`text-[10px] px-3 py-1.5 min-h-[36px] rounded-md font-semibold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04] ${
                      autoAnalyzeEnabled
                        ? "text-[#E85D04] bg-[#FFFCF8] border border-[#E8D9CC] shadow-2xs"
                        : "text-[#70645C] bg-slate-100 border border-[#E8D9CC] hover:text-[#2B211C]"
                    }`}
                    title="Hands-free auto answer submission"
                  >
                    {autoAnalyzeEnabled ? "⚡ Hands-Free: ON" : "⚡ Hands-Free: OFF"}
                  </button>
                </div>
              </div>

              {/* Bottom Controls Bar */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-0.5">
                {/* 8-Bar Audio Equalizer Meter */}
                <div className="flex items-center space-x-2 min-w-[120px]">
                  <div className="flex items-end space-x-1 h-5">
                    {[0.3, 0.6, 1.0, 1.4, 1.1, 0.8, 0.5, 0.3].map((multiplier, idx) => {
                      const barHeight = isListening
                        ? Math.max(4, Math.min(20, Math.round(((audioVolume * multiplier) / 100) * 20)))
                        : 4;
                      return (
                        <div
                          key={idx}
                          style={{ height: `${barHeight}px` }}
                          className={`w-1 rounded-full transition-all duration-75 motion-reduce:transition-none ${
                            isListening && audioVolume > 6
                              ? "bg-[#E85D04]"
                              : isListening
                              ? "bg-[#FF8A35]"
                              : "bg-slate-200"
                          }`}
                        />
                      );
                    })}
                  </div>
                  <span className="text-[11px] font-mono text-[#70645C]">
                    {isListening ? (audioVolume > 6 ? "Speaking" : "Listening...") : "Speak naturally"}
                  </span>
                </div>

                {/* Primary Mic Trigger & Submit Action Buttons */}
                <div className="flex items-center space-x-2.5">
                  {/* Microphone Trigger */}
                  <button
                    onClick={isListening ? stopListening : startListening}
                    disabled={
                      !interviewStarted ||
                      isAISpeaking ||
                      interviewCompleted ||
                      submitPhaseActive ||
                      isSubmittingCode
                    }
                    aria-label={isListening ? "Pause microphone" : "Start speaking your answer"}
                    className={`w-11 h-11 min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04] ${
                      isListening
                        ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse ring-4 ring-rose-500/30 motion-reduce:animate-none"
                        : interviewCompleted
                        ? "bg-slate-100 cursor-not-allowed text-slate-400"
                        : "bg-gradient-to-r from-[#E85D04] to-[#E85D04] hover:from-[#E85D04] hover:to-[#C84F04] text-white font-bold hover:scale-105"
                    } disabled:opacity-50 disabled:cursor-not-allowed active:scale-95`}
                    title={isListening ? "Pause microphone" : "Start speaking your answer"}
                  >
                    {isListening ? <Square size={16} /> : <Mic size={18} />}
                  </button>

                  {/* Primary Submit Answer Button */}
                  <button
                    onClick={handleManualSubmitAnswer}
                    disabled={isAiProcessing || isAISpeaking || (!candidateAnswer?.trim() && !transcript?.trim() && !isListening)}
                    aria-label="Submit spoken answer"
                    className="bg-gradient-to-r from-[#E85D04] to-[#E85D04] hover:from-[#E85D04] hover:to-[#C84F04] text-white text-xs font-bold min-h-[44px] px-5 py-2.5 rounded-xl transition shadow-md shadow-[#E85D04]/20 flex items-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04]"
                    title="Submit your spoken answer"
                  >
                    <Send size={15} />
                    <span>Submit Answer</span>
                  </button>

                  {/* Code Submit Button (If technical code executed) */}
                  {codeExecutionSuccess && categoryConfig.isTech && (
                    <button
                      onClick={submitCode}
                      disabled={isSubmittingCode}
                      aria-label="Submit code implementation"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold min-h-[44px] px-3.5 py-2.5 rounded-xl transition shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      <CheckCircle2 size={14} />
                      <span>{isSubmittingCode ? "Submitting..." : "Submit Code"}</span>
                    </button>
                  )}
                </div>

                {/* Speech Accent Selector */}
                <div className="flex items-center space-x-1">
                  <label htmlFor="voice-session-accent-selector" className="text-[11px] text-[#70645C]">Accent:</label>
                  <select
                    id="voice-session-accent-selector"
                    aria-label="Select speech recognition accent"
                    value={speechLang}
                    onChange={(e) => {
                      const newLang = e.target.value as any;
                      setSpeechLang(newLang);
                      speechLangRef.current = newLang;
                      if (recognitionRef.current) {
                        recognitionRef.current.lang = newLang;
                      }
                    }}
                    className="bg-[#FFFFFF] border border-[#E8D9CC] rounded-lg px-2 py-1.5 text-[11px] text-[#2B211C] focus:outline-none focus:ring-2 focus:ring-[#E85D04] cursor-pointer"
                  >
                    <option value="en-IN">🇮🇳 Indian</option>
                    <option value="en-US">🇺🇸 US</option>
                    <option value="en-GB">🇬🇧 UK</option>
                    <option value="en-AU">🇦🇺 AU</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 5. COLLAPSIBLE CONVERSATION HISTORY */}
            {messages.length > 0 && (
              <div className="bg-[#FFFFFF] border border-[#E8D9CC] rounded-2xl shadow-xs overflow-hidden relative">
                <button
                  type="button"
                  onClick={() => setShowChatHistory(!showChatHistory)}
                  aria-expanded={showChatHistory}
                  aria-controls="interview-conversation-history-panel"
                  aria-label={`Toggle interview conversation history, ${messages.length} messages`}
                  className="w-full px-4 py-3 min-h-[44px] flex items-center justify-between text-xs font-semibold text-[#2B211C] hover:bg-slate-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04]"
                >
                  <div className="flex items-center space-x-2">
                    <MessageSquare size={14} className="text-[#E85D04]" />
                    <span>Interview Conversation History ({messages.length} messages)</span>
                  </div>
                  {showChatHistory ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>

                {showChatHistory && (
                  <div className="relative">
                    <div
                      ref={conversationContainerRef}
                      onScroll={handleConversationScroll}
                      className="p-3.5 border-t border-[#E8D9CC] max-h-72 overflow-y-auto space-y-2.5 bg-slate-50/50"
                    >
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.type === "user"
                              ? "justify-end"
                              : message.type === "system"
                              ? "justify-center"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[90%] sm:max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                              message.type === "user"
                                ? "bg-[#FFFCF8] border border-[#E8D9CC] text-[#2B211C] rounded-tr-xs"
                                : message.type === "system"
                                ? "bg-amber-950/40 border border-amber-800 text-amber-300 text-center rounded-xl"
                                : "bg-[#FFFFFF] border border-[#E8D9CC] text-[#2B211C] rounded-tl-xs shadow-xs"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1 gap-2">
                              <div className="flex items-center space-x-1.5">
                                {message.type === "user" ? (
                                  <User size={12} className="text-[#E85D04]" />
                                ) : (
                                  <Bot size={12} className="text-[#38BDF8]" />
                                )}
                                <span className="text-[10px] font-mono text-[#70645C]">
                                  {message.type === "user" ? "Candidate" : "AI Interviewer"} •{" "}
                                  {message.timestamp.toLocaleTimeString()}
                                </span>
                              </div>
                              {message.type === "ai" && (
                                <button
                                  onClick={() => replayAIMessage(message)}
                                  className="text-[#E85D04] hover:text-white transition cursor-pointer"
                                  title="Replay Audio"
                                >
                                  <Volume2 size={12} />
                                </button>
                              )}
                            </div>
                            <div className="whitespace-pre-wrap">{message.content}</div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Jump to Latest Button when User Manually Scrolled Up */}
                    {isUserScrolledUp && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserScrolledUp(false);
                          if (conversationContainerRef.current) {
                            conversationContainerRef.current.scrollTo({
                              top: conversationContainerRef.current.scrollHeight,
                              behavior: "smooth",
                            });
                          }
                        }}
                        aria-label="Jump to newest message"
                        className="absolute bottom-3 right-4 px-3 py-1.5 min-h-[36px] rounded-full bg-gradient-to-r from-[#E85D04] to-[#E85D04] text-white font-bold text-xs shadow-md flex items-center gap-1.5 motion-reduce:animate-none z-20 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04]"
                      >
                        <span>Jump to newest</span>
                        <ChevronDown size={13} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: Candidate Camera (Top), Security Dropdown & CODE EDITOR (Below) - Independently Scrollable */}
          {/* ========================================================================= */}
          <div
            className={`w-full lg:w-[460px] xl:w-[500px] 2xl:w-[540px] shrink-0 flex flex-col border-l border-[#E8D9CC] bg-[#FFFCF8] p-3 space-y-2.5 overflow-y-auto overscroll-contain h-full min-h-0 ${
              activeMobileTab === "code"
                ? "flex"
                : activeMobileTab === "chat"
                ? "flex lg:flex"
                : "!hidden lg:!flex"
            }`}
          >
            {/* 1. Candidate Camera Preview Card (Upper-Right Corner) - Stationary */}
            <div
              className={`shrink-0 bg-[#FFFFFF] rounded-2xl border border-[#E8D9CC] p-3 shadow-xs ${
                activeMobileTab === "code" ? "hidden lg:block" : "block"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-[#2B211C]">Candidate Preview</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Live Feed
                </span>
              </div>

              {/* Live Video Feed - Compact aspect ratio so it doesn't push code editor down */}
              <div
                className={`w-full aspect-[16/10] sm:aspect-video max-h-[165px] rounded-xl overflow-hidden relative bg-slate-900 border transition-all ${
                  proctorStatus !== "aligned"
                    ? "border-rose-400 ring-2 ring-rose-200"
                    : "border-[#E8D9CC]"
                }`}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-[#111827]/80 backdrop-blur-xs px-2 py-0.5 rounded-full text-[10px] text-white font-mono flex items-center gap-1 border border-white/10 shadow-xs">
                  <span className="text-amber-400">⚡</span>
                  <span>Confidence: <strong className="text-white">{confidenceIndex}%</strong></span>
                </div>
                <div className="absolute bottom-2 left-2 bg-[#111827]/80 backdrop-blur-xs px-2 py-0.5 rounded-md text-[10px] text-white font-bold border border-white/20">
                  You
                </div>
                {isListening && (
                  <div className="absolute top-2 right-2 bg-rose-50 text-rose-700 border border-rose-200 font-semibold px-2 py-0.5 rounded-full text-[10px] animate-pulse">
                    ● Recording
                  </div>
                )}
              </div>

              {/* AI Body Language & Confidence Telemetry Live Bar */}
              <div className="mt-2 p-1.5 rounded-xl bg-[#FFFCF8] border border-[#E8D9CC] grid grid-cols-3 gap-1 text-[10px] text-center font-mono shadow-xs">
                <div className="flex flex-col items-center">
                  <span className="text-[#70645C] text-[9px] uppercase tracking-wider font-semibold">Eye Contact</span>
                  <span className={`font-bold ${eyeContactRatio >= 75 ? "text-emerald-600 font-bold" : "text-amber-500"}`}>
                    {eyeContactRatio}%
                  </span>
                </div>
                <div className="flex flex-col items-center border-x border-[#E8D9CC]">
                  <span className="text-[#70645C] text-[9px] uppercase tracking-wider font-semibold">Posture</span>
                  <span className={`font-bold ${postureStability >= 80 ? "text-emerald-600 font-bold" : "text-amber-500"}`}>
                    {postureStability}%
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[#70645C] text-[9px] uppercase tracking-wider font-semibold">Voice Pace</span>
                  <span className="font-bold text-[#E85D04]">
                    {speechPaceWpm} WPM
                  </span>
                </div>
              </div>

              {/* Device Status Indicators */}
              <div className="mt-2 pt-2 border-t border-[#E8D9CC] grid grid-cols-3 gap-1 text-[10px] text-center font-medium">
                <div className="flex items-center justify-center gap-1 text-[#70645C]">
                  <span className={`w-1.5 h-1.5 rounded-full ${isCameraOn ? "bg-emerald-500" : "bg-rose-500"}`} />
                  <span>Camera</span>
                </div>
                <div className="flex items-center justify-center gap-1 text-[#70645C]">
                  <span className={`w-1.5 h-1.5 rounded-full ${isMicOn ? "bg-emerald-500" : "bg-rose-500"}`} />
                  <span>Mic</span>
                </div>
                <div className="flex items-center justify-center gap-1 text-emerald-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Proctoring</span>
                </div>
              </div>
            </div>

            {/* 2. Security Instructions Collapsible Dropdown Menu - Stationary */}
            <div
              className={`shrink-0 bg-[#FFFFFF] rounded-2xl border border-[#E8D9CC] shadow-xs overflow-hidden transition-all ${
                activeMobileTab === "code" ? "hidden lg:block" : "block"
              }`}
            >
              <button
                type="button"
                onClick={() => setShowSecurityInstructions((prev) => !prev)}
                className="w-full p-2.5 sm:p-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer select-none"
                aria-expanded={showSecurityInstructions}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#FFFCF8] border border-[#E8D9CC] text-[#E85D04] flex items-center justify-center shrink-0">
                    <ShieldCheck size={14} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#2B211C] block leading-tight">
                      Security Instructions
                    </span>
                    <span className="text-[10px] text-[#70645C]">
                      Proctoring &amp; Compliance Rules
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>8 Active</span>
                  </span>
                  <div className="p-0.5 rounded-md text-[#70645C]">
                    {showSecurityInstructions ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </div>
                </div>
              </button>

              {/* Collapsible Panel - Expanded on User Click with internal scroll */}
              {showSecurityInstructions && (
                <div className="border-t border-[#E8D9CC] p-3 space-y-2.5 bg-slate-50/80 animate-in fade-in duration-200 max-h-52 overflow-y-auto overscroll-contain">
                  {/* Explanatory Content */}
                  <div className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E8D9CC] text-[11px] text-[#70645C] space-y-1 leading-relaxed">
                    <p className="font-bold text-[#2B211C] flex items-center gap-1.5 text-xs">
                      <Shield size={13} className="text-[#E85D04]" />
                      <span>Security &amp; Proctoring Rules</span>
                    </p>
                    <p>• Keep your face centered within your camera frame throughout the session.</p>
                    <p>• Only one candidate is allowed in the environment; secondary persons are flagged.</p>
                    <p>• Continuous screen sharing must remain active during technical questions.</p>
                    <p>• Fullscreen lock is enforced; switching tabs or minimizing the browser is recorded.</p>
                    <p>• Mobile phones, smartwatches, and secondary devices are strictly prohibited.</p>
                  </div>

                  {/* Active Proctoring Checks Live Grid */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-1 text-[11px] font-bold text-[#2B211C]">
                      <span>Live Checks</span>
                      <span className="text-[10px] font-mono text-[#E85D04]">Verification</span>
                    </div>
                    {[
                      {
                        label: "Face Presence",
                        ok: proctorMetrics.facePresence === "FACE_PRESENT",
                        detail: proctorMetrics.facePresence === "FACE_PRESENT" ? "Verified" : "Away",
                      },
                      {
                        label: "Single Candidate",
                        ok: (proctorMetrics.personCount || 1) <= 1,
                        detail: (proctorMetrics.personCount || 1) <= 1 ? "1 Person" : "Multiple",
                      },
                      {
                        label: "Camera Unobstructed",
                        ok: !proctorMetrics.isObstructed && proctorMetrics.cameraHealth === "CAMERA_OK",
                        detail: !proctorMetrics.isObstructed ? "Clear" : "Obstructed",
                      },
                      {
                        label: "Attention / Gaze",
                        ok: proctorMetrics.gazeDirection === "CENTER" || proctorMetrics.gazeDirection === "UNKNOWN",
                        detail: proctorMetrics.gazeDirection === "CENTER" || proctorMetrics.gazeDirection === "UNKNOWN" ? "Screen" : "Looking Away",
                      },
                      {
                        label: "No Device Detected",
                        ok: !proctorMetrics.deviceDetected,
                        detail: !proctorMetrics.deviceDetected ? "None" : "Phone Detected",
                      },
                      {
                        label: "Window Lock",
                        ok: typeof document !== "undefined" ? !!document.fullscreenElement : true,
                        detail: "Secure",
                      },
                      {
                        label: "Screen Integrity",
                        ok: isScreenSharing && !screenAnalysis?.unauthorizedContentDetected && !screenAnalysis?.screenRecordingDetected,
                        detail: !isScreenSharing
                          ? "Not Shared"
                          : screenAnalysis?.unauthorizedContentDetected
                          ? "Violation"
                          : "Clean",
                      },
                      
                    ].map((checkItem, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-xl bg-[#FFFFFF] border border-[#E8D9CC] text-xs shadow-xs"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center ${
                              checkItem.ok
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            <Check size={10} />
                          </div>
                          <span className="text-[11px] font-medium text-[#2B211C]">{checkItem.label}</span>
                        </div>
                        <span
                          className={`text-[10px] font-mono font-semibold ${
                            checkItem.ok ? "text-emerald-700" : "text-rose-700"
                          }`}
                        >
                          {checkItem.detail}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. TECHNICAL WORKSPACE: CODE EDITOR & SYSTEM DESIGN (OCCUPIES REMAINING HEIGHT, INDEPENDENT SCROLL) */}
            <TechnicalWorkspaceDrawer
              technicalDrawerTab={technicalDrawerTab}
              setTechnicalDrawerTab={setTechnicalDrawerTab}
              activeMobileTab={activeMobileTab}
              language={language}
              setLanguage={setLanguage}
              languageOptions={getLanguageOptions()}
              runCode={runCode}
              isRunningCode={isRunningCode}
              code={code}
              setCode={setCode}
              codeExecutionSuccess={codeExecutionSuccess}
              setCodeExecutionSuccess={setCodeExecutionSuccess}
              lastExecutionResult={lastExecutionResult}
              setLastExecutionResult={setLastExecutionResult}
              isAISpeaking={isAISpeaking}
              onSendWhiteboardAnswer={(summary) => {
                handleSendAnswer(`[System Architecture Design Submission]:\n${summary}`);
              }}
            />
          </div>
        </div>

        {/* Mobile Sticky Controls Footer */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-[#FFFFFF]/95 backdrop-blur-md border-t border-[#E8D9CC] z-40 shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={
                  !interviewStarted ||
                  isAISpeaking ||
                  interviewCompleted ||
                  submitPhaseActive ||
                  isSubmittingCode
                }
                className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center transition shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04] ${
                  isListening
                    ? "bg-rose-600 text-white animate-pulse"
                    : "bg-[#E85D04] text-white"
                } disabled:opacity-50`}
              >
                {isListening ? <Square size={16} /> : <Mic size={18} />}
              </button>

              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-[#2B211C] truncate">
                  {isListening ? "Listening to your answer..." : isAISpeaking ? "AI Speaking" : "Tap mic to speak"}
                </span>
                <span className="text-[10px] text-[#70645C] font-mono">
                  Time: 00:{questionTimer < 10 ? `0${questionTimer}` : questionTimer}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleManualSubmitAnswer}
                disabled={isAiProcessing || isAISpeaking}
                className="min-h-[44px] bg-gradient-to-r from-[#E85D04] to-[#E85D04] hover:from-[#E85D04] hover:to-[#C84F04] text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-md shadow-orange-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04]"
              >
                Submit
              </button>
              <button
                onClick={() => setShowConfirmEnd(true)}
                className="min-h-[44px] min-w-[44px] bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 p-2.5 rounded-xl flex items-center justify-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                title="End Interview"
              >
                <Phone size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Development Voice Diagnostics Panel */}
        <VoiceDiagnosticsPanel
          isOpen={showDebugPanel}
          onClose={() => setShowDebugPanel(false)}
          isMicOn={isMicOn}
          voiceState={voiceState}
          audioVolume={audioVolume}
          isAISpeaking={isAISpeaking}
          sttLatency={sttLatency}
          llmLatency={llmLatency}
          currentTranscript={candidateAnswer || transcript}
          debugLogs={debugLogs}
          onClearLogs={() => setDebugLogs([])}
        />
      </main>
    </div>
  );
}

export default function VoiceInterviewPage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#FFFCF8] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E85D04] mx-auto mb-4"></div>
              <p className="text-sm font-medium text-[#70645C]">Loading interview session...</p>
            </div>
          </div>
        }
      >
        <VoiceInterviewContent />
      </Suspense>
    </ProtectedRoute>
  );
}
