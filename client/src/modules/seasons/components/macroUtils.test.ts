import { describe, expect, it } from "vitest";
import { macroCalories, sumMacros, toDecimalString, toNumber } from "./macroUtils";

describe("macroUtils", () => {
  it("toNumber đọc chuỗi decimal của API, rỗng -> null", () => {
    expect(toNumber("160.50")).toBe(160.5);
    expect(toNumber(null)).toBeNull();
    expect(toNumber("")).toBeNull();
  });

  it("toDecimalString giữ null và làm tròn 2 số lẻ", () => {
    expect(toDecimalString(null)).toBeNull();
    expect(toDecimalString(12.345)).toBe("12.35");
  });

  it("macroCalories = 4P + 4C + 9F", () => {
    expect(macroCalories(160, 200, 60)).toBe(1980);
    expect(macroCalories("10", null, null)).toBe(40);
    expect(macroCalories(null, null, null)).toBeNull();
  });

  it("sumMacros cộng các dòng", () => {
    const total = sumMacros([
      { target_calories: "500", target_protein: "40", target_carbs: "50", target_fat: "10" },
      { target_calories: 300, target_protein: 20, target_carbs: null, target_fat: 5 },
    ]);
    expect(total).toEqual({ calories: 800, protein: 60, carbs: 50, fat: 15 });
  });
});
