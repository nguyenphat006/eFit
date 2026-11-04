import type { Schemas } from "@/types/api";

/** Số liệu trang Tổng quan — sinh từ OpenAPI (DashboardOverviewSerializer). Khối = null khi thiếu quyền. */
export type DashboardOverview = Schemas["DashboardOverview"];
export type DashboardKpi = Schemas["Kpi"];
export type TodayStatus = Schemas["Today"];
export type WeightPoint = Schemas["WeightPoint"];
export type CompliancePoint = Schemas["CompliancePoint"];
export type ActiveSeason = Schemas["ActiveSeason"];
export type ActivityPoint = Schemas["ActivityPoint"];
export type RecentActivityItem = Schemas["RecentActivity"];
