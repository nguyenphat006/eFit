"use client";

import React, { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { EntityComboField, FormDialog, FormSection, NumberField, SwitchField, TextField, TextareaField } from "@/components/form";
import { planningOptionSources } from "../services/workoutProgram.service";
import type { WorkoutProgramCreateInput, WorkoutProgramItem, WorkoutProgramListItem } from "../types";

interface FormValues {
  name: string;
  client: number | null;
  frequency_per_week: number | null;
  start_date: string;
  end_date: string;
  is_template: boolean;
  notes: string;
}

interface WorkoutProgramFormModalProps {
  open: boolean;
  editing: WorkoutProgramItem | WorkoutProgramListItem | null;
  onCancel: () => void;
  /** Ném lỗi lại: FormDialog gắn lỗi backend vào từng ô nhập */
  onSubmit: (values: Partial<WorkoutProgramCreateInput>) => Promise<void>;
}

const EMPTY: FormValues = { name: "", client: null, frequency_per_week: null, start_date: "", end_date: "", is_template: true, notes: "" };

/** Thông tin chung của giáo án (buổi tập sửa trong trang chi tiết). */
export function WorkoutProgramFormModal({ open, editing, onCancel, onSubmit }: WorkoutProgramFormModalProps) {
  const t = useTranslations("workouts");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const form = useForm<FormValues>({ defaultValues: EMPTY });

  useEffect(() => {
    if (!open) return;
    form.reset(
      editing
        ? {
            name: editing.name,
            client: editing.client ?? null,
            frequency_per_week: editing.frequency_per_week ?? null,
            start_date: editing.start_date ?? "",
            end_date: editing.end_date ?? "",
            is_template: editing.is_template,
            notes: editing.notes ?? "",
          }
        : EMPTY,
    );
  }, [open, editing, form]);

  const clientInitial = useMemo(
    () => (editing?.client ? [{ value: String(editing.client), label: editing.client_name || `#${editing.client}` }] : []),
    [editing],
  );

  return (
    <FormDialog
      open={open}
      onClose={onCancel}
      title={editing ? t("form.editTitle", { name: editing.name }) : t("form.createTitle")}
      form={form}
      submitText={editing ? tc("actions.saveChanges") : t("form.createTitle")}
      onSubmit={async (v) => {
        await onSubmit({
          name: v.name.trim(),
          client: v.client,
          frequency_per_week: v.frequency_per_week ?? 0,
          start_date: v.start_date || null,
          end_date: v.end_date || null,
          is_template: v.is_template,
          notes: v.notes.trim() || null,
        });
      }}
    >
      <FormSection>
        <TextField<FormValues>
          name="name"
          label={t("fields.name")}
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
        <NumberField<FormValues>
          name="frequency_per_week"
          label={t("fields.frequency")}
          hint={t("form.frequencyHint")}
          min={0}
          max={7}
          suffix={t("units.perWeek")}
        />
        <TextField<FormValues> name="start_date" type="date" label={t("fields.startDate")} />
        <TextField<FormValues> name="end_date" type="date" label={t("fields.endDate")} />
        <SwitchField<FormValues> name="is_template" label={t("fields.isTemplate")} onText={t("kind.template")} offText={t("kind.program")} />
        <TextareaField<FormValues> name="notes" label={t("fields.notes")} maxLength={1000} className="form-section__full" />
      </FormSection>
    </FormDialog>
  );
}
