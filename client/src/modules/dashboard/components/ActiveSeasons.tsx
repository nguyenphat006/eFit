import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Progress } from "@/components/ui/progress";
import type { ActiveSeason } from "../types";

/** Mùa giải đang chạy (gần kết thúc trước): tiến độ theo ngày + giai đoạn hiện tại. */
export function ActiveSeasons({ items }: { items: ActiveSeason[] }) {
  const t = useTranslations("dashboard.seasons");
  if (!items.length) return <p className="list-muted" style={{ margin: 0 }}>{t("empty")}</p>;
  return (
    <ul className="m-0 flex list-none flex-col gap-4 p-0">
      {items.map((s) => (
        <li key={s.id} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <Link href={`/seasons/${s.id}`} className="truncate font-medium text-foreground hover:text-primary">
              {s.name}
            </Link>
            <span className="shrink-0 text-xs text-muted-foreground">{t("daysLeft", { days: s.days_left })}</span>
          </div>
          <Progress value={s.progress} aria-label={t("progress", { value: s.progress })} />
          <span className="truncate text-xs text-muted-foreground">
            {[s.client_name, s.current_phase ? t("phase", { name: s.current_phase }) : t("noPhase")].filter(Boolean).join(" · ")}
          </span>
        </li>
      ))}
    </ul>
  );
}
