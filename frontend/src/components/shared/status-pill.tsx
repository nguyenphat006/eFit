'use client';

import React from 'react';
import { cn } from '@/lib/utils';

type PillTone = 'blue' | 'orange' | 'green' | 'red' | 'purple' | 'neutral';

const TONE_CLASS: Record<PillTone, string> = {
  blue: 'bg-[rgba(84,183,240,0.10)] text-[#54B7F0] border-[rgba(84,183,240,0.30)]',
  orange:
    'bg-[rgba(239,144,53,0.10)] text-[#EF9035] border-[rgba(239,144,53,0.30)]',
  green:
    'bg-[rgba(16,185,129,0.10)] text-[#10b981] border-[rgba(16,185,129,0.30)]',
  red: 'bg-[rgba(239,68,68,0.10)] text-[#ef4444] border-[rgba(239,68,68,0.30)]',
  purple:
    'bg-[rgba(167,139,250,0.10)] text-[#a78bfa] border-[rgba(167,139,250,0.30)]',
  neutral:
    'bg-[rgba(148,163,184,0.10)] text-[#475569] border-[rgba(148,163,184,0.30)]',
};

interface StatusPillProps {
  tone?: PillTone;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** size: sm is default; xs is denser. */
  size?: 'xs' | 'sm';
}

export function StatusPill({
  tone = 'neutral',
  icon,
  children,
  className,
  size = 'sm',
}: StatusPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-extrabold uppercase whitespace-nowrap',
        size === 'xs'
          ? 'px-2 py-0.5 text-[9px] tracking-[0.06em]'
          : 'px-3 py-1 text-[10px] tracking-[0.06em]',
        TONE_CLASS[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
