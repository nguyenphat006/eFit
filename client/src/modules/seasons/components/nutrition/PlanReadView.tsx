"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useNumberFormat } from "@/providers/NumberFormatProvider";
import type { NutritionPlanItem, PhaseItem } from "../../types";
import { sumMacros, toNumber } from "../macroUtils";

/** Xem thực đơn: từng bữa + món (món chính, món thay thế, macro) và tổng so với mục tiêu giai đoạn. */
export function PlanReadView({ plan, phase }: { plan: NutritionPlanItem; phase: PhaseItem }) {
  const t = useTranslations("seasons");
  const tf = useTranslations("fitness");
  const { formatNumber } = useNumberFormat();
  const total = sumMacros(plan.meals);
  const macro = (p: string | number | null, c: string | number | null, f: string | number | null) =>
    t("phases.macroValue", { p: formatNumber(p, 0), c: formatNumber(c, 0), f: formatNumber(f, 0) });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span>
          <span className="text-muted-foreground">{t("nutrition.planTotal")}: </span>
          <strong>{formatNumber(total.calories, 0)} {tf("units.kcal")}</strong> · {macro(total.protein, total.carbs, total.fat)}
        </span>
        <span>
          <span className="text-muted-foreground">{t("nutrition.phaseTarget")}: </span>
          {formatNumber(phase.target_calories, 0)} {tf("units.kcal")} · {macro(phase.target_protein, phase.target_carbs, phase.target_fat)}
        </span>
      </div>
      {plan.notes && <p className="text-sm text-muted-foreground">{plan.notes}</p>}
      {plan.meals.map((meal) => (
        <section key={meal.id} className="flex flex-col gap-2">
          <header className="flex flex-wrap items-baseline gap-2">
            <h3 className="text-sm font-semibold">{meal.name}</h3>
            <span className="text-xs text-muted-foreground">
              {formatNumber(meal.target_calories, 0)} {tf("units.kcal")} · {macro(meal.target_protein, meal.target_carbs, meal.target_fat)}
            </span>
          </header>
          {meal.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("nutrition.noItems")}</p>
          ) : (
            <div className="dt-scroll">
              <table className="dt">
                <thead>
                  <tr>
                    <th>{t("nutrition.category")}</th>
                    <th>{t("nutrition.primaryFood")}</th>
                    <th>{t("nutrition.alternatives")}</th>
                    <th className="text-right">{tf("fields.calories")}</th>
                    <th className="text-right">{t("phases.macros")}</th>
                  </tr>
                </thead>
                <tbody>
                  {meal.items.map((item) => (
                    <tr key={item.id}>
                      <td className="text-muted-foreground">{item.food_category_name}</td>
                      <td className="font-medium">{item.primary_food_text}</td>
                      <td className="text-muted-foreground">{item.alternatives_text || "—"}</td>
                      <td className="text-right">{formatNumber(toNumber(item.target_calories), 0)}</td>
                      <td className="text-right whitespace-nowrap">{macro(item.target_protein, item.target_carbs, item.target_fat)}</td>
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
