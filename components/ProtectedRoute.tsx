"use client";

import { useSelector, useDispatch } from "react-redux";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { RootState } from "@/store/store";
import { logout } from "@/store/slices/authSlice";

interface ProtectedRouteProps {
  children: React.ReactNode;
  theme?: "light" | "redsun";
}

// Helper to check token expiration with padding support
const isTokenExpired = (token: string): boolean => {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return true;

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const pad =
      base64.length % 4 === 0 ? base64 : base64 + "=".repeat(4 - (base64.length % 4));
    const jsonPayload = decodeURIComponent(
      window
        .atob(pad)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    const { exp } = JSON.parse(jsonPayload);
    if (!exp) return false;

    return Date.now() >= exp * 1000;
  } catch (e) {
    return true;
  }
};

// Premium loading screen matching either light or RedSun dark design system
const PremiumLoader = ({ theme = "light" }: { theme?: "light" | "redsun" }) => {
  const [showTimeoutHelp, setShowTimeoutHelp] = useState(false);
  const isRedSun = theme === "redsun";

  useEffect(() => {
    const timer = setTimeout(() => setShowTimeoutHelp(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 ${
        isRedSun ? "bg-[#F7EFE5] text-[#302016]" : "bg-[#F7EFE5]"
      }`}
    >
      <div className="flex flex-col items-center gap-5 max-w-sm text-center">
        {/* Animated logo mark */}
        <div className="relative w-14 h-14">
          <div
            className={`absolute inset-0 rounded-full border-2 ${
              isRedSun ? "border-[#F1D2B8]" : "border-indigo-200"
            }`}
          />
          <div
            className={`absolute inset-0 rounded-full border-t-2 animate-spin ${
              isRedSun ? "border-[#F26A0A]" : "border-[#F26A0A]"
            }`}
          />
          <div
            className={`absolute inset-[8px] rounded-full flex items-center justify-center ${
              isRedSun ? "bg-[#FFF8F0]" : "bg-indigo-50"
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full animate-pulse ${
                isRedSun ? "bg-[#F26A0A]" : "bg-[#F26A0A]"
              }`}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <p
            className={`text-xs font-bold tracking-widest uppercase font-mono ${
              isRedSun ? "text-[#E85D04]" : "text-[#F26A0A]"
            }`}
          >
            TopPlaced AI
          </p>
          <p className={`text-xs ${isRedSun ? "text-[#68574B]" : "text-[#64748B]"}`}>
            Validating candidate session...
          </p>
        </div>

        {showTimeoutHelp && (
          <div
            className={`mt-2 space-y-3 p-4 rounded-xl border animate-in fade-in duration-300 ${
              isRedSun ? "bg-[#FFF9F2] border-[#F1D2B8]" : "bg-white border-[#F1D2B8]"
            }`}
          >
            <p className={`text-xs ${isRedSun ? "text-[#302016]" : "text-[#334155]"}`}>
              Sign in is required to configure and launch an AI interview session.
            </p>
            <a
              href={`/login?redirect=${encodeURIComponent(
                typeof window !== "undefined"
                  ? window.location.pathname + window.location.search
                  : "/learner"
              )}`}
              className={
                isRedSun
                  ? "redsun-btn-glow inline-flex items-center justify-center px-5 py-2 rounded-full text-xs font-bold text-white cursor-pointer"
                  : "inline-flex items-center justify-center px-5 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-[#F26A0A] to-[#E85D04] hover:from-[#C84F04] hover:to-[#F26A0A] text-white shadow-md shadow-orange-500/20 transition-all cursor-pointer"
              }
            >
              Go to Sign In →
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default function ProtectedRoute({ children, theme = "light" }: ProtectedRouteProps) {
  const { token, user, isHydrated } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const redirectedRef = useRef(false);

  const effectiveTheme =
    theme === "redsun" || (pathname && pathname.startsWith("/learner"))
      ? "redsun"
      : "light";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // DO NOT evaluate auth or redirect until hydration has completed
    if (!isHydrated || redirectedRef.current) return;

    const rawPath =
      typeof window !== "undefined"
        ? window.location.pathname + window.location.search
        : "/learner";

    // Prevent redirecting to /auth paths as a redirect destination
    const safeTarget =
      rawPath.startsWith("/auth") || rawPath.startsWith("//") ? "/learner" : rawPath;

    if (!token || !user) {
      redirectedRef.current = true;
      const redirectUrl = `/login?redirect=${encodeURIComponent(safeTarget)}`;
      router.replace(redirectUrl);
      return;
    }

    if (isTokenExpired(token)) {
      redirectedRef.current = true;
      dispatch(logout());
      const redirectUrl = `/login?redirect=${encodeURIComponent(safeTarget)}`;
      router.replace(redirectUrl);
    }
  }, [token, user, isHydrated, router, dispatch]);

  // While mounting or hydrating session, show loader
  if (!mounted || !isHydrated) {
    return <PremiumLoader theme={effectiveTheme} />;
  }

  // If hydrated but not authenticated, show loader while router completes transition
  if (!token || !user || isTokenExpired(token)) {
    return <PremiumLoader theme={effectiveTheme} />;
  }

  return <>{children}</>;
}
