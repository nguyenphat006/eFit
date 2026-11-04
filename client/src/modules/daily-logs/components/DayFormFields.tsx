"use client";

import React from "react";
import { useController, useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUpload } from "@/components/controls/ImageUpload";
import { FieldShell, FormSection, NumberField, SelectField, SwitchField, TextField, TextareaField } from "@/components/form";
import type { PhaseNutritionPlan } from "../types";
import { dailyLogService } from "../services/dailyLog.service";
import type { DayFormValues } from "./dayFormUtils";

const MAX_IMAGES = 20;

/** Tick các bữa đã ăn theo thực đơn của giai đoạn — backend cộng macro thực nạp từ các bữa này. */
function MealChecklist({ plan, disabled }: { plan: PhaseNutritionPlan; disabled?: boolean }) {
  const t = useTranslations("dailyLogs.form");
  const { field } = useController<DayFormValues, "diet_completed_meal_ids">({ name: "diet_completed_meal_ids" });
  const selected = new Set(field.value);
  const toggle = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    field.onChange([...next]);
  };
  return (
    <FieldShell id="diet-meals" label={t("meals")} hint={t("mealsHint")} className="form-section__full">
      <ul className="m-0 flex list-none flex-col gap-2 p-0" id="diet-meals">
        {plan.meals.map((meal) => (
          <li key={meal.id}>
            <label className="flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm">
              <Checkbox checked={selected.has(meal.id)} onCheckedChange={() => toggle(meal.id)} disabled={disabled} />
              <span className="flex-1 font-medium">{meal.name}</span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {Math.round(Number(meal.target_calories))} kcal · P {Math.round(Number(meal.target_protein))} · C {Math.round(Number(meal.target_carbs))} · F {Math.round(Number(meal.target_fat))}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </FieldShell>
  );
}

/** Ảnh check-in: danh sách ảnh đã tải + ô tải thêm. */
function BodyImagesField({ disabled }: { disabled?: boolean }) {
  const t = useTranslations("dailyLogs.form");
  const { field } = useController<DayFormValues, "body_images">({ name: "body_images" });
  const images = field.value;
  const upload = async (file: File) => (await dailyLogService.uploadImage(file)).image_url;
  return (
    <FieldShell id="body-images" label={t("bodyImages")} hint={t("bodyImagesHint")} className="form-section__full">
      <div className="flex flex-col gap-3" id="body-images">
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {images.map((url, idx) => (
              <div key={url} className="relative size-20 overflow-hidden rounded-lg border">
                {/* eslint-disable-next-line @next/next/no-img-element -- ảnh check-in từ API media */}
                <img src={url} alt={t("bodyImageAlt", { index: idx + 1 })} className="size-full object-cover" />
                {!disabled && (
                  <Button
                    type="button" variant="destructive" size="icon" className="absolute top-1 right-1 size-5 rounded"
                    aria-label={t("removeImage")} onClick={() => field.onChange(images.filter((u) => u !== url))}
                  >
                    <X className="size-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
        {!disabled && images.length < MAX_IMAGES && (
          <ImageUpload value={null} upload={upload} onChange={(url) => url && field.onChange([...images, url])} />
        )}
      </div>
    </FieldShell>
  );
}

/** Các nhóm trường của panel ngày. `plan` có -> chọn bữa đã ăn thay cho nhập macro tay. */
export function DayFormFields({ plan, readOnly }: { plan: PhaseNutritionPlan | null; readOnly?: boolean }) {
  const t = useTranslations("dailyLogs.form");
  const tf = useTranslations("fitness");
  const { watch } = useFormContext<DayFormValues>();
  const workoutDone = watch("is_workout_completed");
  const fatigueOptions = (["1", "2", "3", "4", "5"] as const).map((v) => ({ value: v, label: t(`fatigue.${v}`) }));
  const cheatOptions = (["NONE", "PLANNED", "UNPLANNED"] as const).map((v) => ({ value: v, label: tf(`cheatStatus.${v}`) }));

  return (
    <>
      <FormSection title={t("sections.body")}>
        <NumberField<DayFormValues> name="weight" label={t("weight")} suffix="kg" min={0} disabled={readOnly} />
        <NumberField<DayFormValues> name="sleep_hours" label={t("sleepHours")} suffix={t("hours")} min={0} max={24} disabled={readOnly} />
        <NumberField<DayFormValues> name="work_hours" label={t("workHours")} suffix={t("hours")} min={0} max={24} disabled={readOnly} />
        <SelectField<DayFormValues> name="fatigue_level" label={t("fatigueLevel")} options={fatigueOptions} disabled={readOnly} />
      </FormSection>

      <FormSection title={t("sections.training")}>
        <SwitchField<DayFormValues> name="is_workout_completed" label={t("workout")} onText={t("workoutDone")} offText={t("workoutPending")} disabled={readOnly} />
        <NumberField<DayFormValues> name="steps" label={t("steps")} min={0} disabled={readOnly} />
        <NumberField<DayFormValues> name="cardio_duration_minutes" label={t("cardioMinutes")} suffix={t("minutes")} min={0} disabled={readOnly} />
        <TextField<DayFormValues> name="cardio_type" label={t("cardioType")} placeholder={t("cardioTypePlaceholder")} disabled={readOnly} />
        {!workoutDone && <p className="form-section__full m-0 text-xs text-muted-foreground">{t("workoutHint")}</p>}
      </FormSection>

      <FormSection title={t("sections.nutrition")}>
        {plan && plan.meals.length > 0 ? (
          <MealChecklist plan={plan} disabled={readOnly} />
        ) : (
          <>
            <NumberField<DayFormValues> name="diet_meals_completed" label={t("mealsCompleted")} min={0} disabled={readOnly} />
            <NumberField<DayFormValues> name="diet_target_meals" label={t("mealsTarget")} min={1} disabled={readOnly} />
            <NumberField<DayFormValues> name="calories_in" label={t("calories")} suffix="kcal" min={0} disabled={readOnly} />
            <NumberField<DayFormValues> name="protein_in" label={t("protein")} suffix="g" min={0} disabled={readOnly} />
            <NumberField<DayFormValues> name="carbs_in" label={t("carbs")} suffix="g" min={0} disabled={readOnly} />
            <NumberField<DayFormValues> name="fat_in" label={t("fat")} suffix="g" min={0} disabled={readOnly} />
          </>
        )}
        <SelectField<DayFormValues> name="diet_cheat_status" label={t("cheatStatus")} options={cheatOptions} disabled={readOnly} />
        <TextareaField<DayFormValues> name="diet_notes" label={t("dietNotes")} rows={2} className="form-section__full" disabled={readOnly} />
      </FormSection>

      <FormSection title={t("sections.measurements")} columns={3}>
        <NumberField<DayFormValues> name="chest_measure" label={t("chest")} suffix="cm" min={0} disabled={readOnly} />
        <NumberField<DayFormValues> name="waist_measure" label={t("waist")} suffix="cm" min={0} disabled={readOnly} />
        <NumberField<DayFormValues> name="hips_measure" label={t("hips")} suffix="cm" min={0} disabled={readOnly} />
        <NumberField<DayFormValues> name="arm_measure" label={t("arm")} suffix="cm" min={0} disabled={readOnly} />
        <NumberField<DayFormValues> name="leg_measure" label={t("leg")} suffix="cm" min={0} disabled={readOnly} />
      </FormSection>

      <FormSection title={t("sections.notes")}>
        <BodyImagesField disabled={readOnly} />
        <TextareaField<DayFormValues> name="compliance_notes" label={t("complianceNotes")} rows={2} className="form-section__full" disabled={readOnly} />
      </FormSection>
    </>
  );
}
