import type { WorkoutDayInput, WorkoutDayItem } from "../../types";

/** Dòng bài tập trong form sửa buổi tập */
export interface ExerciseRow {
  exercise: number | null;
  exercise_name: string;
  sets: number | null;
  reps: string;
  target_rpe: number | null;
  tempo: string;
  rest_seconds: number | null;
  notes: string;
}

export interface DayRow {
  day_label: string;
  /** "" = không gắn thứ; "0".."6" = Thứ 2 .. Chủ nhật */
  day_of_week: string;
  exercises: ExerciseRow[];
}

export interface DaysFormValues {
  days: DayRow[];
}

export const EMPTY_EXERCISE: ExerciseRow = {
  exercise: null,
  exercise_name: "",
  sets: 3,
  reps: "8-10",
  target_rpe: null,
  tempo: "",
  rest_seconds: 120,
  notes: "",
};

export const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;

/** Dữ liệu API -> giá trị form */
export function toFormValues(days: readonly WorkoutDayItem[]): DaysFormValues {
  return {
    days: days.map((d) => ({
      day_label: d.day_label,
      day_of_week: d.day_of_week == null ? "" : String(d.day_of_week),
      exercises: d.exercises.map((e) => ({
        exercise: e.exercise,
        exercise_name: e.exercise_name,
        sets: e.sets,
        reps: e.reps,
        target_rpe: e.target_rpe == null ? null : Number(e.target_rpe),
        tempo: e.tempo ?? "",
        rest_seconds: e.rest_seconds,
        notes: e.notes ?? "",
      })),
    })),
  };
}

/** Giá trị form -> payload `days` (thứ tự theo vị trí trong danh sách) */
export function toDaysPayload(values: DaysFormValues): WorkoutDayInput[] {
  return values.days.map((d, dayIndex) => ({
    day_label: d.day_label.trim(),
    day_of_week: d.day_of_week === "" ? null : Number(d.day_of_week),
    sort_order: dayIndex,
    exercises: d.exercises.map((e, exIndex) => ({
      exercise: e.exercise,
      exercise_name: e.exercise_name.trim(),
      sort_order: exIndex,
      sets: e.sets ?? 3,
      reps: e.reps.trim() || "8-10",
      target_rpe: e.target_rpe == null ? null : e.target_rpe.toFixed(1),
      tempo: e.tempo.trim() || null,
      rest_seconds: e.rest_seconds,
      notes: e.notes.trim() || null,
    })),
  }));
}
