import { http } from "@/lib/api/axiosClient";
import type { AiStatus, AskInput, AskResult, NutritionSuggestion, SuggestNutritionInput } from "../types";

export const aiCoachService = {
  status: () => http.get<AiStatus>("/ai-coach/status/"),
  ask: (data: AskInput) => http.post<AskResult>("/ai-coach/ask/", data),
  suggestNutrition: (data: SuggestNutritionInput) => http.post<NutritionSuggestion>("/ai-coach/suggest-nutrition/", data),
};
