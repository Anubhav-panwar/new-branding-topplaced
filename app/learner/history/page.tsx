"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  Trophy,
  Search,
  Target,
  Users,
  BookOpen,
  ArrowRight,
  Filter,
  ArrowUpDown,
  Play,
  Bot,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Award,
  Sparkles,
  BarChart3,
  Calendar,
  Layers,
  Star,
  Video,
  VideoOff,
  Download,
  Loader2,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import BottomNav from "@/components/BottomNav";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import AIStatusBadge from "@/components/interview/AIStatusBadge";
import MetricCounter from "@/components/interview/MetricCounter";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  (process.env.NODE_ENV === "production" ? "" : "http://localhost:5000");

interface RecordingSessionStatus {
  checking: boolean;
  available: boolean;
  isExpired?: boolean;
  neverRecorded?: boolean;
  fileMissing?: boolean;
  hasError?: boolean;
  downloadUrl?: string;
  filename?: string;
  daysRemaining?: number;
  message?: string;
}

interface InterviewRecord {
  id: string;
  sessionId?: string;
  _id?: string;
  category: string;
  level: string;
  duration: number;
  overallScore: number;
  scores: {
    technical: number;
    communication: number;
    problemSolving: number;
    codeQuality?: number;
  };
  completedAt: string;
  timeSpent: number;
  status: "completed" | "terminated" | "incomplete";
  role?: string;
  candidateName?: string;
  candidateEmail?: string;
  trackType?: "technical" | "behavioral" | "case_study" | "mixed";
  hasRecording?: boolean;
  recordingAvailable?: boolean;
  recording?: any;
}

// Score normalizer: handles both 0-100 and 0-5 scale safely
function normalizeScore(val: number): number {
  if (typeof val !== "number" || isNaN(val)) return 0;
  if (val <= 5) return Math.round(val * 20);
  if (val <= 10) return Math.round(val * 10);
  return Math.min(100, Math.max(0, Math.round(val)));
}

function toFiveScale(val: number): string {
  const norm = normalizeScore(val);
  return (norm / 20).toFixed(1);
}

export default function InterviewHistoryPage() {
  const router = useRouter();
  const { user, token, isHydrated } = useSelector((state: RootState) => state.auth);

  const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Recording availability tracking & active download state
  const [recordingStatusMap, setRecordingStatusMap] = useState<Record<string, RecordingSessionStatus>>({});
  const [downloadingSessionId, setDownloadingSessionId] = useState<string | null>(null);

  const getEffectiveToken = () => {
    if (token) return token;
    if (typeof window !== "undefined") {
      return localStorage.getItem("token") || "";
    }
    return "";
  };

  // Filters & Sorting
  const [activeFilter, setActiveFilter] = useState<"all" | "technical" | "behavioral" | "case_study">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "highest_score">("newest");
  const [timeRange, setTimeRange] = useState<"all" | "30d" | "90d">("all");

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  // Fetch interviews
  useEffect(() => {
    fetchHistory();
  }, [user?._id, (user as any)?.id, token, isHydrated]);

  const fetchHistory = async () => {
    try {
      setLoading(true);

      let effectiveToken = token;
      let effectiveUserId = user?._id || (user as any)?.id;

      if (typeof window !== "undefined") {
        if (!effectiveToken) {
          effectiveToken = localStorage.getItem("token") || "";
        }
        if (!effectiveUserId) {
          try {
            const raw = localStorage.getItem("user");
            if (raw) {
              const parsed = JSON.parse(raw);
              effectiveUserId = parsed?._id || parsed?.id || "";
            }
          } catch {}
        }
      }

      if (!effectiveToken || !effectiveUserId) {
        if (isHydrated) {
          setInterviews([]);
          setLoading(false);
        }
        return;
      }

      const response = await fetch(
        `${API_URL}/users/${effectiveUserId}/interview-history?limit=100`,
        {
          headers: {
            Authorization: `Bearer ${effectiveToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        console.warn("Interview history request failed with status:", response.status);
        return;
      }

      const data = await response.json();
      const list = (data.interviews || []).map((it: any) => {
        const cat = (it.category || "").toLowerCase();
        let track: "technical" | "behavioral" | "case_study" | "mixed" = "technical";
        if (cat.includes("hr") || cat.includes("behavioral")) track = "behavioral";
        else if (cat.includes("case") || cat.includes("analyst")) track = "case_study";

        const recId = it.sessionId || it._id || it.id;
        const totalDurationMins =
          Math.round((it.timeSpent || 0) / 60) ||
          Math.round(it.duration || 30) ||
          30;

        return {
          id: recId,
          sessionId: it.sessionId || recId,
          _id: it._id,
          category: it.category || "Fullstack",
          level: it.level || "Intermediate",
          duration: totalDurationMins,
          overallScore: normalizeScore(it.overallScore ?? it.scores?.overall ?? 0),
          scores: {
            technical: normalizeScore(it.scores?.technical ?? it.overallScore ?? 0),
            communication: normalizeScore(it.scores?.communication ?? it.overallScore ?? 0),
            problemSolving: normalizeScore(it.scores?.problemSolving ?? it.overallScore ?? 0),
            codeQuality: it.scores?.codeQuality ? normalizeScore(it.scores.codeQuality) : undefined,
          },
          completedAt: it.completedAt || it.createdAt || it.endTime || it.startTime || new Date().toISOString(),
          timeSpent: it.timeSpent || (totalDurationMins * 60),
          status: (it.status as any) || "completed",
          role:
            it.role ||
            it.category
              ?.replace(/[-_]/g, " ")
              .replace(/\b\w/g, (c: string) => c.toUpperCase()) ||
            "Technical Interview",
          candidateName: it.candidateName || it.userName || (user?.name as string) || "Candidate",
          candidateEmail: it.candidateEmail || (user?.email as string) || "",
          trackType: track,
          hasRecording: it.hasRecording !== undefined ? Boolean(it.hasRecording) : undefined,
          recordingAvailable: it.recordingAvailable !== undefined ? Boolean(it.recordingAvailable) : undefined,
          recording: it.recording,
        };
      });

      setInterviews(list);
    } catch (e) {
      console.warn("Error fetching history:", e);
    } finally {
      setLoading(false);
    }
  };

  // Filter & Search & Time Range & Sort pipeline
  const filteredInterviews = useMemo(() => {
    const now = Date.now();
    return interviews
      .filter((it) => {
        // Time range filter
        if (timeRange === "30d") {
          const t = new Date(it.completedAt).getTime();
          if (now - t > 30 * 24 * 60 * 60 * 1000) return false;
        } else if (timeRange === "90d") {
          const t = new Date(it.completedAt).getTime();
          if (now - t > 90 * 24 * 60 * 60 * 1000) return false;
        }

        // Track filter
        if (activeFilter === "technical") {
          const c = it.category.toLowerCase();
          if (c.includes("hr") || c.includes("behavioral") || c.includes("case")) return false;
        } else if (activeFilter === "behavioral") {
          if (it.trackType !== "behavioral") return false;
        } else if (activeFilter === "case_study") {
          if (it.trackType !== "case_study") return false;
        }

        // Search term
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchRole = (it.role || "").toLowerCase().includes(q);
          const matchCat = (it.category || "").toLowerCase().includes(q);
          const matchLvl = (it.level || "").toLowerCase().includes(q);
          if (!matchRole && !matchCat && !matchLvl) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
        }
        if (sortBy === "oldest") {
          return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
        }
        if (sortBy === "highest_score") {
          return b.overallScore - a.overallScore;
        }
        return 0;
      });
  }, [interviews, activeFilter, searchTerm, sortBy, timeRange]);

  // Aggregate Metrics & Analytics computed from actual data
  const analytics = useMemo(() => {
    if (interviews.length === 0) {
      return {
        completedCount: 0,
        incompleteCount: 0,
        avgOverall: 0,
        avgTech: 0,
        avgComm: 0,
        avgProblem: 0,
        completionRate: 0,
        trendData: [],
        competencyData: [],
      };
    }

    const completed = interviews.filter((i) => i.status === "completed" || i.overallScore > 0);
    const incomplete = interviews.filter((i) => i.status === "incomplete" || i.status === "terminated");

    const sumOverall = completed.reduce((acc, i) => acc + i.overallScore, 0);
    const sumTech = completed.reduce((acc, i) => acc + (i.scores.technical || i.overallScore), 0);
    const sumComm = completed.reduce((acc, i) => acc + (i.scores.communication || i.overallScore), 0);
    const sumProblem = completed.reduce((acc, i) => acc + (i.scores.problemSolving || i.overallScore), 0);

    const count = completed.length || 1;
    const avgOverall = Math.round(sumOverall / count);
    const avgTech = Math.round(sumTech / count);
    const avgComm = Math.round(sumComm / count);
    const avgProblem = Math.round(sumProblem / count);

    const completionRate = Math.round((completed.length / interviews.length) * 100);

    // Chronological trend data (sorted oldest to newest for chart timeline)
    const chronological = [...interviews]
      .filter((i) => i.overallScore > 0)
      .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());

    const trendData = chronological.map((item, idx) => {
      const d = new Date(item.completedAt);
      const label = isNaN(d.getTime()) ? `S${idx + 1}` : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return {
        session: label,
        score: item.overallScore,
        scoreFive: Number((item.overallScore / 20).toFixed(1)),
        technical: item.scores.technical,
        communication: item.scores.communication,
        role: item.role || item.category,
      };
    });

    const competencyData = [
      { name: "Technical", score: avgTech, fiveScore: Number((avgTech / 20).toFixed(1)), fill: "#E85D04" },
      { name: "Communication", score: avgComm, fiveScore: Number((avgComm / 20).toFixed(1)), fill: "#E85D04" },
      { name: "Problem Solving", score: avgProblem, fiveScore: Number((avgProblem / 20).toFixed(1)), fill: "#D97706" },
      { name: "Practical App", score: Math.round((avgTech + avgProblem) / 2), fiveScore: Number(((avgTech + avgProblem) / 40).toFixed(1)), fill: "#F59E0B" },
    ];

    return {
      completedCount: completed.length,
      incompleteCount: incomplete.length,
      avgOverall,
      avgTech,
      avgComm,
      avgProblem,
      completionRate,
      trendData,
      competencyData,
    };
  }, [interviews]);

  // Paginated slice
  const paginatedList = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredInterviews.slice(start, start + PAGE_SIZE);
  }, [filteredInterviews, page]);

  const totalPages = Math.ceil(filteredInterviews.length / PAGE_SIZE) || 1;

  // Synchronize recording availability for interviews on the current page
  useEffect(() => {
    const currentToken = getEffectiveToken();
    if (!currentToken || paginatedList.length === 0) return;

    // Filter sessions that have not been checked or initiated yet
    const sessionsToCheck = paginatedList
      .map((it) => it.sessionId || it.id)
      .filter((sid) => Boolean(sid) && recordingStatusMap[sid] === undefined);

    if (sessionsToCheck.length === 0) return;

    // Mark as checking immediately to prevent duplicate requests
    setRecordingStatusMap((prev) => {
      const next = { ...prev };
      for (const sid of sessionsToCheck) {
        next[sid] = { checking: true, available: false };
      }
      return next;
    });

    // Check each session in parallel safely
    Promise.allSettled(
      sessionsToCheck.map(async (sid) => {
        try {
          const res = await fetch(`${API_URL}/interview/${sid}/recording`, {
            headers: {
              Authorization: `Bearer ${currentToken}`,
              "Content-Type": "application/json",
            },
          });

          if (res.ok) {
            const data = await res.json();
            return {
              sid,
              available: Boolean(data.available),
              isExpired: Boolean(data.isExpired),
              neverRecorded: Boolean(data.neverRecorded),
              fileMissing: Boolean(data.unavailableReason === "file_missing" || data.status === "missing" || data.fileMissing),
              hasError: false,
              downloadUrl: data.downloadUrl as string | undefined,
              filename: data.filename as string | undefined,
              daysRemaining: data.daysRemaining as number | undefined,
              message: data.message as string | undefined,
            };
          } else if (res.status === 410) {
            return {
              sid,
              available: false,
              isExpired: true,
              neverRecorded: false,
              fileMissing: false,
              hasError: false,
              message: "Recording has expired under 10-day retention policy.",
            };
          } else if (res.status === 404) {
            return {
              sid,
              available: false,
              isExpired: false,
              neverRecorded: true,
              fileMissing: false,
              hasError: false,
              message: "No recording was captured for this session.",
            };
          } else {
            return {
              sid,
              available: false,
              isExpired: false,
              neverRecorded: false,
              fileMissing: false,
              hasError: true,
              message: `Verification error (HTTP ${res.status}). Click to retry.`,
            };
          }
        } catch {
          return {
            sid,
            available: false,
            isExpired: false,
            neverRecorded: false,
            fileMissing: false,
            hasError: true,
            message: "Network error while checking recording. Click to retry.",
          };
        }
      })
    ).then((results) => {
      setRecordingStatusMap((prev) => {
        const next = { ...prev };
        for (const res of results) {
          if (res.status === "fulfilled" && res.value) {
            next[res.value.sid] = {
              checking: false,
              available: res.value.available,
              isExpired: res.value.isExpired,
              neverRecorded: res.value.neverRecorded,
              fileMissing: res.value.fileMissing,
              hasError: res.value.hasError,
              downloadUrl: res.value.downloadUrl,
              filename: res.value.filename,
              daysRemaining: res.value.daysRemaining,
              message: res.value.message,
            };
          }
        }
        return next;
      });
    });
  }, [paginatedList, token]);

  const retryRecordingCheck = (sid: string) => {
    setRecordingStatusMap((prev) => {
      const next = { ...prev };
      delete next[sid];
      return next;
    });
  };

  // Handle authenticated interview recording download
  const handleDownloadRecording = async (item: InterviewRecord) => {
    const sid = item.sessionId || item.id;
    if (!sid) {
      toast.error("Invalid interview session identifier.");
      return;
    }

    if (downloadingSessionId) return; // Prevent concurrent clicks

    setDownloadingSessionId(sid);
    const toastId = toast.loading("Connecting to recording media server...");
    let streamUrl = "";

    try {
      const currentToken = getEffectiveToken();
      if (!currentToken) {
        toast.dismiss(toastId);
        toast.error("Authentication required. Please sign in to download recordings.");
        return;
      }

      // Step 1: Query or refresh recording status and signed download token
      const infoRes = await fetch(`${API_URL}/interview/${sid}/recording`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!infoRes.ok) {
        toast.dismiss(toastId);
        if (infoRes.status === 401 || infoRes.status === 403) {
          toast.error("Forbidden: You are not authorized to download this recording.");
        } else if (infoRes.status === 410) {
          toast.error("Recording has expired and been deleted in accordance with the 10-day data retention policy.");
          setRecordingStatusMap((prev) => ({
            ...prev,
            [sid]: { checking: false, available: false, isExpired: true },
          }));
        } else if (infoRes.status === 404) {
          toast.error("No recording found for this interview session.");
          setRecordingStatusMap((prev) => ({
            ...prev,
            [sid]: { checking: false, available: false, isExpired: false },
          }));
        } else {
          toast.error(`Failed to retrieve recording status (HTTP ${infoRes.status}).`);
        }
        return;
      }

      const infoData = await infoRes.json();
      if (!infoData.available) {
        toast.dismiss(toastId);
        if (infoData.isExpired) {
          toast.error(infoData.message || "This recording has expired under the 10-day data retention policy.");
          setRecordingStatusMap((prev) => ({
            ...prev,
            [sid]: { checking: false, available: false, isExpired: true },
          }));
        } else if (infoData.neverRecorded) {
          toast.error("No recording was captured for this session.");
          setRecordingStatusMap((prev) => ({
            ...prev,
            [sid]: { checking: false, available: false, isExpired: false, neverRecorded: true },
          }));
        } else {
          toast.error(infoData.message || "Recording is currently unavailable.");
          setRecordingStatusMap((prev) => ({
            ...prev,
            [sid]: {
              checking: false,
              available: false,
              isExpired: false,
              fileMissing: Boolean(infoData.fileMissing || infoData.unavailableReason === "file_missing"),
            },
          }));
        }
        return;
      }

      const streamPath = infoData.downloadUrl;
      if (!streamPath) {
        toast.dismiss(toastId);
        toast.error("Recording streaming URL is unavailable.");
        return;
      }

      // Step 2: Stream media with authentication
      toast.loading("Streaming interview recording file...", { id: toastId });
      streamUrl = streamPath.startsWith("http") ? streamPath : `${API_URL}${streamPath}`;

      const streamRes = await fetch(streamUrl, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!streamRes.ok) {
        toast.dismiss(toastId);
        if (streamRes.status === 410) {
          toast.error("Recording has expired under the 10-day retention policy.");
        } else if (streamRes.status === 401 || streamRes.status === 403) {
          toast.error("Forbidden: You are not authorized to stream this recording.");
        } else {
          toast.error(`Recording download failed with status HTTP ${streamRes.status}.`);
        }
        return;
      }

      const blob = await streamRes.blob();
      if (!blob || blob.size === 0) {
        toast.dismiss(toastId);
        toast.error("The downloaded recording file is empty.");
        return;
      }

      // Step 3: Format filename (favor Content-Disposition attachment filename if provided)
      let targetFilename = "";
      const disposition = streamRes.headers.get("content-disposition");
      if (disposition && disposition.includes("filename=")) {
        const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
        if (match && match[1]) {
          targetFilename = decodeURIComponent(match[1].trim());
        }
      }

      if (!targetFilename) {
        const roleClean = (item.role || item.category || "General_Interview")
          .replace(/[^a-zA-Z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "");

        let dateClean = new Date().toISOString().split("T")[0];
        if (item.completedAt) {
          const d = new Date(item.completedAt);
          if (!isNaN(d.getTime())) {
            dateClean = d.toISOString().split("T")[0];
          }
        }

        let ext = "webm";
        if (infoData.filename && infoData.filename.includes(".")) {
          const parts = infoData.filename.split(".");
          ext = parts[parts.length - 1];
        } else if (blob.type.includes("mp4")) {
          ext = "mp4";
        } else if (blob.type.includes("wav")) {
          ext = "wav";
        }

        targetFilename = `TopPlaced_Interview_${roleClean}_${dateClean}.${ext}`;
      }

      // Step 4: Save file to user's disk
      const blobUrl = window.URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = blobUrl;
      downloadLink.download = targetFilename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);

      toast.dismiss(toastId);
      toast.success(`Recording downloaded: ${targetFilename}`);
    } catch (err: any) {
      console.error("Recording download error:", err);
      // Resilient fallback: If in-browser fetch was blocked, attempt direct browser download via signed download URL
      if (streamUrl) {
        try {
          toast.loading("Initiating direct browser download...", { id: toastId });
          const directLink = document.createElement("a");
          directLink.href = streamUrl;
          directLink.download = "";
          directLink.target = "_blank";
          directLink.rel = "noopener noreferrer";
          document.body.appendChild(directLink);
          directLink.click();
          document.body.removeChild(directLink);
          toast.dismiss(toastId);
          toast.success("Recording download initiated via browser.");
          return;
        } catch (directErr) {
          console.error("Direct browser download fallback failed:", directErr);
        }
      }
      toast.dismiss(toastId);
      toast.error(err?.message || "Network failure during download. Please check your connection and retry.");
    } finally {
      setDownloadingSessionId(null);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#F8F0E6] text-[#2B211C] flex flex-col font-sans selection:bg-[#FFF0E6] selection:text-[#E85D04]">
        <Navbar />
        <Sidebar userType="learner" />

        <main className="md:ml-64 ml-0 pt-6 pb-24 md:pb-16 flex-1 px-4 sm:px-6 lg:px-10 max-w-none min-w-0 page-enter">
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E8D9CC] pb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AIStatusBadge status="online" label="Interview Analytics Hub" size="sm" />
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FFFFFF] border border-[#E8D9CC] text-[#70645C] font-mono">
                  {interviews.length} Total Sessions
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2B211C] tracking-tight">
                Candidate Evaluation &amp; Analytics
              </h1>
              <p className="text-xs sm:text-sm text-[#70645C] mt-1">
                Longitudinal performance telemetry, competency rubrics, and session historical archives.
              </p>
            </div>

            <Link
              href="/learner/interview/setup"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#E85D04] to-[#E85D04] hover:from-[#E85D04] hover:to-[#D95304] text-[#2B211C] shadow-md shadow-orange-500/20 transition-all self-start sm:self-auto active:scale-95"
            >
              <Play size={14} className="fill-[#2B211C]" />
              <span>Start New Interview</span>
            </Link>
          </div>

          {/* Top Analytics KPI Bar (Reference Design Layout) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
            {/* Overall Evaluation Circle Card (4 cols) */}
            <div className="lg:col-span-4 bg-[#FFFFFF] p-5 sm:p-6 rounded-2xl border border-[#E8D9CC] shadow-xs flex items-center gap-5">
              <div className="relative flex items-center justify-center shrink-0 w-24 h-24 rounded-full border-4 border-[#E85D04] shadow-[0_0_20px_rgba(242,106,10,0.2)] bg-[#FFF0E6]">
                <div className="text-center">
                  <div className="text-2xl font-black text-[#2B211C] font-mono leading-none">
                    {analytics.avgOverall > 0 ? (analytics.avgOverall / 20).toFixed(1) : "0.0"}
                  </div>
                  <div className="text-[10px] text-[#70645C] font-mono mt-0.5">/ 5.0</div>
                </div>
              </div>

              <div className="space-y-1.5 flex-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#70645C]">
                  Overall Evaluation
                </div>
                <div className="flex items-center gap-1 text-[#E85D04]">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={14}
                      className={star <= Math.round(analytics.avgOverall / 20) ? "fill-[#E85D04] text-[#E85D04]" : "text-[#E8D9CC]"}
                    />
                  ))}
                  <span className="text-xs font-mono font-bold ml-1 text-[#2B211C]">
                    {analytics.avgOverall}%
                  </span>
                </div>
                <p className="text-[11px] text-[#70645C]">
                  Weighted average across {analytics.completedCount} completed sessions
                </p>
              </div>
            </div>

            {/* Competency Mini Gauges (8 cols) */}
            <div className="lg:col-span-8 bg-[#FFFFFF] p-5 sm:p-6 rounded-2xl border border-[#E8D9CC] shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
              {/* Technical */}
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-[#FFFCF8] border border-[#E8D9CC]">
                <div className="w-12 h-12 rounded-full border-2 border-[#E85D04] flex items-center justify-center font-mono font-bold text-sm text-[#E85D04] mb-2 shadow-[0_0_10px_rgba(242,106,10,0.15)]">
                  {analytics.avgTech > 0 ? (analytics.avgTech / 20).toFixed(1) : "0.0"}
                </div>
                <span className="text-xs font-semibold text-[#2B211C]">Technical</span>
                <span className="text-[10px] text-[#70645C] font-mono mt-0.5">{analytics.avgTech}%</span>
              </div>

              {/* Communication */}
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-[#FFFCF8] border border-[#E8D9CC]">
                <div className="w-12 h-12 rounded-full border-2 border-[#E85D04] flex items-center justify-center font-mono font-bold text-sm text-[#E85D04] mb-2 shadow-[0_0_10px_rgba(232,93,4,0.15)]">
                  {analytics.avgComm > 0 ? (analytics.avgComm / 20).toFixed(1) : "0.0"}
                </div>
                <span className="text-xs font-semibold text-[#2B211C]">Communication</span>
                <span className="text-[10px] text-[#70645C] font-mono mt-0.5">{analytics.avgComm}%</span>
              </div>

              {/* Problem Solving */}
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-[#FFFCF8] border border-[#E8D9CC]">
                <div className="w-12 h-12 rounded-full border-2 border-[#D97706] flex items-center justify-center font-mono font-bold text-sm text-[#D97706] mb-2 shadow-[0_0_10px_rgba(217,119,6,0.15)]">
                  {analytics.avgProblem > 0 ? (analytics.avgProblem / 20).toFixed(1) : "0.0"}
                </div>
                <span className="text-xs font-semibold text-[#2B211C]">Problem Solving</span>
                <span className="text-[10px] text-[#70645C] font-mono mt-0.5">{analytics.avgProblem}%</span>
              </div>

              {/* Practical App */}
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-[#FFFCF8] border border-[#E8D9CC]">
                <div className="w-12 h-12 rounded-full border-2 border-[#F59E0B] flex items-center justify-center font-mono font-bold text-sm text-[#F59E0B] mb-2 shadow-[0_0_10px_rgba(245,158,11,0.15)]">
                  {analytics.avgTech > 0 ? ((analytics.avgTech + analytics.avgProblem) / 40).toFixed(1) : "0.0"}
                </div>
                <span className="text-xs font-semibold text-[#2B211C]">Practical App</span>
                <span className="text-[10px] text-[#70645C] font-mono mt-0.5">{Math.round((analytics.avgTech + analytics.avgProblem) / 2)}%</span>
              </div>
            </div>
          </div>

          {/* Visual Analytics Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
            {/* Performance Over Time (Area Chart) */}
            <div className="lg:col-span-7 bg-[#FFFFFF] p-5 sm:p-6 rounded-2xl border border-[#E8D9CC] shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} className="text-[#E85D04]" />
                  <h3 className="text-sm sm:text-base font-bold text-[#2B211C]">
                    Interview Performance Over Time
                  </h3>
                </div>
                <span className="text-[11px] font-mono font-semibold text-[#E85D04] bg-[#FFF0E6] px-2.5 py-1 rounded-full border border-[#E8D9CC] w-fit shrink-0">
                  Score / 100%
                </span>
              </div>

              {analytics.trendData.length > 0 ? (
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={analytics.trendData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#E85D04" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#E85D04" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8D9CC" vertical={false} />
                      <XAxis
                        dataKey="session"
                        stroke="#70645C"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: "#E8D9CC" }}
                      />
                      <YAxis
                        stroke="#70645C"
                        fontSize={11}
                        domain={[0, 100]}
                        tickLine={false}
                        axisLine={{ stroke: "#E8D9CC" }}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-[#FFFFFF] p-3 rounded-xl border border-[#E8D9CC] shadow-xs text-xs">
                                <p className="font-semibold text-[#2B211C]">{data.role}</p>
                                <p className="text-[#70645C] text-[11px]">{data.session}</p>
                                <div className="mt-1 flex items-center gap-2">
                                  <span className="text-[#E85D04] font-mono font-bold">
                                    Overall: {data.score}% ({data.scoreFive} / 5)
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="#E85D04"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#scoreGradient)"
                        dot={{ r: 4, fill: "#E85D04", stroke: "#FFFFFF", strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: "#E85D04" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[220px] flex flex-col items-center justify-center text-[#70645C] text-xs">
                  <BarChart3 size={32} className="mb-2 opacity-50 text-[#70645C]" />
                  <span>No interview sessions recorded yet to plot performance trajectory</span>
                </div>
              )}
            </div>

            {/* Competency Breakdown (Bar Chart & Progress) */}
            <div className="lg:col-span-5 bg-[#FFFFFF] p-5 sm:p-6 rounded-2xl border border-[#E8D9CC] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Target size={18} className="text-[#E85D04]" />
                    <h3 className="text-sm sm:text-base font-bold text-[#2B211C]">
                      Competency Breakdown
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-[#70645C]">
                    Score / 5.0
                  </span>
                </div>

                <div className="space-y-4 my-2">
                  {analytics.competencyData.map((comp) => (
                    <div key={comp.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#70645C] font-medium">{comp.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#2B211C]">
                            {comp.fiveScore > 0 ? comp.fiveScore : "0.0"}
                          </span>
                          <span className="text-[11px] text-[#70645C] font-mono">({comp.score}%)</span>
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[#FFF0E6] overflow-hidden border border-[#E8D9CC]">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${Math.max(4, comp.score)}%`,
                            backgroundColor: comp.fill,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Completion stat summary footer */}
              <div className="pt-4 border-t border-[#E8D9CC] mt-3 flex items-center justify-between text-xs">
                <div className="text-[#70645C]">
                  Completion Rate:{" "}
                  <span className="font-bold text-[#E85D04] font-mono">
                    {analytics.completionRate}%
                  </span>
                </div>
                <div className="text-[#70645C]">
                  Completed:{" "}
                  <span className="font-bold text-[#2B211C] font-mono">
                    {analytics.completedCount}
                  </span>{" "}
                  / {interviews.length}
                </div>
              </div>
            </div>
          </div>

          {/* Search, Filter, Sort Toolbar */}
          <div className="bg-[#FFFFFF] p-4 rounded-2xl mb-6 border border-[#E8D9CC] shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                {[
                  { id: "all", label: "All Records" },
                  { id: "technical", label: "Technical" },
                  { id: "behavioral", label: "Behavioral" },
                  { id: "case_study", label: "Case Study" },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    onClick={() => {
                      setActiveFilter(pill.id as any);
                      setPage(1);
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                      activeFilter === pill.id
                        ? "bg-gradient-to-r from-[#E85D04] to-[#E85D04] text-[#2B211C] font-bold shadow-xs"
                        : "bg-[#FFFCF8] text-[#70645C] hover:text-[#2B211C] border border-[#E8D9CC]"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              {/* Time Range Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#70645C] hidden sm:inline">Timeframe:</span>
                <div className="flex items-center rounded-xl bg-[#FFFCF8] border border-[#E8D9CC] p-0.5 text-xs">
                  {[
                    { id: "all", label: "All Time" },
                    { id: "30d", label: "30 Days" },
                    { id: "90d", label: "90 Days" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTimeRange(t.id as any)}
                      className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                        timeRange === t.id ? "bg-white text-[#E85D04] font-bold shadow-xs" : "text-[#70645C] hover:text-[#2B211C]"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Search and Sort Row */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-[#E8D9CC]">
              <div className="relative flex-1 w-full">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#70645C]" />
                <input
                  type="text"
                  placeholder="Search by role, framework, or difficulty..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-[#FFFCF8] border border-[#E8D9CC] focus:border-[#E85D04] rounded-xl pl-9 pr-4 py-2 text-xs text-[#2B211C] placeholder-[#70645C] outline-none transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <ArrowUpDown size={14} className="text-[#70645C] shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-[#FFFCF8] border border-[#E8D9CC] text-[#2B211C] text-xs rounded-xl px-3 py-2 outline-none cursor-pointer flex-1 sm:flex-initial"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest_score">Highest Score</option>
                </select>
              </div>
            </div>
          </div>

          {/* Interview List / Cards */}
          {loading ? (
            <div className="bg-[#FFFFFF] p-12 rounded-2xl border border-[#E8D9CC] text-center space-y-3">
              <div className="animate-spin w-8 h-8 border-2 border-[#E85D04] border-t-transparent rounded-full mx-auto" />
              <p className="text-xs text-[#70645C]">Loading interview telemetry archives...</p>
            </div>
          ) : paginatedList.length === 0 ? (
            <div className="bg-[#FFFFFF] p-12 rounded-2xl border border-[#E8D9CC] text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#FFF0E6] border border-[#E8D9CC] flex items-center justify-center text-[#E85D04] mx-auto">
                <Trophy size={28} />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-bold text-[#2B211C]">No Interviews Recorded Yet</h3>
                <p className="text-xs text-[#70645C] mt-1">
                  Start your first mock session to evaluate your skills with real-time speech analytics, coding challenges, and AI mentor scoring.
                </p>
              </div>
              <Link
                href="/learner/interview/setup"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#E85D04] to-[#E85D04] hover:from-[#E85D04] hover:to-[#D95304] text-[#2B211C] shadow-md shadow-orange-500/20 transition-all active:scale-95"
              >
                <Play size={14} className="fill-[#2B211C]" />
                <span>Launch First Interview Session</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedList.map((item) => {
                const dateStr = new Date(item.completedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });
                const timeStr = new Date(item.completedAt).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                const isCompleted = item.status === "completed" || item.overallScore > 0;

                return (
                  <div
                    key={item.id}
                    className="bg-[#FFFFFF] hover:bg-[#FFFCF8] border border-[#E8D9CC] hover:border-[#E85D04] p-4 sm:p-5 rounded-2xl transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Left: Role, Category, Date */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm sm:text-base font-bold text-[#2B211C]">
                          {item.role}
                        </span>
                        {item.candidateName && (
                          <span className="text-xs text-[#2B211C]/80 font-medium px-2 py-0.5 rounded-md bg-[#FFFCF8] border border-[#E8D9CC]">
                            Candidate: <span className="font-semibold text-[#2B211C]">{item.candidateName}</span>
                          </span>
                        )}
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#FFF0E6] border border-[#E8D9CC] text-[#70645C]">
                          {item.category}
                        </span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#FFF0E6] border border-[#E8D9CC] text-[#E85D04]">
                          {item.level}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-[#70645C]">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-[#70645C]" />
                          {dateStr} at {timeStr}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock size={13} className="text-[#70645C]" />
                          {item.duration} mins
                        </span>
                        <span className="flex items-center gap-1.5">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 text-[#E85D04] font-medium">
                              <CheckCircle2 size={13} />
                              Completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                              <AlertCircle size={13} />
                              {item.status}
                            </span>
                          )}
                        </span>

                        {(() => {
                          const sid = item.sessionId || item.id;
                          const status = recordingStatusMap[sid];

                          // If status was retrieved from API
                          if (status) {
                            if (status.checking) {
                              return (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#FFF0E6] border border-[#E8D9CC] text-[#70645C]">
                                  <Loader2 size={11} className="animate-spin text-[#70645C]" />
                                  <span>Checking recording</span>
                                </span>
                              );
                            }
                            if (status.available) {
                              const daysText = status.daysRemaining !== undefined ? `${status.daysRemaining}d left` : "Available";
                              return (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-50 border border-emerald-200 text-emerald-700">
                                  <Video size={11} className="text-emerald-600 animate-pulse" />
                                  <span>Recording ({daysText})</span>
                                </span>
                              );
                            }
                            if (status.isExpired) {
                              return (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#FFF0E6] border border-[#E8D9CC] text-[#70645C]">
                                  <VideoOff size={11} className="text-[#70645C]" />
                                  <span>Recording Expired (10d)</span>
                                </span>
                              );
                            }
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#FFF0E6] border border-[#E8D9CC] text-[#70645C]">
                                <VideoOff size={11} className="text-[#70645C]" />
                                <span>No Recording</span>
                              </span>
                            );
                          }

                          // Fallback before status is loaded
                          const hasMedia = !!(item.hasRecording || item.recordingAvailable || item.recording);
                          if (!hasMedia) return null;

                          const completedTimestamp = new Date(item.completedAt).getTime();
                          const diffMs = Date.now() - completedTimestamp;
                          const daysAgo = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                          const daysRemaining = Math.max(0, 10 - daysAgo);
                          const isRecordingActive = daysAgo <= 10;

                          return isRecordingActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-50 border border-emerald-200 text-emerald-700">
                              <Video size={11} className="text-emerald-600 animate-pulse" />
                              <span>Recording ({daysRemaining}d left)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#FFF0E6] border border-[#E8D9CC] text-[#70645C]">
                              <VideoOff size={11} className="text-[#70645C]" />
                              <span>Recording Expired (10d)</span>
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Middle: Competencies mini indicators */}
                    <div className="hidden lg:flex items-center gap-3 px-4 border-x border-[#E8D9CC]">
                      <div className="text-center">
                        <div className="text-[10px] text-[#70645C] uppercase font-mono">Tech</div>
                        <div className="text-xs font-bold text-[#E85D04] font-mono">
                          {toFiveScale(item.scores.technical)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] text-[#70645C] uppercase font-mono">Comm</div>
                        <div className="text-xs font-bold text-[#E85D04] font-mono">
                          {toFiveScale(item.scores.communication)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] text-[#70645C] uppercase font-mono">Problem</div>
                        <div className="text-xs font-bold text-[#D97706] font-mono">
                          {toFiveScale(item.scores.problemSolving)}
                        </div>
                      </div>
                    </div>

                    {/* Right: Score Pill & Action Cluster */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between md:justify-end gap-3 sm:gap-4 shrink-0">
                      <div className="text-left sm:text-right">
                        <div className="text-lg font-black font-mono text-[#2B211C]">
                          {item.overallScore > 0 ? (item.overallScore / 20).toFixed(1) : "—"}
                          <span className="text-xs text-[#70645C] font-normal"> / 5.0</span>
                        </div>
                        <div className="text-[11px] font-mono text-[#E85D04] font-bold">
                          {item.overallScore > 0 ? `${item.overallScore}% score` : "Unrated"}
                        </div>
                      </div>

                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                        {/* Download Recording Button or Unavailable Badge */}
                        {(() => {
                          const sid = item.sessionId || item.id;
                          const status = recordingStatusMap[sid];

                          if (status?.checking) {
                            return (
                              <span
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-[#FFFCF8] border border-[#E8D9CC] text-[#70645C] animate-pulse"
                                title="Checking recording status..."
                              >
                                <Loader2 size={13} className="animate-spin text-[#E85D04]" />
                                <span className="hidden sm:inline">Checking</span>
                              </span>
                            );
                          }

                          if (status?.available) {
                            const isDownloading = downloadingSessionId === sid;
                            return (
                              <button
                                type="button"
                                onClick={() => handleDownloadRecording(item)}
                                disabled={isDownloading}
                                title={
                                  status.daysRemaining !== undefined
                                    ? `Download interview recording (${status.daysRemaining} days remaining in retention)`
                                    : "Download interview recording"
                                }
                                aria-label={`Download interview recording for ${item.role}`}
                                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#FFFCF8] hover:bg-[#FFF0E6] text-[#E85D04] hover:text-[#D95304] border border-[#E8D9CC] hover:border-[#E85D04] transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 cursor-pointer whitespace-nowrap"
                              >
                                {isDownloading ? (
                                  <>
                                    <Loader2 size={13} className="animate-spin text-[#E85D04]" />
                                    <span>Downloading...</span>
                                  </>
                                ) : (
                                  <>
                                    <Download size={13} className="text-[#E85D04]" />
                                    <span>Download Recording</span>
                                  </>
                                )}
                              </button>
                            );
                          }

                          if (status?.isExpired) {
                            return (
                              <span
                                title="Recording has expired and been deleted in accordance with the 10-day data retention policy"
                                className="inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl text-[11px] font-medium bg-[#FFF0E6]/60 border border-[#E8D9CC] text-[#70645C] whitespace-nowrap"
                              >
                                <VideoOff size={12} className="text-[#70645C]" />
                                <span>Expired (10d)</span>
                              </span>
                            );
                          }

                          if (status?.hasError) {
                            return (
                              <button
                                type="button"
                                onClick={() => retryRecordingCheck(sid)}
                                title={status.message || "Failed to verify recording. Click to retry."}
                                className="inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl text-[11px] font-medium bg-[#FFF2F2] hover:bg-[#FFE5E5] border border-[#F8B4B4] text-[#B91C1C] transition-all cursor-pointer whitespace-nowrap"
                              >
                                <AlertCircle size={12} className="text-[#DC2626]" />
                                <span>Retry Check</span>
                              </button>
                            );
                          }

                          if (status?.fileMissing) {
                            return (
                              <span
                                title="Recording metadata exists, but the physical media file is currently unavailable on disk"
                                className="inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl text-[11px] font-medium bg-[#FFFCF8] border border-[#E8D9CC] text-[#70645C] whitespace-nowrap"
                              >
                                <VideoOff size={12} className="text-[#70645C]" />
                                <span>Recording unavailable</span>
                              </span>
                            );
                          }

                          // Honest status for sessions never recorded
                          return (
                            <span
                              title="No recording was captured for this interview session"
                              className="inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl text-[11px] font-medium bg-[#FFFCF8]/70 border border-[#E8D9CC]/80 text-[#70645C] whitespace-nowrap"
                            >
                              <VideoOff size={12} className="text-[#70645C]" />
                              <span>Not recorded</span>
                            </span>
                          );
                        })()}

                        {/* View Report Navigation Link */}
                        <Link
                          href={`/learner/interview/results?id=${item.id}&sessionId=${item.sessionId || item.id}`}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#FFFCF8] hover:bg-[#E85D04] text-[#2B211C] hover:text-white border border-[#E8D9CC] hover:border-[#E85D04] transition-all shadow-xs whitespace-nowrap"
                        >
                          <span>View Report</span>
                          <ArrowRight size={13} />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between border-t border-[#E8D9CC] pt-4 text-xs">
              <span className="text-[#70645C]">
                Showing {(page - 1) * PAGE_SIZE + 1} to{" "}
                {Math.min(page * PAGE_SIZE, filteredInterviews.length)} of {filteredInterviews.length} sessions
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-xl bg-[#FFFFFF] border border-[#E8D9CC] text-[#70645C] hover:text-[#2B211C] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-3 py-1 font-mono font-bold text-[#2B211C]">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-xl bg-[#FFFFFF] border border-[#E8D9CC] text-[#70645C] hover:text-[#2B211C] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </main>

        <BottomNav />
      </div>
      <Toaster position="top-right" richColors />
    </ProtectedRoute>
  );
}
