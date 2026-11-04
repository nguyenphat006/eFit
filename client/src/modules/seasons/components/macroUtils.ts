/** Hàm thuần cho macro dinh dưỡng (kcal = 4·đạm + 4·tinh bột + 9·béo). */

export function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Số -> chuỗi decimal cho API (DRF DecimalField); null giữ nguyên */
export function toDecimalString(value: number | null | undefined, digits = 2): string | null {
  return value === null || value === undefined ? null : value.toFixed(digits);
}

/** Calo suy ra từ macro (làm tròn); null khi chưa nhập macro nào */
export function macroCalories(
  protein: number | string | null | undefined,
  carbs: number | string | null | undefined,
  fat: number | string | null | undefined,
): number | null {
  const p = toNumber(protein);
  const c = toNumber(carbs);
  const f = toNumber(fat);
  if (p === null && c === null && f === null) return null;
  return Math.round((p ?? 0) * 4 + (c ?? 0) * 4 + (f ?? 0) * 9);
}

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** Cộng macro của nhiều dòng (bữa / món) */
export function sumMacros(
  rows: readonly { target_calories?: string | number | null; target_protein?: string | number | null; target_carbs?: string | number | null; target_fat?: string | number | null }[],
): MacroTotals {
  return rows.reduce<MacroTotals>(
    (acc, r) => ({
      calories: acc.calories + (toNumber(r.target_calories) ?? 0),
      protein: acc.protein + (toNumber(r.target_protein) ?? 0),
      carbs: acc.carbs + (toNumber(r.target_carbs) ?? 0),
      fat: acc.fat + (toNumber(r.target_fat) ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}
