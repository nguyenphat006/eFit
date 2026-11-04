"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { aiCoachService } from "../services/aiCoach.service";
import type { AskInput, SuggestNutritionInput } from "../types";

export const AI_COACH_QUERY_KEY = ["ai-coach"] as const;

export function useAiStatus() {
  return useQuery({ queryKey: [...AI_COACH_QUERY_KEY, "status"], queryFn: aiCoachService.status, staleTime: 5 * 60_000 });
}

/** Hỏi đáp không ghi dữ liệu -> không cần invalidate. */
export function useAskMutation() {
  return useMutation({ mutationFn: (data: AskInput) => aiCoachService.ask(data) });
}

export function useSuggestNutritionMutation() {
  return useMutation({ mutationFn: (data: SuggestNutritionInput) => aiCoachService.suggestNutrition(data) });
}
