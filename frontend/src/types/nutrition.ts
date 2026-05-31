export interface FoodCategory {
  code: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
  is_active?: boolean;
}

export interface FoodItem {
  id: number;
  name: string;
  category_code: string;
  category?: FoodCategory;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  base_unit: string;
  default_serving_name?: string;
  default_serving_weight?: number;
  image_url?: string;
  is_system_data: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
  is_active?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
}
