import type { NutritionPlanInput, NutritionPlanItem } from "../../types";
import { toDecimalString, toNumber } from "../macroUtils";

export interface MealItemRowValues {
  food_category: number | null;
  food_item: number | null;
  /** Tên thực phẩm đang chọn (chỉ để hiện nhãn trong ô chọn) */
  food_item_name: string;
  target_calories: number | null;
  target_protein: number | null;
  target_carbs: number | null;
  target_fat: number | null;
  primary_food_text: string;
  alternatives_text: string;
}

export interface MealRowValues {
  name: string;
  target_calories: number | null;
  target_protein: number | null;
  target_carbs: number | null;
  target_fat: number | null;
  items: MealItemRowValues[];
}

export interface PlanFormValues {
  notes: string;
  meals: MealRowValues[];
}

export const EMPTY_ITEM: MealItemRowValues = {
  food_category: null,
  food_item: null,
  food_item_name: "",
  target_calories: null,
  target_protein: null,
  target_carbs: null,
  target_fat: null,
  primary_food_text: "",
  alternatives_text: "",
};

export function emptyMeal(name: string): MealRowValues {
  return { name, target_calories: null, target_protein: null, target_carbs: null, target_fat: null, items: [] };
}

export function planToFormValues(plan: NutritionPlanItem | null | undefined): PlanFormValues {
  if (!plan) return { notes: "", meals: [] };
  return {
    notes: plan.notes ?? "",
    meals: plan.meals.map((m) => ({
      name: m.name,
      target_calories: toNumber(m.target_calories),
      target_protein: toNumber(m.target_protein),
      target_carbs: toNumber(m.target_carbs),
      target_fat: toNumber(m.target_fat),
      items: m.items.map((i) => ({
        food_category: i.food_category,
        food_item: i.food_item,
        food_item_name: i.food_item_name ?? "",
        target_calories: toNumber(i.target_calories),
        target_protein: toNumber(i.target_protein),
        target_carbs: toNumber(i.target_carbs),
        target_fat: toNumber(i.target_fat),
        primary_food_text: i.primary_food_text,
        alternatives_text: i.alternatives_text ?? "",
      })),
    })),
  };
}

const dec = (v: number | null) => toDecimalString(v ?? 0) as string;

/** Giá trị form -> payload PUT; dòng thiếu nhóm thực phẩm bị bỏ qua (form đã chặn trước khi gửi) */
export function formValuesToPayload(values: PlanFormValues): NutritionPlanInput {
  return {
    notes: values.notes.trim() || null,
    meals: values.meals.map((m, mealIndex) => ({
      name: m.name.trim(),
      sort_order: mealIndex,
      target_calories: dec(m.target_calories),
      target_protein: dec(m.target_protein),
      target_carbs: dec(m.target_carbs),
      target_fat: dec(m.target_fat),
      items: m.items
        .filter((i) => i.food_category != null)
        .map((i, itemIndex) => ({
          food_category: i.food_category as number,
          food_item: i.food_item,
          sort_order: itemIndex,
          target_calories: dec(i.target_calories),
          target_protein: dec(i.target_protein),
          target_carbs: dec(i.target_carbs),
          target_fat: dec(i.target_fat),
          primary_food_text: i.primary_food_text.trim(),
          alternatives_text: i.alternatives_text.trim() || null,
        })),
    })),
  };
}
