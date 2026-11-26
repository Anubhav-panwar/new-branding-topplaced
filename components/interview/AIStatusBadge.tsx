"use client";

import React from "react";

export type AIStatusMode = "online" | "listening" | "thinking" | "speaking" | "offline";

interface AIStatusBadgeProps {
  status?: AIStatusMode;
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function AIStatusBadge({
  status = "online",
  label,
  className = "",
  size = "md",
}: AIStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "listening":
        return {
          dotBg: "bg-emerald-600",
          pulseColor: "bg-emerald-500/50",
          text: label || "Listening...",
          textColor: "text-emerald-700",
          borderColor: "border-emerald-200",
          bgColor: "bg-emerald-50",
        };
      case "thinking":
        return {
          dotBg: "bg-amber-400",
          pulseColor: "bg-amber-400/40",
          text: label || "Thinking...",
          textColor: "text-amber-700",
          borderColor: "border-amber-200",
          bgColor: "bg-amber-50",
        };
      case "speaking":
        return {
          dotBg: "bg-emerald-600",
          pulseColor: "bg-emerald-500/50",
          text: label || "Speaking...",
          textColor: "text-emerald-700",
          borderColor: "border-emerald-200",
          bgColor: "bg-emerald-50",
        };
      case "offline":
        return {
          dotBg: "bg-gray-500",
          pulseColor: "bg-gray-500/30",
          text: label || "Offline",
          textColor: "text-[#64748B]",
          borderColor: "border-[#E5E7EB]",
          bgColor: "bg-slate-100",
        };
      case "online":
      default:
        return {
          dotBg: "bg-emerald-600",
          pulseColor: "bg-emerald-500/50",
          text: label || "AI Interviewer ● Online",
          textColor: "text-emerald-700",
          borderColor: "border-emerald-200",
          bgColor: "bg-emerald-50",
        };
    }
  };

  const config = getStatusConfig();
  const sizeClasses =
    size === "sm"
      ? "text-[11px] px-2 py-0.5 gap-1.5"
      : size === "lg"
      ? "text-sm px-3.5 py-1.5 gap-2.5"
      : "text-xs px-2.5 py-1 gap-2";

  return (
    <div
      className={`inline-flex items-center font-medium rounded-full border backdrop-blur-md transition-all duration-300 ${config.bgColor} ${config.borderColor} ${config.textColor} ${sizeClasses} ${className}`}
    >
      <span className="relative flex h-2 w-2">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.pulseColor}`}
        />
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${config.dotBg}`}
        />
      </span>
      <span>{config.text}</span>
    </div>
  );
}
