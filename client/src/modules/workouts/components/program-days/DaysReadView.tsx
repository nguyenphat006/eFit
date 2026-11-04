"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/common";

/** Cấu trúc tối thiểu của buổi tập — dùng chung cho giáo án và snapshot giáo án trong giai đoạn */
export interface DayLike {
  id?: number;
  day_label: string;
  day_of_week?: number | null;
  exercises: {
    id?: number;
    exercise_name: string;
    sets: number;
    reps: string;
    target_rpe?: string | number | null;
    tempo?: string | null;
    rest_seconds?: number | null;
    notes?: string | null;
  }[];
}

export function DaysReadView({ days, emptyActionText, onEmptyAction }: { days: readonly DayLike[]; emptyActionText?: string; onEmptyAction?: () => void }) {
  const t = useTranslations("workouts");
  if (!days.length) return <EmptyState description={t("days.empty")} actionText={emptyActionText} onAction={onEmptyAction} />;
  return (
    <div className="flex flex-col gap-4">
      {days.map((day, dayIndex) => (
        <section key={day.id ?? dayIndex} className="flex flex-col gap-2">
          <header className="flex items-baseline gap-2">
            <h3 className="text-sm font-semibold text-foreground">{day.day_label}</h3>
            {day.day_of_week != null && <span className="text-xs text-muted-foreground">{t(`weekday.${day.day_of_week}` as "weekday.0")}</span>}
            <span className="text-xs text-muted-foreground">· {t("days.exerciseCount", { count: day.exercises.length })}</span>
          </header>
          {day.exercises.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("days.noExercises")}</p>
          ) : (
            <div className="dt-scroll">
              <table className="dt">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>#</th>
                    <th>{t("days.exercise")}</th>
                    <th className="text-right">{t("days.sets")}</th>
                    <th className="text-right">{t("days.reps")}</th>
                    <th className="text-right">{t("days.rpe")}</th>
                    <th>{t("days.tempo")}</th>
                    <th className="text-right">{t("days.rest")}</th>
                    <th>{t("days.notes")}</th>
                  </tr>
                </thead>
                <tbody>
                  {day.exercises.map((ex, exIndex) => (
                    <tr key={ex.id ?? exIndex}>
                      <td className="text-muted-foreground">{exIndex + 1}</td>
                      <td className="font-medium">{ex.exercise_name}</td>
                      <td className="text-right">{ex.sets}</td>
                      <td className="text-right">{ex.reps}</td>
                      <td className="text-right">{ex.target_rpe ?? "—"}</td>
                      <td>{ex.tempo || "—"}</td>
                      <td className="text-right">{ex.rest_seconds != null ? t("days.restValue", { seconds: ex.rest_seconds }) : "—"}</td>
                      <td className="text-muted-foreground">{ex.notes || ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
