"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import {
  Play,
  Code,
  Users,
  Brain,
  Briefcase,
  FileText,
  Check,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Zap,
  Target,
  BookOpen,
  ShieldCheck,
  Clock,
  Award,
  Terminal,
  Mic,
  MessageSquare,
  HelpCircle,
  Cloud,
  Globe,
  Search,
  Package,
  Monitor,
  Building2,
  Rocket,
  Compass,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import BottomNav from "@/components/BottomNav";
import { RedSunBackdrop, RedSunCheckItem } from "@/components/marketing/RedSunPrimitives";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { InterviewLevel } from "@/types/interview-schema";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const REDSUN_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export default function InterviewSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") || "technical";

  const { user, token } = useSelector((state: RootState) => state.auth);

  // Active step in the 5-step guided flow (1 to 5)
  const [currentStep, setCurrentStep] = useState(1);
  const [maxStepReached, setMaxStepReached] = useState(1);

  useEffect(() => {
    setMaxStepReached((prev) => Math.max(prev, currentStep));
  }, [currentStep]);

  // Selections
  const [interviewType, setInterviewType] = useState<
    "technical" | "behavioral" | "case_study" | "mixed"
  >(
    (initialMode as any) || "technical"
  );
  const [selectedDuration, setSelectedDuration] = useState("45");
  const [selectedLevel, setSelectedLevel] = useState<string>(InterviewLevel.INTERMEDIATE);
  const [selectedPrimaryCategory, setSelectedPrimaryCategory] = useState("development");
  const [selectedCategory, setSelectedCategory] = useState("frontend");
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [selectedTargetCompany, setSelectedTargetCompany] = useState<string>("general");
  const [tailorToResume, setTailorToResume] = useState<boolean>(true);

  // Plans & credits
  const [freeInterviewsUsed, setFreeInterviewsUsed] = useState(0);
  const [freeInterviewsLimit, setFreeInterviewsLimit] = useState(2);
  const [hasPaidPlan, setHasPaidPlan] = useState(false);
  const [interviewCredits, setInterviewCredits] = useState(0);
  const [purchasedPlans, setPurchasedPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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

        if (!response.ok) return;
        const data = await response.json();
        setFreeInterviewsUsed(data.freeInterviewsUsed || 0);
        setHasPaidPlan(data.hasPaidPlan || false);
        setFreeInterviewsLimit(data.freeInterviewsLimit ?? 2);
      } catch (error) {
        console.warn("Trial usage fetch error:", error);
      }
    };

    const fetchPlan = async () => {
      try {
        const res = await fetch(`${API_URL}/payments/plan`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const plan = await res.json();
          setInterviewCredits(plan.interviewCredits || 0);
          setPurchasedPlans(plan.purchasedPlans || []);
        }
      } catch {}
    };

    if (user?._id && token) {
      checkFreeTrialUsage();
      fetchPlan();
    }
  }, [user?._id, token]);

  // Step 1 Definitions: Interview Types & Durations
  const interviewTypes = [
    {
      id: "technical",
      title: "Technical Systems & Architecture",
      description: "Distributed architectures, algorithms, data structures, and system design.",
      icon: Target,
      badge: "Industry Standard",
      sampleQuestion:
        "Design a distributed key-value cache (LRU eviction) handling 50K writes/sec with high availability and partition tolerance.",
      competencies: [
        {
          name: "System Design & Scalability",
          weight: "35%",
          description: "How well you design systems that can handle growth and heavy traffic.",
        },
        {
          name: "Code Quality & Efficiency",
          weight: "35%",
          description: "How clearly and efficiently you solve coding problems.",
        },
        {
          name: "Concurrency & Design Trade-offs",
          weight: "30%",
          description: "How well you handle simultaneous operations and explain the pros and cons of your decisions.",
        },
      ],
      formatFeatures: [
        {
          title: "Coding Editor",
          description: "Write and test code during the interview.",
          icon: Code,
        },
        {
          title: "Interactive Terminal",
          description: "Run commands and test your solution.",
          icon: Terminal,
        },
        {
          title: "AI Voice Interview",
          description: "Answer the AI interviewer using your voice.",
          icon: Mic,
        },
      ],
      tip: "Define API contracts and schema first, state time and space complexity explicitly, and discuss SQL vs NoSQL database trade-offs.",
    },
    {
      id: "behavioral",
      title: "Behavioral & Executive Leadership",
      description: "STAR methodology, stakeholder diplomacy, leadership principles, and cultural fit.",
      icon: Users,
      badge: "Leadership Track",
      sampleQuestion:
        "Tell me about a high-stakes engineering disagreement with leadership. How did you build consensus and what was the quantifiable business impact?",
      competencies: [
        {
          name: "STAR Structure & Metrics",
          weight: "35%",
          description: "How clearly you structure your answers (Situation, Task, Action, Result) with measurable metrics.",
        },
        {
          name: "Stakeholder EQ & Diplomacy",
          weight: "35%",
          description: "How effectively you collaborate, resolve disagreements, and communicate with partners.",
        },
        {
          name: "Ownership & Leadership Fit",
          weight: "30%",
          description: "How well you take initiative, take accountability, and uphold core leadership values.",
        },
      ],
      formatFeatures: [
        {
          title: "AI Voice Interview",
          description: "Answer the AI interviewer using your voice.",
          icon: Mic,
        },
        {
          title: "Real-Time Speech-to-Text",
          description: "Instant spoken transcript and response tracking.",
          icon: MessageSquare,
        },
      ],
      tip: "Structure every story as Situation → Task → Action → Result. Always cite concrete metrics (e.g., 'reduced latency by 32%').",
    },
    {
      id: "case_study",
      title: "Strategic Case & Problem Solving",
      description: "Business scenarios, tradeoff analyses, and structured analytical problem-solving.",
      icon: BookOpen,
      badge: "Analytical Bar",
      sampleQuestion:
        "A sudden 25% drop in checkout conversions occurred after Friday's deploy. Detail your 5-minute diagnostic triage and rollback strategy.",
      competencies: [
        {
          name: "Incident Triage & Root Cause",
          weight: "35%",
          description: "How systematically you diagnose unexpected system failures and identify root causes.",
        },
        {
          name: "Cost vs Latency Trade-offs",
          weight: "35%",
          description: "How thoughtfully you balance budget, operational complexity, and performance.",
        },
        {
          name: "Structured Problem Solving",
          weight: "30%",
          description: "How well you break complex, ambiguous business problems into logical steps.",
        },
      ],
      formatFeatures: [
        {
          title: "AI Voice Interview",
          description: "Answer the AI interviewer using your voice.",
          icon: Mic,
        },
        {
          title: "Analytical Workspace",
          description: "Deconstruct business challenges and scenario trade-offs.",
          icon: Brain,
        },
      ],
      tip: "Ask clarifying questions before proposing solutions; validate your assumptions with data metrics before recommending fixes.",
    },
    {
      id: "mixed",
      title: "Comprehensive Multi-Track",
      description: "Holistic multi-competency evaluation matching Tier-1 enterprise hiring panels.",
      icon: Zap,
      badge: "Full Simulation",
      sampleQuestion:
        "Round 1: Distributed architecture & live coding → Round 2: Production failure recovery → Round 3: Team leadership under crisis.",
      competencies: [
        {
          name: "Full-Stack System Architecture",
          weight: "35%",
          description: "How well you architect scalable front-to-back distributed systems.",
        },
        {
          name: "Live Coding & Algorithm Hygiene",
          weight: "35%",
          description: "How cleanly, accurately, and efficiently you write production code.",
        },
        {
          name: "Executive STAR Communication",
          weight: "30%",
          description: "How persuasively and clearly you articulate technical reasoning and impact.",
        },
      ],
      formatFeatures: [
        {
          title: "Coding Editor",
          description: "Write and test code during live coding rounds.",
          icon: Code,
        },
        {
          title: "Interactive Terminal",
          description: "Run commands and verify execution outputs.",
          icon: Terminal,
        },
        {
          title: "AI Voice Interview",
          description: "Answer the AI interviewer using your voice.",
          icon: Mic,
        },
      ],
      tip: "Pace your energy smoothly across both coding and behavioral rounds. Explain your thought process and edge cases aloud as you code.",
    },
  ];

  const durations = [
    { value: "30", label: "30 Mins", sub: "Focused Diagnostic" },
    { value: "45", label: "45 Mins", sub: "Standard Recommended" },
    { value: "60", label: "60 Mins", sub: "In-Depth Architectural" },
  ];

  // Step 2 Definitions: Levels
  const levels = [
    {
      id: InterviewLevel.BEGINNER,
      title: "Associate / Early Career",
      subtitle: "0–2 Years Experience",
      description: "Core computer science fundamentals, code hygiene, and baseline problem-solving.",
      icon: Compass,
    },
    {
      id: InterviewLevel.INTERMEDIATE,
      title: "Mid-Level Professional",
      subtitle: "2–5 Years Experience",
      description: "Production system architecture, microservices, concurrency, and trade-off balancing.",
      icon: Zap,
      recommended: true,
    },
    {
      id: InterviewLevel.ADVANCED,
      title: "Senior / Principal Lead",
      subtitle: "5+ Years Experience",
      description: "Distributed scale, technical strategy, high-stakes decision-making, and cross-team leadership.",
      icon: Award,
    },
  ];

  // Step 3 Definitions: Primary Fields & Roles
  const primaryFields = [
    { id: "development", name: "Development", icon: Code, desc: "Frontend, Backend, Fullstack, Mobile" },
    { id: "marketing", name: "Marketing", icon: Users, desc: "Digital, SEO, Content, Growth" },
    { id: "analyst", name: "Data & Analytics", icon: Brain, desc: "Data Analyst, BI, Financial" },
    { id: "hr", name: "Human Resources", icon: Briefcase, desc: "Recruiting, People Partner, Ops" },
    { id: "design-cloud", name: "Cloud & DevOps", icon: Cloud, desc: "AWS, Kubernetes, DevOps, Architecture" },
  ];

  const categoryOptions: Record<
    string,
    Array<{ id: string; name: string; desc: string; hasCodeEditor: boolean; languages: string[] }>
  > = {
    development: [
      {
        id: "frontend",
        name: "Frontend Developer",
        desc: "React, Next.js, TypeScript, Browser APIs, State Management",
        hasCodeEditor: true,
        languages: ["javascript", "typescript", "react", "nextjs", "vue"],
      },
      {
        id: "backend",
        name: "Backend Developer",
        desc: "Node.js, Python, Databases, REST APIs, Microservices",
        hasCodeEditor: true,
        languages: ["python", "javascript", "java", "golang", "sql"],
      },
      {
        id: "fullstack",
        name: "Full Stack Engineer",
        desc: "End-to-end web architecture, client-server lifecycle, SQL/NoSQL",
        hasCodeEditor: true,
        languages: ["javascript", "typescript", "python", "react"],
      },
      {
        id: "mobile",
        name: "Mobile Developer",
        desc: "React Native, Flutter, Swift, Kotlin, Mobile Performance",
        hasCodeEditor: true,
        languages: ["react-native", "flutter", "swift", "kotlin"],
      },
    ],
    marketing: [
      {
        id: "DIGITAL_MARKETING",
        name: "Digital Marketing Specialist",
        desc: "PPC, Google Ads, Meta Ads, Funnel Optimization, ROAS",
        hasCodeEditor: false,
        languages: ["google-ads", "meta-ads", "analytics", "seo"],
      },
      {
        id: "CONTENT_MARKETING",
        name: "Content Strategist",
        desc: "Editorial planning, SEO storytelling, engagement metrics",
        hasCodeEditor: false,
        languages: ["seo-content", "copywriting", "social-media"],
      },
    ],
    analyst: [
      {
        id: "DATA_ANALYST",
        name: "Data Analyst",
        desc: "SQL, Python, Data Warehousing, Tableau, BI Reporting",
        hasCodeEditor: true,
        languages: ["sql", "python", "tableau", "power-bi"],
      },
      {
        id: "BUSINESS_ANALYST",
        name: "Business Analyst",
        desc: "Requirements scoping, Agile workflows, stakeholder analysis",
        hasCodeEditor: false,
        languages: ["requirements", "agile", "process-modeling"],
      },
    ],
    hr: [
      {
        id: "HR_GENERALIST",
        name: "HR Generalist",
        desc: "Onboarding, compensation, compliance, employee relations",
        hasCodeEditor: false,
        languages: ["talent-acquisition", "compliance", "employee-relations"],
      },
      {
        id: "HR_RECRUITER",
        name: "Technical Recruiter",
        desc: "Sourcing pipelines, candidate closing, ATS workflows",
        hasCodeEditor: false,
        languages: ["sourcing", "screening", "ats"],
      },
    ],
    "design-cloud": [
      {
        id: "DEVOPS_ENGINEER",
        name: "DevOps & SRE",
        desc: "CI/CD pipelines, Docker, Kubernetes, Linux, Monitoring",
        hasCodeEditor: true,
        languages: ["docker", "kubernetes", "bash", "aws", "terraform"],
      },
      {
        id: "CLOUD_ARCHITECT",
        name: "Cloud Architect",
        desc: "AWS, GCP, Azure, multi-cloud security, high-availability",
        hasCodeEditor: true,
        languages: ["aws", "azure", "gcp", "system-design"],
      },
    ],
  };

  // Switch primary category
  const handlePrimaryFieldChange = (fieldId: string) => {
    setSelectedPrimaryCategory(fieldId);
    const roles = categoryOptions[fieldId] || [];
    if (roles.length > 0) {
      setSelectedCategory(roles[0].id);
      setSelectedLanguage(roles[0].languages[0] || "general");
    }
  };

  // Switch role category
  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    const roles = categoryOptions[selectedPrimaryCategory] || [];
    const role = roles.find((r) => r.id === catId);
    if (role && role.languages.length > 0) {
      setSelectedLanguage(role.languages[0]);
    }
  };

  const currentRole = useMemo(() => {
    const roles = categoryOptions[selectedPrimaryCategory] || [];
    return roles.find((r) => r.id === selectedCategory) || roles[0];
  }, [selectedPrimaryCategory, selectedCategory]);

  // Target Company Presets
  const companyTracks = [
    {
      id: "general",
      name: "General Enterprise",
      sub: "Standard hiring bar, system design & behavioral fit",
      icon: Globe,
      tag: "Standard",
    },
    {
      id: "google",
      name: "Google (L4 / L5)",
      sub: "Scale to billions, Big-O algorithmic rigor, Googleyness",
      icon: Search,
      tag: "Tier-1 Big Tech",
    },
    {
      id: "amazon",
      name: "Amazon (SDE / LP)",
      sub: "14 Leadership Principles, Bar Raiser, strict STAR data metrics",
      icon: Package,
      tag: "Bar Raiser",
    },
    {
      id: "microsoft",
      name: "Microsoft",
      sub: "Enterprise reliability, clean API design & cross-team collaboration",
      icon: Monitor,
      tag: "Enterprise",
    },
    {
      id: "meta",
      name: "Meta / Facebook",
      sub: "High concurrency, fast iteration, caching & distributed scale",
      icon: Sparkles,
      tag: "Fast Iteration",
    },
    {
      id: "tcs_infosys",
      name: "TCS / Infosys",
      sub: "OOPs / SOLID, SQL normalization, core CS fundamentals & projects",
      icon: Building2,
      tag: "Services Bar",
    },
    {
      id: "tier1_startup",
      name: "High-Growth Startup",
      sub: "Full-stack end-to-end ownership, velocity vs scale trade-offs",
      icon: Rocket,
      tag: "Fast-Paced",
    },
  ];

  // Launch interview
  const handleLaunch = () => {
    setLoading(true);

    const fieldMapping: Record<string, string> = {
      development: "DEVELOPMENT",
      marketing: "MARKETING",
      analyst: "ANALYST",
      hr: "HR",
      "design-cloud": "DESIGN_CLOUD",
    };

    const categoryMapping: Record<string, string> = {
      frontend: "FRONTEND_DEVELOPER",
      backend: "BACKEND_DEVELOPER",
      fullstack: "FULL_STACK_DEVELOPER",
      mobile: "MOBILE_DEVELOPER",
      DIGITAL_MARKETING: "DIGITAL_MARKETING",
      CONTENT_MARKETING: "CONTENT_MARKETING",
      DATA_ANALYST: "DATA_ANALYST",
      BUSINESS_ANALYST: "BUSINESS_ANALYST",
      HR_GENERALIST: "HR_GENERALIST",
      HR_RECRUITER: "HR_RECRUITER",
      DEVOPS_ENGINEER: "DEVOPS_ENGINEER",
      CLOUD_ARCHITECT: "CLOUD_ARCHITECT",
    };

    const backendField = fieldMapping[selectedPrimaryCategory] || "DEVELOPMENT";
    const backendCategory = categoryMapping[selectedCategory] || "FULL_STACK_DEVELOPER";

    const modeMapping: Record<string, string> = {
      technical: "technical_assessment",
      behavioral: "behavioral",
      case_study: "scenario",
      mixed: "final_assessment",
    };
    const backendInterviewMode = modeMapping[interviewType] || "mock_interview";

    const params = new URLSearchParams({
      level: selectedLevel,
      category: backendCategory,
      field: backendField,
      duration: selectedDuration,
      language: selectedLanguage,
      hasCodeEditor: (currentRole?.hasCodeEditor || false).toString(),
      targetCompany: selectedTargetCompany,
      tailorToResume: tailorToResume.toString(),
      interviewMode: backendInterviewMode,
      userId: user?._id || "",
      userName: user?.name || "",
      userEmail: user?.email || "",
      isFreeInterview:
        selectedDuration === "30" && !hasPaidPlan && interviewCredits <= 0
          ? "true"
          : "false",
    });

    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "interview_customization",
        JSON.stringify({
          interviewMode: backendInterviewMode,
          interviewType,
          resumeText: resumeText.trim(),
          jobDescription: jobDescription.trim(),
          targetCompany: selectedTargetCompany,
          tailorToResume: tailorToResume,
        })
      );
    }

    router.push(`/learner/interview/voice-session?${params.toString()}`);
  };

  // Steps definition for top progress indicator (Streamlined 3-Step Wizard)
  const steps = [
    { number: "01", title: "Target Track & Role", shortTitle: "Track & Role" },
    { number: "02", title: "Seniority & Duration", shortTitle: "Level & Time" },
    { number: "03", title: "Review & Launch", shortTitle: "Review & Launch" },
  ];

  const activeTrack =
    interviewTypes.find((t) => t.id === interviewType) || interviewTypes[0];
  const activeStepMeta = steps[currentStep - 1] || steps[0];

  return (
    <MotionConfig reducedMotion="user">
      <ProtectedRoute theme="redsun">
        <div className="redsun-theme min-h-screen bg-[#FFFCF8] text-[#2B211C] flex flex-col relative overflow-x-clip">
          <RedSunBackdrop variant="subpage" />

          {loading && (
            <div className="fixed inset-0 z-[100] bg-[#FFFCF8]/90 backdrop-blur-xl flex items-center justify-center p-4">
              <div className="rounded-2xl bg-[#FFFFFF]/95 border border-[#E85D04]/35 px-8 py-7 text-center space-y-4 max-w-sm shadow-[0_0_50px_rgba(242,106,10,0.2)]">
                <div className="relative flex h-10 w-10 mx-auto items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E85D04] opacity-40" />
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-[#E85D04] shadow-[0_0_20px_#E85D04]" />
                </div>
                <p className="text-sm font-semibold text-[#2B211C] tracking-wide">
                  Calibrating TopPlaced AI Proctor &amp; Voice Synthesis Engines...
                </p>
              </div>
            </div>
          )}

          <Navbar />
          <Sidebar userType="learner" theme="redsun" />

          <div className="md:pl-64 flex-1 w-full flex flex-col relative z-10">
            <main className="pt-7 sm:pt-10 pb-28 md:pb-16 flex-1 px-4 sm:px-6 lg:px-10 max-w-none w-full mx-auto">
              {/* Page Introduction */}
            <motion.header
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: REDSUN_OUT_EXPO }}
              className="mb-8 sm:mb-10 text-center max-w-2xl mx-auto space-y-3"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFFCF8]/60 border border-[#E85D04]/25 text-[11px] font-mono font-semibold text-[#E85D04] uppercase tracking-[0.16em] shadow-[inset_0_-6px_14px_rgba(242,106,10,0.16)]">
                <span className="w-2 h-2 rounded-full bg-[#E85D04] shadow-[0_0_10px_#E85D04] animate-pulse" />
                <span>INTERVIEW CONFIGURATION</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-semibold tracking-tight leading-[1.16] text-[#2B211C]">
                Interview Simulation{" "}
                <span className="redsun-title-gradient">Configuration</span>
              </h1>

              <p className="text-sm sm:text-base text-[#70645C] leading-relaxed max-w-xl mx-auto">
                Specify seniority requirements and domain context to personalize evaluation criteria.
              </p>

              {(hasPaidPlan || interviewCredits > 0 || freeInterviewsLimit > 0) && (
                <div className="pt-1 flex flex-wrap items-center justify-center gap-2 text-xs text-[#70645C]">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFFFFF]/90 border border-[#E8D9CC]">
                    <Clock className="w-3.5 h-3.5 text-[#E85D04]" />
                    <span className="font-mono tabular-nums text-[#2B211C] font-semibold">
                      {selectedDuration}m
                    </span>
                    <span>session window</span>
                  </span>
                  {hasPaidPlan || purchasedPlans.length > 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E85D04]/15 border border-[#E85D04]/35 text-[#E85D04]">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Active Pro Calibration</span>
                    </span>
                  ) : interviewCredits > 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFFFFF]/90 border border-[#E8D9CC]">
                      <span className="font-mono tabular-nums text-[#E85D04] font-semibold">
                        {interviewCredits}
                      </span>
                      <span>credits available</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFFFFF]/90 border border-[#E8D9CC]">
                      <span className="font-mono tabular-nums text-[#E85D04] font-semibold">
                        {Math.max(0, freeInterviewsLimit - freeInterviewsUsed)}/{freeInterviewsLimit}
                      </span>
                      <span>free calibrations left</span>
                    </span>
                  )}
                </div>
              )}
            </motion.header>

            {/* 3-Step Progress Indicator */}
            <motion.section
              aria-label="Configuration progress"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.08, ease: REDSUN_OUT_EXPO }}
              className="mb-8 sm:mb-10 rounded-2xl bg-[#FFFFFF]/90 backdrop-blur-xl border border-[#E8D9CC] p-4 sm:p-5 shadow-sm shadow-[0_4px_20px_rgba(48,32,22,0.06)]"
            >
              <div className="grid grid-cols-3 gap-2 sm:gap-4 relative">
                {steps.map((st, idx) => {
                  const stepNum = idx + 1;
                  const isComplete = currentStep > stepNum;
                  const isCurrent = currentStep === stepNum;
                  const isVisited = maxStepReached >= stepNum;
                  const canJump = stepNum <= currentStep || isComplete || isVisited;

                  return (
                    <button
                      key={st.number}
                      type="button"
                      disabled={!canJump}
                      aria-current={isCurrent ? "step" : undefined}
                      aria-label={`Step ${st.number}: ${st.title}`}
                      onClick={() => {
                        if (canJump) {
                          setCurrentStep(stepNum);
                        }
                      }}
                      className={`group flex flex-col items-center justify-center text-center min-h-[56px] sm:min-h-[68px] px-1 sm:px-2 py-2 rounded-xl border transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04] ${
                        isCurrent
                          ? "bg-[#E85D04]/15 border-[#E85D04]/45 text-[#E85D04] shadow-[inset_0_-8px_20px_rgba(242,106,10,0.16)] cursor-pointer"
                          : isComplete || isVisited
                          ? "bg-[#FFFCF8]/90 border-[#E85D04]/25 text-[#E85D04] hover:border-[#E85D04]/55 cursor-pointer"
                          : "bg-transparent border-transparent text-[#70645C] cursor-not-allowed opacity-75"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold mb-1.5 transition-all duration-300 ${
                          isCurrent
                            ? "bg-[#E85D04] text-white shadow-[0_0_20px_rgba(242,106,10,0.55)] scale-105"
                            : isComplete
                            ? "bg-[#E85D04]/25 text-[#E85D04] border border-[#E85D04]/55"
                            : "bg-[#FFFCF8] text-[#70645C] border border-white/[0.1]"
                        }`}
                      >
                        {isComplete ? <Check size={14} strokeWidth={2.75} /> : st.number}
                      </div>
                      <span
                        className={`text-[11px] sm:text-xs font-medium hidden sm:block whitespace-nowrap ${
                          isCurrent
                            ? "text-[#E85D04] font-semibold"
                            : isComplete
                            ? "text-[#E85D04]"
                            : "text-[#70645C]"
                        }`}
                      >
                        <span className="lg:hidden">{st.shortTitle}</span>
                        <span className="hidden lg:inline">{st.title}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Mobile Compact Active Step Readout */}
              <div className="sm:hidden mt-3 flex items-center justify-between text-xs px-1">
                <span className="font-mono text-[#E85D04] font-semibold">
                  Step {activeStepMeta.number} of 05
                </span>
                <span className="font-semibold text-[#2B211C]">{activeStepMeta.title}</span>
              </div>

              {/* Animated Solar Orange Progress Track */}
              <div className="mt-3.5 w-full bg-[#FFFCF8] border border-[#E8D9CC] h-1.5 rounded-full overflow-hidden">
                <motion.div
                  initial={false}
                  animate={{ width: `${((currentStep - 1) / 4) * 100}%` }}
                  transition={{ duration: 0.45, ease: REDSUN_OUT_EXPO }}
                  className="h-full bg-gradient-to-r from-[#E85D04] via-[#E85D04] to-[#E85D04] rounded-full shadow-[0_0_12px_rgba(242,106,10,0.6)]"
                />
              </div>
            </motion.section>

            {/* ================= ACTIVE WIZARD STEP CONTENT ================= */}
            <AnimatePresence mode="wait">
              {/* ================= STEP 1: INTERVIEW TYPE ================= */}
              {currentStep === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.32, ease: REDSUN_OUT_EXPO }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-lg font-semibold text-[#2B211C] tracking-tight">
                      <span className="font-mono text-[#E85D04] mr-2">01.</span>
                      Target Track, Domain &amp; Functional Role
                    </h2>
                    <p className="text-xs sm:text-sm text-[#70645C] mt-1">
                      Choose your engineering domain, target role, and interview simulation methodology.
                    </p>
                  </div>

                  {/* Primary Field Selection Pills */}
                  <div>
                    <label className="text-xs uppercase font-mono tracking-wider text-[#70645C] block mb-3">
                      Primary Domain:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      {primaryFields.map((f) => {
                        const Icon = f.icon;
                        const isSelected = selectedPrimaryCategory === f.id;

                        return (
                          <motion.button
                            key={f.id}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => handlePrimaryFieldChange(f.id)}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className={`p-3.5 rounded-xl border text-left min-h-[78px] transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04] flex flex-col justify-between ${
                              isSelected
                                ? "border-[#E85D04] bg-[#E85D04]/15 ring-1 ring-[#E85D04]/35 shadow-[0_0_20px_rgba(242,106,10,0.16)]"
                                : "bg-[#FFFFFF]/90 border-[#E8D9CC] text-[#70645C] hover:text-[#2B211C] hover:border-[#E85D04]/40"
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <Icon
                                size={17}
                                className={isSelected ? "text-[#E85D04]" : "text-[#70645C]"}
                              />
                              {isSelected && (
                                <Check size={13} className="text-[#E85D04]" strokeWidth={3} />
                              )}
                            </div>
                            <div
                              className={`text-xs font-semibold mt-2 ${
                                isSelected ? "text-[#E85D04]" : "text-[#70645C]"
                              }`}
                            >
                              {f.name}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Role Cards for Selected Domain */}
                  <div>
                    <label className="text-xs uppercase font-mono tracking-wider text-[#70645C] block mb-3">
                      Target Role:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {(categoryOptions[selectedPrimaryCategory] || []).map((role) => {
                        const isSelected = selectedCategory === role.id;

                        return (
                          <motion.button
                            key={role.id}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => handleCategoryChange(role.id)}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className={`p-4 sm:p-5 rounded-xl cursor-pointer border text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04] ${
                              isSelected
                                ? "bg-[#FFFCF8]/95 border-[#E85D04] ring-1 ring-[#E85D04]/35 shadow-[0_0_24px_rgba(242,106,10,0.15),inset_0_-8px_20px_rgba(242,106,10,0.14)]"
                                : "bg-[#FFFFFF]/90 border-[#E8D9CC] hover:border-[#E85D04]/40"
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                              <h4 className="text-sm font-semibold text-[#2B211C] flex items-center gap-2">
                                <span>{role.name}</span>
                                {isSelected && (
                                  <Check size={14} className="text-[#E85D04]" strokeWidth={3} />
                                )}
                              </h4>
                              {role.hasCodeEditor && (
                                <span
                                  className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border ${
                                    isSelected
                                      ? "bg-[#E85D04]/20 text-[#E85D04] border-[#E85D04]/40 font-semibold"
                                      : "bg-[#FFFCF8] text-[#E85D04]/80 border-[#E8D9CC]"
                                  }`}
                                >
                                  Integrated Code Sandbox
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#70645C] leading-relaxed">{role.desc}</p>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Primary Tech Stack / Tool Pill Selector */}
                  {currentRole && currentRole.languages.length > 0 && (
                    <div className="pt-4 border-t border-[#E8D9CC]">
                      <label className="text-xs uppercase font-mono tracking-wider text-[#70645C] block mb-3">
                        Primary Language / Tool Specialization:
                      </label>
                      <div className="flex flex-wrap gap-2.5">
                        {currentRole.languages.map((lang) => {
                          const isSel = selectedLanguage === lang;
                          return (
                            <motion.button
                              key={lang}
                              type="button"
                              aria-pressed={isSel}
                              onClick={() => setSelectedLanguage(lang)}
                              whileHover={{ y: -1 }}
                              whileTap={{ scale: 0.98 }}
                              className={`px-4 py-2 min-h-[40px] rounded-xl text-xs font-mono uppercase transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04] inline-flex items-center gap-1.5 ${
                                isSel
                                  ? "bg-[#E85D04] text-white font-bold shadow-[0_0_20px_rgba(242,106,10,0.45)] border border-[#E85D04]/50"
                                  : "bg-[#FFFCF8] text-[#70645C] border border-[#E8D9CC] hover:text-[#2B211C] hover:border-[#E85D04]/40"
                              }`}
                            >
                              {isSel && <Check size={12} strokeWidth={3} />}
                              <span>{lang}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="pt-5 border-t border-[#E8D9CC] space-y-3">
                    <label className="text-xs uppercase font-mono tracking-wider text-[#70645C] block">
                      Select Evaluation Track:
                    </label>
                    {/* Four Evaluation Track Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
                    {interviewTypes.map((type) => {
                      const Icon = type.icon;
                      const isSelected = interviewType === type.id;

                      return (
                        <motion.button
                          key={type.id}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => setInterviewType(type.id as any)}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className={`group text-left p-5 sm:p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between min-h-[168px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04] ${
                            isSelected
                              ? "bg-[#FFFCF8]/95 border-[#E85D04] ring-1 ring-[#E85D04]/40 shadow-[0_0_32px_rgba(242,106,10,0.16),inset_0_-12px_30px_rgba(242,106,10,0.18)]"
                              : "bg-[#FFFFFF]/90 border-[#E8D9CC] hover:border-[#E85D04]/45 hover:bg-[#FFFCF8]"
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-3 mb-4">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                                  isSelected
                                    ? "bg-[#E85D04] border-[#E85D04]/70 text-white shadow-[0_6px_20px_rgba(242,106,10,0.45)] scale-105"
                                    : "bg-[#FFFCF8] border-[#E85D04]/25 text-[#E85D04] group-hover:border-[#E85D04]/50 group-hover:scale-105"
                                }`}
                              >
                                <Icon size={18} />
                              </div>

                              <div className="flex flex-wrap items-center justify-end gap-1.5">
                                {isSelected && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E85D04] text-white text-[11px] font-semibold shadow-[0_0_14px_rgba(242,106,10,0.45)]">
                                    <Check size={11} strokeWidth={3} />
                                    <span>Selected</span>
                                  </span>
                                )}
                                <span
                                  className={`text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full font-semibold border ${
                                    isSelected
                                      ? "bg-[#E85D04]/15 text-[#E85D04] border-[#E85D04]/35"
                                      : "bg-[#FFFCF8] text-[#70645C] border-[#E8D9CC]"
                                  }`}
                                >
                                  {type.badge}
                                </span>
                              </div>
                            </div>

                            <h3 className="text-base font-semibold text-[#2B211C] tracking-tight mb-1.5">
                              {type.title}
                            </h3>
                            <p className="text-xs sm:text-sm text-[#70645C] leading-relaxed">
                              {type.description}
                            </p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* What This Interview Covers Dynamic Inspector */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTrack.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.28, ease: REDSUN_OUT_EXPO }}
                      className="rounded-2xl border border-[#E8D9CC] bg-[#FFFFFF]/90 backdrop-blur-xl p-5 sm:p-6 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.9),inset_0_-10px_28px_rgba(242,106,10,0.08)] space-y-5"
                    >
                      {/* 1. Main Heading & Subtitle */}
                      <div className="border-b border-[#E8D9CC] pb-4">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-2.5 w-2.5 rounded-full bg-[#E85D04] shadow-[0_0_10px_#E85D04] animate-pulse" />
                          <h3 className="text-base sm:text-lg font-semibold text-[#2B211C] tracking-tight">
                            What This Interview Covers
                          </h3>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-semibold text-[#E85D04]">
                            {activeTrack.title}
                          </span>
                          <span className="text-[#70645C] hidden sm:inline">•</span>
                          <span className="text-[#70645C]">
                            See what you will be asked about and how your answers will be evaluated.
                          </span>
                        </div>
                      </div>

                      {/* 2. Interview Format */}
                      {activeTrack.formatFeatures && activeTrack.formatFeatures.length > 0 && (
                        <div className="space-y-2.5">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#70645C]">
                            Interview Format
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {activeTrack.formatFeatures.map((feat) => {
                              const FeatIcon = feat.icon;
                              return (
                                <div
                                  key={feat.title}
                                  className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FFFCF8]/90 border border-white/[0.07] text-xs transition-colors hover:border-[#E85D04]/30"
                                >
                                  <div className="p-2 rounded-lg bg-[#E85D04]/15 border border-[#E85D04]/30 text-[#E85D04] shrink-0">
                                    <FeatIcon size={15} />
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="font-semibold text-[#2B211C] block">
                                      {feat.title}
                                    </span>
                                    <span className="text-xs text-[#70645C] leading-relaxed block">
                                      {feat.description}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 3 & 4. Balanced 2-Column Desktop Grid for Sample Question & Scoring Criteria */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* 3. Example Interview Question */}
                        <div className="rounded-xl bg-[#FFFCF8]/85 border border-white/[0.07] p-4 flex flex-col justify-between space-y-3">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <HelpCircle size={15} className="text-[#E85D04]" />
                              <h4 className="text-xs font-semibold text-[#2B211C] uppercase tracking-wider">
                                Example Interview Question
                              </h4>
                            </div>
                            <div className="p-3.5 rounded-xl bg-[#FFFCF8]/90 border border-[#E8D9CC] shadow-[inset_0_-6px_16px_rgba(242,106,10,0.08)]">
                              <p className="text-xs sm:text-sm text-[#2B211C] italic leading-relaxed">
                                &ldquo;{activeTrack.sampleQuestion}&rdquo;
                              </p>
                            </div>
                          </div>
                          <p className="text-xs text-[#70645C] pt-2.5 border-t border-white/[0.07] leading-relaxed">
                            This is an example of the type of question you may encounter. Your actual interview questions may vary.
                          </p>
                        </div>

                        {/* 4. How Your Answers Are Scored */}
                        <div className="rounded-xl bg-[#FFFCF8]/85 border border-white/[0.07] p-4 flex flex-col justify-between space-y-3">
                          <div className="space-y-3.5">
                            <h4 className="text-xs font-semibold text-[#2B211C] uppercase tracking-wider">
                              How Your Answers Are Scored
                            </h4>
                            <div className="space-y-3">
                              {activeTrack.competencies.map((comp) => (
                                <div key={comp.name} className="space-y-1.5">
                                  <div className="flex items-center justify-between text-xs gap-2">
                                    <span className="font-semibold text-[#2B211C]">
                                      {comp.name}
                                    </span>
                                    <span className="font-mono text-xs font-bold text-[#E85D04] tabular-nums shrink-0">
                                      {comp.weight}
                                    </span>
                                  </div>
                                  <p className="text-xs text-[#70645C] leading-snug">
                                    {comp.description}
                                  </p>
                                  <div className="w-full bg-[#FFFCF8] h-1.5 rounded-full overflow-hidden border border-[#E8D9CC] mt-1">
                                    <div
                                      className="bg-gradient-to-r from-[#E85D04] via-[#E85D04] to-[#E85D04] h-full rounded-full transition-all duration-500"
                                      style={{ width: comp.weight }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-[#70645C] pt-2.5 border-t border-white/[0.07] leading-relaxed">
                            These percentages show how much each skill contributes to your overall evaluation.
                          </p>
                        </div>
                      </div>

                      {/* 5. Tip to Prepare Better */}
                      <div className="flex items-start gap-3 rounded-xl bg-[#E85D04]/10 border border-[#E85D04]/25 p-3.5 text-xs">
                        <Sparkles className="w-4 h-4 text-[#E85D04] shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <span className="font-semibold text-[#E85D04] block">
                            Tip to Prepare Better
                          </span>
                          <p className="text-xs text-[#70645C] leading-relaxed">
                            {activeTrack.tip}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.32, ease: REDSUN_OUT_EXPO }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-lg font-semibold text-[#2B211C] tracking-tight">
                      <span className="font-mono text-[#E85D04] mr-2">02.</span>
                      Experience Seniority &amp; Duration Calibration
                    </h2>
                    <p className="text-xs sm:text-sm text-[#70645C] mt-1">
                      Align AI question complexity, scoring rubrics, and time budget with your target career tier.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                    {levels.map((lvl) => {
                      const LvlIcon = lvl.icon;
                      const isSelected = selectedLevel === lvl.id;

                      return (
                        <motion.button
                          key={lvl.id}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => setSelectedLevel(lvl.id)}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className={`group p-5 sm:p-6 rounded-2xl cursor-pointer border text-left transition-all duration-300 flex flex-col justify-between min-h-[210px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04] ${
                            isSelected
                              ? "bg-[#FFFCF8]/95 border-[#E85D04] ring-1 ring-[#E85D04]/40 shadow-[0_0_32px_rgba(242,106,10,0.16),inset_0_-12px_30px_rgba(242,106,10,0.18)]"
                              : "bg-[#FFFFFF]/90 border-[#E8D9CC] hover:border-[#E85D04]/45 hover:bg-[#FFFCF8]"
                          }`}
                        >
                          <div className="w-full">
                            <div className="flex items-start justify-between gap-2 mb-4">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                                  isSelected
                                    ? "bg-[#E85D04] border-[#E85D04]/70 text-white shadow-[0_6px_20px_rgba(242,106,10,0.45)]"
                                    : "bg-[#FFFCF8] border-[#E85D04]/25 text-[#E85D04] group-hover:border-[#E85D04]/50"
                                }`}
                              >
                                <LvlIcon size={18} />
                              </div>

                              {isSelected && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E85D04] text-white text-[11px] font-semibold shadow-[0_0_14px_rgba(242,106,10,0.45)]">
                                  <Check size={11} strokeWidth={3} />
                                  <span>Selected</span>
                                </span>
                              )}
                            </div>

                            <h3 className="text-base font-semibold text-[#2B211C] mb-0.5">
                              {lvl.title}
                            </h3>
                            <span className="text-xs font-mono font-medium block mb-2.5 text-[#E85D04]">
                              {lvl.subtitle}
                            </span>
                            <p className="text-xs sm:text-sm leading-relaxed text-[#70645C]">
                              {lvl.description}
                            </p>
                          </div>

                          {lvl.recommended && (
                            <div
                              className={`mt-4 pt-3 border-t text-[11px] uppercase font-mono font-semibold tracking-wider w-full ${
                                isSelected
                                  ? "border-[#E85D04]/35 text-[#E85D04]"
                                  : "border-[#E8D9CC] text-[#E85D04]/80"
                              }`}
                            >
                              Recommended Default
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Duration Sub-selection */}
                  <div className="pt-4 border-t border-[#E8D9CC]">
                    <label className="text-xs uppercase font-mono tracking-wider text-[#70645C] block mb-3">
                      Simulation Duration:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl">
                      {durations.map((d) => {
                        const isDurSelected = selectedDuration === d.value;
                        return (
                          <motion.button
                            key={d.value}
                            type="button"
                            aria-pressed={isDurSelected}
                            onClick={() => setSelectedDuration(d.value)}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className={`p-3.5 rounded-xl border text-center min-h-[64px] transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04] ${
                              isDurSelected
                                ? "border-[#E85D04] bg-[#E85D04]/15 shadow-[0_0_24px_rgba(242,106,10,0.18),inset_0_-6px_14px_rgba(242,106,10,0.16)]"
                                : "bg-[#FFFFFF]/90 border-[#E8D9CC] text-[#70645C] hover:text-[#2B211C] hover:border-[#E85D04]/40"
                            }`}
                          >
                            <div
                              className={`text-sm font-mono tabular-nums ${
                                isDurSelected ? "text-[#E85D04] font-bold" : "text-[#2B211C] font-semibold"
                              }`}
                            >
                              {d.label}
                            </div>
                            <div
                              className={`text-xs mt-0.5 ${
                                isDurSelected ? "text-[#E85D04]/90 font-medium" : "text-[#70645C]"
                              }`}
                            >
                              {d.sub}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.32, ease: REDSUN_OUT_EXPO }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-lg font-semibold text-[#2B211C] tracking-tight">
                      <span className="font-mono text-[#E85D04] mr-2">03.</span>
                      Review, Context &amp; Session Launch
                    </h2>
                    <p className="text-xs sm:text-sm text-[#70645C] mt-1">
                      Review calibrated parameters and provide optional target company or resume details before launch.
                    </p>
                  </div>

                  {/* Summary Card */}
                  <div className="rounded-2xl bg-[#FFFFFF]/90 backdrop-blur-xl p-5 sm:p-6 border border-[#E8D9CC] shadow-sm shadow-[0_4px_20px_rgba(48,32,22,0.06)] space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pb-5 border-b border-[#E8D9CC]">
                      <div>
                        <span className="text-[11px] uppercase font-mono text-[#70645C] block mb-1">
                          Evaluation Track
                        </span>
                        <span className="text-sm font-semibold text-[#2B211C] capitalize">
                          {interviewType.replace("_", " ")}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] uppercase font-mono text-[#70645C] block mb-1">
                          Seniority Tier
                        </span>
                        <span className="text-sm font-semibold text-[#2B211C] capitalize">
                          {selectedLevel}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] uppercase font-mono text-[#70645C] block mb-1">
                          Target Company
                        </span>
                        <span className="text-sm font-semibold text-[#E85D04] capitalize">
                          {companyTracks.find((t) => t.id === selectedTargetCompany)?.name || "General"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] uppercase font-mono text-[#70645C] block mb-1">
                          Designated Role
                        </span>
                        <span className="text-sm font-semibold text-[#2B211C]">
                          {currentRole?.name}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] uppercase font-mono text-[#70645C] block mb-1">
                          Allocated Duration
                        </span>
                        <span className="text-sm font-semibold text-[#E85D04] font-mono tabular-nums">
                          {selectedDuration} Mins
                        </span>
                      </div>
                    </div>

                    {/* Pre-flight Security & Device Readiness Checklist */}
                    <div className="rounded-xl bg-[#FFFCF8]/90 p-4 sm:p-5 border border-white/[0.07] space-y-3">
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#2B211C] mb-2">
                        <ShieldCheck size={16} className="text-[#E85D04]" />
                        <span>Pre-Flight Readiness &amp; Proctoring Verification</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <RedSunCheckItem>Audio &amp; Video Input Devices Connected</RedSunCheckItem>
                        <RedSunCheckItem>Single-Candidate Examination Integrity Active</RedSunCheckItem>
                        <RedSunCheckItem>Automated Environmental &amp; Screen Auditing</RedSunCheckItem>
                        <RedSunCheckItem>Instantaneous STAR Scorecard &amp; Transcript Output</RedSunCheckItem>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 space-y-4">
                    <h3 className="text-sm font-semibold text-[#2B211C] flex items-center gap-2">
                      <span>Optional Context &amp; Target Company Calibration</span>
                      <span className="text-[11px] font-normal text-[#70645C]">(Optional)</span>
                    </h3>
                    {/* Company Presets Grid */}
                  <div className="rounded-2xl bg-[#FFFFFF]/90 backdrop-blur-xl p-5 sm:p-6 border border-[#E8D9CC] shadow-sm shadow-[0_4px_20px_rgba(48,32,22,0.06)] space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#2B211C]">
                        <Target size={16} className="text-[#E85D04]" />
                        <span>Target Company Evaluation Bar &amp; Rubric</span>
                      </div>
                      <span className="text-[11px] font-mono text-[#E85D04] bg-[#E85D04]/15 px-2.5 py-1 rounded-full border border-[#E85D04]/35">
                        Adaptive Blueprint Calibrated
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {companyTracks.map((trk) => {
                        const CompanyIcon = trk.icon;
                        const isSelected = selectedTargetCompany === trk.id;
                        return (
                          <motion.button
                            key={trk.id}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => setSelectedTargetCompany(trk.id)}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className={`p-3.5 rounded-xl border text-left transition-all duration-300 relative cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04] flex flex-col justify-between ${
                              isSelected
                                ? "bg-[#FFFCF8] border-[#E85D04] ring-1 ring-[#E85D04]/35 shadow-[0_0_22px_rgba(242,106,10,0.16)]"
                                : "bg-[#FFFCF8]/85 border-white/[0.07] hover:border-[#E85D04]/40"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-2.5 w-full">
                              <span
                                className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                                  isSelected
                                    ? "bg-[#E85D04] border-[#E85D04]/60 text-white"
                                    : "bg-[#FFFCF8] border-[#E8D9CC] text-[#E85D04]"
                                }`}
                              >
                                <CompanyIcon size={15} />
                              </span>
                              <span
                                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                                  isSelected
                                    ? "bg-[#E85D04]/20 text-[#E85D04] border-[#E85D04]/45 font-bold"
                                    : "bg-[#FFFCF8] text-[#70645C] border-[#E8D9CC]"
                                }`}
                              >
                                {isSelected && <Check size={10} strokeWidth={3} />}
                                {trk.tag}
                              </span>
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm font-semibold text-[#2B211C]">
                                {trk.name}
                              </div>
                              <div className="text-xs leading-snug mt-1 text-[#70645C]">
                                {trk.sub}
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Resume Deep Dive Toggle */}
                  <div className="rounded-2xl bg-[#FFFFFF]/90 border border-[#E8D9CC] p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-[#E85D04]" />
                        <span className="text-xs sm:text-sm font-semibold text-[#2B211C]">
                          Deep-Dive Resume Projects &amp; Architecture Decisions
                        </span>
                      </div>
                      <p className="text-xs text-[#70645C] leading-relaxed">
                        AI interviewer will inspect candidate projects to cross-examine specific technology choices (e.g., Kafka vs RabbitMQ, Redis caching invalidation, schema designs).
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={tailorToResume}
                      aria-label="Toggle deep-dive resume architecture questions"
                      onClick={() => setTailorToResume(!tailorToResume)}
                      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04] ${
                        tailorToResume
                          ? "bg-[#E85D04] shadow-[0_0_16px_rgba(242,106,10,0.45)]"
                          : "bg-[#FFFCF8] border border-white/[0.12]"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          tailorToResume ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Resume Snippet Input */}
                    <div className="rounded-2xl bg-[#FFFFFF]/90 p-5 border border-[#E8D9CC] space-y-3">
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#2B211C]">
                        <FileText size={16} className="text-[#E85D04]" />
                        <span>Candidate Experience &amp; Portfolio Highlights</span>
                      </div>
                      <textarea
                        rows={6}
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                        placeholder="Paste architectural achievements, key responsibilities, or technical scope..."
                        className="w-full bg-[#FFFCF8] border border-white/[0.1] rounded-xl p-3.5 text-xs sm:text-sm text-[#2B211C] placeholder:text-[#70645C] focus:outline-none focus:border-[#E85D04] focus:ring-2 focus:ring-[#E85D04]/25 resize-none transition-colors [color-scheme:dark]"
                      />
                      <p className="text-xs text-[#70645C]">
                        The AI evaluator integrates these specific production achievements into conversational follow-ups.
                      </p>
                    </div>

                    {/* Job Description Input */}
                    <div className="rounded-2xl bg-[#FFFFFF]/90 p-5 border border-[#E8D9CC] space-y-3">
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#2B211C]">
                        <Briefcase size={16} className="text-[#E85D04]" />
                        <span>Target Job Specification &amp; Requirements</span>
                      </div>
                      <textarea
                        rows={6}
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste job description, expected qualifications, or team mandates..."
                        className="w-full bg-[#FFFCF8] border border-white/[0.1] rounded-xl p-3.5 text-xs sm:text-sm text-[#2B211C] placeholder:text-[#70645C] focus:outline-none focus:border-[#E85D04] focus:ring-2 focus:ring-[#E85D04]/25 resize-none transition-colors [color-scheme:dark]"
                      />
                      <p className="text-xs text-[#70645C]">
                        Questions will directly benchmark against this enterprise&apos;s explicit hiring standards.
                      </p>
                    </div>
                  </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Step Navigation Bar */}
            <div className="mt-8 pt-5 border-t border-[#E8D9CC] flex flex-wrap items-center justify-between gap-3">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => prev - 1)}
                  className="redsun-btn-simple ![backdrop-filter:none] bg-[#FFFCF8]/95 text-[#2B211C] inline-flex items-center gap-1.5 px-5 py-2.5 text-xs sm:text-sm font-semibold cursor-pointer min-h-[44px]"
                >
                  <ChevronLeft size={15} />
                  <span>Previous Step</span>
                </button>
              ) : (
                <div />
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => prev + 1)}
                  className="redsun-btn-glow inline-flex items-center gap-1.5 px-6 py-2.5 text-xs sm:text-sm font-semibold cursor-pointer min-h-[46px] ml-auto"
                >
                  <span>Continue Configuration</span>
                  <ChevronRight size={15} className="redsun-arrow-shift" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleLaunch}
                  className="redsun-btn-glow inline-flex items-center gap-2 px-7 py-3 text-sm font-semibold cursor-pointer min-h-[46px] ml-auto"
                >
                  <Play size={16} className="fill-white" />
                  <span>Enter Proctored Simulation</span>
                </button>
              )}
            </div>
            </main>
          </div>

          <BottomNav theme="redsun" />
        </div>
      </ProtectedRoute>
    </MotionConfig>
  );
}
