"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import { CheckCircle2 } from "lucide-react";

interface AuthIllustrationPanelProps {
  headline?: string;
  subtext?: string;
  features?: string[];
}

export default function AuthIllustrationPanel({
  headline = "Your next opportunity starts here.",
  subtext = "Practice with confidence, improve your skills, and prepare for your next big career move.",
  features = [
    "AI-powered mock interviews",
    "Real-time feedback & scoring",
    "Role-specific preparation",
  ],
}: AuthIllustrationPanelProps) {
  return (
    <section
      className="relative hidden lg:flex flex-col overflow-hidden shrink-0 z-10"
      style={{ width: "50%", borderRadius: "0 48px 48px 0" }}
    >
      {/* Background image — user: save sidebar image to /public/images/auth/sidebar.webp */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('/images/auth/sidebar.webp'), url('/images/hero_interviewer.jpg')",
          backgroundColor: "#2B211C",
        }}
      />

      {/* Gradient overlay — dark top + dark bottom, clear middle to show face */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(170deg, rgba(43,33,28,0.80) 0%, rgba(43,33,28,0.20) 38%, rgba(43,33,28,0.08) 55%, rgba(43,33,28,0.85) 100%)",
        }}
      />

      {/* Warm orange accent glow */}
      <div
        className="absolute -top-24 -left-24 h-96 w-96 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(232,93,4,0.55) 0%, transparent 70%)",
          filter: "blur(72px)",
          opacity: 0.3,
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col p-10 xl:p-14">
        {/* Top: Logo */}
        <div>
          <Link
            href="/"
            aria-label="TopPlaced AI Home"
            className="inline-block transition-opacity hover:opacity-80"
          >
            <Logo size="sm" variant="redsun" />
          </Link>
        </div>

        {/* Bottom: Brand text */}
        <div className="mt-auto pt-20">
          <h2 className="text-3xl xl:text-[2.15rem] font-extrabold text-white leading-[1.1] tracking-tight">
            {headline}
          </h2>
          <p className="mt-3 text-sm text-white/60 leading-relaxed max-w-[300px]">
            {subtext}
          </p>
          <div className="mt-7 flex flex-col gap-3">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E85D04]/25 border border-[#E85D04]/50">
                  <CheckCircle2 className="h-3 w-3 text-[#F28C45]" />
                </div>
                <span className="text-sm font-medium text-white/80">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
