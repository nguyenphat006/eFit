'use client';

import React from 'react';
import { LucideIcon, Sparkles } from 'lucide-react';
import { StatusPill } from '@/components/shared/status-pill';

interface ComingSoonProps {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Bullet list of features that will land in this section. */
  features?: string[];
  /** Estimated quarter / month label. */
  eta?: string;
}

export function ComingSoon({ icon: Icon, title, description, features, eta }: ComingSoonProps) {
  return (
    <div className="bg-card rounded-2xl border border-dashed shadow-card-light p-8 md:p-12">
      <div className="max-w-2xl mx-auto text-center">
        <div className="inline-flex w-16 h-16 rounded-2xl bg-[rgba(84,183,240,0.10)] items-center justify-center mb-5">
          <Icon className="w-8 h-8 text-[#54B7F0]" strokeWidth={1.75} />
        </div>

        <div className="inline-flex items-center gap-2 mb-3">
          <StatusPill tone="blue" icon={<Sparkles className="w-3 h-3" />}>
            Đang phát triển
          </StatusPill>
          {eta && <StatusPill tone="orange">ETA · {eta}</StatusPill>}
        </div>

        <h2 className="font-extrabold text-2xl tracking-tight text-foreground">{title}</h2>
        <p className="text-sm font-semibold text-muted-foreground mt-2 max-w-md mx-auto">
          {description}
        </p>

        {features && features.length > 0 && (
          <div className="mt-6 bg-input/40 rounded-xl border p-5 text-left">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground mb-3">
              Tính năng dự kiến
            </p>
            <ul className="space-y-2">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm font-semibold text-foreground">
                  <span className="text-[#10b981] mt-0.5">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
