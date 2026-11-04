import type { Schemas } from "@/types/api";

/** Kiểu sinh từ OpenAPI (apps/nutrition/serializers.py). */
export type FoodCategoryItem = Schemas["FoodCategory"];
export type FoodCategoryCreateInput = Schemas["FoodCategoryCreateUpdateRequest"];
export type FoodCategoryUpdateInput = Omit<FoodCategoryCreateInput, "category_code">;

export interface FoodCategoryFilters {
  search?: string;
  is_active?: boolean;
  page?: number;
  page_size?: number;
  ordering?: string;
}
