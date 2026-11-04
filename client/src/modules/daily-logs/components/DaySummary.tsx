import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { DailyLogItem } from "../types";
import { scoreTone, toNum } from "../dailyLogUtils";

const TONE_TEXT = { none: "text-muted-foreground", low: "text-[var(--c-error)]", mid: "text-[var(--c-warning)]", high: "text-[var(--c-success)]" };

function MacroRow({ label, value, target, unit }: { label: string; value: number | null; target: number | null; unit: string }) {
  const pct = value !== null && target ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums">
          <span className="font-semibold">{value ?? "—"}</span>
          <span className="text-muted-foreground"> / {target ?? "—"} {unit}</span>
        </span>
      </div>
      <Progress value={pct} aria-label={label} />
    </div>
  );
}

/** Đầu panel ngày: điểm kỷ luật, DFI, giai đoạn / mùa giải, macro thực nạp so với mục tiêu (snapshot). */
export function DaySummary({ log }: { log: DailyLogItem }) {
  const t = useTranslations("dailyLogs.summary");
  const score = toNum(log.compliance_score);
  const hasTargets = log.target_calories_snapshot !== null;
  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-[var(--c-bg-subtle)] p-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="m-0 text-xs text-muted-foreground">{t("compliance")}</p>
          <p className={`m-0 text-2xl font-bold tabular-nums ${TONE_TEXT[scoreTone(score)]}`}>{score !== null ? `${Math.round(score)}%` : "—"}</p>
        </div>
        <div>
          <p className="m-0 text-xs text-muted-foreground">{t("dfi")}</p>
          <p className="m-0 text-2xl font-bold tabular-nums">{log.dfi ?? "—"}</p>
        </div>
      </div>
      {log.phase_name && (
        <div className="flex items-center gap-2 text-sm">
          <Trophy className="size-4 text-[var(--c-purple)]" aria-hidden />
          <span className="min-w-0 truncate">
            {t("phase", { name: log.phase_name })}
            {log.season_id && (
              <>
                {" · "}
                <Link href={`/seasons/${log.season_id}`} className="text-primary hover:underline">{t("openSeason")}</Link>
              </>
            )}
          </span>
        </div>
      )}
      {hasTargets && (
        <div className="flex flex-col gap-2">
          <MacroRow label={t("calories")} value={toNum(log.calories_in)} target={toNum(log.target_calories_snapshot)} unit="kcal" />
          <MacroRow label={t("protein")} value={toNum(log.protein_in)} target={toNum(log.target_protein_snapshot)} unit="g" />
          <MacroRow label={t("carbs")} value={toNum(log.carbs_in)} target={toNum(log.target_carbs_snapshot)} unit="g" />
          <MacroRow label={t("fat")} value={toNum(log.fat_in)} target={toNum(log.target_fat_snapshot)} unit="g" />
        </div>
      )}
    </div>
  );
}
