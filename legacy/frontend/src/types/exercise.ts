export interface Exercise {
  id: number;
  name: string;
  category?: string | null;
  body_part?: string | null;
  equipment?: string | null;
  target?: string | null;
  muscle_group?: string | null;
  secondary_muscles?: string[] | null;
  instructions?: Record<string, string> | null;
  media_id?: string | null;
  is_active?: boolean;
  image_url?: string | null;
  video_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ExerciseCreate {
  name: string;
  category?: string | null;
  body_part?: string | null;
  equipment?: string | null;
  target?: string | null;
  muscle_group?: string | null;
  secondary_muscles?: string[] | null;
  instructions?: Record<string, string> | null;
  media_id?: string | null;
  is_active?: boolean;
  image_url?: string | null;
  video_url?: string | null;
}

export interface ExerciseUpdate extends Partial<ExerciseCreate> {}

export interface ExerciseListResponse {
  items: Exercise[];
  total: number;
  skip: number;
  limit: number;
}
