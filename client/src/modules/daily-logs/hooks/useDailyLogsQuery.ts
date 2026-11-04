"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCrudHooks } from "@/lib/api/createCrudHooks";
import { dailyLogService } from "../services/dailyLog.service";
import type { DailyLogFilters, DailyLogInput, DailyLogItem, DailyLogUpsertInput } from "../types";

export const DAILY_LOGS_QUERY_KEY = ["daily-logs"] as const;

const dailyLogHooks = createCrudHooks<DailyLogItem, DailyLogInput, Partial<DailyLogInput>, DailyLogFilters>(
  DAILY_LOGS_QUERY_KEY,
  dailyLogService,
);
export const useDailyLogsList = dailyLogHooks.useList;
export const useDeleteDailyLogMutation = dailyLogHooks.useDelete;

export function useUpsertDailyLogMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: DailyLogUpsertInput) => dailyLogService.upsert(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DAILY_LOGS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDailyLogSummary(clientId?: number | null) {
  return useQuery({
    queryKey: [...DAILY_LOGS_QUERY_KEY, "summary", clientId ?? "me"],
    queryFn: () => dailyLogService.summary(clientId),
    staleTime: 30_000,
  });
}

/** Thực đơn của giai đoạn — chỉ tải khi panel ngày đang mở và có giai đoạn. */
export function usePhaseNutritionPlan(phaseId: number | null | undefined, enabled: boolean) {
  return useQuery({
    queryKey: [...DAILY_LOGS_QUERY_KEY, "phase-plan", phaseId],
    queryFn: () => dailyLogService.phaseNutritionPlan(phaseId as number),
    enabled: enabled && !!phaseId,
    staleTime: 5 * 60_000,
  });
}
