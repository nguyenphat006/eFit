import type { Schemas } from "@/types/api";

export type AiStatus = Schemas["AiStatus"];
export type ChatTurn = Schemas["ChatTurnRequest"];
export type AskInput = Schemas["AskRequest"];
export type AskResult = Schemas["AskResponse"];
export type SuggestNutritionInput = Schemas["SuggestNutritionRequest"];
export type NutritionSuggestion = Schemas["NutritionSuggestion"];
export type FitnessGoal = SuggestNutritionInput["goal"];
