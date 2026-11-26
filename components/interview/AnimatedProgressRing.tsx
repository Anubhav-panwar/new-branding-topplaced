"use client";

import React, { useEffect, useState } from "react";

interface AnimatedProgressRingProps {
  value: number; // 0 - 100
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  className?: string;
  children?: React.ReactNode;
}

export default function AnimatedProgressRing({
  value,
  size = 120,
  strokeWidth = 8,
  color = "#E85D04",
  trackColor = "#FFFCF8",
  className = "",
  children,
}: AnimatedProgressRingProps) {
  const [animatedVal, setAnimatedVal] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedVal(Math.max(0, Math.min(100, value)));
    }, 120);
    return () => clearTimeout(timer);
  }, [value]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedVal / 100) * circumference;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="rotate-[-90deg] transition-all duration-700 ease-out"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          style={{
            transition: "stroke-dashoffset 1.1s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}
