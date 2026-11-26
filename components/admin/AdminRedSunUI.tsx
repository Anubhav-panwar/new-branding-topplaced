"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

export const REDSUN_OUT_EXPO = [0.19, 1, 0.22, 1] as const;
export const REDSUN_OUT_QUART = [0.165, 0.84, 0.44, 1] as const;
export const REDSUN_EASE = [0.25, 0.1, 0.25, 1] as const;

/**
 * Shared RedSun Dark Obsidian design system classes & primitives
 * strictly scoped to the /admin console so Learner, Mentor, and Public pages remain isolated.
 */

export const ADMIN_SURFACE_CLASS =
  "rounded-2xl bg-[#FFFFFF] border border-[#E8D9CC] shadow-sm";

export const ADMIN_SURFACE_HOVER_CLASS =
  "rounded-2xl bg-[#FFFFFF] border border-[#E8D9CC] hover:border-[#E85D04]/40 shadow-sm transition-all duration-200";

export const ADMIN_INNER_TILE_CLASS =
  "rounded-xl bg-[#FFFCF8] border border-[#E8D9CC]";

export const ADMIN_INPUT_CLASS =
  "w-full bg-[#FFFCF8] border border-[#E8D9CC] rounded-xl px-3.5 py-2.5 text-sm text-[#2B211C] placeholder-[#70645C] focus:outline-none focus:border-[#E85D04] focus:ring-2 focus:ring-[#E85D04]/20 transition-colors [color-scheme:light]";

export const ADMIN_SELECT_CLASS =
  "bg-[#FFFCF8] border border-[#E8D9CC] rounded-xl px-3.5 py-2.5 min-h-[44px] text-xs font-medium text-[#2B211C] focus:outline-none focus:border-[#E85D04] focus:ring-2 focus:ring-[#E85D04]/20 transition-colors [color-scheme:light] cursor-pointer";

export const ADMIN_BTN_PRIMARY =
  "redsun-btn-glow min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed";

export const ADMIN_BTN_SECONDARY =
  "redsun-btn-simple min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#2B211C] cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed";

export const ADMIN_BTN_GHOST =
  "min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-[#E8D9CC] bg-[#FFFCF8] hover:bg-[#FFFFFF] hover:border-[#E85D04]/40 text-xs font-semibold text-[#2B211C] transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed";

export const ADMIN_BTN_DANGER =
  "min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-md shadow-rose-600/20 transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed";

export const ADMIN_ICON_BTN =
  "min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-[#E8D9CC] bg-[#FFFCF8] text-[#70645C] hover:text-[#2B211C] hover:border-[#E85D04]/40 hover:bg-[#FFFFFF] transition-colors cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed";

export const ADMIN_TABLE_WRAP =
  "rounded-2xl bg-[#FFFFFF] border border-[#E8D9CC] overflow-hidden shadow-sm";

export const ADMIN_THEAD =
  "bg-[#FFFCF8] text-[11px] uppercase tracking-wider text-[#70645C] font-semibold border-b border-[#E8D9CC]";

export const ADMIN_TBODY = "divide-y divide-[#E8D9CC]";

export function AdminPageHeader({
  title,
  highlight,
  subtitle,
  badge,
  actions,
}: {
  title: string;
  highlight?: string;
  subtitle: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2B211C] tracking-tight">
            {title}{" "}
            {highlight && (
              <span className="text-[#E85D04]">{highlight}</span>
            )}
          </h1>
          {badge}
        </div>
        <p className="text-sm text-[#70645C] mt-1.5 leading-relaxed max-w-3xl">
          {subtitle}
        </p>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

export type BadgeTone =
  | "solar"
  | "emerald"
  | "amber"
  | "rose"
  | "sky"
  | "neutral";

const TONE_MAP: Record<BadgeTone, string> = {
  solar: "bg-[#E85D04]/12 text-[#E85D04] border-[#E85D04]/30",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  rose: "bg-rose-50 text-rose-700 border-rose-200",
  sky: "bg-sky-50 text-sky-700 border-sky-200",
  neutral: "bg-[#FFFCF8] text-[#70645C] border-[#E8D9CC]",
};

export function AdminStatusBadge({
  tone = "neutral",
  dot = false,
  pulse = false,
  children,
  className = "",
}: {
  tone?: BadgeTone;
  dot?: boolean;
  pulse?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const dotColor =
    tone === "solar"
      ? "bg-[#E85D04]"
      : tone === "emerald"
      ? "bg-emerald-500"
      : tone === "amber"
      ? "bg-amber-500"
      : tone === "rose"
      ? "bg-rose-500"
      : tone === "sky"
      ? "bg-sky-500"
      : "bg-slate-400";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${TONE_MAP[tone]} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColor} ${
            pulse ? "animate-pulse" : ""
          }`}
        />
      )}
      {children}
    </span>
  );
}

export function AdminPagination({
  page,
  totalPages,
  totalItems,
  itemLabel,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  itemLabel: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="px-4 sm:px-6 py-3.5 bg-[#FFFCF8] border-t border-[#E8D9CC] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#70645C]">
      <div>
        Showing Page{" "}
        <span className="font-bold text-[#2B211C] font-mono">{page}</span> of{" "}
        <span className="font-bold text-[#2B211C] font-mono">{totalPages}</span>{" "}
        (<span className="font-mono">{totalItems}</span> {itemLabel} total)
      </div>
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <button
          type="button"
          onClick={onPrev}
          disabled={page <= 1}
          aria-label="Previous page"
          className={ADMIN_ICON_BTN}
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={page >= totalPages}
          aria-label="Next page"
          className={ADMIN_ICON_BTN}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export function AdminModal({
  onClose,
  maxWidth = "max-w-lg",
  danger = false,
  children,
}: {
  onClose: () => void;
  maxWidth?: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[60] bg-[#2B211C]/50 backdrop-blur-md flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        initial={prefersReduced ? false : { opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.3, ease: REDSUN_OUT_EXPO }}
        className={`w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-2xl bg-[#FFFFFF] border ${
          danger ? "border-rose-400" : "border-[#E8D9CC]"
        } p-6 shadow-2xl text-[#2B211C]`}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export function AdminModalCloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close modal"
      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#70645C] hover:text-[#2B211C] hover:bg-[#FFFCF8] rounded-xl transition-colors cursor-pointer shrink-0"
    >
      <X size={18} />
    </button>
  );
}

/**
 * Animated counter that counts up to the real API telemetry value using outExpo easing.
 * Re-triggers smoothly whenever the target value updates.
 */
export function AdminAnimatedCounter({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 0.9,
  className = "",
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const numericValue = Number.isFinite(Number(value)) ? Number(value) : 0;
  const prefersReduced = useReducedMotion();
  const [displayValue, setDisplayValue] = useState<number>(() =>
    prefersReduced ? numericValue : 0
  );
  const prevValueRef = useRef<number>(prefersReduced ? numericValue : 0);

  useEffect(() => {
    const end = Number.isFinite(Number(value)) ? Number(value) : 0;
    if (prefersReduced) {
      setDisplayValue(end);
      prevValueRef.current = end;
      return;
    }

    const start = Number.isFinite(prevValueRef.current) ? prevValueRef.current : 0;
    prevValueRef.current = end;

    if (start === end) {
      setDisplayValue(end);
      return;
    }

    const durationMs = duration * 1000;
    const startTime = performance.now();
    let rafId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / durationMs);
      // outExpo curve: 1 - 2^(-10t)
      const progress = t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
      const current = start + (end - start) * progress;
      setDisplayValue(current);

      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setDisplayValue(end);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [value, duration, prefersReduced]);

  const safeDisplay = Number.isFinite(displayValue) ? displayValue : 0;
  const formatted =
    decimals > 0
      ? safeDisplay.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : Math.round(safeDisplay).toLocaleString();

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

/**
 * Staggered container for dashboard KPI cards and sections.
 */
export function AdminStaggerContainer({
  children,
  className = "",
  stagger = 0.07,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
}) {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: stagger,
            delayChildren: delay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function AdminStaggerItem({
  children,
  className = "",
  yOffset = 14,
}: {
  children: React.ReactNode;
  className?: string;
  yOffset?: number;
}) {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: yOffset },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.5,
            ease: REDSUN_OUT_EXPO,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Animated Table Row with smooth entrance and hover elevation.
 */
export function AdminTableRowMotion({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) {
    return (
      <tr onClick={onClick} className={className}>
        {children}
      </tr>
    );
  }

  return (
    <motion.tr
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: REDSUN_OUT_EXPO }}
      whileHover={{
        backgroundColor: "rgba(242, 106, 10, 0.05)",
        transition: { duration: 0.15 },
      }}
      onClick={onClick}
      className={className}
    >
      {children}
    </motion.tr>
  );
}


