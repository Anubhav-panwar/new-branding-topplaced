"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getApiBaseUrl } from "@/lib/adminApi";

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedPath = useRef<string>("");

  useEffect(() => {
    if (!pathname) return;

    // Build path without sensitive query tokens (e.g. passwords, reset tokens)
    const sanitizedParams = new URLSearchParams();
    searchParams?.forEach((val, key) => {
      const lowerKey = key.toLowerCase();
      if (!lowerKey.includes("token") && !lowerKey.includes("secret") && !lowerKey.includes("password") && !lowerKey.includes("key")) {
        sanitizedParams.append(key, val);
      }
    });

    const queryString = sanitizedParams.toString();
    const fullPath = queryString ? `${pathname}?${queryString}` : pathname;

    // Avoid duplicate immediate hits on same route render
    if (lastTrackedPath.current === fullPath) return;
    lastTrackedPath.current = fullPath;

    // Send privacy-safe page view
    try {
      const apiBase = getApiBaseUrl();
      fetch(`${apiBase}/api/analytics/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: fullPath,
          pageTitle: typeof document !== "undefined" ? document.title : "",
          referrer: typeof document !== "undefined" ? document.referrer : "",
          eventType: "pageview",
        }),
      }).catch(() => {
        // Silently swallow network tracking errors
      });
    } catch {
      // Ignore
    }
  }, [pathname, searchParams]);

  return null;
}
