"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";

/**
 * Exact RedSun Webflow IX2 easing curves & timing constants:
 * - REDSUN_OUT_EXPO: [0.19, 1, 0.22, 1] (Webflow standard outExpo: Hero staggered entrance, eclipse expansion)
 * - REDSUN_OUT_QUART: [0.165, 0.84, 0.44, 1] (Webflow standard outQuart: slideInBottom, slideInLeft, slideInRight)
 * - REDSUN_EASE: [0.25, 0.1, 0.25, 1] (Webflow standard smooth ease for hover transitions)
 * - REDSUN_VIEWPORT: { once: true, amount: 0.15 }
 */
export const REDSUN_OUT_EXPO = [0.19, 1, 0.22, 1] as const;
export const REDSUN_OUT_QUART = [0.165, 0.84, 0.44, 1] as const;
export const REDSUN_EASE = [0.25, 0.1, 0.25, 1] as const;
export const REDSUN_SPRING_BOUNCE = [0.34, 1.45, 0.64, 1] as const;
export const REDSUN_VIEWPORT = { once: true, amount: 0.15 } as const;

/**
 * Global/Hero Ambient Cursor Follower (`Light Follow Mouse` - Webflow a-43).
 * Renders a high-performance radial ambient orange glow that smoothly tracks mouse coordinates
 * across the dark obsidian canvas using requestAnimationFrame and CSS custom properties (zero React re-renders).
 */
export function RedSunCursorGlow() {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });
  const rafId = useRef<number | null>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced) return;

    // Disable on touch devices (no hover capability or coarse pointer) to save battery/CPU
    if (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(hover: none)").matches
    ) {
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    // Center initially
    currentPos.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    targetPos.current = { ...currentPos.current };

    const handleMouseMove = (e: MouseEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY };
    };

    const animate = () => {
      // Lerp with smoothing factor ~0.08
      currentPos.current.x += (targetPos.current.x - currentPos.current.x) * 0.08;
      currentPos.current.y += (targetPos.current.y - currentPos.current.y) * 0.08;

      if (el) {
        el.style.setProperty("--cursor-x", `${currentPos.current.x.toFixed(1)}px`);
        el.style.setProperty("--cursor-y", `${currentPos.current.y.toFixed(1)}px`);
      }

      rafId.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, [prefersReduced]);

  if (prefersReduced) return null;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{
        ["--cursor-x" as string]: "50vw",
        ["--cursor-y" as string]: "40vh",
      }}
    >
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          background:
            "radial-gradient(650px circle at var(--cursor-x) var(--cursor-y), rgba(242, 106, 10, 0.09) 0%, rgba(232, 93, 4, 0.04) 35%, transparent 70%)",
        }}
      />
    </div>
  );
}

/**
 * Animated Solar Eclipse Ring matching RedSun `a-2` & `circle-container`:
 * Starts rotated 180deg and scaled 0.72x on load, and smoothly blooms to 0deg and 1.0x over 2.5s outExpo.
 */
export function RedSunAnimatedEclipse({
  position = "top",
  scrollRotate = 0,
}: {
  position?: "top" | "bottom" | "orbit";
  scrollRotate?: any;
}) {
  const prefersReduced = useReducedMotion();

  const isBottom = position === "bottom";

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none relative mx-auto w-full max-w-[1040px] overflow-hidden ${
        isBottom ? "h-[200px] sm:h-[260px]" : "h-[195px] sm:h-[255px]"
      }`}
      style={{
        maskImage:
          "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
      }}
    >
      {/* Ambient Pulsing Glow Dome Container (Flex-centered, immune to transform conflicts) */}
      <div
        className={`absolute inset-x-0 flex justify-center pointer-events-none ${
          isBottom ? "top-0" : "bottom-0"
        }`}
      >
        <div
          className="w-[560px] sm:w-[780px] h-[220px] sm:h-[270px] shrink-0 redsun-eclipse-pulse"
          style={{
            background: isBottom
              ? "radial-gradient(closest-side at 50% 58%, rgba(242, 106, 10, 0.28) 0%, rgba(232, 93, 4, 0.18) 38%, rgba(247, 239, 229, 0.05) 68%, transparent 100%)"
              : "radial-gradient(closest-side at 50% 42%, rgba(242, 106, 10, 0.28) 0%, rgba(232, 93, 4, 0.18) 38%, rgba(247, 239, 229, 0.05) 68%, transparent 100%)",
          }}
        />
      </div>

      {/* Rotating Solar Eclipse Ring Arc Container (Flex-centered, isolated from rotation transforms) */}
      <div
        className={`absolute inset-x-0 flex justify-center pointer-events-none ${
          isBottom ? "bottom-12" : "top-12"
        }`}
      >
        <motion.div
          style={prefersReduced ? undefined : { rotate: scrollRotate || 0 }}
          className="w-[360px] sm:w-[620px] h-[360px] sm:h-[620px] shrink-0 rounded-full will-change-transform"
        >
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, scale: 0.72, rotate: 180 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 2.5, delay: 0.4, ease: REDSUN_OUT_EXPO }}
            className="w-full h-full rounded-full"
          >
            <div
              className="w-full h-full rounded-full"
              style={{
                background: isBottom
                  ? "linear-gradient(0deg, #F26A0A 0%, #E85D04 18%, #F1D2B8 40%, #FFF9F2 65%, #F7EFE5 85%)"
                  : "linear-gradient(180deg, #F26A0A 0%, #E85D04 18%, #F1D2B8 40%, #FFF9F2 65%, #F7EFE5 85%)",
                padding: "22px",
                boxShadow:
                  "0 0 50px rgba(242, 106, 10, 0.22), inset 0 12px 30px rgba(242, 106, 10, 0.12)",
              }}
            >
              <div
                className="w-full h-full rounded-full"
                style={{
                  background: isBottom
                    ? "radial-gradient(circle at 50% 85%, rgba(242, 106, 10, 0.12), #FFF9F2 62%)"
                    : "radial-gradient(circle at 50% 18%, rgba(242, 106, 10, 0.12), #FFF9F2 62%)",
                  border: "1px solid #F1D2B8",
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Horizon Mask Fade */}
      <div
        className={`absolute inset-x-0 h-20 ${isBottom ? "top-0" : "bottom-0"}`}
        style={{
          background: isBottom
            ? "linear-gradient(to bottom, #F7EFE5 15%, transparent)"
            : "linear-gradient(to top, #F7EFE5 20%, transparent)",
        }}
      />
    </div>
  );
}

/**
 * Signature RedSun 3D Perspective Hero Parallax & Scroll Reveal Stage
 * Matches Webflow `Hero (Home V1) Animation` (a-41) + `Hero Paralax` (a-29):
 * 1. 3D Perspective viewport (`perspective: 1200px`)
 * 2. Mockup initially tilts on X axis (24deg) and lifts (-40px)
 * 3. As user scrolls:
 *    - Mockup un-tilts to flat (24deg -> 0deg) and expands slightly (1.0 -> 1.03)
 *    - Hero text content translates downward and fades out into the distance
 *    - Solar eclipse ring rotates 90 degrees
 */
export function RedSunHero3DStage({
  headerContent,
  showcaseContent,
}: {
  headerContent: React.ReactNode;
  showcaseContent: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Hero header fades out and gently recedes on scroll
  const headerOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0]);
  const headerY = useTransform(scrollYProgress, [0, 0.45], [0, -25]);

  // Eclipse rotates 90deg and moves slightly on scroll
  const eclipseRotate = useTransform(scrollYProgress, [0, 0.6], [0, 90]);
  const eclipseY = useTransform(scrollYProgress, [0, 0.6], [0, 70]);

  // 3D Perspective Mockup Tilt - smooth un-tilt to flat (18deg -> 0deg), settling seamlessly without downward protrusion
  const mockupRotateX = useTransform(scrollYProgress, [0, 0.4, 0.85], [18, 0, 0]);
  const mockupY = useTransform(scrollYProgress, [0, 0.45, 0.9], [-20, 0, 0]);
  const mockupScale = useTransform(scrollYProgress, [0, 0.4, 0.85], [0.98, 1.0, 1.0]);

  return (
    <div ref={containerRef} className="relative z-10">
      {/* Staggered Hero Header Content with scroll fade */}
      <motion.div
        style={prefersReduced ? undefined : { opacity: headerOpacity, y: headerY }}
        className="max-w-[780px] mx-auto text-center space-y-6"
      >
        {headerContent}
      </motion.div>

      {/* 3D Perspective Stage for Eclipse & Mockup */}
      <div
        className="mt-6 md:mt-10 relative"
        style={prefersReduced ? undefined : { perspective: 1300, transformStyle: "preserve-3d" }}
      >
        {/* Eclipse Arc with scroll rotation */}
        <motion.div
          style={prefersReduced ? undefined : { y: eclipseY }}
          className="-mb-12 sm:-mb-16 will-change-transform relative z-0 pointer-events-none"
        >
          <RedSunAnimatedEclipse position="top" scrollRotate={eclipseRotate} />
        </motion.div>

        {/* 3D Tilted App Mockup Showcase */}
        <motion.div
          style={
            prefersReduced
              ? undefined
              : {
                  rotateX: mockupRotateX,
                  y: mockupY,
                  scale: mockupScale,
                  transformOrigin: "center top",
                }
          }
          className="will-change-transform relative z-10"
        >
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, delay: 0.4, ease: REDSUN_OUT_EXPO }}
          >
            {showcaseContent}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

/**
 * RedSun Staggered Hero Entrance Item matching Webflow `Animate On Load`:
 * - Badge: delay 0.4s
 * - Heading: delay 0.6s
 * - Paragraph: delay 0.8s
 * - Buttons: delay 1.0s
 * - Trust items: delay 1.15s+
 */
export function RedSunHeroItem({
  children,
  delay = 0.4,
  duration = 1.4,
  y = 32,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
  className?: string;
}) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: REDSUN_OUT_EXPO }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * RedSun Scroll Reveal matching Webflow Presets:
 * - "bottom": slideInBottom (y: 80 -> 0, 1.0s outQuart)
 * - "left": slideInLeft (x: -80 -> 0, 1.0s outQuart)
 * - "right": slideInRight (x: 80 -> 0, 1.0s outQuart)
 * - "fade": Soft fade & subtle rise (y: 28 -> 0, 0.9s outExpo)
 * - "scale": Zoom settle (scale: 0.92 -> 1, 1.0s outExpo)
 */
export function RedSunReveal({
  children,
  variant = "bottom",
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  variant?: "bottom" | "left" | "right" | "fade" | "scale";
  delay?: number;
  className?: string;
}) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  const initialByVariant = {
    bottom: { opacity: 0, y: 80 },
    left: { opacity: 0, x: -80 },
    right: { opacity: 0, x: 80 },
    fade: { opacity: 0, y: 28 },
    scale: { opacity: 0, y: 20, scale: 0.92 },
  }[variant];

  const transitionByVariant = {
    bottom: { duration: 1.0, delay, ease: REDSUN_OUT_QUART },
    left: { duration: 1.0, delay, ease: REDSUN_OUT_QUART },
    right: { duration: 1.0, delay, ease: REDSUN_OUT_QUART },
    fade: { duration: 0.9, delay, ease: REDSUN_OUT_EXPO },
    scale: { duration: 1.0, delay, ease: REDSUN_OUT_EXPO },
  }[variant];

  return (
    <motion.div
      initial={initialByVariant}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={REDSUN_VIEWPORT}
      transition={transitionByVariant}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Cursor-tracking radial spotlight for interactive cards.
 */
export function useRedSunSpotlight() {
  const frameRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = frameRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      el.style.setProperty("--rx", `${x.toFixed(1)}px`);
      el.style.setProperty("--ry", `${y.toFixed(1)}px`);
    });
  };

  return { frameRef, handleMouseMove };
}

/**
 * Double-Framed Bento Card with Webflow `slideInBottom` entrance + interactive cursor spotlight.
 */
export function RedSunSpotlightCard({
  children,
  className = "",
  innerClassName = "",
  active = false,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  active?: boolean;
  delay?: number;
}) {
  const prefersReduced = useReducedMotion();
  const { frameRef, handleMouseMove } = useRedSunSpotlight();

  return (
    <motion.div
      ref={frameRef}
      onMouseMove={prefersReduced ? undefined : handleMouseMove}
      initial={prefersReduced ? false : { opacity: 0, y: 70 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={REDSUN_VIEWPORT}
      transition={{ duration: 1.0, delay, ease: REDSUN_OUT_QUART }}
      className={`group redsun-grid-frame relative transition-transform duration-300 hover:-translate-y-1 ${
        active ? "redsun-grid-frame-active" : ""
      } ${className}`}
    >
      <div className={`redsun-grid-card relative ${innerClassName}`}>
        <div aria-hidden="true" className="redsun-spotlight-layer" />
        <div className="relative z-10 h-full flex flex-col justify-between">
          {children}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Bottom CTA Radial Convergence Choreography matching RedSun `CTA Animation` (a-12 / a-25):
 * Central solar horizon bloom expands from 0.3x to 1.0x while twin columns slide inward.
 */
export function RedSunCtaConvergence({
  leftContent,
  rightContent,
}: {
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
}) {
  const prefersReduced = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.18 });

  return (
    <motion.div
      ref={sectionRef}
      initial={prefersReduced ? false : { opacity: 0.3, scale: 0.98 }}
      animate={inView || prefersReduced ? { opacity: 1, scale: 1 } : undefined}
      transition={{ duration: 1.1, ease: REDSUN_OUT_EXPO }}
      className="relative rounded-[28px] bg-[#FFF9F2] border border-[#F1D2B8] p-8 md:p-12 overflow-hidden shadow-[0_16px_48px_rgba(242,106,10,0.12)]"
    >
      {/* Expanding Solar Horizon Bloom (Webflow: scale 0.38 -> 1.0) */}
      <motion.div
        aria-hidden="true"
        initial={prefersReduced ? false : { opacity: 0, scale: 0.35 }}
        animate={inView || prefersReduced ? { opacity: 0.95, scale: 1 } : undefined}
        transition={{ duration: 1.8, delay: 0.1, ease: REDSUN_OUT_EXPO }}
        className="pointer-events-none absolute -bottom-24 right-0 left-0 h-44 origin-bottom will-change-transform"
        style={{
          background:
            "radial-gradient(ellipse at 65% 100%, rgba(242, 106, 10, 0.35) 0%, rgba(232, 93, 4, 0.18) 45%, rgba(247, 239, 229, 0) 75%)",
        }}
      />

      {/* Converging Twin Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, x: -70 }}
          animate={inView || prefersReduced ? { opacity: 1, x: 0 } : undefined}
          transition={{ duration: 1.0, delay: 0.18, ease: REDSUN_OUT_QUART }}
          className="lg:col-span-7 space-y-5"
        >
          {leftContent}
        </motion.div>

        <motion.div
          initial={prefersReduced ? false : { opacity: 0, x: 70, scale: 0.92 }}
          animate={inView || prefersReduced ? { opacity: 1, x: 0, scale: 1 } : undefined}
          transition={{ duration: 1.0, delay: 0.28, ease: REDSUN_OUT_QUART }}
          className="lg:col-span-5 relative flex justify-center lg:justify-end"
        >
          {rightContent}
        </motion.div>
      </div>
    </motion.div>
  );
}

/**
 * Viewport-triggered outExpo count-up for tabular telemetry numbers.
 */
export function RedSunCountUp({
  target,
  decimals = 0,
  suffix = "",
  triggerOnMount = false,
  delay = 0.2,
  className = "",
}: {
  target: number;
  decimals?: number;
  suffix?: string;
  triggerOnMount?: boolean;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const prefersReduced = useReducedMotion();

  const formatNumber = (num: number) => {
    if (decimals > 0) return `${num.toFixed(decimals)}${suffix}`;
    const rounded = Math.round(num);
    return `${rounded >= 1000 ? rounded.toLocaleString() : rounded}${suffix}`;
  };

  const [display, setDisplay] = useState<string>(() => formatNumber(target));
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (prefersReduced) {
      setDisplay(formatNumber(target));
      return;
    }

    const shouldRun = triggerOnMount || inView;
    if (!shouldRun || hasAnimated.current) return;

    let rafId = 0;
    let completed = false;
    const durationMs = 1200;
    const startVal = triggerOnMount ? 0 : target * 0.2;

    const timeoutId = window.setTimeout(() => {
      hasAnimated.current = true;
      const startTime = performance.now();
      const tick = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / durationMs);
        const eased = t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
        const current = startVal + (target - startVal) * eased;
        setDisplay(formatNumber(current));
        if (t < 1) {
          rafId = requestAnimationFrame(tick);
        } else {
          completed = true;
          setDisplay(formatNumber(target));
        }
      };
      rafId = requestAnimationFrame(tick);
    }, Math.max(0, delay * 1000));

    return () => {
      window.clearTimeout(timeoutId);
      if (rafId) cancelAnimationFrame(rafId);
      if (!completed) {
        hasAnimated.current = false;
        setDisplay(formatNumber(target));
      }
    };
  }, [inView, triggerOnMount, prefersReduced, target, decimals, suffix, delay]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {display}
    </span>
  );
}
