"use client";

import React, { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { FormProvider, useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { statusOptions } from "@/components/common/StatusBadge";
import { FormSection, NumberField, SelectField, TextField } from "@/components/form";
import { FITNESS_GOAL, GENDER, toDecimal, toNumber } from "@/constants/fitness";
import { extractErrorMessage } from "@/lib/api/errorUtils";
import { applyServerErrors } from "@/lib/api/formErrors";
import { useFitnessProfileQuery, useUpdateFitnessProfileMutation } from "../hooks/useProfileQuery";
import type { FitnessProfile, FitnessProfileInput } from "../types";

interface FitnessFormValues {
  gender: string;
  date_of_birth: string;
  height_cm: number | null;
  current_weight: number | null;
  body_fat_percentage: number | null;
  activity_level: number | null;
  fitness_goal: string;
  training_frequency: number | null;
}

const EMPTY: FitnessFormValues = {
  gender: "",
  date_of_birth: "",
  height_cm: null,
  current_weight: null,
  body_fat_percentage: null,
  activity_level: 1.2,
  fitness_goal: "MAINTAINING",
  training_frequency: null,
};

function toValues(p: FitnessProfile): FitnessFormValues {
  return {
    gender: p.gender ?? "",
    date_of_birth: p.date_of_birth ?? "",
    height_cm: toNumber(p.height_cm),
    current_weight: toNumber(p.current_weight),
    body_fat_percentage: toNumber(p.body_fat_percentage),
    activity_level: toNumber(p.activity_level),
    fitness_goal: p.fitness_goal ?? "MAINTAINING",
    training_frequency: p.training_frequency ?? null,
  };
}

/** Hồ sơ thể chất của chính người dùng (giới tính, chiều cao, cân nặng, hệ số vận động, mục tiêu) — form inline. */
export function ProfileFitnessTab() {
  const t = useTranslations("profile");
  const tf = useTranslations("fitness");
  const tc = useTranslations("common");
  const tr = useTranslations();
  const { data: profile, isLoading } = useFitnessProfileQuery();
  const updateMutation = useUpdateFitnessProfileMutation();
  const form = useForm<FitnessFormValues>({ defaultValues: EMPTY });
  const { isDirty } = form.formState;

  useEffect(() => {
    if (profile) form.reset(toValues(profile));
  }, [profile, form]);

  const genderOptions = useMemo(() => statusOptions(GENDER, tr), [tr]);
  const goalOptions = useMemo(() => statusOptions(FITNESS_GOAL, tr), [tr]);

  const onSubmit = form.handleSubmit(async (v) => {
    const payload: FitnessProfileInput = {
      gender: (v.gender || null) as FitnessProfileInput["gender"],
      date_of_birth: v.date_of_birth || null,
      height_cm: toDecimal(v.height_cm),
      current_weight: toDecimal(v.current_weight),
      body_fat_percentage: toDecimal(v.body_fat_percentage),
      activity_level: toDecimal(v.activity_level),
      fitness_goal: v.fitness_goal as FitnessProfileInput["fitness_goal"],
      training_frequency: v.training_frequency,
    };
    try {
      await updateMutation.mutateAsync(payload);
    } catch (error) {
      if (!applyServerErrors(form, error)) toast.error(extractErrorMessage(error, t("fitness.updateFailed")));
    }
  });

  if (isLoading) return <Skeleton className="h-72 w-full" />;

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} noValidate className="max-w-3xl rounded-lg border bg-card p-5">
        <fieldset disabled={updateMutation.isPending}>
          <FormSection title={t("fitness.title")} description={t("fitness.description")}>
            <SelectField<FitnessFormValues> name="gender" label={tf("fields.gender")} options={genderOptions} />
            <TextField<FitnessFormValues> name="date_of_birth" label={tf("fields.dateOfBirth")} type="date" />
            <NumberField<FitnessFormValues> name="height_cm" label={tf("fields.height")} suffix={tf("units.cm")} min={0} />
            <NumberField<FitnessFormValues> name="current_weight" label={tf("fields.weight")} suffix={tf("units.kg")} min={0} />
            <NumberField<FitnessFormValues> name="body_fat_percentage" label={tf("fields.bodyFat")} suffix={tf("units.percent")} min={0} max={100} />
            <NumberField<FitnessFormValues> name="activity_level" label={tf("fields.activityLevel")} hint={tf("fields.activityLevelHint")} min={1.2} max={1.9} />
            <SelectField<FitnessFormValues> name="fitness_goal" label={tf("fields.goal")} options={goalOptions} />
            <NumberField<FitnessFormValues> name="training_frequency" label={tf("fields.trainingFrequency")} suffix={tf("units.perWeek")} min={0} max={14} />
          </FormSection>
          <div className="flex justify-end border-t pt-4">
            <Button type="submit" disabled={updateMutation.isPending || !isDirty}>
              {updateMutation.isPending && <Loader2 className="animate-spin" />}
              {tc("actions.saveChanges")}
            </Button>
          </div>
        </fieldset>
      </form>
    </FormProvider>
  );
}
