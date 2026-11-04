import { describe, expect, it } from "vitest";
import { currentStreak, monthGrid, monthRange, scoreTone, toNum } from "./dailyLogUtils";

describe("dailyLogUtils", () => {
  it("monthGrid bắt đầu thứ Hai và phủ đủ tuần", () => {
    const cells = monthGrid(new Date(2026, 10, 15)); // tháng 11/2026, ngày 1 là Chủ nhật
    expect(cells[0].getDay()).toBe(1);
    expect(cells.length % 7).toBe(0);
    expect(cells[0].getDate()).toBe(26); // 26/10
  });

  it("monthRange trả ngày đầu / cuối của lưới", () => {
    expect(monthRange(new Date(2026, 10, 15))).toEqual({ from: "2026-10-26", to: "2026-12-06" });
  });

  it("scoreTone theo ngưỡng", () => {
    expect(scoreTone(null)).toBe("none");
    expect(scoreTone(49.9)).toBe("low");
    expect(scoreTone(50)).toBe("mid");
    expect(scoreTone(80)).toBe("high");
  });

  it("currentStreak cho phép hôm nay chưa ghi", () => {
    const today = new Date(2026, 10, 3);
    expect(currentStreak(["2026-11-03", "2026-11-02", "2026-10-31"], today)).toBe(2);
    expect(currentStreak(["2026-11-02", "2026-11-01"], today)).toBe(2);
    expect(currentStreak([], today)).toBe(0);
  });

  it("toNum đọc chuỗi Decimal", () => {
    expect(toNum("12.50")).toBe(12.5);
    expect(toNum(null)).toBeNull();
    expect(toNum("abc")).toBeNull();
  });
});
