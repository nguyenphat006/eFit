"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/PageHeader/PageHeader";
import { EmptyState } from "@/components/common/EmptyState/EmptyState";
import { useAuthStore } from "@/stores/useAuthStore";
import { useDashboardOverview } from "./hooks/useDashboardOverview";
import { KpiCard } from "./components/KpiCard";
import { TodayPanel } from "./components/TodayPanel";
import { WeightTrendChart } from "./components/WeightTrendChart";
import { ComplianceChart } from "./components/ComplianceChart";
import { ActiveSeasons } from "./components/ActiveSeasons";
import { ActivityChart } from "./components/ActivityChart";
import { RecentActivity } from "./components/RecentActivity";
import { SystemStatus } from "./components/SystemStatus";

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`dash-panel ${className}`}>
      <h2 className="dash-panel__title">{title}</h2>
      {children}
    </section>
  );
}

/**
 * Trang Tổng quan eFit (lấy hôm nay làm trung tâm): KPI → nhật ký hôm nay + cân nặng → kỷ luật + mùa giải đang chạy
 * → hoạt động hệ thống. Mọi số liệu từ 1 API (`/dashboard/overview/`); khối không có quyền (null) tự ẩn.
 * Thêm KPI: backend `apps/dashboard/views.py` → KPI_BUILDERS.
 */
export function DashboardView() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, refetch } = useDashboardOverview();
  const name = user?.full_name || user?.username || "";
  // Số cột KPI theo số khối thật sự có (thiếu quyền -> không để ô trống)
  const kpiCols = isLoading ? 4 : Math.min(Math.max(data?.kpis.length ?? 1, 1), 4);

  if (isError) {
    return (
      <div className="dashboard">
        <PageHeader title={t("title")} subtitle={name ? t("greeting", { name }) : undefined} />
        <EmptyState title={t("loadError")} description={t("loadErrorHint")} actionText={tc("actions.retry")} onAction={() => refetch()} actionType="default" icon={null} />
      </div>
    );
  }

  return (
    <div className="dashboard">
      <PageHeader title={t("title")} subtitle={name ? t("greeting", { name }) : undefined} />

      <div className="dash-kpis" style={{ "--kpi-cols": kpiCols } as React.CSSProperties}>
        {isLoading
          ? Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="kpi-card">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-2 h-8 w-20" />
                <Skeleton className="mt-2 h-3 w-32" />
              </div>
            ))
          : data?.kpis.map((kpi) => <KpiCard key={kpi.key} kpi={kpi} />)}
      </div>

      {isLoading ? (
        <div className="dash-grid">
          <Skeleton className="h-[280px] w-full rounded-xl" />
          <Skeleton className="dash-grid__wide h-[280px] w-full rounded-xl" />
        </div>
      ) : (
        <div className="dash-grid">
          {data?.today && (
            <Panel title={t("panels.today")}>
              <TodayPanel today={data.today} />
            </Panel>
          )}
          {data?.weight_trend && (
            <Panel title={t("panels.weightTrend")} className={data.today ? "dash-grid__wide" : "dash-grid__full"}>
              <WeightTrendChart data={data.weight_trend} />
            </Panel>
          )}
          {data?.compliance_trend && (
            <Panel title={t("panels.compliance")} className={data.active_seasons ? "dash-grid__wide" : "dash-grid__full"}>
              <ComplianceChart data={data.compliance_trend} />
            </Panel>
          )}
          {data?.active_seasons && (
            <Panel title={t("panels.activeSeasons")}>
              <ActiveSeasons items={data.active_seasons} />
            </Panel>
          )}
          {data?.activity && (
            <Panel title={t("panels.activity")} className="dash-grid__full">
              <ActivityChart data={data.activity} />
            </Panel>
          )}
          {data?.recent_activity && (
            <Panel title={t("panels.recentActivity")} className="dash-grid__wide">
              <RecentActivity items={data.recent_activity} />
            </Panel>
          )}
          <Panel title={t("panels.systemStatus")}>
            <SystemStatus />
          </Panel>
        </div>
      )}
    </div>
  );
}

export default DashboardView;
