"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  Zap,
  Crown,
  Sparkles,
  ShieldCheck,
  Clock,
  ArrowRight,
  Target,
  BarChart3,
  Users,
  Shield,
  Star,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import PaymentModal from "@/components/PaymentModal";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [currency, setCurrency] = useState<"USD" | "INR">("USD");
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    plan: any;
  }>({ isOpen: false, plan: null });

  const handlePlanSelect = (plan: any) => {
    if (plan.price === 0) {
      if (typeof window !== "undefined") {
        window.location.href = "/register";
      }
      return;
    }

    const price = currency === "USD" ? plan.priceUSD : plan.priceINR;
    const planData = {
      name: `${plan.name} (${billingCycle})`,
      price: billingCycle === "yearly" ? Math.round(price * 12 * 0.8) : price,
      billingCycle: billingCycle,
      features: plan.features,
      orderType: "subscription" as const,
    };
    setPaymentModal({ isOpen: true, plan: planData });
  };

  const handleInterviewPurchase = (interview: any) => {
    const planData = {
      name: interview.name,
      price: interview.price,
      features: interview.features,
      orderType: "credits" as const,
      creditPackage: `${interview.duration}min_interview`,
      duration: interview.duration,
    };
    setPaymentModal({ isOpen: true, plan: planData });
  };

  const handleCreditPackPurchase = (pack: any) => {
    const planData = {
      name: pack.name,
      price: pack.price,
      features: [
        `${pack.credits} interview credits`,
        `${pack.duration}-minute interviews`,
        `Save ₹${pack.savings}`,
      ],
      orderType: "credits" as const,
      creditPackage: `${pack.type}_pack_${pack.credits}`,
      duration: pack.duration,
    };
    setPaymentModal({ isOpen: true, plan: planData });
  };

  const handlePaymentSuccess = () => {
    alert("Payment successful! Your plan or credits have been activated.");
  };

  const mainPlans = [
    {
      name: "Free",
      description: "Get started with essential interview practice.",
      priceUSD: 0,
      priceINR: 0,
      popular: false,
      cta: "Get Started",
      ctaLink: "/register",
      features: [
        "3 AI interview sessions",
        "Basic feedback & tips",
        "Access to common interview questions",
        "Core interview roles",
        "Standard transcript review",
      ],
    },
    {
      name: "Pay as you go",
      subtitleBadge: "Most Popular",
      description: "More practice, deeper insights, better results.",
      priceUSD: billingCycle === "monthly" ? 9 : 7,
      priceINR: billingCycle === "monthly" ? 749 : 599,
      popular: true,
      cta: "Get Started",
      features: [
        "Unlimited AI interview sessions",
        "Detailed AI feedback & scoring",
        "Role-based interview preparation",
        "Performance history & insights",
        "STAR rubric breakdown",
        "Weakest-moment timestamp analysis",
        "Priority AI model latency",
      ],
    },
    {
      name: "Enterprise",
      description: "For teams, universities and organizations.",
      priceUSD: billingCycle === "monthly" ? 20 : 16,
      priceINR: billingCycle === "monthly" ? 1699 : 1359,
      popular: false,
      cta: "Get Started",
      features: [
        "Everything in Pay as you go",
        "Team management & reporting",
        "Custom interview scenarios",
        "Dedicated support",
        "Custom university & company rubrics",
        "Batch candidate invitations & LMS sync",
      ],
    },
  ];

  const sessionCredits = [
    {
      name: "30 Min Interview",
      price: 39,
      duration: 30,
      icon: Target,
      description: "Quick focused interview practice",
      popular: false,
      features: [
        "30-minute AI voice interview session",
        "Instant STAR score breakdown",
        "Indian company-specific rubrics",
        "Coached answer suggestions",
      ],
    },
    {
      name: "45 Min Interview",
      price: 49,
      duration: 45,
      icon: Zap,
      description: "Full in-depth technical / case round",
      popular: true,
      features: [
        "45-minute AI voice interview session",
        "Detailed STAR rubric analysis",
        "Deep follow-up questions & probes",
        "Shareable verified score certificate",
      ],
    },
    {
      name: "60 Min Interview",
      price: 59,
      duration: 60,
      icon: Crown,
      description: "Comprehensive multi-phase round",
      popular: false,
      features: [
        "60-minute complete AI interview",
        "System architecture & coding review",
        "Competency benchmark matrix",
        "Priority AI model response latency",
      ],
    },
    {
      name: "90 Min Executive",
      price: 69,
      duration: 90,
      icon: Sparkles,
      description: "Leadership & multi-interviewer panel",
      popular: false,
      features: [
        "90-minute panel simulation",
        "Cross-functional & behavioral evaluation",
        "Salary negotiation rehearsal",
        "Executive-grade performance diagnostic",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF5EF] text-[#2B211C] font-sans selection:bg-[#FFF0E6] selection:text-[#E85D04] overflow-x-hidden">
      <Navbar />

      {/* Main Section with Top Curved Ambience */}
      <div className="relative pt-12 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Ambient Top Glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-gradient-to-b from-[#FEE8D6]/80 via-[#FCE3CF]/40 to-transparent blur-3xl opacity-80" />

        {/* Section Header */}
        <div className="relative z-10 text-center max-w-3xl mx-auto mb-12">
          {/* Badge matching reference */}
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#FFF0E6] border border-[#E8D9CC] text-[#E85D04] text-[11px] font-mono font-bold uppercase tracking-wider mb-4 shadow-xs">
            <span>✦ Simple & Transparent Pricing</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#2B211C] leading-[1.15] tracking-tight">
            Choose the Right Plan for Your Career
          </h1>

          <p className="mt-3 text-sm sm:text-base text-[#70645C] max-w-2xl mx-auto leading-relaxed">
            Get access to AI interview practice, detailed feedback and job-ready preparation tools.
          </p>

          {/* Monthly / Yearly Billing Toggle */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center p-1 rounded-full bg-white border border-[#E8D9CC] shadow-xs">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  billingCycle === "monthly"
                    ? "bg-[#E85D04] text-white shadow-xs"
                    : "text-[#70645C] hover:text-[#2B211C]"
                }`}
              >
                Monthly
              </button>

              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  billingCycle === "yearly"
                    ? "bg-[#E85D04] text-white shadow-xs"
                    : "text-[#70645C] hover:text-[#2B211C]"
                }`}
              >
                <span>Yearly</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    billingCycle === "yearly"
                      ? "bg-white/20 text-white"
                      : "bg-[#FFF0E6] text-[#E85D04]"
                  }`}
                >
                  Save up to 20%
                </span>
              </button>
            </div>

            {/* Currency selector toggle */}
            <div className="inline-flex items-center p-1 rounded-full bg-white border border-[#E8D9CC] text-xs font-semibold shadow-xs">
              <button
                type="button"
                onClick={() => setCurrency("USD")}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                  currency === "USD"
                    ? "bg-[#2B211C] text-white"
                    : "text-[#70645C] hover:text-[#2B211C]"
                }`}
              >
                USD ($)
              </button>
              <button
                type="button"
                onClick={() => setCurrency("INR")}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                  currency === "INR"
                    ? "bg-[#2B211C] text-white"
                    : "text-[#70645C] hover:text-[#2B211C]"
                }`}
              >
                INR (₹)
              </button>
            </div>
          </div>
        </div>

        {/* 3 Main Pricing Cards Grid matching design reference */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch mb-16">
          {mainPlans.map((plan, idx) => {
            const isPro = plan.popular;
            const price = currency === "USD" ? plan.priceUSD : plan.priceINR;
            const currencySymbol = currency === "USD" ? "$" : "₹";

            return (
              <div
                key={idx}
                className={`rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 relative ${
                  isPro
                    ? "bg-gradient-to-b from-[#2E180C] via-[#381E0E] to-[#1E110A] text-white border-2 border-[#E85D04] shadow-[0_20px_40px_-5px_rgba(232,93,4,0.35)] transform md:-translate-y-2"
                    : "bg-white text-[#2B211C] border border-[#EEDFD2] shadow-[0_10px_30px_rgba(43,33,28,0.04)] hover:shadow-md"
                }`}
              >
                {/* Most Popular Badge on Pro Card */}
                {isPro && (
                  <div className="absolute top-4 right-5">
                    <span className="bg-[#E85D04] text-white px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm font-mono flex items-center gap-1.5">
                      <Crown className="h-3 w-3" />
                      <span>Most Popular</span>
                    </span>
                  </div>
                )}

                <div>
                  <h3
                    className={`font-display text-2xl font-extrabold tracking-tight ${
                      isPro ? "text-white" : "text-[#2B211C]"
                    }`}
                  >
                    {plan.name}
                  </h3>

                  <p
                    className={`mt-1.5 text-xs sm:text-sm min-h-[36px] leading-relaxed ${
                      isPro ? "text-white/70" : "text-[#70645C]"
                    }`}
                  >
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="mt-5 pb-6 border-b border-[#E8D9CC]/30 flex items-baseline gap-1">
                    <span
                      className={`text-4xl sm:text-5xl font-display font-black tracking-tight ${
                        isPro ? "text-white" : "text-[#2B211C]"
                      }`}
                    >
                      {currencySymbol}
                      {price}
                    </span>
                    <span
                      className={`text-xs font-mono ${
                        isPro ? "text-white/60" : "text-[#70645C]"
                      }`}
                    >
                      /month
                    </span>
                  </div>

                  {/* Feature List */}
                  <div className="mt-6 space-y-3">
                    {plan.features.map((feature, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-3">
                        <Check
                          className={`h-4 w-4 shrink-0 mt-0.5 stroke-[3] ${
                            isPro ? "text-[#FF8C38]" : "text-[#E85D04]"
                          }`}
                        />
                        <span
                          className={`text-xs sm:text-sm leading-relaxed ${
                            isPro ? "text-white/85" : "text-[#554A43]"
                          }`}
                        >
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Button */}
                <div className="mt-8 pt-4">
                  <button
                    type="button"
                    onClick={() => handlePlanSelect(plan)}
                    className={`w-full h-12 rounded-xl sm:rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isPro
                        ? "bg-gradient-to-r from-[#E85D04] via-[#F26A10] to-[#D94E00] hover:from-[#D95200] hover:to-[#B94308] text-white shadow-[0_8px_20px_-3px_rgba(232,93,4,0.5)] hover:shadow-[0_12px_24px_-3px_rgba(232,93,4,0.6)] active:scale-[0.99]"
                        : "border border-[#E8D9CC] bg-[#FFFDFC] hover:bg-[#E85D04] text-[#2B211C] hover:text-white hover:border-[#E85D04] shadow-2xs"
                    }`}
                  >
                    <span>{plan.cta}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Trust Indicators Bar matching reference image */}
        <div className="relative z-10 rounded-2xl bg-white border border-[#EEDFD2] p-6 shadow-sm mb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="flex items-center justify-center gap-2.5 text-xs sm:text-sm font-semibold text-[#2B211C]">
              <ShieldCheck className="h-5 w-5 text-[#E85D04]" />
              <span>Secure & Private</span>
            </div>

            <div className="flex items-center justify-center gap-2.5 text-xs sm:text-sm font-semibold text-[#2B211C]">
              <Zap className="h-5 w-5 text-[#E85D04]" />
              <span>AI-Powered Practice</span>
            </div>

            <div className="flex items-center justify-center gap-2.5 text-xs sm:text-sm font-semibold text-[#2B211C]">
              <BarChart3 className="h-5 w-5 text-[#E85D04]" />
              <span>Real Feedback</span>
            </div>

            <div className="flex items-center justify-center gap-2.5 text-xs sm:text-sm font-semibold text-[#2B211C]">
              <Users className="h-5 w-5 text-[#E85D04]" />
              <span>Trusted by Professionals</span>
            </div>
          </div>
        </div>

        {/* Section 2: Pay-As-You-Go Single Session Credits & Sprint Packs */}
        <div className="relative z-10 mt-16 pt-12 border-t border-[#E8D9CC]">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#2B211C] tracking-tight">
              Pay-As-You-Go Single Sessions
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#70645C]">
              Need individual interview credits with zero recurring commitment? Credits never expire.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {sessionCredits.map((session, sIdx) => {
              const IconComp = session.icon;
              return (
                <div
                  key={sIdx}
                  className={`rounded-2xl p-6 bg-white border flex flex-col justify-between shadow-xs transition-all ${
                    session.popular
                      ? "border-2 border-[#E85D04] shadow-md shadow-[#E85D04]/10"
                      : "border-[#E8D9CC] hover:border-[#E85D04]/60"
                  }`}
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-[#FFF0E6] border border-[#E8D9CC] flex items-center justify-center mb-4 text-[#E85D04]">
                      <IconComp className="h-5 w-5" />
                    </div>

                    <h3 className="font-display text-base font-bold text-[#2B211C]">
                      {session.name}
                    </h3>

                    <p className="text-xs text-[#70645C] mt-1 mb-4 min-h-[32px]">
                      {session.description}
                    </p>

                    <div className="mb-4 pb-3 border-b border-[#E8D9CC]">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl sm:text-3xl font-black text-[#2B211C]">
                          ₹{session.price}
                        </span>
                        <span className="text-xs text-[#70645C]">/session</span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-6 text-xs text-[#70645C]">
                      {session.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-2">
                          <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleInterviewPurchase(session)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      session.popular
                        ? "bg-[#E85D04] text-white hover:bg-[#D95200] shadow-sm"
                        : "bg-[#FFFDFC] hover:bg-[#E85D04] text-[#2B211C] hover:text-white border border-[#E8D9CC]"
                    }`}
                  >
                    <span>Buy 1 Session · ₹{session.price}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Payment Modal for Razorpay Checkout */}
      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal({ isOpen: false, plan: null })}
        plan={paymentModal.plan}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
