import { defineStatusMap } from "@/components/common/StatusBadge";

/** Loại giáo án: mẫu dùng lại / giáo án đang áp dụng */
export const PROGRAM_KIND = defineStatusMap({
  true: { label: "workouts.kind.template", tone: "accent" },
  false: { label: "workouts.kind.program", tone: "info" },
});
