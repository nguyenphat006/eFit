"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCrudHooks } from "@/lib/api/createCrudHooks";
import { workoutProgramCrud, workoutProgramService } from "../services/workoutProgram.service";
import type { WorkoutProgramCloneInput, WorkoutProgramFilters } from "../types";

export const WORKOUT_PROGRAMS_QUERY_KEY = ["workout-programs"] as const;

const hooks = createCrudHooks(WORKOUT_PROGRAMS_QUERY_KEY, workoutProgramCrud);

export const workoutProgramQueryKeys = hooks.keys;
export const useWorkoutProgramDetail = hooks.useDetail;
export const useCreateWorkoutProgramMutation = hooks.useCreate;
export const useUpdateWorkoutProgramMutation = hooks.useUpdate;
export const useDeleteWorkoutProgramMutation = hooks.useDelete;
export const useBatchDeleteWorkoutProgramsMutation = hooks.useBatchDelete;
export const useBatchStatusWorkoutProgramsMutation = hooks.useBatchStatus;

/** Danh sách rút gọn (kiểu WorkoutProgramList — có day_count, không có days) */
export function useWorkoutProgramsList(params?: WorkoutProgramFilters) {
  return useQuery({
    queryKey: hooks.keys.list(params),
    queryFn: () => workoutProgramService.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useCloneWorkoutProgramMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: WorkoutProgramCloneInput }) => workoutProgramService.clone(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WORKOUT_PROGRAMS_QUERY_KEY }),
  });
}
