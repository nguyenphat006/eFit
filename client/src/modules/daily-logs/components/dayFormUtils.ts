import type { CheatStatus, DailyLogItem, DailyLogUpsertInput } from "../types";
import { toNum } from "../dailyLogUtils";

/** Giá trị form panel ngày. Số để `null` khi trống; mức mệt mỏi là chuỗi "1".."5" cho SelectField. */
export interface DayFormValues {
  weight: number | null;
  sleep_hours: number | null;
  work_hours: number | null;
  fatigue_level: string | null;
  is_workout_completed: boolean;
  steps: number | null;
  cardio_duration_minutes: number | null;
  cardio_type: string;
  calories_in: number | null;
  protein_in: number | null;
  carbs_in: number | null;
  fat_in: number | null;
  diet_meals_completed: number | null;
  diet_target_meals: number | null;
  diet_completed_meal_ids: number[];
  diet_cheat_status: CheatStatus;
  diet_notes: string;
  chest_measure: number | null;
  waist_measure: number | null;
  hips_measure: number | null;
  arm_measure: number | null;
  leg_measure: number | null;
  body_images: string[];
  compliance_notes: string;
}

export const EMPTY_DAY: DayFormValues = {
  weight: null, sleep_hours: null, work_hours: null, fatigue_level: null, is_workout_completed: false,
  steps: null, cardio_duration_minutes: null, cardio_type: "",
  calories_in: null, protein_in: null, carbs_in: null, fat_in: null,
  diet_meals_completed: null, diet_target_meals: 4, diet_completed_meal_ids: [], diet_cheat_status: "NONE", diet_notes: "",
  chest_measure: null, waist_measure: null, hips_measure: null, arm_measure: null, leg_measure: null,
  body_images: [], compliance_notes: "",
};

export function toDayValues(log: DailyLogItem | null): DayFormValues {
  if (!log) return EMPTY_DAY;
  return {
    weight: toNum(log.weight),
    sleep_hours: toNum(log.sleep_hours),
    work_hours: toNum(log.work_hours),
    fatigue_level: log.fatigue_level ? String(log.fatigue_level) : null,
    is_workout_completed: Boolean(log.is_workout_completed),
    steps: toNum(log.steps),
    cardio_duration_minutes: toNum(log.cardio_duration_minutes),
    cardio_type: log.cardio_type ?? "",
    calories_in: toNum(log.calories_in),
    protein_in: toNum(log.protein_in),
    carbs_in: toNum(log.carbs_in),
    fat_in: toNum(log.fat_in),
    diet_meals_completed: toNum(log.diet_meals_completed),
    diet_target_meals: toNum(log.diet_target_meals) ?? 4,
    diet_completed_meal_ids: log.diet_completed_meal_ids ?? [],
    diet_cheat_status: log.diet_cheat_status ?? "NONE",
    diet_notes: log.diet_notes ?? "",
    chest_measure: toNum(log.chest_measure),
    waist_measure: toNum(log.waist_measure),
    hips_measure: toNum(log.hips_measure),
    arm_measure: toNum(log.arm_measure),
    leg_measure: toNum(log.leg_measure),
    body_images: log.body_images ?? [],
    compliance_notes: log.compliance_notes ?? "",
  };
}

/**
 * Payload upsert. Có thực đơn (`hasPlan`) -> gửi danh sách bữa đã ăn, backend tự cộng macro;
 * không có -> gửi số bữa + macro nhập tay, không gửi danh sách bữa.
 */
export function toUpsertPayload(
  values: DayFormValues,
  ctx: { logDate: string; clientId?: number | null; hasPlan: boolean },
): DailyLogUpsertInput {
  const { fatigue_level, diet_completed_meal_ids, cardio_type, diet_notes, compliance_notes, ...rest } = values;
  const payload: DailyLogUpsertInput = {
    ...rest,
    log_date: ctx.logDate,
    fatigue_level: fatigue_level ? Number(fatigue_level) : null,
    cardio_type: cardio_type.trim() || null,
    diet_notes: diet_notes.trim() || null,
    compliance_notes: compliance_notes.trim() || null,
  };
  if (ctx.clientId) payload.client = ctx.clientId;
  if (ctx.hasPlan) {
    payload.diet_completed_meal_ids = diet_completed_meal_ids;
    delete payload.calories_in;
    delete payload.protein_in;
    delete payload.carbs_in;
    delete payload.fat_in;
    delete payload.diet_meals_completed;
    delete payload.diet_target_meals;
  }
  return payload;
}
