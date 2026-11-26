"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ChevronRight } from "lucide-react";

/**
 * Diagonal atmospheric light rays + bottom corner horizon washes faithful to Warm Beige & Orange (#F7EFE5).
 */
export function RedSunBackdrop({
  variant = "hero",
  animatedRays = false,
}: {
  variant?: "hero" | "subpage";
  animatedRays?: boolean;
}) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Top-left subtle diagonal sun-beams */}
      <div
        className={`absolute -top-32 -left-24 w-[760px] h-[520px] opacity-35 -rotate-[32deg] ${
          animatedRays ? "redsun-aurora-sweep" : ""
        }`}
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(242, 106, 10, 0.06) 18%, transparent 32%, rgba(232, 93, 4, 0.05) 48%, transparent 64%, rgba(242, 106, 10, 0.04) 80%, transparent 100%)",
          maskImage: "radial-gradient(ellipse at top left, black 30%, transparent 78%)",
          WebkitMaskImage: "radial-gradient(ellipse at top left, black 30%, transparent 78%)",
        }}
      />

      {/* Ambient orange side & horizon glows */}
      {variant === "hero" ? (
        <>
          <div
            className="absolute top-[28%] -right-48 w-[580px] h-[580px] rounded-full opacity-25"
            style={{
              background: "radial-gradient(circle, rgba(242, 106, 10, 0.18), rgba(242, 106, 10, 0) 68%)",
            }}
          />
          <div
            className="absolute top-[60%] -left-48 w-[540px] h-[540px] rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle, rgba(232, 93, 4, 0.16), rgba(232, 93, 4, 0) 68%)",
            }}
          />
        </>
      ) : (
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-[780px] h-[420px] opacity-40"
          style={{
            background: "radial-gradient(ellipse at 50% 0%, rgba(242, 106, 10, 0.16), rgba(247, 239, 229, 0) 70%)",
          }}
        />
      )}
    </div>
  );
}

/**
 * RedSun Eclipse Solar Arc: glowing semi-circular metallic/amber ring framing focal visuals.
 */
export function RedSunEclipseArc({
  position = "top",
  className = "",
}: {
  position?: "top" | "bottom" | "orbit";
  className?: string;
}) {
  if (position === "orbit") {
    return (
      <div aria-hidden="true" className={`pointer-events-none flex items-center justify-center ${className}`}>
        <div className="relative w-[320px] sm:w-[400px] h-[320px] sm:h-[400px] flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-[#F1D2B8]" />
          <div
            className="absolute inset-6 rounded-full border border-[#F26A0A]/35 redsun-orbit-spin"
            style={{
              background:
                "conic-gradient(from 180deg, transparent 0deg, rgba(242, 106, 10, 0.14) 90deg, transparent 180deg, rgba(232, 93, 4, 0.16) 270deg, transparent 360deg)",
              maskImage: "radial-gradient(transparent 62%, black 63%, black 100%)",
              WebkitMaskImage: "radial-gradient(transparent 62%, black 63%, black 100%)",
            }}
          />
          <div
            className="absolute inset-16 rounded-full border border-[#F26A0A]/25"
            style={{
              boxShadow: "inset 0 0 42px rgba(242, 106, 10, 0.16), 0 0 40px rgba(242, 106, 10, 0.08)",
            }}
          />
        </div>
      </div>
    );
  }

  const isBottom = position === "bottom";

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none relative mx-auto w-full max-w-[960px] overflow-hidden ${
        isBottom ? "h-[200px] sm:h-[260px]" : "h-[185px] sm:h-[245px]"
      } ${className}`}
      style={{
        maskImage: isBottom
          ? "linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%)"
          : "linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%)",
      }}
    >
      {/* Smooth ambient fiery dome (fades to 0 before edges) */}
      <div
        className={`absolute inset-x-0 flex justify-center pointer-events-none ${
          isBottom ? "top-0" : "bottom-0"
        }`}
      >
        <div
          className="w-[560px] sm:w-[760px] h-[220px] sm:h-[260px] shrink-0 redsun-eclipse-pulse"
          style={{
            background: isBottom
              ? "radial-gradient(closest-side at 50% 58%, rgba(242, 106, 10, 0.28) 0%, rgba(232, 93, 4, 0.18) 38%, rgba(247, 239, 229, 0.05) 68%, transparent 100%)"
              : "radial-gradient(closest-side at 50% 42%, rgba(242, 106, 10, 0.28) 0%, rgba(232, 93, 4, 0.18) 38%, rgba(247, 239, 229, 0.05) 68%, transparent 100%)",
          }}
        />
      </div>

      {/* Crisp metallic + amber eclipse ring arc */}
      <div
        className={`absolute inset-x-0 flex justify-center pointer-events-none ${
          isBottom ? "bottom-12" : "top-12"
        }`}
      >
        <div
          className="w-[360px] sm:w-[600px] h-[360px] sm:h-[600px] shrink-0 rounded-full"
          style={{
            background: isBottom
              ? "linear-gradient(0deg, #F26A0A 0%, #E85D04 18%, #F1D2B8 40%, #FFF9F2 65%, #F7EFE5 85%)"
              : "linear-gradient(180deg, #F26A0A 0%, #E85D04 18%, #F1D2B8 40%, #FFF9F2 65%, #F7EFE5 85%)",
            padding: "22px",
            boxShadow: "0 0 45px rgba(242, 106, 10, 0.2), inset 0 10px 25px rgba(242, 106, 10, 0.12)",
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
      </div>
      {/* Horizon mask fade into beige background */}
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
 * RedSun Announcement Pill (.ease-badge): orange left badge + smoked glass caption.
 */
export function RedSunEaseBadge({
  tag = "Whats New",
  label,
  href,
}: {
  tag?: string;
  label: string;
  href?: string;
}) {
  const content = (
    <span className="redsun-ease-badge inline-flex items-center gap-2.5 p-1 pr-4 max-w-full transition-transform hover:scale-[1.02]">
      <span className="px-3 py-1 rounded-full bg-[#F26A0A] text-white font-semibold text-xs sm:text-[13px] tracking-tight shadow-[0_0_12px_rgba(242,106,10,0.35)] shrink-0">
        {tag}
      </span>
      <span className="text-xs sm:text-[14px] text-[#302016] font-normal truncate">{label}</span>
      <ChevronRight className="w-3.5 h-3.5 text-[#68574B] shrink-0" />
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block max-w-full">
        {content}
      </Link>
    );
  }
  return content;
}

/**
 * Signature Double-Framed Bento Card (.home-grid-box-wrapper -> .home-grid-box).
 */
export function RedSunBentoCard({
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`redsun-grid-frame ${active ? "redsun-grid-frame-active" : ""} ${className}`}
    >
      <div className={`redsun-grid-card ${innerClassName}`}>{children}</div>
    </motion.div>
  );
}

/**
 * RedSun Rounded Square Check Item (#E85D04 tile with #E85D04 rim).
 */
export function RedSunCheckItem({ children, strong = false }: { children: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <span className="redsun-check-tile w-5 h-5 mt-0.5 flex items-center justify-center shrink-0">
        <Check className="w-3 h-3 text-white stroke-[2.75]" />
      </span>
      <span className={`text-xs sm:text-sm leading-relaxed ${strong ? "text-[#302016] font-semibold" : "text-[#68574B]"}`}>
        {children}
      </span>
    </div>
  );
}

