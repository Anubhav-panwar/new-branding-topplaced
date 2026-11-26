"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  CreditCard,
  CheckCircle,
  Clock,
  Layers,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  Check,
} from "lucide-react";
import AnimatedProgressRing from "@/components/interview/AnimatedProgressRing";
import MetricCounter from "@/components/interview/MetricCounter";
import AIStatusBadge from "@/components/interview/AIStatusBadge";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type PurchasedPlan = {
  duration: number;
  price: number;
  purchasedAt: string | Date;
  remaining: number;
  status: "active" | "used" | "expired";
  orderId?: string;
};

type GroupedPlan = {
  key: string;
  duration: number;
  price: number;
  totalPurchases: number;
  availableInterviews: number;
  usedPurchases: number;
  lastPurchasedAt: string | Date;
  orderIds: string[];
};

export default function MyPlansPage() {
  const { token } = useSelector((state: RootState) => state.auth);
  const [plans, setPlans] = useState<PurchasedPlan[]>([]);
  const [summary, setSummary] = useState<{
    interviewCredits: number;
    freeInterviewsUsed: number;
    freeInterviewsLimit: number;
    hasPaidPlan: boolean;
    planType: string | null;
    planStartDate: string | null;
    planEndDate: string | null;
  }>({
    interviewCredits: 0,
    freeInterviewsUsed: 0,
    freeInterviewsLimit: 2,
    hasPaidPlan: false,
    planType: null,
    planStartDate: null,
    planEndDate: null,
  });

  useEffect(() => {
    const loadPlans = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/payments/plan`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) return;

        const data = await res.json();
        setPlans((data.purchasedPlans || []) as PurchasedPlan[]);
        setSummary({
          interviewCredits: data.interviewCredits || 0,
          freeInterviewsUsed: data.freeInterviewsUsed || 0,
          freeInterviewsLimit: data.freeInterviewsLimit ?? 2,
          hasPaidPlan: data.hasPaidPlan || false,
          planType: data.planType || null,
          planStartDate: data.planStartDate || null,
          planEndDate: data.planEndDate || null,
        });
      } catch (e) {
        // quiet error handle
      }
    };

    loadPlans();
  }, [token]);

  // Group same plans into clean cards
  const groupedPlans = useMemo<GroupedPlan[]>(() => {
    const map = new Map<string, GroupedPlan>();

    for (const p of plans) {
      const key = `${p.duration}-${p.price}`;
      const existing = map.get(key) || {
        key,
        duration: p.duration,
        price: p.price,
        totalPurchases: 0,
        availableInterviews: 0,
        usedPurchases: 0,
        lastPurchasedAt: p.purchasedAt,
        orderIds: [],
      };

      existing.totalPurchases += 1;
      const rem = typeof p.remaining === "number" ? p.remaining : 0;
      existing.availableInterviews += rem;

      if (p.status !== "expired" && (rem === 0 || p.status === "used")) {
        existing.usedPurchases += 1;
      }

      const curr = new Date(p.purchasedAt);
      const prev = new Date(existing.lastPurchasedAt);
      if (curr > prev) existing.lastPurchasedAt = p.purchasedAt;

      if (p.orderId) existing.orderIds.push(p.orderId);
      map.set(key, existing);
    }

    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.lastPurchasedAt).getTime() - new Date(a.lastPurchasedAt).getTime()
    );
  }, [plans]);

  // Calculate total, used, remaining
  const totalCredits = summary.hasPaidPlan
    ? 100
    : Math.max(summary.freeInterviewsLimit, summary.interviewCredits + summary.freeInterviewsUsed);
  const usedCredits = summary.hasPaidPlan ? 0 : summary.freeInterviewsUsed;
  const remainingCredits = summary.hasPaidPlan
    ? 100
    : Math.max(0, summary.interviewCredits || totalCredits - usedCredits);
  const creditPercent =
    totalCredits > 0 ? Math.round((remainingCredits / totalCredits) * 100) : 0;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#FFFCF8] text-[#2B211C] flex flex-col font-sans selection:bg-[#FFF0E6] selection:text-[#E85D04]">
        <Navbar />
        <Sidebar userType="learner" />

        <main className="md:ml-64 ml-0 pt-6 pb-24 md:pb-16 flex-1 px-4 sm:px-6 lg:px-10 max-w-none min-w-0 page-enter">
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E8D9CC] pb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AIStatusBadge status="online" label="Active Subscription & Credits" size="sm" />
              </div>
              <h1 className="font-serif-display text-3xl sm:text-4xl font-normal text-[#2B211C] tracking-tight">
                Subscription &amp; Session Allocations
              </h1>
              <p className="text-xs sm:text-sm text-[#70645C] mt-1">
                Overview of active session credits, subscription entitlements, and transaction audits.
              </p>
            </div>

            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#E85D04] hover:bg-[#E85D04] text-white shadow-xs transition-all self-start sm:self-auto cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04]"
            >
              <span>View Pricing Plans</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Current Plan Hero Card with Animated Credit Ring */}
          <section className="mb-10 bg-[#FFFFFF] p-6 sm:p-8 rounded-2xl border border-[#E8D9CC] shadow-xs relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
              <div className="space-y-4 max-w-md">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF0E6] border border-[#E8D9CC] text-[#E85D04] text-xs font-mono font-bold uppercase tracking-wider">
                  <Sparkles size={13} />
                  <span>Active Entitlement Tier</span>
                </div>

                <div>
                  <h2 className="font-serif-display text-3xl sm:text-4xl font-normal text-[#2B211C] tracking-tight">
                    {summary.hasPaidPlan ? "PROFESSIONAL CANDIDATE" : summary.planType || "STARTER CANDIDATE"}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#70645C] mt-1 leading-relaxed">
                    Full conversational duplex simulation, adaptive cross-examination, and automated proctoring verification.
                  </p>
                </div>

                {/* Scan-friendly metrics row */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="bg-[#FFFCF8] p-3 rounded-xl border border-[#E8D9CC]">
                    <span className="text-[10px] uppercase font-mono text-[#70645C] font-semibold block">Total Granted</span>
                    <span className="text-lg font-bold text-[#2B211C] font-mono">
                      <MetricCounter value={totalCredits} />
                    </span>
                  </div>

                  <div className="bg-[#FFFCF8] p-3 rounded-xl border border-[#E8D9CC]">
                    <span className="text-[10px] uppercase font-mono text-[#70645C] font-semibold block">Utilized</span>
                    <span className="text-lg font-bold text-[#70645C] font-mono">
                      <MetricCounter value={usedCredits} />
                    </span>
                  </div>

                  {/* Clean Light Beige Available Balance Card (High Contrast) */}
                  <div className="bg-[#FFF0E6] p-3 rounded-xl border border-[#E8D9CC] shadow-xs">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                      <span className="text-[10px] uppercase font-mono text-[#E85D04] font-bold block">Available</span>
                    </div>
                    <span className="text-lg font-bold text-[#2B211C] font-mono">
                      <MetricCounter value={remainingCredits} />
                    </span>
                  </div>
                </div>
              </div>

              {/* Animated Credit Ring with High-Contrast Track and Indicator */}
              <div className="flex flex-col items-center justify-center">
                <AnimatedProgressRing
                  value={creditPercent}
                  size={150}
                  strokeWidth={10}
                  color="#E85D04"
                  trackColor="#FFF0E6"
                >
                  <div className="text-center">
                    <span className="text-2xl font-bold font-mono text-[#2B211C] block">
                      <MetricCounter value={remainingCredits} />
                    </span>
                    <span className="text-[11px] uppercase font-mono font-semibold tracking-wider text-[#70645C] block mt-0.5">
                      Available Balance
                    </span>
                  </div>
                </AnimatedProgressRing>
                <div className="inline-flex items-center gap-1.5 text-xs text-[#E85D04] font-semibold mt-3 font-mono bg-[#FFF0E6] px-2.5 py-0.5 rounded-full border border-[#E8D9CC]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                  <span>{creditPercent}% Capacity Ready</span>
                </div>
              </div>
            </div>
          </section>

          {/* Purchased Plans List */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-[#E85D04]" />
              <h3 className="text-base font-bold text-[#2B211C]">Transaction &amp; Credit Pack History</h3>
            </div>

            {groupedPlans.length === 0 ? (
              <div className="bg-[#FFFFFF] p-8 rounded-2xl border border-dashed border-[#E8D9CC] text-center shadow-xs">
                <CreditCard size={32} className="text-[#70645C] mx-auto mb-2 opacity-60" />
                <h4 className="text-sm font-semibold text-[#2B211C] mb-1">No Custom Add-On Packages</h4>
                <p className="text-xs text-[#70645C] max-w-sm mx-auto mb-4 leading-relaxed">
                  Complimentary trial sessions are active. Acquire additional session packs to access in-depth architectural and executive simulations.
                </p>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#FFFCF8] text-[#2B211C] border border-[#E8D9CC] hover:border-[#E85D04] hover:text-[#E85D04] transition-colors shadow-xs"
                >
                  Explore Session Packages
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {groupedPlans.map((g) => (
                  <div
                    key={g.key}
                    className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#E8D9CC] shadow-xs hover:border-[#E85D04] transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <div className="text-base font-semibold text-[#2B211C]">
                          {g.duration} Minutes Evaluation Session
                        </div>
                        <div className="text-xs text-[#70645C] mt-0.5">
                          ₹{g.price} • Last allocated {new Date(g.lastPurchasedAt).toLocaleDateString()}
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 font-semibold ${
                          g.availableInterviews > 0
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-[#FFF0E6] text-[#70645C] border-[#E8D9CC]"
                        }`}
                      >
                        {g.availableInterviews > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                        {g.availableInterviews > 0 ? "Active Balance" : "Exhausted"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#E8D9CC]">
                      <div className="p-2.5 rounded-xl bg-[#FFF0E6] border border-[#E8D9CC]">
                        <span className="text-[10px] uppercase font-mono text-[#E85D04] font-bold block">Available</span>
                        <span className="text-sm font-bold font-mono text-[#2B211C]">
                          {g.availableInterviews}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#FFFCF8] border border-[#E8D9CC]">
                        <span className="text-[10px] uppercase font-mono text-[#70645C] font-semibold block">Utilized</span>
                        <span className="text-sm font-bold font-mono text-[#70645C]">
                          {g.usedPurchases}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}
