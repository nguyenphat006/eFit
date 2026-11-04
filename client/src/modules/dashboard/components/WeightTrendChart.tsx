"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useCssVars } from "@/hooks/useCssVars";
import type { WeightPoint } from "../types";
import { dayLabel } from "./chartUtils";

/** Cân nặng 30 ngày gần nhất (nhật ký của chính người dùng). */
export function WeightTrendChart({ data }: { data: WeightPoint[] }) {
  const t = useTranslations("dashboard");
  const c = useCssVars(["--c-primary", "--c-border", "--c-text-secondary", "--c-surface", "--c-text"] as const);
  if (data.length < 2) return <p className="list-muted" style={{ margin: 0 }}>{t("noWeight")}</p>;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
        <CartesianGrid stroke={c["--c-border"]} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" tickFormatter={dayLabel} tick={{ fontSize: 12, fill: c["--c-text-secondary"] }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 12, fill: c["--c-text-secondary"] }} axisLine={false} tickLine={false} width={44} />
        <Tooltip
          labelFormatter={(v) => dayLabel(String(v))}
          formatter={(v) => [`${v} kg`, t("weightTooltip")]}
          contentStyle={{ background: c["--c-surface"], border: `1px solid ${c["--c-border"]}`, borderRadius: 8, fontSize: 13, color: c["--c-text"] }}
        />
        <Line type="monotone" dataKey="weight" stroke={c["--c-primary"]} strokeWidth={2} dot={{ r: 2 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
