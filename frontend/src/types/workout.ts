// ─── Workout Schedule Types ─────────────────────────────────────────────────

export interface WorkoutExercise {
  id: number;
  workout_day_id: number;
  exercise_name: string;
  order: number;
  sets: number;
  reps: string;          // VD: "6-8", "10", "AMRAP"
  target_rpe: number | null;
  tempo: string | null;  // VD: "3010"
  rest_seconds: number | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface WorkoutDay {
  id: number;
  program_id: number;
  day_label: string;
  day_of_week: number | null; // 0=T2 ... 6=CN, null = linh hoạt
  order: number;
  exercises: WorkoutExercise[];
  created_at?: string;
  updated_at?: string;
}

export interface WorkoutProgram {
  id: number;
  user_id: number;
  name: string;
  frequency_per_week: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  notes: string | null;
  days: WorkoutDay[];
  created_at?: string;
}

export interface WorkoutProgramListItem extends Omit<WorkoutProgram, 'days'> {
  day_count?: number;
}

// ─── Payload Types ───────────────────────────────────────────────────────────

export interface WorkoutProgramCreate {
  name: string;
  frequency_per_week: number;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  notes?: string;
}

export interface WorkoutDayCreate {
  program_id: number;
  day_label: string;
  day_of_week?: number | null;
  order?: number;
}

export interface WorkoutExerciseCreate {
  workout_day_id: number;
  exercise_name: string;
  order?: number;
  sets?: number;
  reps?: string;
  target_rpe?: number | null;
  tempo?: string | null;
  rest_seconds?: number | null;
  notes?: string | null;
}

export interface WorkoutExerciseUpdate {
  exercise_name?: string;
  order?: number;
  sets?: number;
  reps?: string;
  target_rpe?: number | null;
  tempo?: string | null;
  rest_seconds?: number | null;
  notes?: string | null;
}

// Day of week mapping
export const DAY_OF_WEEK_LABELS: Record<number, string> = {
  0: 'Thứ 2',
  1: 'Thứ 3',
  2: 'Thứ 4',
  3: 'Thứ 5',
  4: 'Thứ 6',
  5: 'Thứ 7',
  6: 'Chủ Nhật',
};
