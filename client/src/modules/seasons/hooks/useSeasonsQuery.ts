"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCrudHooks } from "@/lib/api/createCrudHooks";
import { phaseService, seasonCrud, seasonService } from "../services/season.service";
import type { NutritionPlanInput, PhaseCreateInput, PhaseUpdateInput, SeasonAssignInput, SeasonFilters, SeasonStatus } from "../types";

/** Mọi query của phân hệ (mùa giải, giai đoạn, thực đơn, nhật ký giai đoạn) lồng dưới key này -> mutation invalidate một lần */
export const SEASONS_QUERY_KEY = ["seasons"] as const;

const hooks = createCrudHooks(SEASONS_QUERY_KEY, seasonCrud);

export const seasonQueryKeys = {
  ...hooks.keys,
  nutritionPlan: (phaseId: number) => [...SEASONS_QUERY_KEY, "nutrition-plan", phaseId] as const,
  phaseLogs: (phaseId: number) => [...SEASONS_QUERY_KEY, "phase-logs", phaseId] as const,
};
export const useSeasonDetail = hooks.useDetail;
export const useCreateSeasonMutation = hooks.useCreate;
export const useUpdateSeasonMutation = hooks.useUpdate;
export const useDeleteSeasonMutation = hooks.useDelete;
export const useBatchDeleteSeasonsMutation = hooks.useBatchDelete;

export function useSeasonsList(params?: SeasonFilters) {
  return useQuery({
    queryKey: hooks.keys.list(params),
    queryFn: () => seasonService.list(params),
    placeholderData: keepPreviousData,
  });
}

function useInvalidateSeasons() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: SEASONS_QUERY_KEY });
}

export function useChangeSeasonStatusMutation() {
  const onSuccess = useInvalidateSeasons();
  return useMutation({ mutationFn: ({ id, status }: { id: number; status: SeasonStatus }) => seasonService.changeStatus(id, status), onSuccess });
}

export function useAssignSeasonMutation() {
  const onSuccess = useInvalidateSeasons();
  return useMutation({ mutationFn: (data: SeasonAssignInput) => seasonService.assign(data), onSuccess });
}

export function useCreatePhaseMutation() {
  const onSuccess = useInvalidateSeasons();
  return useMutation({ mutationFn: (data: PhaseCreateInput) => phaseService.create(data), onSuccess });
}

export function useUpdatePhaseMutation() {
  const onSuccess = useInvalidateSeasons();
  return useMutation({ mutationFn: ({ id, data }: { id: number; data: PhaseUpdateInput }) => phaseService.update(id, data), onSuccess });
}

export function useDeletePhaseMutation() {
  const onSuccess = useInvalidateSeasons();
  return useMutation({ mutationFn: (id: number) => phaseService.remove(id), onSuccess });
}

export function useRefreshSnapshotMutation() {
  const onSuccess = useInvalidateSeasons();
  return useMutation({ mutationFn: (id: number) => phaseService.refreshSnapshot(id), onSuccess });
}

export function useNutritionPlan(phaseId: number | null) {
  return useQuery({
    queryKey: seasonQueryKeys.nutritionPlan(phaseId ?? 0),
    queryFn: () => phaseService.getNutritionPlan(phaseId as number),
    enabled: !!phaseId,
  });
}

export function useSaveNutritionPlanMutation() {
  const onSuccess = useInvalidateSeasons();
  return useMutation({ mutationFn: ({ phaseId, data }: { phaseId: number; data: NutritionPlanInput }) => phaseService.saveNutritionPlan(phaseId, data), onSuccess });
}

export function useGenerateNutritionPlanMutation() {
  const onSuccess = useInvalidateSeasons();
  return useMutation({
    mutationFn: ({ phaseId, mealCount }: { phaseId: number; mealCount: number }) => phaseService.generateNutritionPlan(phaseId, mealCount),
    onSuccess,
  });
}

export function usePhaseDailyLogs(phaseId: number | null) {
  return useQuery({
    queryKey: seasonQueryKeys.phaseLogs(phaseId ?? 0),
    queryFn: () => phaseService.dailyLogs(phaseId as number),
    enabled: !!phaseId,
  });
}
