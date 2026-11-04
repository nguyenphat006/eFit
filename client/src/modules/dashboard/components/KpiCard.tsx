import React from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { DashboardKpi } from "../types";

const fmt = (v: number) => v.toLocaleString("vi-VN", { maximumFractionDigits: 1 });

/** Thẻ KPI gọn: nhãn · số lớn · thay đổi so với kỳ trước. Có `href` thì cả thẻ là link. */
export function KpiCard({ kpi }: { kpi: DashboardKpi }) {
  const delta = kpi.delta ?? 0;
  const up = delta > 0;
  const down = delta < 0;
  const unit = kpi.unit ?? "";
  const body = (
    <>
      <span className="kpi-card__label">{kpi.label}</span>
      <span className="kpi-card__value">{kpi.value === null ? "—" : `${fmt(kpi.value)}${unit}`}</span>
      <span className="kpi-card__hint">
        {kpi.delta !== null && (
          <span className={`kpi-card__delta ${up ? "is-up" : down ? "is-down" : ""}`}>
            {up && <ArrowUp className="size-3" />}
            {down && <ArrowDown className="size-3" />}
            {fmt(Math.abs(delta))}
          </span>
        )}
        {kpi.hint}
      </span>
    </>
  );
  return kpi.href ? (
    <Link href={kpi.href} className="kpi-card kpi-card--link">
      {body}
    </Link>
  ) : (
    <div className="kpi-card">{body}</div>
  );
}
