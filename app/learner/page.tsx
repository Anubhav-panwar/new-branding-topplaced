"use client";

import ProtectedRoute from "../../components/ProtectedRoute";
import { RootState } from "../../store/store";
import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Play,
  Trophy,
  Users,
  TrendingUp,
  Clock,
  ArrowRight,
  Target,
  Sparkles,
  Award,
  Zap,
  BookOpen,
  CreditCard,
  Bot,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import BottomNav from "../../components/BottomNav";
import { useRouter } from "next/navigation";
import {
  getUserDashboardStats,
  getUserInterviewHistory,
  getUserInterviewUsage,
  getUserAchievements,
} from "../../utils/api-helpers";
import MetricCounter from "@/components/interview/MetricCounter";
import { formatRoleName, formatCandidateName } from "@/utils/formatters";

interface DashboardData {
  stats: any;
  interviewHistory: any;
  achievements: any;
  usage: any;
}

export default function LearnerDashboard() {
  const [interviewsCount, setInterviewsCount] = useState(0);
  const [avgScore, setAvgScore] = useState(0);
  const [totalPracticeMinutes, setTotalPracticeMinutes] = useState(0);
  const [creditsRemaining, setCreditsRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedPracticeType, setSelectedPracticeType] = useState<
    "technical" | "behavioral" | "case_study" | "mixed"
  >("technical");

  const [dashboardData, setDashboardData] = useState<DashboardData>({
    stats: null,
    interviewHistory: null,
    achievements: null,
    usage: null,
  });

  const [hasCompletedEvaluations, setHasCompletedEvaluations] = useState(false);

  const [skillProgress, setSkillProgress] = useState({
    interviewSkills: 0,
    technicalKnowledge: 0,
    communication: 0,
    problemSolving: 0,
  });

  const dispatch = useDispatch();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user?._id) return;

    try {
      setLoading(true);

      const [stats, interviewHistory, achievements, usage] = await Promise.all([
        getUserDashboardStats(user._id).catch(() => null),
        getUserInterviewHistory(user._id, 25).catch(() => null),
        getUserAchievements().catch(() => null),
        getUserInterviewUsage(user._id).catch(() => null),
      ]);

      setDashboardData({
        stats,
        interviewHistory,
        achievements,
        usage,
      });

      // Calculate total credits remaining
      const credits =
        usage?.interviewCredits ??
        (usage?.hasPaidPlan
          ? 100
          : Math.max(0, (usage?.freeInterviewsLimit ?? 2) - (usage?.freeInterviewsUsed ?? 0)));
      setCreditsRemaining(credits);

      if (interviewHistory?.interviews && interviewHistory.interviews.length > 0) {
        const list = interviewHistory.interviews;
        setInterviewsCount(interviewHistory.totalInterviews || list.length);

        const totalSecs = list.reduce(
          (acc: number, curr: any) => acc + (curr.timeSpent || 0),
          0
        );
        setTotalPracticeMinutes(Math.round(totalSecs / 60) || list.length * 25);

        const scoredList = list.filter(
          (it: any) => it.overallScore || it.scores?.overall
        );

        if (scoredList.length > 0) {
          setHasCompletedEvaluations(true);
          const avg =
            scoredList.reduce(
              (sum: number, it: any) =>
                sum + (it.overallScore || it.scores?.overall || 0),
              0
            ) / scoredList.length;

          const roundedAvg = Math.round(avg);
          setAvgScore(roundedAvg);

          const avgTech =
            scoredList.reduce(
              (sum: number, it: any) =>
                sum + (it.scores?.technical || it.overallScore || 0),
              0
            ) / scoredList.length;

          const avgComm =
            scoredList.reduce(
              (sum: number, it: any) =>
                sum + (it.scores?.communication || it.overallScore || 0),
              0
            ) / scoredList.length;

          const avgProblem =
            scoredList.reduce(
              (sum: number, it: any) =>
                sum + (it.scores?.problemSolving || it.overallScore || 0),
              0
            ) / scoredList.length;

          setSkillProgress({
            interviewSkills: roundedAvg,
            technicalKnowledge: Math.round(avgTech),
            communication: Math.round(avgComm),
            problemSolving: Math.round(avgProblem),
          });
        } else {
          setHasCompletedEvaluations(false);
          setSkillProgress({
            interviewSkills: 0,
            technicalKnowledge: 0,
            communication: 0,
            problemSolving: 0,
          });
        }
      } else {
        setHasCompletedEvaluations(false);
        setSkillProgress({
          interviewSkills: 0,
          technicalKnowledge: 0,
          communication: 0,
          problemSolving: 0,
        });
      }
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const userName = user?.name ? user.name.split(" ")[0] : "Candidate";

  const recentInterviews = useMemo(() => {
    if (!dashboardData.interviewHistory?.interviews) return [];
    return dashboardData.interviewHistory.interviews.slice(0, 5);
  }, [dashboardData.interviewHistory]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#FFFCF8] text-[#2B211C] flex flex-col font-sans selection:bg-[#F9E6D4] selection:text-[#E85D04]">
        <Navbar />
        <Sidebar userType="learner" />

        <main className="md:ml-64 ml-0 pt-6 pb-24 md:pb-16 flex-1 px-4 sm:px-6 lg:px-10 max-w-none min-w-0">
          {/* Top Command Center Header */}
          <header className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-[#E8D9CC] pb-6">
            <div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E8D9CC] text-xs text-[#B94308] font-semibold uppercase tracking-wider w-fit mb-2 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E85D04] animate-pulse" />
                <span>Executive Candidate Portal</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold tracking-tight text-[#2B211C]">
                {greeting},{" "}
                <span className="gradient-brand-text">
                  {userName}
                </span>
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/learner/interview/setup"
                className="btn-brand-primary whitespace-nowrap shadow-sm text-sm px-5 py-2.5"
              >
                <Play size={14} className="fill-white" />
                <span>Launch Interview Simulation</span>
              </Link>
            </div>
          </header>

          {/* Large Feature Hero Section: AI INTERVIEWER */}
          <section className="mb-10 rounded-2xl bg-[#FFFFFF] border border-[#E8D9CC] shadow-sm p-6 sm:p-8 lg:p-10 relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="max-w-2xl space-y-4">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#2B211C] tracking-tight leading-tight">
                  Autonomous Interview Simulation Engine
                </h2>

                <p className="text-[#70645C] text-sm sm:text-base leading-relaxed font-normal">
                  Low-latency conversational voice evaluation, intelligent multi-turn cross-examination, and automated integrity proctoring calibrated to your target discipline.
                </p>

                {/* Practice Mode Selector Pills */}
                <div className="pt-2">
                  <span className="text-xs uppercase font-semibold tracking-wider text-[#70645C] block mb-2.5">
                    Select Evaluation Track:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-xl">
                    {[
                      { id: "technical", label: "Technical Systems", icon: Target },
                      { id: "behavioral", label: "Behavioral & STAR", icon: Users },
                      { id: "case_study", label: "Case Strategy", icon: BookOpen },
                      { id: "mixed", label: "Comprehensive", icon: Zap },
                    ].map((mode) => {
                      const Icon = mode.icon;
                      const isSelected = selectedPracticeType === mode.id;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setSelectedPracticeType(mode.id as any)}
                          className={`flex items-center gap-2 min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04] ${
                            isSelected
                              ? "bg-[#FFF7EF] text-[#E85D04] border-[#E85D04] shadow-xs ring-1 ring-[#E85D04]"
                              : "bg-white text-[#70645C] border-[#E8D9CC] hover:border-[#E85D04] hover:text-[#2B211C]"
                          }`}
                        >
                          <Icon size={14} className={isSelected ? "text-[#E85D04]" : "text-[#70645C]"} />
                          <span>{mode.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Action CTA */}
                <div className="pt-4 flex flex-wrap items-center gap-4">
                  <Link
                    href={`/learner/interview/setup?mode=${selectedPracticeType}`}
                    className="btn-brand-primary whitespace-nowrap shadow-sm text-sm px-6 py-2.5"
                  >
                    <Play size={14} className="fill-white" />
                    <span>Initialize Simulation</span>
                  </Link>

                  <span className="text-xs text-[#70645C] font-mono">
                    Calibrated Rubric • Full Proctoring Active
                  </span>
                </div>
              </div>

              {/* AI Visual / Avatar Showcase with animated radar pulse */}
              <div className="flex flex-col items-center justify-center lg:pr-6">
                <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-[#FFF0E6] p-1 border border-[#E8D9CC] shadow-md flex items-center justify-center">
                  <div className="absolute inset-2 rounded-full border border-[#E85D04]/25 animate-pulse" />
                  <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-white border border-[#E8D9CC] flex flex-col items-center justify-center shadow-inner relative">
                    <Bot size={40} className="text-[#E85D04]" />
                    <span className="text-[11px] uppercase font-mono font-bold tracking-wider text-[#E85D04] mt-1">
                      TOPPLACED AI
                    </span>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFFFFF] border border-[#E8D9CC] text-xs font-semibold text-[#70645C]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                    Simulation Engine Ready
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* PERFORMANCE TELEMETRY */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#70645C]">
                Performance Telemetry
              </h3>
              <span className="text-xs text-[#70645C]">Real-time candidate metrics</span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Stat 1: Total Interviews */}
              <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E8D9CC] shadow-xs hover:shadow-md hover:border-[#E85D04] transition-all">
                <div className="flex items-center justify-between text-[#70645C] mb-2">
                  <span className="text-xs font-medium">Completed Simulations</span>
                  <Target size={16} className="text-[#70645C]" />
                </div>
                <div className="text-3xl font-extrabold text-[#2B211C]">
                  <MetricCounter value={interviewsCount} />
                </div>
                <p className="text-xs text-[#70645C] mt-1">
                  Evaluated sessions
                </p>
              </div>

              {/* Stat 2: Average Score */}
              <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E8D9CC] shadow-xs hover:shadow-md hover:border-[#E85D04] transition-all">
                <div className="flex items-center justify-between text-[#70645C] mb-2">
                  <span className="text-xs font-medium">Composite Score</span>
                  <Trophy size={16} className="text-[#E85D04]" />
                </div>
                <div className="text-3xl font-extrabold text-[#E85D04]">
                  <MetricCounter value={avgScore} suffix="%" />
                </div>
                <p className="text-xs text-[#70645C] mt-1">
                  Normalized benchmark
                </p>
              </div>

              {/* Stat 3: Practice Time */}
              <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E8D9CC] shadow-xs hover:shadow-md hover:border-[#E85D04] transition-all">
                <div className="flex items-center justify-between text-[#70645C] mb-2">
                  <span className="text-xs font-medium">Simulation Duration</span>
                  <Clock size={16} className="text-[#70645C]" />
                </div>
                <div className="text-3xl font-extrabold text-[#2B211C]">
                  <MetricCounter value={totalPracticeMinutes} suffix=" min" />
                </div>
                <p className="text-xs text-[#70645C] mt-1">
                  Active spoken discourse
                </p>
              </div>

              {/* Stat 4: Remaining Credits */}
              <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E8D9CC] shadow-xs hover:shadow-md hover:border-[#E85D04] transition-all">
                <div className="flex items-center justify-between text-[#70645C] mb-2">
                  <span className="text-xs font-medium">Available Allocations</span>
                  <CreditCard size={16} className="text-[#E85D04]" />
                </div>
                <div className="text-3xl font-extrabold text-[#E85D04]">
                  <MetricCounter value={creditsRemaining} />
                </div>
                <p className="text-xs text-emerald-700 mt-1 flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  Ready for deployment
                </p>
              </div>
            </div>
          </section>

          {/* Two-Column Grid: PROGRESS & RECENT INTERVIEWS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
            {/* PROGRESS (4 Columns on LG) */}
            <div className="lg:col-span-4 p-6 rounded-2xl bg-[#FFFFFF] border border-[#E8D9CC] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-base font-bold text-[#2B211C]">Competency Matrix</h3>
                    <p className="text-xs text-[#70645C]">Aggregated across completed evaluations</p>
                  </div>
                  <TrendingUp size={18} className="text-[#E85D04]" />
                </div>

                {!hasCompletedEvaluations ? (
                  /* Verified Dynamic Empty State when 0 evaluations are completed */
                  <div className="py-8 px-4 rounded-xl border border-dashed border-[#E8D9CC] text-center bg-[#FFFCF8]/80 my-2">
                    <Target size={32} className="text-[#70645C] mx-auto mb-2 opacity-70" />
                    <h4 className="text-sm font-bold text-[#2B211C] mb-1">No Evaluated Sessions Yet</h4>
                    <p className="text-xs text-[#70645C] leading-relaxed max-w-xs mx-auto mb-4">
                      Complete your first AI interview simulation to generate your verified competency matrix across technical, communication, and problem-solving benchmarks.
                    </p>
                    <Link
                      href="/learner/interview/setup"
                      className="btn-brand-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-brand-glow transition-all"
                    >
                      <span>Launch Initial Interview</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[
                      { label: "Delivery & Presence", value: skillProgress.interviewSkills, color: "bg-[#E85D04]" },
                      { label: "Domain & Architecture", value: skillProgress.technicalKnowledge, color: "bg-[#E85D04]" },
                      { label: "Structured Communication (STAR)", value: skillProgress.communication, color: "bg-[#D97706]" },
                      { label: "Analytical Problem Solving", value: skillProgress.problemSolving, color: "bg-[#F59E0B]" },
                    ].map((skill, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#70645C] font-medium">{skill.label}</span>
                          <span className="font-mono text-[#E85D04] font-bold">
                            {skill.value}%
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#FFF0E6] border border-[#E8D9CC] overflow-hidden">
                          <div
                            className={`h-full ${skill.color} rounded-full transition-all duration-1000 ease-out`}
                            style={{ width: `${Math.max(4, skill.value)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-[#E8D9CC] mt-6">
                <Link
                  href="/learner/interview/setup"
                  className="w-full py-2.5 rounded-xl bg-[#FFFCF8] hover:bg-[#E85D04] text-[#2B211C] hover:text-white border border-[#E8D9CC] hover:border-[#E85D04] text-xs font-semibold text-center block transition-all shadow-xs"
                >
                  Improve Competency Index →
                </Link>
              </div>
            </div>

            {/* RECENT INTERVIEWS (8 Columns on LG) */}
            <div className="lg:col-span-8 p-6 rounded-2xl bg-[#FFFFFF] border border-[#E8D9CC] shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-[#2B211C]">Recent Evaluations</h3>
                  <p className="text-xs text-[#70645C]">Session audits, proctoring records, and performance scores</p>
                </div>
                <Link
                  href="/learner/history"
                  className="text-xs text-[#E85D04] hover:text-[#E85D04] hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>View Full Audit History</span>
                  <ChevronRight size={14} />
                </Link>
              </div>

              {recentInterviews.length === 0 ? (
                /* Empty State */
                <div className="py-12 px-4 rounded-xl border border-dashed border-[#E8D9CC] text-center bg-[#FFFCF8]/70">
                  <Bot size={36} className="text-[#70645C] mx-auto mb-3 opacity-60" />
                  <h4 className="text-sm font-semibold text-[#2B211C] mb-1">No Evaluations Recorded</h4>
                  <p className="text-xs text-[#70645C] max-w-md mx-auto mb-4 leading-relaxed">
                    Complete your initial simulation session to populate performance telemetry, STAR breakdown metrics, and proctoring integrity logs.
                  </p>
                  <Link
                    href="/learner/interview/setup"
                    className="btn-brand-primary inline-flex items-center gap-1.5 min-h-[44px] px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-brand-glow transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04]"
                  >
                    <Play size={13} className="fill-white" />
                    <span>Initialize First Simulation</span>
                  </Link>
                </div>
              ) : (
                /* Clean Rows */
                <div className="divide-y divide-[#E8D9CC]">
                  {recentInterviews.map((item: any, idx: number) => {
                    const rawRole = item.role || item.category || "Technical Interview";
                    const formattedRole = formatRoleName(rawRole);
                    const candName = formatCandidateName(item.candidateName, item.candidateEmail, user?.name || "Candidate");
                    const score = item.overallScore || item.scores?.overall || 0;
                    const dateFormatted = item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        : "Recent";

                    return (
                      <div
                        key={item._id || item.sessionId || idx}
                        className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-[#FFFCF8] px-3 rounded-xl transition-all border border-transparent hover:border-[#E8D9CC]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#FFF0E6] border border-[#E8D9CC] flex items-center justify-center text-[#E85D04] shrink-0 font-bold text-xs group-hover:scale-105 transition-transform">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-[#2B211C] group-hover:text-[#E85D04] transition-colors">
                                {formattedRole}
                              </h4>
                              <span className="text-[11px] text-[#70645C]">({candName})</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[#70645C] mt-0.5">
                              <span className="capitalize">{formatRoleName(item.category || "Technical")}</span>
                              <span>•</span>
                              <span className="capitalize">{item.level || "Intermediate"}</span>
                              <span>•</span>
                              <span className="font-mono text-[#70645C]">{dateFormatted}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                          <div className="text-right">
                            <div className="text-sm font-bold font-mono text-[#2B211C]">
                              {score > 0 ? `${score}%` : "In Progress"}
                            </div>
                            <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold font-mono inline-block mt-0.5">
                              Completed
                            </span>
                          </div>

                          <Link
                            href={`/learner/interview/results?id=${item._id || item.sessionId}&sessionId=${item.sessionId || item._id}`}
                            className="text-xs min-h-[44px] py-2 px-3.5 rounded-xl bg-[#FFFCF8] hover:bg-[#E85D04] text-[#2B211C] hover:text-white border border-[#E8D9CC] hover:border-[#E85D04] flex items-center gap-1.5 font-semibold transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04]"
                          >
                            <span>Review Scorecard</span>
                            <ArrowRight size={13} className="text-[#70645C] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}
