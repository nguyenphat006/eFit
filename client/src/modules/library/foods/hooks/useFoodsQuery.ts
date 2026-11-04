"use client";

import { useQuery } from "@tanstack/react-query";
import { createCrudHooks } from "@/lib/api/createCrudHooks";
import { foodCategoryService } from "@/modules/library/food-categories/services/foodCategory.service";
import { foodService } from "../services/food.service";

export const FOODS_QUERY_KEY = ["food-items"] as const;

const hooks = createCrudHooks(FOODS_QUERY_KEY, foodService);

export const foodQueryKeys = hooks.keys;
export const useFoodsList = hooks.useList;
export const useFoodDetail = hooks.useDetail;
export const useCreateFoodMutation = hooks.useCreate;
export const useUpdateFoodMutation = hooks.useUpdate;
export const useDeleteFoodMutation = hooks.useDelete;
export const useBatchDeleteFoodsMutation = hooks.useBatchDelete;
export const useBatchStatusFoodsMutation = hooks.useBatchStatus;

/** Toàn bộ nhóm thực phẩm đang dùng (danh mục nhỏ ≤ 100) — chỉ tải khi mở form */
export function useActiveFoodCategories(enabled: boolean) {
  return useQuery({
    queryKey: ["food-categories", "active-options"],
    queryFn: () => foodCategoryService.list({ is_active: true, page_size: 100, ordering: "sort_order" }),
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}
