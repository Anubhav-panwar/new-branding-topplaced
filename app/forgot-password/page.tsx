"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { requestPasswordReset } from "@/utils/api-helpers";
import Logo from "@/components/Logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error("Please enter your email address.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const res = await requestPasswordReset(trimmedEmail);
      if (res && (res.success || res.status === 200 || !res.error)) {
        setIsSuccess(true);
        setMessage("Password reset instructions have been sent to your email address.");
        toast.success("Reset email sent! Please check your inbox.");
      } else {
        setMessage(res?.error || res?.message || "Failed to send reset email. Please try again.");
        toast.error(res?.error || "Unable to send reset instructions.");
      }
    } catch (err: any) {
      console.error("Forgot password error:", err);
      setMessage(err.message || "An unexpected error occurred. Please try again later.");
      toast.error("Error sending reset email.");
    } finally {
      setIsLoading(false);
    }
  };

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
      <div className="relative z-10 mx-auto w-full max-w-[440px] my-auto py-8">
        <div className="rounded-3xl border border-[#EEDFD2] bg-white p-7 sm:p-9 shadow-[0_20px_50px_rgba(43,33,28,0.06),0_1px_3px_rgba(0,0,0,0.04)]">
          {isSuccess ? (
            <div className="space-y-4 text-center py-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                <CheckCircle2 className="h-7 w-7" />
              </div>

              <div>
                <h2 className="font-display text-2xl font-bold text-[#2B211C]">
                  Check your inbox
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-[#70645C] leading-relaxed">
                  We sent password reset instructions to{" "}
                  <strong className="text-[#2B211C]">{email}</strong>. Please check your spam folder if it doesn&apos;t arrive shortly.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/login"
                  className="flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#E85D04] via-[#F26A10] to-[#D94E00] text-sm font-bold text-white shadow-brand-glow hover:brightness-105 transition-all"
                >
                  Return to Log In
                </Link>
              </div>
            </div>
          ) : (
            <div>
              {/* Header */}
              <div className="mb-6">
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#2B211C] tracking-tight">
                  Forgot Your Password?
                </h1>
                <p className="mt-1.5 text-xs sm:text-sm text-[#70645C] leading-relaxed">
                  No worries! Enter your email and we&apos;ll send you a link to reset it.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <div className="relative">
                    <Mail
                      className={`pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors ${
                        isFocused ? "text-[#E85D04]" : "text-[#9E9087]"
                      }`}
                    />
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (message) setMessage("");
                      }}
                      className={`h-11 sm:h-12 w-full rounded-xl border pl-10 pr-3.5 text-sm text-[#2B211C] placeholder-[#9E9087] outline-none transition-all ${
                        isFocused
                          ? "border-[#E85D04] bg-white shadow-[0_0_0_3px_rgba(232,93,4,0.12)]"
                          : "border-[#E8D9CC] bg-[#FFFDFC] hover:border-[#E85D04]/50"
                      }`}
                      placeholder="Enter your email"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Error Banner */}
                {message && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-50 p-3 text-xs text-rose-800">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
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
                      <span>Sending Link...</span>
                    </div>
                  ) : (
                    <span>Send Reset Link</span>
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
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center text-xs text-[#70645C] pb-4">
        <span>© 2026 TopPlaced AI. All rights reserved.</span>
      </div>
    </main>
  );
}
