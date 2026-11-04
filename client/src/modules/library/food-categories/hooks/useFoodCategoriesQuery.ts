"use client";

import { createCrudHooks } from "@/lib/api/createCrudHooks";
import { foodCategoryService } from "../services/foodCategory.service";

export const FOOD_CATEGORIES_QUERY_KEY = ["food-categories"] as const;

const hooks = createCrudHooks(FOOD_CATEGORIES_QUERY_KEY, foodCategoryService);

export const foodCategoryQueryKeys = hooks.keys;
export const useFoodCategoriesList = hooks.useList;
export const useFoodCategoryDetail = hooks.useDetail;
export const useCreateFoodCategoryMutation = hooks.useCreate;
export const useUpdateFoodCategoryMutation = hooks.useUpdate;
export const useDeleteFoodCategoryMutation = hooks.useDelete;
export const useBatchDeleteFoodCategoriesMutation = hooks.useBatchDelete;
export const useBatchStatusFoodCategoriesMutation = hooks.useBatchStatus;
