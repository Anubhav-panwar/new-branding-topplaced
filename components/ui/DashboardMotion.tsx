"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

/**
 * Standardized High-Performance Easing Curves
 */
export const DASHBOARD_EASE_OUT_EXPO = [0.19, 1, 0.22, 1] as const;
export const DASHBOARD_EASE_OUT_QUART = [0.165, 0.84, 0.44, 1] as const;
export const DASHBOARD_EASE_SMOOTH = [0.25, 0.1, 0.25, 1] as const;

/**
 * 1. DashboardPageTransition
 * Smooth entrance animation for all dashboard routes with prefers-reduced-motion support.
 */
export function DashboardPageTransition({
  children,
  className = "",
  transitionKey,
}: {
  children: React.ReactNode;
  className?: string;
  transitionKey?: string;
}) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      key={transitionKey}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.32, ease: DASHBOARD_EASE_OUT_EXPO }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * 2. DashboardStaggerContainer
 * Orchestrates staggered entrance for child cards, metric widgets, and list items.
 */
export function DashboardStaggerContainer({
  children,
  className = "",
  stagger = 0.06,
  delay = 0.04,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
}) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

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

/**
 * 3. DashboardStaggerItem
 * Child item for DashboardStaggerContainer.
 */
export function DashboardStaggerItem({
  children,
  className = "",
  y = 10,
}: {
  children: React.ReactNode;
  className?: string;
  y?: number;
}) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.38,
            ease: DASHBOARD_EASE_OUT_EXPO,
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
 * 4. DashboardCardHover
 * Subtle card hover elevation, soft shadow expansion, and micro-press feedback.
 */
export function DashboardCardHover({
  children,
  className = "",
  liftY = -3,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  liftY?: number;
  onClick?: () => void;
}) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return (
      <div onClick={onClick} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      onClick={onClick}
      whileHover={{
        y: liftY,
        transition: { duration: 0.2, ease: "easeOut" },
      }}
      whileTap={{ scale: 0.99 }}
      className={`transition-shadow duration-200 ${className}`}
    >
      {children}
    </motion.div>
  );
}

/**
 * 5. DashboardCounter
 * Smooth outExpo count-up for statistics, KPI counters, and telemetry metrics.
 */
export function DashboardCounter({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 0.85,
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
 * 6. DashboardProgressBar
 * Smooth animated progress bar that fills to target percentage.
 */
export function DashboardProgressBar({
  value,
  max = 100,
  className = "h-2 w-full bg-[#FFF8F0] border border-[#F1D2B8] rounded-full overflow-hidden",
  barClassName = "h-full bg-gradient-to-r from-[#F26A0A] to-[#E85D04] rounded-full",
  duration = 0.8,
  delay = 0.1,
}: {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
  duration?: number;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const prefersReduced = useReducedMotion();
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div ref={ref} className={className}>
      <motion.div
        initial={prefersReduced ? false : { width: 0 }}
        animate={inView || prefersReduced ? { width: `${percentage}%` } : { width: 0 }}
        transition={{ duration, delay, ease: DASHBOARD_EASE_OUT_EXPO }}
        className={barClassName}
      />
    </div>
  );
}

/**
 * 7. DashboardCircularProgress
 * Smooth SVG circular gauge animation for scores and completion percentages.
 */
export function DashboardCircularProgress({
  value,
  size = 72,
  strokeWidth = 6,
  color = "#F26A0A",
  trackColor = "#F1D2B8",
  className = "",
  children,
}: {
  value: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const prefersReduced = useReducedMotion();

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedVal = Math.min(100, Math.max(0, value));
  const targetOffset = circumference - (clampedVal / 100) * circumference;

  return (
    <div
      ref={ref}
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="rotate-[-90deg] overflow-visible"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={circumference}
          initial={prefersReduced ? false : { strokeDashoffset: circumference }}
          animate={inView || prefersReduced ? { strokeDashoffset: targetOffset } : { strokeDashoffset: circumference }}
          transition={{ duration: 1.0, delay: 0.15, ease: DASHBOARD_EASE_OUT_EXPO }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * 8. DashboardTableRow
 * Animated table row with subtle entrance and hover highlight.
 */
export function DashboardTableRow({
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
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: DASHBOARD_EASE_OUT_EXPO }}
      whileHover={{
        backgroundColor: "rgba(242, 106, 10, 0.04)",
        transition: { duration: 0.15 },
      }}
      onClick={onClick}
      className={className}
    >
      {children}
    </motion.tr>
  );
}

/**
 * 9. DashboardDropdownMotion
 * Refined dropdown animation with subtle scale and fade.
 */
export function DashboardDropdownMotion({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -6 }}
      transition={{ duration: 0.2, ease: DASHBOARD_EASE_OUT_EXPO }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * 10. DashboardShimmerSkeleton
 * Subtle shimmer loading skeleton that matches the Warm Beige palette.
 */
export function DashboardShimmerSkeleton({
  className = "h-24 w-full rounded-2xl",
}: {
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden bg-[#FFF8F0] border border-[#F1D2B8] animate-shimmer ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#F26A0A]/[0.06] to-transparent animate-pulse" />
    </div>
  );
}
