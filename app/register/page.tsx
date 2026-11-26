"use client";

import type React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Sparkles,
  BarChart3,
  Target,
  Award,
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

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const { token, user } = useSelector((state: RootState) => state.auth);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !user) return;

    if (isTokenExpired(token)) {
      console.warn("Expired token found on register page, clearing session...");
      dispatch(logout());
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        document.cookie = "token=; Max-Age=0; Path=/; SameSite=Lax";
      } catch {}
      return;
    }

    if (user.role === "mentor") {
      router.replace("/mentor");
    } else if (user.role === "admin") {
      router.replace("/admin");
    } else {
      router.replace("/learner");
    }
  }, [token, user, router, dispatch]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      const msg = "Please enter your full name.";
      setMessage(msg);
      toast.error(msg);
      return;
    }

    if (!trimmedEmail) {
      const msg = "Please enter a valid email address.";
      setMessage(msg);
      toast.error(msg);
      return;
    }

    if (password.length < 8) {
      const msg = "Password must be at least 8 characters long.";
      setMessage(msg);
      toast.error(msg);
      return;
    }

    if (password !== confirmPassword) {
      const msg = "Passwords do not match.";
      setMessage(msg);
      toast.error(msg);
      return;
    }

    if (!agreeTerms) {
      const msg = "Please agree to the Terms of Service and Privacy Policy.";
      setMessage(msg);
      toast.error(msg);
      return;
    }

    try {
      setLoading(true);

      const endpoint = `${API_URL}/api/auth/register`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          password: password,
          role: "learner",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || data.detail || "Registration failed.");
      }

      toast.success("Account created successfully!");

      if (data.token && data.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        document.cookie = `token=${data.token}; Max-Age=86400; Path=/; SameSite=Lax`;
        dispatch(loginSuccess(data));
        router.replace("/learner");
      } else {
        router.replace("/login?registered=true");
      }
    } catch (err: any) {
      setMessage(err.message || "Something went wrong. Please try again.");
      toast.error(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = (provider: string) => {
    toast.info(`${provider} sign up will link with your verified profile.`);
  };

  return (
    <main className="relative min-h-screen w-full bg-[#FAF5EF] text-[#2B211C] antialiased selection:bg-[#E85D04]/20 selection:text-[#E85D04] overflow-x-hidden flex flex-col">
      {/* Background Curved Ambience */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#FEE8D6]/70 via-[#FCE3CF]/40 to-transparent blur-3xl opacity-70" />
        <div className="absolute bottom-0 right-[15%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#FED9C0]/50 to-transparent blur-3xl opacity-60" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
        {/* LEFT COLUMN: Premium Dark Brand Showcase Panel */}
        <section className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#1C120C] via-[#2A170C] to-[#120B07] text-white lg:w-[48%] xl:w-[46%] p-6 sm:p-10 lg:p-12 xl:p-16 shadow-2xl">
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

          {/* Middle: Brand Pitch & Candidate Visual */}
          <div className="relative z-10 my-auto py-8">
            <h1 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-extrabold leading-[1.14] tracking-tight">
              Create your account
              <br />
              and start your
              <br />
              <span className="bg-gradient-to-r from-[#FF7A1A] via-[#FF9238] to-[#FFB067] bg-clip-text text-transparent">
                interview journey.
              </span>
            </h1>

            <p className="mt-4 text-xs sm:text-sm leading-relaxed text-white/75 max-w-md">
              Join thousands of learners preparing for their dream careers with AI-powered mock interviews and instant diagnostic feedback.
            </p>

            {/* Feature Pills */}
            <div className="mt-6 flex flex-wrap gap-2.5">
              <div className="inline-flex items-center gap-2 rounded-xl bg-white/[0.08] backdrop-blur-md border border-white/10 px-3.5 py-1.5 text-xs font-medium text-white/90">
                <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-[#E85D04]/30 text-[#FF9238]">
                  <Target className="h-3 w-3" />
                </span>
                <span>Personalized interview practice</span>
              </div>

              <div className="inline-flex items-center gap-2 rounded-xl bg-white/[0.08] backdrop-blur-md border border-white/10 px-3.5 py-1.5 text-xs font-medium text-white/90">
                <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-[#E85D04]/30 text-[#FF9238]">
                  <BarChart3 className="h-3 w-3" />
                </span>
                <span>Detailed performance insights</span>
              </div>

              <div className="inline-flex items-center gap-2 rounded-xl bg-white/[0.08] backdrop-blur-md border border-white/10 px-3.5 py-1.5 text-xs font-medium text-white/90">
                <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-[#E85D04]/30 text-[#FF9238]">
                  <Sparkles className="h-3 w-3" />
                </span>
                <span>Career-ready guidance</span>
              </div>
            </div>

            {/* Candidate Image Showcase Frame */}
            <div className="relative mt-8 rounded-2xl overflow-hidden border border-white/15 bg-black/40 shadow-2xl group">
              <div className="relative h-56 sm:h-64 w-full overflow-hidden">
                <Image
                  src="/images/auth/auth-hero-woman.jpg"
                  alt="Candidate practicing interview with TopPlaced AI"
                  fill
                  priority
                  className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              </div>

              {/* Floating Top Badge */}
              <div className="absolute top-3.5 left-3.5 inline-flex items-center gap-2 rounded-full bg-black/60 backdrop-blur-md border border-white/15 px-3 py-1 text-[11px] font-medium text-white">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-[10px] tracking-wide">Live Adaptive Rubrics</span>
              </div>

              {/* Floating Confidence Metric Badge */}
              <div className="absolute bottom-3.5 right-3.5 inline-flex items-center gap-2.5 rounded-xl bg-white/95 backdrop-blur-md border border-white/20 p-2.5 shadow-xl text-[#2B211C]">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFF2E6] text-[#E85D04]">
                  <Award className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-display text-xs font-bold leading-none text-[#2B211C]">
                    94% Placement
                  </div>
                  <div className="font-mono text-[10px] text-[#70645C] mt-0.5">
                    Candidate Confidence
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

        {/* RIGHT COLUMN: Clean White Registration Form Card */}
        <section className="relative flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-8 lg:px-12 xl:px-16">
          <div className="w-full max-w-[450px] my-auto">
            <div className="rounded-3xl border border-[#EEDFD2] bg-white p-7 sm:p-9 shadow-[0_20px_50px_rgba(43,33,28,0.06),0_1px_3px_rgba(0,0,0,0.04)]">
              {/* Header */}
              <div className="mb-6">
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#2B211C] tracking-tight">
                  Create Your Account
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm text-[#70645C]">
                  Get started with TopPlaced AI in seconds
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleRegister} className="space-y-3.5">
                {/* Full Name */}
                <div>
                  <div className="relative">
                    <User
                      className={`pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors ${
                        focusedField === "name" ? "text-[#E85D04]" : "text-[#9E9087]"
                      }`}
                    />
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={fullName}
                      onFocus={() => setFocusedField("name")}
                      onBlur={() => setFocusedField(null)}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (message) setMessage("");
                      }}
                      className={`h-11 sm:h-12 w-full rounded-xl border pl-10 pr-3.5 text-sm text-[#2B211C] placeholder-[#9E9087] outline-none transition-all ${
                        focusedField === "name"
                          ? "border-[#E85D04] bg-white shadow-[0_0_0_3px_rgba(232,93,4,0.12)]"
                          : "border-[#E8D9CC] bg-[#FFFDFC] hover:border-[#E85D04]/50"
                      }`}
                      placeholder="Full name"
                      autoComplete="name"
                      required
                    />
                  </div>
                </div>

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
                      placeholder="Enter your email"
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
                      placeholder="Create a password (min 8 chars)"
                      autoComplete="new-password"
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

                {/* Confirm Password Field */}
                <div>
                  <div className="relative">
                    <Lock
                      className={`pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors ${
                        focusedField === "confirmPassword" ? "text-[#E85D04]" : "text-[#9E9087]"
                      }`}
                    />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={confirmPassword}
                      onFocus={() => setFocusedField("confirmPassword")}
                      onBlur={() => setFocusedField(null)}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (message) setMessage("");
                      }}
                      className={`h-11 sm:h-12 w-full rounded-xl border pl-10 pr-11 text-sm text-[#2B211C] placeholder-[#9E9087] outline-none transition-all ${
                        focusedField === "confirmPassword"
                          ? "border-[#E85D04] bg-white shadow-[0_0_0_3px_rgba(232,93,4,0.12)]"
                          : "border-[#E8D9CC] bg-[#FFFDFC] hover:border-[#E85D04]/50"
                      }`}
                      placeholder="Confirm password"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#9E9087] hover:text-[#E85D04] transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Terms Agreement Checkbox */}
                <div className="flex items-start gap-2 pt-1">
                  <input
                    id="agreeTerms"
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-[#E8D9CC] text-[#E85D04] focus:ring-[#E85D04]/30 accent-[#E85D04] cursor-pointer"
                    required
                  />
                  <label htmlFor="agreeTerms" className="text-xs text-[#70645C] leading-snug cursor-pointer select-none">
                    I agree to the{" "}
                    <Link href="/terms" className="font-semibold text-[#E85D04] hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="font-semibold text-[#E85D04] hover:underline">
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                {/* Error Banner */}
                {message && (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-50 p-2.5 text-xs text-rose-800">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                    <span>{message}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative flex h-12 w-full items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#E85D04] via-[#F26A10] to-[#D94E00] hover:from-[#D95200] hover:to-[#B94308] px-6 text-sm font-bold text-white shadow-[0_8px_20px_-3px_rgba(232,93,4,0.42)] transition-all hover:shadow-[0_12px_24px_-3px_rgba(232,93,4,0.5)] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      <span>Creating Account...</span>
                    </div>
                  ) : (
                    <span>Create Account</span>
                  )}
                </button>

                {/* Divider */}
                <div className="relative py-1.5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#EEDFD2]" />
                  </div>
                  <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                    <span className="bg-white px-3 text-[#9E9087]">or sign up with</span>
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
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-bold text-[#E85D04] hover:text-[#B94308] hover:underline transition-colors"
              >
                Log In
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
