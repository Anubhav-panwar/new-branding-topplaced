"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Logo from "@/components/Logo";
import {
  ArrowRight,
  Play,
  Check,
  Mic,
  Video,
  PhoneOff,
  Sparkles,
  Star,
  Users,
  BarChart3,
  Target,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  TrendingUp,
  Maximize2,
  FileText,
  ShieldCheck,
  Zap,
  Award,
  Clock,
  Radio,
  MessageSquare,
  HelpCircle,
  Linkedin,
  Twitter,
  Youtube,
  Instagram,
} from "lucide-react";

export default function HomePage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [selectedFaqCategory, setSelectedFaqCategory] = useState<string>("All");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [showDemoModal, setShowDemoModal] = useState<boolean>(false);
  const [testimonialIndex, setTestimonialIndex] = useState<number>(0);
  const [activeReportTab, setActiveReportTab] = useState<"summary" | "rubric" | "feedback">("summary");

  const features = [
    {
      icon: Mic,
      title: "Realistic AI Interviews",
      desc: "Practice role-specific interviews with an intelligent AI interviewer in full duplex voice.",
    },
    {
      icon: BarChart3,
      title: "Instant & Detailed Feedback",
      desc: "Get actionable insights and scores after every session with STAR rubric breakdowns.",
    },
    {
      icon: Target,
      title: "Role-Based Preparation",
      desc: "Choose from multiple roles and skill levels calibrated to top company hiring bars.",
    },
    {
      icon: TrendingUp,
      title: "Track Your Progress",
      desc: "Measure improvement with clear visual reports and dimension-level analytics.",
    },
  ];

  const workflowSteps = [
    {
      num: "1",
      title: "Choose a Role",
      desc: "Select your role, experience level, and interview type.",
      icon: FileText,
    },
    {
      num: "2",
      title: "Practice with AI",
      desc: "Have a real-time conversation with an AI interviewer.",
      icon: Video,
    },
    {
      num: "3",
      title: "Get Feedback",
      desc: "Receive detailed feedback, scores, and improvement tips.",
      icon: BarChart3,
    },
  ];

  const faqs = [
    {
      category: "Interview Tech",
      q: "How does the AI interview work?",
      a: "Our voice engine uses bidirectional audio streaming with sub-50ms duplex latency. You speak naturally through your microphone, and the AI interviewer listens, transcribes in real time, and responds dynamically with probing follow-up questions — just like an engineering director or bar raiser.",
      tag: "Real-Time Duplex Voice",
    },
    {
      category: "Role Tracks",
      q: "What kind of roles and seniority levels can I practice for?",
      a: "TopPlaced AI covers SDE-1 through Staff Architect, Engineering Management, Product Strategy, and Data Engineering. All tracks are calibrated to Tier-1 hiring rubrics (Google L4–L6, Amazon Bar Raiser STAR, Meta E4–E6, Microsoft, and leading Indian tech giants like TCS, Infosys, and Wipro).",
      tag: "50+ Specialized Tracks",
    },
    {
      category: "Pricing & Plans",
      q: "Is there a free practice session available?",
      a: "Yes! Every learner receives complimentary mock interview credits immediately upon signup — no credit card or commitment required. You can launch your first full AI simulation in less than 2 minutes.",
      tag: "100% Free to Start",
    },
    {
      category: "Scoring & Rubrics",
      q: "How accurate is the feedback and rubric scoring?",
      a: "Scoring is modeled after official FAANG competency rubrics. Within 60 seconds of completing your session, you receive granular dimension scores (1–10) across Communication Clarity, Technical Depth, System Architecture, and STAR Structure, along with sentence-level suggestions.",
      tag: "L4–L6 Calibrated",
    },
    {
      category: "Pricing & Plans",
      q: "Can I upgrade, switch, or cancel my plan anytime?",
      a: "Absolutely. You have total flexibility to upgrade, switch billing cycles, or cancel your subscription at any time directly from your account settings with zero cancellation fees or lock-ins.",
      tag: "Zero Lock-in",
    },
    {
      category: "Interview Tech",
      q: "Is my voice, video, and interview performance private?",
      a: "Your privacy is paramount. Sessions are encrypted in-transit and at-rest within isolated learner sandboxes. Practice media adheres to strict 10-day retention policies and is never used to train public foundational models.",
      tag: "Private & Encrypted",
    },
  ];

  const testimonials = [
    {
      quote:
        "The AI interviews felt uncannily real. The follow-up probes on system architecture trade-offs caught my blind spots before Google did. Cleared L5 on my first attempt!",
      name: "Ananya Sharma",
      role: "Senior SDE (L5)",
      company: "Google",
      hike: "+52% Comp Hike",
      rating: 5,
      track: "System Design & Architecture",
      avatarBg: "from-[#FFE8D6] to-[#FEDAC2]",
      avatarColor: "#E85D04",
    },
    {
      quote:
        "The STAR rubric evaluation broke down my behavioral answers sentence by sentence. I learned how to eliminate fluff and highlight business impact with Amazon-level precision.",
      name: "Rohit Mehta",
      role: "Lead Product Manager",
      company: "Amazon",
      hike: "Offer in 10 Days",
      rating: 5,
      track: "Bar Raiser Behavioral & STAR",
      avatarBg: "from-[#FFF2DE] to-[#FDE4BA]",
      avatarColor: "#B94308",
    },
    {
      quote:
        "The real-time duplex voice engine felt like talking to a Principal Engineer. Zero robotic lag. The dimension scorecards gave me a clear roadmap to level up my confidence.",
      name: "Sneha Verma",
      role: "Staff Data Engineer",
      company: "Microsoft",
      hike: "+40% Level Upgrade",
      rating: 5,
      track: "Distributed Systems & SQL",
      avatarBg: "from-[#E8F8F0] to-[#C9F0DD]",
      avatarColor: "#0E7F55",
    },
    {
      quote:
        "Practicing live coding trade-offs with immediate scoring eliminated all my interview anxiety. Landed an offer at Meta with an above-band signing bonus!",
      name: "Devendra Patel",
      role: "Full Stack Engineer (E5)",
      company: "Meta",
      hike: "+48% Comp Hike",
      rating: 5,
      track: "Full Stack & Microservices",
      avatarBg: "from-[#EDE9FE] to-[#DDD6FE]",
      avatarColor: "#6D28D9",
    },
    {
      quote:
        "TopPlaced AI accurately predicted my exact hire level. The actionable improvement points for scalability questions were a game changer for my Atlassian onsite.",
      name: "Kavya Iyer",
      role: "Platform Engineer",
      company: "Atlassian",
      hike: "P4 Senior Offer",
      rating: 5,
      track: "Kubernetes & Cloud Infra",
      avatarBg: "from-[#E0F2FE] to-[#BAE6FD]",
      avatarColor: "#0369A1",
    },
    {
      quote:
        "The voice AI interrupts naturally just like real interviewers do when probing edge cases. The feedback pinpointed my filler words and weak STAR conclusions immediately.",
      name: "Arjun Nair",
      role: "Backend Architect",
      company: "Uber",
      hike: "Principal Offer",
      rating: 5,
      track: "High-Throughput Architecture",
      avatarBg: "from-[#FEE2E2] to-[#FECACA]",
      avatarColor: "#B91C1C",
    },
  ];

  const scoreMetrics = [
    { label: "Communication", score: "9.0", pct: "90%" },
    { label: "Technical Depth", score: "8.5", pct: "85%" },
    { label: "Problem Solving", score: "8.8", pct: "88%" },
    { label: "Confidence", score: "8.8", pct: "88%" },
  ];

  const visibleTestimonials = [
    testimonials[testimonialIndex % testimonials.length],
    testimonials[(testimonialIndex + 1) % testimonials.length],
    testimonials[(testimonialIndex + 2) % testimonials.length],
  ];

  return (
    <div className="topplaced-home w-full min-h-screen bg-[#FFFCF8] text-[#2B211C] selection:bg-[#E85D04]/20 selection:text-[#E85D04] overflow-x-hidden">

      {/* Navigation */}
      <Navbar theme="light" />

      {/* =========================================================
          SECTION 1: HERO (100VW + 100VH FULL-SCREEN WARM LIGHT THEME)
          ========================================================= */}
      <section className="relative w-full max-w-none min-h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-br from-[#FFFDF9] via-[#FFF8F2] to-[#FFF1E6] text-[#2B211C] flex flex-col lg:flex-row items-stretch border-b border-[#E8D9CC]/80">

        {/* Subtle Ambient Warm Glow Behind Content */}
        <div className="pointer-events-none absolute -top-28 -left-28 w-[500px] h-[500px] rounded-full bg-[#E85D04]/10 blur-3xl z-0" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-[#FF7A1A]/8 blur-3xl z-0" />

        {/* Left Column: Full Viewport Content */}
        <div className="relative z-10 flex flex-col justify-center px-6 sm:px-12 lg:px-14 xl:px-20 py-8 lg:py-0 lg:w-[52%] xl:w-[50%] space-y-4 xl:space-y-5 text-left">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-[#E8D9CC] text-[#B94308] shadow-xs w-fit">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E85D04] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF7A1A]" />
            </span>
            <span className="text-[11px] font-bold tracking-widest uppercase font-mono text-[#B94308]">
              AI-Powered Interview Platform
            </span>
          </div>

          {/* High-Impact Headline */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-[46px] xl:text-[54px] font-extrabold text-[#1A1009] leading-[1.08] tracking-tight">
            Master the interview.
            <br />
            <span className="bg-gradient-to-r from-[#E85D04] via-[#F26A10] to-[#D94E00] bg-clip-text text-transparent">
              With provable confidence.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base lg:text-[17px] text-[#5C4D44] max-w-xl leading-relaxed">
            Get realistic, conversational AI mock interviews, instant transcript rubrics, and the calibrated guidance you need to stand out and land top tech roles.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3.5 pt-1">
            <Link
              href="/learner/interview/setup"
              className="h-12 px-7 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#E85D04] via-[#F26A10] to-[#D94E00] hover:from-[#D95200] hover:to-[#B94308] text-white font-bold text-sm shadow-[0_8px_20px_-3px_rgba(232,93,4,0.4)] hover:shadow-[0_12px_24px_-3px_rgba(232,93,4,0.5)] flex items-center gap-2 transition-all active:scale-[0.99]"
            >
              <span>Start Free Practice</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              type="button"
              onClick={() => setShowDemoModal(true)}
              className="h-12 px-6 rounded-xl sm:rounded-2xl bg-white/90 hover:bg-white border border-[#E8D9CC] text-[#2B211C] font-semibold text-sm flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <Play className="w-4 h-4 fill-[#E85D04] text-[#E85D04]" />
              <span>Watch Demo</span>
            </button>
          </div>

          {/* Trust Checkmarks */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 text-xs text-[#5C4D44]">
            {["No credit card required", "Instant feedback", "Role-based interviews"].map((t) => (
              <div key={t} className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-[#FFF0E6] border border-[#E8D9CC] flex items-center justify-center text-[#E85D04]">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span className="font-semibold text-[#2B211C]">{t}</span>
              </div>
            ))}
          </div>

          {/* Social Proof */}
          <div className="pt-2 flex items-center gap-3 text-xs text-[#5C4D44] border-t border-[#E8D9CC]/70 max-w-xl">
            <div className="flex items-center text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="font-bold text-[#1A1009]">4.9/5 Rating</span>
            <span className="text-[#C4B5A5]">·</span>
            <span>50,000+ Mock Interviews Conducted</span>
          </div>
        </div>

        {/* Right Column: 100% Full-Height and Full-Width Image Cover */}
        <div className="relative w-full lg:w-[48%] xl:w-[50%] min-h-[420px] sm:min-h-[500px] lg:h-full flex-1 overflow-hidden group">
          <Image
            src="/images/auth-hero-woman.jpg"
            alt="Authentic AI Mock Interview Practice with TopPlaced AI"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-center lg:object-left transition-transform duration-1000 group-hover:scale-105"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />
          <div className="lg:hidden absolute inset-0 bg-gradient-to-b from-[#FFFDF9] via-transparent to-transparent h-16 pointer-events-none" />

          {/* The Middle Organic Curve Divider (Desktop Only) */}
          <svg
            className="hidden lg:block absolute top-0 -left-[1px] bottom-0 h-full w-28 xl:w-36 z-20 pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            fill="none"
          >
            <defs>
              <linearGradient id="curveLightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFDF9" />
                <stop offset="50%" stopColor="#FFF8F2" />
                <stop offset="100%" stopColor="#FFF1E6" />
              </linearGradient>
              <linearGradient id="middleCurveOrange" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#E85D04" stopOpacity="0.85" />
                <stop offset="35%" stopColor="#FFA04D" stopOpacity="1" />
                <stop offset="70%" stopColor="#E85D04" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#B94308" stopOpacity="0.5" />
              </linearGradient>
              <filter id="curveGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="-1" dy="0" stdDeviation="3.5" floodColor="#E85D04" floodOpacity="0.5" />
              </filter>
            </defs>
            {/* Background fill extending warm cream panel across the curve */}
            <path
              d="M 0 0 L 0 100 Q 80 50 0 0 Z"
              fill="url(#curveLightGradient)"
            />
            {/* Glowing Orange Curved Edge */}
            <path
              d="M 0 0 Q 80 50 0 100"
              stroke="url(#middleCurveOrange)"
              strokeWidth="2.75"
              filter="url(#curveGlow)"
              fill="none"
            />
          </svg>

          {/* Floating Badge Top-Right: Telemetry Latency */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-8 inline-flex items-center gap-2 rounded-full bg-white/95 backdrop-blur-md border border-white/60 px-3.5 py-1.5 text-xs font-semibold text-[#2B211C] shadow-lg z-20">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E85D04] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF7A1A]" />
            </span>
            <span className="font-mono text-[11px] font-bold text-[#2B211C]">42ms Voice Latency</span>
          </div>

          {/* Floating Badge Top-Left on Desktop (Clear of Middle Curve) */}
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 lg:left-28 xl:left-36 inline-flex items-center gap-2 rounded-full bg-white/95 backdrop-blur-md border border-white/60 px-3.5 py-1.5 text-xs font-semibold text-[#2B211C] shadow-lg z-20">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[11px] tracking-wide text-[#2B211C]">Live STAR Calibration</span>
          </div>

          {/* Floating Scorecard Card Bottom-Right */}
          <div className="absolute bottom-6 right-6 sm:bottom-8 sm:right-8 inline-flex items-center gap-3 rounded-2xl bg-white/95 backdrop-blur-md border border-white/60 p-3 sm:p-3.5 shadow-2xl text-[#2B211C] z-20">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-[#FFF0E6] text-[#E85D04]">
              <Award className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="font-display text-lg sm:text-xl font-black text-[#2B211C]">8.8</span>
                <span className="text-[10px] sm:text-xs font-mono text-[#70645C]">/10 Overall</span>
              </div>
              <div className="text-[10px] sm:text-[11px] font-semibold text-[#E85D04]">
                +24% Placement Readiness
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          SECTION 3: INTERVIEW PRACTICE & KEY BENEFITS (EQUAL BALANCED 50/50 SPLIT)
          ========================================================= */}
      <section id="features" className="py-20 md:py-24 bg-gradient-to-b from-[#FFFDF9] via-[#FFF8F2] to-[#FFFCF8] relative overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="pointer-events-none absolute top-1/4 -right-24 w-96 h-96 rounded-full bg-[#E85D04]/5 blur-3xl z-0" />
        <div className="pointer-events-none absolute bottom-1/4 -left-24 w-96 h-96 rounded-full bg-[#FFA04D]/5 blur-3xl z-0" />

        <div className="section-container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">

            {/* Left: Section Intro & Live Readiness Benchmark (lg:col-span-6) */}
            <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-[#E8D9CC] text-[#B94308] shadow-xs w-fit">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E85D04] opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF7A1A]" />
                  </span>
                  <span className="text-[11px] font-bold tracking-widest uppercase font-mono text-[#B94308]">
                    Why TopPlaced AI
                  </span>
                </div>

                <h2 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-[#1A1009] leading-[1.12] tracking-tight">
                  Interview practice for
                  <br />
                  <span className="bg-gradient-to-r from-[#E85D04] via-[#F26A10] to-[#D94E00] bg-clip-text text-transparent">
                    every ambition.
                  </span>
                </h2>

                <p className="text-sm sm:text-base text-[#5C4D44] leading-relaxed">
                  A complete, AI-powered platform designed to eliminate interview anxiety, calibrate your communication to top company rubrics, and accelerate your hiring trajectory.
                </p>

                {/* Added Value Highlights */}
                <div className="space-y-2.5 pt-1">
                  {[
                    {
                      title: "Sub-50ms Voice Engine",
                      desc: "Natural duplex speech without awkward pauses.",
                    },
                    {
                      title: "STAR Framework Evaluation",
                      desc: "Feedback mapped to Google L4–L6 & Amazon Bar Raiser.",
                    },
                    {
                      title: "Private & Encrypted Sandbox",
                      desc: "Practice with zero pressure, unlimited retries & privacy.",
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-[#FFF0E6] border border-[#E8D9CC] flex items-center justify-center text-[#E85D04] shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <div className="text-xs sm:text-sm">
                        <span className="font-bold text-[#1A1009]">{item.title}</span>
                        <span className="text-[#70645C] ml-1.5">· {item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Elevated 3D Live Practice Benchmark Card */}
              <div className="relative rounded-3xl border border-[#E8D9CC] border-t-2 border-t-white bg-gradient-to-b from-white via-[#FFFDFB] to-[#FFF9F3] p-5 sm:p-6 shadow-[0_6px_24px_-4px_rgba(43,33,28,0.06),0_12px_28px_-6px_rgba(232,93,4,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-xs" />
                    </span>
                    <span className="text-xs font-mono font-bold text-[#1A1009] tracking-wide">
                      Active STAR Calibration Engine
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-[#FFF5EC] to-[#FFEEDB] text-[#B94308] border border-[#E8D9CC] shadow-2xs">
                    42ms Low Latency
                  </span>
                </div>

                {/* 3 Metrics 3D Blocks */}
                <div className="grid grid-cols-3 gap-2.5 pt-0.5">
                  <div className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-b from-white to-[#FFFDF9] border border-[#E8D9CC]/80 shadow-[0_2px_6px_rgba(43,33,28,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] text-center">
                    <div className="font-display font-black text-base sm:text-lg text-[#1A1009]">50,000+</div>
                    <div className="text-[10px] text-[#70645C] font-semibold">Interviews</div>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-b from-white to-[#FFFDF9] border border-[#E8D9CC]/80 shadow-[0_2px_6px_rgba(43,33,28,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] text-center">
                    <div className="font-display font-black text-base sm:text-lg text-[#E85D04]">98.4%</div>
                    <div className="text-[10px] text-[#70645C] font-semibold">Confidence Lift</div>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-b from-white to-[#FFFDF9] border border-[#E8D9CC]/80 shadow-[0_2px_6px_rgba(43,33,28,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] text-center">
                    <div className="font-display font-black text-base sm:text-lg text-[#1A1009]">4.9 / 5</div>
                    <div className="text-[10px] text-[#70645C] font-semibold">STAR Rating</div>
                  </div>
                </div>

                {/* Action CTA Row */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#E8D9CC]/60">
                  <Link
                    href="/learner/interview/setup"
                    className="h-11 px-5 rounded-xl bg-gradient-to-r from-[#E85D04] via-[#F26A10] to-[#D94E00] hover:from-[#D95200] hover:to-[#B94308] text-white font-bold text-xs shadow-[0_4px_12px_rgba(232,93,4,0.35),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_8px_20px_rgba(232,93,4,0.45)] hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 transition-all"
                  >
                    <span>Start Practice Session</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    href="/learner/interview/setup"
                    className="text-xs font-bold text-[#E85D04] hover:text-[#B94308] transition-colors flex items-center gap-1 group"
                  >
                    <span>Explore All Tracks</span>
                    <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Right: 2×2 3D Premium Feature Cards (lg:col-span-6) */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 1: Realistic AI Interviews */}
              <div className="group relative rounded-3xl border border-[#E8D9CC] border-t-2 border-t-white bg-gradient-to-b from-white via-[#FFFDFB] to-[#FFF9F3] p-5 shadow-[0_4px_16px_-2px_rgba(43,33,28,0.06),0_8px_20px_-4px_rgba(232,93,4,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] hover:-translate-y-2 hover:shadow-[0_20px_40px_-10px_rgba(232,93,4,0.22),0_8px_16px_-4px_rgba(43,33,28,0.08),inset_0_1px_0_rgba(255,255,255,1)] hover:border-[#E85D04]/60 transition-all duration-300 flex flex-col justify-between overflow-hidden">
                <div className="pointer-events-none absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br from-[#E85D04]/10 to-transparent blur-xl group-hover:scale-150 transition-transform duration-500" />

                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    {/* 3D Tactile Icon (Never turns white on hover!) */}
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FFF5EC] via-[#FFEADB] to-[#FEDBC4] border border-[#F6C29E] flex items-center justify-center text-[#E85D04] shadow-[0_4px_10px_rgba(232,93,4,0.15),inset_0_1px_1px_rgba(255,255,255,0.9)] group-hover:scale-110 group-hover:shadow-[0_6px_18px_rgba(232,93,4,0.32),inset_0_1px_1px_rgba(255,255,255,1)] group-hover:border-[#E85D04] transition-all duration-300">
                      <Mic className="w-5 h-5 text-[#E85D04] transition-transform duration-300 group-hover:rotate-6 shrink-0" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-gradient-to-r from-[#FFF5EC] to-[#FFEEDB] text-[#B94308] border border-[#E8D9CC] shadow-2xs">
                      Full Duplex
                    </span>
                  </div>
                  <h3 className="font-display font-extrabold text-sm sm:text-base text-[#1A1009] group-hover:text-[#E85D04] transition-colors leading-snug">
                    Realistic AI Interviews
                  </h3>
                  <p className="text-xs text-[#5C4D44] leading-relaxed mt-1.5 font-medium">
                    Practice role-specific mock interviews with an AI interviewer that listens, adapts, and probes in real time.
                  </p>
                </div>

                {/* 3D Recessed Footer Widget */}
                <div className="mt-4 pt-3.5 border-t border-[#E8D9CC]/60 bg-gradient-to-b from-[#FFFDF9] to-[#FFF8F2] -mx-5 -mb-5 px-5 py-3 rounded-b-3xl shadow-[inset_0_1px_2px_rgba(43,33,28,0.03)] flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 font-mono text-[#70645C] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E85D04] animate-pulse" />
                    <span>42ms Latency</span>
                  </div>
                  <div className="flex items-center gap-1 h-3.5">
                    {[40, 75, 100, 60, 90, 50].map((h, idx) => (
                      <span
                        key={idx}
                        className="w-0.5 bg-gradient-to-t from-[#E85D04] to-[#FFA04D] rounded-full animate-pulse"
                        style={{ height: `${h}%`, animationDelay: `${idx * 120}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 2: Instant & Detailed Feedback */}
              <div className="group relative rounded-3xl border border-[#E8D9CC] border-t-2 border-t-white bg-gradient-to-b from-white via-[#FFFDFB] to-[#FFF9F3] p-5 shadow-[0_4px_16px_-2px_rgba(43,33,28,0.06),0_8px_20px_-4px_rgba(232,93,4,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] hover:-translate-y-2 hover:shadow-[0_20px_40px_-10px_rgba(232,93,4,0.22),0_8px_16px_-4px_rgba(43,33,28,0.08),inset_0_1px_0_rgba(255,255,255,1)] hover:border-[#E85D04]/60 transition-all duration-300 flex flex-col justify-between overflow-hidden">
                <div className="pointer-events-none absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br from-[#E85D04]/10 to-transparent blur-xl group-hover:scale-150 transition-transform duration-500" />

                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    {/* 3D Tactile Icon (Never turns white on hover!) */}
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FFF5EC] via-[#FFEADB] to-[#FEDBC4] border border-[#F6C29E] flex items-center justify-center text-[#E85D04] shadow-[0_4px_10px_rgba(232,93,4,0.15),inset_0_1px_1px_rgba(255,255,255,0.9)] group-hover:scale-110 group-hover:shadow-[0_6px_18px_rgba(232,93,4,0.32),inset_0_1px_1px_rgba(255,255,255,1)] group-hover:border-[#E85D04] transition-all duration-300">
                      <BarChart3 className="w-5 h-5 text-[#E85D04] transition-transform duration-300 group-hover:rotate-6 shrink-0" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-gradient-to-r from-emerald-50 to-emerald-100/80 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                      STAR Rubric
                    </span>
                  </div>
                  <h3 className="font-display font-extrabold text-sm sm:text-base text-[#1A1009] group-hover:text-[#E85D04] transition-colors leading-snug">
                    Instant & Detailed Feedback
                  </h3>
                  <p className="text-xs text-[#5C4D44] leading-relaxed mt-1.5 font-medium">
                    Receive actionable dimension scores and line-by-line STAR framework improvements right after every session.
                  </p>
                </div>

                {/* 3D Recessed Footer Widget */}
                <div className="mt-4 pt-3.5 border-t border-[#E8D9CC]/60 bg-gradient-to-b from-[#FFFDF9] to-[#FFF8F2] -mx-5 -mb-5 px-5 py-3 rounded-b-3xl shadow-[inset_0_1px_2px_rgba(43,33,28,0.03)] space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-semibold text-[#2B211C]">STAR Calibration</span>
                    <span className="font-mono font-bold text-[#E85D04]">9.2 / 10</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#E8D9CC]/50 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-gradient-to-r from-[#E85D04] to-[#FFA04D] rounded-full" style={{ width: "92%" }} />
                  </div>
                </div>
              </div>

              {/* Card 3: Role-Based Preparation */}
              <div className="group relative rounded-3xl border border-[#E8D9CC] border-t-2 border-t-white bg-gradient-to-b from-white via-[#FFFDFB] to-[#FFF9F3] p-5 shadow-[0_4px_16px_-2px_rgba(43,33,28,0.06),0_8px_20px_-4px_rgba(232,93,4,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] hover:-translate-y-2 hover:shadow-[0_20px_40px_-10px_rgba(232,93,4,0.22),0_8px_16px_-4px_rgba(43,33,28,0.08),inset_0_1px_0_rgba(255,255,255,1)] hover:border-[#E85D04]/60 transition-all duration-300 flex flex-col justify-between overflow-hidden">
                <div className="pointer-events-none absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br from-[#E85D04]/10 to-transparent blur-xl group-hover:scale-150 transition-transform duration-500" />

                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    {/* 3D Tactile Icon (Never turns white on hover!) */}
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FFF5EC] via-[#FFEADB] to-[#FEDBC4] border border-[#F6C29E] flex items-center justify-center text-[#E85D04] shadow-[0_4px_10px_rgba(232,93,4,0.15),inset_0_1px_1px_rgba(255,255,255,0.9)] group-hover:scale-110 group-hover:shadow-[0_6px_18px_rgba(232,93,4,0.32),inset_0_1px_1px_rgba(255,255,255,1)] group-hover:border-[#E85D04] transition-all duration-300">
                      <Target className="w-5 h-5 text-[#E85D04] transition-transform duration-300 group-hover:rotate-6 shrink-0" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-gradient-to-r from-amber-50 to-amber-100/80 text-amber-700 border border-amber-200/80 shadow-2xs">
                      Tier-1 Bars
                    </span>
                  </div>
                  <h3 className="font-display font-extrabold text-sm sm:text-base text-[#1A1009] group-hover:text-[#E85D04] transition-colors leading-snug">
                    Role-Based Preparation
                  </h3>
                  <p className="text-xs text-[#5C4D44] leading-relaxed mt-1.5 font-medium">
                    Choose from specialized tracks: Software Engineering, System Design, Product Strategy, and Behavioral L5.
                  </p>
                </div>

                {/* 3D Recessed Footer Widget */}
                <div className="mt-4 pt-3.5 border-t border-[#E8D9CC]/60 bg-gradient-to-b from-[#FFFDF9] to-[#FFF8F2] -mx-5 -mb-5 px-5 py-3 rounded-b-3xl shadow-[inset_0_1px_2px_rgba(43,33,28,0.03)] flex flex-wrap gap-1.5">
                  {["System Design", "Backend Eng", "Product Lead", "Behavioral L5"].map((role) => (
                    <span
                      key={role}
                      className="px-2.5 py-0.5 rounded-lg bg-white border border-[#E8D9CC] text-[10px] font-bold text-[#1A1009] shadow-2xs"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card 4: Track Your Progress */}
              <div className="group relative rounded-3xl border border-[#E8D9CC] border-t-2 border-t-white bg-gradient-to-b from-white via-[#FFFDFB] to-[#FFF9F3] p-5 shadow-[0_4px_16px_-2px_rgba(43,33,28,0.06),0_8px_20px_-4px_rgba(232,93,4,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] hover:-translate-y-2 hover:shadow-[0_20px_40px_-10px_rgba(232,93,4,0.22),0_8px_16px_-4px_rgba(43,33,28,0.08),inset_0_1px_0_rgba(255,255,255,1)] hover:border-[#E85D04]/60 transition-all duration-300 flex flex-col justify-between overflow-hidden">
                <div className="pointer-events-none absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br from-[#E85D04]/10 to-transparent blur-xl group-hover:scale-150 transition-transform duration-500" />

                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    {/* 3D Tactile Icon (Never turns white on hover!) */}
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FFF5EC] via-[#FFEADB] to-[#FEDBC4] border border-[#F6C29E] flex items-center justify-center text-[#E85D04] shadow-[0_4px_10px_rgba(232,93,4,0.15),inset_0_1px_1px_rgba(255,255,255,0.9)] group-hover:scale-110 group-hover:shadow-[0_6px_18px_rgba(232,93,4,0.32),inset_0_1px_1px_rgba(255,255,255,1)] group-hover:border-[#E85D04] transition-all duration-300">
                      <TrendingUp className="w-5 h-5 text-[#E85D04] transition-transform duration-300 group-hover:rotate-6 shrink-0" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-gradient-to-r from-[#FFF5EC] to-[#FFEEDB] text-[#B94308] border border-[#E8D9CC] shadow-2xs">
                      Analytics
                    </span>
                  </div>
                  <h3 className="font-display font-extrabold text-sm sm:text-base text-[#1A1009] group-hover:text-[#E85D04] transition-colors leading-snug">
                    Track Your Progress
                  </h3>
                  <p className="text-xs text-[#5C4D44] leading-relaxed mt-1.5 font-medium">
                    Measure your readiness trajectory with granular dimension score trends and cohort percentile analytics.
                  </p>
                </div>

                {/* 3D Recessed Footer Widget */}
                <div className="mt-4 pt-3.5 border-t border-[#E8D9CC]/60 bg-gradient-to-b from-[#FFFDF9] to-[#FFF8F2] -mx-5 -mb-5 px-5 py-3 rounded-b-3xl shadow-[inset_0_1px_2px_rgba(43,33,28,0.03)] flex items-center justify-between text-[11px]">
                  <span className="font-mono text-[#70645C] font-semibold">8.8 / 10 Readiness</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 font-bold text-[10px] border border-emerald-200 shadow-2xs">
                    +24% Placement
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          SECTION 4: HOW IT WORKS — 3 SIMPLE STEPS (100VW + 100VH REFERENCE MATCH)
          ========================================================= */}
      <section
        id="how-it-works"
        className="w-screen relative left-1/2 -translate-x-1/2 max-w-[100vw] min-h-screen lg:h-screen lg:max-h-screen bg-gradient-to-b from-[#FFFDFB] via-[#FDF5F2] to-[#FCEBE4] border-y border-[#E8D9CC]/70 overflow-hidden flex flex-col justify-center py-3 sm:py-4 lg:py-5 px-4 sm:px-6 lg:px-10 xl:px-14 selection:bg-[#E85D04]/20"
      >
        {/* Soft Ambient 3D Curved Atmosphere */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 right-0 w-[600px] h-[420px] bg-gradient-to-bl from-[#FEDBC4]/50 via-[#FFE8D9]/25 to-transparent blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-16 left-0 w-[500px] h-[360px] bg-gradient-to-tr from-[#FEDBC4]/40 via-[#FFF0E6]/20 to-transparent blur-3xl"
        />

        <div className="w-full max-w-[1360px] 2xl:max-w-[1440px] mx-auto flex flex-col justify-between gap-3.5 lg:gap-5 relative z-10">
          {/* Top Row: Left Header & Tags + Right 3D Laptop on Pedestal */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-3 lg:gap-8 shrink-0">
            {/* Left Content */}
            <div className="space-y-1 text-center lg:text-left flex-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold tracking-wide uppercase bg-[#FFF0E6] text-[#E85D04] border border-[#FEDBC4] shadow-2xs">
                ✦ AI-Powered Interview Prep
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-[36px] xl:text-[38px] font-display font-black text-[#1A1009] tracking-tight leading-[1.08] mt-1">
                Get interview-ready in{" "}
                <span className="text-[#E85D04]">
                  3 simple steps.
                </span>
              </h2>
              <p className="text-xs sm:text-[13px] text-[#70645C] font-medium max-w-lg mt-0.5 leading-snug">
                A streamlined, calibrated path from role selection to hiring-bar mastery in under 10 minutes.
              </p>

              {/* 3 Feature Pills */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-1 text-[11px] font-bold text-[#2B211C]">
                <span className="flex items-center gap-1 text-[#E85D04]">
                  <Zap className="w-3 h-3 fill-[#E85D04]/20" /> Role-Based Practice
                </span>
                <span className="text-[#E8D9CC]">|</span>
                <span className="flex items-center gap-1 text-[#E85D04]">
                  <Mic className="w-3 h-3" /> Real Voice AI
                </span>
                <span className="text-[#E8D9CC]">|</span>
                <span className="flex items-center gap-1 text-[#E85D04]">
                  <BarChart3 className="w-3 h-3" /> Actionable Feedback
                </span>
              </div>
            </div>

            {/* Right 3D Laptop on Pedestal Asset */}
            <div className="relative shrink-0 hidden lg:block w-[400px] xl:w-[460px] h-[150px] xl:h-[175px] -my-2">
              <Image
                src="/images/how-it-works-laptop-v2.png"
                alt="AI Interviewer 3D Laptop Simulation"
                fill
                priority
                className="object-contain object-right drop-shadow-[0_10px_24px_rgba(232,93,4,0.08)]"
              />
            </div>
          </div>

          {/* Middle Row: 3 Compact White 3D Cards with Circular Connectors */}
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 items-stretch">

            {/* CARD 1: SETUP */}
            <div className="group relative z-10 flex flex-col justify-between rounded-2xl lg:rounded-[24px] bg-white border border-[#EFE4D8] p-4 sm:p-5 lg:p-5 shadow-[0_8px_30px_rgba(43,33,28,0.06),0_2px_8px_rgba(232,93,4,0.03)] hover:-translate-y-1 hover:shadow-[0_16px_36px_-6px_rgba(232,93,4,0.18)] hover:border-[#E85D04]/60 transition-all duration-300">
              
              {/* Flow Connector Arrow to Step 2 (Desktop) */}
              <div
                aria-hidden="true"
                className="hidden md:flex absolute -right-3.5 lg:-right-4 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-[#FF5C00] text-white items-center justify-center shadow-[0_3px_10px_rgba(255,92,0,0.45)] pointer-events-none"
              >
                <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
              </div>

              <div>
                {/* Header Row: Step Pill + Timing */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-[11px] px-2 py-0.5 rounded-md bg-[#FFF0E6] border border-[#FEDBC4] text-[#E85D04]">
                      01
                    </span>
                    <span className="font-mono text-[10px] font-bold text-[#7A6E65] uppercase tracking-wider">
                      SETUP
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-[#E85D04] bg-[#FFF5EE] px-2.5 py-0.5 rounded-full border border-[#FEDBC4] flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-[#E85D04]" /> 30 Seconds
                  </span>
                </div>

                {/* 3D Squircle Icon */}
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FFEFE5] to-[#FEDAC2] border border-[#FCD2B3] flex items-center justify-center text-[#E85D04] shadow-2xs mb-2.5 group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5 text-[#E85D04]" />
                </div>

                {/* Title & Description */}
                <h3 className="font-display font-bold text-[15px] sm:text-base text-[#1A1009] leading-snug group-hover:text-[#E85D04] transition-colors">
                  Choose Target Track
                </h3>
                <p className="text-[11.5px] text-[#70645C] font-medium leading-relaxed mt-1 line-clamp-2">
                  Select your role, specialization, and hiring bar calibrated to Google, Amazon, and Meta.
                </p>

                {/* Compact Micro-UI Pod */}
                <div className="mt-3 px-3 py-2 rounded-xl bg-[#FFFBF8] border border-[#F4E3D4] flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 font-bold text-[#1A1009] text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-[#E85D04]" />
                    Senior SDE (L5 Track)
                  </span>
                  <span className="font-mono font-bold text-[10px] text-[#E85D04] bg-[#FFF5EE] px-2.5 py-0.5 rounded-full border border-[#FEDBC4]">
                    Google L5 Bar
                  </span>
                </div>
              </div>

              {/* Recessed Footer */}
              <div className="mt-3.5 pt-2.5 border-t border-[#F0E4D8] flex items-center justify-between text-[10px] sm:text-[11px]">
                <span className="text-[#70645C] font-medium flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#70645C]" /> 50+ Roles Ready
                </span>
                <Link
                  href="/learner/interview/setup"
                  className="font-mono text-[#E85D04] font-bold flex items-center gap-0.5 hover:underline"
                >
                  Explore Tracks →
                </Link>
              </div>
            </div>

            {/* CARD 2: SIMULATION */}
            <div className="group relative z-10 flex flex-col justify-between rounded-2xl lg:rounded-[24px] bg-white border border-[#EFE4D8] p-4 sm:p-5 lg:p-5 shadow-[0_8px_30px_rgba(43,33,28,0.06),0_2px_8px_rgba(232,93,4,0.03)] hover:-translate-y-1 hover:shadow-[0_16px_36px_-6px_rgba(232,93,4,0.18)] hover:border-[#E85D04]/60 transition-all duration-300">
              
              {/* Flow Connector Arrow to Step 3 (Desktop) */}
              <div
                aria-hidden="true"
                className="hidden md:flex absolute -right-3.5 lg:-right-4 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-[#FF5C00] text-white items-center justify-center shadow-[0_3px_10px_rgba(255,92,0,0.45)] pointer-events-none"
              >
                <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
              </div>

              <div>
                {/* Header Row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-[11px] px-2 py-0.5 rounded-md bg-[#FFF0E6] border border-[#FEDBC4] text-[#E85D04]">
                      02
                    </span>
                    <span className="font-mono text-[10px] font-bold text-[#7A6E65] uppercase tracking-wider">
                      SIMULATION
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-[#E85D04] bg-[#FFF5EE] px-2.5 py-0.5 rounded-full border border-[#FEDBC4] flex items-center gap-1">
                    <Radio className="w-2.5 h-2.5 text-[#E85D04]" /> Real Time
                  </span>
                </div>

                {/* 3D Squircle Icon */}
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FFEFE5] to-[#FEDAC2] border border-[#FCD2B3] flex items-center justify-center text-[#E85D04] shadow-2xs mb-2.5 group-hover:scale-105 transition-transform">
                  <Video className="w-5 h-5 text-[#E85D04]" />
                </div>

                {/* Title & Description */}
                <h3 className="font-display font-bold text-[15px] sm:text-base text-[#1A1009] leading-snug group-hover:text-[#E85D04] transition-colors">
                  Practice with Voice AI
                </h3>
                <p className="text-[11.5px] text-[#70645C] font-medium leading-relaxed mt-1 line-clamp-2">
                  Speak naturally over low-latency audio. The AI listens, interrupts, and follow-ups dynamically.
                </p>

                {/* Compact Micro-UI Pod */}
                <div className="mt-3 px-3 py-2 rounded-xl bg-[#FFFBF8] border border-[#F4E3D4] flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 font-bold text-[#1A1009] text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    AI Active
                  </span>
                  {/* Soundwave bars */}
                  <div className="flex items-center gap-0.5">
                    {[8, 16, 11, 20, 13, 18, 10, 15].map((h, i) => (
                      <span
                        key={i}
                        className="w-1 rounded-full bg-gradient-to-t from-[#E85D04] to-[#F77F00]"
                        style={{ height: `${h}px` }}
                      />
                    ))}
                  </div>
                  <span className="font-mono font-bold text-[10px] text-[#E85D04]">
                    42ms Duplex
                  </span>
                </div>
              </div>

              {/* Recessed Footer */}
              <div className="mt-3.5 pt-2.5 border-t border-[#F0E4D8] flex items-center justify-between text-[10px] sm:text-[11px]">
                <span className="text-[#70645C] font-medium flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-[#70645C]" /> Zero Typing Needed
                </span>
                <Link
                  href="/learner/interview/setup"
                  className="font-mono text-[#E85D04] font-bold flex items-center gap-0.5 hover:underline"
                >
                  Generate Scorecard →
                </Link>
              </div>
            </div>

            {/* CARD 3: ANALYTICS */}
            <div className="group relative z-10 flex flex-col justify-between rounded-2xl lg:rounded-[24px] bg-white border border-[#EFE4D8] p-4 sm:p-5 lg:p-5 shadow-[0_8px_30px_rgba(43,33,28,0.06),0_2px_8px_rgba(232,93,4,0.03)] hover:-translate-y-1 hover:shadow-[0_16px_36px_-6px_rgba(232,93,4,0.18)] hover:border-[#E85D04]/60 transition-all duration-300">
              <div>
                {/* Header Row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-[11px] px-2 py-0.5 rounded-md bg-[#E8F8F0] border border-[#BDE8D2] text-[#0E7F55]">
                      03
                    </span>
                    <span className="font-mono text-[10px] font-bold text-[#7A6E65] uppercase tracking-wider">
                      ANALYTICS
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-[#0E7F55] bg-[#E8F8F0] px-2.5 py-0.5 rounded-full border border-[#BDE8D2] flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 text-[#0E7F55] fill-[#0E7F55]/30" /> Instant 60s
                  </span>
                </div>

                {/* 3D Squircle Icon */}
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FFEFE5] to-[#FEDAC2] border border-[#FCD2B3] flex items-center justify-center text-[#E85D04] shadow-2xs mb-2.5 group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-5 h-5 text-[#E85D04]" />
                </div>

                {/* Title & Description */}
                <h3 className="font-display font-bold text-[15px] sm:text-base text-[#1A1009] leading-snug group-hover:text-[#E85D04] transition-colors">
                  Get Calibrated Feedback
                </h3>
                <p className="text-[11.5px] text-[#70645C] font-medium leading-relaxed mt-1 line-clamp-2">
                  Review STAR dimension ratings, sentence-level improvements, and targeted drills.
                </p>

                {/* Compact Micro-UI Pod */}
                <div className="mt-3 px-3 py-2 rounded-xl bg-[#FFFBF8] border border-[#F4E3D4] flex items-center justify-between text-[11px]">
                  <span className="font-mono font-black text-[11px] text-[#1A1009]">
                    <span className="text-[#E85D04]">8.8</span> / 10 Score
                  </span>
                  <div className="w-16 bg-[#E8D9CC]/60 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-[#E85D04] to-[#F77F00] h-full rounded-full w-[88%]" />
                  </div>
                  <span className="font-mono font-bold text-[10px] text-[#0E7F55] bg-[#E8F8F0] px-2.5 py-0.5 rounded-full border border-[#BDE8D2]">
                    Top 5% Tier
                  </span>
                </div>
              </div>

              {/* Recessed Footer */}
              <div className="mt-3.5 pt-2.5 border-t border-[#F0E4D8] flex items-center justify-between text-[10px] sm:text-[11px]">
                <span className="text-[#70645C] font-medium flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#70645C]" /> Actionable Report
                </span>
                <span className="font-mono text-[#0E7F55] font-bold flex items-center gap-1">
                  Offer Ready <Check className="w-3.5 h-3.5 stroke-[3]" />
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Row: Dark Ember Gradient Action Bar Matching Reference Image */}
          <div
            className="shrink-0 px-4 sm:px-6 py-3 sm:py-3.5 rounded-2xl lg:rounded-[22px] border border-[#441E13]/80 shadow-[0_12px_36px_rgba(24,13,9,0.38),0_2px_8px_rgba(0,0,0,0.3)] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left relative overflow-hidden"
            style={{
              background: "linear-gradient(90deg, #180D09 0%, #20120D 35%, #2B150F 55%, #461F13 75%, #2B130C 90%, #1A0D08 100%)",
            }}
          >
            {/* Ambient Radial Ember Sweep */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-0 top-0 bottom-0 w-[55%] bg-[radial-gradient(ellipse_at_78%_50%,rgba(255,92,0,0.24)_0%,rgba(255,92,0,0.06)_55%,transparent_75%)]"
            />

            {/* Left: Target Icon Pod + Hairline Separator + Text */}
            <div className="flex items-center gap-3.5 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-[#28150E] border border-[#4A2417] text-[#FF7A29] flex items-center justify-center shadow-xs shrink-0">
                <Target className="w-5 h-5 text-[#FF7A29]" />
              </div>
              <div className="hidden sm:block w-[1px] h-7 bg-white/10 mx-1 shrink-0" />
              <div>
                <h4 className="font-display font-bold text-xs sm:text-sm lg:text-[15px] text-white tracking-tight">
                  Ready to test your placement readiness?
                </h4>
                <p className="text-[11px] lg:text-xs text-[#A6978E] mt-0.5">
                  Takes less than 2 minutes to launch your first full AI mock interview session.
                </p>
              </div>
            </div>

            {/* Right: Pill Action Button */}
            <Link
              href="/learner/interview/setup"
              className="relative z-10 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#FF6B18] to-[#FF5400] hover:from-[#FF7B2E] hover:to-[#FF6414] text-white text-xs lg:text-[13px] font-bold shadow-[0_4px_18px_rgba(255,84,0,0.45)] hover:-translate-y-0.5 transition-all duration-200 shrink-0"
            >
              <span>Start Free Practice Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================
          SECTION 5: AI FEEDBACK & ANALYTICS SHOWCASE
          ========================================================= */}
      <section id="showcase" className="py-20 lg:py-28 bg-[#FFFCF8] relative overflow-hidden border-b border-[#E8D9CC]/80">
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

            {/* Left: 3D Masterpiece Interview Report Panel */}
            <div className="lg:col-span-6 relative">
              {/* Warm 3D ambient aura */}
              <div
                aria-hidden="true"
                className="absolute -left-10 top-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-gradient-to-br from-[#E85D04]/12 via-[#FEDBC4]/20 to-transparent blur-3xl pointer-events-none"
              />

              <div className="relative rounded-3xl bg-gradient-to-b from-white via-[#FFFDFB] to-[#FFF9F3] border border-[#E8D9CC] border-t-2 border-t-white p-6 sm:p-8 shadow-[0_12px_36px_-4px_rgba(43,33,28,0.08),0_24px_48px_-8px_rgba(232,93,4,0.12),inset_0_1px_0_rgba(255,255,255,0.95)] hover:shadow-[0_20px_50px_-8px_rgba(232,93,4,0.18)] transition-all duration-300">
                {/* Window Bar: Glossy macOS-style dots + Session metadata */}
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#E8D9CC]/80">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] border border-[#E0443E]/50 shadow-2xs" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] border border-[#DEA123]/50 shadow-2xs" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F] border border-[#1AAB29]/50 shadow-2xs" />
                    </div>
                    <div className="h-3 w-px bg-[#E8D9CC]" />
                    <span className="font-mono text-[11px] font-bold text-[#5C4D44] tracking-tight">
                      Google L5 System Design Report
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#FFF5EC] to-[#FEDBC4] text-[#E85D04] border border-[#F6C29E] shadow-2xs">
                    ● Calibrated
                  </span>
                </div>

                {/* Segmented Control Tabs */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F8EFE7] border border-[#E8D9CC] mb-6 text-[11px] font-semibold">
                  <button
                    onClick={() => setActiveReportTab("summary")}
                    className={`flex-1 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${activeReportTab === "summary"
                      ? "bg-white text-[#E85D04] font-bold shadow-xs border border-[#E8D9CC]/50"
                      : "text-[#70645C] hover:text-[#1A1009]"
                      }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveReportTab("rubric")}
                    className={`flex-1 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${activeReportTab === "rubric"
                      ? "bg-white text-[#E85D04] font-bold shadow-xs border border-[#E8D9CC]/50"
                      : "text-[#70645C] hover:text-[#1A1009]"
                      }`}
                  >
                    STAR Rubric
                  </button>
                  <button
                    onClick={() => setActiveReportTab("feedback")}
                    className={`flex-1 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${activeReportTab === "feedback"
                      ? "bg-white text-[#E85D04] font-bold shadow-xs border border-[#E8D9CC]/50"
                      : "text-[#70645C] hover:text-[#1A1009]"
                      }`}
                  >
                    AI Action Plan
                  </button>
                </div>

                {/* Score Hero with 3D Donut Gauge */}
                <div className="flex items-center gap-6 mb-7 p-4 rounded-2xl bg-gradient-to-br from-[#FFFDF9] via-white to-[#FFF6EE] border border-[#F6C29E]/60 shadow-[inset_0_1px_2px_rgba(43,33,28,0.03),0_4px_14px_rgba(232,93,4,0.06)]">
                  {/* Circular 3D Gauge */}
                  <div className="relative w-24 h-24 shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <defs>
                        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#E85D04" />
                          <stop offset="100%" stopColor="#F77F00" />
                        </linearGradient>
                      </defs>
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#F0E2D6" strokeWidth="8" />
                      <circle
                        cx="50" cy="50" r="40" fill="none"
                        stroke="url(#gaugeGradient)" strokeWidth="8"
                        strokeDasharray="251.2"
                        strokeDashoffset="30"
                        strokeLinecap="round"
                        className="drop-shadow-[0_2px_6px_rgba(232,93,4,0.35)]"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-display font-black text-[#E85D04] leading-none">8.8</span>
                      <span className="text-[9px] text-[#70645C] font-mono font-bold mt-0.5">/10 SCORE</span>
                    </div>
                  </div>

                  {/* Benchmark & Summary */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-extrabold text-sm text-[#1A1009]">
                        Exceptional Performance
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200 shadow-2xs">
                        Top 5% Tier
                      </span>
                    </div>
                    <p className="text-xs text-[#5C4D44] leading-relaxed font-medium">
                      High structural maturity with clear trade-off articulation. Exceeds standard L5 hiring bar.
                    </p>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-[#70645C] pt-0.5">
                      <span className="text-emerald-700 font-bold">▲ +18% Above Avg</span>
                      <span>•</span>
                      <span>42 min Session</span>
                    </div>
                  </div>
                </div>

                {/* Dimension Progress Bars with 3D Bevel & Tag Badges */}
                <div className="space-y-3.5 mb-6 text-xs">
                  {scoreMetrics.map((m) => (
                    <div key={m.label} className="space-y-1">
                      <div className="flex justify-between items-center text-[#5C4D44]">
                        <span className="font-bold text-[#2B211C] flex items-center gap-1.5 text-xs">
                          {m.label}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-[#E85D04] bg-[#FFF0E6] px-1.5 py-0.5 rounded border border-[#FEDBC4]">
                            {Number(m.score) >= 9.0 ? "Mastery" : Number(m.score) >= 8.7 ? "Exceptional" : "Strong"}
                          </span>
                          <span className="font-mono font-black text-[#1A1009]">{m.score}/10</span>
                        </div>
                      </div>
                      <div className="w-full bg-[#E8D9CC]/50 h-2 rounded-full overflow-hidden shadow-[inset_0_1px_2px_rgba(43,33,28,0.08)]">
                        <div
                          className="bg-gradient-to-r from-[#E85D04] via-[#F77F00] to-[#FCBF49] h-full rounded-full shadow-[0_2px_8px_rgba(232,93,4,0.3)] transition-all duration-700"
                          style={{ width: m.pct }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* 3D Recessed AI Feedback Callout Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FFFDF9] via-white to-[#FFF6EE] border border-[#F6C29E] shadow-[inset_0_1px_2px_rgba(43,33,28,0.03),0_4px_12px_rgba(232,93,4,0.06)]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#E85D04]" />
                      <span className="font-display font-extrabold text-xs text-[#1A1009]">
                        AI Rubric Calibrated Note
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Onsite Ready
                    </span>
                  </div>
                  <p className="text-xs text-[#5C4D44] leading-relaxed font-medium">
                    &ldquo;Strong architectural framing using STAR. Caching invalidation and partition strategies were lucid. Recommended next step: deepen quantitative latency bounds under peak 100k QPS.&rdquo;
                  </p>
                  <div className="mt-3 pt-2.5 border-t border-[#E8D9CC]/60 flex items-center justify-between text-[10px] text-[#70645C]">
                    <span className="font-mono font-semibold">Rubric: Google L5 Architecture v3.4</span>
                    <Link href="/learner/interview/setup" className="font-bold text-[#E85D04] hover:underline flex items-center gap-0.5">
                      View Full Analysis <ArrowRight className="w-2.5 h-2.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Benefits content & 3D Feature Pods */}
            <div className="lg:col-span-6 space-y-6">
              <span className="badge-brand-subtle">✦ AI Feedback & Analytics</span>
              <h2 className="text-display-title">
                Actionable feedback to{" "}
                <span className="bg-gradient-to-r from-[#E85D04] to-[#F77F00] bg-clip-text text-transparent">
                  help you grow.
                </span>
              </h2>
              <p className="text-lead">
                Transform practice sessions into concrete offer readiness. Every answer is evaluated against real-world Google, Amazon, and Meta hiring rubrics.
              </p>

              {/* 3 Tactile 3D Feature Pods */}
              <div className="space-y-4 pt-2">
                {/* Pod 1 */}
                <div className="group rounded-2xl bg-gradient-to-b from-white to-[#FFFDF9] border border-[#E8D9CC] border-t-2 border-t-white p-4 shadow-[0_4px_16px_-2px_rgba(43,33,28,0.04),0_8px_16px_-4px_rgba(232,93,4,0.05),inset_0_1px_0_rgba(255,255,255,0.9)] hover:-translate-y-1 hover:shadow-[0_12px_24px_-4px_rgba(232,93,4,0.15)] hover:border-[#E85D04]/60 transition-all duration-200 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFF5EC] to-[#FEDBC4] border border-[#F6C29E] flex items-center justify-center text-[#E85D04] shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_4px_10px_rgba(232,93,4,0.12)] shrink-0 group-hover:scale-105 transition-all">
                    <Award className="w-6 h-6 text-[#E85D04]" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-display font-extrabold text-sm text-[#1A1009] group-hover:text-[#E85D04] transition-colors">
                        Multi-Dimensional Hiring Rubrics
                      </h4>
                      <span className="text-[10px] font-mono font-bold text-[#E85D04] bg-[#FFF0E6] px-2 py-0.5 rounded-full border border-[#FEDBC4]">
                        4 Vectors
                      </span>
                    </div>
                    <p className="text-xs text-[#5C4D44] leading-relaxed font-medium">
                      Comprehensive evaluation across Communication, Technical Depth, Problem Solving, and STAR Structure mapped to top-tier hiring standards.
                    </p>
                  </div>
                </div>

                {/* Pod 2 */}
                <div className="group rounded-2xl bg-gradient-to-b from-white to-[#FFFDF9] border border-[#E8D9CC] border-t-2 border-t-white p-4 shadow-[0_4px_16px_-2px_rgba(43,33,28,0.04),0_8px_16px_-4px_rgba(232,93,4,0.05),inset_0_1px_0_rgba(255,255,255,0.9)] hover:-translate-y-1 hover:shadow-[0_12px_24px_-4px_rgba(232,93,4,0.15)] hover:border-[#E85D04]/60 transition-all duration-200 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFF5EC] to-[#FEDBC4] border border-[#F6C29E] flex items-center justify-center text-[#E85D04] shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_4px_10px_rgba(232,93,4,0.12)] shrink-0 group-hover:scale-105 transition-all">
                    <TrendingUp className="w-6 h-6 text-[#E85D04]" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-display font-extrabold text-sm text-[#1A1009] group-hover:text-[#E85D04] transition-colors">
                        Sentence-by-Sentence Rubric Analysis
                      </h4>
                      <span className="text-[10px] font-mono font-bold text-[#E85D04] bg-[#FFF0E6] px-2 py-0.5 rounded-full border border-[#FEDBC4]">
                        Pinpoint
                      </span>
                    </div>
                    <p className="text-xs text-[#5C4D44] leading-relaxed font-medium">
                      Transcribes your speech in real time, highlighting stellar structured answers and identifying filler words, awkward pauses, or missing technical trade-offs.
                    </p>
                  </div>
                </div>

                {/* Pod 3 */}
                <div className="group rounded-2xl bg-gradient-to-b from-white to-[#FFFDF9] border border-[#E8D9CC] border-t-2 border-t-white p-4 shadow-[0_4px_16px_-2px_rgba(43,33,28,0.04),0_8px_16px_-4px_rgba(232,93,4,0.05),inset_0_1px_0_rgba(255,255,255,0.9)] hover:-translate-y-1 hover:shadow-[0_12px_24px_-4px_rgba(232,93,4,0.15)] hover:border-[#E85D04]/60 transition-all duration-200 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFF5EC] to-[#FEDBC4] border border-[#F6C29E] flex items-center justify-center text-[#E85D04] shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_4px_10px_rgba(232,93,4,0.12)] shrink-0 group-hover:scale-105 transition-all">
                    <Zap className="w-6 h-6 text-[#E85D04]" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-display font-extrabold text-sm text-[#1A1009] group-hover:text-[#E85D04] transition-colors">
                        Tailored Action Plans & Follow-ups
                      </h4>
                      <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Actionable
                      </span>
                    </div>
                    <p className="text-xs text-[#5C4D44] leading-relaxed font-medium">
                      Get personalized suggestions, ideal STAR phrasing templates, and targeted follow-up questions to drill until you achieve an offer-ready delivery.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons & Trust Strip */}
              <div className="pt-2 space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href="/learner/interview/setup"
                    className="inline-flex items-center gap-2 btn-brand-primary text-sm px-7 py-3.5 shadow-[0_8px_20px_rgba(232,93,4,0.35)] hover:-translate-y-0.5 transition-all"
                  >
                    <span>Try Free Practice</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                  <Link
                    href="#how-it-works"
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white border border-[#E8D9CC] text-[#2B211C] hover:border-[#E85D04] hover:text-[#E85D04] font-bold text-xs shadow-xs transition-all"
                  >
                    <span>See How It Works</span>
                  </Link>
                </div>

                <div className="flex items-center gap-4 text-[11px] font-medium text-[#70645C] pt-1">
                  <span className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#E85D04] stroke-[3]" /> Instant results in 60s
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#E85D04] stroke-[3]" /> L4-L6 hiring bar calibration
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#E85D04] stroke-[3]" /> 100% Free to start
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          SECTION 6: PRICING (MATCHING REFERENCE DESIGN)
          ========================================================= */}
      <section id="pricing" className="py-16 md:py-24 bg-[#FAF5EF] border-y border-[#E8D9CC]">
        <div className="w-full px-4 sm:px-6 md:px-10 lg:px-12 xl:px-16 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <span className="badge-brand-subtle mb-3">✦ Simple & Transparent Pricing</span>
              <h2 className="text-display-title">
                Choose the Right Plan for Your Career
              </h2>
              <p className="text-lead mt-2">
                Get access to AI interview practice, detailed feedback and job-ready preparation tools.
              </p>
            </div>

            <div className="inline-flex items-center p-1 rounded-full bg-white border border-[#E8D9CC] shadow-xs">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${billingCycle === "monthly"
                  ? "bg-[#E85D04] text-white shadow-xs"
                  : "text-[#70645C] hover:text-[#2B211C]"
                  }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${billingCycle === "yearly"
                  ? "bg-[#E85D04] text-white shadow-xs"
                  : "text-[#70645C] hover:text-[#2B211C]"
                  }`}
              >
                <span>Yearly</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${billingCycle === "yearly"
                    ? "bg-white/20 text-white"
                    : "bg-[#FFF0E6] text-[#E85D04]"
                    }`}
                >
                  Save up to 20%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch mb-12">
            {/* Free Plan */}
            <div className="rounded-3xl border border-[#EEDFD2] bg-white p-7 sm:p-8 flex flex-col justify-between h-full shadow-[0_10px_30px_rgba(43,33,28,0.04)] hover:shadow-md transition-all">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#70645C]">Free</span>
                <h3 className="font-display text-2xl font-extrabold text-[#2B211C] mt-1">Free</h3>
                <p className="text-xs sm:text-sm text-[#70645C] mt-1.5 leading-relaxed min-h-[36px]">
                  Get started with essential interview practice.
                </p>

                <div className="mt-5 pb-6 border-b border-[#E8D9CC] flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-display font-black text-[#2B211C]">$0</span>
                  <span className="text-xs font-mono text-[#70645C]">/month</span>
                </div>

                <div className="mt-6 space-y-3 text-xs sm:text-sm text-[#554A43]">
                  {[
                    "3 AI interview sessions",
                    "Basic feedback & tips",
                    "Access to common interview questions",
                    "Core role rubrics",
                  ].map((f) => (
                    <div key={f} className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#E85D04] shrink-0 stroke-[3]" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-4">
                <Link
                  href="/register"
                  className="w-full h-12 rounded-xl sm:rounded-2xl border border-[#E8D9CC] bg-[#FFFDFC] hover:bg-[#E85D04] text-[#2B211C] hover:text-white hover:border-[#E85D04] font-bold text-sm flex items-center justify-center transition-all shadow-2xs"
                >
                  Get Started
                </Link>
              </div>
            </div>

            {/* Pay as you go / Pro Plan (Most Popular) */}
            <div className="rounded-3xl border-2 border-[#E85D04] bg-gradient-to-b from-[#2E180C] via-[#381E0E] to-[#1E110A] text-white p-7 sm:p-8 flex flex-col justify-between h-full shadow-[0_20px_40px_-5px_rgba(232,93,4,0.35)] transform md:-translate-y-2 relative overflow-hidden">
              <div className="absolute top-4 right-5">
                <span className="bg-[#E85D04] text-white px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm font-mono flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" />
                  <span>Most Popular</span>
                </span>
              </div>

              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF8C38]">Recommended</span>
                <h3 className="font-display text-2xl font-extrabold text-white mt-1">Pay as you go</h3>
                <p className="text-xs sm:text-sm text-white/70 mt-1.5 leading-relaxed min-h-[36px]">
                  More practice, deeper insights, better results.
                </p>

                <div className="mt-5 pb-6 border-b border-white/15 flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-display font-black text-white">
                    ${billingCycle === "monthly" ? "9" : "7"}
                  </span>
                  <span className="text-xs font-mono text-white/60">/month</span>
                </div>

                <div className="mt-6 space-y-3 text-xs sm:text-sm text-white/85">
                  {[
                    "Unlimited AI interview sessions",
                    "Detailed AI feedback & scoring",
                    "Role-based interview preparation",
                    "Performance history & insights",
                    "Weakest-moment timestamp analysis",
                  ].map((f) => (
                    <div key={f} className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#FF8C38] shrink-0 stroke-[3]" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-4">
                <Link
                  href="/pricing"
                  className="w-full h-12 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#E85D04] via-[#F26A10] to-[#D94E00] hover:from-[#D95200] hover:to-[#B94308] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_8px_20px_-3px_rgba(232,93,4,0.5)] transition-all"
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="rounded-3xl border border-[#EEDFD2] bg-white p-7 sm:p-8 flex flex-col justify-between h-full shadow-[0_10px_30px_rgba(43,33,28,0.04)] hover:shadow-md transition-all">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#70645C]">Organizations</span>
                <h3 className="font-display text-2xl font-extrabold text-[#2B211C] mt-1">Enterprise</h3>
                <p className="text-xs sm:text-sm text-[#70645C] mt-1.5 leading-relaxed min-h-[36px]">
                  For teams, universities and organizations.
                </p>

                <div className="mt-5 pb-6 border-b border-[#E8D9CC] flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-display font-black text-[#2B211C]">
                    ${billingCycle === "monthly" ? "20" : "16"}
                  </span>
                  <span className="text-xs font-mono text-[#70645C]">/month</span>
                </div>

                <div className="mt-6 space-y-3 text-xs sm:text-sm text-[#554A43]">
                  {[
                    "Everything in Pay as you go",
                    "Team management & reporting",
                    "Custom interview scenarios",
                    "Dedicated support",
                    "Custom rubric benchmarks",
                  ].map((f) => (
                    <div key={f} className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#E85D04] shrink-0 stroke-[3]" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-4">
                <Link
                  href="/pricing"
                  className="w-full h-12 rounded-xl sm:rounded-2xl border border-[#E8D9CC] bg-[#FFFDFC] hover:bg-[#E85D04] text-[#2B211C] hover:text-white hover:border-[#E85D04] font-bold text-sm flex items-center justify-center transition-all shadow-2xs"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>

          {/* Trust Bar */}
          <div className="rounded-2xl bg-white border border-[#EEDFD2] p-6 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="flex items-center justify-center gap-2.5 text-xs sm:text-sm font-semibold text-[#2B211C]">
                <ShieldCheck className="h-5 w-5 text-[#E85D04]" />
                <span>Secure & Private</span>
              </div>
              <div className="flex items-center justify-center gap-2.5 text-xs sm:text-sm font-semibold text-[#2B211C]">
                <Zap className="h-5 w-5 text-[#E85D04]" />
                <span>AI-Powered Practice</span>
              </div>
              <div className="flex items-center justify-center gap-2.5 text-xs sm:text-sm font-semibold text-[#2B211C]">
                <BarChart3 className="h-5 w-5 text-[#E85D04]" />
                <span>Real Feedback</span>
              </div>
              <div className="flex items-center justify-center gap-2.5 text-xs sm:text-sm font-semibold text-[#2B211C]">
                <Users className="h-5 w-5 text-[#E85D04]" />
                <span>Trusted by Professionals</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          SECTION 7: TESTIMONIALS (3D CANDIDATE PLACEMENT SHOWCASE)
          ========================================================= */}
      <section
        id="testimonials"
        className="py-16 md:py-24 bg-gradient-to-b from-[#FFFDF9] via-[#FFF9F3] to-[#FFFCF8] border-b border-[#E8D9CC]/80 relative overflow-hidden"
      >
        {/* Soft Ambient Warm Glow Atmosphere */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 right-0 w-[550px] h-[380px] bg-gradient-to-bl from-[#FEDBC4]/40 via-transparent to-transparent blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 left-0 w-[500px] h-[350px] bg-gradient-to-tr from-[#FEDBC4]/30 via-transparent to-transparent blur-3xl"
        />

        <div className="section-container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">

            {/* Left: Heading, Stats & Controls */}
            <div className="lg:col-span-4 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wide uppercase bg-[#FFF0E6] text-[#E85D04] border border-[#FEDBC4] shadow-2xs">
                  ✦ Candidate Success
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-display font-black text-[#1A1009] tracking-tight leading-[1.1]">
                  Trusted by candidates who got{" "}
                  <span className="text-[#E85D04]">placed.</span>
                </h2>
                <p className="text-xs sm:text-sm text-[#70645C] font-medium leading-relaxed">
                  Real feedback from engineers, product managers, and analysts who calibrated their interview technique and cleared bar-raising rounds at global tech leaders.
                </p>

                {/* Social Proof Stats Pod */}
                <div className="pt-1 flex flex-col gap-3">
                  <div className="p-4 rounded-2xl bg-white border border-[#EFE4D8] shadow-[0_4px_16px_rgba(43,33,28,0.04)] flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1 text-amber-500 mb-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                        <span className="font-mono font-bold text-xs text-[#1A1009] ml-1.5">4.9 / 5</span>
                      </div>
                      <p className="text-[11px] text-[#70645C] font-medium">Over 12,400+ mock interviews completed</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono font-bold text-[10px]">
                      94.2% Hired
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation & Indicator Dots */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1.5">
                  {testimonials.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setTestimonialIndex(idx)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        testimonialIndex === idx ? "w-6 bg-[#E85D04]" : "w-2 bg-[#E8D9CC] hover:bg-[#D4C3B5]"
                      }`}
                      aria-label={`Go to testimonial ${idx + 1}`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() =>
                      setTestimonialIndex((p) => (p > 0 ? p - 1 : testimonials.length - 1))
                    }
                    className="w-10 h-10 rounded-full bg-white border border-[#E8D9CC] hover:border-[#E85D04] hover:text-[#E85D04] shadow-xs flex items-center justify-center text-[#2B211C] hover:-translate-y-0.5 transition-all"
                    aria-label="Previous testimonial"
                  >
                    <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                  </button>
                  <button
                    onClick={() =>
                      setTestimonialIndex((p) => (p < testimonials.length - 1 ? p + 1 : 0))
                    }
                    className="w-10 h-10 rounded-full bg-[#E85D04] hover:bg-[#D04D00] shadow-[0_4px_14px_rgba(232,93,4,0.35)] flex items-center justify-center text-white hover:-translate-y-0.5 transition-all"
                    aria-label="Next testimonial"
                  >
                    <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right: 3D Cards Grid */}
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
              {visibleTestimonials.map((t, idx) => (
                <div
                  key={`${t.name}-${idx}`}
                  className="group relative z-10 flex flex-col justify-between rounded-3xl bg-white border border-[#EFE4D8] p-5 sm:p-5.5 shadow-[0_8px_30px_rgba(43,33,28,0.06),0_2px_8px_rgba(232,93,4,0.03)] hover:-translate-y-1.5 hover:shadow-[0_18px_40px_-8px_rgba(232,93,4,0.18)] hover:border-[#E85D04]/60 transition-all duration-300"
                >
                  <div>
                    {/* Card Top: Stars + Company Placement Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {[...Array(t.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-[#FFF2E8] border border-[#FEDBC4] text-[#E85D04]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#E85D04]" />
                        Placed @ {t.company}
                      </span>
                    </div>

                    {/* Decorative Quote Mark */}
                    <div className="text-3xl font-serif text-[#E85D04]/30 leading-none select-none mb-1">
                      “
                    </div>

                    {/* Quote text */}
                    <p className="text-xs sm:text-[13px] text-[#2B211C] leading-relaxed font-normal">
                      &ldquo;{t.quote}&rdquo;
                    </p>

                    {/* Practice Track Tag */}
                    <div className="mt-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FFFBF8] border border-[#F3E5D8] text-[10px] font-mono text-[#7A6E65]">
                        <Target className="w-3 h-3 text-[#E85D04]" /> {t.track}
                      </span>
                    </div>
                  </div>

                  {/* Card Footer: Candidate Profile + Verified Outcome */}
                  <div className="mt-4 pt-3 border-t border-[#F0E4D8] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.avatarBg} border border-white shadow-xs flex items-center justify-center font-display font-black text-xs shrink-0`}
                        style={{ color: t.avatarColor }}
                      >
                        {t.name[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="font-display font-bold text-xs text-[#1A1009] whitespace-nowrap">{t.name}</p>
                          <Check className="w-3 h-3 text-emerald-600 stroke-[3] shrink-0" />
                        </div>
                        <p className="text-[10px] text-[#70645C] font-medium truncate">{t.role}</p>
                      </div>
                    </div>

                    {/* Comp Hike / Outcome Pill */}
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono font-bold text-[9px] shrink-0 whitespace-nowrap">
                      {t.hike}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          SECTION 8: FAQ (3D FLOATING ACCORDION & CANDIDATE ADVISORY)
          ========================================================= */}
      <section
        id="faqs"
        className="py-16 md:py-24 bg-gradient-to-b from-[#FFFCF8] via-[#FAF5EF] to-[#FFFDF9] border-b border-[#E8D9CC]/80 relative overflow-hidden"
      >
        {/* Soft Ambient Warm Glow Atmosphere */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 right-0 w-[550px] h-[380px] bg-gradient-to-bl from-[#FEDBC4]/35 via-transparent to-transparent blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 left-0 w-[500px] h-[350px] bg-gradient-to-tr from-[#FEDBC4]/25 via-transparent to-transparent blur-3xl"
        />

        <div className="section-container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">

            {/* Left: Heading & Support Card */}
            <div className="lg:col-span-4 space-y-6">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wide uppercase bg-[#FFF0E6] text-[#E85D04] border border-[#FEDBC4] shadow-2xs">
                  ✦ Everything You Need To Know
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-display font-black text-[#1A1009] tracking-tight leading-[1.1]">
                  Frequently Asked{" "}
                  <span className="text-[#E85D04]">Questions.</span>
                </h2>
                <p className="text-xs sm:text-sm text-[#70645C] font-medium leading-relaxed">
                  Direct answers about our real-time duplex voice engine, company rubric calibration, privacy sandbox, and practice plans.
                </p>
              </div>

              {/* 3D Support & Candidate Advisory Card */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#EFE4D8] shadow-[0_8px_30px_rgba(43,33,28,0.06),0_2px_8px_rgba(232,93,4,0.03)] space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FFEFE5] to-[#FEDAC2] border border-[#FCD2B3] flex items-center justify-center text-[#E85D04] shadow-2xs shrink-0">
                    <MessageSquare className="w-5 h-5 text-[#E85D04]" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm text-[#1A1009]">Still have questions?</h4>
                    <p className="text-[11px] text-[#70645C]">Our candidate advisory team is here.</p>
                  </div>
                </div>

                <p className="text-xs text-[#70645C] leading-relaxed">
                  Need guidance calibrating your interview track for a specific company or role level? Connect with our team for advice.
                </p>

                <div className="pt-2 border-t border-[#F0E4D8] flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-emerald-700 font-bold font-mono text-[10px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Support Active
                  </span>
                  <Link
                    href="/contact"
                    className="font-mono font-bold text-[#E85D04] flex items-center gap-1 hover:underline"
                  >
                    Contact Team →
                  </Link>
                </div>
              </div>
            </div>

            {/* Right: 3D Accordion Pods */}
            <div className="lg:col-span-8 space-y-3 sm:space-y-3.5">
              {faqs.map((faq, index) => {
                const isOpen = activeFaq === index;
                return (
                  <div
                    key={index}
                    className={`rounded-2xl lg:rounded-[22px] transition-all duration-300 overflow-hidden ${
                      isOpen
                        ? "bg-white border-2 border-[#E85D04] shadow-[0_12px_36px_rgba(232,93,4,0.15)] -translate-y-0.5"
                        : "bg-white border border-[#EFE4D8] shadow-[0_4px_16px_rgba(43,33,28,0.03)] hover:border-[#E85D04]/60 hover:shadow-[0_8px_24px_rgba(232,93,4,0.08)] hover:-translate-y-0.5"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveFaq(isOpen ? null : index)}
                      className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4"
                      aria-expanded={isOpen}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 transition-colors ${
                            isOpen
                              ? "bg-[#E85D04] text-white"
                              : "bg-[#FFF2E8] border border-[#FEDBC4] text-[#E85D04]"
                          }`}
                        >
                          0{index + 1}
                        </span>
                        <span className="font-display font-bold text-sm sm:text-[15px] text-[#1A1009] leading-snug">
                          {faq.q}
                        </span>
                      </div>
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                          isOpen
                            ? "bg-[#E85D04] text-white shadow-[0_2px_8px_rgba(232,93,4,0.4)] rotate-180"
                            : "bg-[#FFF5EE] border border-[#FEDBC4] text-[#E85D04]"
                        }`}
                      >
                        {isOpen ? (
                          <Minus className="w-4 h-4 stroke-[2.5]" />
                        ) : (
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                        )}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-3 border-t border-[#F0E4D8] animate-in fade-in duration-200">
                        <p className="text-xs sm:text-[13px] text-[#5C5047] leading-relaxed font-normal">
                          {faq.a}
                        </p>
                        {faq.tag && (
                          <div className="mt-3.5 flex items-center justify-between text-[11px]">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FFFBF8] border border-[#F3E5D8] font-mono text-[10px] text-[#E85D04] font-semibold">
                              <Check className="w-3 h-3 text-[#E85D04] stroke-[3]" /> {faq.tag}
                            </span>
                            <span className="text-[10px] font-mono text-[#A6978E]">
                              Category: {faq.category}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          SECTION 9: FINAL CTA BANNER
          ========================================================= */}
      <section className="py-14 md:py-20 bg-[#FFFCF8]">
        <div className="section-container">
          <div className="relative rounded-3xl bg-[#2B211C] p-8 sm:p-12 md:p-16 overflow-hidden shadow-2xl">
            {/* Radial glows */}
            <div className="absolute -right-16 -bottom-16 w-[550px] h-[550px] bg-[radial-gradient(circle,rgba(232,93,4,0.25),transparent_65%)] pointer-events-none" />
            <div className="absolute top-0 left-1/4 w-[400px] h-[300px] bg-[radial-gradient(circle,rgba(242,140,69,0.1),transparent_70%)] pointer-events-none" />
            {/* Orange curve SVG */}
            <svg
              aria-hidden="true"
              className="absolute -bottom-10 -left-10 w-72 h-72 opacity-10 pointer-events-none"
              viewBox="0 0 288 288"
              fill="none"
            >
              <ellipse cx="144" cy="200" rx="200" ry="150" fill="#E85D04" />
            </svg>
            {/* Brand watermark */}
            <div
              aria-hidden="true"
              className="absolute -bottom-16 right-10 w-56 h-56 opacity-[0.065] pointer-events-none bg-no-repeat bg-contain"
              style={{ backgroundImage: "url('/brand/patterns/brand-symbol-watermark.svg')" }}
            />

            <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
              <div className="flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-[#E85D04]/30 border border-[#E85D04]/40 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#F28C45]" />
                </div>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-white leading-tight">
                Ready to ace your next interview?
                <span className="text-[#F28C45] block mt-1">
                  Join thousands of learners today.
                </span>
              </h2>

              <p className="text-sm sm:text-base text-white/75 max-w-xl mx-auto leading-relaxed">
                Join thousands of students and experienced engineers who practice their live technical and
                behavioral rounds with TopPlaced AI.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/learner/interview/setup"
                  className="btn-brand-primary text-sm px-8 py-4 shadow-brand-glow hover:shadow-brand-glow-lg hover:scale-105 transition-all"
                >
                  <span>Start Free Practice</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
                <span className="text-xs text-white/55 font-mono">No credit card required</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FOOTER
          ========================================================= */}
      <footer className="pt-14 pb-8 bg-[#2B211C] text-white/75 border-t border-white/10 text-xs">
        <div className="section-container">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-10 border-b border-white/10">

            <div className="md:col-span-5 space-y-4">
              <Link href="/" aria-label="TopPlaced AI">
                <Logo size="md" variant="dark" />
              </Link>
              <p className="text-xs text-white/65 max-w-sm leading-relaxed">
                An AI-powered interview preparation platform to help you practice, get feedback, and build the
                confidence to land your next opportunity.
              </p>
            </div>

            <div className="md:col-span-2 space-y-3">
              <p className="text-xs font-mono font-bold uppercase tracking-wider text-white">Platform</p>
              <ul className="space-y-2 text-white/65">
                {[
                  { label: "Home", href: "/#" },
                  { label: "How It Works", href: "/#how-it-works" },
                  { label: "Features", href: "/#features" },
                  { label: "Pricing", href: "/#pricing" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="hover:text-[#F28C45] transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-2 space-y-3">
              <p className="text-xs font-mono font-bold uppercase tracking-wider text-white">Resources</p>
              <ul className="space-y-2 text-white/65">
                {[
                  { label: "Testimonials", href: "/#testimonials" },
                  { label: "FAQ", href: "/#faqs" },
                  { label: "About Us", href: "/about" },
                  { label: "Contact", href: "/contact" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="hover:text-[#F28C45] transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-3 space-y-3">
              <p className="text-xs font-mono font-bold uppercase tracking-wider text-white">Company</p>
              <ul className="space-y-2 text-white/65">
                {[
                  { label: "Privacy Policy", href: "/privacy" },
                  { label: "Terms of Service", href: "/terms" },
                  { label: "Security", href: "/security" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="hover:text-[#F28C45] transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-2.5 pt-3">
                {[
                  { href: "https://linkedin.com", label: "LinkedIn", Icon: Linkedin },
                  { href: "https://twitter.com", label: "Twitter (X)", Icon: Twitter },
                  { href: "https://youtube.com", label: "YouTube", Icon: Youtube },
                  { href: "https://instagram.com", label: "Instagram", Icon: Instagram },
                ].map(({ href, label, Icon }) => (
                  <a
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#E85D04] text-white flex items-center justify-center transition-all"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-white/50">
            <p>© 2026 TopPlaced AI. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="/terms" className="hover:text-[#F28C45] transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="hover:text-[#F28C45] transition-colors">
                Privacy Policy
              </Link>
              <Link href="/security" className="hover:text-[#F28C45] transition-colors">
                Security
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* =========================================================
          VIDEO DEMO MODAL
          ========================================================= */}
      {showDemoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setShowDemoModal(false)}
        >
          <div
            className="relative w-full max-w-3xl rounded-3xl bg-white border border-[#E8D9CC] overflow-hidden p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E8D9CC]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E85D04]" />
                <h3 className="text-sm font-bold text-[#2B211C]">TopPlaced AI Walkthrough</h3>
              </div>
              <button
                onClick={() => setShowDemoModal(false)}
                className="text-[#70645C] hover:text-[#2B211C] text-sm px-2 py-1 rounded-md hover:bg-[#FFFCF8] transition-colors"
                aria-label="Close demo modal"
              >
                ✕ Close
              </button>
            </div>
            <div className="aspect-video w-full rounded-2xl bg-[#2B211C] flex flex-col items-center justify-center border border-[#E8D9CC] p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#E85D04] text-white flex items-center justify-center shadow-lg">
                <Play className="w-8 h-8 fill-current translate-x-0.5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Full Duplex AI Voice Interview Walkthrough</h4>
                <p className="text-xs text-white/70 max-w-md mt-1">
                  Watch a complete mock technical round with real-time STAR rubric scoring.
                </p>
              </div>
              <Link
                href="/learner/interview/setup"
                onClick={() => setShowDemoModal(false)}
                className="btn-brand-primary text-xs px-6 py-2.5"
              >
                <span>Launch Live Practice Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
