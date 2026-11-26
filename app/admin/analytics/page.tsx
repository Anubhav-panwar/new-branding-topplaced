"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BarChart3,
  Eye,
  Users,
  TrendingUp,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { adminFetch } from "@/lib/adminApi";
import {
  ADMIN_ICON_BTN,
  ADMIN_SURFACE_CLASS,
  ADMIN_SURFACE_HOVER_CLASS,
  ADMIN_TBODY,
  AdminPageHeader,
  AdminAnimatedCounter,
  AdminStaggerContainer,
  AdminStaggerItem,
  REDSUN_OUT_EXPO,
} from "@/components/admin/AdminRedSunUI";
import { DashboardPageTransition } from "@/components/ui/DashboardMotion";

export default function AnalyticsDashboardPage() {
  const [days, setDays] = useState(30);
  const [overview, setOverview] = useState<any>(null);
  const [traffic, setTraffic] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prefersReduced = useReducedMotion();

  const fetchAnalytics = async (rangeDays: number) => {
    try {
      setError(null);
      const [overviewRes, trafficRes] = await Promise.all([
        adminFetch(`/api/admin/analytics/overview?days=${rangeDays}`),
        adminFetch(`/api/admin/analytics/traffic?days=${rangeDays}`),
      ]);

      if (overviewRes && overviewRes.success) setOverview(overviewRes.analytics || {});
      if (trafficRes && trafficRes.success) {
        setTraffic(Array.isArray(trafficRes.traffic) ? trafficRes.traffic : []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load analytics");
      setTraffic([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(days);
  }, [days]);

  const safeTraffic = Array.isArray(traffic) ? traffic : [];
  const maxTrafficVal = Math.max(
    ...(safeTraffic.length > 0
      ? safeTraffic.map((t) => Math.max(t?.pageViews || 0, t?.uniqueVisitors || 0, 1))
      : [1]),
    5
  );

  return (
    <DashboardPageTransition className="space-y-6">
      <AdminPageHeader
        title="Privacy-First Website"
        highlight="Analytics"
        subtitle="Telemetry aggregated using anonymized daily visitor hashing with zero PII or credentials recorded."
        actions={
          <>
            <div className="flex items-center bg-[#FFFCF8] border border-[#E8D9CC] rounded-xl p-1 text-xs">
              {[7, 14, 30, 90].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={`min-h-[36px] px-3 py-1.5 rounded-lg font-mono font-semibold transition-all cursor-pointer ${
                    days === d
                      ? "bg-[#E85D04] text-white shadow-[0_0_18px_rgba(242,106,10,0.35)]"
                      : "text-[#70645C] hover:text-[#2B211C]"
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setRefreshing(true);
                fetchAnalytics(days);
              }}
              aria-label="Refresh analytics"
              title="Refresh analytics"
              className={ADMIN_ICON_BTN}
            >
              <RefreshCw
                size={15}
                className={refreshing ? "animate-spin text-[#E85D04]" : ""}
              />
            </button>
          </>
        }
      />

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
          <AlertTriangle size={18} className="shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Overview Stat Cards with Stagger & Counters */}
      <AdminStaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStaggerItem>
          <div className={`${ADMIN_SURFACE_HOVER_CLASS} p-5 h-full flex flex-col justify-between`}>
            <div>
              <div className="flex items-center justify-between text-[#70645C] mb-2">
                <span className="text-[11px] uppercase tracking-wider font-semibold">
                  Total Page Views
                </span>
                <Eye size={18} className="text-[#E85D04]" />
              </div>
              <div className="text-3xl font-extrabold text-[#2B211C] font-mono">
                <AdminAnimatedCounter value={overview?.totalPageViews ?? 0} />
              </div>
            </div>
            <div className="text-xs text-[#70645C] mt-2">
              In selected {days}-day window
            </div>
          </div>
        </AdminStaggerItem>

        <AdminStaggerItem>
          <div className={`${ADMIN_SURFACE_HOVER_CLASS} p-5 h-full flex flex-col justify-between`}>
            <div>
              <div className="flex items-center justify-between text-[#70645C] mb-2">
                <span className="text-[11px] uppercase tracking-wider font-semibold">
                  Unique Visitors
                </span>
                <Users size={18} className="text-sky-400" />
              </div>
              <div className="text-3xl font-extrabold text-[#2B211C] font-mono">
                <AdminAnimatedCounter value={overview?.uniqueVisitors ?? 0} />
              </div>
            </div>
            <div className="text-xs text-[#70645C] mt-2">
              Daily rotating SHA-256 hashed
            </div>
          </div>
        </AdminStaggerItem>

        <AdminStaggerItem>
          <div className={`${ADMIN_SURFACE_HOVER_CLASS} p-5 h-full flex flex-col justify-between`}>
            <div>
              <div className="flex items-center justify-between text-[#70645C] mb-2">
                <span className="text-[11px] uppercase tracking-wider font-semibold">
                  Pages / Visitor
                </span>
                <TrendingUp size={18} className="text-[#E85D04]" />
              </div>
              <div className="text-3xl font-extrabold text-[#2B211C] font-mono">
                <AdminAnimatedCounter
                  value={Number(overview?.avgViewsPerVisitor) || 1.0}
                  decimals={1}
                />
              </div>
            </div>
            <div className="text-xs text-[#70645C] mt-2">Engagement depth</div>
          </div>
        </AdminStaggerItem>

        <AdminStaggerItem>
          <div className={`${ADMIN_SURFACE_HOVER_CLASS} p-5 h-full flex flex-col justify-between`}>
            <div>
              <div className="flex items-center justify-between text-[#70645C] mb-2">
                <span className="text-[11px] uppercase tracking-wider font-semibold">
                  Conversions
                </span>
                <ShieldCheck size={18} className="text-emerald-400" />
              </div>
              <div className="text-3xl font-extrabold text-[#2B211C] font-mono">
                <AdminAnimatedCounter value={overview?.conversions ?? 0} />
              </div>
            </div>
            <div className="text-xs text-[#70645C] mt-2">
              Completed setups &amp; signups
            </div>
          </div>
        </AdminStaggerItem>
      </AdminStaggerContainer>

      {/* Traffic Trend Chart */}
      <div className={`${ADMIN_SURFACE_CLASS} p-5 sm:p-6`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-[#2B211C] flex items-center gap-2">
              <BarChart3 size={18} className="text-[#E85D04]" />
              <span>Visitor Traffic &amp; Page Views Over Time</span>
            </h2>
            <p className="text-xs text-[#70645C] mt-0.5">
              Daily comparison between unique visitors and total page views.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#E85D04]" />
              <span className="text-[#70645C]">Page Views</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-sky-400" />
              <span className="text-[#70645C]">Unique Visitors</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[400px] h-64 flex items-end gap-1.5 sm:gap-2 pt-8 pb-2 border-b border-[#E8D9CC]">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-[#70645C]">
                Loading traffic timeseries...
              </div>
            ) : safeTraffic.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-[#70645C]">
                No traffic recorded in this window.
              </div>
            ) : (
              safeTraffic.map((point, idx) => {
                const pvHeight = Math.max(
                  3,
                  Math.round(((point.pageViews || 0) / maxTrafficVal) * 100)
                );
                const uvHeight = Math.max(
                  3,
                  Math.round(
                    ((point.uniqueVisitors || 0) / maxTrafficVal) * 100
                  )
                );

                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center h-full justify-end group relative"
                  >
                    <div className="absolute -top-2 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                      <div className="bg-[#FFFCF8] border border-[#E8D9CC] text-[11px] rounded-xl p-2 shadow-2xl whitespace-nowrap text-[#2B211C] font-mono">
                        <div className="font-bold">{point.date}</div>
                        <div className="text-[#E85D04]">Views: {point.pageViews}</div>
                        <div className="text-sky-300">
                          Visitors: {point.uniqueVisitors}
                        </div>
                      </div>
                    </div>

                    <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-full">
                      <motion.div
                        initial={prefersReduced ? false : { height: "0%" }}
                        animate={{ height: `${point.pageViews ? pvHeight : 2}%` }}
                        transition={{
                          duration: 0.6,
                          delay: idx * 0.015,
                          ease: REDSUN_OUT_EXPO,
                        }}
                        className="w-1.5 sm:w-3 rounded-t bg-[#E85D04]/85 hover:bg-[#E85D04] transition-colors"
                      />
                      <motion.div
                        initial={prefersReduced ? false : { height: "0%" }}
                        animate={{
                          height: `${point.uniqueVisitors ? uvHeight : 2}%`,
                        }}
                        transition={{
                          duration: 0.6,
                          delay: idx * 0.015 + 0.03,
                          ease: REDSUN_OUT_EXPO,
                        }}
                        className="w-1.5 sm:w-3 rounded-t bg-sky-400/80 hover:bg-sky-300 transition-colors"
                      />
                    </div>

                    <span className="text-[10px] font-mono text-[#70645C] mt-2 truncate max-w-full">
                      {idx % Math.max(1, Math.ceil(safeTraffic.length / 8)) === 0
                        ? point.date.slice(5)
                        : ""}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Two Column Grid: Top Visited Pages & Devices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${ADMIN_SURFACE_CLASS} p-5 sm:p-6 space-y-4`}>
          <h3 className="text-xs font-bold text-[#2B211C] uppercase tracking-wider flex items-center gap-2">
            <Globe size={16} className="text-[#E85D04]" />
            <span>Top Visited Pages</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#70645C]">
              <thead className="text-[11px] uppercase tracking-wider text-[#70645C] border-b border-[#E8D9CC]">
                <tr>
                  <th className="py-2.5 font-semibold">Route</th>
                  <th className="py-2.5 font-semibold text-right">Views</th>
                  <th className="py-2.5 font-semibold text-right">Visitors</th>
                </tr>
              </thead>
              <tbody className={ADMIN_TBODY}>
                {overview?.topPages && overview.topPages.length > 0 ? (
                  overview.topPages.map((p: any, i: number) => (
                    <tr key={i} className="hover:bg-[#FFFCF8] transition-colors">
                      <td className="py-2.5 font-mono text-[#2B211C] truncate max-w-[200px]">
                        {p.path}
                      </td>
                      <td className="py-2.5 text-right font-semibold text-[#E85D04] font-mono">
                        {p.views}
                      </td>
                      <td className="py-2.5 text-right text-[#70645C] font-mono">
                        {p.uniqueVisitors}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="py-6 text-center text-[#70645C]"
                    >
                      No page view telemetry recorded in this range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className={`${ADMIN_SURFACE_CLASS} p-5 sm:p-6 space-y-4`}>
          <h3 className="text-xs font-bold text-[#2B211C] uppercase tracking-wider flex items-center gap-2">
            <Monitor size={16} className="text-[#E85D04]" />
            <span>Device Breakdown</span>
          </h3>

          <div className="space-y-4 pt-2">
            {[
              {
                label: "Desktop",
                count: overview?.devices?.desktop ?? 0,
                icon: Monitor,
                color: "bg-[#E85D04]",
              },
              {
                label: "Mobile",
                count: overview?.devices?.mobile ?? 0,
                icon: Smartphone,
                color: "bg-sky-400",
              },
              {
                label: "Tablet",
                count: overview?.devices?.tablet ?? 0,
                icon: Tablet,
                color: "bg-emerald-400",
              },
            ].map((device) => {
              const totalDevices =
                (overview?.devices?.desktop || 0) +
                  (overview?.devices?.mobile || 0) +
                  (overview?.devices?.tablet || 0) || 1;
              const pct = Math.round((device.count / totalDevices) * 100);
              const IconComp = device.icon;

              return (
                <div key={device.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-[#2B211C]">
                      <IconComp size={15} className="text-[#70645C]" />
                      <span className="font-semibold">{device.label}</span>
                    </div>
                    <div className="text-[#70645C] font-mono">
                      <span className="font-bold text-[#2B211C]">
                        {device.count}
                      </span>{" "}
                      ({pct}%)
                    </div>
                  </div>
                  <div className="w-full bg-[#FFFCF8] border border-[#E8D9CC] h-2 rounded-full overflow-hidden">
                    <motion.div
                      initial={prefersReduced ? false : { width: "0%" }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: REDSUN_OUT_EXPO }}
                      className={`h-full rounded-full ${device.color}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardPageTransition>
  );
}
