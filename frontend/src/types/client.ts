export interface Client {
  id: number;
  coach_id: number;
  full_name: string;
  phone: string | null;
  email: string | null;
  gender: string | null;
  date_of_birth: string | null;
  current_weight: number | null;
  height: number | null;
  body_fat_percentage: number | null;
  chest_measure: number | null;
  waist_measure: number | null;
  hips_measure: number | null;
  arm_measure: number | null;
  leg_measure: number | null;
  fitness_goal: string | null;
  activity_level: number | null;
  training_frequency: number | null;
  notes: string | null;
  status: string;
  user_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface ClientListItem {
  id: number;
  full_name: string;
  phone: string | null;
  email: string | null;
  gender: string | null;
  current_weight: number | null;
  fitness_goal: string | null;
  status: string;
  user_id: number | null;
}

export interface ClientCreate {
  full_name: string;
  phone?: string | null;
  email?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  current_weight?: number | null;
  height?: number | null;
  body_fat_percentage?: number | null;
  chest_measure?: number | null;
  waist_measure?: number | null;
  hips_measure?: number | null;
  arm_measure?: number | null;
  leg_measure?: number | null;
  fitness_goal?: string;
  activity_level?: number | null;
  training_frequency?: number | null;
  notes?: string | null;
}

export interface ClientUpdate extends Partial<ClientCreate> {
  status?: string;
}
