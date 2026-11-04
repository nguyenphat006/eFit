"use client";

import React, { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { EntityComboField, FormDialog, FormSection, NumberField, TextField, TextareaField } from "@/components/form";
import { planningOptionSources, type WorkoutProgramListItem } from "@/modules/workouts";
import type { PhaseCreateInput, PhaseItem, SeasonItem } from "../types";
import { macroCalories, toDecimalString, toNumber } from "./macroUtils";

interface FormValues {
  name: string;
  sort_order: number | null;
  start_date: string;
  end_date: string;
  target_calories: number | null;
  target_protein: number | null;
  target_carbs: number | null;
  target_fat: number | null;
  workout_program: number | null;
  description: string;
}

interface PhaseFormModalProps {
  open: boolean;
  season: SeasonItem;
  editing: PhaseItem | null;
  onCancel: () => void;
  onSubmit: (values: PhaseCreateInput) => Promise<void>;
}

/** Thêm / sửa giai đoạn: thời gian (nằm trong mùa giải, không chồng lấn), mục tiêu macro, giáo án (chụp snapshot khi đổi). */
export function PhaseFormModal({ open, season, editing, onCancel, onSubmit }: PhaseFormModalProps) {
  const t = useTranslations("seasons");
  const tf = useTranslations("fitness");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const form = useForm<FormValues>();
  const [protein, carbs, fat] = useWatch({ control: form.control, name: ["target_protein", "target_carbs", "target_fat"] });

  useEffect(() => {
    if (!open) return;
    const last = season.phases[season.phases.length - 1];
    form.reset(
      editing
        ? {
            name: editing.name,
            sort_order: editing.sort_order,
            start_date: editing.start_date,
            end_date: editing.end_date,
            target_calories: toNumber(editing.target_calories),
            target_protein: toNumber(editing.target_protein),
            target_carbs: toNumber(editing.target_carbs),
            target_fat: toNumber(editing.target_fat),
            workout_program: editing.workout_program,
            description: editing.description ?? "",
          }
        : {
            name: t("phases.defaultName", { n: season.phases.length + 1 }),
            sort_order: (last?.sort_order ?? 0) + 1,
            start_date: "",
            end_date: season.end_date,
            target_calories: null,
            target_protein: null,
            target_carbs: null,
            target_fat: null,
            workout_program: null,
            description: "",
          },
    );
  }, [open, editing, season, form, t]);

  const programInitial = useMemo(
    () => (editing?.workout_program ? [{ value: String(editing.workout_program), label: editing.workout_program_name || `#${editing.workout_program}` }] : []),
    [editing],
  );
  const suggestedCalories = macroCalories(protein, carbs, fat);

  return (
    <FormDialog
      open={open}
      onClose={onCancel}
      size="lg"
      title={editing ? t("phases.editTitle", { name: editing.name }) : t("phases.createTitle")}
      description={t("phases.rangeHint", { start: season.start_date, end: season.end_date })}
      form={form}
      submitText={editing ? tc("actions.saveChanges") : t("phases.createTitle")}
      onSubmit={async (v) => {
        await onSubmit({
          season: season.id,
          name: v.name.trim(),
          sort_order: v.sort_order ?? 0,
          start_date: v.start_date,
          end_date: v.end_date,
          target_calories: toDecimalString(v.target_calories),
          target_protein: toDecimalString(v.target_protein),
          target_carbs: toDecimalString(v.target_carbs),
          target_fat: toDecimalString(v.target_fat),
          workout_program: v.workout_program,
          description: v.description.trim() || null,
        });
      }}
    >
      <FormSection title={t("phases.sectionInfo")} columns={3}>
        <TextField<FormValues>
          name="name"
          label={t("phases.name")}
          className="form-section__full"
          rules={{ required: tv("required", { field: t("phases.name") }) }}
        />
        <TextField<FormValues> name="start_date" type="date" label={t("fields.startDate")} rules={{ required: tv("required", { field: t("fields.startDate") }) }} />
        <TextField<FormValues>
          name="end_date"
          type="date"
          label={t("fields.endDate")}
          rules={{
            required: tv("required", { field: t("fields.endDate") }),
            validate: (value, all) => !value || !all.start_date || value >= all.start_date || t("form.endAfterStart"),
          }}
        />
        <NumberField<FormValues> name="sort_order" label={t("phases.sortOrder")} min={0} />
      </FormSection>
      <FormSection title={t("phases.sectionMacros")} description={t("phases.macrosHint")} columns={2}>
        <NumberField<FormValues> name="target_protein" label={tf("fields.protein")} min={0} suffix={tf("units.gram")} />
        <NumberField<FormValues> name="target_carbs" label={tf("fields.carbs")} min={0} suffix={tf("units.gram")} />
        <NumberField<FormValues> name="target_fat" label={tf("fields.fat")} min={0} suffix={tf("units.gram")} />
        <NumberField<FormValues>
          name="target_calories"
          label={tf("fields.calories")}
          min={0}
          suffix={tf("units.kcal")}
          hint={suggestedCalories ? t("phases.caloriesFromMacros", { kcal: suggestedCalories }) : undefined}
        />
      </FormSection>
      <FormSection title={t("phases.sectionWorkout")} columns={1}>
        <EntityComboField<FormValues, WorkoutProgramListItem>
          name="workout_program"
          label={t("phases.workoutProgram")}
          hint={t("phases.workoutProgramHint")}
          placeholder={t("phases.workoutProgramPlaceholder")}
          queryKey={["workout-programs", "phase-picker"]}
          fetchPage={planningOptionSources.programs}
          toOption={(p) => ({ value: String(p.id), label: p.name, description: p.client_name || undefined })}
          initialOptions={programInitial}
        />
        <TextareaField<FormValues> name="description" label={tc("fields.description")} maxLength={1000} />
      </FormSection>
    </FormDialog>
  );
}
