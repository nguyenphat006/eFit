import type { Schemas } from "@/types/api";
import type { DayLike } from "@/modules/workouts";

/**
 * Kiểu dữ liệu sinh từ OpenAPI (serializer backend apps/seasons). Chạy `npm run gen:api` sau khi đổi serializer.
 */
export type SeasonItem = Schemas["Season"];
export type SeasonListItem = Schemas["SeasonList"];
export type SeasonCreateInput = Schemas["SeasonCreateUpdateRequest"];
export type SeasonUpdateInput = Partial<Omit<SeasonCreateInput, "workout_template" | "activate">>;
export type SeasonAssignInput = Schemas["SeasonAssignRequest"];
export type SeasonStatus = Schemas["SeasonStatusEnum"];
export type FitnessGoal = Schemas["FitnessGoalEnum"];

export type PhaseItem = Schemas["Phase"];
export type PhaseCreateInput = Schemas["PhaseCreateUpdateRequest"];
export type PhaseUpdateInput = Partial<Omit<PhaseCreateInput, "season">>;
export type PhaseDailyLogItem = Schemas["PhaseDailyLog"];

export type NutritionPlanItem = Schemas["NutritionPlan"];
export type MealItemRow = Schemas["MealItem"];
export type NutritionPlanInput = Schemas["NutritionPlanInputRequest"];

/** Ảnh chụp giáo án lưu trong Phase.workout_program_snapshot */
export interface WorkoutSnapshot {
  id: number;
  name: string;
  frequency_per_week: number;
  notes?: string | null;
  days: DayLike[];
}

export interface SeasonFilters {
  search?: string;
  status?: string;
  client?: number | string;
  is_template?: boolean | string;
  page?: number;
  page_size?: number;
  ordering?: string;
}

/** Trạng thái được phép chuyển tới (khớp ALLOWED_TRANSITIONS ở backend) */
export const SEASON_TRANSITIONS: Record<SeasonStatus, SeasonStatus[]> = {
  DRAFT: ["ACTIVE", "ABANDONED"],
  ACTIVE: ["COMPLETED", "ABANDONED"],
  COMPLETED: [],
  ABANDONED: [],
};

/** Chỉ xóa được mùa giải Nháp / Bỏ dở (khớp backend) */
export const DELETABLE_STATUSES: SeasonStatus[] = ["DRAFT", "ABANDONED"];
