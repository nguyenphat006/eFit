"use client";

import React, { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { FormDialog, FormSection, NumberField, SwitchField, TextField, TextareaField } from "@/components/form";
import type { FoodCategoryCreateInput, FoodCategoryItem, FoodCategoryUpdateInput } from "../types";

interface FoodCategoryFormValues {
  category_code: string;
  category_name: string;
  sort_order: number | null;
  description: string;
  is_active: boolean;
}

interface FoodCategoryFormModalProps {
  open: boolean;
  editing: FoodCategoryItem | null;
  onCancel: () => void;
  /** Ném lỗi lại: FormDialog gắn lỗi backend vào từng ô nhập */
  onSubmit: (values: FoodCategoryCreateInput | FoodCategoryUpdateInput) => Promise<void>;
}

const EMPTY: FoodCategoryFormValues = { category_code: "", category_name: "", sort_order: 0, description: "", is_active: true };

export function FoodCategoryFormModal({ open, editing, onCancel, onSubmit }: FoodCategoryFormModalProps) {
  const t = useTranslations("foodCategories");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const form = useForm<FoodCategoryFormValues>({ defaultValues: EMPTY });
  const isEditing = Boolean(editing);

  useEffect(() => {
    if (!open) return;
    form.reset(
      editing
        ? {
            category_code: editing.category_code,
            category_name: editing.category_name,
            sort_order: editing.sort_order ?? 0,
            description: editing.description ?? "",
            is_active: editing.is_active ?? true,
          }
        : EMPTY,
    );
  }, [open, editing, form]);

  return (
    <FormDialog
      open={open}
      onClose={onCancel}
      title={isEditing ? t("form.editTitle", { code: editing?.category_code ?? "" }) : t("form.createTitle")}
      form={form}
      submitText={isEditing ? tc("actions.saveChanges") : t("form.createTitle")}
      onSubmit={async (v) => {
        const common = {
          category_name: v.category_name.trim(),
          sort_order: v.sort_order ?? 0,
          description: v.description.trim() || null,
          is_active: v.is_active,
        };
        await onSubmit(isEditing ? common : { ...common, category_code: v.category_code.trim().toUpperCase() });
      }}
    >
      <FormSection>
        <TextField<FoodCategoryFormValues>
          name="category_code"
          label={tc("fields.code")}
          disabled={isEditing}
          transform={(v) => v.toUpperCase()}
          inputClassName="font-mono font-semibold"
          rules={{
            required: isEditing ? false : tv("required", { field: tc("fields.code") }),
            pattern: { value: /^[A-Z0-9_]+$/, message: t("form.codeFormat") },
            maxLength: { value: 50, message: tv("maxLength", { max: 50 }) },
          }}
        />
        <TextField<FoodCategoryFormValues>
          name="category_name"
          label={t("fields.name")}
          rules={{ required: tv("required", { field: t("fields.name") }), maxLength: { value: 255, message: tv("maxLength", { max: 255 }) } }}
        />
        <NumberField<FoodCategoryFormValues> name="sort_order" label={t("fields.sortOrder")} min={0} />
        <SwitchField<FoodCategoryFormValues> name="is_active" label={tc("fields.status")} onText={tc("status.active")} offText={tc("status.inactive")} />
        <TextareaField<FoodCategoryFormValues> name="description" label={tc("fields.description")} maxLength={500} className="form-section__full" />
      </FormSection>
    </FormDialog>
  );
}
