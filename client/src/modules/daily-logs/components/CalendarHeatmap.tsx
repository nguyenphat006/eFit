"use client";

import React, { useMemo } from "react";
import { addMonths, format, isSameMonth } from "date-fns";
import { enUS, vi } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, Camera, ChevronLeft, ChevronRight, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DailyLogItem } from "../types";
import { monthGrid, scoreTone, toIsoDate, type ScoreTone } from "../dailyLogUtils";

const TONE_CLASS: Record<ScoreTone, string> = {
  none: "border-dashed border-[var(--c-border-strong)] bg-[var(--c-bg-subtle)]",
  low: "border-[var(--c-error-border)] bg-[var(--c-error-bg)]",
  mid: "border-[var(--c-warning-border)] bg-[var(--c-warning-bg)]",
  high: "border-[var(--c-success-border)] bg-[var(--c-success-bg)]",
};
const TONE_TEXT: Record<ScoreTone, string> = {
  none: "text-muted-foreground",
  low: "text-[var(--c-error)]",
  mid: "text-[var(--c-warning)]",
  high: "text-[var(--c-success)]",
};
const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

interface CalendarHeatmapProps {
  month: Date;
  onMonthChange: (next: Date) => void;
  logs: DailyLogItem[];
  selectedDate?: string | null;
  onSelectDate: (date: string) => void;
  loading?: boolean;
}

/** Lịch tháng: mỗi ô là 1 ngày, màu theo điểm kỷ luật; biểu tượng đã tập / có ảnh / ăn ngoài kế hoạch. */
export function CalendarHeatmap({ month, onMonthChange, logs, selectedDate, onSelectDate, loading }: CalendarHeatmapProps) {
  const t = useTranslations("dailyLogs.calendar");
  const locale = useLocale();
  const cells = useMemo(() => monthGrid(month), [month]);
  const byDate = useMemo(() => new Map(logs.map((l) => [l.log_date, l])), [logs]);
  const todayStr = toIsoDate(new Date());
  const title = format(month, "LLLL yyyy", { locale: locale === "en" ? enUS : vi });

  return (
    <section className="dash-panel" aria-busy={loading}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="dash-panel__title m-0 capitalize">{title}</h2>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" aria-label={t("prev")} onClick={() => onMonthChange(addMonths(month, -1))}>
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onMonthChange(new Date())}>
            {t("today")}
          </Button>
          <Button variant="outline" size="icon-sm" aria-label={t("next")} onClick={() => onMonthChange(addMonths(month, 1))}>
            <ChevronRight />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2" role="grid">
        {WEEKDAY_KEYS.map((key) => (
          <div key={key} className="py-1 text-center text-[11px] font-semibold uppercase text-muted-foreground" role="columnheader">
            {t(`weekdays.${key}`)}
          </div>
        ))}
        {cells.map((day) => {
          const dateStr = toIsoDate(day);
          const log = byDate.get(dateStr);
          const score = log?.compliance_score ?? null;
          const tone = scoreTone(log ? score : null);
          const outside = !isSameMonth(day, month);
          const isToday = dateStr === todayStr;
          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDate(dateStr)}
              aria-pressed={selectedDate === dateStr}
              aria-label={log ? t("cellLogged", { date: format(day, "dd/MM/yyyy"), score: score ?? 0 }) : t("cellEmpty", { date: format(day, "dd/MM/yyyy") })}
              className={cn(
                "flex aspect-square min-h-12 flex-col items-start justify-between rounded-lg border p-1.5 text-left transition-colors sm:min-h-16 sm:p-2",
                "hover:border-[var(--c-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                TONE_CLASS[tone],
                outside && "opacity-40",
                selectedDate === dateStr && "ring-2 ring-[var(--c-primary)]",
              )}
            >
              <span className={cn("text-sm font-semibold leading-none tabular-nums", isToday ? "text-primary" : "text-foreground")}>
                {format(day, "d")}
              </span>
              {log && (
                <span className="hidden items-center gap-1 sm:flex" aria-hidden>
                  {log.is_workout_completed && <Dumbbell className="size-3 text-[var(--c-success)]" />}
                  {!!log.body_images?.length && <Camera className="size-3 text-[var(--c-info)]" />}
                  {log.diet_cheat_status === "UNPLANNED" && <AlertTriangle className="size-3 text-[var(--c-error)]" />}
                </span>
              )}
              {log && score !== null && (
                <span className={cn("text-[10px] font-semibold leading-none tabular-nums", TONE_TEXT[tone])}>{Math.round(score)}%</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        {(["none", "low", "mid", "high"] as const).map((tone) => (
          <span key={tone} className="flex items-center gap-1.5">
            <span className={cn("size-3 rounded border", TONE_CLASS[tone])} aria-hidden />
            {t(`legend.${tone}`)}
          </span>
        ))}
        <span className="flex items-center gap-1.5"><Dumbbell className="size-3 text-[var(--c-success)]" aria-hidden />{t("legend.workout")}</span>
        <span className="flex items-center gap-1.5"><Camera className="size-3 text-[var(--c-info)]" aria-hidden />{t("legend.photo")}</span>
        <span className="flex items-center gap-1.5"><AlertTriangle className="size-3 text-[var(--c-error)]" aria-hidden />{t("legend.cheat")}</span>
      </div>
    </section>
  );
}
