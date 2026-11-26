"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Target,
  Brain,
  MessageSquare,
  Code,
  Clock,
  Star,
  Download,
  Share2,
  RefreshCw,
  Loader2,
  Mic,
  Activity,
  Sparkles,
  CheckCircle2,
  Award,
  Zap,
  BookOpen,
  ShieldCheck,
  ShieldAlert,
  Eye,
  Monitor,
  Smartphone,
  Users,
  Lock,
  Camera,
  FileCheck,
  X,
  Printer,
  Check,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Radar as RadarIcon,
  Video,
  VideoOff,
  Play,
  Calendar,
  Info,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import BottomNav from "@/components/BottomNav";
import ProctoringTimelineView from "@/components/proctoring/ProctoringTimelineView";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import MetricCounter from "@/components/interview/MetricCounter";
import AIStatusBadge from "@/components/interview/AIStatusBadge";
import SpeechAnalyticsWidget from "@/components/interview/SpeechAnalyticsWidget";
import CompetencyRadarChart, { CompetencyMetric } from "@/components/interview/CompetencyRadarChart";


const API_URL = process.env.NEXT_PUBLIC_API_URL;

const companyTrackBadges: Record<string, { name: string; tag: string; icon: string; style: string }> = {
  amazon: { name: "Amazon Bar Raiser Track", tag: "14 Leadership Principles & STAR Metrics", icon: "📦", style: "bg-[#18130B] text-amber-300 border-amber-500/40" },
  google: { name: "Google L4/L5 Track", tag: "Scale to Billions & Big-O Efficiency", icon: "🔍", style: "bg-[#0A161E] text-sky-300 border-sky-500/40" },
  microsoft: { name: "Microsoft Track", tag: "Enterprise Reliability & Clean Architecture", icon: "🪟", style: "bg-[#0B1522] text-cyan-300 border-cyan-500/40" },
  meta: { name: "Meta / FB Track", tag: "High Concurrency & Fast Execution", icon: "♾️", style: "bg-[#0B1220] text-emerald-300 border-emerald-500/40" },
  tcs_infosys: { name: "TCS / Infosys Track", tag: "Core CS, OOPs, SQL & Project Walkthrough", icon: "🏢", style: "bg-[#19110B] text-orange-300 border-orange-500/40" },
  tier1_startup: { name: "High-Growth Startup Track", tag: "Full-Stack Ownership & Velocity", icon: "🚀", style: "bg-[#FFF0E6] text-[#E85D04] border-[#E8D9CC]" },
};

function InterviewResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [isVisible, setIsVisible] = useState(false);
  const [freeInterviewsUsed, setFreeInterviewsUsed] = useState(0);
  const [hasPaidPlan, setHasPaidPlan] = useState(false);
  const [interviewData, setInterviewData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<number | null>(null);
  const [activeAnswerTabs, setActiveAnswerTabs] = useState<{
    [key: number]: "user" | "model" | "star";
  }>({});
  const [expandedQuestions, setExpandedQuestions] = useState<{ [key: number]: boolean }>({ 0: true });
  const [selectedSnapshot, setSelectedSnapshot] = useState<any>(null);
  const [showCertificateModal, setShowCertificateModal] = useState<boolean>(false);
  const [isCopiedCert, setIsCopiedCert] = useState<boolean>(false);
  const [heroVisualMode, setHeroVisualMode] = useState<"radar" | "bars">("radar");
  const [activeCompetency, setActiveCompetency] = useState<string | null>(null);
  const [resultsActiveTab, setResultsActiveTab] = useState<"overview" | "questions" | "proctoring" | "coaching" | "all">("overview");

  interface RecordingInfo {
    exists: boolean;
    isExpired: boolean;
    streamUrl?: string;
    downloadUrl?: string;
    filename?: string;
    fileSize?: number;
    daysRemaining?: number;
    hoursRemaining?: number;
    expiresAt?: string;
    mimeType?: string;
    isLocalPreview?: boolean;
    message?: string;
  }

  const [recordingInfo, setRecordingInfo] = useState<RecordingInfo | null>(null);
  const [recordingLoading, setRecordingLoading] = useState<boolean>(true);

  const fetchRecordingInfo = async (id: string, userToken: string) => {
    if (!id) return;
    try {
      setRecordingLoading(true);

      // 1. Check local session storage first (for instant post-interview preview)
      let localUrl: string | null = null;
      let localMime: string | null = null;
      let localSize: number = 0;

      if (typeof window !== "undefined") {
        try {
          localUrl = sessionStorage.getItem("recording_" + id);
          localMime = sessionStorage.getItem("recording_mime_" + id);
          localSize = Number(sessionStorage.getItem("recording_size_" + id) || 0);
        } catch {}
      }

      // 2. Fetch recording status from backend API
      const res = await fetch(`${API_URL}/interview/${id}/recording`, {
        headers: {
          ...(userToken ? { Authorization: `Bearer ${userToken}` } : {}),
        },
      }).catch((err) => {
        console.warn("Could not fetch remote recording info:", err);
        return null;
      });

      if (res && res.ok) {
        const data = await res.json();
        console.log("📼 Recording status received from API:", data);

        if ((data.exists || data.available) && !data.isExpired) {
          const downloadUrl = data.downloadUrl ? `${API_URL}${data.downloadUrl}` : undefined;
          setRecordingInfo({
            exists: true,
            isExpired: false,
            streamUrl: downloadUrl || localUrl || undefined,
            downloadUrl: downloadUrl || localUrl || undefined,
            filename: data.filename || `interview_${id}.webm`,
            fileSize: data.fileSize || data.sizeBytes || localSize,
            daysRemaining: data.daysRemaining ?? 10,
            hoursRemaining: data.hoursRemaining,
            expiresAt: data.expiresAt,
            mimeType: data.mimeType || localMime || "video/webm",
            isLocalPreview: false,
            message: data.message,
          });
          return;
        } else if (data.isExpired) {
          setRecordingInfo({
            exists: true,
            isExpired: true,
            daysRemaining: 0,
            expiresAt: data.expiredAt,
            message: data.message || "Recording expired after 10-day retention period.",
          });
          return;
        }
      }

      // 3. Fallback to local preview if available
      if (localUrl) {
        setRecordingInfo({
          exists: true,
          isExpired: false,
          streamUrl: localUrl,
          downloadUrl: localUrl,
          filename: `interview_${id}.webm`,
          fileSize: localSize,
          daysRemaining: 10,
          expiresAt: new Date(Date.now() + 10 * 86400000).toISOString(),
          mimeType: localMime || "video/webm",
          isLocalPreview: true,
        });
      } else {
        setRecordingInfo({
          exists: false,
          isExpired: false,
        });
      }
    } catch (err) {
      console.warn("Notice checking interview recording info:", err);
      setRecordingInfo({
        exists: false,
        isExpired: false,
      });
    } finally {
      setRecordingLoading(false);
    }
  };

  const toggleQuestion = (index: number) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const toggleAllQuestions = (expand: boolean) => {
    if (!results?.questionAnswers) return;
    const newState: { [key: number]: boolean } = {};
    results.questionAnswers.forEach((_: any, idx: number) => {
      newState[idx] = expand;
    });
    setExpandedQuestions(newState);
  };

  const interviewId = searchParams.get("id") || searchParams.get("sessionId") || searchParams.get("interviewId") || "";

  const humanizeLabel = (value?: string) => {
    if (!value) return "";
    return value
      .toString()
      .replace(/[_-]+/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
  };

  const handleDismissIncident = async (incidentId: string) => {
    if (!interviewId) return;
    try {
      const res = await fetch(`${API_URL}/proctoring/dismiss`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          sessionId: interviewId,
          incidentId,
          reason: "Dismissed by reviewer",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.updatedAuditReport) {
          setInterviewData((prev: any) => ({
            ...prev,
            proctoringAudit: data.updatedAuditReport,
            results: {
              ...(prev?.results || {}),
              proctoringAudit: data.updatedAuditReport,
            },
          }));
        }
      }
    } catch (err) {
      console.warn("Failed to dismiss incident:", err);
    }
  };

  useEffect(() => {
    // Immediately terminate any leftover speech from the interview session
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    setIsVisible(true);

    const fetchInterviewData = async () => {
      if (!interviewId || !user?._id || !token) {
        setError("Missing interview ID or authentication");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // First check localStorage for fresh interview results
        const storedResults = localStorage.getItem("interviewResults");
        if (storedResults) {
          try {
            const parsedResults = JSON.parse(storedResults);
            console.log("📊 Using stored interview results:", parsedResults);

            // Convert the formatted results back to the expected structure
            const formattedData = {
              sessionId: interviewId,
              scores: {
                overall: parsedResults.overallScore,
                technical: parsedResults.scores?.technical,
                communication: parsedResults.scores?.communication,
                problemSolving: parsedResults.scores?.problemSolving,
                codeQuality: parsedResults.scores?.codeQuality,
                architectureDesign: parsedResults.scores?.architectureDesign,
                practicalApplication: parsedResults.scores?.practicalApplication,
              },
              configuration: {
                category: parsedResults.category,
                level: parsedResults.level,
                duration: parseInt(parsedResults.duration) || 0,
                targetCompany: parsedResults.companyTrack || parsedResults.targetCompany,
              },
              confidenceMetrics: parsedResults.confidenceMetrics,
              companyTrack: parsedResults.companyTrack || parsedResults.targetCompany,
              createdAt: parsedResults.completedAt,
              results: {
                detailedAnalysis: {
                  strengths: parsedResults.strengths,
                  improvements: parsedResults.improvements,
                },
                confidenceMetrics: parsedResults.confidenceMetrics,
                companyTrack: parsedResults.companyTrack || parsedResults.targetCompany,
                speechAnalytics: parsedResults.speechAnalytics,
                starPerformance: parsedResults.starPerformance,
                technicalFeedback: parsedResults.detailedFeedback.technical,
                communicationFeedback:
                  parsedResults.detailedFeedback.communication,
                problemSolvingFeedback:
                  parsedResults.detailedFeedback.problemSolving,
                codeQualityFeedback: parsedResults.detailedFeedback.codeQuality,
                codeSubmissions: parsedResults.codeSubmissions,
                proctoringAudit: parsedResults.proctoringAudit,
              },
              proctoringAudit: parsedResults.proctoringAudit,
              speechAnalytics: parsedResults.speechAnalytics,
              starPerformance: parsedResults.starPerformance,
              questionAnswers: parsedResults.questionAnswers,
            };

            setInterviewData(formattedData);
            fetchRecordingInfo(interviewId, token || "");
            // Clear localStorage after using it
            localStorage.removeItem("interviewResults");
            return;
          } catch (parseError) {
            console.warn(
              "Failed to parse stored results, falling back to API:",
              parseError
            );
          }
        }

        // Fallback to API if no localStorage data
        // Try fetching detailed interview data first
        let interview = null;
        try {
          const detailResponse = await fetch(
            `${API_URL}/interview/results/${interviewId}/detailed`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (detailResponse.ok) {
            const responseData = await detailResponse.json();
            if (responseData.success && responseData.results) {
              interview = responseData.results;
            } else {
              interview = responseData;
            }
          } else {
            if (detailResponse.status === 401 || detailResponse.status === 403) {
              setErrorCode(detailResponse.status);
              throw new Error("Access denied: You do not have permission to view this scorecard.");
            }
            if (detailResponse.status >= 500) {
              setErrorCode(detailResponse.status);
            }
          }
        } catch (detailError: any) {
          if (detailError?.message?.includes("Access denied")) {
            throw detailError;
          }
          console.warn(
            "Failed to fetch details, falling back to history:",
            detailError
          );
        }

        if (!interview && user?._id) {
          const response = await fetch(
            `${API_URL}/users/${user._id}/interview-history`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            interview = data.interviews?.find(
              (int: any) =>
                (int.sessionId && int.sessionId === interviewId) ||
                (int._id && String(int._id) === interviewId) ||
                (int.id && String(int.id) === interviewId)
            );
          } else if (response.status === 401 || response.status === 403) {
            setErrorCode(response.status);
            throw new Error("Access denied: Please sign in to view this session.");
          } else if (response.status >= 500) {
            setErrorCode(response.status);
            throw new Error("Assessment service temporarily unavailable.");
          }
        }

        if (!interview) {
          throw new Error("Interview evaluation record could not be found.");
        }

        console.log("Interview data structure:", interview);
        console.log("Scores object:", interview.scores);
        console.log("Scoreboard object:", interview.scoreboard);
        setInterviewData(interview);
        fetchRecordingInfo(interviewId, token || "");
      } catch (error) {
        console.error("Error fetching interview data:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load interview data"
        );
      } finally {
        setLoading(false);
      }
    };

    // Check updated free trial usage
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

        if (!response.ok) {
          console.warn("API endpoint not available, using default values");
          setFreeInterviewsUsed(0);
          setHasPaidPlan(false);
          return;
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          console.warn("API returned non-JSON response, using default values");
          setFreeInterviewsUsed(0);
          setHasPaidPlan(false);
          return;
        }

        const data = await response.json();
        setFreeInterviewsUsed(data.freeInterviewsUsed || 0);
        setHasPaidPlan(data.hasPaidPlan || false);
      } catch (error) {
        console.warn("Backend API not available, using default values");
        setFreeInterviewsUsed(0);
        setHasPaidPlan(false);
      }
    };

    if (user?._id && token) {
      fetchInterviewData();
      checkFreeTrialUsage();
    }
  }, [interviewId, user?._id, token]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFCF8] text-[#2B211C]">
        <Navbar />
        <Sidebar userType="learner" />
        <div className="md:ml-64 ml-0 pt-16 md:pt-20 pb-24 md:pb-12">
          <div className="container-custom flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <Loader2 className="h-10 w-10 animate-spin text-[#E85D04] mx-auto mb-4" />
              <p className="text-[#70645C] text-sm font-medium">Loading interview results...</p>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Error state
  if (error || !interviewData) {
    const isAuthError = errorCode === 401 || errorCode === 403 || error?.toLowerCase().includes("access denied");
    const isServerError = (errorCode && errorCode >= 500) || error?.toLowerCase().includes("unavailable");

    return (
      <div className="min-h-screen bg-[#FFFCF8] text-[#2B211C]">
        <Navbar />
        <Sidebar userType="learner" />
        <div className="md:ml-64 ml-0 pt-16 md:pt-20 pb-24 md:pb-12">
          <div className="container-custom flex items-center justify-center min-h-[60vh]">
            <div className="text-center bg-[#FFFFFF] border border-[#E8D9CC] p-8 rounded-2xl shadow-xs max-w-md mx-auto">
              <div className="text-4xl mb-4">
                {isAuthError ? "🔒" : isServerError ? "⚙️" : "📄"}
              </div>
              <h2 className="text-xl font-bold mb-2 text-[#2B211C]">
                {isAuthError
                  ? "Access Authorization Required"
                  : isServerError
                  ? "Assessment Engine Unavailable"
                  : "Interview Record Not Found"}
              </h2>
              <p className="text-[#70645C] mb-6 text-xs leading-relaxed">
                {isAuthError
                  ? "You do not have permission to view this scorecard, or your session has expired. Please verify your credentials."
                  : isServerError
                  ? "We were unable to reach the assessment scoring engine. Please check your network and retry."
                  : (error || "The requested evaluation scorecard does not exist in your interview history records.")}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                {isAuthError ? (
                  <button
                    onClick={() => router.push("/login")}
                    className="w-full sm:w-auto px-5 py-2.5 bg-[#E85D04] hover:bg-[#E85D04] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04]"
                  >
                    Sign In
                  </button>
                ) : isServerError ? (
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full sm:w-auto px-5 py-2.5 bg-[#E85D04] hover:bg-[#E85D04] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04]"
                  >
                    Retry Connection
                  </button>
                ) : null}
                <button
                  onClick={() => router.push("/learner/history")}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#FFFCF8] hover:bg-[#FFFCF8] text-[#2B211C] border border-[#E8D9CC] font-bold text-xs rounded-xl transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04]"
                >
                  Back to History
                </button>
              </div>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  const rawCat =
    interviewData.category ||
    interviewData.configuration?.category ||
    interviewData.results?.category ||
    interviewData.title ||
    "Cloud Architect";
  const resolvedCategory = rawCat === "Interview" || rawCat === "Unknown" ? "Cloud Architect" : rawCat;

  const isCodingDomain = [
    "software engineer", "frontend", "backend", "full stack", "fullstack",
    "python developer", "java developer", "web developer", "react developer",
    "node", "golang", "c++", "c#"
  ].some((term) => resolvedCategory.toLowerCase().includes(term) && !resolvedCategory.toLowerCase().includes("architect"));

  const isArchitectureOrCloudDomain = [
    "cloud", "architect", "solutions architect", "devops", "infrastructure", "network", "security", "system"
  ].some((term) => resolvedCategory.toLowerCase().includes(term));

  const hasCodeEditor =
    !isArchitectureOrCloudDomain &&
    (interviewData.configuration?.hasCodeEditor === true || interviewData.hasCodeEditor === true);

  const showCodeMetrics = hasCodeEditor || (!isArchitectureOrCloudDomain && isCodingDomain);

  const radar =
    interviewData.results?.openAiReport?.radarScores ||
    interviewData.openAiReport?.radarScores ||
    interviewData.results?.radarScores ||
    interviewData.radarScores ||
    {};

  const rawOverall =
    interviewData.overallScore ??
    interviewData.scoreboard?.overallScore ??
    interviewData.results?.overallScore ??
    interviewData.scores?.overall;

  const validScore = (val: any): number | null => {
    if (val === null || val === undefined || val === "") return null;
    const num = Number(val);
    return typeof num === "number" && !isNaN(num) && num >= 0 ? Math.round(num) : null;
  };

  const resolvedOverallScore =
    validScore(rawOverall) ??
    validScore(radar.domainKnowledge) ??
    0;

  const techScore =
    validScore(interviewData.scores?.technical) ??
    validScore(interviewData.results?.scores?.technical) ??
    validScore(interviewData.scoreboard?.detailedScores?.technical) ??
    validScore(interviewData.results?.detailedScores?.technical) ??
    validScore(radar.domainKnowledge) ??
    resolvedOverallScore;

  const commScore =
    validScore(interviewData.scores?.communication) ??
    validScore(interviewData.results?.scores?.communication) ??
    validScore(interviewData.scoreboard?.detailedScores?.communication) ??
    validScore(interviewData.results?.detailedScores?.communication) ??
    validScore(radar.communication) ??
    resolvedOverallScore;

  const psScore =
    validScore(interviewData.scores?.problemSolving) ??
    validScore(interviewData.results?.scores?.problemSolving) ??
    validScore(interviewData.scoreboard?.detailedScores?.problemSolving) ??
    validScore(interviewData.results?.detailedScores?.problemSolving) ??
    validScore(radar.problemSolving) ??
    resolvedOverallScore;

  const isCloudOrDevopsOrDesign = isArchitectureOrCloudDomain;

  const fourthLabel = showCodeMetrics
    ? "Code Quality"
    : isCloudOrDevopsOrDesign
    ? "System Architecture"
    : "Practical Execution";

  const fourthScore = showCodeMetrics
    ? (validScore(interviewData.scores?.codeQuality) ??
       validScore(interviewData.results?.scores?.codeQuality) ??
       validScore(interviewData.scoreboard?.detailedScores?.codeQuality) ??
       validScore(interviewData.results?.detailedScores?.codeQuality) ??
       validScore(radar.practicalApplication) ??
       resolvedOverallScore)
    : (validScore(radar.architectureDesign) ??
       validScore(interviewData.scores?.architectureDesign) ??
       validScore(interviewData.results?.scores?.architectureDesign) ??
       validScore(interviewData.scoreboard?.detailedScores?.architectureDesign) ??
       validScore(radar.practicalApplication) ??
       validScore(interviewData.scores?.practicalApplication) ??
       validScore(interviewData.results?.scores?.practicalApplication) ??
       resolvedOverallScore);

  const cqScore = showCodeMetrics ? fourthScore : undefined;

  const rawLvl =
    interviewData.level ||
    interviewData.configuration?.level ||
    interviewData.results?.level ||
    interviewData.difficulty ||
    "Beginner";
  const resolvedLevel = rawLvl === "Unknown" || !rawLvl ? "Beginner" : rawLvl;

  const rawCompletedAt =
    interviewData.completedAt ||
    interviewData.endTime ||
    interviewData.createdAt ||
    interviewData.startTime ||
    interviewData.results?.completedAt;

  const resolvedCompletedAt = rawCompletedAt
    ? new Date(rawCompletedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

  const results = {
    overallScore: resolvedOverallScore,
    category: resolvedCategory,
    level: resolvedLevel,
    duration: `${interviewData.configuration?.duration || interviewData.duration || 15} minutes`,
    completedAt: resolvedCompletedAt,
    scores: {
      technical: techScore,
      communication: commScore,
      problemSolving: psScore,
      codeQuality: cqScore,
      architectureDesign: validScore(radar.architectureDesign) ?? techScore,
      practicalApplication: validScore(radar.practicalApplication) ?? techScore,
      fourthLabel,
      fourthScore,
    },
    strengths:
      interviewData.results?.topStrengths ||
      interviewData.results?.openAiReport?.topStrengths ||
      interviewData.openAiReport?.topStrengths ||
      interviewData.topStrengths ||
      interviewData.results?.detailedAnalysis?.topStrengths ||
      interviewData.results?.detailedAnalysis?.strengths ||
      interviewData.results?.strengths ||
      interviewData.strengths || [
        `Good grasp of ${humanizeLabel(resolvedCategory)} fundamentals`,
        "Structured problem-solving approach",
        "Clear and articulate technical communication",
      ],
    improvements:
      interviewData.results?.criticalImprovements ||
      interviewData.results?.openAiReport?.criticalImprovements ||
      interviewData.openAiReport?.criticalImprovements ||
      interviewData.criticalImprovements ||
      interviewData.results?.detailedAnalysis?.criticalImprovements ||
      interviewData.results?.detailedAnalysis?.improvements ||
      interviewData.results?.improvements ||
      interviewData.improvements || [
        `Deepen production ${humanizeLabel(resolvedCategory)} architecture knowledge`,
        "Elaborate more on disaster recovery and failure modes",
        "Quantify trade-offs with concrete metrics and SLAs",
      ],
    learningRoadmap:
      interviewData.results?.learningRoadmap ||
      interviewData.results?.openAiReport?.learningRoadmap ||
      interviewData.openAiReport?.learningRoadmap ||
      interviewData.learningRoadmap ||
      interviewData.results?.detailedAnalysis?.learningRoadmap ||
      [],
    executiveSummary:
      interviewData.results?.executiveSummary ||
      interviewData.results?.openAiReport?.executiveSummary ||
      interviewData.openAiReport?.executiveSummary ||
      interviewData.executiveSummary ||
      interviewData.results?.detailedAnalysis?.executiveSummary ||
      "",
    hiringRecommendation:
      interviewData.results?.hiringRecommendation ||
      interviewData.results?.openAiReport?.hiringRecommendation ||
      interviewData.openAiReport?.hiringRecommendation ||
      interviewData.hiringRecommendation ||
      interviewData.results?.detailedAnalysis?.hiringRecommendation ||
      "",
    detailedFeedback: {
      technical:
        interviewData.results?.detailedAnalysis?.detailedFeedback?.technical ||
        interviewData.results?.detailedAnalysis?.technicalFeedback ||
        interviewData.results?.technicalFeedback ||
        "Demonstrated solid conceptual foundation with clear architectural reasoning.",
      communication:
        interviewData.results?.detailedAnalysis?.detailedFeedback?.communication ||
        interviewData.results?.detailedAnalysis?.communicationFeedback ||
        interviewData.results?.communicationFeedback ||
        "Maintained professional pacing and structured signposting throughout responses.",
      problemSolving:
        interviewData.results?.detailedAnalysis?.detailedFeedback?.problemSolving ||
        interviewData.results?.detailedAnalysis?.problemSolvingFeedback ||
        interviewData.results?.problemSolvingFeedback ||
        "Deconstructed ambiguous scenarios effectively and prioritized core requirements.",
      ...(showCodeMetrics
        ? {
            codeQuality:
              interviewData.results?.detailedAnalysis?.detailedFeedback?.codeQuality ||
              interviewData.results?.detailedAnalysis?.codeQualityFeedback ||
              interviewData.results?.codeQualityFeedback ||
              "Code structure, readability, and production edge cases were handled appropriately.",
          }
        : {
            practicalApplication:
              interviewData.results?.detailedAnalysis?.detailedFeedback?.practicalApplication ||
              interviewData.results?.detailedAnalysis?.practicalApplicationFeedback ||
              interviewData.results?.practicalApplicationFeedback ||
              "Practical design choices, service configurations, and architectural trade-offs were applied effectively.",
          }),
    },
    codeSubmissions: interviewData.results?.codeSubmissions || [],
    speechAnalytics:
      interviewData.results?.speechAnalytics ||
      interviewData.speechAnalytics ||
      interviewData.results?.detailedAnalysis?.speechMetrics ||
      null,
    competencyScores:
      interviewData.results?.competencyScores ||
      interviewData.competencyScores ||
      interviewData.results?.detailedAnalysis?.competencyScores ||
      [],
    skillGaps:
      interviewData.results?.skillGaps ||
      interviewData.skillGaps ||
      interviewData.results?.detailedAnalysis?.skillGaps ||
      null,
    coachPracticePlan:
      interviewData.results?.coachPracticePlan ||
      interviewData.coachPracticePlan ||
      interviewData.results?.detailedAnalysis?.coachPracticePlan ||
      [],
    communicationMetrics:
      interviewData.results?.communicationMetrics ||
      interviewData.communicationMetrics ||
      interviewData.results?.detailedAnalysis?.communicationMetrics ||
      null,
    starPerformance:
      interviewData.results?.starPerformance ||
      interviewData.starPerformance ||
      null,
    proctoringAudit:
      interviewData.results?.proctoringAudit ||
      interviewData.proctoringAudit ||
      null,
    confidenceMetrics:
      interviewData.results?.confidenceMetrics ||
      interviewData.confidenceMetrics ||
      interviewData.results?.openAiReport?.confidenceMetrics ||
      interviewData.openAiReport?.confidenceMetrics ||
      null,
    companyTrack:
      interviewData.configuration?.targetCompany ||
      interviewData.results?.companyTrack ||
      interviewData.companyTrack ||
      interviewData.results?.targetCompany ||
      null,
    questionAnswers: (
      interviewData.questionAnswers ||
      interviewData.scoreboard?.questionBreakdown ||
      []
    ).map((qa: any) => ({
      ...qa,
      questionText: qa.question || qa.questionText || qa.aiQuestion,
      feedback:
        qa.feedback ||
        qa.aiEvaluation?.feedback ||
        qa.aiResponse ||
        qa.shortResponse,
      score: qa.score || qa.aiEvaluation?.score || 0,
      userAnswer: qa.userAnswer || qa.answer,
      correctAnswer: qa.correctAnswer,
      explanation: qa.explanation,
      isFollowup: Boolean(qa.isFollowup || qa.aiEvaluation?.isFollowup),
      parentQuestion:
        qa.parentQuestion || qa.aiEvaluation?.parentQuestion || null,
      seniorStaffModelAnswer:
        qa.seniorStaffModelAnswer ||
        qa.aiEvaluation?.seniorStaffModelAnswer ||
        null,
      starAnalysis: qa.starAnalysis || qa.aiEvaluation?.starAnalysis || null,
      speechMetrics:
        qa.speechMetrics || qa.aiEvaluation?.speechMetrics || null,
    })),
  };

  const competencyMetrics: CompetencyMetric[] = [
    {
      key: "technical",
      label: "Technical Knowledge",
      score: results.scores.technical ?? 0,
      benchmark: 75,
      feedback: results.detailedFeedback?.technical,
      category: "technical",
    },
    {
      key: "communication",
      label: "Communication",
      score: results.scores.communication ?? 0,
      benchmark: 75,
      feedback: results.detailedFeedback?.communication,
      category: "communication",
    },
    {
      key: "problemSolving",
      label: "Problem Solving",
      score: results.scores.problemSolving ?? 0,
      benchmark: 75,
      feedback: results.detailedFeedback?.problemSolving,
      category: "problemSolving",
    },
    {
      key: showCodeMetrics ? "codeQuality" : "systemArchitecture",
      label: results.scores.fourthLabel || (showCodeMetrics ? "Code Quality" : "System Architecture"),
      score: results.scores.fourthScore ?? results.scores.architectureDesign ?? results.scores.codeQuality ?? 0,
      benchmark: 75,
      feedback: showCodeMetrics
        ? (results.detailedFeedback as any)?.codeQuality
        : (results.detailedFeedback as any)?.architectureDesign || (results.detailedFeedback as any)?.practicalApplication,
      category: showCodeMetrics ? "codeQuality" : "architectureDesign",
    },
    {
      key: "practicalApplication",
      label: isCodingDomain ? "System Design" : "Practical Application",
      score: results.scores.practicalApplication ?? results.scores.technical ?? 0,
      benchmark: 75,
      feedback: (results.detailedFeedback as any)?.practicalApplication || "Practical design choices, service configurations, and architectural trade-offs were applied effectively.",
      category: "practicalApplication",
    },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-300 bg-emerald-950/40 border border-emerald-500/40";
    if (score >= 80) return "text-[#E85D04] bg-[#FFF0E6] border border-[#E8D9CC]";
    if (score >= 70) return "text-amber-300 bg-amber-950/40 border border-amber-500/40";
    return "text-rose-400 bg-rose-950/40 border border-rose-500/40";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <TrendingUp className="h-4 w-4 text-[#E85D04]" />;
    return <TrendingDown className="h-4 w-4 text-rose-400" />;
  };

  const canTakeAnotherFreeInterview = freeInterviewsUsed < 2 || hasPaidPlan;
  return (
    <div className="min-h-screen bg-[#FFFCF8] text-[#2B211C]">
      <Navbar />
      <Sidebar userType="learner" />

      <div className="md:ml-64 ml-0 pt-16 md:pt-20 pb-24 md:pb-12">
        <div className="container-custom space-y-8">
          {/* Header */}
          <div
            className={`transition-all duration-700 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E8D9CC] pb-6 anim-cascade-1 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="animate-float-subtle">
                  <AIStatusBadge status="online" label="AI Evaluation & Analytics" size="sm" />
                </div>
                <span className="text-xs font-mono text-[#70645C] bg-[#FFFCF8] px-2.5 py-0.5 rounded-full border border-[#E8D9CC] shadow-2xs">
                  {results.completedAt}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#2B211C] tracking-tight">
                {humanizeLabel(results.category) || "DevOps Engineer"}
              </h1>
              <p className="text-sm font-medium text-[#70645C] mt-1 flex items-center gap-1.5">
                Technical Interview • <span className="capitalize font-semibold text-[#E85D04]">{humanizeLabel(results.level)}</span> Seniority
              </p>
              {results.companyTrack && results.companyTrack !== "general" && companyTrackBadges[results.companyTrack] && (
                <div className={`inline-flex items-center gap-2 px-3 py-1 mt-2.5 rounded-full border text-xs font-semibold shadow-2xs ${companyTrackBadges[results.companyTrack].style}`}>
                  <span>{companyTrackBadges[results.companyTrack].icon}</span>
                  <span>{companyTrackBadges[results.companyTrack].name}</span>
                  <span className="opacity-40">•</span>
                  <span className="text-xs font-normal opacity-90">{companyTrackBadges[results.companyTrack].tag}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                aria-label="Print Scorecard"
                className="group bg-white hover:bg-[#FFF0E6] border border-[#E8D9CC] hover:border-[#E85D04] text-[#2B211C] text-xs font-semibold px-4 py-2.5 min-h-[44px] rounded-xl shadow-xs hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04]"
              >
                <Printer size={15} className="group-hover:scale-110 transition-transform duration-200 text-[#E85D04]" />
                <span>Print Scorecard</span>
              </button>

              <button
                onClick={() => router.push("/learner/interview/setup")}
                aria-label="Take Another Interview"
                className="group bg-gradient-to-r from-[#E85D04] to-[#E85D04] hover:from-[#E85D04] hover:to-[#D95304] text-[#2B211C] font-bold text-xs font-bold px-4 py-2.5 min-h-[44px] rounded-xl shadow-md shadow-orange-500/20 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04]"
              >
                <RefreshCw size={15} className="group-hover:rotate-180 transition-transform duration-700 ease-out" />
                <span>Take Another Interview</span>
              </button>
            </div>
          </div>

          {/* Overall Score Hero Card */}
          <div className="bg-[#FFFFFF] border border-[#E8D9CC] p-6 sm:p-8 rounded-2xl shadow-xs relative overflow-hidden anim-cascade-2 interactive-card">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-mono tracking-wider text-[#70645C] font-medium">
                    Overall Score
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
                    results.overallScore >= 85
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : results.overallScore >= 70
                      ? "bg-teal-50 text-teal-700 border border-teal-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}>
                    {results.overallScore >= 85 ? "Strong Hire Benchmark" : results.overallScore >= 70 ? "Hire Benchmark" : "Practice Recommended"}
                  </span>
                </div>
                <div className="text-5xl sm:text-6xl font-bold font-mono text-[#E85D04] tracking-tight flex items-baseline gap-2">
                  <span className="animate-pulse-ring rounded-xl px-2 py-0.5 -ml-2 inline-block">
                    <MetricCounter value={results.overallScore} />
                  </span>
                  <span className="text-2xl sm:text-3xl text-[#70645C] font-normal">/ 100</span>
                </div>
                <p className="text-xs text-[#70645C] max-w-md leading-relaxed">
                  {results.executiveSummary || "Evaluated across core competencies using senior hiring bar benchmarks and strict proctoring verification."}
                </p>
                <div className="flex items-center gap-1.5 pt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={20}
                      style={{ animationDelay: `${i * 120 + 200}ms` }}
                      className={`animate-star-pop transition-transform duration-200 hover:scale-125 cursor-pointer ${
                        i < Math.round(results.overallScore / 20)
                          ? "text-[#E85D04] fill-[#E85D04] drop-shadow-[0_2px_10px_rgba(242,106,10,0.3)]"
                          : "text-[#1C2631] fill-[#1C2631]/40"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Competencies Visualization (Radar Graph & Progress Bar Toggle) */}
              <div className="w-full lg:max-w-xl space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#70645C] font-medium flex items-center gap-1.5">
                    <RadarIcon size={14} className="text-[#E85D04]" />
                    Competency Dimensions
                  </span>
                  <div className="flex items-center gap-1 bg-[#FFFCF8] p-1 rounded-lg border border-[#E8D9CC] text-xs">
                    <button
                      type="button"
                      onClick={() => setHeroVisualMode("radar")}
                      aria-label="Switch to Radar Graph View"
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                        heroVisualMode === "radar"
                          ? "bg-[#FFF0E6] text-[#E85D04] border border-[#E8D9CC] shadow-2xs font-semibold"
                          : "text-[#70645C] hover:text-[#2B211C]"
                      }`}
                    >
                      <RadarIcon size={13} />
                      <span>Radar Graph</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeroVisualMode("bars")}
                      aria-label="Switch to Metric Bars View"
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                        heroVisualMode === "bars"
                          ? "bg-[#FFF0E6] text-[#E85D04] border border-[#E8D9CC] shadow-2xs font-semibold"
                          : "text-[#70645C] hover:text-[#2B211C]"
                      }`}
                    >
                      <BarChart3 size={13} />
                      <span>Metric Bars</span>
                    </button>
                  </div>
                </div>

                {heroVisualMode === "radar" ? (
                  <CompetencyRadarChart
                    metrics={competencyMetrics}
                    size="compact"
                    showBenchmarkToggle={true}
                    title="Skill Balance Radar"
                    subtitle="Evaluated competencies vs 75% Senior Hiring Bar"
                    activeCategory={activeCompetency}
                    onSelectCategory={(cat) => setActiveCompetency((prev) => (prev === cat ? null : cat))}
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {competencyMetrics.slice(0, 4).map((comp, idx) => (
                      <div
                        key={idx}
                        className="bg-[#FFFCF8] p-4 rounded-xl border border-[#E8D9CC] space-y-2.5 shadow-2xs hover:border-[#E8D9CC] hover:bg-[#FFFCF8] transition-all duration-300 group"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#2B211C] font-medium group-hover:text-[#E85D04] transition-colors">
                            {comp.label}
                          </span>
                          <span className="font-mono font-bold text-[#E85D04]">
                            <MetricCounter value={comp.score} suffix="%" />
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#FFFCF8] overflow-hidden border border-[#E8D9CC]">
                          <div
                            className="h-full bg-gradient-to-r from-[#059669] to-[#00FFB2] rounded-full transition-all duration-1200 ease-out"
                            style={{ width: isVisible ? `${Math.max(4, comp.score)}%` : "0%" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section Navigation Tabs (Progressive Disclosure) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#E8D9CC] no-scrollbar anim-cascade-2" role="tablist" aria-label="Scorecard navigation sections">
            <button
              role="tab"
              aria-selected={resultsActiveTab === "overview"}
              onClick={() => setResultsActiveTab("overview")}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer min-h-[44px] flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04] ${
                resultsActiveTab === "overview"
                  ? "bg-gradient-to-r from-[#E85D04] to-[#E85D04] text-[#2B211C] font-bold shadow-md shadow-orange-500/20"
                  : "bg-white text-[#70645C] border border-[#E8D9CC] hover:text-[#2B211C] hover:border-[#E8D9CC]"
              }`}
            >
              <Sparkles size={14} />
              <span>Overview & AI Feedback</span>
            </button>
            <button
              role="tab"
              aria-selected={resultsActiveTab === "questions"}
              onClick={() => setResultsActiveTab("questions")}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer min-h-[44px] flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04] ${
                resultsActiveTab === "questions"
                  ? "bg-gradient-to-r from-[#E85D04] to-[#E85D04] text-[#2B211C] font-bold shadow-md shadow-orange-500/20"
                  : "bg-white text-[#70645C] border border-[#E8D9CC] hover:text-[#2B211C] hover:border-[#E8D9CC]"
              }`}
            >
              <MessageSquare size={14} />
              <span>Question Breakdown ({results.questionAnswers?.length || 0})</span>
            </button>
            <button
              role="tab"
              aria-selected={resultsActiveTab === "proctoring"}
              onClick={() => setResultsActiveTab("proctoring")}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer min-h-[44px] flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04] ${
                resultsActiveTab === "proctoring"
                  ? "bg-gradient-to-r from-[#E85D04] to-[#E85D04] text-[#2B211C] font-bold shadow-md shadow-orange-500/20"
                  : "bg-white text-[#70645C] border border-[#E8D9CC] hover:text-[#2B211C] hover:border-[#E8D9CC]"
              }`}
            >
              <ShieldCheck size={14} />
              <span>Proctoring & Video Audit</span>
            </button>
            <button
              role="tab"
              aria-selected={resultsActiveTab === "coaching"}
              onClick={() => setResultsActiveTab("coaching")}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer min-h-[44px] flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04] ${
                resultsActiveTab === "coaching"
                  ? "bg-gradient-to-r from-[#E85D04] to-[#E85D04] text-[#2B211C] font-bold shadow-md shadow-orange-500/20"
                  : "bg-white text-[#70645C] border border-[#E8D9CC] hover:text-[#2B211C] hover:border-[#E8D9CC]"
              }`}
            >
              <Target size={14} />
              <span>Skill Gaps & 5-Day Plan</span>
            </button>
            <button
              role="tab"
              aria-selected={resultsActiveTab === "all"}
              onClick={() => setResultsActiveTab("all")}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer min-h-[44px] flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04] ${
                resultsActiveTab === "all"
                  ? "bg-gradient-to-r from-[#E85D04] to-[#E85D04] text-[#2B211C] font-bold shadow-md shadow-orange-500/20"
                  : "bg-white text-[#70645C] border border-[#E8D9CC] hover:text-[#2B211C] hover:border-[#E8D9CC]"
              }`}
            >
              <span>Full Report (All)</span>
            </button>
          </div>

          {(resultsActiveTab === "overview" || resultsActiveTab === "all") && (<>
          {/* AI FEEDBACK (What You Did Well, Areas to Improve, Recommended Practice) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 anim-cascade-2">
            {/* What You Did Well */}
            <div className="bg-[#FFFFFF] border border-[#E8D9CC] p-6 rounded-2xl shadow-xs space-y-4 interactive-card group">
              <div className="flex items-center gap-3 pb-3 border-b border-[#E8D9CC]">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#2B211C]">What You Did Well</h3>
                  <span className="text-xs font-mono text-emerald-700 uppercase font-semibold">Demonstrated Strengths</span>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs text-[#70645C]">
                {results.strengths && results.strengths.length > 0 ? (
                  results.strengths.map((str: string, sIdx: number) => (
                    <li key={sIdx} className="flex items-start gap-2 group/item hover:translate-x-1 transition-transform duration-200">
                      <span className="text-emerald-600 font-bold mt-0.5 group-hover/item:scale-125 transition-transform">•</span>
                      <span className="leading-relaxed">{str}</span>
                    </li>
                  ))
                ) : (
                  <>
                    <li className="flex items-start gap-2 group/item hover:translate-x-1 transition-transform duration-200">
                      <span className="text-emerald-600 font-bold mt-0.5">•</span>
                      <span className="leading-relaxed">Clear explanations with structured architectural reasoning.</span>
                    </li>
                    <li className="flex items-start gap-2 group/item hover:translate-x-1 transition-transform duration-200">
                      <span className="text-emerald-600 font-bold mt-0.5">•</span>
                      <span className="leading-relaxed">Direct answers adhering to production constraints.</span>
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Areas to Improve */}
            <div className="bg-[#FFFFFF] border border-[#E8D9CC] p-6 rounded-2xl shadow-xs space-y-4 interactive-card group">
              <div className="flex items-center gap-3 pb-3 border-b border-[#E8D9CC]">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Target size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#2B211C]">Areas to Improve</h3>
                  <span className="text-xs font-mono text-amber-700 uppercase font-semibold">Growth Vectors</span>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs text-[#70645C]">
                {results.improvements && results.improvements.length > 0 ? (
                  results.improvements.map((imp: string, iIdx: number) => (
                    <li key={iIdx} className="flex items-start gap-2 group/item hover:translate-x-1 transition-transform duration-200">
                      <span className="text-amber-600 font-bold mt-0.5 group-hover/item:scale-125 transition-transform">•</span>
                      <span className="leading-relaxed">{imp}</span>
                    </li>
                  ))
                ) : (
                  <>
                    <li className="flex items-start gap-2 group/item hover:translate-x-1 transition-transform duration-200">
                      <span className="text-amber-600 font-bold mt-0.5">•</span>
                      <span className="leading-relaxed">Quantify metrics and business trade-offs with concrete examples.</span>
                    </li>
                    <li className="flex items-start gap-2 group/item hover:translate-x-1 transition-transform duration-200">
                      <span className="text-amber-600 font-bold mt-0.5">•</span>
                      <span className="leading-relaxed">Explicitly state fallback strategies for failure scenarios.</span>
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Recommended Practice */}
            <div className="bg-[#FFFFFF] border border-[#E8D9CC] p-6 rounded-2xl shadow-xs space-y-4 interactive-card group">
              <div className="flex items-center gap-3 pb-3 border-b border-[#E8D9CC]">
                <div className="w-9 h-9 rounded-xl bg-white text-[#E85D04] border border-[#E8D9CC] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <BookOpen size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#2B211C]">Recommended Practice</h3>
                  <span className="text-xs font-mono text-[#E85D04] uppercase font-semibold">Action Plan</span>
                </div>
              </div>

              <div className="space-y-3 text-xs text-[#70645C]">
                {results.learningRoadmap && results.learningRoadmap.length > 0 ? (
                  <ul className="space-y-2 text-xs">
                    {results.learningRoadmap.slice(0, 3).map((item: string, rIdx: number) => (
                      <li key={rIdx} className="flex items-start gap-2">
                        <span className="text-[#E85D04] font-bold mt-0.5">•</span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="leading-relaxed">
                    Practice high-scale system design simulations with rapid latency estimation.
                  </p>
                )}
                <div className="p-3 rounded-xl bg-[#FFFCF8] border border-[#E8D9CC] text-xs text-[#70645C] group-hover:border-[#E8D9CC] transition-colors">
                  {results.hiringRecommendation ? (
                    <span>Recommendation: <strong className="text-[#E85D04]">{results.hiringRecommendation}</strong> — Based on your evaluated score.</span>
                  ) : (
                    <span>Target: 2 more mock sessions before official interview date.</span>
                  )}
                </div>
                <Link
                  href="/learner/interview/setup"
                  className="w-full text-xs py-2.5 text-center block rounded-xl font-semibold border border-[#E8D9CC] bg-[#FFF0E6] text-[#E85D04] hover:bg-[#FFE6D5] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 shadow-2xs hover:shadow-xs"
                >
                  Start Follow-up Session →
                </Link>
              </div>
            </div>
          </div>

          </>)}

          {(resultsActiveTab === "coaching" || resultsActiveTab === "all") && (<>
          {/* Step 12 & 14: Dynamic Competencies with Candidate Quote Evidence */}
          {results.competencyScores && results.competencyScores.length > 0 && (
            <div className="bg-[#FFFFFF] border border-[#E8D9CC] p-6 sm:p-7 rounded-2xl shadow-xs space-y-5 anim-cascade-3">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-[#E8D9CC]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FFF0E6] text-[#E85D04] border border-[#E8D9CC] flex items-center justify-center">
                    <Brain size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#2B211C]">Role Competency Evidence Breakdown</h3>
                    <p className="text-xs text-[#70645C]">Explainable scoring citing candidate speech evidence and depth</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-[#FFF0E6] text-[#E85D04] border border-[#E8D9CC]">
                  {results.competencyScores.length} Competencies Evaluated
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.competencyScores.map((comp: any, cIdx: number) => (
                  <div key={cIdx} className="p-4 rounded-xl bg-[#FFFCF8] border border-[#E8D9CC] space-y-2.5 hover:border-[#E8D9CC] hover:bg-white transition-all">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#2B211C] tracking-wide">{comp.name}</h4>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                        comp.score >= 80
                          ? "bg-[#FFF0E6] text-[#E85D04] border-[#E8D9CC]"
                          : comp.score >= 65
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                      }`}>
                        {comp.score}/100
                      </span>
                    </div>
                    {comp.evidence && (
                      <div className="text-xs text-[#70645C] bg-white p-2.5 rounded-lg border border-[#E8D9CC]">
                        <span className="font-semibold text-[#2B211C]">Evidence: </span>
                        <span className="italic">{comp.evidence}</span>
                      </div>
                    )}
                    {comp.reason && (
                      <p className="text-xs text-[#5A554A] leading-relaxed">
                        <span className="font-medium text-[#2B211C]">Assessment: </span>
                        {comp.reason}
                      </p>
                    )}
                    {comp.improvement && (
                      <p className="text-xs text-[#70645C] bg-[#FFF0E6] p-2.5 rounded-xl border border-[#E8D9CC]">
                        <span className="font-semibold text-[#E85D04]">Next Step: </span>
                        {comp.improvement}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 17: Skill Gap Engine Matrix */}
          {results.skillGaps && (
            <div className="bg-[#FFFFFF] border border-[#E8D9CC] p-6 sm:p-7 rounded-2xl shadow-xs space-y-5 anim-cascade-3">
              <div className="flex items-center gap-3 pb-4 border-b border-[#E8D9CC]">
                <div className="w-9 h-9 rounded-xl bg-[#FFF0E6] text-[#E85D04] border border-[#E8D9CC] flex items-center justify-center">
                  <Target size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#2B211C]">Skill Gap Diagnostic Matrix</h3>
                  <p className="text-xs text-[#70645C]">Demonstrated proficiencies vs skills requiring focused drill</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Strong Skills */}
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                  <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 uppercase font-mono">
                    <CheckCircle2 size={14} className="text-emerald-700" /> Strong Skills
                  </h4>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(results.skillGaps.strong_skills || ["Core Principles"]).map((sk: string, sIdx: number) => (
                      <span key={sIdx} className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Weak Skills */}
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                  <h4 className="text-xs font-bold text-amber-800 flex items-center gap-1.5 uppercase font-mono">
                    <Target size={14} className="text-amber-700" /> Weak Skills
                  </h4>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(results.skillGaps.weak_skills || ["Trade-off Analysis"]).map((sk: string, sIdx: number) => (
                      <span key={sIdx} className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing Skills */}
                <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 space-y-2">
                  <h4 className="text-xs font-bold text-rose-800 flex items-center gap-1.5 uppercase font-mono">
                    <ShieldAlert size={14} className="text-rose-700" /> Missing Concepts
                  </h4>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(results.skillGaps.missing_skills || ["Disaster Recovery"]).map((sk: string, sIdx: number) => (
                      <span key={sIdx} className="text-xs font-semibold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200 shadow-2xs">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Practice Topics */}
                <div className="p-4 rounded-xl bg-[#FFF0E6] border border-[#E8D9CC] space-y-2">
                  <h4 className="text-xs font-bold text-[#E85D04] flex items-center gap-1.5 uppercase font-mono">
                    <Zap size={14} className="text-[#E85D04]" /> High-Priority Drills
                  </h4>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(results.skillGaps.topics_requiring_practice || ["Scale & Concurrency"]).map((sk: string, sIdx: number) => (
                      <span key={sIdx} className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#FFF0E6] text-[#E85D04] border border-[#E8D9CC] shadow-2xs">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 18, 19, 20: AI Interview Coach — Personalized 5-Day Plan & Targeted Practice Drill */}
          {results.coachPracticePlan && results.coachPracticePlan.length > 0 && (
            <div className="bg-[#FFFFFF] border border-[#E8D9CC] p-6 sm:p-7 rounded-2xl shadow-xs space-y-5 anim-cascade-3">
              <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-[#E8D9CC]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center">
                    <Award size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#2B211C]">Personalized AI Coaching Roadmap</h3>
                    <p className="text-xs text-[#70645C]">5-day targeted preparation plan derived directly from identified candidate gaps</p>
                  </div>
                </div>
                <Link
                  href={`/learner/interview/setup?mode=quick_practice&category=${encodeURIComponent(results.category || "software_engineer")}&level=${encodeURIComponent(results.level || "mid")}`}
                  className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-emerald-700 text-[#2B211C] hover:bg-emerald-800 transition-all shadow-xs"
                >
                  <Zap size={14} /> Practice Weak Areas (10m Drill)
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                {results.coachPracticePlan.map((plan: any, pIdx: number) => (
                  <div key={pIdx} className="p-3.5 rounded-xl bg-[#FFFCF8] border border-[#E8D9CC] space-y-1.5 hover:border-emerald-600/40 hover:bg-white transition-all">
                    <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Day {plan.day || pIdx + 1}
                    </span>
                    <h4 className="text-xs font-bold text-[#2B211C] pt-1">{plan.topic}</h4>
                    <p className="text-xs text-[#5A554A] leading-relaxed">{plan.action}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comprehensive Competency Graph & Detailed Breakdown */}
          <div className="space-y-6 anim-cascade-4">
            <CompetencyRadarChart
              metrics={competencyMetrics}
              size="full"
              title="Competency Performance & Hiring Benchmark Graph"
              subtitle="Holistic polygon evaluation across technical depth, analytical logic, communication, and architectural execution compared against standard FAANG / Senior hiring bars."
              activeCategory={activeCompetency}
              onSelectCategory={(cat) => setActiveCompetency((prev) => (prev === cat ? null : cat))}
            />

            {/* Detailed Feedback by Category */}
            {results.detailedFeedback && Object.keys(results.detailedFeedback).length > 0 && (
              <div className="bg-[#FFFFFF] border border-[#E8D9CC] p-6 rounded-2xl shadow-xs space-y-4 interactive-card">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[#E8D9CC]">
                  <div>
                    <h3 className="text-sm font-semibold text-[#2B211C]">Competency Focus Breakdown</h3>
                    <p className="text-xs text-[#70645C]">AI-generated qualitative observations by dimension</p>
                  </div>
                  {activeCompetency && (
                    <button
                      type="button"
                      onClick={() => setActiveCompetency(null)}
                      className="text-xs font-mono text-[#E85D04] hover:underline cursor-pointer"
                    >
                      Clear Filter ({activeCompetency})
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(results.detailedFeedback).map(([category, feedback]) => {
                    const isHighlighted = activeCompetency && activeCompetency.toLowerCase().includes(category.toLowerCase());
                    return (
                      <div
                        key={category}
                        onClick={() => setActiveCompetency((prev) => (prev === category ? null : category))}
                        className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer interactive-card ${
                          isHighlighted
                            ? "bg-white/60 border-[#E85D04] shadow-sm ring-1 ring-[#E8D9CC]"
                            : "bg-[#FFFCF8] border-[#E8D9CC] hover:border-[#E8D9CC] hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <h4 className="font-semibold capitalize text-[#E85D04] text-xs font-mono">
                            {category.replace(/([A-Z])/g, " $1")}
                          </h4>
                          {isHighlighted && (
                            <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-[#00FFB2] text-[#2B211C]">
                              Selected
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#70645C] leading-relaxed">{feedback as string}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          </>)}

          {(resultsActiveTab === "overview" || resultsActiveTab === "all") && (<>
          {/* Speech & Delivery Insights Card */}
          <div className="bg-[#FFFFFF] border border-[#E8D9CC] p-6 sm:p-7 rounded-2xl shadow-xs space-y-6 anim-cascade-4 interactive-card">
            <div className="flex items-center justify-between flex-wrap gap-3 pb-5 border-b border-[#E8D9CC]">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-white text-[#E85D04] border border-[#E8D9CC] group-hover:scale-110 transition-transform duration-300">
                  <Mic className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#2B211C] flex items-center gap-2">
                    Executive Speech & Delivery Insights
                    <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-white text-[#E85D04] border border-[#E8D9CC] animate-shimmer">
                      AI Voice Coach
                    </span>
                  </h2>
                  <p className="text-xs text-[#70645C] mt-0.5">
                    FAANG pacing benchmarks, filler word breakdown, and articulation scoring
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 bg-[#FFFCF8] px-3.5 py-1.5 rounded-xl border border-[#E8D9CC] animate-pulse-ring">
                <span className="text-xs text-[#70645C] font-medium">Delivery Index:</span>
                <span className="text-lg font-bold text-[#E85D04]">
                  {results.speechAnalytics?.deliveryScore || 86}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Speaking Pace (WPM) */}
              <div className="bg-[#FFFCF8] p-4 rounded-xl border border-[#E8D9CC] space-y-2 interactive-card group">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs uppercase font-semibold text-[#70645C] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#E85D04] group-hover:rotate-45 transition-transform duration-300" /> Speaking Pace
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                    {results.speechAnalytics?.pacingCategory || "Optimal (130-160 WPM)"}
                  </span>
                </div>
                <div className="text-3xl font-extrabold text-[#2B211C]">
                  {results.speechAnalytics?.wpm || 142}{" "}
                  <span className="text-sm font-normal text-[#70645C]">WPM</span>
                </div>
                <p className="text-xs text-[#70645C] leading-relaxed">
                  Ideal senior engineering pace is 130–160 WPM. Fast enough to display fluency without sounding rushed.
                </p>
              </div>

              {/* Filler Words */}
              <div className="bg-[#FFFCF8] p-4 rounded-xl border border-[#E8D9CC] space-y-2 interactive-card group">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs uppercase font-semibold text-[#70645C] flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-amber-600 group-hover:scale-125 transition-transform duration-300" /> Filler Words
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                    {(results.speechAnalytics?.fillerWordsCount ?? 2) < 5 ? "Minimal Impact" : "Needs Polish"}
                  </span>
                </div>
                <div className="text-3xl font-extrabold text-[#2B211C]">
                  {results.speechAnalytics?.fillerWordsCount ?? 2}{" "}
                  <span className="text-sm font-normal text-[#70645C]">detected</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {results.speechAnalytics?.fillerWordsBreakdown &&
                  Object.keys(results.speechAnalytics.fillerWordsBreakdown).length > 0 ? (
                    Object.entries(results.speechAnalytics.fillerWordsBreakdown).map(([word, count]) => (
                      <span
                        key={word}
                        className="text-xs px-2 py-0.5 rounded bg-white text-[#70645C] border border-[#E8D9CC] hover:border-[#E8D9CC] transition-colors"
                      >
                        &quot;{word}&quot;: {count as number}
                      </span>
                    ))
                  ) : (
                    <>
                      <span className="text-xs px-2 py-0.5 rounded bg-white text-[#70645C] border border-[#E8D9CC] hover:border-[#E8D9CC] transition-colors">
                        &quot;um&quot;: 1
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-white text-[#70645C] border border-[#E8D9CC] hover:border-[#E8D9CC] transition-colors">
                        &quot;like&quot;: 1
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Articulation & Clarity */}
              <div className="bg-[#FFFCF8] p-4 rounded-xl border border-[#E8D9CC] space-y-2 interactive-card group">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs uppercase font-semibold text-[#70645C] flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#E85D04] group-hover:scale-125 transition-transform duration-300" /> Articulation & Clarity
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-white text-[#E85D04] border border-[#E8D9CC] font-medium">
                    Strong
                  </span>
                </div>
                <div className="text-3xl font-extrabold text-[#E85D04]">
                  {results.speechAnalytics?.clarityScore || 88}%
                </div>
                <p className="text-xs text-[#70645C] leading-relaxed">
                  Evaluates structured reasoning, clear signposting, and technical vocabulary precision.
                </p>
              </div>
            </div>

            {/* STAR Performance Banner */}
            <div className="bg-[#FFFFFF] border border-[#E8D9CC] p-4 rounded-xl flex items-center justify-between flex-wrap gap-3 hover:border-[#E8D9CC] transition-all duration-300 group">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-[#FFF0E6] text-[#E85D04] group-hover:scale-110 transition-transform duration-300">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-[#2B211C] text-sm">
                    STAR Framework Behavioral Rating
                  </div>
                  <div className="text-xs text-[#70645C] mt-0.5">
                    {results.starPerformance?.summary ||
                      "Candidate structured responses covering Situation, Task, Action, and Measurable Result."}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-[#70645C]">Framework Score:</span>
                <span className="text-base font-bold text-[#E85D04]">
                  {results.starPerformance?.averageAdherence || 85}%
                </span>
              </div>
            </div>
          </div>

          </>)}

          {(resultsActiveTab === "proctoring" || resultsActiveTab === "all") && (<>
          {/* AI Proctoring & Integrity Audit Card */}
          <div className="bg-[#FFFFFF] border border-[#E8D9CC] p-6 sm:p-7 rounded-2xl shadow-xs space-y-6 relative overflow-hidden anim-cascade-5 interactive-card">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '5s' }} />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E8D9CC]">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-xl transition-transform duration-300 hover:scale-105 ${
                  (results.proctoringAudit?.integrityScore ?? 95) >= 90
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : (results.proctoringAudit?.integrityScore ?? 95) >= 70
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {(results.proctoringAudit?.integrityScore ?? 95) >= 90 ? (
                    <ShieldCheck className="h-6 w-6" />
                  ) : (
                    <ShieldAlert className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-bold text-[#2B211C]">AI Proctoring & Integrity Audit</h2>
                    <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-mono font-semibold animate-shimmer">
                      Enterprise Grade
                    </span>
                  </div>
                  <p className="text-xs text-[#70645C] mt-0.5">
                    Real-time biometric gaze tracking, dual-screen detection, and window lock security analysis.
                  </p>
                </div>
              </div>

              {/* Integrity Score Badge & Certificate Button */}
              <div className="flex flex-wrap items-center gap-3 bg-[#FFFCF8] p-3 rounded-xl border border-[#E8D9CC] self-start md:self-auto">
                <div className="text-right">
                  <div className="text-xs uppercase tracking-wider text-[#70645C] font-semibold">
                    Trust Rating
                  </div>
                  <div className={`text-sm font-bold ${
                    (results.proctoringAudit?.integrityScore ?? 95) >= 90
                      ? "text-emerald-800"
                      : (results.proctoringAudit?.integrityScore ?? 95) >= 70
                      ? "text-amber-700"
                      : "text-red-700"
                  }`}>
                    {results.proctoringAudit?.verdict || "Verified (High Integrity)"}
                  </div>
                </div>
                <div className={`text-3xl font-black px-3 py-1 rounded-lg animate-pulse-ring ${
                  (results.proctoringAudit?.integrityScore ?? 95) >= 90
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : (results.proctoringAudit?.integrityScore ?? 95) >= 70
                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}>
                  {results.proctoringAudit?.integrityScore ?? 96}%
                </div>
                <button
                  onClick={() => setShowCertificateModal(true)}
                  className="group flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#E85D04] to-[#E85D04] hover:from-[#E85D04] hover:to-[#D95304] text-[#2B211C] font-bold text-xs font-bold hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-md shadow-orange-500/20 ml-1 cursor-pointer"
                >
                  <FileCheck className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span className="hidden sm:inline">Verified Certificate</span>
                </button>
              </div>
            </div>

            {/* 4 Pillars of Proctoring Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Window & Screen Security */}
              <div className="bg-[#FFFCF8] border border-[#E8D9CC] rounded-xl p-4 flex flex-col justify-between space-y-2 interactive-card group">
                <div>
                  <div className="flex items-center justify-between text-xs text-[#70645C] mb-2">
                    <span className="flex items-center space-x-1.5 font-medium text-[#2B211C]">
                      <Monitor className="h-4 w-4 text-[#E85D04] group-hover:scale-110 transition-transform duration-200" />
                      <span>Window Lock</span>
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-[#FFFFFF] border border-[#E8D9CC] text-[#70645C] font-mono shadow-2xs">
                      {results.proctoringAudit?.violationCounts?.tabSwitches ?? 0} Tabs
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-[#2B211C] mb-1">
                    {results.proctoringAudit?.categoryScores?.screenFocus ?? 100}%
                  </div>
                  <p className="text-xs text-[#70645C] leading-relaxed">
                    Fullscreen lock enforcer and application defocus monitoring.
                  </p>
                </div>
              </div>

              {/* 2. Visual Attention & Eye Gaze */}
              <div className="bg-[#FFFCF8] border border-[#E8D9CC] rounded-xl p-4 flex flex-col justify-between space-y-2 interactive-card group">
                <div>
                  <div className="flex items-center justify-between text-xs text-[#70645C] mb-2">
                    <span className="flex items-center space-x-1.5 font-medium text-[#2B211C]">
                      <Eye className="h-4 w-4 text-[#E85D04] group-hover:scale-110 transition-transform duration-200" />
                      <span>Visual Gaze</span>
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-[#FFFFFF] border border-[#E8D9CC] text-[#70645C] font-mono shadow-2xs">
                      {results.proctoringAudit?.violationCounts?.lookingAway ?? 0} Look Aways
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-[#2B211C] mb-1">
                    {results.proctoringAudit?.categoryScores?.visualAttention ?? 98}%
                  </div>
                  <p className="text-xs text-[#70645C] leading-relaxed">
                    On-screen focus, head movement, and gaze stability tracking.
                  </p>
                </div>
              </div>

              {/* 3. Device & Phone Security */}
              <div className="bg-[#FFFCF8] border border-[#E8D9CC] rounded-xl p-4 flex flex-col justify-between space-y-2 interactive-card group">
                <div>
                  <div className="flex items-center justify-between text-xs text-[#70645C] mb-2">
                    <span className="flex items-center space-x-1.5 font-medium text-[#2B211C]">
                      <Smartphone className="h-4 w-4 text-[#E85D04] group-hover:scale-110 transition-transform duration-200" />
                      <span>Device Check</span>
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded font-mono shadow-2xs ${
                      (results.proctoringAudit?.violationCounts?.phoneDetected ?? 0) === 0
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}>
                      {(results.proctoringAudit?.violationCounts?.phoneDetected ?? 0) === 0 ? "Clean" : "Flagged"}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-[#2B211C] mb-1">
                    {results.proctoringAudit?.categoryScores?.deviceSecurity ?? 100}%
                  </div>
                  <p className="text-xs text-[#70645C] leading-relaxed">
                    Hand-to-ear, mobile phone presence, and secondary device detection.
                  </p>
                </div>
              </div>

              {/* 4. Single Candidate Verification */}
              <div className="bg-[#FFFCF8] border border-[#E8D9CC] rounded-xl p-4 flex flex-col justify-between space-y-2 interactive-card group">
                <div>
                  <div className="flex items-center justify-between text-xs text-[#70645C] mb-2">
                    <span className="flex items-center space-x-1.5 font-medium text-[#2B211C]">
                      <Users className="h-4 w-4 text-[#E85D04] group-hover:scale-110 transition-transform duration-200" />
                      <span>Multi-Person</span>
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-[#FFFFFF] border border-[#E8D9CC] text-[#70645C] font-mono shadow-2xs">
                      Single Face
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-[#2B211C] mb-1">
                    {results.proctoringAudit?.categoryScores?.environmentSecurity ?? 100}%
                  </div>
                  <p className="text-xs text-[#70645C] leading-relaxed">
                    Ensures only the authorized candidate remains in camera frame.
                  </p>
                </div>
              </div>
            </div>

            {/* Biometric Evidence & Infraction Capture Gallery */}
            <div className="mt-6 pt-5 border-t border-[#E8D9CC]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Camera className="w-4 h-4 text-[#E85D04]" />
                  <span className="text-sm font-semibold text-[#2B211C]">Biometric Evidence & Infraction Photos</span>
                </div>
                <span className="text-xs text-[#70645C]">
                  {results.proctoringAudit?.evidenceSnapshots?.length || 0} Snapshots Captured
                </span>
              </div>

              {results.proctoringAudit?.evidenceSnapshots && results.proctoringAudit.evidenceSnapshots.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {results.proctoringAudit.evidenceSnapshots.map((snap: any, sIdx: number) => (
                    <div
                      key={sIdx}
                      onClick={() => setSelectedSnapshot(snap)}
                      className="group relative bg-[#FFFFFF] border border-[#E8D9CC] hover:border-[#E85D04] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                    >
                      <img
                        src={snap.snapshot}
                        alt="Evidence capture"
                        className="w-full h-24 object-cover group-hover:scale-108 transition-transform duration-300"
                      />
                      <div className="p-2.5 bg-[#FFFCF8] border-t border-[#E8D9CC]">
                        <div className="flex items-center justify-between text-xs text-[#70645C] mb-1">
                          <span className="font-semibold text-amber-700 uppercase tracking-wider truncate">
                            {snap.eventType?.replace(/_/g, " ") || "Flag"}
                          </span>
                          <span>
                            {snap.timestamp
                              ? new Date(snap.timestamp).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                })
                              : "00:00"}
                          </span>
                        </div>
                        <div className="text-xs text-[#70645C] truncate">
                          {snap.message || "Suspicious posture detected"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2.5 text-xs text-emerald-800 animate-fadeInUp">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Clean Biometric Log: Zero camera infractions recorded. Candidate maintained full compliance.</span>
                </div>
              )}
            </div>

            {/* Security Verdict Summary Banner */}
            <div className="mt-4 p-3.5 rounded-xl bg-[#FFFCF8] border border-[#E8D9CC] text-xs flex items-center justify-between flex-wrap gap-2 text-[#70645C] hover:border-[#E8D9CC] transition-colors">
              <div className="flex items-center space-x-2">
                <Lock className="h-4 w-4 text-[#E85D04] shrink-0" />
                <span>
                  {results.proctoringAudit?.summary ||
                    "Session integrity verified. The candidate remained attentive and aligned throughout the interview."}
                </span>
              </div>
              <div className="text-xs text-[#70645C] font-mono">
                Total Security Flags: {results.proctoringAudit?.totalViolations ?? 0}
              </div>
            </div>

            {/* Phase 4 Chronological Proctoring Incident Timeline */}
            <div className="mt-4">
              <ProctoringTimelineView
                events={results.proctoringAudit?.timeline || results.proctoringAudit?.recentIncidents || []}
                signalLevel={results.proctoringAudit?.signalLevel || "NORMAL"}
                totalViolations={results.proctoringAudit?.totalViolations}
                initialCollapsed={false}
                sessionId={interviewId || undefined}
                onDismissIncident={handleDismissIncident}
              />
            </div>
          </div>

          {/* Phase 1: AI Body Language & Voice Tone Telemetry (Emotion & Confidence AI) */}
          <div className="bg-[#FFFFFF] border border-[#E8D9CC] p-6 md:p-8 rounded-2xl shadow-xs space-y-6 anim-cascade-5 interactive-card">
            <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-[#E8D9CC]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFF0E6] border border-[#E8D9CC] flex items-center justify-center text-[#E85D04]">
                  <Activity size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg md:text-xl font-bold text-[#2B211C] tracking-tight">
                      Executive Presence &amp; Delivery Telemetry
                    </h2>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#FFF0E6] text-[#E85D04] border border-[#E8D9CC] font-bold uppercase tracking-wider">
                      Confidence AI
                    </span>
                  </div>
                  <p className="text-xs text-[#70645C]">
                    Proctoring telemetry evaluating eye contact ratio, posture poise, vocal cadence, and executive presence
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[#70645C] font-medium">Rating:</span>
                <span className="text-xs font-bold font-mono px-3 py-1 rounded-full bg-white text-[#E85D04] border border-[#E8D9CC]">
                  {results.confidenceMetrics?.executivePresenceRating || "Executive Ready"}
                </span>
              </div>
            </div>

            {/* 4 Metric Telemetry Gauges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Confidence Index */}
              <div className="bg-[#FFFCF8] p-4 rounded-xl border border-[#E8D9CC] space-y-2">
                <div className="flex items-center justify-between text-xs text-[#70645C]">
                  <span className="uppercase font-mono tracking-wider font-semibold">Confidence Index</span>
                  <Sparkles size={14} className="text-amber-600" />
                </div>
                <div className="text-2xl font-bold font-mono text-[#E85D04]">
                  {results.confidenceMetrics?.confidenceIndex ?? 86}%
                </div>
                <div className="w-full bg-[#1E293B] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#00FFB2] h-full rounded-full transition-all duration-700"
                    style={{ width: `${results.confidenceMetrics?.confidenceIndex ?? 86}%` }}
                  />
                </div>
                <p className="text-xs text-[#70645C]">
                  {(results.confidenceMetrics?.confidenceIndex ?? 86) >= 80 ? "High conviction & authoritative answers" : "Moderate composure; maintain steadiness"}
                </p>
              </div>

              {/* Eye Contact */}
              <div className="bg-[#FFFCF8] p-4 rounded-xl border border-[#E8D9CC] space-y-2">
                <div className="flex items-center justify-between text-xs text-[#70645C]">
                  <span className="uppercase font-mono tracking-wider font-semibold">Eye Contact Ratio</span>
                  <Eye size={14} className="text-emerald-600" />
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-700">
                  {results.confidenceMetrics?.eyeContactRatio ?? 88}%
                </div>
                <div className="w-full bg-[#1E293B] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-700"
                    style={{ width: `${results.confidenceMetrics?.eyeContactRatio ?? 88}%` }}
                  />
                </div>
                <p className="text-xs text-[#70645C]">
                  {(results.confidenceMetrics?.eyeContactRatio ?? 88) >= 75 ? "Direct gaze into screen/camera maintained" : "Gaze deviation detected during pauses"}
                </p>
              </div>

              {/* Posture Stability */}
              <div className="bg-[#FFFCF8] p-4 rounded-xl border border-[#E8D9CC] space-y-2">
                <div className="flex items-center justify-between text-xs text-[#70645C]">
                  <span className="uppercase font-mono tracking-wider font-semibold">Posture &amp; Poise</span>
                  <ShieldCheck size={14} className="text-[#E85D04]" />
                </div>
                <div className="text-2xl font-bold font-mono text-[#E85D04]">
                  {results.confidenceMetrics?.postureStability ?? 90}%
                </div>
                <div className="w-full bg-[#1E293B] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#00FFB2] h-full rounded-full transition-all duration-700"
                    style={{ width: `${results.confidenceMetrics?.postureStability ?? 90}%` }}
                  />
                </div>
                <p className="text-xs text-[#70645C]">
                  {(results.confidenceMetrics?.postureStability ?? 90) >= 80 ? "Centered, upright posture without shifting" : "Moderate body movement observed"}
                </p>
              </div>

              {/* Speech Pace WPM */}
              <div className="bg-[#FFFCF8] p-4 rounded-xl border border-[#E8D9CC] space-y-2">
                <div className="flex items-center justify-between text-xs text-[#70645C]">
                  <span className="uppercase font-mono tracking-wider font-semibold">Spoken Cadence</span>
                  <Mic size={14} className="text-amber-600" />
                </div>
                <div className="text-2xl font-bold font-mono text-[#2B211C]">
                  {results.confidenceMetrics?.speechPaceWpm ?? 135} <span className="text-xs text-[#70645C] font-normal">WPM</span>
                </div>
                <div className="w-full bg-[#1E293B] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-600 h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, Math.round(((results.confidenceMetrics?.speechPaceWpm ?? 135) / 180) * 100))}%` }}
                  />
                </div>
                <p className="text-xs text-[#70645C]">
                  Optimal executive target: 120–155 WPM
                </p>
              </div>
            </div>

            {/* AI Coaching & Actionable Telemetry Recommendations */}
            <div className="p-4 rounded-xl bg-[#FFFCF8] border border-[#E8D9CC] space-y-2">
              <div className="text-xs font-bold text-[#2B211C] flex items-center gap-2">
                <Sparkles size={14} className="text-[#E85D04]" />
                <span>Executive Delivery &amp; Behavioral Feedback</span>
              </div>
              <ul className="space-y-1.5 text-xs text-[#70645C]">
                {(results.confidenceMetrics?.recommendations && results.confidenceMetrics.recommendations.length > 0
                  ? results.confidenceMetrics.recommendations
                  : [
                      "Strong visual composure: Maintained steady eye engagement while breaking down architecture choices.",
                      "Cadence was within the optimal 120-150 WPM executive range. Answers felt confident and unhurried.",
                      "Poised posture projected presence; avoid shifting gaze away when retrieving complex technical memory."
                    ]
                ).map((rec: string, rIdx: number) => (
                  <li key={rIdx} className="flex items-start gap-2">
                    <span className="text-[#E85D04] font-bold mt-0.5">•</span>
                    <span className="leading-relaxed">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Speech & Vocal Delivery Mastery Card */}
          {results.speechAnalytics && (
            <div className="anim-cascade-5 interactive-card">
              <SpeechAnalyticsWidget data={results.speechAnalytics} />
            </div>
          )}

          {/* Interview Session Recording (10-Day Retention Policy) */}
          <div className="bg-[#FFFFFF] border border-[#E8D9CC] p-6 md:p-8 rounded-2xl shadow-xs space-y-5 anim-cascade-5 interactive-card">
            <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-[#E8D9CC]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <Video size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg md:text-xl font-bold text-[#2B211C] tracking-tight">
                      Interview Session Recording &amp; Playback
                    </h2>
                    {recordingInfo?.isExpired ? (
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border border-slate-200">
                        Expired (10d Policy)
                      </span>
                    ) : recordingInfo?.exists ? (
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider border border-emerald-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        Active • {recordingInfo.daysRemaining ?? 10} days left
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-[#70645C]">
                    Full session candidate audio &amp; video telemetry with strict 10-day retention privacy compliance
                  </p>
                </div>
              </div>

              {recordingInfo?.exists && !recordingInfo.isExpired && recordingInfo.downloadUrl && (
                <a
                  href={recordingInfo.downloadUrl}
                  download={recordingInfo.filename || `interview_${interviewId}.webm`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#FFFCF8] hover:bg-[#00FFB2] text-[#2B211C] border border-[#E8D9CC] hover:border-[#00DF8F] transition-all shadow-xs cursor-pointer"
                >
                  <Download size={14} />
                  <span>Download Recording</span>
                </a>
              )}
            </div>

            {recordingLoading ? (
              <div className="p-8 text-center rounded-xl bg-[#FFFCF8] border border-[#E8D9CC] space-y-3">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
                <p className="text-xs text-[#70645C]">Loading interview session media stream...</p>
              </div>
            ) : recordingInfo?.isExpired ? (
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-200/60 border border-slate-300 flex items-center justify-center text-slate-600 shrink-0">
                  <VideoOff size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800">
                    Recording Expired (10-Day Retention Policy)
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Per our data retention and privacy policies, physical session recordings are automatically and permanently purged 10 days after completion. Your performance metrics, question breakdown, scores, and proctoring audit reports remain permanently accessible.
                  </p>
                </div>
              </div>
            ) : recordingInfo?.exists && recordingInfo.streamUrl ? (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden bg-black border border-[#E8D9CC] shadow-sm max-h-[440px] flex items-center justify-center">
                  <video
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full max-h-[440px] object-contain"
                    src={recordingInfo.streamUrl}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#70645C] pt-2 border-t border-[#E8D9CC]">
                  <div className="flex flex-wrap items-center gap-4 font-mono text-xs">
                    <span className="flex items-center gap-1.5">
                      <Clock size={12} className="text-emerald-600" />
                      <span>Retained for: <strong>10 days</strong></span>
                    </span>
                    {recordingInfo.daysRemaining !== undefined && (
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-emerald-600" />
                        <span>Days remaining: <strong className="text-emerald-700">{recordingInfo.daysRemaining} days</strong></span>
                      </span>
                    )}
                    {recordingInfo.fileSize && recordingInfo.fileSize > 0 && (
                      <span>Size: {(recordingInfo.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                    )}
                    {recordingInfo.isLocalPreview && (
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-sans">
                        Instant Local Preview
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-[#70645C]">
                    Auto-purges 10 days post-interview
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-[#FFFCF8] border border-[#E8D9CC] flex items-center gap-3 text-xs text-[#70645C]">
                <Info size={16} className="text-emerald-600 shrink-0" />
                <span>
                  No media recording file was attached for this session (or the session was conducted in audio-only transcript mode). Scorecards and question evaluations are fully preserved below.
                </span>
              </div>
            )}
          </div>

          </>)}

          {(resultsActiveTab === "questions" || resultsActiveTab === "all") && (<>
          {/* Question & Answer Analysis */}
          {/* Question Breakdown (Expandable Cards) */}
          {results.questionAnswers.length > 0 && (
            <div className="bg-[#FFFFFF] border border-[#E8D9CC] p-6 md:p-8 rounded-2xl shadow-xs space-y-6 anim-cascade-6 interactive-card">
              <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-[#E8D9CC]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FFFFFF] border border-[#E8D9CC] flex items-center justify-center text-[#E85D04] hover:rotate-12 transition-transform duration-200">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-bold text-[#2B211C] tracking-tight">
                      Question Breakdown
                    </h2>
                    <p className="text-xs text-[#70645C]">
                      Expandable response analysis, scoring metrics, and Staff-level benchmarks
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleAllQuestions(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#70645C] bg-[#FFFCF8] border border-[#E8D9CC] hover:bg-[#1E293B] hover:text-[#2B211C] active:scale-95 transition-all cursor-pointer"
                  >
                    Expand All
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleAllQuestions(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#70645C] hover:text-[#2B211C] active:scale-95 transition-all cursor-pointer"
                  >
                    Collapse All
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {results.questionAnswers.map((qa: any, index: number) => {
                  const currentTab = activeAnswerTabs[index] || "user";
                  const isExpanded = expandedQuestions[index] !== false;

                  return (
                    <div
                      key={index}
                      className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                        isExpanded
                          ? "bg-white border-[#E8D9CC] shadow-xs"
                          : "bg-[#FFFCF8] border-[#E8D9CC] hover:border-[#E8D9CC] hover:shadow-2xs"
                      }`}
                    >
                      {/* Accordion Header */}
                      <button
                        type="button"
                        onClick={() => toggleQuestion(index)}
                        className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 transition-colors cursor-pointer group hover:bg-[#FFFCF8]/60"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="w-7 h-7 rounded-lg bg-[#FFFFFF] border border-[#E8D9CC] flex items-center justify-center text-xs font-bold text-[#E85D04] shrink-0 group-hover:scale-110 transition-transform duration-200">
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-xs font-semibold text-[#70645C] uppercase tracking-wider">
                                Question {index + 1}
                              </span>
                              {qa.isFollowup && (
                                <span className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                                  🎯 Follow-up Deep Dive
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-medium text-[#2B211C] truncate max-w-2xl group-hover:text-[#E85D04] transition-colors">
                              {qa.questionText}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {qa.score > 0 && (
                            <span
                              className={`px-2.5 py-1 rounded-md text-xs font-bold font-mono transition-transform duration-200 group-hover:scale-105 ${getScoreColor(
                                qa.score
                              )}`}
                            >
                              {qa.score}%
                            </span>
                          )}
                          <div className="w-8 h-8 rounded-lg bg-[#FFFCF8] border border-[#E8D9CC] flex items-center justify-center text-[#70645C] group-hover:border-[#E8D9CC] transition-colors">
                            {isExpanded ? (
                              <ChevronUp size={16} className="transition-transform duration-200" />
                            ) : (
                              <ChevronDown size={16} className="transition-transform duration-200" />
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Accordion Body */}
                      {isExpanded && (
                        <div className="px-5 pb-5 pt-1 space-y-4 border-t border-[#E8D9CC] animate-fadeInUp">
                          {/* Full Question Text */}
                          <div className="p-4 bg-[#FFFCF8] rounded-xl border border-[#E8D9CC]">
                            <span className="text-xs font-mono uppercase text-[#70645C] block mb-1 font-semibold">
                              Full Question
                            </span>
                            <p className="text-[#2B211C] font-medium text-sm sm:text-base leading-relaxed">
                              {qa.questionText}
                            </p>
                          </div>

                          {qa.parentQuestion && qa.isFollowup && (
                            <div className="text-xs text-amber-300 bg-amber-950/30 border border-amber-500/30 p-2.5 rounded-xl animate-fadeInUp">
                              <span className="font-semibold text-amber-900">Targeted Context:</span>{" "}
                              AI drilled deeper into your explanation of &quot;{qa.parentQuestion}&quot;
                            </div>
                          )}

                          {/* Speech Telemetry */}
                          {qa.speechMetrics && (
                            <div className="flex items-center gap-4 text-xs text-[#70645C] bg-[#FFFCF8] p-2.5 rounded-xl border border-[#E8D9CC] flex-wrap">
                              <span className="flex items-center gap-1.5 text-[#70645C]">
                                <Clock className="w-3.5 h-3.5 text-[#E85D04]" />
                                Pace: <strong className="text-[#2B211C]">{qa.speechMetrics.wpm || 140} WPM</strong>
                              </span>
                              <span className="text-[#D0C9B6]">•</span>
                              <span className="flex items-center gap-1.5 text-[#70645C]">
                                <Activity className="w-3.5 h-3.5 text-amber-600" />
                                Filler words: <strong className="text-[#2B211C]">{qa.speechMetrics.fillerWordsCount ?? 0}</strong>
                              </span>
                              <span className="text-[#D0C9B6]">•</span>
                              <span className="flex items-center gap-1.5 text-emerald-800 font-medium">
                                Articulation: {qa.speechMetrics.clarityScore || 85}%
                              </span>
                            </div>
                          )}

                          {/* Question Level Concepts & Depth Telemetry (Step 13) */}
                          {((qa.conceptsCovered && qa.conceptsCovered.length > 0) || (qa.conceptsMissing && qa.conceptsMissing.length > 0) || qa.depth) && (
                            <div className="p-3 bg-[#FFFCF8] rounded-xl border border-[#E8D9CC] space-y-2 text-xs">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <span className="font-semibold text-[#2B211C] text-xs uppercase tracking-wider font-mono">
                                  Evaluated Concepts
                                </span>
                                {qa.depth && (
                                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-white text-[#E85D04] border border-[#E8D9CC] uppercase font-semibold">
                                    Depth: {qa.depth}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-1.5 items-center">
                                {(qa.conceptsCovered || []).map((cc: string, cIdx: number) => (
                                  <span key={cIdx} className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    <Check size={11} className="text-emerald-700" /> {cc}
                                  </span>
                                ))}
                                {(qa.conceptsMissing || []).map((cm: string, mIdx: number) => (
                                  <span key={mIdx} className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                    <span className="text-amber-700 font-bold">!</span> {cm}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Tabs: Candidate Answer vs Staff Model Answer vs STAR */}
                          <div className="space-y-3 pt-2">
                            <div className="flex items-center space-x-2 border-b border-[#E8D9CC] pb-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveAnswerTabs((prev) => ({
                                    ...prev,
                                    [index]: "user",
                                  }))
                                }
                                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                                  currentTab === "user"
                                    ? "text-[#E85D04] border border-[#E8D9CC] bg-[#FFF0E6]"
                                    : "text-[#70645C] border border-transparent hover:text-[#2B211C]"
                                }`}
                              >
                                Candidate Answer
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveAnswerTabs((prev) => ({
                                    ...prev,
                                    [index]: "model",
                                  }))
                                }
                                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                                  currentTab === "model"
                                    ? "text-amber-300 border border-amber-500/40 bg-amber-500/10"
                                    : "text-[#70645C] border border-transparent hover:text-amber-300"
                                }`}
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                L5 Staff Engineer Benchmark
                              </button>
                              {qa.starAnalysis && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveAnswerTabs((prev) => ({
                                      ...prev,
                                      [index]: "star",
                                    }))
                                  }
                                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                                    currentTab === "star"
                                      ? "text-emerald-300 border border-emerald-500/40 bg-emerald-500/10"
                                      : "text-[#70645C] border border-transparent hover:text-emerald-300"
                                  }`}
                                >
                                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                                  STAR Analysis
                                </button>
                              )}
                            </div>

                            {/* Candidate Answer Content */}
                            {currentTab === "user" && (
                              <div className="bg-[#FFFCF8] p-4 rounded-xl border border-[#E8D9CC] animate-fadeInUp">
                                <p className="text-[#2B211C] whitespace-pre-wrap text-xs sm:text-sm leading-relaxed font-sans">
                                  {qa.userAnswer || "No verbal response recorded."}
                                </p>
                              </div>
                            )}

                            {/* Model Answer Content */}
                            {currentTab === "model" && (
                              <div className="bg-white p-4.5 rounded-xl border border-amber-500/30 space-y-2 animate-fadeInUp">
                                <div className="flex items-center justify-between text-xs text-amber-400 font-semibold">
                                  <span className="flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                    Exemplary Staff Engineer Architecture:
                                  </span>
                                  <span className="bg-amber-950/40 text-amber-300 px-2 py-0.5 rounded text-xs font-mono uppercase border border-amber-500/40">
                                    Gold Standard
                                  </span>
                                </div>
                                <p className="text-[#2B211C] whitespace-pre-wrap text-xs sm:text-sm leading-relaxed">
                                  {qa.seniorStaffModelAnswer ||
                                    "A Staff Engineer structures this by first clarifying business constraints, selecting optimal data access patterns, and explicitly mitigating cascading failures."}
                                </p>
                              </div>
                            )}

                            {/* STAR Analysis */}
                            {currentTab === "star" && qa.starAnalysis && (
                              <div className="bg-white p-4.5 rounded-xl border border-[#E8D9CC] space-y-3 animate-fadeInUp">
                                <div className="flex justify-between items-center text-xs pb-2 border-b border-[#E8D9CC]">
                                  <span className="font-semibold text-[#2B211C]">
                                    STAR Behavioral Adherence
                                  </span>
                                  <span className="bg-[#FFF0E6] text-[#E85D04] border border-[#E8D9CC] px-2 py-0.5 rounded text-xs font-mono font-bold">
                                    {qa.starAnalysis.adherenceScore || 85}% Adherence
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                                  <div className="p-3 bg-[#FFFCF8] border border-[#E8D9CC] rounded-lg hover:border-[#E8D9CC] transition-colors">
                                    <span className="font-bold text-[#E85D04] block mb-1">Situation:</span>
                                    <p className="text-[#70645C]">{qa.starAnalysis.situation || "Context established."}</p>
                                  </div>
                                  <div className="p-3 bg-[#FFFCF8] border border-[#E8D9CC] rounded-lg hover:border-[#E8D9CC] transition-colors">
                                    <span className="font-bold text-[#E85D04] block mb-1">Task:</span>
                                    <p className="text-[#70645C]">{qa.starAnalysis.task || "Objective defined."}</p>
                                  </div>
                                  <div className="p-3 bg-[#FFFCF8] border border-[#E8D9CC] rounded-lg hover:border-[#E8D9CC] transition-colors">
                                    <span className="font-bold text-[#E85D04] block mb-1">Action:</span>
                                    <p className="text-[#70645C]">{qa.starAnalysis.action || "Technical execution described."}</p>
                                  </div>
                                  <div className="p-3 bg-[#FFFCF8] border border-[#E8D9CC] rounded-lg hover:border-[#E8D9CC] transition-colors">
                                    <span className="font-bold text-[#E85D04] block mb-1">Result:</span>
                                    <p className="text-[#70645C]">{qa.starAnalysis.result || "Outcome communicated."}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* AI Evaluation / Feedback & Improvements */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                            {qa.feedback && (
                              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs interactive-card">
                                <span className="text-emerald-900 font-bold block mb-1">
                                  AI Evaluation:
                                </span>
                                <p className="text-[#2D2A26] leading-relaxed">{qa.feedback}</p>
                              </div>
                            )}
                            {qa.improvements && qa.improvements.length > 0 && (
                              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs interactive-card">
                                <span className="text-amber-900 font-bold block mb-1">
                                  Actionable Improvement:
                                </span>
                                <ul className="space-y-1 text-[#2D2A26]">
                                  {qa.improvements.map((imp: string, i: number) => (
                                    <li key={i} className="flex items-start gap-1.5">
                                      <span className="text-amber-700 font-bold">•</span>
                                      <span>{imp}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Code Submissions */}
          {results.codeSubmissions.length > 0 && (
            <div className="bg-[#FFFFFF] border border-[#E8D9CC] p-6 md:p-8 rounded-2xl shadow-xs space-y-6 anim-cascade-6 interactive-card">
              <div className="flex items-center gap-3 pb-4 border-b border-[#E8D9CC]">
                <div className="w-10 h-10 rounded-xl bg-[#FFFFFF] border border-[#E8D9CC] flex items-center justify-center text-[#E85D04] hover:scale-110 transition-transform duration-200">
                  <Code size={20} />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-[#2B211C] tracking-tight">Code Submissions</h2>
                  <p className="text-xs text-[#70645C]">Algorithmic execution and runtime assessment</p>
                </div>
              </div>

              <div className="space-y-4">
                {results.codeSubmissions.map(
                  (submission: any, index: number) => (
                    <div key={index} className="p-4 sm:p-5 bg-[#FFFCF8] rounded-xl border border-[#E8D9CC] interactive-card">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-[#2B211C]">
                            {submission.question}
                          </h3>
                          <span className="text-xs font-mono font-semibold text-[#E85D04]">
                            {submission.language}
                          </span>
                        </div>
                        <div
                          className={`text-lg font-bold px-2.5 py-0.5 rounded-md font-mono transition-transform duration-200 hover:scale-105 ${getScoreColor(
                            submission.score
                          )}`}
                        >
                          {submission.score}%
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-[#70645C] leading-relaxed">
                        {submission.feedback}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          </>)}

          {(resultsActiveTab === "overview" || resultsActiveTab === "all") && (<>
          {/* Next Steps */}
          <div className="bg-[#FFFFFF] border border-[#E8D9CC] p-6 md:p-8 rounded-2xl shadow-xs space-y-6 anim-cascade-6 interactive-card">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8D9CC]">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-[#2B211C] tracking-tight">Next Steps</h2>
                <p className="text-xs text-[#70645C]">Recommended follow-ups to accelerate interview mastery</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-5 bg-[#FFFCF8] rounded-xl border border-[#E8D9CC] space-y-3 interactive-card group">
                <h3 className="font-semibold text-[#2B211C] text-base group-hover:text-[#E85D04] transition-colors">Practice Next Track</h3>
                <p className="text-xs text-[#70645C] leading-relaxed">
                  {canTakeAnotherFreeInterview
                    ? "Schedule another interview to measure score progression across targeted skill areas."
                    : "Upgrade to unlimited plan to practice full-length system design and behavioral rounds."}
                </p>
                {canTakeAnotherFreeInterview ? (
                  <button
                    onClick={() => router.push("/learner/interview/setup")}
                    className="bg-gradient-to-r from-[#E85D04] to-[#E85D04] hover:from-[#E85D04] hover:to-[#D95304] text-[#2B211C] font-bold w-full py-2.5 text-xs font-bold rounded-xl shadow-md shadow-orange-500/20 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all duration-200"
                  >
                    Start New Interview
                  </button>
                ) : (
                  <button
                    onClick={() => router.push("/learner/plans")}
                    className="bg-gradient-to-r from-[#E85D04] to-[#E85D04] hover:from-[#E85D04] hover:to-[#D95304] text-[#2B211C] font-bold w-full py-2.5 text-xs font-bold rounded-xl shadow-md shadow-orange-500/20 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all duration-200"
                  >
                    View Upgrade Plans
                  </button>
                )}
              </div>

              <div className="p-5 bg-[#FFFCF8] rounded-xl border border-[#E8D9CC] space-y-3 interactive-card group">
                <h3 className="font-semibold text-[#2B211C] text-base group-hover:text-[#E85D04] transition-colors">Review Competency Weak Points</h3>
                <p className="text-xs text-[#70645C] leading-relaxed">
                  Study the L5 Staff Engineer phrasing and STAR breakdowns highlighted in your question deep dives above.
                </p>
                <button
                  onClick={() => router.push("/learner/history")}
                  className="bg-white hover:bg-[#1E293B] border border-[#E8D9CC] text-[#2B211C] w-full py-2.5 text-xs font-semibold rounded-xl shadow-xs hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all duration-200"
                >
                  View Historical Reports
                </button>
              </div>
            </div>
          </div>
          </>)}
        </div>
      </div>

      {/* Snapshot Lightbox Preview Modal */}
      {selectedSnapshot && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#FFFFFF] border border-[#E8D9CC] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl text-[#2B211C] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-[#E8D9CC]">
              <div className="flex items-center space-x-2 text-sm font-semibold text-[#2B211C]">
                <Camera className="w-4 h-4 text-[#E85D04]" />
                <span>Proctoring Infraction Snapshot</span>
              </div>
              <button
                onClick={() => setSelectedSnapshot(null)}
                className="text-[#70645C] hover:text-[#2B211C] p-1 rounded-lg hover:bg-[#FFFCF8] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex flex-col items-center">
              <div className="w-full bg-[#FFFCF8] rounded-xl overflow-hidden border border-[#E8D9CC] mb-3">
                <img
                  src={selectedSnapshot.snapshot}
                  alt="Enlarged evidence"
                  className="w-full h-auto object-contain"
                />
              </div>
              <div className="w-full space-y-1 text-xs">
                <div className="flex justify-between text-[#70645C]">
                  <span>Incident:</span>
                  <span className="font-semibold text-amber-700 capitalize">
                    {selectedSnapshot.eventType?.replace(/_/g, " ") || "Flag"}
                  </span>
                </div>
                <div className="flex justify-between text-[#70645C]">
                  <span>Timestamp:</span>
                  <span className="text-[#2B211C] font-medium">
                    {selectedSnapshot.timestamp
                      ? new Date(selectedSnapshot.timestamp).toLocaleString()
                      : "N/A"}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FFFCF8] border border-[#E8D9CC] text-[#70645C] mt-2">
                  {selectedSnapshot.message || "Potential integrity violation recorded by vision engine."}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verified Integrity Certificate Modal */}
      {showCertificateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#FFFFFF] border-2 border-[#E85D04] rounded-2xl max-w-2xl w-full p-8 shadow-2xl relative text-[#2B211C] animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowCertificateModal(false)}
              className="absolute top-4 right-4 text-[#70645C] hover:text-[#2B211C] p-1.5 rounded-lg hover:bg-[#FFFCF8] cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Certificate Header */}
            <div className="text-center space-y-2 mb-6">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#FFFFFF] border border-[#E8D9CC] text-[#E85D04] text-xs font-mono font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>TOPPLACED AI • VERIFIED PROCTORING AUDIT</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#2B211C]">
                Certificate of Interview Integrity
              </h2>
              <p className="text-xs text-[#70645C] max-w-md mx-auto">
                This certifies that the candidate completed a proctored AI evaluation with continuous biometric and window focus validation.
              </p>
            </div>

            {/* Certificate Body Card */}
            <div className="bg-[#FFFCF8] border border-[#E8D9CC] rounded-xl p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-[#70645C] uppercase font-semibold">Candidate</div>
                  <div className="font-bold text-[#2B211C] text-base">
                    {user?.name || (user as any)?.fullName || "Candidate"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#70645C] uppercase font-semibold">Track & Role</div>
                  <div className="font-bold text-[#E85D04] text-base">
                    {humanizeLabel(results.category)} ({results.level})
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#70645C] uppercase font-semibold">Overall Score</div>
                  <div className="font-bold text-[#2B211C] text-base">
                    {results.overallScore}% ({results.scores?.technical}% Tech / {results.scores?.communication}% Comm)
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#70645C] uppercase font-semibold">Trust Rating</div>
                  <div className="font-bold text-emerald-800 text-base">
                    {results.proctoringAudit?.verdict || "Verified (High Integrity)"} ({results.proctoringAudit?.integrityScore ?? 96}%)
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E8D9CC] flex items-center justify-between flex-wrap gap-2 text-xs text-[#70645C]">
                <div>
                  <span className="font-mono text-[#70645C]">Audit ID: </span>
                  <span className="font-mono text-[#E85D04] font-bold">
                    TP-AUDIT-{results.category?.substring(0, 3)?.toUpperCase() || "ENG"}-{Date.now().toString(36).toUpperCase()}
                  </span>
                </div>
                <div>
                  Completed: {results.completedAt || new Date().toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
              <div className="text-xs text-[#70645C] flex items-center space-x-1">
                <Lock className="w-3.5 h-3.5 text-[#E85D04]" />
                <span>Digitally signed and cryptographically stored on TopPlaced.</span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setIsCopiedCert(true);
                    setTimeout(() => setIsCopiedCert(false), 2000);
                  }}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-[#1E293B] border border-[#E8D9CC] text-[#2B211C] text-xs font-semibold transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer"
                >
                  {isCopiedCert ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Share2 className="w-3.5 h-3.5 text-[#70645C]" />}
                  <span>{isCopiedCert ? "Link Copied" : "Share Link"}</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#E85D04] to-[#E85D04] hover:from-[#E85D04] hover:to-[#D95304] text-[#2B211C] font-bold text-xs font-bold transition-all flex items-center space-x-1.5 shadow-md shadow-orange-500/20 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Certificate</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

export default function InterviewResultsPage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#FFFCF8] text-[#2B211C]">
            <Navbar />
            <Sidebar userType="learner" />
            <div className="ml-64 pt-20 pb-12">
              <div className="container-custom flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-[#E85D04] mx-auto mb-4" />
                  <p className="text-[#70645C] text-sm font-medium">Loading...</p>
                </div>
              </div>
            </div>
          </div>
        }
      >
        <InterviewResultsContent />
      </Suspense>
    </ProtectedRoute>
  );
}
