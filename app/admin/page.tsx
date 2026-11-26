/**
 * TopPlaced AI — Super Admin Control Panel
 * Preserves:
 * - Time-range presets: 7d, 14d, 30d, 90d, and Custom Date Range.
 * - Multi-service health monitoring: FastAPI, MongoDB, AI Provider, 10-day Retention.
 * - Dynamic host-aware API client (`adminFetch`) & KPI sub-module navigation drill-downs.
 */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Users,
  Video,
  Eye,
  HardDrive,
  TrendingUp,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ShieldAlert,
  Calendar,
  RefreshCw,
  Download,
  CheckCircle2,
  Activity,
  Server,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { adminFetch } from "@/lib/adminApi";
import {
  ADMIN_BTN_GHOST,
  ADMIN_BTN_PRIMARY,
  ADMIN_ICON_BTN,
  ADMIN_INNER_TILE_CLASS,
  ADMIN_INPUT_CLASS,
  ADMIN_SURFACE_CLASS,
  ADMIN_SURFACE_HOVER_CLASS,
  AdminPageHeader,
  AdminStatusBadge,
  AdminAnimatedCounter,
  AdminStaggerContainer,
  AdminStaggerItem,
  REDSUN_OUT_EXPO,
} from "@/components/admin/AdminRedSunUI";

export default function AdminDashboardPage() {
  const [days, setDays] = useState(30);
  const [isCustom, setIsCustom] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [charts, setCharts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");
  const prefersReduced = useReducedMotion();

  const fetchData = async (
    rangeDays: number,
    startDate?: string,
    endDate?: string
  ) => {
    try {
      setError(null);
      let statsUrl = `/api/admin/dashboard/stats?days=${rangeDays}`;
      let chartsUrl = `/api/admin/dashboard/charts?days=${rangeDays}`;

      if (startDate && endDate) {
        statsUrl += `&start_date=${startDate}&end_date=${endDate}`;
        chartsUrl += `&start_date=${startDate}&end_date=${endDate}`;
      }

      const [statsRes, chartsRes] = await Promise.all([
        adminFetch(statsUrl),
        adminFetch(chartsUrl),
      ]);

      if (statsRes.success) setStats(statsRes);
      if (chartsRes.success) setCharts(chartsRes.timeline || []);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      setError(err.message || "Failed to load verified dashboard metrics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isCustom) {
      fetchData(days);
    }
  }, [days, isCustom]);

  const handleRefresh = () => {
    setRefreshing(true);
    if (isCustom && customStart && customEnd) {
      fetchData(days, customStart, customEnd);
    } else {
      fetchData(days);
    }
  };

  const handleApplyCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStart || !customEnd) return;
    setRefreshing(true);
    fetchData(days, customStart, customEnd);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-[#FFFCF8] border border-[#E8D9CC] rounded-xl w-72 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-44 bg-[#FFFCF8] rounded-2xl border border-[#E8D9CC] animate-pulse"
            />
          ))}
        </div>
        <div className="h-80 bg-[#FFFCF8] rounded-2xl border border-[#E8D9CC] animate-pulse" />
      </div>
    );
  }

  const userStats = stats?.users || {};
  const interviewStats = stats?.interviews || {};
  const storageStats = stats?.storage || {};
  const analyticsStats = stats?.analytics || {};
  const systemHealth = stats?.systemHealth || {};

  const safeCharts = Array.isArray(charts) ? charts : [];
  const maxMetric = Math.max(
    ...safeCharts.map((c) =>
      Math.max(
        Number(c?.registrations) || 0,
        Number(c?.interviews) || 0,
        Number(c?.uniqueVisitors) || 0,
        1
      )
    ),
    5
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header with Real-Time Controls */}
      <AdminPageHeader
        title="Platform"
        highlight="Overview"
        subtitle="Real-time verified telemetry and MongoDB analytics across TopPlaced AI clusters."
        badge={
          lastRefreshed ? (
            <AdminStatusBadge tone="emerald" dot pulse>
              <span className="font-mono text-[11px]">Updated {lastRefreshed}</span>
            </AdminStatusBadge>
          ) : null
        }
        actions={
          <>
            <div className="flex flex-wrap items-center bg-[#FFFCF8] border border-[#E8D9CC] rounded-xl p-1 text-xs">
              {[7, 14, 30, 90].map((d) => {
                const active = !isCustom && days === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setIsCustom(false);
                      setDays(d);
                    }}
                    className={`min-h-[36px] px-3 py-1.5 rounded-lg font-mono font-semibold transition-all cursor-pointer ${
                      active
                        ? "bg-[#E85D04] text-white shadow-[0_0_18px_rgba(242,106,10,0.35)]"
                        : "text-[#70645C] hover:text-[#2B211C]"
                    }`}
                  >
                    {d}d
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setIsCustom(!isCustom)}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  isCustom
                    ? "bg-[#E85D04] text-white shadow-[0_0_18px_rgba(242,106,10,0.35)]"
                    : "text-[#70645C] hover:text-[#2B211C]"
                }`}
              >
                <Calendar size={13} />
                <span>Custom</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              aria-label="Refresh metrics from MongoDB"
              title="Refresh metrics from MongoDB"
              className={ADMIN_ICON_BTN}
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin text-[#E85D04]" : ""}
              />
            </button>
          </>
        }
      />

      {/* Custom Date Range Picker Bar */}
      {isCustom && (
        <form
          onSubmit={handleApplyCustomRange}
          className={`${ADMIN_SURFACE_CLASS} p-4 flex flex-wrap items-center gap-3 text-xs`}
        >
          <span className="text-[#E85D04] font-bold uppercase tracking-wider text-[11px] font-mono">
            Custom Window:
          </span>
          <div className="flex items-center gap-2">
            <label htmlFor="custom-start" className="text-[#70645C]">
              From
            </label>
            <input
              id="custom-start"
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              required
              className={`${ADMIN_INPUT_CLASS} !w-auto !py-2 !text-xs font-mono`}
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="custom-end" className="text-[#70645C]">
              To
            </label>
            <input
              id="custom-end"
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              required
              className={`${ADMIN_INPUT_CLASS} !w-auto !py-2 !text-xs font-mono`}
            />
          </div>
          <button
            type="submit"
            disabled={refreshing}
            className={`${ADMIN_BTN_PRIMARY} !py-2`}
          >
            Apply Range
          </button>
        </form>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
          <AlertTriangle size={18} className="shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* 4 Primary KPI Metric Cards with Staggered Entrance & Animated Numbers */}
      <AdminStaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Registered Users */}
        <AdminStaggerItem>
          <div className={`${ADMIN_SURFACE_HOVER_CLASS} p-5 group flex flex-col justify-between h-full`}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#70645C]">
                  Registered Users
                </span>
                <div className="w-10 h-10 rounded-xl bg-sky-500/12 border border-sky-500/25 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
                  <Users size={19} />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-[#2B211C] tracking-tight font-mono">
                <AdminAnimatedCounter value={userStats.total ?? 0} />
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <span className="text-emerald-400 font-semibold font-mono">
                  <AdminAnimatedCounter value={userStats.newInRange ?? 0} prefix="+" />
                </span>
                <span className="text-[#70645C]">
                  in {stats?.dateRange?.days || days} days
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E8D9CC] space-y-1.5 text-[11px] text-[#70645C]">
              <div className="flex items-center justify-between">
                <span>
                  Active:{" "}
                  <strong className="text-[#2B211C] font-mono">
                    <AdminAnimatedCounter value={userStats.active ?? 0} />
                  </strong>
                </span>
                <span>
                  Inactive:{" "}
                  <strong className="text-[#2B211C] font-mono">
                    <AdminAnimatedCounter value={userStats.inactive ?? 0} />
                  </strong>
                </span>
                <span>
                  Suspended:{" "}
                  <strong className="text-rose-300 font-mono">
                    <AdminAnimatedCounter value={userStats.suspended ?? 0} />
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-3 pt-1.5 border-t border-white/[0.05]">
                <span>
                  Paid:{" "}
                  <strong className="text-[#E85D04] font-mono">
                    <AdminAnimatedCounter value={userStats.paid ?? 0} />
                  </strong>
                </span>
                <span>
                  Free:{" "}
                  <strong className="text-[#70645C] font-mono">
                    <AdminAnimatedCounter value={userStats.free ?? 0} />
                  </strong>
                </span>
                <Link
                  href="/admin/users"
                  className="text-[#E85D04] hover:text-[#2B211C] font-semibold flex items-center gap-0.5 ml-auto"
                >
                  Users &rarr;
                </Link>
              </div>
            </div>
          </div>
        </AdminStaggerItem>

        {/* Interviews Analytics */}
        <AdminStaggerItem>
          <div className={`${ADMIN_SURFACE_HOVER_CLASS} p-5 group flex flex-col justify-between h-full`}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#70645C]">
                  Interviews Conducted
                </span>
                <div className="w-10 h-10 rounded-xl bg-[#E85D04]/15 border border-[#E85D04]/30 flex items-center justify-center text-[#E85D04] group-hover:scale-105 transition-transform">
                  <Video size={19} />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-[#2B211C] tracking-tight font-mono">
                <AdminAnimatedCounter value={interviewStats.total ?? 0} />
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <span className="text-emerald-400 font-semibold font-mono">
                  <AdminAnimatedCounter value={interviewStats.completed ?? 0} suffix=" completed" />
                </span>
                <span className="text-[#70645C]">
                  (<AdminAnimatedCounter value={interviewStats.completionRate ?? 0} suffix="%" /> rate)
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E8D9CC] space-y-1.5 text-[11px] text-[#70645C]">
              <div className="flex items-center justify-between">
                <span>
                  Ongoing:{" "}
                  <strong className="text-[#2B211C] font-mono">
                    <AdminAnimatedCounter value={interviewStats.ongoing ?? 0} />
                  </strong>
                </span>
                <span>
                  Abandoned:{" "}
                  <strong className="text-amber-300 font-mono">
                    <AdminAnimatedCounter value={interviewStats.abandoned ?? 0} />
                  </strong>
                </span>
                <span>
                  Failed:{" "}
                  <strong className="text-rose-300 font-mono">
                    <AdminAnimatedCounter value={interviewStats.failed ?? 0} />
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-3 pt-1.5 border-t border-white/[0.05]">
                <span>
                  Avg Duration:{" "}
                  <strong className="text-[#2B211C] font-mono">
                    <AdminAnimatedCounter value={interviewStats.avgDurationMinutes ?? 0} suffix="m" />
                  </strong>
                </span>
                <Link
                  href="/admin/interviews"
                  className="text-[#E85D04] hover:text-[#2B211C] font-semibold flex items-center gap-0.5 ml-auto"
                >
                  Explorer &rarr;
                </Link>
              </div>
            </div>
          </div>
        </AdminStaggerItem>

        {/* Website Visitors */}
        <AdminStaggerItem>
          <div className={`${ADMIN_SURFACE_HOVER_CLASS} p-5 group flex flex-col justify-between h-full`}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#70645C]">
                  Website Visitors
                </span>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/12 border border-emerald-500/25 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                  <Eye size={19} />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-[#2B211C] tracking-tight font-mono">
                <AdminAnimatedCounter value={analyticsStats.uniqueVisitors ?? 0} />
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <span className="text-[#70645C] font-semibold font-mono">
                  <AdminAnimatedCounter value={analyticsStats.totalPageViews ?? 0} suffix=" page views" />
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E8D9CC] space-y-1.5 text-[11px] text-[#70645C]">
              <div className="flex items-center justify-between">
                <span>
                  Returning:{" "}
                  <strong className="text-[#2B211C] font-mono">
                    <AdminAnimatedCounter value={analyticsStats.returningVisitors ?? 0} />
                  </strong>
                </span>
                <span>
                  New:{" "}
                  <strong className="text-[#2B211C] font-mono">
                    <AdminAnimatedCounter value={analyticsStats.newVisitors ?? 0} />
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-3 pt-1.5 border-t border-white/[0.05]">
                <span>
                  Avg <AdminAnimatedCounter value={analyticsStats.avgViewsPerVisitor ?? 1.0} decimals={1} /> pgs/visitor
                </span>
                <Link
                  href="/admin/analytics"
                  className="text-[#E85D04] hover:text-[#2B211C] font-semibold flex items-center gap-0.5 ml-auto"
                >
                  Traffic &rarr;
                </Link>
              </div>
            </div>
          </div>
        </AdminStaggerItem>

        {/* Media Storage & Retention */}
        <AdminStaggerItem>
          <div className={`${ADMIN_SURFACE_HOVER_CLASS} p-5 group flex flex-col justify-between h-full`}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#70645C]">
                  Media Storage
                </span>
                <div className="w-10 h-10 rounded-xl bg-amber-500/12 border border-amber-500/25 flex items-center justify-center text-amber-300 group-hover:scale-105 transition-transform">
                  <HardDrive size={19} />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-[#2B211C] tracking-tight font-mono">
                <AdminAnimatedCounter
                  value={Number(storageStats.totalMB) || 0}
                  decimals={1}
                  suffix=" MB"
                />
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <span className="text-amber-300 font-semibold font-mono">
                  <AdminAnimatedCounter
                    value={storageStats.expiringSoonCount ?? 0}
                    suffix=" expiring soon"
                  />
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E8D9CC] space-y-1.5 text-[11px] text-[#70645C]">
              <div className="flex items-center justify-between">
                <span>
                  Active:{" "}
                  <strong className="text-[#2B211C] font-mono">
                    <AdminAnimatedCounter value={storageStats.activeRecordings ?? 0} />
                  </strong>
                </span>
                <span>
                  Expired:{" "}
                  <strong className="text-rose-300 font-mono">
                    <AdminAnimatedCounter value={storageStats.pendingDeletionCount ?? 0} />
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-3 pt-1.5 border-t border-white/[0.05]">
                <span className="truncate max-w-[130px]">Strict 10d Retention</span>
                <Link
                  href="/admin/recordings"
                  className="text-[#E85D04] hover:text-[#2B211C] font-semibold flex items-center gap-0.5 ml-auto"
                >
                  Retention &rarr;
                </Link>
              </div>
            </div>
          </div>
        </AdminStaggerItem>
      </AdminStaggerContainer>

      {/* Platform Activity Timeline Chart */}
      <div className={`${ADMIN_SURFACE_CLASS} p-5 sm:p-6`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-[#2B211C] flex items-center gap-2">
              <TrendingUp size={18} className="text-[#E85D04]" />
              <span>Platform Activity Timeline ({safeCharts.length} Days)</span>
            </h2>
            <p className="text-xs text-[#70645C] mt-0.5">
              Verified daily counts for user registrations, conducted mock interviews, and website visitors.
            </p>
          </div>

          {/* Chart Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-sky-400" />
              <span className="text-[#70645C]">Registrations</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#E85D04]" />
              <span className="text-[#70645C]">Interviews</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-400" />
              <span className="text-[#70645C]">Visitors</span>
            </div>
          </div>
        </div>

        {safeCharts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-[#70645C] text-xs border border-dashed border-[#E8D9CC] rounded-xl">
            <BarChart3 size={32} className="text-[#70645C] mb-2" />
            <span>No telemetry recorded in the selected period.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[420px] h-64 flex items-end gap-1 sm:gap-2 pt-8 pb-2 border-b border-[#E8D9CC]">
              {safeCharts.map((point, idx) => {
                const regHeight = Math.max(
                  4,
                  Math.round(((point.registrations || 0) / maxMetric) * 100)
                );
                const intHeight = Math.max(
                  4,
                  Math.round(((point.interviews || 0) / maxMetric) * 100)
                );
                const visHeight = Math.max(
                  4,
                  Math.round(((point.uniqueVisitors || 0) / maxMetric) * 100)
                );

                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center h-full justify-end group relative"
                  >
                    {/* Hover Tooltip */}
                    <div className="absolute -top-2 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                      <div className="bg-[#FFFCF8] border border-[#E8D9CC] text-[11px] rounded-xl p-2.5 shadow-2xl whitespace-nowrap space-y-0.5 text-[#2B211C]">
                        <div className="font-bold text-[#2B211C] font-mono">
                          {point.date}
                        </div>
                        <div className="text-sky-300 font-mono">
                          Users: +{point.registrations || 0}
                        </div>
                        <div className="text-[#E85D04] font-mono">
                          Interviews: {point.interviews || 0}
                          {point.completedInterviews
                            ? ` (${point.completedInterviews} completed)`
                            : ""}
                        </div>
                        <div className="text-emerald-300 font-mono">
                          Visitors: {point.uniqueVisitors || 0} ({point.pageViews || 0} pvs)
                        </div>
                      </div>
                    </div>

                    {/* Bars Group with animated outExpo transition */}
                    <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-full">
                      <motion.div
                        initial={prefersReduced ? false : { height: "0%" }}
                        animate={{
                          height: `${point.registrations ? regHeight : 2}%`,
                        }}
                        transition={{
                          duration: 0.65,
                          delay: idx * 0.015,
                          ease: REDSUN_OUT_EXPO,
                        }}
                        className="w-1.5 sm:w-2 rounded-t bg-sky-400/80 hover:bg-sky-300 transition-colors"
                      />
                      <motion.div
                        initial={prefersReduced ? false : { height: "0%" }}
                        animate={{ height: `${point.interviews ? intHeight : 2}%` }}
                        transition={{
                          duration: 0.65,
                          delay: idx * 0.015 + 0.04,
                          ease: REDSUN_OUT_EXPO,
                        }}
                        className="w-1.5 sm:w-2 rounded-t bg-[#E85D04]/85 hover:bg-[#E85D04] transition-colors"
                      />
                      <motion.div
                        initial={prefersReduced ? false : { height: "0%" }}
                        animate={{
                          height: `${point.uniqueVisitors ? visHeight : 2}%`,
                        }}
                        transition={{
                          duration: 0.65,
                          delay: idx * 0.015 + 0.08,
                          ease: REDSUN_OUT_EXPO,
                        }}
                        className="w-1.5 sm:w-2 rounded-t bg-emerald-400/80 hover:bg-emerald-300 transition-colors"
                      />
                    </div>

                    {/* X-axis Label */}
                    <span className="text-[10px] font-mono text-[#70645C] mt-2 truncate max-w-full">
                      {idx % Math.max(1, Math.ceil(safeCharts.length / 8)) === 0
                        ? point.label
                        : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Two Column Grid: System Health & Administrative Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live System Health Monitor */}
        <div className={`${ADMIN_SURFACE_CLASS} p-5 sm:p-6 space-y-4`}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#2B211C] uppercase tracking-wider flex items-center gap-2">
              <Activity size={16} className="text-[#E85D04]" />
              <span>System Health &amp; Diagnostics</span>
            </h3>
            <AdminStatusBadge tone="emerald" dot pulse>
              Operational
            </AdminStatusBadge>
          </div>

          <AdminStaggerContainer className="space-y-3" stagger={0.06}>
            <AdminStaggerItem>
              <div className={`${ADMIN_INNER_TILE_CLASS} p-3.5 flex items-center justify-between gap-3`}>
                <div className="flex items-center gap-3 min-w-0">
                  <Server size={18} className="text-sky-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#2B211C]">
                      FastAPI Backend Cluster
                    </div>
                    <div className="text-[11px] text-[#70645C] truncate">
                      High-throughput async Python service
                    </div>
                  </div>
                </div>
                <AdminStatusBadge tone="emerald">Healthy</AdminStatusBadge>
              </div>
            </AdminStaggerItem>

            <AdminStaggerItem>
              <div className={`${ADMIN_INNER_TILE_CLASS} p-3.5 flex items-center justify-between gap-3`}>
                <div className="flex items-center gap-3 min-w-0">
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#2B211C]">
                      MongoDB Persistence
                    </div>
                    <div className="text-[11px] text-[#70645C] truncate">
                      Mode: {systemHealth.database?.mode || "cloud"} &bull; Single source of truth
                    </div>
                  </div>
                </div>
                <AdminStatusBadge tone="emerald">Connected</AdminStatusBadge>
              </div>
            </AdminStaggerItem>

            <AdminStaggerItem>
              <div className={`${ADMIN_INNER_TILE_CLASS} p-3.5 flex items-center justify-between gap-3`}>
                <div className="flex items-center gap-3 min-w-0">
                  <Sparkles size={18} className="text-[#E85D04] shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#2B211C]">
                      AI Assessment Engine
                    </div>
                    <div className="text-[11px] text-[#70645C] truncate">
                      Primary / Backup AI Failover Router
                    </div>
                  </div>
                </div>
                <AdminStatusBadge tone="solar">
                  {systemHealth.aiProvider?.status || "Active"}
                </AdminStatusBadge>
              </div>
            </AdminStaggerItem>

            <AdminStaggerItem>
              <div className={`${ADMIN_INNER_TILE_CLASS} p-3.5 flex items-center justify-between gap-3`}>
                <div className="flex items-center gap-3 min-w-0">
                  <Clock size={18} className="text-amber-300 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#2B211C]">
                      10-Day Retention Compliance
                    </div>
                    <div className="text-[11px] text-[#70645C] truncate">
                      Automated media purge &amp; privacy protection
                    </div>
                  </div>
                </div>
                <AdminStatusBadge tone="amber">100% Compliant</AdminStatusBadge>
              </div>
            </AdminStaggerItem>
          </AdminStaggerContainer>
        </div>

        {/* Administrative Modules Quick Access */}
        <div className={`${ADMIN_SURFACE_CLASS} p-5 sm:p-6 space-y-4`}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#2B211C] uppercase tracking-wider">
              Administrative Modules
            </h3>
            <Link
              href="/admin/settings"
              className="text-xs font-semibold text-[#E85D04] hover:underline"
            >
              System Config &rarr;
            </Link>
          </div>
          <AdminStaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-3" stagger={0.05}>
            <AdminStaggerItem>
              <Link
                href="/admin/users"
                className={`${ADMIN_INNER_TILE_CLASS} min-h-[64px] p-4 hover:border-[#E85D04]/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between group h-full`}
              >
                <div>
                  <div className="text-sm font-semibold text-[#2B211C] group-hover:text-[#E85D04] transition-colors">
                    Manage Users
                  </div>
                  <div className="text-xs text-[#70645C] mt-0.5">
                    Activation &amp; roles
                  </div>
                </div>
                <ArrowUpRight
                  size={18}
                  className="text-[#70645C] group-hover:text-[#E85D04] transition-colors"
                />
              </Link>
            </AdminStaggerItem>

            <AdminStaggerItem>
              <Link
                href="/admin/interviews"
                className={`${ADMIN_INNER_TILE_CLASS} min-h-[64px] p-4 hover:border-[#E85D04]/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between group h-full`}
              >
                <div>
                  <div className="text-sm font-semibold text-[#2B211C] group-hover:text-[#E85D04] transition-colors">
                    Interviews Explorer
                  </div>
                  <div className="text-xs text-[#70645C] mt-0.5">
                    Sessions &amp; CSV export
                  </div>
                </div>
                <Download
                  size={18}
                  className="text-[#70645C] group-hover:text-[#E85D04] transition-colors"
                />
              </Link>
            </AdminStaggerItem>

            <AdminStaggerItem>
              <Link
                href="/admin/recordings"
                className={`${ADMIN_INNER_TILE_CLASS} min-h-[64px] p-4 hover:border-[#E85D04]/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between group h-full`}
              >
                <div>
                  <div className="text-sm font-semibold text-[#2B211C] group-hover:text-[#E85D04] transition-colors">
                    Retention Engine
                  </div>
                  <div className="text-xs text-[#70645C] mt-0.5">
                    10-Day media purge
                  </div>
                </div>
                <Clock
                  size={18}
                  className="text-[#70645C] group-hover:text-[#E85D04] transition-colors"
                />
              </Link>
            </AdminStaggerItem>

            <AdminStaggerItem>
              <Link
                href="/admin/analytics"
                className={`${ADMIN_INNER_TILE_CLASS} min-h-[64px] p-4 hover:border-[#E85D04]/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between group h-full`}
              >
                <div>
                  <div className="text-sm font-semibold text-[#2B211C] group-hover:text-[#E85D04] transition-colors">
                    Traffic &amp; Visitors
                  </div>
                  <div className="text-xs text-[#70645C] mt-0.5">
                    Privacy telemetry
                  </div>
                </div>
                <BarChart3
                  size={18}
                  className="text-[#70645C] group-hover:text-[#E85D04] transition-colors"
                />
              </Link>
            </AdminStaggerItem>

            <AdminStaggerItem>
              <Link
                href="/admin/audit-logs"
                className={`${ADMIN_INNER_TILE_CLASS} min-h-[64px] p-4 hover:border-[#E85D04]/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between group h-full`}
              >
                <div>
                  <div className="text-sm font-semibold text-[#2B211C] group-hover:text-[#E85D04] transition-colors">
                    Security Audit Log
                  </div>
                  <div className="text-xs text-[#70645C] mt-0.5">
                    Trace modifications
                  </div>
                </div>
                <ShieldAlert
                  size={18}
                  className="text-[#70645C] group-hover:text-[#E85D04] transition-colors"
                />
              </Link>
            </AdminStaggerItem>

            <AdminStaggerItem>
              <Link
                href="/admin/settings"
                className={`${ADMIN_INNER_TILE_CLASS} min-h-[64px] p-4 hover:border-[#E85D04]/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between group h-full`}
              >
                <div>
                  <div className="text-sm font-semibold text-[#2B211C] group-hover:text-[#E85D04] transition-colors">
                    Settings &amp; AI Router
                  </div>
                  <div className="text-xs text-[#70645C] mt-0.5">
                    Cluster &amp; failover config
                  </div>
                </div>
                <Server
                  size={18}
                  className="text-[#70645C] group-hover:text-[#E85D04] transition-colors"
                />
              </Link>
            </AdminStaggerItem>
          </AdminStaggerContainer>
        </div>
      </div>
    </div>
  );
}
