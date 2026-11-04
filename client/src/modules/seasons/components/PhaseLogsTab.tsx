"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ExternalLink } from "lucide-react";
import { EmptyState, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNumberFormat } from "@/providers/NumberFormatProvider";
import { usePhaseDailyLogs } from "../hooks/useSeasonsQuery";
import type { SeasonItem } from "../types";
import { PhasePicker } from "./PhasePicker";

/** Tab "Nhật ký": nhật ký hằng ngày trong giai đoạn (chỉ xem); nhập / sửa ở phân hệ Nhật ký hằng ngày. */
export function PhaseLogsTab({ season }: { season: SeasonItem }) {
  const t = useTranslations("seasons");
  const tc = useTranslations("common");
  const tf = useTranslations("fitness");
  const { formatNumber } = useNumberFormat();
  const [phaseId, setPhaseId] = useState<number | null>(season.phases[0]?.id ?? null);
  const query = usePhaseDailyLogs(phaseId);
  const logs = query.data;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {season.phases.length > 0 ? <PhasePicker phases={season.phases} value={phaseId} onChange={setPhaseId} /> : <span />}
        <Button variant="outline" size="sm" asChild>
          <Link href={`/daily-logs?season=${season.id}`}>
            <ExternalLink /> {t("logs.openDailyLogs")}
          </Link>
        </Button>
      </div>
      {!season.phases.length ? (
        <EmptyState description={t("phases.empty")} />
      ) : query.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : query.isError ? (
        <EmptyState description={tc("messages.loadError")} actionText={tc("actions.retry")} onAction={() => query.refetch()} />
      ) : !logs?.length ? (
        <EmptyState description={t("logs.empty")} />
      ) : (
        <div className="dt-scroll">
          <table className="dt">
            <thead>
              <tr>
                <th>{t("logs.date")}</th>
                <th className="text-right">{tf("fields.weight")}</th>
                <th className="text-right">{tf("fields.calories")}</th>
                <th className="text-right">{t("phases.macros")}</th>
                <th className="text-right">{t("logs.sleep")}</th>
                <th className="text-right">{t("logs.fatigue")}</th>
                <th>{t("logs.workout")}</th>
                <th className="text-right">{t("logs.compliance")}</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap">{log.log_date}</td>
                  <td className="text-right">{log.weight ? `${formatNumber(log.weight, 1)} ${tf("units.kg")}` : "—"}</td>
                  <td className="text-right">
                    {formatNumber(log.calories_in, 0)}
                    {log.target_calories_snapshot && <span className="text-muted-foreground"> / {formatNumber(log.target_calories_snapshot, 0)}</span>}
                  </td>
                  <td className="text-right whitespace-nowrap">
                    {t("phases.macroValue", { p: formatNumber(log.protein_in, 0), c: formatNumber(log.carbs_in, 0), f: formatNumber(log.fat_in, 0) })}
                  </td>
                  <td className="text-right">{formatNumber(log.sleep_hours, 1)}</td>
                  <td className="text-right">{log.fatigue_level ?? "—"}</td>
                  <td>
                    <StatusBadge tone={log.is_workout_completed ? "success" : "neutral"} label={log.is_workout_completed ? t("logs.done") : t("logs.notDone")} />
                  </td>
                  <td className="text-right">{log.compliance_score != null ? `${formatNumber(log.compliance_score, 0)}%` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
