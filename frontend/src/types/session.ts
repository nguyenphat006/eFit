// ─── Session (Mùa giải) ────────────────────────────────────────────────────

export type SessionStatus = 'Draft' | 'Active' | 'Completed' | 'Abandoned';
export type GoalType = 'Bulking' | 'Cutting' | 'Maintaining' | 'Recomp';

export interface Session {
  id: number;
  user_id: number;
  name: string;
  goal_type: GoalType;
  start_date: string;
  end_date: string;
  is_active: boolean;
  status: SessionStatus;
  phases: Phase[];
  created_at?: string;
}

export interface SessionListItem {
  id: number;
  user_id: number;
  name: string;
  goal_type: GoalType;
  start_date: string;
  end_date: string;
  is_active: boolean;
  status: SessionStatus;
  phase_count?: number;
  created_at?: string;
}

export interface SessionCreate {
  name: string;
  goal_type: GoalType;
  start_date: string;
  end_date: string;
  is_active?: boolean;
}

export interface SessionUpdate {
  name?: string;
  goal_type?: GoalType;
  start_date?: string;
  end_date?: string;
}


// ─── Phase (Giai đoạn) ────────────────────────────────────────────────────

export interface Phase {
  id: number;
  session_id: number;
  name: string;
  order: number;
  start_date: string;
  end_date: string;
  target_calories?: number | null;
  target_protein?: number | null;
  target_carbs?: number | null;
  target_fat?: number | null;
  workout_program_id?: number | null;
  workout_program_snapshot?: any;
  description?: string | null;
  created_at?: string;
}

export interface PhaseCreate {
  name: string;
  order?: number;
  start_date: string;
  end_date: string;
  target_calories?: number | null;
  target_protein?: number | null;
  target_carbs?: number | null;
  target_fat?: number | null;
  workout_program_id?: number | null;
  nutrition_score_weight?: number;
  workout_score_weight?: number;
  weight_score_weight?: number;
}

export interface PhaseUpdate {
  name?: string;
  order?: number;
  start_date?: string;
  end_date?: string;
  target_calories?: number | null;
  target_protein?: number | null;
  target_carbs?: number | null;
  target_fat?: number | null;
  workout_program_id?: number | null;
  nutrition_score_weight?: number;
  workout_score_weight?: number;
  weight_score_weight?: number;
}


// ─── DailyLog (Nhật ký hằng ngày) ──────────────────────────────────────────

export interface DailyLog {
  id: number;
  user_id: number;
  phase_id?: number | null;
  log_date: string;
  target_calories_snapshot?: number | null;
  target_protein_snapshot?: number | null;
  target_carbs_snapshot?: number | null;
  target_fat_snapshot?: number | null;
  weight?: number | null;
  calories_in?: number | null;
  protein_in?: number | null;
  carbs_in?: number | null;
  fat_in?: number | null;
  sleep_hours?: number | null;
  work_hours?: number | null;
  fatigue_level?: number | null;
  is_workout_completed: boolean;
  body_images?: string[] | null;
  compliance_score?: number | null;
  compliance_notes?: string | null;
  created_at?: string;
}

export interface DailyLogInlineUpsert {
  log_date: string;
  weight?: number | null;
  calories_in?: number | null;
  protein_in?: number | null;
  carbs_in?: number | null;
  fat_in?: number | null;
  sleep_hours?: number | null;
  work_hours?: number | null;
  fatigue_level?: number | null;
  is_workout_completed?: boolean;
  body_images?: string[] | null;
}
