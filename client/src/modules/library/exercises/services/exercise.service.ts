import { http } from "@/lib/api/axiosClient";
import { createCrudService } from "@/lib/api/crud";
import type { ExerciseCreateInput, ExerciseFilterOptions, ExerciseFilters, ExerciseItem, ExerciseUpdateInput } from "../types";

/** CRUD + batch chuẩn cho `/exercises/` (BaseERPViewSet) + giá trị phân biệt cho bộ lọc. */
export const exerciseService = {
  ...createCrudService<ExerciseItem, ExerciseCreateInput, ExerciseUpdateInput, ExerciseFilters>("/exercises/"),
  getFilterOptions: () => http.get<ExerciseFilterOptions>("/exercises/filter-options/"),
};
