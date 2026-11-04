"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Combobox } from "@/components/controls/Combobox";
import type { PhaseItem } from "../types";

/** Chọn giai đoạn đang xem trong các tab thực đơn / nhật ký */
export function PhasePicker({ phases, value, onChange, disabled }: { phases: readonly PhaseItem[]; value: number | null; onChange: (id: number) => void; disabled?: boolean }) {
  const t = useTranslations("seasons");
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">{t("phases.pick")}</span>
      <div className="w-72 max-w-full">
        <Combobox
          options={phases.map((p) => ({ value: String(p.id), label: p.name, description: t("phases.periodValue", { start: p.start_date, end: p.end_date }) }))}
          value={value == null ? null : String(value)}
          onChange={(v) => v !== null && onChange(Number(v))}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
