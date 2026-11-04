import { defineStatusMap } from "@/components/common/StatusBadge";

export const SEASON_STATUS = defineStatusMap({
  DRAFT: { label: "seasons.status.DRAFT", tone: "neutral" },
  ACTIVE: { label: "seasons.status.ACTIVE", tone: "info" },
  COMPLETED: { label: "seasons.status.COMPLETED", tone: "success" },
  ABANDONED: { label: "seasons.status.ABANDONED", tone: "warning" },
});

export const FITNESS_GOAL = defineStatusMap({
  BULKING: { label: "fitness.goal.BULKING", tone: "accent" },
  CUTTING: { label: "fitness.goal.CUTTING", tone: "warning" },
  MAINTAINING: { label: "fitness.goal.MAINTAINING", tone: "neutral" },
  RECOMP: { label: "fitness.goal.RECOMP", tone: "info" },
});

export const SEASON_KIND = defineStatusMap({
  true: { label: "seasons.kind.template", tone: "accent" },
  false: { label: "seasons.kind.season", tone: "neutral" },
});
