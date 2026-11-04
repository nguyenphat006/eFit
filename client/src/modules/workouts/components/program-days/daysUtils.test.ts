import { describe, expect, it } from "vitest";
import { toDaysPayload, toFormValues } from "./daysUtils";

describe("daysUtils", () => {
  it("chuyển dữ liệu API sang form và ngược lại, giữ thứ tự theo vị trí", () => {
    const values = toFormValues([
      {
        id: 1,
        day_label: "Push",
        day_of_week: 0,
        sort_order: 5,
        exercises: [
          { id: 9, exercise: 3, exercise_name: "Bench", sort_order: 2, sets: 4, reps: "6-8", target_rpe: "8.5", tempo: null, rest_seconds: 90, notes: null },
        ],
      },
    ]);
    expect(values.days[0].day_of_week).toBe("0");
    expect(values.days[0].exercises[0].target_rpe).toBe(8.5);

    values.days.push({ day_label: " Legs ", day_of_week: "", exercises: [] });
    const payload = toDaysPayload(values);
    expect(payload[0]).toMatchObject({ day_of_week: 0, sort_order: 0 });
    expect(payload[0].exercises?.[0]).toMatchObject({ exercise: 3, target_rpe: "8.5", sort_order: 0, tempo: null });
    expect(payload[1]).toMatchObject({ day_label: "Legs", day_of_week: null, sort_order: 1 });
  });
});
