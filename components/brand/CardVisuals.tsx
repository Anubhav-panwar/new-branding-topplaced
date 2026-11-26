import React from "react";
import Image from "next/image";
import { Mic, CheckCircle2, ShieldCheck, Sparkles, TrendingUp, Award, BarChart3 } from "lucide-react";

/**
 * AIInterviewCardVisual — Warm background, waveform graphics, duplex latency badge.
 */
export function AIInterviewCardVisual() {
  return (
    <div className="relative mt-4 overflow-hidden rounded-xl bg-[#2B211C] p-4 text-white shadow-inner">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#E85D04]/25 blur-2xl"
      />
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#E85D04] animate-ping" />
          <span className="font-mono text-xs font-semibold text-white/90">Duplex Voice Stream</span>
        </div>
        <span className="font-mono text-[10px] text-[#F9E6D4] bg-white/10 px-2 py-0.5 rounded-full">
          42ms Latency
        </span>
      </div>

      <div className="mt-3 flex items-center justify-center gap-1.5 py-1">
        <span className="h-4 w-1 rounded-full bg-[#E85D04] animate-pulse" />
        <span className="h-7 w-1 rounded-full bg-[#F28C45] animate-pulse delay-75" />
        <span className="h-10 w-1.5 rounded-full bg-[#E85D04] animate-pulse delay-100" />
        <span className="h-6 w-1 rounded-full bg-[#F9E6D4] animate-pulse delay-150" />
        <span className="h-12 w-1.5 rounded-full bg-[#E85D04] animate-pulse delay-200" />
        <span className="h-8 w-1 rounded-full bg-[#F28C45] animate-pulse delay-100" />
        <span className="h-4 w-1 rounded-full bg-[#E85D04] animate-pulse" />
      </div>

      <div className="mt-2 text-center text-[11px] text-white/70 italic">
        &ldquo;Evaluating database sharding strategy...&rdquo;
      </div>
    </div>
  );
}

/**
 * PerformanceAnalyticsCardVisual — Clean editorial chart with STAR rubric scores.
 */
export function PerformanceAnalyticsCardVisual() {
  return (
    <div className="relative mt-4 overflow-hidden rounded-xl border border-[#E8D9CC] bg-[#FFFDFC] p-3.5 shadow-2xs">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[11px] font-bold text-[#2B211C] uppercase tracking-wider">
          STAR Competency Matrix
        </span>
        <span className="font-mono text-xs font-bold text-[#E85D04]">9.4 / 10 Target</span>
      </div>

      <div className="space-y-2 text-[11px]">
        <div>
          <div className="flex justify-between text-[#70645C] mb-0.5">
            <span>Situation / Constraints</span>
            <span className="font-mono font-bold text-[#2B211C]">9.2</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#E8D9CC]/50 overflow-hidden">
            <div className="h-full rounded-full bg-[#E85D04]" style={{ width: "92%" }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[#70645C] mb-0.5">
            <span>Action / Technical Depth</span>
            <span className="font-mono font-bold text-[#2B211C]">9.6</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#E8D9CC]/50 overflow-hidden">
            <div className="h-full rounded-full bg-[#E85D04]" style={{ width: "96%" }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[#70645C] mb-0.5">
            <span>Measurable Result</span>
            <span className="font-mono font-bold text-[#2B211C]">9.1</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#E8D9CC]/50 overflow-hidden">
            <div className="h-full rounded-full bg-[#B94308]" style={{ width: "91%" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * AIFeedbackCardVisual — Layered feedback panels with actionable items.
 */
export function AIFeedbackCardVisual() {
  return (
    <div className="relative mt-4 space-y-2 text-xs">
      <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-2.5 flex items-start gap-2 text-emerald-900 shadow-2xs">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-[11px] block text-emerald-800">Clear Architectural Framing</span>
          <span className="text-[11px] text-emerald-700/90 leading-tight">Articulated CAP theorem tradeoff with specific consistency SLAs.</span>
        </div>
      </div>

      <div className="rounded-xl border border-[#E8D9CC] bg-[#FFFFFF] p-2.5 flex items-start gap-2 text-[#2B211C] shadow-2xs">
        <Sparkles className="h-4 w-4 text-[#E85D04] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-[11px] block text-[#B94308]">Quantified Impact Coaching</span>
          <span className="text-[11px] text-[#70645C] leading-tight">Recommended: Replace &lsquo;high throughput&rsquo; with &lsquo;12,000 writes/sec&rsquo;.</span>
        </div>
      </div>
    </div>
  );
}

/**
 * ProctoringCardVisual — Dark espresso integrity panel with vision telemetry.
 */
export function ProctoringCardVisual() {
  return (
    <div className="relative mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/40 p-3.5 text-xs text-white shadow-inner">
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400 font-bold">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Integrity Verified</span>
        </div>
        <span className="font-mono text-[10px] text-white/60">Gaze: In-Frame</span>
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-lg bg-white/5 p-2 border border-white/5">
          <div className="text-white/60 text-[10px]">Eye Contact</div>
          <div className="font-mono font-bold text-white mt-0.5">99.4%</div>
        </div>
        <div className="rounded-lg bg-white/5 p-2 border border-white/5">
          <div className="text-white/60 text-[10px]">Data Retention</div>
          <div className="font-mono font-bold text-[#F28C45] mt-0.5">10 Days</div>
        </div>
      </div>
    </div>
  );
}
