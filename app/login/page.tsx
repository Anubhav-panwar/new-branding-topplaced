"use client";

import type React from "react";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  BarChart3,
  Mic,
  Award,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { loginSuccess, logout } from "@/store/slices/authSlice";
import { useRouter } from "next/navigation";
import { RootState } from "@/store/store";
import { toast } from "sonner";
import Logo from "@/components/Logo";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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
  } catch {
    return true;
  }
};

function GoogleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function MicrosoftIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 21 21">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");
  const [focusedField, setFocusedField] = useState<"email" | "password" | null>(null);

  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const isRedirectingRef = useRef(false);

  const getRedirectUrl = (role?: string) => {
    const normalizedRole = (role || "").toLowerCase().trim();
    const isAdmin =
      normalizedRole === "admin" ||
      normalizedRole === "superadmin" ||
      normalizedRole === "super_admin";

    if (isAdmin) {
      if (typeof window !== "undefined") {
        try {
          const params = new URLSearchParams(window.location.search);
          const reason = params.get("reason");
          if (reason) return "/login";
          const redirectParam = params.get("redirect");
          if (
            redirectParam &&
            redirectParam.startsWith("/admin") &&
            !redirectParam.startsWith("//") &&
            !redirectParam.includes("\\")
          ) {
            return redirectParam;
          }
        } catch (err) {
          console.error("Error reading redirect param:", err);
        }
      }
      return "/admin";
    }

    if (normalizedRole === "mentor") {
      return "/mentor";
    }

    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        const reason = params.get("reason");
        if (reason) return "/login";
        const redirectParam = params.get("redirect");
        if (
          redirectParam &&
          redirectParam.startsWith("/") &&
          !redirectParam.startsWith("//") &&
          !redirectParam.includes("\\") &&
          !redirectParam.startsWith("/auth") &&
          !redirectParam.startsWith("/login")
        ) {
          return redirectParam;
        }
      } catch (err) {
        console.error("Error reading redirect param:", err);
      }
    }

    return "/learner";
  };

  useEffect(() => {
    if (!auth.isHydrated) return;
    if (isRedirectingRef.current) return;

    if (auth.token && isTokenExpired(auth.token)) {
      console.warn("Expired token detected on login page, clearing session...");
      dispatch(logout());
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("adminToken");
        localStorage.removeItem("user");
        document.cookie = "token=; Max-Age=0; Path=/; SameSite=Lax";
      } catch {}
      return;
    }

    if (auth.token && auth.user) {
      isRedirectingRef.current = true;
      const target = getRedirectUrl(auth.user.role);
      router.replace(target);
    }
  }, [auth.isHydrated, auth.token, auth.user, router, dispatch]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;

    const form = e.currentTarget;
    const emailInput =
      (form.elements.namedItem("email") as HTMLInputElement)?.value ?? email;
    const passwordInput =
      (form.elements.namedItem("password") as HTMLInputElement)?.value ?? password;

    const trimmedEmail = (emailInput || "").trim();
    const cleanPassword = passwordInput || "";

    if (!API_URL) {
      const msg = "API URL is not configured.";
      setMessageType("error");
      setMessage(msg);
      toast.error(msg);
      return;
    }

    if (!trimmedEmail || !cleanPassword) {
      const msg = "Please enter your email and password.";
      setMessageType("error");
      setMessage(msg);
      toast.error(msg);
      return;
    }

    setMessage("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password: cleanPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.access_token && data.user) {
        const userRole = (data.user.role || "").toLowerCase().trim();
        const isAdmin =
          userRole === "admin" ||
          userRole === "superadmin" ||
          userRole === "super_admin" ||
          data.user.isAdmin === true;

        setMessageType("success");
        setMessage(isAdmin ? "Admin authenticated! Redirecting..." : "Login successful! Redirecting...");
        toast.success(isAdmin ? "Welcome back, Admin!" : "Login successful!");

        localStorage.setItem("token", data.access_token);
        localStorage.setItem("user", JSON.stringify(data.user));

        if (isAdmin) {
          localStorage.setItem("adminToken", data.access_token);
        } else {
          localStorage.removeItem("adminToken");
        }

        const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
        document.cookie = `token=${data.access_token}; Max-Age=86400; Path=/; SameSite=Lax${isSecure ? "; Secure" : ""}`;

        dispatch(loginSuccess(data));

        const target = getRedirectUrl(data.user.role);
        window.location.replace(target);
        return;
      }

      if (
        res.status === 403 &&
        (typeof data.detail === "string" || typeof data.message === "string") &&
        String(data.detail || data.message).toLowerCase().includes("email")
      ) {
        const msg = "Please verify your email before logging in.";
        setMessageType("error");
        setMessage(msg);
        toast.error(msg);
        router.push(`/verify-email?email=${encodeURIComponent(trimmedEmail)}`);
        return;
      }

      let errorMsg = "Invalid email or password.";
      if (typeof data.detail === "string") {
        errorMsg = data.detail;
      } else if (Array.isArray(data.detail) && data.detail.length > 0) {
        errorMsg =
          data.detail.map((d: any) => d.msg || d.message).filter(Boolean).join(", ") ||
          "Validation error.";
      } else if (typeof data.message === "string") {
        errorMsg = data.message;
      }

      setMessageType("error");
      setMessage(errorMsg);
      toast.error(errorMsg);
    } catch (error) {
      console.error("Login error:", error);
      const msg = "Unable to connect to the server. Please check your network connection.";
      setMessageType("error");
      setMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialAuth = (provider: string) => {
    toast.info(`${provider} login will connect with your verified candidate profile.`);
  };

  return (
    <main className="relative min-h-screen w-full bg-[#FAF5EF] text-[#2B211C] antialiased selection:bg-[#E85D04]/20 selection:text-[#E85D04] overflow-x-hidden flex flex-col">
      {/* Background Curved Ambience */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#FEE8D6]/70 via-[#FCE3CF]/40 to-transparent blur-3xl opacity-70" />
        <div className="absolute bottom-0 right-[15%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#FED9C0]/50 to-transparent blur-3xl opacity-60" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
        {/* LEFT COLUMN: Premium Dark Brand Panel with Hero Candidate Image */}
        <section className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#1C120C] via-[#2A170C] to-[#120B07] text-white lg:w-[48%] xl:w-[46%] p-6 sm:p-10 lg:p-12 xl:p-16 shadow-2xl">
          {/* Subtle Warm Gradient Radiance */}
          <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#E85D04]/25 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#FF8C38]/15 blur-3xl" />

          {/* Top Brand Logo */}
          <div className="relative z-10 flex items-center justify-between">
            <Link href="/" className="inline-block transition-opacity hover:opacity-90">
              <Logo size="md" variant="dark" />
            </Link>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10"
            >
              <span>Back to home</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Middle: Value Proposition & Hero Visual Showcase */}
          <div className="relative z-10 my-auto py-8">
            {/* Dynamic Headline matching design reference */}
            <h1 className="font-display text-3xl sm:text-4xl lg:text-[44px] font-extrabold leading-[1.12] tracking-tight">
              Practice.
              <br />
              Prepare.
              <br />
              <span className="bg-gradient-to-r from-[#FF7A1A] via-[#FF9238] to-[#FFB067] bg-clip-text text-transparent">
                Get Hired.
              </span>
            </h1>

            <p className="mt-4 text-xs sm:text-sm leading-relaxed text-white/75 max-w-md">
              AI-powered interview practice with real-time feedback, calibrated rubrics, and personalized guidance to land your next opportunity.
            </p>

            {/* Feature Pills */}
            <div className="mt-6 flex flex-wrap gap-2.5">
              <div className="inline-flex items-center gap-2 rounded-xl bg-white/[0.08] backdrop-blur-md border border-white/10 px-3.5 py-1.5 text-xs font-medium text-white/90">
                <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-[#E85D04]/30 text-[#FF9238]">
                  <Mic className="h-3 w-3" />
                </span>
                <span>Real Interview Practice</span>
              </div>

              <div className="inline-flex items-center gap-2 rounded-xl bg-white/[0.08] backdrop-blur-md border border-white/10 px-3.5 py-1.5 text-xs font-medium text-white/90">
                <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-[#E85D04]/30 text-[#FF9238]">
                  <Sparkles className="h-3 w-3" />
                </span>
                <span>AI Feedback & Scoring</span>
              </div>

              <div className="inline-flex items-center gap-2 rounded-xl bg-white/[0.08] backdrop-blur-md border border-white/10 px-3.5 py-1.5 text-xs font-medium text-white/90">
                <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-[#E85D04]/30 text-[#FF9238]">
                  <BarChart3 className="h-3 w-3" />
                </span>
                <span>Improve with Insights</span>
              </div>
            </div>

            {/* Candidate Image Feature Frame */}
            <div className="relative mt-8 rounded-2xl overflow-hidden border border-white/15 bg-black/40 shadow-2xl group">
              <div className="relative h-56 sm:h-64 w-full overflow-hidden">
                <Image
                  src="/images/auth/auth-hero-woman.jpg"
                  alt="Candidate preparing for interview with TopPlaced AI"
                  fill
                  priority
                  className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              </div>

              {/* Floating Live Telemetry Badge */}
              <div className="absolute top-3.5 left-3.5 inline-flex items-center gap-2 rounded-full bg-black/60 backdrop-blur-md border border-white/15 px-3 py-1 text-[11px] font-medium text-white">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E85D04] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF7A1A]" />
                </span>
                <span className="font-mono text-[10px] tracking-wide">Duplex Audio · 42ms Latency</span>
              </div>

              {/* Floating Hireability Score Metric Badge */}
              <div className="absolute bottom-3.5 right-3.5 inline-flex items-center gap-2.5 rounded-xl bg-white/95 backdrop-blur-md border border-white/20 p-2.5 shadow-xl text-[#2B211C]">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFF2E6] text-[#E85D04]">
                  <Award className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-display text-xs font-bold leading-none text-[#2B211C]">
                    +18% Hireability
                  </div>
                  <div className="font-mono text-[10px] text-[#70645C] mt-0.5">
                    STAR Calibrated
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Footer Note */}
          <div className="relative z-10 flex items-center justify-between text-[11px] text-white/50 pt-2 border-t border-white/10">
            <span>© 2026 TopPlaced AI. All rights reserved.</span>
            <div className="flex items-center gap-3">
              <Link href="/privacy" className="hover:text-white/80 transition-colors">
                Privacy
              </Link>
              <span>·</span>
              <Link href="/terms" className="hover:text-white/80 transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Clean, Elegant White Form Card */}
        <section className="relative flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-8 lg:px-12 xl:px-16">
          <div className="w-full max-w-[440px] my-auto">
            {/* Card Container */}
            <div className="rounded-3xl border border-[#EEDFD2] bg-white p-7 sm:p-9 shadow-[0_20px_50px_rgba(43,33,28,0.06),0_1px_3px_rgba(0,0,0,0.04)]">
              {/* Header */}
              <div className="mb-6">
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#2B211C] tracking-tight">
                  Welcome Back 👋
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm text-[#70645C]">
                  Log in to your TopPlaced AI account
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Address */}
                <div>
                  <div className="relative">
                    <Mail
                      className={`pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors ${
                        focusedField === "email" ? "text-[#E85D04]" : "text-[#9E9087]"
                      }`}
                    />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={email}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (message) setMessage("");
                      }}
                      className={`h-11 sm:h-12 w-full rounded-xl border pl-10 pr-3.5 text-sm text-[#2B211C] placeholder-[#9E9087] outline-none transition-all ${
                        focusedField === "email"
                          ? "border-[#E85D04] bg-white shadow-[0_0_0_3px_rgba(232,93,4,0.12)]"
                          : "border-[#E8D9CC] bg-[#FFFDFC] hover:border-[#E85D04]/50"
                      }`}
                      placeholder="Email address"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="relative">
                    <Lock
                      className={`pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors ${
                        focusedField === "password" ? "text-[#E85D04]" : "text-[#9E9087]"
                      }`}
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={password}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (message) setMessage("");
                      }}
                      className={`h-11 sm:h-12 w-full rounded-xl border pl-10 pr-11 text-sm text-[#2B211C] placeholder-[#9E9087] outline-none transition-all ${
                        focusedField === "password"
                          ? "border-[#E85D04] bg-white shadow-[0_0_0_3px_rgba(232,93,4,0.12)]"
                          : "border-[#E8D9CC] bg-[#FFFDFC] hover:border-[#E85D04]/50"
                      }`}
                      placeholder="Password"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#9E9087] hover:text-[#E85D04] transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label
                    htmlFor="rememberMe"
                    className="inline-flex cursor-pointer items-center gap-2 text-[#70645C] hover:text-[#2B211C] select-none"
                  >
                    <input
                      id="rememberMe"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-[#E8D9CC] text-[#E85D04] focus:ring-[#E85D04]/30 accent-[#E85D04] cursor-pointer"
                    />
                    <span>Remember me</span>
                  </label>

                  <Link
                    href="/forgot-password"
                    className="font-semibold text-[#E85D04] hover:text-[#B94308] hover:underline transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>

                {/* Error Banner */}
                {message && (
                  <div
                    role="alert"
                    className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs ${
                      messageType === "success"
                        ? "border-emerald-500/35 bg-emerald-50 text-emerald-800"
                        : "border-rose-500/35 bg-rose-50 text-rose-800"
                    }`}
                  >
                    {messageType === "success" ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                    )}
                    <span className="leading-relaxed">{message}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative flex h-12 w-full items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#E85D04] via-[#F26A10] to-[#D94E00] hover:from-[#D95200] hover:to-[#B94308] px-6 text-sm font-bold text-white shadow-[0_8px_20px_-3px_rgba(232,93,4,0.42)] transition-all hover:shadow-[0_12px_24px_-3px_rgba(232,93,4,0.5)] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      <span>{messageType === "success" ? "Redirecting..." : "Signing In..."}</span>
                    </div>
                  ) : (
                    <span>Log In</span>
                  )}
                </button>

                {/* Create New Account Button */}
                <Link
                  href={
                    typeof window !== "undefined" &&
                    new URLSearchParams(window.location.search).get("redirect")
                      ? `/register?redirect=${encodeURIComponent(
                          new URLSearchParams(window.location.search).get("redirect")!
                        )}`
                      : "/register"
                  }
                  className="flex h-11 w-full items-center justify-center rounded-xl sm:rounded-2xl border border-[#E8D9CC] bg-white hover:bg-[#FFF9F3] text-xs sm:text-sm font-semibold text-[#2B211C] shadow-2xs transition-colors"
                >
                  Create New Account
                </Link>

                {/* Divider */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#EEDFD2]" />
                  </div>
                  <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                    <span className="bg-white px-3 text-[#9E9087]">or continue with</span>
                  </div>
                </div>

                {/* Social Login Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleSocialAuth("Google")}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E8D9CC] bg-white hover:bg-[#FFFDFC] text-xs font-semibold text-[#2B211C] shadow-2xs hover:border-[#E85D04]/40 transition-all cursor-pointer"
                  >
                    <GoogleIcon className="h-4 w-4" />
                    <span>Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSocialAuth("Microsoft")}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E8D9CC] bg-white hover:bg-[#FFFDFC] text-xs font-semibold text-[#2B211C] shadow-2xs hover:border-[#E85D04]/40 transition-all cursor-pointer"
                  >
                    <MicrosoftIcon className="h-4 w-4" />
                    <span>Microsoft</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Bottom In-column Link */}
            <p className="mt-5 text-center text-xs text-[#70645C]">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-bold text-[#E85D04] hover:text-[#B94308] hover:underline transition-colors"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
