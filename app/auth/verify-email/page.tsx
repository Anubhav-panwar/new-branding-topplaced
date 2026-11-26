"use client";

import { useState, useEffect, Suspense } from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  Mail,
  ArrowLeft,
  RefreshCw,
  Loader2,
} from "lucide-react";

import { toast } from "sonner";
import Link from "next/link";

import OTPInput from "@/components/OTPInput";

import { useDispatch } from "react-redux";
import { loginSuccess } from "@/store/slices/authSlice";

/*
 * IMPORTANT:
 * Always use localhost backend during local development
 * if NEXT_PUBLIC_API_URL is not configured.
 */
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();

  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(false);

  const [isResending, setIsResending] =
    useState(false);

  const [message, setMessage] = useState("");

  const [timeLeft, setTimeLeft] =
    useState(300);

  // ============================================================
  // GET EMAIL FROM URL
  // ============================================================

  useEffect(() => {
    const emailParam =
      searchParams.get("email");

    if (emailParam) {
      try {
        setEmail(
          decodeURIComponent(emailParam)
        );
      } catch {
        setEmail(emailParam);
      }
    }
  }, [searchParams]);

  // ============================================================
  // GET DEVELOPMENT VERIFICATION CODE
  // ============================================================

  useEffect(() => {
    // Keep verification code initially empty so candidate explicitly enters their OTP
    setVerificationCode("");
  }, []);

  // ============================================================
  // RESEND COUNTDOWN
  // ============================================================

  useEffect(() => {
    if (timeLeft <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(
        (current) => current - 1
      );
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft]);

  // ============================================================
  // FORMAT TIMER
  // ============================================================

  const formatTime = (seconds: number) => {
    return `${Math.floor(
      seconds / 60
    )}:${(seconds % 60)
      .toString()
      .padStart(2, "0")}`;
  };

  // ============================================================
  // VERIFY EMAIL
  // ============================================================

  const handleVerifyEmail = async (
    otp?: string
  ) => {
    const code = (
      otp || verificationCode
    ).trim();

    if (!email) {
      toast.error(
        "Email address is required."
      );

      return;
    }

    if (!/^\d{6}$/.test(code)) {
      toast.error(
        "Please enter a valid 6-digit code."
      );

      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      /*
       * IMPORTANT:
       * This request goes to backend port 5000.
       */
      const endpoint =
        `${API_URL}/api/auth/verify-email`;

      console.log(
        "VERIFY EMAIL REQUEST:",
        endpoint
      );

      const res = await fetch(endpoint, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code,
        }),
      });

      /*
       * Safely parse JSON.
       *
       * If backend accidentally returns HTML/404,
       * don't throw:
       * Unexpected token '<'
       */
      const contentType =
        res.headers.get("content-type") ||
        "";

      let data: any = {};

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        data = await res
          .json()
          .catch(() => ({}));
      } else {
        const text = await res
          .text()
          .catch(() => "");

        console.error(
          "Non-JSON verify response:",
          text
        );

        data = {
          message:
            `Server returned ${res.status} ${res.statusText}`,
        };
      }

      console.log(
        "VERIFY EMAIL RESPONSE:",
        {
          status: res.status,
          ok: res.ok,
          data,
        }
      );

      // ========================================================
      // SUCCESS
      // ========================================================

      if (
        res.ok &&
        data.access_token &&
        data.user
      ) {
        // Save token
        localStorage.setItem(
          "token",
          data.access_token
        );

        // Save token cookie
        document.cookie =
          `token=${data.access_token}; Max-Age=86400; Path=/; SameSite=Lax`;

        // Update Redux auth state
        dispatch(
          loginSuccess(data)
        );

        toast.success(
          "Email verified successfully!"
        );

        setMessage(
          "Email verified successfully!"
        );

        // ======================================================
        // REDIRECT BY ROLE
        // ======================================================

        const redirectParam = searchParams.get("redirect");
        if (
          redirectParam &&
          redirectParam.startsWith("/") &&
          !redirectParam.startsWith("/auth")
        ) {
          router.push(redirectParam);
          return;
        }

        if (
          data.user.role === "mentor"
        ) {
          router.push("/mentor");
        } else if (
          data.user.role === "admin"
        ) {
          router.push("/admin");
        } else {
          router.push("/learner");
        }

        return;
      }

      // ========================================================
      // SUCCESS BUT NO TOKEN
      // ========================================================

      if (res.ok) {
        toast.success(
          "Email verified successfully!"
        );

        router.push(
          "/login"
        );

        return;
      }

      // ========================================================
      // INVALID / EXPIRED CODE
      // ========================================================

      const errorMessage =
        Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message ||
          `Verification failed (${res.status})`;

      setMessage(errorMessage);
      toast.error(errorMessage);
    } catch (error) {
      console.error(
        "Verify email error:",
        error
      );

      const errorMessage =
        "Unable to connect to the backend server.";

      setMessage(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // RESEND VERIFICATION CODE
  // ============================================================

  const handleResendCode = async () => {
    if (!email.trim()) {
      toast.error(
        "Please enter your email."
      );

      return;
    }

    setIsResending(true);
    setMessage("");

    try {
      const endpoint =
        `${API_URL}/api/auth/resend-verification`;

      console.log(
        "RESEND VERIFICATION REQUEST:",
        endpoint
      );

      const res = await fetch(endpoint, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email: email
            .trim()
            .toLowerCase(),
        }),
      });

      const contentType =
        res.headers.get("content-type") ||
        "";

      let data: any = {};

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        data = await res
          .json()
          .catch(() => ({}));
      } else {
        const text = await res
          .text()
          .catch(() => "");

        console.error(
          "Non-JSON resend response:",
          text
        );

        data = {
          message:
            `Server returned ${res.status} ${res.statusText}`,
        };
      }

      console.log(
        "RESEND VERIFICATION RESPONSE:",
        {
          status: res.status,
          ok: res.ok,
          data,
        }
      );

      // ========================================================
      // RESEND SUCCESS
      // ========================================================

      if (res.ok) {
        toast.success(
          "Verification code sent! Please check your email."
        );

        setMessage(
          "A fresh 6-digit verification code has been sent to your email."
        );

        // Reset cooldown to 60s
        setTimeLeft(60);

        return;
      }

      // ========================================================
      // RESEND ERROR
      // ========================================================

      const errorMessage =
        Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message ||
          `Failed to resend code (${res.status})`;

      setMessage(errorMessage);
      toast.error(errorMessage);
    } catch (error) {
      console.error(
        "Resend verification error:",
        error
      );

      const errorMessage =
        "Unable to connect to the backend server.";

      setMessage(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#FFFCF8] text-[#2B211C] font-sans antialiased selection:bg-[#FFFCF8] selection:text-[#E85D04] flex items-center justify-center px-4">
      {/* Glow background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#E85D04]/10 rounded-full blur-3xl animate-pulse-slow"></div>

        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#E85D04]/5 rounded-full blur-3xl animate-pulse-slow"></div>
      </div>

      {/* Back */}
      <Link
        href="/login"
        className="absolute top-6 left-6 z-20 inline-flex items-center gap-2 rounded-full border border-[#E8D9CC] bg-[#FFFFFF] px-4 py-2 text-xs font-semibold text-[#70645C] shadow-sm backdrop-blur-md transition-all duration-200 hover:border-[#E85D04]/40 hover:bg-[#FFFCF8] hover:text-[#2B211C]"
      >
        <ArrowLeft size={14} className="transition-transform duration-200 hover:-translate-x-1" />
        <span>Back to Login</span>
      </Link>

      {/* Main card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="relative rounded-2xl border border-[#E8D9CC] bg-[#FFFFFF] p-8 shadow-2xl backdrop-blur-xl sm:p-9">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#E85D04]/20 via-[#E85D04] to-[#E85D04]/20" />
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-r from-[#E85D04] to-[#E85D04] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/20">
              <Mail
                className="text-white"
                size={22}
              />
            </div>

            <h1 className="text-2xl font-bold mb-2 text-[#2B211C]">
              Verify Your Email
            </h1>

            <p className="text-[#70645C] text-xs">
              We’ve sent a 6-digit verification
              code to
            </p>

            <p className="text-[#E85D04] font-semibold text-sm break-all mt-1">
              {email || "your registered email"}
            </p>
          </div>

          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              handleVerifyEmail();
            }}
          >
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-[#70645C] uppercase tracking-wider mb-2"
              >
                Email Address
              </label>

              <div className="relative">
                <Mail
                  size={20}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#70645C]"
                />

                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(
                      e.target.value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-[#E8D9CC] bg-[#FFFCF8] pl-10 pr-3.5 text-sm text-[#2B211C] placeholder-[#70645C] outline-none transition-all duration-200 hover:border-[#E85D04]/40 focus:border-[#E85D04] focus:bg-[#FFFCF8] focus:ring-2 focus:ring-[#E85D04]/20"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Verification code */}
            <div>
              <label className="block text-xs font-semibold text-[#70645C] uppercase tracking-wider mb-3 text-center">
                Verification Code
              </label>

              <OTPInput
                length={6}
                value={verificationCode}
                onChange={
                  setVerificationCode
                }
                onComplete={
                  handleVerifyEmail
                }
                disabled={isLoading}
                error={
                  !!message &&
                  !message
                    .toLowerCase()
                    .includes("sent") &&
                  !message
                    .toLowerCase()
                    .includes("success")
                }
                autoFocus
              />

              <p className="text-xs text-[#70645C] text-center mt-3">
                Enter the 6-digit verification code sent to your inbox
              </p>
            </div>

            {/* Message */}
            {message && (
              <p
                className={`text-xs text-center font-medium mt-4 p-2.5 rounded-lg border ${message
                    .toLowerCase()
                    .includes("sent") ||
                    message
                      .toLowerCase()
                      .includes(
                        "success"
                      )
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-rose-50 border-rose-200 text-rose-700"
                  }`}
              >
                {message}
              </p>
            )}

            {/* Verify button */}
            <button
              type="submit"
              onClick={() =>
                handleVerifyEmail()
              }
              disabled={
                isLoading ||
                verificationCode.length !==
                6
              }
              className="mt-6 group relative flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E85D04] to-[#E85D04] px-6 text-sm font-semibold text-white shadow-md shadow-orange-500/20 transition-all duration-200 hover:from-[#E85D04] hover:to-[#C84F04] hover:shadow-lg hover:shadow-orange-500/30 hover:-translate-y-0.5 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />

                  Verifying...
                </>
              ) : (
                "Verify"
              )}
            </button>
          </form>

          {/* Resend */}
          <div className="text-center mt-6">
            {timeLeft > 0 ? (
              <p className="text-[#70645C] text-xs mb-3">
                Resend available in{" "}
                <span className="text-[#E85D04]">
                  {formatTime(timeLeft)}
                </span>
              </p>
            ) : (
              <p className="text-[#70645C] text-xs mb-3">
                Didn’t receive the code?
              </p>
            )}

            <button
              type="button"
              onClick={
                handleResendCode
              }
              disabled={
                isResending ||
                timeLeft > 0
              }
              className="text-[#E85D04] hover:underline font-medium flex items-center justify-center mx-auto disabled:opacity-50"
            >
              {isResending ? (
                <>
                  <RefreshCw
                    size={16}
                    className="mr-2 animate-spin"
                  />

                  Sending...
                </>
              ) : (
                "Resend Code"
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-gray-500 text-sm">
          <p>
            Check your spam folder if you
            don’t see the email.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FFFCF8] flex items-center justify-center text-[#E85D04] text-sm font-mono">
          Loading verification...
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}