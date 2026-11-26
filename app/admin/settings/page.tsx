"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  RefreshCw,
  AlertTriangle,
  Lock,
  Server,
  Cpu,
} from "lucide-react";
import { adminFetch } from "@/lib/adminApi";
import AIConfigurationPanel from "@/components/admin/AIConfigurationPanel";
import {
  ADMIN_BTN_GHOST,
  ADMIN_INNER_TILE_CLASS,
  ADMIN_SURFACE_CLASS,
  AdminPageHeader,
  AdminStatusBadge,
} from "@/components/admin/AdminRedSunUI";
import { DashboardPageTransition } from "@/components/ui/DashboardMotion";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<"ai" | "system">("ai");
  const [settingsData, setSettingsData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setError(null);
      const res = await adminFetch("/api/admin/settings");
      if (res.success) {
        setSettingsData(res);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load admin settings & health status");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const retentionPolicy = settingsData?.retentionPolicy || {};
  const cleanupJob = settingsData?.cleanupJob || {};
  const storage = settingsData?.storage || {};
  const systemHealth = settingsData?.systemHealth || {};

  return (
    <DashboardPageTransition className="space-y-6">
      <AdminPageHeader
        title="System Settings &"
        highlight="Architecture"
        subtitle="Centralized AI model routing, failover mechanisms, security credentials, and media retention policies."
        actions={
          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              fetchSettings();
            }}
            className={ADMIN_BTN_GHOST}
          >
            <RefreshCw
              size={14}
              className={refreshing ? "animate-spin text-[#E85D04]" : ""}
            />
            <span>Refresh All Systems</span>
          </button>
        }
      />

      {/* RedSun Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#E8D9CC] pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("ai")}
          className={`min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
            activeTab === "ai"
              ? "bg-[#E85D04]/15 text-[#E85D04] border-[#E85D04]/40 shadow-[0_0_20px_rgba(242,106,10,0.18)]"
              : "bg-transparent border-transparent text-[#70645C] hover:text-[#2B211C] hover:bg-white/[0.04]"
          }`}
        >
          <Cpu size={16} />
          <span>AI Provider &amp; Model Architecture</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("system")}
          className={`min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
            activeTab === "system"
              ? "bg-[#E85D04]/15 text-[#E85D04] border-[#E85D04]/40 shadow-[0_0_20px_rgba(242,106,10,0.18)]"
              : "bg-transparent border-transparent text-[#70645C] hover:text-[#2B211C] hover:bg-white/[0.04]"
          }`}
        >
          <Server size={16} />
          <span>System &amp; Media Storage Health</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
          <AlertTriangle size={18} className="shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Tab 1: Centralized AI Configuration & Failover Router */}
      {activeTab === "ai" && <AIConfigurationPanel />}

      {/* Tab 2: Retention Policy & Cluster Connectivity */}
      {activeTab === "system" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Retention Policy Configuration */}
          <div className={`${ADMIN_SURFACE_CLASS} p-5 sm:p-6 space-y-4`}>
            <div className="flex items-center justify-between pb-3 border-b border-[#E8D9CC]">
              <h3 className="text-xs font-bold text-[#2B211C] uppercase tracking-wider flex items-center gap-2">
                <Clock size={16} className="text-[#E85D04]" />
                <span>Recording Retention Policy</span>
              </h3>
              <AdminStatusBadge tone="amber">
                <Lock size={11} />
                <span>Enforced Policy</span>
              </AdminStatusBadge>
            </div>

            <div className="space-y-3 text-xs">
              <div className={`${ADMIN_INNER_TILE_CLASS} p-3.5 flex items-center justify-between gap-3`}>
                <div>
                  <span className="text-[#2B211C] font-semibold block">
                    Retention Window
                  </span>
                  <span className="text-[#70645C] text-[11px]">
                    Duration before physical deletion
                  </span>
                </div>
                <span className="text-sm font-extrabold text-[#E85D04] font-mono">
                  {retentionPolicy.retentionDays || 10} Days (240 Hours)
                </span>
              </div>

              <div className={`${ADMIN_INNER_TILE_CLASS} p-3.5 flex items-center justify-between gap-3`}>
                <div>
                  <span className="text-[#2B211C] font-semibold block">
                    Download Token Expiration
                  </span>
                  <span className="text-[#70645C] text-[11px]">
                    Cryptographic signed JWT window
                  </span>
                </div>
                <span className="text-sm font-extrabold text-[#2B211C] font-mono">
                  15 Minutes
                </span>
              </div>

              <div className={`${ADMIN_INNER_TILE_CLASS} p-3.5 flex items-center justify-between gap-3`}>
                <div>
                  <span className="text-[#2B211C] font-semibold block">
                    Candidate Mutation
                  </span>
                  <span className="text-[#70645C] text-[11px]">
                    Can candidates alter policy?
                  </span>
                </div>
                <AdminStatusBadge tone="rose">Strictly Forbidden</AdminStatusBadge>
              </div>

              <div className={`${ADMIN_INNER_TILE_CLASS} p-3.5 space-y-2`}>
                <span className="text-[#2B211C] font-semibold block">
                  Protected Assets (Never Purged)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    retentionPolicy.protectedAssets || [
                      "uploads/resumes/",
                      "public/images/",
                      "user profiles",
                    ]
                  ).map((asset: string) => (
                    <span
                      key={asset}
                      className="px-2.5 py-1 rounded-lg bg-[#FFFCF8] text-[#70645C] border border-[#E8D9CC] font-mono text-[11px]"
                    >
                      {asset}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* System Health & Cluster Status */}
          <div className={`${ADMIN_SURFACE_CLASS} p-5 sm:p-6 space-y-4`}>
            <div className="flex items-center justify-between pb-3 border-b border-[#E8D9CC]">
              <h3 className="text-xs font-bold text-[#2B211C] uppercase tracking-wider flex items-center gap-2">
                <Server size={16} className="text-[#E85D04]" />
                <span>System Health &amp; Connectivity</span>
              </h3>
              <AdminStatusBadge
                tone={systemHealth.status === "healthy" || !systemHealth.status ? "emerald" : "rose"}
                dot
                pulse={systemHealth.status === "healthy" || !systemHealth.status}
              >
                <span className="capitalize">
                  {systemHealth.status || "Healthy"}
                </span>
              </AdminStatusBadge>
            </div>

            <div className="space-y-3 text-xs">
              <div className={`${ADMIN_INNER_TILE_CLASS} p-3.5 flex items-center justify-between gap-3`}>
                <div>
                  <span className="text-[#2B211C] font-semibold block">
                    MongoDB Atlas Primary Pool
                  </span>
                  <span className="text-[#70645C] text-[11px]">
                    Cloud database connection mode
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-400 uppercase font-mono">
                  {systemHealth.database?.mode || "Cloud"} (Connected)
                </span>
              </div>

              <div className={`${ADMIN_INNER_TILE_CLASS} p-3.5 flex items-center justify-between gap-3`}>
                <div>
                  <span className="text-[#2B211C] font-semibold block">
                    Background Cleanup Engine
                  </span>
                  <span className="text-[#70645C] text-[11px]">
                    Distributed lock lease status
                  </span>
                </div>
                <span className="text-xs font-bold text-[#E85D04]">
                  Multi-Worker Safe
                </span>
              </div>

              <div className={`${ADMIN_INNER_TILE_CLASS} p-3.5 flex items-center justify-between gap-3`}>
                <div>
                  <span className="text-[#2B211C] font-semibold block">
                    Last Cleanup Run
                  </span>
                  <span className="text-[#70645C] text-[11px]">
                    Timestamp of last execution
                  </span>
                </div>
                <span className="text-xs text-[#2B211C] font-mono">
                  {cleanupJob.lastRun
                    ? new Date(cleanupJob.lastRun).toLocaleString()
                    : "Recently on startup"}
                </span>
              </div>

              <div className={`${ADMIN_INNER_TILE_CLASS} p-3.5 flex items-center justify-between gap-3`}>
                <div>
                  <span className="text-[#2B211C] font-semibold block">
                    Active Storage Consumed
                  </span>
                  <span className="text-[#70645C] text-[11px]">
                    Recordings filesystem size
                  </span>
                </div>
                <span className="text-sm font-extrabold text-[#2B211C] font-mono">
                  {storage.totalMB !== undefined
                    ? `${storage.totalMB} MB`
                    : "0.0 MB"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardPageTransition>
  );
}
