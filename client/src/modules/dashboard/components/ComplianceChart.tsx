"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useCssVars } from "@/hooks/useCssVars";
import type { CompliancePoint } from "../types";
import { dayLabel } from "./chartUtils";

/** Điểm kỷ luật trung bình theo ngày (14 ngày, mọi nhật ký user được xem). */
export function ComplianceChart({ data }: { data: CompliancePoint[] }) {
  const t = useTranslations("dashboard");
  const c = useCssVars(["--c-success", "--c-border", "--c-text-secondary", "--c-surface", "--c-text"] as const);
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
        <CartesianGrid stroke={c["--c-border"]} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" tickFormatter={dayLabel} tick={{ fontSize: 12, fill: c["--c-text-secondary"] }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: c["--c-text-secondary"] }} axisLine={false} tickLine={false} width={44} />
        <Tooltip
          labelFormatter={(v) => dayLabel(String(v))}
          formatter={(v) => [v === null || v === undefined ? "—" : `${v}%`, t("complianceTooltip")]}
          contentStyle={{ background: c["--c-surface"], border: `1px solid ${c["--c-border"]}`, borderRadius: 8, fontSize: 13, color: c["--c-text"] }}
        />
        <Bar dataKey="compliance" fill={c["--c-success"]} radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
