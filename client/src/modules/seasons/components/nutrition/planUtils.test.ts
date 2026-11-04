import { describe, expect, it } from "vitest";
import { emptyMeal, formValuesToPayload, planToFormValues } from "./planUtils";

describe("planUtils", () => {
  it("chuyển thực đơn API sang form rồi về payload, giữ thứ tự theo vị trí", () => {
    const values = planToFormValues({
      id: 1,
      phase: 2,
      target_calories: "2000.00",
      target_protein: "160.00",
      target_carbs: "200.00",
      target_fat: "60.00",
      notes: null,
      meals: [
        {
          id: 3,
          name: "Bữa 1",
          sort_order: 7,
          target_calories: "500.00",
          target_protein: "40.00",
          target_carbs: "50.00",
          target_fat: "15.00",
          items: [
            {
              id: 4,
              food_category: 5,
              food_category_code: "MEATS",
              food_category_name: "Thịt",
              food_item: 6,
              food_item_name: "Ức gà",
              sort_order: 0,
              target_calories: "160.00",
              target_protein: "40.00",
              target_carbs: "0.00",
              target_fat: "0.00",
              primary_food_text: "130g Ức gà",
              alternatives_text: null,
            },
          ],
        },
      ],
    });
    expect(values.meals[0].items[0].target_protein).toBe(40);

    values.meals.push(emptyMeal("Bữa 2"));
    values.meals[1].items.push({ ...values.meals[0].items[0], food_category: null });
    const payload = formValuesToPayload(values);
    expect(payload.meals?.[0]).toMatchObject({ sort_order: 0, target_calories: "500.00" });
    expect(payload.meals?.[0].items?.[0]).toMatchObject({ food_category: 5, food_item: 6, alternatives_text: null });
    expect(payload.meals?.[1]).toMatchObject({ name: "Bữa 2", target_fat: "0.00" });
    expect(payload.meals?.[1].items).toHaveLength(0);
  });

  it("chưa có thực đơn -> form rỗng", () => {
    expect(planToFormValues(null)).toEqual({ notes: "", meals: [] });
  });
});
