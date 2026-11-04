/**
 * Hướng dẫn bài tập lưu JSON linh hoạt (dữ liệu import): chuỗi, mảng bước, hoặc { "<ngôn ngữ>": chuỗi | mảng bước }.
 * Hàm thuần đọc / ghi danh sách bước theo ngôn ngữ đang dùng, giữ nguyên bản dịch ngôn ngữ khác.
 */

function splitText(text: string): string[] {
  return text
    .split(/\r?\n|(?<=\.)\s+(?=[A-ZÀ-Ỹ])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function toSteps(value: unknown): string[] {
  if (typeof value === "string") return splitText(value);
  if (Array.isArray(value)) return value.filter((s): s is string => typeof s === "string" && s.trim() !== "").map((s) => s.trim());
  return [];
}

/** Các bước theo ngôn ngữ `locale`; không có thì lấy "en", rồi ngôn ngữ đầu tiên. */
export function getInstructionSteps(instructions: unknown, locale: string): string[] {
  if (instructions === null || instructions === undefined) return [];
  if (typeof instructions === "string" || Array.isArray(instructions)) return toSteps(instructions);
  if (typeof instructions === "object") {
    const map = instructions as Record<string, unknown>;
    for (const key of [locale, "en", ...Object.keys(map)]) {
      const steps = toSteps(map[key]);
      if (steps.length) return steps;
    }
  }
  return [];
}

/** Ghi danh sách bước cho `locale`: dữ liệu dạng theo ngôn ngữ thì chỉ thay khóa đó, còn lại lưu thành mảng bước. */
export function setInstructionSteps(instructions: unknown, locale: string, steps: string[]): unknown {
  const clean = steps.map((s) => s.trim()).filter(Boolean);
  if (instructions && typeof instructions === "object" && !Array.isArray(instructions)) {
    const map = { ...(instructions as Record<string, unknown>) };
    if (clean.length) map[locale] = clean;
    else delete map[locale];
    return Object.keys(map).length ? map : null;
  }
  return clean.length ? clean : null;
}

/** "a, b ,c" -> ["a", "b", "c"]; rỗng -> null */
export function parseList(text: string): string[] | null {
  const items = text.split(",").map((s) => s.trim()).filter(Boolean);
  return items.length ? items : null;
}

export function asStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((s): s is string => typeof s === "string") : [];
}
