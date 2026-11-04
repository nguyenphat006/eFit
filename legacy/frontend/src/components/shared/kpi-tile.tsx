'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tone = 'blue' | 'orange' | 'green' | 'red' | 'purple' | 'neutral';

const TONE = {
  blue: {
    glow: 'rgba(84,183,240,.18)',
    iconBg: 'rgba(84,183,240,.10)',
    iconColor: '#54B7F0',
    sparkStroke: '#54B7F0',
    sparkFill: 'rgba(84,183,240,.18)',
  },
  orange: {
    glow: 'rgba(239,144,53,.18)',
    iconBg: 'rgba(239,144,53,.10)',
    iconColor: '#EF9035',
    sparkStroke: '#EF9035',
    sparkFill: 'rgba(239,144,53,.18)',
  },
  green: {
    glow: 'rgba(16,185,129,.18)',
    iconBg: 'rgba(16,185,129,.10)',
    iconColor: '#10b981',
    sparkStroke: '#10b981',
    sparkFill: 'rgba(16,185,129,.18)',
  },
  red: {
    glow: 'rgba(239,68,68,.18)',
    iconBg: 'rgba(239,68,68,.10)',
    iconColor: '#ef4444',
    sparkStroke: '#ef4444',
    sparkFill: 'rgba(239,68,68,.18)',
  },
  purple: {
    glow: 'rgba(167,139,250,.18)',
    iconBg: 'rgba(167,139,250,.10)',
    iconColor: '#a78bfa',
    sparkStroke: '#a78bfa',
    sparkFill: 'rgba(167,139,250,.18)',
  },
  neutral: {
    glow: 'rgba(148,163,184,.18)',
    iconBg: 'rgba(148,163,184,.10)',
    iconColor: '#64748b',
    sparkStroke: '#64748b',
    sparkFill: 'rgba(148,163,184,.18)',
  },
} as const;

interface KpiTileProps {
  label: string;
  value: React.ReactNode;
  /** Small text inside the value, e.g. "%" or "kg". */
  unit?: string;
  icon?: LucideIcon;
  tone?: Tone;
  /** Footer delta or hint. */
  delta?: {
    value: string;
    trend?: 'up' | 'down' | 'flat';
  };
  /** 7-point sparkline normalized 0..1. */
  spark?: number[];
  className?: string;
  loading?: boolean;
}

function Sparkline({
  points,
  stroke,
  fill,
}: {
  points: number[];
  stroke: string;
  fill: string;
}) {
  if (!points || points.length === 0) return null;
  const w = 70;
  const h = 22;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const step = w / (points.length - 1 || 1);
  const coords = points.map((v, i) => {
    const x = i * step;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return { x, y };
  });
  const linePath = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L ${w} ${h} L 0 ${h} Z`;
  const last = coords[coords.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path d={areaPath} fill={fill} />
      <path d={linePath} fill="none" stroke={stroke} strokeWidth="1.5" />
      <circle cx={last.x} cy={last.y} r="2.5" fill={stroke} />
    </svg>
  );
}

export function KpiTile({
  label,
  value,
  unit,
  icon: Icon,
  tone = 'blue',
  delta,
  spark,
  className,
  loading,
}: KpiTileProps) {
  const t = TONE[tone];
  const trendColor =
    delta?.trend === 'down'
      ? '#f97316'
      : delta?.trend === 'flat'
      ? '#64748b'
      : '#10b981';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-card border shadow-card-light p-5',
        className,
      )}
      style={{ borderColor: '#e8f4fc' }}
    >
      {/* Glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-20px',
          right: '-20px',
          width: '90px',
          height: '90px',
          borderRadius: '50%',
          background: t.glow,
          filter: 'blur(10px)',
        }}
      />

      {/* Icon at top-right */}
      {Icon && (
        <div
          className="absolute top-4 right-4 w-9 h-9 rounded-[10px] grid place-items-center"
          style={{ background: t.iconBg, color: t.iconColor }}
        >
          <Icon className="w-4 h-4" strokeWidth={1.75} />
        </div>
      )}

      {/* Label */}
      <div
        className="relative text-[10px] font-extrabold text-muted-foreground"
        style={{ letterSpacing: '0.12em', textTransform: 'uppercase' }}
      >
        {label}
      </div>

      {/* Value */}
      <div
        className="relative font-display font-black mt-2"
        style={{
          fontSize: '30px',
          letterSpacing: '-0.03em',
          lineHeight: 1,
          fontFamily: 'Outfit, sans-serif',
        }}
      >
        {loading ? (
          <span className="text-muted-foreground/40">···</span>
        ) : (
          <>
            {value}
            {unit && (
              <small
                className="text-muted-foreground font-bold ml-0.5"
                style={{ fontSize: '14px' }}
              >
                {unit}
              </small>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      {(delta || spark) && (
        <div className="relative mt-3 flex items-end justify-between gap-2">
          {delta && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-extrabold"
              style={{ color: trendColor }}
            >
              {delta.trend === 'up' && '↗'}
              {delta.trend === 'down' && '↘'}
              {delta.trend === 'flat' && '→'}
              {delta.value}
            </span>
          )}
          {spark && spark.length > 0 && (
            <Sparkline
              points={spark}
              stroke={t.sparkStroke}
              fill={t.sparkFill}
            />
          )}
        </div>
      )}
    </div>
  );
}
