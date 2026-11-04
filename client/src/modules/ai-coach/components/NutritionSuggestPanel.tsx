"use client";

import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormSection, NumberField, SelectField, TextareaField } from "@/components/form";
import { applyServerErrors } from "@/lib/api/formErrors";
import { extractErrorMessage } from "@/lib/api/errorUtils";
import { useSuggestNutritionMutation } from "../hooks/useAiCoach";
import type { FitnessGoal } from "../types";
import { AiText } from "./AiText";

interface SuggestValues {
  goal: FitnessGoal;
  gender: string | null;
  age: number | null;
  height: number | null;
  current_weight: number | null;
  body_fat_percentage: number | null;
  activity_level: number | null;
  phase_description: string;
}

const DEFAULTS: SuggestValues = {
  goal: "MAINTAINING", gender: null, age: null, height: null, current_weight: null,
  body_fat_percentage: null, activity_level: 1.375, phase_description: "",
};
const GOALS: FitnessGoal[] = ["BULKING", "CUTTING", "MAINTAINING", "RECOMP"];

/** Gợi ý mục tiêu macro / ngày (AI hoặc tính offline khi chưa cấu hình AI). */
export function NutritionSuggestPanel() {
  const t = useTranslations("aiCoach.suggest");
  const tf = useTranslations("fitness");
  const form = useForm<SuggestValues>({ defaultValues: DEFAULTS });
  const suggest = useSuggestNutritionMutation();
  const result = suggest.data;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await suggest.mutateAsync({ ...values, gender: values.gender || null });
    } catch (error) {
      if (!applyServerErrors(form, error)) toast.error(extractErrorMessage(error, t("error")));
    }
  });

  return (
    <section className="dash-panel flex flex-col gap-4">
      <h2 className="dash-panel__title m-0">{t("title")}</h2>
      <FormProvider {...form}>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <FormSection>
            <SelectField<SuggestValues> name="goal" label={t("goal")} options={GOALS.map((g) => ({ value: g, label: tf(`goal.${g}`) }))} />
            <SelectField<SuggestValues>
              name="gender" label={t("gender")}
              options={(["MALE", "FEMALE", "OTHER"] as const).map((g) => ({ value: g, label: tf(`gender.${g}`) }))}
            />
            <NumberField<SuggestValues> name="age" label={t("age")} min={10} max={100} />
            <NumberField<SuggestValues> name="height" label={t("height")} suffix="cm" min={50} max={250} />
            <NumberField<SuggestValues> name="current_weight" label={t("weight")} suffix="kg" min={20} max={400} />
            <NumberField<SuggestValues> name="body_fat_percentage" label={t("bodyFat")} suffix="%" min={1} max={70} />
            <NumberField<SuggestValues> name="activity_level" label={t("activity")} hint={t("activityHint")} min={1.2} max={1.9} />
            <TextareaField<SuggestValues> name="phase_description" label={t("phase")} rows={2} className="form-section__full" />
          </FormSection>
          <Button type="submit" className="self-start" disabled={suggest.isPending}>
            {suggest.isPending ? t("running") : t("submit")}
          </Button>
        </form>
      </FormProvider>

      {result && (
        <div className="flex flex-col gap-3 rounded-lg border bg-[var(--c-bg-subtle)] p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {([
              ["calories", result.calories, "kcal"],
              ["protein", result.protein, "g"],
              ["carbs", result.carbs, "g"],
              ["fat", result.fat, "g"],
            ] as const).map(([key, value, unit]) => (
              <div key={key}>
                <p className="m-0 text-xs text-muted-foreground">{t(`macros.${key}`)}</p>
                <p className="m-0 text-xl font-bold tabular-nums">
                  {value.toLocaleString("vi-VN")} <span className="text-sm font-normal text-muted-foreground">{unit}</span>
                </p>
              </div>
            ))}
          </div>
          <p className="m-0 text-xs text-muted-foreground">{result.source === "ai" ? t("sourceAi") : t("sourceOffline")}</p>
          <AiText text={result.explanation} />
        </div>
      )}
    </section>
  );
}
