"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Combobox } from "@/components/controls/Combobox";
import { useEntityOptions } from "@/components/controls/useEntityOptions";
import type { Schemas } from "@/types/api";
import { planningOptionSources } from "../../services/workoutProgram.service";

type ExerciseItem = Schemas["Exercise"];

interface ExercisePickerProps {
  value: number | null;
  /** Tên đang lưu (snapshot) — hiện ngay khi chưa tải danh sách */
  currentName: string;
  onChange: (exercise: { id: number; name: string } | null) => void;
  id?: string;
}

const toOption = (e: ExerciseItem) => ({ value: String(e.id), label: e.name, description: [e.body_part, e.equipment].filter(Boolean).join(" · ") || undefined });

/** Chọn bài tập từ thư viện (tìm ở server, cuộn vô hạn). */
export function ExercisePicker({ value, currentName, onChange, id }: ExercisePickerProps) {
  const t = useTranslations("workouts");
  const initialOptions = useMemo(() => (value ? [{ value: String(value), label: currentName || `#${value}` }] : []), [value, currentName]);
  const opts = useEntityOptions<ExerciseItem>({
    queryKey: ["exercises", "picker"],
    fetchPage: planningOptionSources.exercises,
    toOption,
    initialOptions,
  });
  return (
    <Combobox
      id={id}
      options={opts.options}
      value={value == null ? null : String(value)}
      onChange={(v) => {
        if (v === null) return onChange(null);
        const option = opts.options.find((o) => o.value === v);
        onChange({ id: Number(v), name: option?.label ?? "" });
      }}
      placeholder={t("days.exercisePlaceholder")}
      onSearch={opts.onSearch}
      onReachEnd={opts.onReachEnd}
      onOpenChange={opts.onOpenChange}
      loading={opts.loading}
      hasMore={opts.hasMore}
      allowClear
    />
  );
}
