"use client";

import React, { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { EntityComboField, FormDialog, FormSection, SwitchField, TextField } from "@/components/form";
import { planningOptionSources } from "@/modules/workouts";
import type { SeasonAssignInput } from "../types";

interface FormValues {
  client: number | null;
  start_date: string;
  name: string;
  activate: boolean;
}

interface AssignTemplateModalProps {
  open: boolean;
  template: { id: number; name: string } | null;
  onCancel: () => void;
  onSubmit: (values: SeasonAssignInput) => Promise<void>;
}

/** Giao mùa giải mẫu cho học viên: dời toàn bộ lịch theo ngày bắt đầu mới, sao chép giáo án + thực đơn. */
export function AssignTemplateModal({ open, template, onCancel, onSubmit }: AssignTemplateModalProps) {
  const t = useTranslations("seasons");
  const tv = useTranslations("validation");
  const form = useForm<FormValues>({ defaultValues: { client: null, start_date: "", name: "", activate: false } });

  useEffect(() => {
    if (open) form.reset({ client: null, start_date: "", name: template?.name ?? "", activate: false });
  }, [open, template, form]);

  return (
    <FormDialog
      open={open}
      onClose={onCancel}
      size="sm"
      title={t("assign.title")}
      description={t("assign.description", { name: template?.name ?? "" })}
      form={form}
      submitText={t("assign.submit")}
      onSubmit={async (v) => {
        if (!template || v.client == null) return;
        await onSubmit({ template: template.id, client: v.client, start_date: v.start_date, name: v.name.trim(), activate: v.activate });
      }}
    >
      <FormSection columns={1}>
        <EntityComboField<FormValues, { id: number; full_name: string; phone?: string | null }>
          name="client"
          label={t("fields.client")}
          placeholder={t("form.clientPlaceholder")}
          rules={{ required: tv("required", { field: t("fields.client") }) }}
          queryKey={["clients", "picker"]}
          fetchPage={planningOptionSources.clients}
          toOption={(c) => ({ value: String(c.id), label: c.full_name, description: c.phone ?? undefined })}
        />
        <TextField<FormValues>
          name="start_date"
          type="date"
          label={t("fields.startDate")}
          hint={t("assign.startHint")}
          rules={{ required: tv("required", { field: t("fields.startDate") }) }}
        />
        <TextField<FormValues> name="name" label={t("fields.name")} />
        <SwitchField<FormValues> name="activate" label={t("fields.activateNow")} hint={t("form.activateHint")} />
      </FormSection>
    </FormDialog>
  );
}
