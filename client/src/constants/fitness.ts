import { defineStatusMap } from "@/components/common/StatusBadge";

/**
 * Bảng nhãn enum thể hình dùng chung (khớp TextChoices ở apps/clients/models.py).
 * Chữ ở messages/<vi|en>/fitness.json; dùng cho badge, Select trong form và options bộ lọc (`statusOptions`).
 */
export const GENDER = defineStatusMap({
  MALE: { label: "fitness.gender.MALE", tone: "info" },
  FEMALE: { label: "fitness.gender.FEMALE", tone: "accent" },
  OTHER: { label: "fitness.gender.OTHER", tone: "neutral" },
});

export const FITNESS_GOAL = defineStatusMap({
  BULKING: { label: "fitness.goal.BULKING", tone: "success" },
  CUTTING: { label: "fitness.goal.CUTTING", tone: "warning" },
  MAINTAINING: { label: "fitness.goal.MAINTAINING", tone: "info" },
  RECOMP: { label: "fitness.goal.RECOMP", tone: "accent" },
});

export const CLIENT_STATUS = defineStatusMap({
  ACTIVE: { label: "fitness.clientStatus.ACTIVE", tone: "success" },
  INACTIVE: { label: "fitness.clientStatus.INACTIVE", tone: "neutral" },
  ARCHIVED: { label: "fitness.clientStatus.ARCHIVED", tone: "warning" },
});

export type GenderCode = keyof typeof GENDER;
export type FitnessGoalCode = keyof typeof FITNESS_GOAL;
export type ClientStatusCode = keyof typeof CLIENT_STATUS;

/** Số thập phân từ API (DRF trả chuỗi) -> number cho ô nhập; rỗng -> null */
export function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Ô nhập số -> chuỗi thập phân gửi API (DecimalField); rỗng -> null */
export function toDecimal(value: number | null | undefined): string | null {
  return value === null || value === undefined || Number.isNaN(value) ? null : String(value);
}
