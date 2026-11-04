import type { Schemas } from "@/types/api";

/** Nhật ký 1 ngày — sinh từ OpenAPI (DailyLogSerializer). Số thập phân trả dạng number. */
export type DailyLogItem = Schemas["DailyLog"];
export type DailyLogInput = Schemas["DailyLogCreateUpdateRequest"];
export type DailyLogUpsertInput = Schemas["DailyLogUpsertRequest"];
export type DailyLogSummary = Schemas["DailyLogSummary"];
export type CheatStatus = NonNullable<DailyLogItem["diet_cheat_status"]>;

/** Thực đơn của giai đoạn (phân hệ Mùa giải) — chỉ dùng danh sách bữa để tick "đã ăn". */
export type PhaseNutritionPlan = Schemas["NutritionPlan"];

export interface DailyLogFilters {
  page?: number;
  page_size?: number;
  log_date__gte?: string;
  log_date__lte?: string;
  /** Học viên; bỏ trống = nhật ký của chính mình (`client__isnull=true`) */
  client?: number;
  client__isnull?: boolean;
  phase__season?: number;
  ordering?: string;
}
