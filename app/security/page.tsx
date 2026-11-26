"use client";

import React, { useState, useEffect } from "react";
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
  Lock,
  Eye,
  Server,
  KeyRound,
  Fingerprint,
  Cpu,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

export default function SecurityPage() {
  const [mounted, setMounted] = useState(false);
  const user = useSelector((state: RootState) => state.auth.user);
  const isAdmin = user?.role === "admin" || (user as any)?.isAdmin === true;

  useEffect(() => {
    setMounted(true);
  }, []);

  const securityPillars = [
    {
      title: "End-to-End Cryptography",
      desc: "All communications utilize TLS 1.3 encryption with strict certificate validation. Candidate credentials, authentication tokens, and sensitive records are hashed with salted bcrypt and AES-256 at rest.",
      icon: Lock,
      bullets: [
        "Zero plaintext credential persistence",
        "TLS 1.3 enforced across all API endpoints",
        "Ephemeral pairing tokens with SHA-256 hashing",
      ],
    },
    {
      title: "AI Proctoring & Privacy",
      desc: "Real-time multi-face, gaze direction, and smartphone detection run directly on client-side neural vision models. Media feeds are processed ephemerally and never sold or shared with third-party advertisers.",
      icon: Eye,
      bullets: [
        "Client-side MediaPipe landmark detection",
        "Webcam and screen share proctoring calibration",
        "Explicit candidate consent before stream start",
      ],
    },
    {
      title: "Isolated Code Sandbox",
      desc: "Candidate coding solutions execute in isolated ephemeral Docker containers with strict resource, time, and network constraints. In production, execution fails closed if container isolation is unavailable.",
      icon: Cpu,
      bullets: [
        "Complete network disconnection (--network=none)",
        "Read-only root filesystem with noexec tmpfs",
        "Pre-execution AST security filter for prohibited calls",
      ],
    },
    {
      title: "Strict IDOR & RBAC Controls",
      desc: "Every API route strictly verifies ownership. Resume downloads, contact inquiries, achievements, and live interview sessions cannot be accessed across user boundaries.",
      icon: Fingerprint,
      bullets: [
        "Path traversal prevention on file uploads",
        "Socket.IO session ownership verification",
        "Admin role verification on privileged queries",
      ],
    },
    {
      title: "Brute-Force & DoS Throttling",
      desc: "High-frequency rate-limiting middleware guards all authentication and interview endpoints. OTP verification is strictly throttled to 5 attempts per 10 minutes to prevent brute-force attacks.",
      icon: ShieldAlert,
      bullets: [
        "Automated 429 Too Many Requests enforcement",
        "Output size caps (64KB max stdout)",
        "CORS restrictions to verified origin domains",
      ],
    },
    {
      title: "Cloud Database & Health Audits",
      desc: "Backed by resilient MongoDB Atlas clusters with automatic connection failover, real-time health checks, and strict data isolation between local development fallback and cloud persistence.",
      icon: Server,
      bullets: [
        "Live connection monitoring via /health",
        "TLS certificate store verification (certifi)",
        "Zero local fallback mixing in cloud mode",
      ],
    },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div className="redsun-theme min-h-screen bg-[#FFFCF8] text-[#2B211C] relative overflow-x-clip flex flex-col">
        <RedSunBackdrop variant="subpage" />
        <Navbar />

        <main className="flex-1 max-w-none mx-auto w-full px-4 sm:px-6 lg:px-8 pt-16 md:pt-24 pb-24 space-y-16 relative z-10">
          {/* Hero Section echoing RedSun inverted bottom arc */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-center max-w-3xl mx-auto space-y-5 relative"
          >
            <h1 className="text-[38px] sm:text-5xl md:text-[62px] font-medium tracking-[-0.02em] text-[#2B211C] leading-[1.16]">
              Security, Privacy &amp;{" "}
              <span className="block redsun-title-gradient">
                Integrity Without Compromise
              </span>
            </h1>

            <p className="text-base text-[#70645C] leading-relaxed max-w-2xl mx-auto">
              TopPlaced AI is engineered with defense-in-depth principles. From ephemeral proctoring
              streams to containerized execution sandboxes, every layer safeguards candidate privacy
              and assessment authenticity.
            </p>

            {mounted && isAdmin && (
              <div className="pt-2">
                <Link
                  href="/admin/permissions"
                  className="redsun-btn-glow inline-flex items-center gap-2 px-5 py-2.5 font-semibold text-xs uppercase tracking-wider min-h-[44px]"
                >
                  <KeyRound size={15} />
                  <span>Admin Access Control &amp; Audit Logs</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}

            <div className="-mt-4 -mb-6 opacity-80">
              <RedSunEclipseArc position="bottom" />
            </div>
          </motion.div>

          {/* 6 Security Pillars in RedSun Double-Framed Bento Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {securityPillars.map((pillar, idx) => {
              const IconComp = pillar.icon;
              return (
                <RedSunBentoCard
                  key={pillar.title}
                  delay={idx * 0.05}
                  innerClassName="p-6 md:p-7 flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-[#E85D04] border border-[#E8D9CC] flex items-center justify-center text-white shadow-[0_6px_18px_rgba(221,98,15,0.35)]">
                      <IconComp size={22} />
                    </div>
                    <h2 className="text-lg font-semibold text-[#2B211C]">{pillar.title}</h2>
                    <p className="text-xs sm:text-sm text-[#70645C] leading-relaxed">
                      {pillar.desc}
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-4 border-t border-white/[0.08]">
                    {pillar.bullets.map((b) => (
                      <RedSunCheckItem key={b}>{b}</RedSunCheckItem>
                    ))}
                  </div>
                </RedSunBentoCard>
              );
            })}
          </div>

          {/* Responsible Disclosure Conversion Banner */}
          <div className="relative rounded-[26px] bg-[#FFFFFF] border border-[#E8D9CC] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden shadow-sm">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-16 -right-16 w-80 h-60 opacity-40"
              style={{
                background:
                  "radial-gradient(circle at 100% 100%, rgba(242, 106, 10, 0.2), transparent 65%)",
              }}
            />
            <div className="space-y-2 text-center md:text-left relative z-10">
              <h3 className="text-xl font-semibold text-[#2B211C]">
                Security Vulnerability Disclosure
              </h3>
              <p className="text-xs sm:text-sm text-[#70645C] max-w-xl leading-relaxed">
                We take platform security seriously. If you have discovered a potential security
                vulnerability, please submit a report to our security team for responsible review.
              </p>
            </div>
            <Link
              href="/contact"
              className="px-6 py-3 font-semibold text-xs uppercase tracking-wider shrink-0 relative z-10 min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#E85D04] to-[#E85D04] hover:from-[#E85D04] hover:to-[#D95304] text-[#2B211C] font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer"
            >
              <span>Contact Security Team</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </main>

        <MarketingFooter />
      </div>
    </MotionConfig>
  );
}
