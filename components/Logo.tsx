'use client';

import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
  variant?: 'light' | 'dark' | 'auto' | 'redsun';
  accent?: 'indigo' | 'orange';
  className?: string;
  iconOnly?: boolean;
}

export function BrandSymbol({ className = 'w-9 h-9' }: { className?: string }) {
  return (
    <div className={`relative ${className} shrink-0 transition-transform duration-300 group-hover:scale-105`}>
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="tp-symbol-bg" x1="6" y1="6" x2="58" y2="58" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F28C45" />
            <stop offset="50%" stopColor="#E85D04" />
            <stop offset="100%" stopColor="#B94308" />
          </linearGradient>
          <linearGradient id="tp-symbol-shard" x1="20" y1="16" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F9E6D4" />
          </linearGradient>
        </defs>

        {/* Squircle container with high-end inner border */}
        <rect width="64" height="64" rx="16" fill="url(#tp-symbol-bg)" />
        <rect
          x="1"
          y="1"
          width="62"
          height="62"
          rx="15"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="1.5"
        />

        {/* Foundation preparation step */}
        <path
          d="M16 38L27 24L32 28.5L21 42H16V38Z"
          fill="rgba(255,255,255,0.72)"
        />

        {/* Dynamic ascent pillar */}
        <path
          d="M25 42L37 19L43.5 23.5L31.5 46H25V42Z"
          fill="url(#tp-symbol-shard)"
        />

        {/* Summit Diamond - The Top Placed Peak */}
        <path
          d="M45 13.5L50.5 7.5L56 13.5L50.5 19.5L45 13.5Z"
          fill="#FFFFFF"
        />

        {/* Ground confidence horizon */}
        <path
          d="M16 47H46"
          stroke="#FFFFFF"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeOpacity="0.85"
        />
      </svg>
    </div>
  );
}

export default function Logo({
  size = 'md',
  showBadge = true,
  variant = 'light',
  className = '',
  iconOnly = false,
}: LogoProps) {
  const emblemSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  const isDark = variant === 'dark';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none group ${className}`}>
      {/* Precision Brand Emblem */}
      <BrandSymbol className={emblemSizes[size]} />

      {/* Wordmark Typography */}
      {!iconOnly && (
        <div className="flex items-center gap-1.5 leading-none">
          <div
            className={`font-display font-extrabold tracking-tight ${textSizes[size]} flex items-center`}
          >
            <span className={isDark ? 'text-white' : 'text-[#2B211C]'}>
              Top
            </span>
            <span className="text-[#E85D04] ml-0.5">
              Placed
            </span>
          </div>

          {/* AI Intelligence Badge */}
          {showBadge && (
            <span
              className={`font-mono font-bold uppercase rounded-md tracking-wider border text-[10px] px-1.5 py-0.5 shadow-xs ${
                isDark
                  ? 'bg-white/10 text-white border-white/20'
                  : 'bg-[#F9E6D4] text-[#B94308] border-[#E8D9CC]'
              }`}
            >
              AI
            </span>
          )}
        </div>
      )}
    </div>
  );
}
