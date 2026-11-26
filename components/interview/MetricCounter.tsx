"use client";

import React, { useEffect, useState } from "react";

interface MetricCounterProps {
  value: number;
  duration?: number; // ms
  prefix?: string;
  suffix?: string;
  className?: string;
  decimals?: number;
}

export default function MetricCounter({
  value,
  duration = 900,
  prefix = "",
  suffix = "",
  className = "",
  decimals = 0,
}: MetricCounterProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const target = isNaN(value) ? 0 : value;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setCurrent(ease * target);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCurrent(target);
      }
    };

    window.requestAnimationFrame(step);
  }, [value, duration]);

  const formatted =
    decimals > 0 ? current.toFixed(decimals) : Math.round(current).toString();

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
