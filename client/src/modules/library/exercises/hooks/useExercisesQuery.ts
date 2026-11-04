"use client";

import { useQuery } from "@tanstack/react-query";
import { createCrudHooks } from "@/lib/api/createCrudHooks";
import { exerciseService } from "../services/exercise.service";

export const EXERCISES_QUERY_KEY = ["exercises"] as const;

const hooks = createCrudHooks(EXERCISES_QUERY_KEY, exerciseService);

export const exerciseQueryKeys = hooks.keys;
export const useExercisesList = hooks.useList;
export const useExerciseDetail = hooks.useDetail;
export const useCreateExerciseMutation = hooks.useCreate;
export const useUpdateExerciseMutation = hooks.useUpdate;
export const useDeleteExerciseMutation = hooks.useDelete;
export const useBatchDeleteExercisesMutation = hooks.useBatchDelete;
export const useBatchStatusExercisesMutation = hooks.useBatchStatus;

/** Giá trị phân biệt (phân loại, vùng cơ, dụng cụ, cơ mục tiêu) cho bộ lọc cột — ít đổi nên cache lâu */
export function useExerciseFilterOptions() {
  return useQuery({
    queryKey: [...EXERCISES_QUERY_KEY, "filter-options"],
    queryFn: () => exerciseService.getFilterOptions(),
    staleTime: 1000 * 60 * 10,
  });
}
