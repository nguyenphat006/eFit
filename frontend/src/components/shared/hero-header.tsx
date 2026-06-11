'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface HeroHeaderProps {
  /** Small uppercase eyebrow text shown above the title — e.g. "MÙA GIẢI · PERIODIZATION". */
  eyebrow?: React.ReactNode;
  /** Pill with optional icon shown beside / instead of eyebrow. */
  pill?: React.ReactNode;
  /** Main heading. */
  title: React.ReactNode;
  /** Accent word (rendered with brand gradient). Inserted after title with a line break. */
  titleAccent?: React.ReactNode;
  /** One-line subtitle below title. */
  subtitle?: React.ReactNode;
  /** Action area shown top-right (buttons). */
  action?: React.ReactNode;
  /** Bottom strip — meta info like "12 mùa · 3 đang chạy". Use uppercase. */
  meta?: React.ReactNode;
  /** Compact = less padding for inner pages. */
  size?: 'default' | 'compact';
  className?: string;
}

export function HeroHeader({
  eyebrow,
  pill,
  title,
  titleAccent,
  subtitle,
  action,
  meta,
  size = 'default',
  className,
}: HeroHeaderProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border text-white',
        size === 'compact' ? 'p-6 md:p-8' : 'p-8 md:p-10',
        className,
      )}
      style={{
        background:
          'linear-gradient(135deg, #0c1730 0%, #0e1424 60%, #1a1208 100%)',
        borderColor: 'rgba(148, 163, 184, 0.14)',
      }}
    >
      {/* Layer 2: dotted grid overlay */}
      <svg
        className="absolute inset-0 h-full w-full pointer-events-none"
        style={{ opacity: 0.08 }}
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="hero-grid"
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 32 0 L 0 0 0 32"
              fill="none"
              stroke="white"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-grid)" />
      </svg>

      {/* Layer 3: blue bloom */}
      <div
        className="absolute pointer-events-none"
        style={{
          right: '-60px',
          top: '-40px',
          width: '240px',
          height: '240px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(84,183,240,.5) 0%, transparent 70%)',
          filter: 'blur(28px)',
        }}
      />
      {/* Layer 4: orange bloom */}
      <div
        className="absolute pointer-events-none hidden md:block"
        style={{
          left: '220px',
          bottom: '-90px',
          width: '260px',
          height: '260px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(239,144,53,.4) 0%, transparent 70%)',
          filter: 'blur(28px)',
        }}
      />

      {/* Content */}
      <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div className="flex-1 min-w-0">
          {pill ?? (eyebrow && (
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full"
              style={{
                background: 'rgba(255,255,255,.08)',
                border: '1px solid rgba(255,255,255,.14)',
                fontSize: '10px',
                fontWeight: 800,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,.85)',
              }}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{
                  background: '#10b981',
                  boxShadow: '0 0 0 4px rgba(16,185,129,.2)',
                }}
              />
              {eyebrow}
            </div>
          ))}

          <h1
            className={cn(
              'font-display font-black leading-[1.05] tracking-tight mt-3',
              size === 'compact'
                ? 'text-[28px] md:text-[32px]'
                : 'text-[32px] md:text-[40px]',
            )}
            style={{ letterSpacing: '-0.03em' }}
          >
            {title}
            {titleAccent && (
              <>
                {' '}
                <span className="text-brand-gradient">{titleAccent}</span>
              </>
            )}
          </h1>

          {subtitle && (
            <p
              className="mt-2 max-w-2xl"
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: 'rgba(226,232,240,.72)',
                lineHeight: 1.55,
              }}
            >
              {subtitle}
            </p>
          )}

          {meta && (
            <div
              className="mt-5 flex flex-wrap gap-4"
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(226,232,240,.55)',
              }}
            >
              {meta}
            </div>
          )}
        </div>

        {action && (
          <div className="shrink-0 flex items-center gap-2 self-start md:self-center">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
