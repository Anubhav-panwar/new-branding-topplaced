"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { toast } from "sonner";
import Link from "next/link";
import {
  ShieldCheck,
  Mail,
  CheckCircle2,
  XCircle,
  Users,
  Lock,
  Save,
  ArrowLeft,
  Clock,
  RefreshCw,
  Send,
  PlugZap,
} from "lucide-react";
import {
  AdminPageHeader,
  AdminStatusBadge,
  AdminAnimatedCounter,
  ADMIN_BTN_GHOST,
  ADMIN_BTN_PRIMARY,
  ADMIN_INNER_TILE_CLASS,
  ADMIN_INPUT_CLASS,
  ADMIN_SURFACE_CLASS,
} from "@/components/admin/AdminRedSunUI";
import { DashboardPageTransition } from "@/components/ui/DashboardMotion";
import { adminFetch, getAdminToken, getCurrentAdminUser } from "@/lib/adminApi";

interface EmailSettings {
  requireEmailVerification: boolean;
  allowUnverifiedLogin: boolean;
  verificationCodeExpiry: number;
  maxResendAttempts: number;
  smtpEnabled: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpTlsMode?: string;
  smtpFrom?: string;
  smtpMissingFields?: string[];
}

interface SmtpTestResult {
  success: boolean;
  connected: boolean;
  authenticated: boolean;
  testEmailSent: boolean;
  tlsMode?: string;
  message: string;
}

interface UserStats {
  totalUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  pendingVerifications: number;
}

export default function AdminPermissionsPage() {
  const router = useRouter();
  const { user, isHydrated } = useSelector((state: RootState) => state.auth);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [testRecipientEmail, setTestRecipientEmail] = useState("");
  const [smtpTestResult, setSmtpTestResult] = useState<SmtpTestResult | null>(null);

  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    requireEmailVerification: true,
    allowUnverifiedLogin: false,
    verificationCodeExpiry: 15,
    maxResendAttempts: 5,
    smtpEnabled: false,
  });

  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    verifiedUsers: 0,
    unverifiedUsers: 0,
    pendingVerifications: 0,
  });

  const cachedAdmin = typeof window !== "undefined" ? getCurrentAdminUser() : null;
  const currentRole = (user?.role || cachedAdmin?.role || "").toLowerCase();
  const token = typeof window !== "undefined" ? getAdminToken() : null;
  const hasAdminAccess =
    currentRole === "admin" ||
    currentRole === "superadmin" ||
    currentRole === "super_admin" ||
    Boolean(token);

  useEffect(() => {
    if (!isHydrated) return;

    if (!hasAdminAccess) {
      router.push("/");
      return;
    }

    fetchSettings();
    fetchUserStats();
  }, [isHydrated, hasAdminAccess, router]);

  const fetchSettings = async () => {
    try {
      const data = await adminFetch("/api/admin/email-settings");
      if (data && data.settings) {
        setEmailSettings((prev) => ({ ...prev, ...data.settings }));
      }
    } catch (error: any) {
      console.error("Failed to fetch settings:", error);
      toast.error(error?.message || "Failed to load email & SMTP settings");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const data = await adminFetch("/api/admin/user-stats");
      if (data && data.stats) {
        setUserStats((prev) => ({ ...prev, ...data.stats }));
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const data = await adminFetch("/api/admin/email-settings", {
        method: "PUT",
        body: JSON.stringify({
          requireEmailVerification: emailSettings.requireEmailVerification,
          allowUnverifiedLogin: emailSettings.allowUnverifiedLogin,
          verificationCodeExpiry: emailSettings.verificationCodeExpiry,
          maxResendAttempts: emailSettings.maxResendAttempts,
        }),
      });
      if (data && data.settings) {
        setEmailSettings((prev) => ({ ...prev, ...data.settings }));
      }
      toast.success("Email verification settings updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTestSmtp = async (sendEmail: boolean) => {
    const trimmedEmail = testRecipientEmail.trim();
    if (sendEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
        toast.error("Please enter a valid recipient email address.");
        return;
      }
    }

    setTestingSmtp(true);
    setSmtpTestResult(null);
    try {
      const result: SmtpTestResult = await adminFetch("/api/admin/email-settings/test", {
        method: "POST",
        body: JSON.stringify({
          sendTestEmail: sendEmail,
          recipientEmail: sendEmail ? trimmedEmail : null,
        }),
      });
      setSmtpTestResult(result);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message || "SMTP verification failed");
      }
    } catch (error: any) {
      const msg = error?.message || "Failed to run SMTP connection test";
      setSmtpTestResult({
        success: false,
        connected: false,
        authenticated: false,
        testEmailSent: false,
        message: msg,
      });
      toast.error(msg);
    } finally {
      setTestingSmtp(false);
    }
  };

  if (isHydrated && !hasAdminAccess) {
    return null;
  }

  return (
    <DashboardPageTransition className="space-y-6">
        <AdminPageHeader
          title="Permissions &"
          highlight="Auth Controls"
          subtitle="Manage platform email verification enforcement, OTP code expiry limits, and candidate authentication safeguards."
          badge={
            <AdminStatusBadge tone="solar" dot>
              Admin RBAC Guarded
            </AdminStatusBadge>
          }
          actions={
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  fetchSettings();
                  fetchUserStats();
                }}
                disabled={loading}
                className={ADMIN_BTN_GHOST}
              >
                <RefreshCw
                  size={15}
                  className={loading ? "animate-spin" : ""}
                />
                <span>Sync Status</span>
              </button>
              <Link href="/admin" className={ADMIN_BTN_GHOST}>
                <ArrowLeft size={15} />
                <span>Back to Overview</span>
              </Link>
            </div>
          }
        />

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`${ADMIN_SURFACE_CLASS} p-6 h-80 animate-pulse`} />
            <div
              className={`${ADMIN_SURFACE_CLASS} lg:col-span-2 p-6 h-80 animate-pulse`}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Verification Statistics */}
            <div className="lg:col-span-1">
              <div className={`${ADMIN_SURFACE_CLASS} p-6 space-y-5`}>
                <div className="flex items-center justify-between gap-2 pb-4 border-b border-[#E8D9CC]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#E85D04]/15 border border-[#E85D04]/35 flex items-center justify-center">
                      <Users size={18} className="text-[#E85D04]" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#2B211C]">
                        User Verification
                      </h2>
                      <p className="text-[11px] text-[#70645C]">
                        Real-time auth state
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div
                    className={`${ADMIN_INNER_TILE_CLASS} p-4 flex items-center justify-between`}
                  >
                    <span className="text-xs font-medium text-[#70645C]">
                      Total Users
                    </span>
                    <span className="text-xl font-extrabold font-mono text-[#2B211C]">
                      <AdminAnimatedCounter value={userStats?.totalUsers ?? 0} />
                    </span>
                  </div>

                  <div
                    className={`${ADMIN_INNER_TILE_CLASS} p-4 flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-emerald-400" />
                      <span className="text-xs font-medium text-[#70645C]">
                        Verified Users
                      </span>
                    </div>
                    <span className="text-xl font-extrabold font-mono text-emerald-600">
                      <AdminAnimatedCounter value={userStats?.verifiedUsers ?? 0} />
                    </span>
                  </div>

                  <div
                    className={`${ADMIN_INNER_TILE_CLASS} p-4 flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-2">
                      <XCircle size={15} className="text-amber-500" />
                      <span className="text-xs font-medium text-[#70645C]">
                        Unverified Users
                      </span>
                    </div>
                    <span className="text-xl font-extrabold font-mono text-amber-600">
                      <AdminAnimatedCounter value={userStats?.unverifiedUsers ?? 0} />
                    </span>
                  </div>

                  <div
                    className={`${ADMIN_INNER_TILE_CLASS} p-4 flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock size={15} className="text-[#E85D04]" />
                      <span className="text-xs font-medium text-[#70645C]">
                        Pending OTPs
                      </span>
                    </div>
                    <span className="text-xl font-extrabold font-mono text-[#E85D04]">
                      <AdminAnimatedCounter value={userStats?.pendingVerifications ?? 0} />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Email Verification Settings */}
            <div className="lg:col-span-2">
              <div className={`${ADMIN_SURFACE_CLASS} p-6 sm:p-7 space-y-6`}>
                <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#E8D9CC]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center">
                      <Mail size={18} className="text-sky-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#2B211C]">
                        Email Verification Configuration
                      </h2>
                      <p className="text-xs text-[#70645C]">
                        Enforce registration verification policies and SMTP delivery checks.
                      </p>
                    </div>
                  </div>
                  <AdminStatusBadge
                    tone={emailSettings?.smtpEnabled ? "emerald" : "rose"}
                    dot
                  >
                    {emailSettings?.smtpEnabled
                      ? "SMTP Active"
                      : "SMTP Disabled"}
                  </AdminStatusBadge>
                </div>

                <div className="space-y-4">
                  {/* Require Email Verification Toggle */}
                  <div
                    className={`${ADMIN_INNER_TILE_CLASS} p-4 flex items-center justify-between gap-4`}
                  >
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-[#2B211C] flex items-center gap-2">
                        <Lock size={14} className="text-[#E85D04]" />
                        <span>Require Email Verification</span>
                      </div>
                      <p className="text-xs text-[#70645C]">
                        New users must verify their email address before accessing features
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={Boolean(emailSettings?.requireEmailVerification)}
                      aria-label="Toggle Require Email Verification"
                      onClick={() =>
                        setEmailSettings((prev) => ({
                          ...prev,
                          requireEmailVerification: !prev?.requireEmailVerification,
                        }))
                      }
                      className="min-h-[44px] min-w-[48px] inline-flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      <span
                        className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-colors ${
                          emailSettings?.requireEmailVerification
                            ? "bg-[#E85D04] border-[#E85D04]/50"
                            : "bg-[#FFFCF8] border-[#E8D9CC]"
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                            emailSettings?.requireEmailVerification
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </span>
                    </button>
                  </div>

                  {/* Allow Unverified Login Toggle */}
                  <div
                    className={`${ADMIN_INNER_TILE_CLASS} p-4 flex items-center justify-between gap-4`}
                  >
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-[#2B211C] flex items-center gap-2">
                        <ShieldCheck size={14} className="text-[#E85D04]" />
                        <span>Allow Unverified Login</span>
                      </div>
                      <p className="text-xs text-[#70645C]">
                        Allow unverified accounts to sign in with restricted privileges
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={Boolean(emailSettings?.allowUnverifiedLogin)}
                      aria-label="Toggle Allow Unverified Login"
                      onClick={() =>
                        setEmailSettings((prev) => ({
                          ...prev,
                          allowUnverifiedLogin: !prev?.allowUnverifiedLogin,
                        }))
                      }
                      className="min-h-[44px] min-w-[48px] inline-flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      <span
                        className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-colors ${
                          emailSettings?.allowUnverifiedLogin
                            ? "bg-[#E85D04] border-[#E85D04]/50"
                            : "bg-[#FFFCF8] border-[#E8D9CC]"
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                            emailSettings?.allowUnverifiedLogin
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </span>
                    </button>
                  </div>

                  {/* Numeric Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className={`${ADMIN_INNER_TILE_CLASS} p-4 space-y-2`}>
                      <label
                        htmlFor="otp-expiry-input"
                        className="block text-xs font-bold uppercase tracking-wider text-[#70645C]"
                      >
                        OTP Expiry (Minutes)
                      </label>
                      <input
                        id="otp-expiry-input"
                        type="number"
                        min={5}
                        max={60}
                        value={emailSettings?.verificationCodeExpiry ?? 15}
                        onChange={(e) =>
                          setEmailSettings((prev) => ({
                            ...prev,
                            verificationCodeExpiry:
                              parseInt(e.target.value, 10) || 15,
                          }))
                        }
                        className={`${ADMIN_INPUT_CLASS} font-mono`}
                      />
                      <p className="text-[11px] text-[#70645C]">
                        Allowed range: 5 to 60 minutes
                      </p>
                    </div>

                    <div className={`${ADMIN_INNER_TILE_CLASS} p-4 space-y-2`}>
                      <label
                        htmlFor="max-resend-input"
                        className="block text-xs font-bold uppercase tracking-wider text-[#70645C]"
                      >
                        Max Resend Attempts
                      </label>
                      <input
                        id="max-resend-input"
                        type="number"
                        min={1}
                        max={10}
                        value={emailSettings?.maxResendAttempts ?? 5}
                        onChange={(e) =>
                          setEmailSettings((prev) => ({
                            ...prev,
                            maxResendAttempts:
                              parseInt(e.target.value, 10) || 5,
                          }))
                        }
                        className={`${ADMIN_INPUT_CLASS} font-mono`}
                      />
                      <p className="text-[11px] text-[#70645C]">
                        Allowed range: 1 to 10 attempts per cycle
                      </p>
                    </div>
                  </div>

                  {/* SMTP Status Card & Explicit Connection Test */}
                  <div className={`${ADMIN_INNER_TILE_CLASS} p-4 space-y-4`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-[#2B211C]">
                          SMTP Service Status
                        </h3>
                        {emailSettings?.smtpEnabled ? (
                          <p className="text-xs text-[#70645C] mt-0.5 font-mono">
                            {emailSettings.smtpHost}:{emailSettings.smtpPort} ({emailSettings.smtpTlsMode || "STARTTLS"}) · Sender: {emailSettings.smtpFrom || "Configured"}
                          </p>
                        ) : (
                          <p className="text-xs text-[#70645C] mt-0.5">
                            {emailSettings?.smtpMissingFields?.length
                              ? `Missing backend env variables: ${emailSettings.smtpMissingFields.join(", ")}`
                              : "Configure environment SMTP credentials on the backend server"}
                          </p>
                        )}
                      </div>
                      <AdminStatusBadge
                        tone={emailSettings?.smtpEnabled ? "emerald" : "rose"}
                        dot
                      >
                        {emailSettings?.smtpEnabled ? "Configured" : "Not Configured"}
                      </AdminStatusBadge>
                    </div>

                    {/* Explicit Admin SMTP Test Controls */}
                    <div className="pt-3 border-t border-[#E8D9CC]/70 space-y-3">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleTestSmtp(false)}
                          disabled={testingSmtp}
                          className={ADMIN_BTN_GHOST}
                        >
                          <PlugZap size={14} className={testingSmtp ? "animate-pulse" : ""} />
                          <span>{testingSmtp ? "Testing..." : "Test SMTP Connection"}</span>
                        </button>

                        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <input
                            type="email"
                            value={testRecipientEmail}
                            onChange={(e) => setTestRecipientEmail(e.target.value)}
                            placeholder="Recipient email for test delivery..."
                            aria-label="Test email recipient"
                            className={`${ADMIN_INPUT_CLASS} flex-1 text-xs`}
                          />
                          <button
                            type="button"
                            onClick={() => handleTestSmtp(true)}
                            disabled={testingSmtp || !testRecipientEmail.trim()}
                            className={ADMIN_BTN_GHOST}
                          >
                            <Send size={14} />
                            <span>Send Test Email</span>
                          </button>
                        </div>
                      </div>

                      {smtpTestResult && (
                        <div
                          className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                            smtpTestResult.success
                              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                              : "bg-rose-50 border-rose-200 text-rose-800"
                          }`}
                        >
                          {smtpTestResult.success ? (
                            <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <XCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
                          )}
                          <div className="space-y-0.5">
                            <div className="font-semibold">{smtpTestResult.message}</div>
                            <div className="text-[11px] opacity-80">
                              TCP Connect: {smtpTestResult.connected ? "OK" : "Failed"} · Auth: {smtpTestResult.authenticated ? "OK" : "Failed"} · TLS: {smtpTestResult.tlsMode || "N/A"}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-4 border-t border-[#E8D9CC] flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className={ADMIN_BTN_PRIMARY}
                  >
                    <Save size={15} />
                    <span>{saving ? "Saving..." : "Save Settings"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardPageTransition>
  );
}
