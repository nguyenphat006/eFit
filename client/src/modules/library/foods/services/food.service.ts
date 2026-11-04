import { createCrudService } from "@/lib/api/crud";
import type { FoodCreateInput, FoodFilters, FoodItem, FoodUpdateInput } from "../types";

/** CRUD + batch chuẩn cho `/food-items/` — macro tính trên đơn vị gốc của thực phẩm. */
export const foodService = createCrudService<FoodItem, FoodCreateInput, FoodUpdateInput, FoodFilters>("/food-items/");
