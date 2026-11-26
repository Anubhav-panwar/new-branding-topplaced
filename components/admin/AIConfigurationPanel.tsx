"use client";

import React, { useState, useEffect } from "react";
import {
  Cpu,
  ShieldCheck,
  Zap,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Key,
  Sliders,
  ArrowRightLeft,
  Eye,
  EyeOff,
  Flame,
  Check,
  Info,
  RotateCcw,
} from "lucide-react";
import { adminFetch } from "@/lib/adminApi";
import {
  ADMIN_BTN_GHOST,
  ADMIN_BTN_PRIMARY,
  ADMIN_INNER_TILE_CLASS,
  ADMIN_INPUT_CLASS,
  ADMIN_SURFACE_CLASS,
  AdminStatusBadge,
} from "@/components/admin/AdminRedSunUI";

interface ProviderPreset {
  baseUrl: string;
  defaultModel: string;
  recommendedModels: string[];
}

interface SingleConfigState {
  provider: "NVIDIA" | "OPENAI";
  apiKey: string;
  model: string;
  baseUrl: string;
  isEnabled: boolean;
  isActive: boolean;
  temperature: number;
  maxTokens: number;
  timeoutSeconds: number;
}

interface BackupConfigState {
  provider: "NVIDIA" | "OPENAI";
  apiKey: string;
  model: string;
  baseUrl: string;
  isEnabled: boolean;
  temperature: number;
  maxTokens: number;
  timeoutSeconds: number;
}

interface DiagnosticsData {
  status: "healthy" | "degraded" | "failing";
  activeProvider: string;
  primary: {
    provider: string;
    model: string;
    enabled?: boolean;
    configured: boolean;
    maskedKey: string;
    circuitBreaker: string;
    consecutiveFailures: number;
    lastFailure?: {
      time: string | null;
      reason: string;
      errorType: string;
    } | null;
  };
  backup: {
    provider: string;
    model: string;
    enabled: boolean;
    configured: boolean;
    maskedKey: string;
    lastFailoverEvent?: any;
  };
  metrics: {
    totalRequests: number;
    primarySuccesses: number;
    backupFailovers: number;
    totalFailures: number;
    failoverRate: number;
  };
  presets: Record<string, ProviderPreset>;
}

export default function AIConfigurationPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsData | null>(null);
  const [presets, setPresets] = useState<Record<string, ProviderPreset>>({});

  const [primary, setPrimary] = useState<SingleConfigState>({
    provider: "OPENAI",
    apiKey: "",
    model: "gpt-4o-mini",
    baseUrl: "",
    isEnabled: true,
    isActive: true,
    temperature: 0.2,
    maxTokens: 2048,
    timeoutSeconds: 15.0,
  });

  const [backup, setBackup] = useState<BackupConfigState>({
    provider: "NVIDIA",
    apiKey: "",
    model: "nvidia/nemotron-3.5-lightning-30b-a3b",
    baseUrl: "",
    isEnabled: false,
    temperature: 0.2,
    maxTokens: 2048,
    timeoutSeconds: 15.0,
  });

  const [showPrimaryKey, setShowPrimaryKey] = useState(false);
  const [showBackupKey, setShowBackupKey] = useState(false);
  const [isCustomPrimaryModel, setIsCustomPrimaryModel] = useState(false);
  const [isCustomBackupModel, setIsCustomBackupModel] = useState(false);
  const [primaryCustomModel, setPrimaryCustomModel] = useState("");
  const [backupCustomModel, setBackupCustomModel] = useState("");

  const [testingPrimary, setTestingPrimary] = useState(false);
  const [testingBackup, setTestingBackup] = useState(false);
  const [primaryTestResult, setPrimaryTestResult] = useState<{
    success: boolean;
    latencyMs?: number;
    message?: string;
    error?: string;
  } | null>(null);
  const [backupTestResult, setBackupTestResult] = useState<{
    success: boolean;
    latencyMs?: number;
    message?: string;
    error?: string;
  } | null>(null);

  const [resettingBreaker, setResettingBreaker] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      const res = await adminFetch("/api/admin/ai/config");
      if (res.success && res.config) {
        const p = res.config.primary || {};
        const b = res.config.backup || {};

        const pEnabled = p.isEnabled ?? p.isActive ?? true;
        setPrimary({
          provider: p.provider || "OPENAI",
          apiKey: p.apiKey || "",
          model: p.model || "gpt-4o-mini",
          baseUrl: p.baseUrl || "",
          isEnabled: pEnabled,
          isActive: pEnabled,
          temperature: p.temperature ?? 0.2,
          maxTokens: p.maxTokens ?? 2048,
          timeoutSeconds: p.timeoutSeconds ?? 15.0,
        });

        setBackup({
          provider: b.provider || "NVIDIA",
          apiKey: b.apiKey || "",
          model: b.model || "nvidia/nemotron-3.5-lightning-30b-a3b",
          baseUrl: b.baseUrl || "",
          isEnabled: b.isEnabled ?? false,
          temperature: b.temperature ?? 0.2,
          maxTokens: b.maxTokens ?? 2048,
          timeoutSeconds: b.timeoutSeconds ?? 15.0,
        });

        setPresets(res.presets || {});
        setDiagnostics(res.diagnostics || null);

        const pPreset = res.presets?.[p.provider || "OPENAI"];
        if (pPreset && !pPreset.recommendedModels.includes(p.model)) {
          setIsCustomPrimaryModel(true);
          setPrimaryCustomModel(p.model);
        } else {
          setIsCustomPrimaryModel(false);
        }

        const bPreset = res.presets?.[b.provider || "NVIDIA"];
        if (bPreset && !bPreset.recommendedModels.includes(b.model)) {
          setIsCustomBackupModel(true);
          setBackupCustomModel(b.model);
        } else {
          setIsCustomBackupModel(false);
        }
      }
    } catch (err: any) {
      setToastMessage({
        type: "error",
        text: err.message || "Failed to load centralized AI configuration.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfiguration();
  }, []);

  const handleTogglePrimary = (newVal: boolean) => {
    if (!newVal) {
      if (!backup.isEnabled) {
        setToastMessage({
          type: "error",
          text: "Cannot disable Primary AI while Backup AI is disabled. At least one provider must remain active.",
        });
        return;
      }
      if (!backup.apiKey || !backup.apiKey.trim()) {
        setToastMessage({
          type: "error",
          text: "Cannot disable Primary AI: Backup AI provider must have a configured API key.",
        });
        return;
      }
    }
    setPrimary((prev) => ({ ...prev, isEnabled: newVal, isActive: newVal }));
  };

  const handleToggleBackup = (newVal: boolean) => {
    if (!newVal && !primary.isEnabled) {
      setToastMessage({
        type: "error",
        text: "Cannot disable Backup AI while Primary AI is disabled. At least one provider must remain active.",
      });
      return;
    }
    setBackup((prev) => ({ ...prev, isEnabled: newVal }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setToastMessage(null);

      const pEnabled = primary.isEnabled;
      const bEnabled = backup.isEnabled;

      if (!pEnabled && !bEnabled) {
        throw new Error(
          "Both Primary and Backup AI cannot be disabled simultaneously. At least one provider must be enabled."
        );
      }

      if (!pEnabled) {
        if (!bEnabled) {
          throw new Error("Cannot disable Primary AI while Backup AI is disabled.");
        }
        if (!backup.apiKey || !backup.apiKey.trim()) {
          throw new Error(
            "Cannot disable Primary AI because Backup AI does not have a valid API key configured."
          );
        }
      }

      const resolvedPrimaryModel = isCustomPrimaryModel
        ? primaryCustomModel.trim()
        : primary.model;
      const resolvedBackupModel = isCustomBackupModel
        ? backupCustomModel.trim()
        : backup.model;

      if (primary.isEnabled && isCustomPrimaryModel && !resolvedPrimaryModel) {
        throw new Error(
          "Please specify a valid custom model name for the Primary provider."
        );
      }
      if (backup.isEnabled && isCustomBackupModel && !resolvedBackupModel) {
        throw new Error(
          "Please specify a valid custom model name for the Backup provider."
        );
      }

      const payload = {
        primary: {
          ...primary,
          model: resolvedPrimaryModel,
        },
        backup: {
          ...backup,
          model: resolvedBackupModel,
        },
      };

      const res = await adminFetch("/api/admin/ai/config", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.success) {
        setToastMessage({
          type: "success",
          text: "AI Provider, Model & Failover configurations successfully saved and deployed!",
        });
        setDiagnostics(res.diagnostics);
        if (res.config?.primary?.apiKey) {
          setPrimary((prev) => ({ ...prev, apiKey: res.config.primary.apiKey }));
        }
        if (res.config?.backup?.apiKey) {
          setBackup((prev) => ({ ...prev, apiKey: res.config.backup.apiKey }));
        }
      }
    } catch (err: any) {
      setToastMessage({
        type: "error",
        text: err.message || "Failed to save AI configuration.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestPrimary = async () => {
    try {
      setTestingPrimary(true);
      setPrimaryTestResult(null);

      const model = isCustomPrimaryModel
        ? primaryCustomModel.trim()
        : primary.model;
      const res = await adminFetch("/api/admin/ai/test-connection", {
        method: "POST",
        body: JSON.stringify({
          provider: primary.provider,
          apiKey: primary.apiKey,
          model,
          baseUrl: primary.baseUrl || null,
          target: "primary",
        }),
      });

      setPrimaryTestResult(res);
    } catch (err: any) {
      setPrimaryTestResult({
        success: false,
        error: err.message || "Connection test failed",
      });
    } finally {
      setTestingPrimary(false);
    }
  };

  const handleTestBackup = async () => {
    try {
      setTestingBackup(true);
      setBackupTestResult(null);

      const model = isCustomBackupModel
        ? backupCustomModel.trim()
        : backup.model;
      const res = await adminFetch("/api/admin/ai/test-connection", {
        method: "POST",
        body: JSON.stringify({
          provider: backup.provider,
          apiKey: backup.apiKey,
          model,
          baseUrl: backup.baseUrl || null,
          target: "backup",
        }),
      });

      setBackupTestResult(res);
    } catch (err: any) {
      setBackupTestResult({
        success: false,
        error: err.message || "Backup connection test failed",
      });
    } finally {
      setTestingBackup(false);
    }
  };

  const handleResetCircuitBreaker = async () => {
    try {
      setResettingBreaker(true);
      const res = await adminFetch("/api/admin/ai/circuit-breaker/reset", {
        method: "POST",
      });
      if (res.success) {
        setDiagnostics(res.diagnostics);
        setToastMessage({
          type: "success",
          text: "Primary AI Circuit Breaker manually reset to CLOSED.",
        });
      }
    } catch (err: any) {
      setToastMessage({
        type: "error",
        text: err.message || "Failed to reset circuit breaker.",
      });
    } finally {
      setResettingBreaker(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-[#FFFCF8] rounded-2xl border border-[#E8D9CC] animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-[#FFFCF8] rounded-2xl border border-[#E8D9CC] animate-pulse" />
          <div className="h-96 bg-[#FFFCF8] rounded-2xl border border-[#E8D9CC] animate-pulse" />
        </div>
      </div>
    );
  }

  const pPresets = presets[primary.provider] || {
    baseUrl: "",
    defaultModel: "",
    recommendedModels: [],
  };
  const bPresets = presets[backup.provider] || {
    baseUrl: "",
    defaultModel: "",
    recommendedModels: [],
  };

  const cbState = diagnostics?.primary?.circuitBreaker || "CLOSED";
  const isHealthy = diagnostics?.status === "healthy";
  const isDegraded = diagnostics?.status === "degraded";

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between gap-3 text-sm transition-all border ${
            toastMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-3">
            {toastMessage.type === "success" ? (
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle size={18} className="text-rose-400 shrink-0" />
            )}
            <span className="font-medium">{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="min-h-[36px] px-2.5 text-xs font-semibold hover:underline opacity-90 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Real-time Telemetry & Router Status Bar */}
      <div className={`${ADMIN_SURFACE_CLASS} p-5 md:p-6`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E8D9CC]">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E85D04]/15 border border-[#E85D04]/35 flex items-center justify-center text-[#E85D04] shrink-0">
              <Cpu size={20} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#2B211C]">
                  Centralized AI Router &amp; Failover Telemetry
                </h2>
                <AdminStatusBadge
                  tone={isHealthy ? "emerald" : isDegraded ? "amber" : "rose"}
                  dot
                  pulse={isHealthy}
                >
                  {diagnostics?.status?.toUpperCase() || "UNKNOWN"}
                </AdminStatusBadge>
              </div>
              <p className="text-xs text-[#70645C] mt-0.5">
                Routes all 10+ AI modules dynamically with zero-downtime automatic failover.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {cbState !== "CLOSED" && (
              <button
                type="button"
                onClick={handleResetCircuitBreaker}
                disabled={resettingBreaker}
                title="Reset Circuit Breaker to Closed"
                className="min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-300 bg-amber-500/12 border border-amber-500/30 rounded-xl hover:bg-amber-500/20 transition-colors cursor-pointer"
              >
                <RotateCcw
                  size={13}
                  className={resettingBreaker ? "animate-spin" : ""}
                />
                <span>Reset Circuit Breaker</span>
              </button>
            )}

            <button
              type="button"
              onClick={loadConfiguration}
              disabled={loading}
              className={ADMIN_BTN_GHOST}
            >
              <RefreshCw
                size={14}
                className={loading ? "animate-spin text-[#E85D04]" : ""}
              />
              <span>Refresh Status</span>
            </button>
          </div>
        </div>

        {/* Telemetry Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-4 text-xs">
          <div className={`${ADMIN_INNER_TILE_CLASS} p-3.5`}>
            <span className="text-[#70645C] block text-[11px]">Active Provider</span>
            <span className="text-sm font-bold text-[#E85D04] mt-1 block font-mono">
              {diagnostics?.activeProvider || "OPENAI"}
            </span>
          </div>

          <div className={`${ADMIN_INNER_TILE_CLASS} p-3.5`}>
            <span className="text-[#70645C] block text-[11px]">Circuit Breaker</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  cbState === "CLOSED"
                    ? "bg-emerald-400"
                    : cbState === "HALF_OPEN"
                    ? "bg-amber-400"
                    : "bg-rose-400"
                }`}
              />
              <span className="text-sm font-bold text-[#2B211C] font-mono">
                {cbState}
              </span>
            </div>
          </div>

          <div className={`${ADMIN_INNER_TILE_CLASS} p-3.5`}>
            <span className="text-[#70645C] block text-[11px]">Total Executions</span>
            <span className="text-sm font-bold text-[#2B211C] mt-1 block font-mono">
              {diagnostics?.metrics?.totalRequests ?? 0}
            </span>
          </div>

          <div className={`${ADMIN_INNER_TILE_CLASS} p-3.5`}>
            <span className="text-[#70645C] block text-[11px]">Primary Successes</span>
            <span className="text-sm font-bold text-emerald-400 mt-1 block font-mono">
              {diagnostics?.metrics?.primarySuccesses ?? 0}
            </span>
          </div>

          <div
            className={`${ADMIN_INNER_TILE_CLASS} p-3.5 col-span-2 sm:col-span-1`}
          >
            <span className="text-[#70645C] block text-[11px]">Backup Failovers</span>
            <span className="text-sm font-bold text-[#E85D04] mt-1 block font-mono">
              {diagnostics?.metrics?.backupFailovers ?? 0}{" "}
              <span className="text-[10px] text-[#70645C] font-normal">
                ({diagnostics?.metrics?.failoverRate ?? 0}%)
              </span>
            </span>
          </div>
        </div>

        {/* Failover Alert Banner */}
        {diagnostics?.backup?.lastFailoverEvent && (
          <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
            <ArrowRightLeft
              size={15}
              className="text-amber-300 mt-0.5 shrink-0"
            />
            <div>
              <span className="font-bold text-amber-300">
                Recent Automatic Failover Handled:
              </span>{" "}
              Primary ({diagnostics.backup.lastFailoverEvent.primaryProvider} /{" "}
              {diagnostics.backup.lastFailoverEvent.primaryModel}) experienced an
              outage. The router diverted traffic to Backup (
              {diagnostics.backup.lastFailoverEvent.backupProvider} /{" "}
              {diagnostics.backup.lastFailoverEvent.backupModel}) in{" "}
              <span className="font-mono font-bold">
                {diagnostics.backup.lastFailoverEvent.latencyMs}ms
              </span>{" "}
              with zero user disruption.
            </div>
          </div>
        )}
      </div>

      {/* Main Dual Configuration Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PRIMARY AI CONFIGURATION CARD */}
        <div className={`${ADMIN_SURFACE_CLASS} p-5 sm:p-6 space-y-5`}>
          <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-[#E8D9CC]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#E85D04]/15 border border-[#E85D04]/35 flex items-center justify-center text-[#E85D04] shrink-0">
                <Flame size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-[#2B211C] uppercase tracking-wider">
                  Primary AI Configuration
                </h3>
                <span className="text-xs text-[#70645C] block truncate">
                  Default engine for candidate simulations &amp; evaluations
                </span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0 min-h-[44px]">
              <input
                type="checkbox"
                checked={primary.isEnabled}
                onChange={(e) => handleTogglePrimary(e.target.checked)}
                className="sr-only peer"
                aria-label="Enable Primary AI Provider"
              />
              <div className="w-11 h-6 bg-[#E8D9CC] border border-[#E8D9CC] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E85D04]" />
              <span className="ml-2.5 text-xs font-semibold text-[#2B211C]">
                {primary.isEnabled ? "Enabled" : "Disabled"}
              </span>
            </label>
          </div>

          <div
            className={`space-y-5 transition-opacity ${
              primary.isEnabled ? "opacity-100" : "opacity-55 pointer-events-none"
            }`}
          >
            {/* Provider Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#70645C]">
                Provider Selection
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={!primary.isEnabled}
                  onClick={() => {
                    const newProvider = "NVIDIA";
                    setPrimary((prev) => ({
                      ...prev,
                      provider: newProvider,
                      model:
                        presets[newProvider]?.defaultModel ||
                        "nvidia/nemotron-3.5-lightning-30b-a3b",
                    }));
                    setIsCustomPrimaryModel(false);
                  }}
                  className={`min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    primary.provider === "NVIDIA"
                      ? "bg-[#E85D04]/15 border-[#E85D04] text-[#E85D04] shadow-[0_0_20px_rgba(242,106,10,0.2)]"
                      : "bg-[#FFFCF8] border-[#E8D9CC] text-[#70645C] hover:border-[#E85D04]/40 hover:text-[#2B211C]"
                  }`}
                >
                  <span>NVIDIA Integrate</span>
                  {primary.provider === "NVIDIA" && <Check size={14} />}
                </button>

                <button
                  type="button"
                  disabled={!primary.isEnabled}
                  onClick={() => {
                    const newProvider = "OPENAI";
                    setPrimary((prev) => ({
                      ...prev,
                      provider: newProvider,
                      model: presets[newProvider]?.defaultModel || "gpt-4o-mini",
                    }));
                    setIsCustomPrimaryModel(false);
                  }}
                  className={`min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    primary.provider === "OPENAI"
                      ? "bg-[#E85D04]/15 border-[#E85D04] text-[#E85D04] shadow-[0_0_20px_rgba(242,106,10,0.2)]"
                      : "bg-[#FFFCF8] border-[#E8D9CC] text-[#70645C] hover:border-[#E85D04]/40 hover:text-[#2B211C]"
                  }`}
                >
                  <span>OpenAI</span>
                  {primary.provider === "OPENAI" && <Check size={14} />}
                </button>
              </div>
            </div>

            {/* Secure API Key */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-semibold text-[#70645C] flex items-center gap-1.5">
                  <Key size={13} className="text-[#70645C]" />
                  <span>API Key (Encrypted at Rest)</span>
                </label>
                <span className="text-[11px] font-mono text-[#E85D04]">
                  {primary.apiKey && primary.apiKey.includes("*")
                    ? "Configured in Secure Store"
                    : "New Key"}
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPrimaryKey ? "text" : "password"}
                  disabled={!primary.isEnabled}
                  value={primary.apiKey}
                  onChange={(e) =>
                    setPrimary({ ...primary, apiKey: e.target.value })
                  }
                  placeholder={primary.provider === "NVIDIA" ? "nvapi-..." : "sk-..."}
                  className={`${ADMIN_INPUT_CLASS} !text-xs font-mono pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPrimaryKey(!showPrimaryKey)}
                  aria-label={showPrimaryKey ? "Hide API key" : "Show API key"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[36px] min-w-[36px] flex items-center justify-center text-[#70645C] hover:text-[#2B211C] cursor-pointer"
                >
                  {showPrimaryKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <p className="text-[11px] text-[#70645C]">
                Key is encrypted with Fernet (AES-128-CBC + HMAC-SHA256) at rest in MongoDB and never returned in plain text.
              </p>
            </div>

            {/* Model Selection */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-semibold text-[#70645C]">
                  Model Selection
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomPrimaryModel(!isCustomPrimaryModel)}
                  className="min-h-[40px] inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-[#FFFCF8]/80 border border-[#E8D9CC] hover:border-[#E85D04]/45 hover:bg-[#FFFCF8] text-xs font-semibold text-[#E85D04] hover:text-[#E85D04] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04]/50 transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                >
                  {isCustomPrimaryModel ? "Select Preset Model" : "Custom Model ID"}
                </button>
              </div>

              {isCustomPrimaryModel ? (
                <input
                  type="text"
                  disabled={!primary.isEnabled}
                  value={primaryCustomModel}
                  onChange={(e) => setPrimaryCustomModel(e.target.value)}
                  placeholder={
                    primary.provider === "NVIDIA"
                      ? "e.g., nvidia/nemotron-3.5-lightning-30b-a3b"
                      : "e.g., gpt-4o-mini"
                  }
                  className={`${ADMIN_INPUT_CLASS} !text-xs font-mono`}
                />
              ) : (
                <select
                  disabled={!primary.isEnabled}
                  value={primary.model}
                  onChange={(e) =>
                    setPrimary({ ...primary, model: e.target.value })
                  }
                  className={`${ADMIN_INPUT_CLASS} !text-xs font-mono cursor-pointer`}
                >
                  {pPresets.recommendedModels.map((m) => (
                    <option key={m} value={m}>
                      {m}{" "}
                      {m === pPresets.defaultModel ? "(Default Recommendation)" : ""}
                    </option>
                  ))}
                </select>
              )}

              {primary.provider === "NVIDIA" && (
                <p className="text-[11px] text-[#E85D04] bg-[#E85D04]/10 p-2.5 rounded-xl border border-[#E85D04]/25 mt-1">
                  <span className="font-bold">Recommended MoE Architecture:</span>{" "}
                  <code className="font-mono">
                    nvidia/nemotron-3.5-lightning-30b-a3b
                  </code>{" "}
                  delivers ultra-low token latency and high evaluation reasoning with 1M context support.
                </p>
              )}
            </div>

            {/* Execution Parameters */}
            <div className="pt-3 border-t border-[#E8D9CC] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#70645C]">
                <span className="font-semibold text-[#70645C] flex items-center gap-1.5">
                  <Sliders size={13} className="text-[#E85D04]" />
                  <span>Execution Parameters</span>
                </span>
                <span className="font-mono text-[11px] truncate">
                  Base: {pPresets.baseUrl}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-[#70645C] block">
                    Temperature
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.0"
                    max="1.0"
                    disabled={!primary.isEnabled}
                    value={primary.temperature}
                    onChange={(e) =>
                      setPrimary({
                        ...primary,
                        temperature: parseFloat(e.target.value) || 0.2,
                      })
                    }
                    className={`${ADMIN_INPUT_CLASS} mt-1 !px-2.5 !py-2 !text-xs font-mono`}
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#70645C] block">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    step="128"
                    min="256"
                    max="8192"
                    disabled={!primary.isEnabled}
                    value={primary.maxTokens}
                    onChange={(e) =>
                      setPrimary({
                        ...primary,
                        maxTokens: parseInt(e.target.value) || 2048,
                      })
                    }
                    className={`${ADMIN_INPUT_CLASS} mt-1 !px-2.5 !py-2 !text-xs font-mono`}
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#70645C] block">
                    Timeout (Sec)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="5"
                    max="60"
                    disabled={!primary.isEnabled}
                    value={primary.timeoutSeconds}
                    onChange={(e) =>
                      setPrimary({
                        ...primary,
                        timeoutSeconds: parseFloat(e.target.value) || 15.0,
                      })
                    }
                    className={`${ADMIN_INPUT_CLASS} mt-1 !px-2.5 !py-2 !text-xs font-mono`}
                  />
                </div>
              </div>
            </div>

            {/* Primary Connection Test */}
            <div className="pt-3 border-t border-[#E8D9CC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleTestPrimary}
                disabled={!primary.isEnabled || testingPrimary}
                className={ADMIN_BTN_GHOST}
              >
                <Zap
                  size={14}
                  className={
                    testingPrimary ? "animate-spin text-[#E85D04]" : "text-[#E85D04]"
                  }
                />
                <span>
                  {testingPrimary
                    ? "Testing Connection..."
                    : "Test Primary Connectivity"}
                </span>
              </button>

              {primaryTestResult && (
                <div
                  className={`text-xs px-3 py-2 rounded-xl border font-mono flex items-center gap-1.5 ${
                    primaryTestResult.success
                      ? "bg-emerald-500/12 text-emerald-300 border-emerald-500/30"
                      : "bg-rose-500/12 text-rose-300 border-rose-500/30"
                  }`}
                >
                  {primaryTestResult.success ? (
                    <>
                      <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                      <span>Ping OK ({primaryTestResult.latencyMs}ms)</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={13} className="text-rose-400 shrink-0" />
                      <span
                        className="truncate max-w-[200px]"
                        title={primaryTestResult.error}
                      >
                        {primaryTestResult.error || "Failed"}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BACKUP AI CONFIGURATION CARD */}
        <div className={`${ADMIN_SURFACE_CLASS} p-5 sm:p-6 space-y-5`}>
          <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-[#E8D9CC]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center text-amber-300 shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-[#2B211C] uppercase tracking-wider">
                  Backup AI Configuration
                </h3>
                <span className="text-xs text-[#70645C] block truncate">
                  Autonomous failover target if Primary encounters an outage
                </span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0 min-h-[44px]">
              <input
                type="checkbox"
                checked={backup.isEnabled}
                onChange={(e) => handleToggleBackup(e.target.checked)}
                className="sr-only peer"
                aria-label="Enable Backup AI Provider"
              />
              <div className="w-11 h-6 bg-[#E8D9CC] border border-[#E8D9CC] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E85D04]" />
              <span className="ml-2.5 text-xs font-semibold text-[#2B211C]">
                {backup.isEnabled ? "Enabled" : "Disabled"}
              </span>
            </label>
          </div>

          <div
            className={`space-y-5 transition-opacity ${
              backup.isEnabled ? "opacity-100" : "opacity-55 pointer-events-none"
            }`}
          >
            {/* Backup Provider Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#70645C]">
                Provider Selection
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={!backup.isEnabled}
                  onClick={() => {
                    const newProvider = "NVIDIA";
                    setBackup((prev) => ({
                      ...prev,
                      provider: newProvider,
                      model:
                        presets[newProvider]?.defaultModel ||
                        "nvidia/nemotron-3.5-lightning-30b-a3b",
                    }));
                    setIsCustomBackupModel(false);
                  }}
                  className={`min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    backup.provider === "NVIDIA"
                      ? "bg-amber-500/15 border-amber-400 text-amber-200 shadow-[0_0_20px_rgba(242,106,10,0.18)]"
                      : "bg-[#FFFCF8] border-[#E8D9CC] text-[#70645C] hover:border-[#E85D04]/40 hover:text-[#2B211C]"
                  }`}
                >
                  <span>NVIDIA Integrate</span>
                  {backup.provider === "NVIDIA" && <Check size={14} />}
                </button>

                <button
                  type="button"
                  disabled={!backup.isEnabled}
                  onClick={() => {
                    const newProvider = "OPENAI";
                    setBackup((prev) => ({
                      ...prev,
                      provider: newProvider,
                      model: presets[newProvider]?.defaultModel || "gpt-4o-mini",
                    }));
                    setIsCustomBackupModel(false);
                  }}
                  className={`min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    backup.provider === "OPENAI"
                      ? "bg-amber-500/15 border-amber-400 text-amber-200 shadow-[0_0_20px_rgba(242,106,10,0.18)]"
                      : "bg-[#FFFCF8] border-[#E8D9CC] text-[#70645C] hover:border-[#E85D04]/40 hover:text-[#2B211C]"
                  }`}
                >
                  <span>OpenAI</span>
                  {backup.provider === "OPENAI" && <Check size={14} />}
                </button>
              </div>
            </div>

            {/* Backup API Key */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-semibold text-[#70645C] flex items-center gap-1.5">
                  <Key size={13} className="text-[#70645C]" />
                  <span>Backup API Key (Encrypted at Rest)</span>
                </label>
                <span className="text-[11px] font-mono text-amber-300">
                  {backup.apiKey && backup.apiKey.includes("*")
                    ? "Configured in Secure Store"
                    : "New Key"}
                </span>
              </div>
              <div className="relative">
                <input
                  type={showBackupKey ? "text" : "password"}
                  disabled={!backup.isEnabled}
                  value={backup.apiKey}
                  onChange={(e) =>
                    setBackup({ ...backup, apiKey: e.target.value })
                  }
                  placeholder={backup.provider === "NVIDIA" ? "nvapi-..." : "sk-..."}
                  className={`${ADMIN_INPUT_CLASS} !text-xs font-mono pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowBackupKey(!showBackupKey)}
                  aria-label={
                    showBackupKey ? "Hide backup API key" : "Show backup API key"
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[36px] min-w-[36px] flex items-center justify-center text-[#70645C] hover:text-[#2B211C] cursor-pointer"
                >
                  {showBackupKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Backup Model Selection */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-semibold text-[#70645C]">
                  Backup Model Selection
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomBackupModel(!isCustomBackupModel)}
                  className="min-h-[40px] inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-[#FFFCF8]/80 border border-[#E8D9CC] hover:border-amber-400/45 hover:bg-[#FFFCF8] text-xs font-semibold text-amber-300 hover:text-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                >
                  {isCustomBackupModel ? "Select Preset Model" : "Custom Model ID"}
                </button>
              </div>

              {isCustomBackupModel ? (
                <input
                  type="text"
                  disabled={!backup.isEnabled}
                  value={backupCustomModel}
                  onChange={(e) => setBackupCustomModel(e.target.value)}
                  placeholder={
                    backup.provider === "NVIDIA"
                      ? "e.g., nvidia/nemotron-3.5-lightning-30b-a3b"
                      : "e.g., gpt-4o-mini"
                  }
                  className={`${ADMIN_INPUT_CLASS} !text-xs font-mono`}
                />
              ) : (
                <select
                  disabled={!backup.isEnabled}
                  value={backup.model}
                  onChange={(e) =>
                    setBackup({ ...backup, model: e.target.value })
                  }
                  className={`${ADMIN_INPUT_CLASS} !text-xs font-mono cursor-pointer`}
                >
                  {bPresets.recommendedModels.map((m) => (
                    <option key={m} value={m}>
                      {m}{" "}
                      {m === bPresets.defaultModel ? "(Default Recommendation)" : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Backup Hyperparameters */}
            <div className="pt-3 border-t border-[#E8D9CC] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#70645C]">
                <span className="font-semibold text-[#70645C] flex items-center gap-1.5">
                  <Sliders size={13} className="text-amber-300" />
                  <span>Failover Parameters</span>
                </span>
                <span className="font-mono text-[11px] truncate">
                  Base: {bPresets.baseUrl}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-[#70645C] block">
                    Temperature
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.0"
                    max="1.0"
                    disabled={!backup.isEnabled}
                    value={backup.temperature}
                    onChange={(e) =>
                      setBackup({
                        ...backup,
                        temperature: parseFloat(e.target.value) || 0.2,
                      })
                    }
                    className={`${ADMIN_INPUT_CLASS} mt-1 !px-2.5 !py-2 !text-xs font-mono`}
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#70645C] block">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    step="128"
                    min="256"
                    max="8192"
                    disabled={!backup.isEnabled}
                    value={backup.maxTokens}
                    onChange={(e) =>
                      setBackup({
                        ...backup,
                        maxTokens: parseInt(e.target.value) || 2048,
                      })
                    }
                    className={`${ADMIN_INPUT_CLASS} mt-1 !px-2.5 !py-2 !text-xs font-mono`}
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#70645C] block">
                    Timeout (Sec)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="5"
                    max="60"
                    disabled={!backup.isEnabled}
                    value={backup.timeoutSeconds}
                    onChange={(e) =>
                      setBackup({
                        ...backup,
                        timeoutSeconds: parseFloat(e.target.value) || 15.0,
                      })
                    }
                    className={`${ADMIN_INPUT_CLASS} mt-1 !px-2.5 !py-2 !text-xs font-mono`}
                  />
                </div>
              </div>
            </div>

            {/* Backup Connection Test */}
            <div className="pt-3 border-t border-[#E8D9CC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleTestBackup}
                disabled={!backup.isEnabled || testingBackup}
                className={ADMIN_BTN_GHOST}
              >
                <Zap
                  size={14}
                  className={
                    testingBackup ? "animate-spin text-amber-300" : "text-amber-300"
                  }
                />
                <span>
                  {testingBackup
                    ? "Testing Connection..."
                    : "Test Backup Connectivity"}
                </span>
              </button>

              {backupTestResult && (
                <div
                  className={`text-xs px-3 py-2 rounded-xl border font-mono flex items-center gap-1.5 ${
                    backupTestResult.success
                      ? "bg-emerald-500/12 text-emerald-300 border-emerald-500/30"
                      : "bg-rose-500/12 text-rose-300 border-rose-500/30"
                  }`}
                >
                  {backupTestResult.success ? (
                    <>
                      <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                      <span>Backup Ping OK ({backupTestResult.latencyMs}ms)</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={13} className="text-rose-400 shrink-0" />
                      <span
                        className="truncate max-w-[200px]"
                        title={backupTestResult.error}
                      >
                        {backupTestResult.error || "Failed"}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ElevenLabs Audio Independence Banner */}
      <div className={`${ADMIN_INNER_TILE_CLASS} p-4 flex items-start gap-3 text-xs text-[#70645C] border-sky-500/20`}>
        <Info size={16} className="text-sky-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-[#2B211C]">
            ElevenLabs Speech &amp; Voice Isolation:
          </span>
          <span className="text-[#70645C] ml-1 leading-relaxed">
            ElevenLabs Text-to-Speech (TTS) and voice generation services operate on a strictly independent infrastructure pipeline. Switching AI reasoning providers (between NVIDIA and OpenAI) will not interfere with or disrupt voice playback during live simulations.
          </span>
        </div>
      </div>

      {/* Save Action Bar */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-[#E8D9CC]">
        <button
          type="button"
          onClick={loadConfiguration}
          disabled={saving}
          className={ADMIN_BTN_GHOST}
        >
          Discard Changes
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={ADMIN_BTN_PRIMARY}
        >
          {saving ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              <span>Deploying Settings...</span>
            </>
          ) : (
            <>
              <Check size={14} />
              <span>Save &amp; Deploy AI Architecture</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
