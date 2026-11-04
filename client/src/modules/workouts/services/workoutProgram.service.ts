import { http } from "@/lib/api/axiosClient";
import { createCrudService } from "@/lib/api/crud";
import type { Paginated } from "@/lib/api/types";
import type { EntityFetchParams } from "@/components/controls/useEntityOptions";
import type { Schemas } from "@/types/api";
import type {
  WorkoutProgramCloneInput,
  WorkoutProgramCreateInput,
  WorkoutProgramFilters,
  WorkoutProgramItem,
  WorkoutProgramListItem,
  WorkoutProgramUpdateInput,
} from "../types";

export const workoutProgramCrud = createCrudService<WorkoutProgramItem, WorkoutProgramCreateInput, WorkoutProgramUpdateInput, WorkoutProgramFilters>(
  "/workout-programs/",
);

/** Giáo án tập: CRUD (ghi cả cây buổi tập -> bài tập) + clone. Danh sách trả bản rút gọn (không có `days`). */
export const workoutProgramService = {
  ...workoutProgramCrud,
  list: (params?: WorkoutProgramFilters) => http.get<Paginated<WorkoutProgramListItem>>(workoutProgramCrud.resource, { params }),
  clone: (id: number, data: WorkoutProgramCloneInput) => http.post<WorkoutProgramItem>(`${workoutProgramCrud.resource}${id}/clone/`, data),
};

/** Nguồn chọn dùng chung (remote search) cho form giáo án / mùa giải */
export const planningOptionSources = {
  clients: (params: EntityFetchParams) => http.get<Paginated<Schemas["Client"]>>("/clients/", { params }),
  exercises: (params: EntityFetchParams) => http.get<Paginated<Schemas["Exercise"]>>("/exercises/", { params }),
  programs: (params: EntityFetchParams & { is_template?: boolean }) =>
    http.get<Paginated<WorkoutProgramListItem>>(workoutProgramCrud.resource, { params }),
};
