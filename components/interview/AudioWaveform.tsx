"use client";

import React from "react";

export type WaveformState = "idle" | "listening" | "thinking" | "speaking";

interface AudioWaveformProps {
  state?: WaveformState;
  audioVolume?: number; // 0-100 or normalized
  className?: string;
  barCount?: number;
  theme?: "light" | "dark";
}

export default function AudioWaveform({
  state = "idle",
  audioVolume = 0,
  className = "",
  barCount = 12,
  theme = "light",
}: AudioWaveformProps) {
  const isLight = theme === "light";

  // If thinking, show subtle pulsing indicator
  if (state === "thinking") {
    return (
      <div
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
          isLight
            ? "bg-amber-50 border border-amber-200 text-amber-800"
            : "bg-amber-500/10 border border-amber-500/20 text-amber-300"
        } ${className}`}
      >
        <span className="text-[11px] font-mono font-medium tracking-wide">
          Thinking
        </span>
        <div className="flex items-center gap-1">
          <span
            className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s] ${
              isLight ? "bg-amber-600" : "bg-amber-400"
            }`}
          />
          <span
            className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s] ${
              isLight ? "bg-amber-600" : "bg-amber-400"
            }`}
          />
          <span
            className={`w-1.5 h-1.5 rounded-full animate-bounce ${
              isLight ? "bg-amber-600" : "bg-amber-400"
            }`}
          />
        </div>
      </div>
    );
  }

  // Generate dynamic bar heights
  const bars = Array.from({ length: barCount }, (_, i) => {
    if (state === "idle") {
      return 4;
    }
    if (state === "listening") {
      // Gentle reactive wave
      const factor = Math.sin((i / barCount) * Math.PI);
      const dynamicBoost = audioVolume > 5 ? (audioVolume / 100) * 16 : 4;
      return Math.max(3, Math.min(22, 4 + factor * dynamicBoost));
    }
    // Speaking: smooth sinusoidal wave
    const factor = Math.sin((i / (barCount - 1)) * Math.PI);
    const wave = Math.sin(Date.now() / 200 + i * 0.5) * 4;
    return Math.max(4, Math.min(24, 6 + factor * 14 + wave));
  });

  const getBarColor = (index: number) => {
    if (state === "listening") {
      return audioVolume > 6
        ? isLight
          ? "bg-emerald-600 shadow-2xs"
          : "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]"
        : isLight
        ? "bg-emerald-500/50"
        : "bg-emerald-500/50";
    }
    if (state === "speaking") {
      return isLight
        ? "bg-[#E85D04] shadow-2xs"
        : "bg-[#E85D04] shadow-[0_0_8px_rgba(242,106,10,0.4)]";
    }
    return isLight ? "bg-[#E8E2D2]" : "bg-slate-700/60";
  };

  return (
    <div
      className={`flex items-center gap-[3px] h-7 px-3 py-1 rounded-full transition-colors ${
        isLight
          ? "bg-[#FAF7F0] border border-[#EBE5D2]"
          : "bg-[#121518] border border-white/[0.08]"
      } ${className}`}
    >
      {bars.map((height, i) => (
        <span
          key={i}
          style={{ height: `${height}px` }}
          className={`w-[3px] rounded-full transition-all duration-100 ease-out ${getBarColor(
            i
          )}`}
        />
      ))}
      <span
        className={`ml-2 text-[10px] font-mono uppercase tracking-wider ${
          isLight ? "text-[#6E6759]" : "text-slate-400"
        }`}
      >
        {state === "listening"
          ? audioVolume > 6
            ? "Live Audio"
            : "Listening"
          : state === "speaking"
          ? "Speaking"
          : "Ready"}
      </span>
    </div>
  );
}
