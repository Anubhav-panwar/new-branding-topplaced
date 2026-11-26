'use client';

import React, { useState, useMemo } from 'react';
import { Target, TrendingUp, TrendingDown, Award, Sparkles, CheckCircle2, AlertTriangle, BarChart3, Radar as RadarIcon } from 'lucide-react';

export interface CompetencyMetric {
  key: string;
  label: string;
  score: number;
  benchmark?: number; // target benchmark, default 75
  feedback?: string;
  category?: string;
}

interface CompetencyRadarChartProps {
  metrics: CompetencyMetric[];
  overallScore?: number;
  className?: string;
  size?: 'compact' | 'full';
  activeCategory?: string | null;
  onSelectCategory?: (key: string) => void;
  title?: string;
  subtitle?: string;
  showBenchmarkToggle?: boolean;
}

export default function CompetencyRadarChart({
  metrics,
  overallScore,
  className = '',
  size = 'full',
  activeCategory,
  onSelectCategory,
  title = 'Competency Performance Graph',
  subtitle = 'Multi-dimensional evaluation mapped against the FAANG / Senior Hiring Benchmark (75%)',
  showBenchmarkToggle = true,
}: CompetencyRadarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'radar' | 'bars'>(size === 'compact' ? 'radar' : 'radar');
  const [showBenchmark, setShowBenchmark] = useState<boolean>(true);

  // Normalize metrics (fallback to default 5 dimensions if empty)
  const data = useMemo(() => {
    if (metrics && metrics.length >= 3) {
      return metrics.map((m) => ({
        ...m,
        benchmark: m.benchmark ?? 75,
        score: typeof m.score === 'number' && !isNaN(m.score) ? Math.max(0, Math.min(100, Math.round(m.score))) : 0,
      }));
    }
    return [
      { key: 'technical', label: 'Technical Knowledge', score: 75, benchmark: 75 },
      { key: 'communication', label: 'Communication', score: 80, benchmark: 75 },
      { key: 'problemSolving', label: 'Problem Solving', score: 70, benchmark: 75 },
      { key: 'systemArchitecture', label: 'System Architecture', score: 72, benchmark: 75 },
      { key: 'practicalApplication', label: 'Practical Application', score: 78, benchmark: 75 },
    ];
  }, [metrics]);

  const count = data.length;

  // Geometry calculations
  const cx = 200;
  const cy = 190;
  const maxRadius = size === 'compact' ? 105 : 120;
  const rings = [0.25, 0.5, 0.75, 1.0];

  const getCoordinates = (index: number, ratio: number, radiusOffset = 0) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
    const r = maxRadius * ratio + radiusOffset;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      angle,
    };
  };

  // Polygon path for candidate scores
  const candidatePolygonPoints = useMemo(() => {
    return data
      .map((d, i) => {
        // give at least 5% radius so polygon doesn't completely collapse at 0
        const ratio = Math.max(0.06, d.score / 100);
        const { x, y } = getCoordinates(i, ratio);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [data, count, maxRadius]);

  // Polygon path for benchmark (75%)
  const benchmarkPolygonPoints = useMemo(() => {
    return data
      .map((d, i) => {
        const ratio = (d.benchmark || 75) / 100;
        const { x, y } = getCoordinates(i, ratio);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [data, count, maxRadius]);

  // Ring polygons for background web
  const ringPolygons = useMemo(() => {
    return rings.map((ratio) => {
      const points = data
        .map((_, i) => {
          const { x, y } = getCoordinates(i, ratio);
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');
      return { ratio, points };
    });
  }, [data, count, maxRadius]);

  // Active or hovered metric info
  const selectedMetric = hoveredIdx !== null ? data[hoveredIdx] : activeCategory ? data.find((d) => d.key === activeCategory) : null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#E85D04'; // Emerald
    if (score >= 65) return '#38BDF8'; // Sky
    if (score >= 50) return '#FBBF24'; // Amber
    return '#F43F5E'; // Rose
  };

  const getScoreBadge = (score: number, benchmark: number = 75) => {
    const diff = score - benchmark;
    if (diff >= 10) return { label: `+${diff}% Above Bar`, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    if (diff >= 0) return { label: `+${diff}% Meets Bar`, color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' };
    return { label: `${diff}% Gap to Bar`, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
  };

  const aboveBarCount = data.filter((d) => d.score >= (d.benchmark || 75)).length;

  return (
    <div
      className={`rounded-2xl transition-all duration-300 ${
        size === 'compact'
          ? 'bg-white p-4 border border-[#E8D9CC] shadow-xs'
          : 'bg-white p-6 sm:p-7 border border-[#E8D9CC] shadow-xs'
      } ${className}`}
    >
      {/* Header controls (only in full mode or when title needed) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8D9CC]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#FFF0E6] text-[#E85D04] border border-[#E8D9CC]">
              <RadarIcon size={16} />
            </span>
            <h3 className="text-base sm:text-lg font-bold text-[#2B211C] tracking-tight flex items-center gap-2">
              {title}
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#FFF0E6] text-[#E85D04] border border-[#E8D9CC]">
                {aboveBarCount}/{data.length} Benchmark Met
              </span>
            </h3>
          </div>
          {subtitle && <p className="text-xs text-[#70645C] mt-1 leading-relaxed">{subtitle}</p>}
        </div>

        {/* View Switcher & Benchmark Toggle */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {showBenchmarkToggle && (
            <button
              type="button"
              onClick={() => setShowBenchmark((v) => !v)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                showBenchmark
                  ? 'bg-[#FFF0E6] text-[#E85D04] border border-[#E8D9CC]'
                  : 'bg-[#FFFCF8] text-[#70645C] border-[#E8D9CC] hover:text-[#2B211C]'
              }`}
              title="Toggle 75% Senior Hiring Benchmark Line"
            >
              <Target size={13} />
              <span>Benchmark (75%)</span>
            </button>
          )}

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-[#E8D9CC]">
            <button
              type="button"
              onClick={() => setViewMode('radar')}
              className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                viewMode === 'radar' ? 'bg-[#E85D04] text-white font-bold shadow-xs' : 'text-[#64748B] hover:text-[#111827]'
              }`}
              title="Radar / Spider Chart View"
            >
              <RadarIcon size={14} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('bars')}
              className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                viewMode === 'bars' ? 'bg-[#E85D04] text-white font-bold shadow-xs' : 'text-[#64748B] hover:text-[#111827]'
              }`}
              title="Benchmark Bar Comparison View"
            >
              <BarChart3 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'radar' ? (
        <div className="relative flex flex-col items-center justify-center pt-3 pb-1">
          {/* SVG Radar Chart */}
          <div className="w-full max-w-[440px] aspect-[400/370] relative select-none">
            <svg viewBox="0 0 400 370" className="w-full h-full overflow-visible">
              <defs>
                {/* Glow filter for polygon and points */}
                <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                {/* Gradient for candidate area */}
                <linearGradient id="candidateRadarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E85D04" stopOpacity="0.38" />
                  <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.18" />
                </linearGradient>
              </defs>

              {/* Concentric grid polygons */}
              {ringPolygons.map((ring, idx) => {
                const isBenchmarkRing = ring.ratio === 0.75;
                return (
                  <polygon
                    key={idx}
                    points={ring.points}
                    fill={idx === ringPolygons.length - 1 ? 'none' : 'rgba(255, 255, 255, 0.015)'}
                    stroke={isBenchmarkRing ? '#E85D04' : '#1C2733'}
                    strokeWidth={isBenchmarkRing ? 1.2 : 0.8}
                    strokeDasharray={isBenchmarkRing ? '4 3' : undefined}
                    opacity={isBenchmarkRing ? 0.7 : 0.6}
                  />
                );
              })}

              {/* Axis rays from center to vertices */}
              {data.map((_, i) => {
                const { x, y } = getCoordinates(i, 1.0);
                return (
                  <line
                    key={i}
                    x1={cx}
                    y1={cy}
                    x2={x}
                    y2={y}
                    stroke="#E8D9CC"
                    strokeWidth={0.9}
                    strokeDasharray="2 3"
                  />
                );
              })}

              {/* Target Benchmark polygon (75%) */}
              {showBenchmark && (
                <polygon
                  points={benchmarkPolygonPoints}
                  fill="rgba(99, 102, 241, 0.08)"
                  stroke="#818CF8"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  opacity={0.85}
                  className="transition-all duration-500 pointer-events-none"
                />
              )}

              {/* Candidate Score polygon */}
              <polygon
                points={candidatePolygonPoints}
                fill="url(#candidateRadarGradient)"
                stroke="#E85D04"
                strokeWidth={2.5}
                filter="url(#radarGlow)"
                className="transition-all duration-700 ease-out"
              />

              {/* Data points & hover anchors */}
              {data.map((d, i) => {
                const ratio = Math.max(0.06, d.score / 100);
                const { x, y } = getCoordinates(i, ratio);
                const isHovered = hoveredIdx === i || activeCategory === d.key;
                const pointColor = getScoreColor(d.score);

                return (
                  <g
                    key={i}
                    className="cursor-pointer transition-transform duration-200"
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    onClick={() => onSelectCategory && onSelectCategory(d.key)}
                  >
                    {/* Pulsing ring on hover */}
                    {isHovered && (
                      <circle
                        cx={x}
                        cy={y}
                        r={12}
                        fill={pointColor}
                        opacity={0.25}
                        className="animate-ping"
                      />
                    )}
                    {/* Point circle */}
                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? 6 : 4.5}
                      fill={pointColor}
                      stroke="#FFFFFF"
                      strokeWidth={2}
                      className="transition-all duration-200"
                    />
                  </g>
                );
              })}

              {/* Outer Vertex Labels and Percentage Badges */}
              {data.map((d, i) => {
                const { x, y, angle } = getCoordinates(i, 1.0, size === 'compact' ? 24 : 32);
                const isHovered = hoveredIdx === i || activeCategory === d.key;
                const pointColor = getScoreColor(d.score);

                // Text alignment based on horizontal angle
                let textAnchor = 'middle';
                if (Math.cos(angle) > 0.25) textAnchor = 'start';
                else if (Math.cos(angle) < -0.25) textAnchor = 'end';

                return (
                  <g
                    key={`label-${i}`}
                    className="cursor-pointer transition-all duration-200"
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    onClick={() => onSelectCategory && onSelectCategory(d.key)}
                  >
                    <text
                      x={x}
                      y={y - 6}
                      textAnchor={textAnchor}
                      fill={isHovered ? '#E85D04' : '#E2E8F0'}
                      fontSize={size === 'compact' ? 10.5 : 11.5}
                      fontWeight={isHovered ? 700 : 600}
                      fontFamily="system-ui, sans-serif"
                      className="transition-colors"
                    >
                      {d.label}
                    </text>
                    <text
                      x={x}
                      y={y + 8}
                      textAnchor={textAnchor}
                      fill={pointColor}
                      fontSize={size === 'compact' ? 10 : 11}
                      fontWeight={700}
                      fontFamily="monospace"
                    >
                      {d.score}%
                      <tspan
                        fill={d.score >= (d.benchmark || 75) ? '#10B981' : '#64748B'}
                        fontSize={9}
                        fontWeight={500}
                      >
                        {d.score >= (d.benchmark || 75) ? ' ✓' : ''}
                      </tspan>
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Legend and Active Metric Summary Card */}
          <div className="w-full mt-3 pt-3 border-t border-[#E8D9CC] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            {/* Legend keys */}
            <div className="flex items-center gap-4 flex-wrap text-[11px] text-[#64748B]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#E85D04]/20 border-2 border-[#E85D04]" />
                <span className="text-[#111827] font-medium">Candidate Score</span>
              </div>
              {showBenchmark && (
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 border-t-2 border-dashed border-[#818CF8]" />
                  <span className="text-[#A5B4FC]">Senior Hiring Bar (75%)</span>
                </div>
              )}
            </div>

            {/* Hover details badge */}
            {selectedMetric ? (
              <div className="flex items-center gap-2 bg-[#141C24] px-3 py-1.5 rounded-lg border border-[#E8D9CC]">
                <span className="text-[#64748B] font-medium">{selectedMetric.label}:</span>
                <span className="font-mono font-bold text-[#111827]">{selectedMetric.score}%</span>
                {(() => {
                  const badge = getScoreBadge(selectedMetric.score, selectedMetric.benchmark);
                  return (
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${badge.color}`}>
                      {badge.label}
                    </span>
                  );
                })()}
              </div>
            ) : (
              <span className="text-[11px] text-[#64748B] italic">
                Hover or click any vertex to inspect specific competency benchmark
              </span>
            )}
          </div>

          {/* Feedback preview if selected */}
          {selectedMetric?.feedback && (
            <div className="w-full mt-2.5 p-3 rounded-xl bg-[#141C24]/80 border border-[#E8D9CC] text-xs leading-relaxed text-[#70645C] animate-fadeIn">
              <span className="font-semibold text-[#E85D04] mr-1.5 font-mono text-[11px] uppercase">
                {selectedMetric.label} Evaluation:
              </span>
              {selectedMetric.feedback}
            </div>
          )}
        </div>
      ) : (
        /* Benchmark Horizontal Bar Comparison View */
        <div className="space-y-3.5 pt-4">
          <div className="flex justify-between items-center text-[11px] font-mono text-[#64748B] px-1 pb-1 border-b border-[#E8D9CC]/50">
            <span>COMPETENCY DIMENSION</span>
            <span className="flex items-center gap-4">
              <span>SCORE</span>
              <span>VS 75% BAR</span>
            </span>
          </div>

          {data.map((d, idx) => {
            const badge = getScoreBadge(d.score, d.benchmark || 75);
            const isSelected = hoveredIdx === idx || activeCategory === d.key;
            const barColor = getScoreColor(d.score);

            return (
              <div
                key={d.key || idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => onSelectCategory && onSelectCategory(d.key)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#141C24] border-[#E85D04]/50 shadow-md'
                    : 'bg-[#101720]/60 border-[#E8D9CC] hover:border-[#E8D9CC]/80 hover:bg-[#141C24]/50'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#111827]">{d.label}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm" style={{ color: barColor }}>
                      {d.score}%
                    </span>
                    <span className="text-[10px] font-mono text-[#64748B]">Target 75%</span>
                  </div>
                </div>

                {/* Comparative Bar with 75% target line marker */}
                <div className="relative w-full h-3 rounded-full bg-[#1C2733] overflow-hidden">
                  {/* Candidate score fill */}
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${Math.max(4, d.score)}%`,
                      backgroundColor: barColor,
                    }}
                  />
                  {/* 75% Benchmark vertical marker */}
                  {showBenchmark && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-[#E85D04] z-10 shadow-[0_0_6px_rgba(242,106,10,0.8)]"
                      style={{ left: '75%' }}
                      title="FAANG 75% Benchmark Bar"
                    />
                  )}
                </div>

                {/* Feedback expansion if active */}
                {isSelected && d.feedback && (
                  <p className="mt-2 text-xs text-[#64748B] leading-relaxed pt-2 border-t border-[#E8D9CC]/60 animate-fadeIn">
                    {d.feedback}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
