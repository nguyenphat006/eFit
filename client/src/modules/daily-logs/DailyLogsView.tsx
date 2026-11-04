"use client";

import React, { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { parseISO } from "date-fns";
import { PencilLine, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader/PageHeader";
import { Combobox } from "@/components/controls/Combobox";
import { useEntityOptions } from "@/components/controls/useEntityOptions";
import { useModuleHeader } from "@/hooks/useModuleHeader";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/constants/permissions";
import type { Schemas } from "@/types/api";
import { CalendarHeatmap } from "./components/CalendarHeatmap";
import { DayDetailSheet } from "./components/DayDetailSheet";
import { useDailyLogSummary, useDailyLogsList } from "./hooks/useDailyLogsQuery";
import { dailyLogService } from "./services/dailyLog.service";
import { currentStreak, monthRange, toIsoDate } from "./dailyLogUtils";
import type { DailyLogFilters, DailyLogItem } from "./types";

const NO_LOGS: DailyLogItem[] = [];
const toClientOption = (c: Schemas["Client"]) => ({ value: String(c.id), label: c.full_name });

/**
 * Nhật ký hằng ngày: lịch tháng tô màu theo điểm kỷ luật, bấm 1 ngày để xem / ghi nhanh (upsert).
 * URL: `?client=<id>` xem nhật ký học viên, `?season=<id>` chỉ ngày thuộc mùa giải, `?date=yyyy-MM-dd` mở sẵn 1 ngày.
 */
export function DailyLogsView() {
  const t = useTranslations("dailyLogs");
  const header = useModuleHeader("DAILY_LOG");
  const { can } = usePermission();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const clientId = Number(params.get("client")) || null;
  const seasonId = Number(params.get("season")) || null;
  const openDate = params.get("date");
  const canWrite = can(PERMISSIONS.DAILY_LOG.CREATE) || can(PERMISSIONS.DAILY_LOG.UPDATE);
  const canPickClient = can(PERMISSIONS.CLIENT.READ);

  const [month, setMonth] = useState<Date>(() => (openDate ? parseISO(openDate) : new Date()));
  const range = monthRange(month);
  const filters: DailyLogFilters = {
    log_date__gte: range.from,
    log_date__lte: range.to,
    page_size: 100,
    ordering: "log_date",
    ...(clientId ? { client: clientId } : { client__isnull: true }),
    ...(seasonId ? { phase__season: seasonId } : {}),
  };
  const { data, isLoading } = useDailyLogsList(filters);
  const logs = data?.results ?? NO_LOGS;
  const summary = useDailyLogSummary(clientId);

  const clientOptions = useEntityOptions({
    queryKey: ["daily-logs", "clients"],
    fetchPage: dailyLogService.clients,
    toOption: toClientOption,
  });

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  const selectedLog = useMemo(() => logs.find((l) => l.log_date === openDate) ?? null, [logs, openDate]);
  const todayStr = toIsoDate(new Date());
  const todayLogged = logs.some((l) => l.log_date === todayStr);
  const streak = useMemo(() => currentStreak(logs.map((l) => l.log_date), new Date()), [logs]);

  const openDay = (date: string) => setParam("date", date);
  const openToday = () => {
    setMonth(new Date());
    openDay(todayStr);
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={header.title || t("title")}
        subtitle={header.subtitle || undefined}
        extra={
          <div className="flex flex-wrap items-center gap-2">
            {canPickClient && (
              <Combobox
                {...clientOptions}
                className="w-56"
                placeholder={t("filters.self")}
                allowClear
                value={clientId ? String(clientId) : null}
                onChange={(v) => setParam("client", v)}
              />
            )}
            {canWrite && (
              <Button onClick={openToday}>
                {todayLogged ? <PencilLine /> : <Plus />}
                {todayLogged ? t("actions.editToday") : t("actions.logToday")}
              </Button>
            )}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
        <span>{t("stats.streak", { days: streak })}</span>
        {summary.data && <span>{t("stats.adherence", { value: summary.data.log_adherence_7d })}</span>}
        {summary.data?.compliance_avg_7d != null && <span>{t("stats.compliance", { value: summary.data.compliance_avg_7d })}</span>}
        {summary.data?.today.dfi != null && <span>{t("stats.dfi", { value: summary.data.today.dfi })}</span>}
        {seasonId && (
          <Button variant="outline" size="xs" onClick={() => setParam("season", null)}>
            {t("filters.season", { id: seasonId })}
            <X />
          </Button>
        )}
      </div>

      <CalendarHeatmap
        month={month}
        onMonthChange={setMonth}
        logs={logs}
        selectedDate={openDate}
        onSelectDate={openDay}
        loading={isLoading}
      />

      <DayDetailSheet
        open={Boolean(openDate)}
        onClose={() => setParam("date", null)}
        dateStr={openDate}
        log={selectedLog}
        clientId={clientId}
        readOnly={!canWrite}
      />
    </div>
  );
}

export default DailyLogsView;
