"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { Lock, ArrowLeft, KeyRound, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Logo from "@/components/Logo";

function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const emailParam = searchParams.get("email");
    const codeParam = searchParams.get("code") || searchParams.get("token");
    if (emailParam) setEmail(emailParam);
    if (codeParam) setCode(codeParam);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (password !== confirm) {
      toast.error("Passwords do not match.");
      setMessage("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      setMessage("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), code: code.trim(), newPassword: password }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || data.error || data.detail || "Password reset failed.");
      }

      setIsSuccess(true);
      toast.success("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setMessage(err.message || "Failed to reset password. Please check your reset code.");
      toast.error(err.message || "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {isSuccess ? (
        <div className="space-y-4 text-center py-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
            <CheckCircle2 className="h-7 w-7" />
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-[#2B211C]">
              Password Updated!
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#70645C] leading-relaxed">
              Your password has been changed successfully. Redirecting you to sign in...
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/login"
              className="flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#E85D04] via-[#F26A10] to-[#D94E00] text-sm font-bold text-white shadow-brand-glow hover:brightness-105 transition-all"
            >
              Go to Login
            </Link>
          </div>
        </div>
      ) : (
        <div>
          {/* Header */}
          <div className="mb-6">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#2B211C] tracking-tight">
              Reset Your Password
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-[#70645C] leading-relaxed">
              Create a new password for your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="mb-1 block text-xs font-semibold text-[#2B211C]">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 w-full rounded-xl border border-[#E8D9CC] bg-[#FFFDFC] px-3.5 text-sm text-[#2B211C] placeholder-[#9E9087] outline-none transition-all hover:border-[#E85D04]/50 focus:border-[#E85D04] focus:bg-white focus:ring-2 focus:ring-[#E85D04]/20"
                placeholder="you@company.com"
                required
              />
            </div>

            {/* Verification Code */}
            <div>
              <label htmlFor="code" className="mb-1 block text-xs font-semibold text-[#2B211C]">
                Reset Code
              </label>
              <div className="relative">
                <KeyRound
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9E9087]"
                />
                <input
                  type="text"
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="h-11 w-full rounded-xl border border-[#E8D9CC] bg-[#FFFDFC] pl-10 pr-3.5 text-sm text-[#2B211C] placeholder-[#9E9087] outline-none transition-all hover:border-[#E85D04]/50 focus:border-[#E85D04] focus:bg-white focus:ring-2 focus:ring-[#E85D04]/20 font-mono tracking-wider"
                  placeholder="Enter reset code"
                  required
                />
              </div>
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="password" className="mb-1 block text-xs font-semibold text-[#2B211C]">
                Enter new password
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9E9087]"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 w-full rounded-xl border border-[#E8D9CC] bg-[#FFFDFC] pl-10 pr-11 text-sm text-[#2B211C] placeholder-[#9E9087] outline-none transition-all hover:border-[#E85D04]/50 focus:border-[#E85D04] focus:bg-white focus:ring-2 focus:ring-[#E85D04]/20"
                  placeholder="At least 8 characters"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#9E9087] hover:text-[#E85D04] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirm" className="mb-1 block text-xs font-semibold text-[#2B211C]">
                Confirm new password
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9E9087]"
                />
                <input
                  type={showConfirm ? "text" : "password"}
                  id="confirm"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="h-11 w-full rounded-xl border border-[#E8D9CC] bg-[#FFFDFC] pl-10 pr-11 text-sm text-[#2B211C] placeholder-[#9E9087] outline-none transition-all hover:border-[#E85D04]/50 focus:border-[#E85D04] focus:bg-white focus:ring-2 focus:ring-[#E85D04]/20"
                  placeholder="Repeat new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#9E9087] hover:text-[#E85D04] transition-colors"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {message && (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-50 p-2.5 text-xs text-rose-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <span className="leading-relaxed">{message}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 group relative flex h-12 w-full items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#E85D04] via-[#F26A10] to-[#D94E00] hover:from-[#D95200] hover:to-[#B94308] px-6 text-sm font-bold text-white shadow-[0_8px_20px_-3px_rgba(232,93,4,0.42)] transition-all hover:shadow-[0_12px_24px_-3px_rgba(232,93,4,0.5)] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Updating Password...</span>
                </div>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#70645C] hover:text-[#E85D04] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Log In</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="relative min-h-screen w-full bg-[#FAF5EF] text-[#2B211C] antialiased selection:bg-[#E85D04]/20 selection:text-[#E85D04] overflow-x-hidden flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Background Curved Ambience */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-gradient-to-b from-[#FEE8D6]/80 via-[#FCE3CF]/40 to-transparent blur-3xl opacity-80" />
        <div className="absolute bottom-0 right-[10%] w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-[#FED9C0]/50 to-transparent blur-3xl opacity-60" />
      </div>

      {/* Top Bar with Logo */}
      <div className="relative z-10 mx-auto w-full max-w-md pt-4 sm:pt-8 flex justify-center">
        <Link href="/" className="inline-block transition-opacity hover:opacity-90">
          <Logo size="md" variant="light" />
        </Link>
      </div>

      {/* Center Card */}
      <div className="relative z-10 mx-auto w-full max-w-[450px] my-auto py-8">
        <div className="rounded-3xl border border-[#EEDFD2] bg-white p-7 sm:p-9 shadow-[0_20px_50px_rgba(43,33,28,0.06),0_1px_3px_rgba(0,0,0,0.04)]">
          <Suspense fallback={<div className="p-8 text-center text-xs text-[#70645C]">Loading form...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center text-xs text-[#70645C] pb-4">
        <span>© 2026 TopPlaced AI. All rights reserved.</span>
      </div>
    </main>
  );
}
