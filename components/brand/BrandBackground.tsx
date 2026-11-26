import React from "react";

export type BrandBackgroundVariant =
  | "editorial" // Variation A: Clean editorial (ivory/white, linework, faint symbol watermark)
  | "peach" // Variation B: Soft peach (warm curves, gentle lighting)
  | "espresso" // Variation C: Dark premium (espresso #2B211C, radiant orange gradients)
  | "showcase" // Variation D: Product showcase (layered interface accents, directional glow)
  | "minimal"; // Variation E: Minimal professional (clean white, subtle micro-accents)

interface BrandBackgroundProps {
  variant?: BrandBackgroundVariant;
  className?: string;
  children?: React.ReactNode;
  showWatermark?: boolean;
}

/**
 * BrandBackground — Reusable background container implementing the 5 TopPlaced AI visual variations.
 * Ensures zero interference with pointer events or text legibility.
 */
export default function BrandBackground({
  variant = "editorial",
  className = "",
  children,
  showWatermark = true,
}: BrandBackgroundProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "peach":
        return {
          wrapper: "bg-[#FFF9F3] text-[#2B211C]",
          pattern: "url('/brand/patterns/pattern-peach-curves.svg')",
          accent: "from-[#F28C45]/15 via-transparent to-transparent",
        };
      case "espresso":
        return {
          wrapper: "bg-[#2B211C] text-white",
          pattern: "url('/brand/patterns/pattern-espresso-mesh.svg')",
          accent: "from-[#E85D04]/25 via-transparent to-transparent",
        };
      case "showcase":
        return {
          wrapper: "bg-[#FFFFFF] text-[#2B211C]",
          pattern: "url('/brand/patterns/pattern-editorial.svg')",
          accent: "from-[#E85D04]/10 via-[#F9E6D4]/30 to-transparent",
        };
      case "minimal":
        return {
          wrapper: "bg-white text-[#2B211C]",
          pattern: "url('/brand/patterns/pattern-grid-dots.svg')",
          accent: "from-[#E8D9CC]/30 via-transparent to-transparent",
        };
      case "editorial":
      default:
        return {
          wrapper: "bg-[#FFFCF8] text-[#2B211C]",
          pattern: "url('/brand/patterns/pattern-editorial.svg')",
          accent: "from-[#E85D04]/08 via-[#F9E6D4]/20 to-transparent",
        };
    }
  };

  const current = getVariantStyles();

  return (
    <div className={`relative overflow-hidden ${current.wrapper} ${className}`}>
      {/* Background Graphic Layer */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden"
      >
        {/* SVG Pattern Layer */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-80"
          style={{ backgroundImage: current.pattern }}
        />

        {/* Soft Radial Lighting Bloom */}
        <div
          className={`absolute -top-32 right-0 h-[400px] w-[400px] rounded-full bg-gradient-to-br ${current.accent} blur-3xl opacity-60`}
        />

        {/* Optional Logo Watermark */}
        {showWatermark && variant !== "espresso" && (
          <div
            className="absolute -bottom-16 -right-16 h-64 w-64 opacity-[0.035] bg-no-repeat bg-contain"
            style={{
              backgroundImage: "url('/brand/patterns/brand-symbol-watermark.svg')",
            }}
          />
        )}
      </div>

      {/* Foreground Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/**
 * CardBackground — Specialized visual treatment for cards throughout the application.
 */
export function CardBackground({
  variant = "editorial",
  className = "",
  children,
  badge,
  interactive = true,
}: {
  variant?: BrandBackgroundVariant;
  className?: string;
  children: React.ReactNode;
  badge?: React.ReactNode;
  interactive?: boolean;
}) {
  const getCardClasses = () => {
    switch (variant) {
      case "peach":
        return "bg-[#FFF9F3] border-[#F9E6D4] text-[#2B211C] shadow-card-subtle";
      case "espresso":
        return "bg-[#2B211C] border-[#E85D04]/30 text-white shadow-xl";
      case "showcase":
        return "bg-gradient-to-b from-[#FFFFFF] to-[#FFF9F3] border-[#E8D9CC] text-[#2B211C] shadow-card-elevated";
      case "minimal":
        return "bg-white border-[#E8D9CC] text-[#2B211C] shadow-2xs";
      case "editorial":
      default:
        return "bg-white border-[#E8D9CC] text-[#2B211C] shadow-card-subtle";
    }
  };

  return (
    <div
      className={`group relative rounded-2xl border p-6 overflow-hidden transition-all duration-300 ${getCardClasses()} ${
        interactive
          ? "hover:border-[#E85D04]/70 hover:-translate-y-1 hover:shadow-card-hover"
          : ""
      } ${className}`}
    >
      {/* Decorative Brand Accent Corner Shard */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -right-6 -bottom-6 h-20 w-20 rounded-full transition-transform duration-500 group-hover:scale-125 ${
          variant === "espresso"
            ? "bg-[#E85D04]/10 blur-xl"
            : variant === "peach"
            ? "bg-[#E85D04]/08 blur-lg"
            : "bg-[#F28C45]/06 blur-lg"
        }`}
      />

      {badge && <div className="mb-4">{badge}</div>}

      <div className="relative z-10">{children}</div>
    </div>
  );
}
