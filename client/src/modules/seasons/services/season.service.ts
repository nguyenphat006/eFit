import { http } from "@/lib/api/axiosClient";
import { createCrudService } from "@/lib/api/crud";
import type { Paginated } from "@/lib/api/types";
import type { EntityFetchParams } from "@/components/controls/useEntityOptions";
import type { Schemas } from "@/types/api";
import type {
  NutritionPlanInput,
  NutritionPlanItem,
  PhaseCreateInput,
  PhaseDailyLogItem,
  PhaseItem,
  PhaseUpdateInput,
  SeasonAssignInput,
  SeasonCreateInput,
  SeasonFilters,
  SeasonItem,
  SeasonListItem,
  SeasonStatus,
  SeasonUpdateInput,
} from "../types";

export const seasonCrud = createCrudService<SeasonItem, SeasonCreateInput, SeasonUpdateInput, SeasonFilters>("/seasons/");

/** Mùa giải: CRUD + đổi trạng thái + mùa đang chạy + giao mùa mẫu cho học viên. */
export const seasonService = {
  ...seasonCrud,
  list: (params?: SeasonFilters) => http.get<Paginated<SeasonListItem>>(seasonCrud.resource, { params }),
  changeStatus: (id: number, status: SeasonStatus) => http.post<SeasonItem>(`${seasonCrud.resource}${id}/change-status/`, { status }),
  assign: (data: SeasonAssignInput) => http.post<SeasonItem>(`${seasonCrud.resource}assign/`, data),
  active: (client?: number) => http.get<SeasonItem>(`${seasonCrud.resource}active/`, { params: client ? { client } : undefined }),
};

const PHASES = "/phases/";

/** Giai đoạn của mùa giải + thực đơn + nhật ký trong giai đoạn (chỉ đọc). Cập nhật luôn dùng PATCH. */
export const phaseService = {
  create: (data: PhaseCreateInput) => http.post<PhaseItem>(PHASES, data),
  update: (id: number, data: PhaseUpdateInput) => http.patch<PhaseItem>(`${PHASES}${id}/`, data),
  remove: (id: number) => http.delete(`${PHASES}${id}/`),
  refreshSnapshot: (id: number) => http.post<PhaseItem>(`${PHASES}${id}/refresh-snapshot/`),
  getNutritionPlan: (id: number) => http.get<NutritionPlanItem | null>(`${PHASES}${id}/nutrition-plan/`),
  saveNutritionPlan: (id: number, data: NutritionPlanInput) => http.put<NutritionPlanItem>(`${PHASES}${id}/nutrition-plan/`, data),
  generateNutritionPlan: (id: number, mealCount: number) =>
    http.post<NutritionPlanItem>(`${PHASES}${id}/nutrition-plan/generate/`, { meal_count: mealCount }),
  dailyLogs: (id: number) => http.get<PhaseDailyLogItem[]>(`${PHASES}${id}/daily-logs/`),
};

/** Nguồn chọn thư viện thực phẩm cho trình sửa thực đơn */
export const foodOptionSources = {
  categories: () => http.get<Paginated<Schemas["FoodCategory"]>>("/food-categories/", { params: { page_size: 100, is_active: true } }),
  food: (id: number) => http.get<Schemas["FoodItem"]>(`/food-items/${id}/`),
  foods: (params: EntityFetchParams & { category?: number }) => http.get<Paginated<Schemas["FoodItem"]>>("/food-items/", { params }),
};
