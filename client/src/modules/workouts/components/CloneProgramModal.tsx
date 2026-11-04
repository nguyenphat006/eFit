"use client";

import React, { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { EntityComboField, FormDialog, FormSection, SwitchField, TextField } from "@/components/form";
import { planningOptionSources } from "../services/workoutProgram.service";
import type { WorkoutProgramCloneInput } from "../types";

interface FormValues {
  client: number | null;
  name: string;
  is_template: boolean;
}

interface CloneProgramModalProps {
  open: boolean;
  sourceName: string;
  onCancel: () => void;
  onSubmit: (values: WorkoutProgramCloneInput) => Promise<void>;
}

/** Sao chép giáo án: gán cho học viên, giữ cho chính mình, hoặc tạo thành giáo án mẫu. */
export function CloneProgramModal({ open, sourceName, onCancel, onSubmit }: CloneProgramModalProps) {
  const t = useTranslations("workouts");
  const form = useForm<FormValues>({ defaultValues: { client: null, name: "", is_template: false } });

  useEffect(() => {
    if (open) form.reset({ client: null, name: sourceName, is_template: false });
  }, [open, sourceName, form]);

  return (
    <FormDialog
      open={open}
      onClose={onCancel}
      size="sm"
      title={t("clone.title")}
      description={t("clone.description", { name: sourceName })}
      form={form}
      submitText={t("clone.submit")}
      onSubmit={(v) => onSubmit({ client: v.client, name: v.name.trim(), is_template: v.is_template })}
    >
      <FormSection columns={1}>
        <EntityComboField<FormValues, { id: number; full_name: string; phone?: string | null }>
          name="client"
          label={t("fields.client")}
          hint={t("form.clientHint")}
          placeholder={t("form.clientPlaceholder")}
          queryKey={["clients", "picker"]}
          fetchPage={planningOptionSources.clients}
          toOption={(c) => ({ value: String(c.id), label: c.full_name, description: c.phone ?? undefined })}
        />
        <TextField<FormValues> name="name" label={t("fields.name")} />
        <SwitchField<FormValues> name="is_template" label={t("clone.asTemplate")} />
      </FormSection>
    </FormDialog>
  );
}
