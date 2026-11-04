import type { Schemas } from "@/types/api";

/** Kiểu sinh từ OpenAPI (apps/nutrition/serializers.py). */
export type FoodItem = Schemas["FoodItem"];
export type FoodCreateInput = Schemas["FoodItemCreateUpdateRequest"];
export type FoodUpdateInput = Partial<FoodCreateInput>;

export interface FoodFilters {
  search?: string;
  is_active?: boolean;
  page?: number;
  page_size?: number;
  ordering?: string;
}
