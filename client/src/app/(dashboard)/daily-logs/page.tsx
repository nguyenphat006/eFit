import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DailyLogsView } from "@/modules/daily-logs";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dailyLogs");
  return { title: t("pageTitle") };
}

export default function DailyLogsPage() {
  return (
    <Suspense>
      <DailyLogsView />
    </Suspense>
  );
}
