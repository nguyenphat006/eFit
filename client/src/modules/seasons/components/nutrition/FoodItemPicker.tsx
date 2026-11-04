"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Combobox } from "@/components/controls/Combobox";
import { useEntityOptions } from "@/components/controls/useEntityOptions";
import type { Schemas } from "@/types/api";
import { foodOptionSources } from "../../services/season.service";

type FoodItem = Schemas["FoodItem"];

interface FoodItemPickerProps {
  value: number | null;
  currentName: string;
  /** Lọc theo nhóm thực phẩm đang chọn của món */
  categoryId: number | null;
  onChange: (food: { id: number; name: string } | null) => void;
}

const toOption = (f: FoodItem) => ({ value: String(f.id), label: f.name, code: f.category_code, description: `${f.category_name} · ${f.base_unit}` });

/** Chọn thực phẩm từ thư viện (tìm ở server, lọc theo nhóm). */
export function FoodItemPicker({ value, currentName, categoryId, onChange }: FoodItemPickerProps) {
  const t = useTranslations("seasons");
  const initialOptions = useMemo(() => (value ? [{ value: String(value), label: currentName || `#${value}` }] : []), [value, currentName]);
  const opts = useEntityOptions<FoodItem>({
    queryKey: ["food-items", "picker", categoryId ?? "all"],
    fetchPage: (p) => foodOptionSources.foods({ ...p, ...(categoryId ? { category: categoryId } : {}) }),
    toOption,
    initialOptions,
  });
  return (
    <Combobox
      options={opts.options}
      value={value == null ? null : String(value)}
      onChange={(v) => onChange(v === null ? null : { id: Number(v), name: opts.options.find((o) => o.value === v)?.label ?? "" })}
      placeholder={t("nutrition.foodPlaceholder")}
      onSearch={opts.onSearch}
      onReachEnd={opts.onReachEnd}
      onOpenChange={opts.onOpenChange}
      loading={opts.loading}
      hasMore={opts.hasMore}
      allowClear
    />
  );
}
