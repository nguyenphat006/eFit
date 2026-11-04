import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CircleCheck, CircleDashed } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TodayStatus } from "../types";

const fmt = (v: number | null | undefined, unit = "") =>
  v === null || v === undefined ? "—" : `${v.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}${unit}`;

/** Nhật ký hôm nay của chính người dùng: đã ghi chưa + vài chỉ số chính, 1 nút đi tới trang nhật ký. */
export function TodayPanel({ today }: { today: TodayStatus }) {
  const t = useTranslations("dashboard.today");
  const rows: [string, string][] = [
    [t("weight"), fmt(today.weight, " kg")],
    [t("calories"), today.target_calories ? `${fmt(today.calories_in)} / ${fmt(today.target_calories)}` : fmt(today.calories_in)],
    [t("workout"), today.is_workout_completed ? t("workoutDone") : t("workoutPending")],
    [t("compliance"), fmt(today.compliance_score, "%")],
    [t("dfi"), fmt(today.dfi)],
  ];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm">
        {today.has_log ? (
          <CircleCheck className="size-4 text-success" aria-hidden />
        ) : (
          <CircleDashed className="size-4 text-warning" aria-hidden />
        )}
        <span className="font-medium">{today.has_log ? t("logged") : t("notLogged")}</span>
      </div>
      <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        {rows.map(([label, value]) => (
          <React.Fragment key={label}>
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="m-0 text-right font-medium tabular-nums">{value}</dd>
          </React.Fragment>
        ))}
      </dl>
      <Button asChild size="sm" variant={today.has_log ? "outline" : "default"} className="self-start">
        <Link href={`/daily-logs?date=${today.date}`}>{today.has_log ? t("open") : t("logNow")}</Link>
      </Button>
    </div>
  );
}
