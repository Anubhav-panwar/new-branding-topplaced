'use client';

import React from 'react';
import { Gauge, Mic, AlertCircle, CheckCircle2, TrendingUp, Sparkles, Volume2 } from 'lucide-react';

export interface SpeechAnalyticsData {
  fillerWordsCount?: number;
  fillerWordsBreakdown?: Record<string, number>;
  wordCount?: number;
  wordsPerMinute?: number;
  paceCategory?: 'slow' | 'optimal' | 'fast' | 'silent';
  paceVerdict?: string;
  clarityScore?: number;
  concisenessScore?: number;
  recommendations?: string[];
  totalFillerWords?: number;
  averageWPM?: number;
  deliveryRating?: string;
  summaryTip?: string;
}

interface SpeechAnalyticsWidgetProps {
  data?: SpeechAnalyticsData;
  isCompact?: boolean;
}

export default function SpeechAnalyticsWidget({
  data,
  isCompact = false,
}: SpeechAnalyticsWidgetProps) {
  if (!data) return null;

  const wpm = data.wordsPerMinute || data.averageWPM || 130;
  const fillersCount = data.fillerWordsCount ?? data.totalFillerWords ?? 0;
  const breakdown = data.fillerWordsBreakdown || {};
  const clarity = data.clarityScore ?? (fillersCount <= 2 ? 92 : fillersCount <= 5 ? 80 : 65);
  const verdict = data.paceVerdict || (wpm >= 105 && wpm <= 160 ? 'Optimal Professional Cadence' : wpm < 105 ? 'Slightly Slow' : 'Fast Pace');
  const tip = data.summaryTip || (data.recommendations && data.recommendations[0]) || 'Maintain comfortable eye contact and pause deliberately between key technical points.';

  // Speedometer needle angle / position: 60 WPM -> 0%, 130 WPM -> 50%, 200 WPM -> 100%
  const wpmPercent = Math.min(Math.max(((wpm - 60) / 140) * 100, 5), 95);

  if (isCompact) {
    return (
      <div className="flex items-center gap-4 p-2.5 rounded-lg bg-white border border-[#E8D9CC] shadow-xs text-xs">
        <div className="flex items-center gap-1.5">
          <Gauge size={14} className="text-[#E85D04]" />
          <span className="font-semibold text-[#E85D04]">{wpm} WPM</span>
          <span className="text-[10px] text-[#64748B] font-mono">({verdict})</span>
        </div>
        <div className="h-3 w-px bg-slate-200" />
        <div className="flex items-center gap-1.5">
          <Mic size={14} className={fillersCount === 0 ? 'text-emerald-400' : 'text-amber-400'} />
          <span className="font-semibold text-[#334155]">{fillersCount} Fillers</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl bg-white border border-[#E8D9CC] shadow-xs p-5 shadow-xl text-[#111827]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E8D9CC]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E85D04] to-[#E85D04] text-white flex items-center justify-center shadow-md">
            <Volume2 size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-[#111827] flex items-center gap-2">
              Speech & Vocal Delivery Mastery
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {data.deliveryRating || (fillersCount <= 2 ? 'Executive' : 'Strong')}
              </span>
            </h3>
            <p className="text-[11px] text-[#64748B]">
              Evaluates verbal pacing, filler word elimination, and spoken executive presence.
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-mono text-[#64748B]">Clarity Score</div>
          <div className="text-lg font-bold font-mono text-emerald-600">{clarity}/100</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Speaking Pace (WPM) Meter */}
        <div className="p-3.5 rounded-xl bg-[#FFFCF8] border border-[#E8D9CC] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-[#475569] font-semibold flex items-center gap-1.5">
                <Gauge size={13} className="text-[#E85D04]" />
                Speaking Pace (WPM)
              </span>
              <span className="font-mono font-bold text-[#E85D04]">{wpm} WPM</span>
            </div>
            {/* Visual Gauge Track */}
            <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden my-2">
              <div className="absolute inset-0 flex">
                <div className="w-1/3 bg-amber-500/40 border-r border-slate-900" title="Slow (<105 WPM)" />
                <div className="w-1/3 bg-emerald-500/50 border-r border-slate-900" title="Optimal (105-155 WPM)" />
                <div className="w-1/3 bg-rose-500/40" title="Fast (>155 WPM)" />
              </div>
              {/* Needle Indicator */}
              <div
                className="absolute top-0 bottom-0 w-1.5 bg-white shadow-[0_0_8px_white] rounded-full transition-all duration-500"
                style={{ left: `${wpmPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-[#64748B]">
              <span>Slow (&lt;105)</span>
              <span className="text-emerald-600 font-semibold">Optimal (105-155)</span>
              <span>Fast (&gt;155)</span>
            </div>
          </div>
          <div className="text-[11px] text-[#334155] mt-2 font-medium bg-white border border-slate-200 px-2 py-1 rounded">
            {verdict}
          </div>
        </div>

        {/* Filler Words Breakdown */}
        <div className="p-3.5 rounded-xl bg-[#FFFCF8] border border-[#E8D9CC] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-[#475569] font-semibold flex items-center gap-1.5">
                <Mic size={13} className="text-amber-400" />
                Filler Words Count
              </span>
              <span className={`font-mono font-bold ${fillersCount === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {fillersCount} Total
              </span>
            </div>

            {fillersCount === 0 ? (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs my-1">
                <CheckCircle2 size={15} />
                <span>Zero verbal filler crutches detected. Clean articulation!</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 my-2">
                {Object.entries(breakdown).map(([word, count]) => (
                  <span
                    key={word}
                    className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 font-semibold"
                  >
                    <span>&ldquo;{word}&rdquo;</span>
                    <span className="font-bold opacity-80">&times;{count}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="text-[10px] text-[#64748B] mt-1">
            Industry standard: fewer than 3 fillers per 2-minute technical answer.
          </div>
        </div>
      </div>

      {/* Actionable Vocal Coaching Advice */}
      <div className="mt-3.5 p-3 rounded-xl bg-[#FFFCF8] border border-[#E8D9CC] flex items-start gap-2.5 text-xs text-[#334155]">
        <Sparkles size={16} className="text-[#E85D04] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-[#E85D04]">Vocal Coach Tip: </span>
          <span className="text-[#334155]">{tip}</span>
        </div>
      </div>
    </div>
  );
}
