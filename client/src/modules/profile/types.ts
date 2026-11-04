import type { Schemas } from "@/types/api";
import { RoleItem } from "../users/types";

/** Hồ sơ thể chất của chính người dùng (`/fitness-profile/me/`) */
export type FitnessProfile = Schemas["FitnessProfile"];
export type FitnessProfileInput = Schemas["PatchedFitnessProfileRequest"];

export interface UserProfile {
  id: number;
  username: string;
  full_name?: string;
  name?: string;
  email: string;
  phone_number?: string;
  avatar?: string | null;
  description?: string;
  is_active: boolean;
  is_superuser: boolean;
  roles?: RoleItem[];
  role_codes?: string[];
  permissions?: string[];
  created_at: string;
  last_login?: string;
}

export interface UpdateProfileInput {
  full_name: string;
  phone_number?: string;
  description?: string;
  avatar?: string;
}

export interface ChangePasswordInput {
  old_password: string;
  new_password: string;
  confirm_password: string;
}
