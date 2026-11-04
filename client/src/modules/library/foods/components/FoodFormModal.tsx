"use client";

import React, { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { ComboboxField, FormDialog, FormSection, NumberField, SwitchField, TextField, TextareaField } from "@/components/form";
import { toDecimal, toNumber } from "@/constants/fitness";
import { useActiveFoodCategories } from "../hooks/useFoodsQuery";
import type { FoodCreateInput, FoodItem } from "../types";

interface FoodFormValues {
  name: string;
  category: number | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  base_unit: string;
  default_serving_name: string;
  default_serving_weight: number | null;
  image_url: string;
  description: string;
  is_system_data: boolean;
  is_active: boolean;
}

interface FoodFormModalProps {
  open: boolean;
  editing: FoodItem | null;
  /** Chỉ quản trị viên được đánh dấu dữ liệu hệ thống (backend cũng ép) */
  canSetSystemData: boolean;
  onCancel: () => void;
  /** Ném lỗi lại: FormDialog gắn lỗi backend vào từng ô nhập */
  onSubmit: (values: FoodCreateInput) => Promise<void>;
}

const EMPTY: FoodFormValues = {
  name: "",
  category: null,
  calories: null,
  protein: null,
  carbs: null,
  fat: null,
  fiber: 0,
  base_unit: "100g",
  default_serving_name: "",
  default_serving_weight: null,
  image_url: "",
  description: "",
  is_system_data: false,
  is_active: true,
};

export function FoodFormModal({ open, editing, canSetSystemData, onCancel, onSubmit }: FoodFormModalProps) {
  const t = useTranslations("foods");
  const tf = useTranslations("fitness");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const form = useForm<FoodFormValues>({ defaultValues: EMPTY });
  const { data: categories } = useActiveFoodCategories(open);

  const categoryOptions = useMemo(() => {
    const options = (categories?.results ?? []).map((c) => ({ value: String(c.id), label: c.category_name, code: c.category_code }));
    // Nhóm đang gán đã ngưng hoạt động vẫn hiện để không mất giá trị khi sửa
    if (editing && !options.some((o) => o.value === String(editing.category))) {
      options.push({ value: String(editing.category), label: editing.category_name, code: editing.category_code });
    }
    return options;
  }, [categories, editing]);

  useEffect(() => {
    if (!open) return;
    form.reset(
      editing
        ? {
            name: editing.name,
            category: editing.category,
            calories: toNumber(editing.calories),
            protein: toNumber(editing.protein),
            carbs: toNumber(editing.carbs),
            fat: toNumber(editing.fat),
            fiber: toNumber(editing.fiber),
            base_unit: editing.base_unit,
            default_serving_name: editing.default_serving_name ?? "",
            default_serving_weight: toNumber(editing.default_serving_weight),
            image_url: editing.image_url ?? "",
            description: editing.description ?? "",
            is_system_data: editing.is_system_data ?? false,
            is_active: editing.is_active ?? true,
          }
        : { ...EMPTY, is_system_data: canSetSystemData },
    );
  }, [open, editing, form, canSetSystemData]);

  const required = (field: string) => tv("required", { field });

  return (
    <FormDialog
      open={open}
      onClose={onCancel}
      size="md"
      title={editing ? t("form.editTitle", { name: editing.name }) : t("form.createTitle")}
      form={form}
      submitText={editing ? tc("actions.saveChanges") : t("form.createTitle")}
      onSubmit={async (v) => {
        await onSubmit({
          name: v.name.trim(),
          category: v.category as number,
          calories: toDecimal(v.calories) ?? "0",
          protein: toDecimal(v.protein) ?? "0",
          carbs: toDecimal(v.carbs) ?? "0",
          fat: toDecimal(v.fat) ?? "0",
          fiber: toDecimal(v.fiber),
          base_unit: v.base_unit.trim() || "100g",
          default_serving_name: v.default_serving_name.trim() || null,
          default_serving_weight: toDecimal(v.default_serving_weight),
          image_url: v.image_url.trim() || null,
          description: v.description.trim() || null,
          ...(canSetSystemData ? { is_system_data: v.is_system_data } : {}),
          is_active: v.is_active,
        });
      }}
    >
      <FormSection>
        <TextField<FoodFormValues>
          name="name"
          label={t("fields.name")}
          rules={{ required: required(t("fields.name")), maxLength: { value: 255, message: tv("maxLength", { max: 255 }) } }}
        />
        <ComboboxField<FoodFormValues>
          name="category"
          label={t("fields.category")}
          options={categoryOptions}
          numeric
          rules={{ required: required(t("fields.category")) }}
        />
        <TextField<FoodFormValues> name="base_unit" label={t("fields.baseUnit")} hint={t("fields.baseUnitHint")} rules={{ required: required(t("fields.baseUnit")) }} />
        <TextField<FoodFormValues> name="image_url" label={t("fields.imageUrl")} placeholder="https://" />
      </FormSection>
      <FormSection title={t("form.macros")}>
        <NumberField<FoodFormValues> name="calories" label={tf("fields.calories")} suffix={tf("units.kcal")} min={0} rules={{ required: required(tf("fields.calories")) }} />
        <NumberField<FoodFormValues> name="protein" label={tf("fields.protein")} suffix={tf("units.gram")} min={0} rules={{ required: required(tf("fields.protein")) }} />
        <NumberField<FoodFormValues> name="carbs" label={tf("fields.carbs")} suffix={tf("units.gram")} min={0} rules={{ required: required(tf("fields.carbs")) }} />
        <NumberField<FoodFormValues> name="fat" label={tf("fields.fat")} suffix={tf("units.gram")} min={0} rules={{ required: required(tf("fields.fat")) }} />
        <NumberField<FoodFormValues> name="fiber" label={tf("fields.fiber")} suffix={tf("units.gram")} min={0} />
        <TextField<FoodFormValues> name="default_serving_name" label={t("fields.servingName")} placeholder="1 chén" />
        <NumberField<FoodFormValues> name="default_serving_weight" label={t("fields.servingWeight")} suffix={tf("units.gram")} min={0} />
      </FormSection>
      <FormSection>
        <TextareaField<FoodFormValues> name="description" label={tc("fields.description")} maxLength={500} className="form-section__full" />
        {canSetSystemData && (
          <SwitchField<FoodFormValues> name="is_system_data" label={t("fields.isSystemData")} onText={t("source.system")} offText={t("source.user")} />
        )}
        <SwitchField<FoodFormValues> name="is_active" label={tc("fields.status")} onText={tc("status.active")} offText={tc("status.inactive")} />
      </FormSection>
    </FormDialog>
  );
}
