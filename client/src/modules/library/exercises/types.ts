import type { Schemas } from "@/types/api";

/** Kiểu sinh từ OpenAPI (apps/exercises/serializers.py). */
export type ExerciseItem = Schemas["Exercise"];
export type ExerciseCreateInput = Schemas["ExerciseCreateUpdateRequest"];
export type ExerciseUpdateInput = Partial<ExerciseCreateInput>;
export type ExerciseFilterOptions = Schemas["ExerciseFilterOptions"];

export interface ExerciseFilters {
  search?: string;
  is_active?: boolean;
  page?: number;
  page_size?: number;
  ordering?: string;
}
