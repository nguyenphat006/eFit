import { createCrudService } from "@/lib/api/crud";
import type { FoodCategoryCreateInput, FoodCategoryFilters, FoodCategoryItem, FoodCategoryUpdateInput } from "../types";

/** CRUD + batch chuẩn cho `/food-categories/` (sắp theo thứ tự hiển thị). */
export const foodCategoryService = createCrudService<FoodCategoryItem, FoodCategoryCreateInput, FoodCategoryUpdateInput, FoodCategoryFilters>(
  "/food-categories/",
);
