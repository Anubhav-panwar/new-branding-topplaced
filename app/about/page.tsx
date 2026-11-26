"use client";

import Link from "next/link";
import { motion, MotionConfig } from "framer-motion";
import Navbar from "@/components/Navbar";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import {
  RedSunBackdrop,
  RedSunEclipseArc,
  RedSunBentoCard,
  RedSunCheckItem,
} from "@/components/marketing/RedSunPrimitives";
import {
  Sparkles,
  Headphones,
  Code2,
  BarChart3,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

export default function AboutPage() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="redsun-theme min-h-screen bg-[#FFFCF8] text-[#2B211C] relative overflow-x-clip flex flex-col">
        <RedSunBackdrop variant="subpage" />
        <Navbar />

        <main className="flex-1 pt-16 md:pt-24 pb-24 relative z-10">
          <div className="max-w-none w-full mx-auto px-6 md:px-10">
            {/* Hero matching RedSun About orbital silhouette */}
            <motion.header
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-center mb-14 relative"
            >
              <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 opacity-40">
                <RedSunEclipseArc position="orbit" />
              </div>

              <h1 className="text-[38px] sm:text-5xl md:text-[62px] font-medium tracking-[-0.02em] text-[#2B211C] mb-5 leading-[1.16] relative">
                Built to make{" "}
                <span className="redsun-title-gradient">interview prep</span>{" "}
                <span className="block text-[#E85D04]">actually useful.</span>
              </h1>
              <p className="text-base text-[#70645C] max-w-3xl mx-auto leading-relaxed relative">
                TopPlaced is an AI-first interview and assessment platform. We help learners
                practice with realistic interviews, get measurable feedback, and show companies what
                they can actually do—beyond just a résumé.
              </p>
            </motion.header>

            {/* Main Glass Container */}
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="redsun-grid-frame"
            >
              <div className="redsun-grid-card p-6 md:p-10 space-y-12 bg-[#FFFFFF]">
                {/* Mission + Focus */}
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-start">
                  <div className="space-y-4 text-sm md:text-[15px] leading-relaxed">
                    <h2 className="text-2xl md:text-3xl font-medium text-[#2B211C] flex items-center gap-2.5">
                      <Sparkles className="h-5 w-5 text-[#E85D04]" />
                      <span>Our mission</span>
                    </h2>
                    <p className="text-[#2B211C]">
                      We started TopPlaced with a simple idea:{" "}
                      <span className="font-semibold text-[#2B211C]">
                        interviews should measure skill, not just confidence.
                      </span>{" "}
                      Traditional prep focuses on memorizing answers. We focus on helping you
                      practice real scenarios with instant, structured feedback—so you actually
                      get better.
                    </p>
                    <p className="text-[#70645C]">
                      Whether you&apos;re preparing for your first job, switching roles, or aiming
                      for top companies, TopPlaced gives you an always-available AI interviewer that
                      never gets tired and always has one more question ready.
                    </p>
                  </div>

                  {/* Side focus panel */}
                  <div className="rounded-2xl border border-[#E8D9CC] bg-[#FFFCF8] p-6 shadow-sm text-sm">
                    <p className="text-xs uppercase tracking-wider text-[#E85D04] font-semibold mb-4">
                      What TopPlaced focuses on
                    </p>
                    <div className="space-y-3">
                      <RedSunCheckItem>
                        Realistic interview flows (behavioral &amp; technical)
                      </RedSunCheckItem>
                      <RedSunCheckItem>
                        Clear scorecards instead of vague feedback
                      </RedSunCheckItem>
                      <RedSunCheckItem>
                        Actionable tips on how to improve next attempt
                      </RedSunCheckItem>
                      <RedSunCheckItem>
                        Verified skills shareable with recruiters
                      </RedSunCheckItem>
                    </div>
                  </div>
                </div>

                {/* 3 Pillar Bento Grid */}
                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    {
                      title: "What we offer",
                      desc: "Voice-based interviews, coding prompts, case-style questions, and role-specific scenarios—run by AI and tailored to your level.",
                      icon: Headphones,
                    },
                    {
                      title: "Why it works",
                      desc: "Adaptive question difficulty, structured rubrics, and targeted feedback so each session teaches you something specific to fix—not just a score.",
                      icon: BarChart3,
                    },
                    {
                      title: "Who it's for",
                      desc: "Developers, product folks, fresh graduates, and professionals switching careers—anyone who wants structured practice and proof of progress.",
                      icon: Code2,
                    },
                  ].map((item, idx) => {
                    const IconComp = item.icon;
                    return (
                      <RedSunBentoCard key={item.title} delay={idx * 0.06} innerClassName="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="h-10 w-10 rounded-xl bg-[#E85D04] border border-[#E8D9CC] flex items-center justify-center text-white shadow-[0_6px_16px_rgba(221,98,15,0.35)] shrink-0">
                            <IconComp className="h-4 w-4" />
                          </span>
                          <h3 className="text-base font-semibold text-[#2B211C]">{item.title}</h3>
                        </div>
                        <p className="text-[#70645C] text-xs sm:text-sm leading-relaxed">
                          {item.desc}
                        </p>
                      </RedSunBentoCard>
                    );
                  })}
                </div>

                {/* Values + CTA row */}
                <div className="grid md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-8 items-center pt-2 border-t border-[#E8D9CC]">
                  <div className="rounded-2xl border border-[#E8D9CC] bg-[#FFFCF8] p-6 space-y-3.5 text-sm">
                    <h3 className="flex items-center gap-2 text-base font-semibold text-[#2B211C]">
                      <ShieldCheck className="h-5 w-5 text-[#E85D04]" />
                      <span>Our principles</span>
                    </h3>
                    <div className="space-y-2.5">
                      <RedSunCheckItem>
                        Be honest about how AI evaluates and scores.
                      </RedSunCheckItem>
                      <RedSunCheckItem>
                        Focus on learning, not just &quot;passing&quot; a test.
                      </RedSunCheckItem>
                      <RedSunCheckItem>
                        Respect candidate privacy and data ownership.
                      </RedSunCheckItem>
                      <RedSunCheckItem>
                        Continuously improve fairness and quality of feedback.
                      </RedSunCheckItem>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-[#2B211C]">Get started</h3>
                    <p className="text-[#70645C] text-sm leading-relaxed">
                      Create an account, choose a role you&apos;re targeting, and start your first
                      AI interview in minutes. You&apos;ll get a clear scorecard and improvement plan
                      after every session.
                    </p>

                    <div className="flex flex-wrap gap-3 pt-2">
                      <Link
                        href="/contact"
                        className="redsun-btn-glow inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold min-h-[44px]"
                      >
                        <span>Talk to us</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                      <Link
                        href="/security"
                        className="redsun-btn-simple inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium min-h-[44px]"
                      >
                        Security &amp; Trust
                      </Link>
                      <Link
                        href="/privacy"
                        className="redsun-btn-simple inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium min-h-[44px]"
                      >
                        Privacy &amp; data
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          </div>
        </main>

        <MarketingFooter />
      </div>
    </MotionConfig>
  );
}
