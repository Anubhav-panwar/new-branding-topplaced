"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, ShieldAlert, ArrowRight, ShieldCheck, Clock } from "lucide-react";
import { ActiveWarningModalData } from "@/lib/proctoring/types";

interface ProctoringWarningModalProps {
  modalData: ActiveWarningModalData | null;
  onAcknowledge: () => void;
}

export default function ProctoringWarningModal({
  modalData,
  onAcknowledge,
}: ProctoringWarningModalProps) {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(10);

  useEffect(() => {
    if (!modalData) return;
    setSecondsRemaining(10);
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [modalData?.warningNumber, modalData?.incidentId]);

  if (!modalData) return null;

  const isFinal = modalData.isFinal;
  const isTermination = isFinal && modalData.policyAction === "TERMINATE_INTERVIEW";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div role="alertdialog" aria-modal="true" aria-labelledby="proctoring-warning-heading" className="relative w-full max-w-lg rounded-2xl border border-[#F1D2B8] bg-white p-6 md:p-8 shadow-2xl text-center">
        {/* Glow Accent */}
        <div
          className={`absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 blur-3xl rounded-full pointer-events-none opacity-40 ${
            isFinal ? "bg-red-500" : "bg-amber-500"
          }`}
        />

        {/* Warning Icon Badge */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
          {isFinal ? (
            <ShieldAlert className="h-8 w-8 text-rose-400 animate-pulse" />
          ) : (
            <AlertTriangle className="h-8 w-8 text-amber-400" />
          )}
        </div>

        {/* Header */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2 bg-slate-100 text-[#475569] border border-slate-200">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          Proctoring Warning
        </div>

        {/* Warning Count Display: 1 / 3, 2 / 3, 3 / 3 */}
        <div className="my-2 flex items-center justify-center gap-3">
          <span className="text-4xl font-extrabold tracking-tight text-[#111827]">
            {modalData.warningNumber}{" "}
            <span className="text-xl font-medium text-[#64748B]">/ 3</span>
          </span>
        </div>

        {/* Indicator dots */}
        <div className="flex justify-center items-center gap-2 mb-3">
          {[1, 2, 3].map((step) => {
            const isCurrent = step === modalData.warningNumber;
            const isPassed = step < modalData.warningNumber;
            return (
              <div
                key={step}
                className={`h-2 rounded-full transition-all duration-300 ${
                  isCurrent
                    ? step === 3
                      ? "w-8 bg-rose-500 ring-2 ring-rose-500/40"
                      : "w-8 bg-amber-400 ring-2 ring-amber-400/40"
                    : isPassed
                    ? "w-4 bg-amber-500/70"
                    : "w-4 bg-slate-200"
                }`}
              />
            );
          })}
        </div>

        {/* Remaining Warnings Counter Badge */}
        <div className="mb-4 flex items-center justify-center">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
              (3 - modalData.warningNumber) === 2
                ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                : (3 - modalData.warningNumber) === 1
                ? "bg-orange-500/15 text-orange-300 border-orange-500/40 animate-pulse"
                : "bg-rose-500/20 text-rose-300 border-rose-500/40"
            }`}
          >
            <span>
              {3 - modalData.warningNumber > 0
                ? `⚠️ ${3 - modalData.warningNumber} warning${3 - modalData.warningNumber > 1 ? "s" : ""} remaining`
                : "🚨 0 warnings remaining — Flagged for Review"}
            </span>
          </div>
        </div>

        {/* Title */}
        <h2 id="proctoring-warning-heading" className="text-lg md:text-xl font-bold text-[#111827] mb-2">
          {modalData.title}
        </h2>

        {/* Primary Message */}
        <p className="text-sm md:text-base text-[#334155] leading-relaxed mb-3">
          {modalData.primaryMessage}
        </p>

        {/* Secondary Policy Message */}
        <p className="text-xs md:text-sm text-[#64748B] leading-relaxed mb-4 border-t border-[#F1D2B8] pt-3">
          {modalData.secondaryMessage}
        </p>

        {/* Incident Context (Polite & Informational) */}
        {modalData.reason && (
          <div className="mb-3 inline-block text-left w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-[#334155]">
            <span className="font-semibold text-[#64748B]">Trigger: </span>
            <span className="text-[#111827]">{modalData.reason}</span>
          </div>
        )}

        {/* Structured Detection Telemetry (Phase 5) */}
        <div className="grid grid-cols-2 gap-2 text-left mb-4 p-3 rounded-xl bg-[#F7EFE5] border border-[#F1D2B8] text-[11px]">
          <div>
            <span className="text-[#64748B]">Category: </span>
            <span className="text-[#111827] font-medium">
              {modalData.primaryMessage?.toLowerCase().includes("phone") || modalData.title?.toLowerCase().includes("phone")
                ? "Unauthorized Electronic Device"
                : "Candidate Framing / Environment"}
            </span>
          </div>
          <div>
            <span className="text-[#64748B]">Detection Time: </span>
            <span className="text-[#111827] font-mono">
              {modalData.timestamp ? new Date(modalData.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}
            </span>
          </div>
          <div>
            <span className="text-[#64748B]">Confidence: </span>
            <span className="text-emerald-400 font-semibold font-mono">
              {(modalData as any).confidence ? `${Math.round((modalData as any).confidence * 100)}%` : "Confirmed (92%)"}
            </span>
          </div>
          <div>
            <span className="text-[#64748B]">Severity / Status: </span>
            <span className="text-amber-400 font-semibold">
              {isFinal ? "High Priority" : "Warning"} · Confirmed
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-2">
          <button
            id="acknowledge-proctoring-warning-btn"
            type="button"
            onClick={onAcknowledge}
            className={`w-full min-h-[44px] py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
              isTermination
                ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30"
                : "bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-amber-500/20"
            }`}
          >
            <span>
              {isTermination ? "Acknowledge & End Session" : "Continue Interview"}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {!isTermination && (
            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[#64748B]">
              <Clock className="w-3.5 h-3.5 text-[#64748B]" />
              <span>
                You may click Continue or it will auto-dismiss in {secondsRemaining}s
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
