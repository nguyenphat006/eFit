"use client";

import React, { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { EntityComboField, FormDialog, FormSection, SelectField, SwitchField, TextField, TextareaField } from "@/components/form";
import { statusOptions } from "@/components/common/StatusBadge";
import { planningOptionSources, type WorkoutProgramListItem } from "@/modules/workouts";
import { FITNESS_GOAL } from "../statusMap";
import type { FitnessGoal, SeasonCreateInput, SeasonItem, SeasonListItem } from "../types";

interface FormValues {
  name: string;
  client: number | null;
  goal_type: FitnessGoal;
  start_date: string;
  end_date: string;
  is_template: boolean;
  description: string;
  workout_template: number | null;
  activate: boolean;
}

interface SeasonFormModalProps {
  open: boolean;
  editing: SeasonItem | SeasonListItem | null;
  /** Học viên chọn sẵn khi tạo từ danh sách đã lọc `?client=` */
  defaultClient?: { id: number; name: string } | null;
  onCancel: () => void;
  onSubmit: (values: SeasonCreateInput) => Promise<void>;
}

const EMPTY: FormValues = {
  name: "",
  client: null,
  goal_type: "MAINTAINING",
  start_date: "",
  end_date: "",
  is_template: false,
  description: "",
  workout_template: null,
  activate: false,
};

/** Tạo / sửa mùa giải. Khi tạo: hệ thống tự sinh "Phase 1"; chọn giáo án mẫu thì được sao chép vào Phase 1. */
export function SeasonFormModal({ open, editing, defaultClient, onCancel, onSubmit }: SeasonFormModalProps) {
  const t = useTranslations("seasons");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const tr = useTranslations();
  const form = useForm<FormValues>({ defaultValues: EMPTY });
  const isTemplate = useWatch({ control: form.control, name: "is_template" });

  useEffect(() => {
    if (!open) return;
    form.reset(
      editing
        ? {
            ...EMPTY,
            name: editing.name,
            client: editing.client,
            goal_type: editing.goal_type,
            start_date: editing.start_date,
            end_date: editing.end_date,
            is_template: editing.is_template,
            description: editing.description ?? "",
          }
        : { ...EMPTY, client: defaultClient?.id ?? null },
    );
  }, [open, editing, defaultClient, form]);

  const clientInitial = useMemo(() => {
    if (editing?.client) return [{ value: String(editing.client), label: editing.client_name || `#${editing.client}` }];
    if (defaultClient) return [{ value: String(defaultClient.id), label: defaultClient.name }];
    return [];
  }, [editing, defaultClient]);

  return (
    <FormDialog
      open={open}
      onClose={onCancel}
      title={editing ? t("form.editTitle", { name: editing.name }) : t("form.createTitle")}
      form={form}
      submitText={editing ? tc("actions.saveChanges") : t("form.createTitle")}
      onSubmit={async (v) => {
        const base = {
          name: v.name.trim(),
          client: v.client,
          goal_type: v.goal_type,
          start_date: v.start_date,
          end_date: v.end_date,
          is_template: v.is_template,
          description: v.description.trim() || null,
        };
        await onSubmit(editing ? (base as SeasonCreateInput) : { ...base, workout_template: v.workout_template, activate: !v.is_template && v.activate });
      }}
    >
      <FormSection>
        <TextField<FormValues>
          name="name"
          label={t("fields.name")}
          placeholder={t("form.namePlaceholder")}
          className="form-section__full"
          rules={{ required: tv("required", { field: t("fields.name") }), maxLength: { value: 255, message: tv("maxLength", { max: 255 }) } }}
        />
        <EntityComboField<FormValues, { id: number; full_name: string; phone?: string | null }>
          name="client"
          label={t("fields.client")}
          hint={t("form.clientHint")}
          placeholder={t("form.clientPlaceholder")}
          queryKey={["clients", "picker"]}
          fetchPage={planningOptionSources.clients}
          toOption={(c) => ({ value: String(c.id), label: c.full_name, description: c.phone ?? undefined })}
          initialOptions={clientInitial}
        />
        <SelectField<FormValues> name="goal_type" label={t("fields.goal")} options={statusOptions(FITNESS_GOAL, tr)} />
        <TextField<FormValues>
          name="start_date"
          type="date"
          label={t("fields.startDate")}
          rules={{ required: tv("required", { field: t("fields.startDate") }) }}
        />
        <TextField<FormValues>
          name="end_date"
          type="date"
          label={t("fields.endDate")}
          rules={{
            required: tv("required", { field: t("fields.endDate") }),
            validate: (value, all) => !value || !all.start_date || value >= all.start_date || t("form.endAfterStart"),
          }}
        />
        <SwitchField<FormValues> name="is_template" label={t("fields.isTemplate")} hint={t("form.templateHint")} />
        {!editing && (
          <>
            <EntityComboField<FormValues, WorkoutProgramListItem>
              name="workout_template"
              label={t("fields.workoutTemplate")}
              hint={t("form.workoutTemplateHint")}
              placeholder={t("form.workoutTemplatePlaceholder")}
              queryKey={["workout-programs", "template-picker"]}
              fetchPage={(p) => planningOptionSources.programs({ ...p, is_template: true })}
              toOption={(p) => ({ value: String(p.id), label: p.name, description: t("form.programDays", { count: p.day_count }) })}
            />
            {!isTemplate && <SwitchField<FormValues> name="activate" label={t("fields.activateNow")} hint={t("form.activateHint")} />}
          </>
        )}
        <TextareaField<FormValues> name="description" label={tc("fields.description")} maxLength={1000} className="form-section__full" />
      </FormSection>
    </FormDialog>
  );
}
