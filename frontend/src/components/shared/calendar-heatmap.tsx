'use client';

import React, { useMemo } from 'react';
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay,
  startOfWeek, endOfWeek, isSameMonth, isToday, parseISO,
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Dumbbell, Camera, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DailyLog } from '@/types/session';

interface CalendarHeatmapProps {
  /** Month to display. */
  month: Date;
  onMonthChange: (next: Date) => void;
  logs: DailyLog[];
  selectedDate?: string;
  onSelectDate: (date: string) => void;
}

const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function scoreTone(score: number | null | undefined) {
  if (score === null || score === undefined) {
    return { bg: 'bg-input/30', border: 'border-dashed border-border', text: 'text-muted-foreground/50' };
  }
  if (score >= 80) return { bg: 'bg-[rgba(16,185,129,0.12)]', border: 'border-[rgba(16,185,129,0.30)]', text: 'text-[#10b981]' };
  if (score >= 50) return { bg: 'bg-[rgba(239,144,53,0.12)]', border: 'border-[rgba(239,144,53,0.30)]', text: 'text-[#EF9035]' };
  return { bg: 'bg-[rgba(239,68,68,0.10)]', border: 'border-[rgba(239,68,68,0.25)]', text: 'text-[#ef4444]' };
}

export function CalendarHeatmap({
  month, onMonthChange, logs, selectedDate, onSelectDate,
}: CalendarHeatmapProps) {
  // Build a 6-row grid: align to Monday start, fill prev/next month edges.
  const cells = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const logByDate = useMemo(() => {
    const map = new Map<string, DailyLog>();
    for (const l of logs) map.set(String(l.log_date), l);
    return map;
  }, [logs]);

  const prevMonth = () => {
    const d = new Date(month);
    d.setMonth(d.getMonth() - 1);
    onMonthChange(d);
  };
  const nextMonth = () => {
    const d = new Date(month);
    d.setMonth(d.getMonth() + 1);
    onMonthChange(d);
  };

  return (
    <div className="bg-card rounded-2xl border shadow-card-light p-5 md:p-6">
      {/* Header: month nav */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-display font-black text-xl tracking-tight">
            {format(month, 'MMMM yyyy', { locale: vi }).replace(/^./, (c) => c.toUpperCase())}
          </h3>
          <p className="text-xs font-semibold text-muted-foreground mt-0.5">
            Click vào ngày bất kỳ để xem hoặc chỉnh sửa nhật ký
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMonthChange(new Date())}
            className="h-8 px-3 font-display font-extrabold text-xs"
          >
            Hôm nay
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Day-of-week header */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-2">
        {cells.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const log = logByDate.get(dateStr);
          const tone = scoreTone(log?.compliance_score);
          const outsideMonth = !isSameMonth(day, month);
          const isSelected = selectedDate === dateStr;
          const isCurrentDay = isToday(day);

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDate(dateStr)}
              className={cn(
                'relative aspect-square min-h-[64px] rounded-xl border p-2 flex flex-col items-start justify-between transition-all text-left',
                tone.bg,
                tone.border,
                outsideMonth && 'opacity-30',
                isSelected && 'ring-2 ring-[#EF9035] ring-offset-2 ring-offset-card',
                isCurrentDay && !isSelected && 'ring-2 ring-[#54B7F0] ring-offset-2 ring-offset-card',
                'hover:scale-[1.03] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#EF9035]',
              )}
              aria-label={`${format(day, 'dd MMMM yyyy', { locale: vi })}${log ? ` · ${log.compliance_score}%` : ' · chưa log'}`}
            >
              {/* Day number */}
              <span
                className={cn(
                  'font-display font-extrabold text-sm leading-none tabular-nums',
                  isCurrentDay ? 'text-[#54B7F0]' : 'text-foreground',
                  outsideMonth && 'text-muted-foreground',
                )}
              >
                {format(day, 'd')}
              </span>

              {/* Icons row */}
              {log && (
                <div className="flex items-center gap-1">
                  {log.is_workout_completed && (
                    <Dumbbell className="w-3 h-3 text-[#10b981]" strokeWidth={2.5} />
                  )}
                  {log.body_images && log.body_images.length > 0 && (
                    <Camera className="w-3 h-3 text-[#54B7F0]" strokeWidth={2.5} />
                  )}
                  {log.diet_cheat_status === 'UNPLANNED' && (
                    <AlertTriangle className="w-3 h-3 text-[#ef4444]" strokeWidth={2.5} />
                  )}
                </div>
              )}

              {/* Compliance score */}
              {log && log.compliance_score !== null && log.compliance_score !== undefined && (
                <span className={cn('text-[10px] font-extrabold tabular-nums leading-none', tone.text)}>
                  {log.compliance_score}%
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-5 flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-input/30 border border-dashed border-border" /> Chưa log
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[rgba(239,68,68,0.10)] border border-[rgba(239,68,68,0.25)]" /> &lt; 50%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[rgba(239,144,53,0.12)] border border-[rgba(239,144,53,0.30)]" /> 50-79%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[rgba(16,185,129,0.12)] border border-[rgba(16,185,129,0.30)]" /> ≥ 80%
        </span>
        <span className="flex items-center gap-1.5">
          <Dumbbell className="w-3 h-3 text-[#10b981]" /> Đã tập
        </span>
        <span className="flex items-center gap-1.5">
          <Camera className="w-3 h-3 text-[#54B7F0]" /> Có ảnh
        </span>
        <span className="flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3 text-[#ef4444]" /> Cheat
        </span>
      </div>
    </div>
  );
}
