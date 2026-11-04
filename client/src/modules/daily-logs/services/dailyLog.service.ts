import { http } from "@/lib/api/axiosClient";
import { createCrudService } from "@/lib/api/crud";
import type { Paginated } from "@/lib/api/types";
import type { EntityFetchParams } from "@/components/controls/useEntityOptions";
import type { Schemas } from "@/types/api";
import type { DailyLogFilters, DailyLogInput, DailyLogItem, DailyLogSummary, DailyLogUpsertInput, PhaseNutritionPlan } from "../types";

export const dailyLogService = {
  ...createCrudService<DailyLogItem, DailyLogInput, Partial<DailyLogInput>, DailyLogFilters>("/daily-logs/"),
  /** Tạo nếu ngày chưa có nhật ký, ngược lại cập nhật các trường gửi lên. */
  upsert: (data: DailyLogUpsertInput) => http.put<DailyLogItem>("/daily-logs/upsert/", data),
  summary: (clientId?: number | null) =>
    http.get<DailyLogSummary>("/daily-logs/summary/", { params: clientId ? { client: clientId } : undefined }),
  uploadImage: (file: File) => {
    const body = new FormData();
    body.append("file", file);
    return http.post<{ image_url: string; file_name: string }>("/daily-logs/upload-image/", body);
  },
  /** Học viên để chọn xem nhật ký (tìm ở server) */
  clients: (params: EntityFetchParams) => http.get<Paginated<Schemas["Client"]>>("/clients/", { params }),
  /** Thực đơn của giai đoạn (null nếu chưa có) — để chọn các bữa đã ăn trong ngày. */
  phaseNutritionPlan: (phaseId: number) => http.get<PhaseNutritionPlan | null>(`/phases/${phaseId}/nutrition-plan/`),
};
