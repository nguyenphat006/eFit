import type { Schemas } from "@/types/api";

/**
 * Kiểu dữ liệu sinh từ OpenAPI (serializer backend apps/workouts). Chạy `npm run gen:api` sau khi đổi serializer.
 */
export type WorkoutProgramItem = Schemas["WorkoutProgram"];
export type WorkoutProgramListItem = Schemas["WorkoutProgramList"];
export type WorkoutDayItem = Schemas["WorkoutDay"];
export type WorkoutExerciseItem = Schemas["WorkoutExercise"];
export type WorkoutProgramCreateInput = Schemas["WorkoutProgramCreateUpdateRequest"];
export type WorkoutProgramUpdateInput = Partial<WorkoutProgramCreateInput>;
export type WorkoutDayInput = Schemas["WorkoutDayInputRequest"];
export type WorkoutExerciseInput = Schemas["WorkoutExerciseInputRequest"];
export type WorkoutProgramCloneInput = Schemas["WorkoutProgramCloneRequest"];

export interface WorkoutProgramFilters {
  search?: string;
  is_template?: boolean | string;
  client?: number | string;
  is_active?: boolean;
  page?: number;
  page_size?: number;
  ordering?: string;
}
