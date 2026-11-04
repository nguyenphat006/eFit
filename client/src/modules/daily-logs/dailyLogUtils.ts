import { eachDayOfInterval, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek, subDays } from "date-fns";

/** Date -> "yyyy-MM-dd" theo giờ địa phương (khớp `log_date` của backend). */
export const toIsoDate = (date: Date) => format(date, "yyyy-MM-dd");

/** Các ô lịch tháng: bắt đầu thứ Hai, phủ đủ tuần đầu / cuối (5–6 hàng). */
export function monthGrid(month: Date): Date[] {
  return eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  });
}

/** Khoảng ngày cần tải cho lịch tháng (gồm các ngày tháng kề hiển thị ở mép lưới). */
export function monthRange(month: Date): { from: string; to: string } {
  const cells = monthGrid(month);
  return { from: toIsoDate(cells[0]), to: toIsoDate(cells[cells.length - 1]) };
}

export type ScoreTone = "none" | "low" | "mid" | "high";

/** Màu ô lịch theo điểm kỷ luật: ≥ 80 tốt, 50–79 trung bình, < 50 thấp. */
export function scoreTone(score: number | null | undefined): ScoreTone {
  if (score === null || score === undefined) return "none";
  if (score >= 80) return "high";
  if (score >= 50) return "mid";
  return "low";
}

/** Số ngày ghi nhật ký liên tiếp tính tới hôm nay (hôm nay chưa ghi thì tính từ hôm qua). */
export function currentStreak(loggedDates: Iterable<string>, today: Date): number {
  const set = new Set(loggedDates);
  let day = set.has(toIsoDate(today)) ? today : subDays(today, 1);
  let streak = 0;
  while (set.has(toIsoDate(day))) {
    streak += 1;
    day = subDays(day, 1);
  }
  return streak;
}

/** Chuỗi số từ API (Decimal) hoặc number -> number | null. */
export const toNum = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};
