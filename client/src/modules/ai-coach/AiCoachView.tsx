"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Info } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader/PageHeader";
import { useModuleHeader } from "@/hooks/useModuleHeader";
import { useAiStatus } from "./hooks/useAiCoach";
import { ChatPanel } from "./components/ChatPanel";
import { NutritionSuggestPanel } from "./components/NutritionSuggestPanel";

/** Trợ lý AI: hỏi đáp tự do (cần cấu hình Gemini) + gợi ý macro / ngày (chạy offline khi chưa cấu hình). */
export function AiCoachView() {
  const t = useTranslations("aiCoach");
  const header = useModuleHeader("AI_COACH");
  const status = useAiStatus();
  const offline = status.data ? !status.data.configured : false;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={header.title || t("title")} subtitle={header.subtitle || t("subtitle")} />
      {offline && (
        <div className="flex items-start gap-2 rounded-lg border border-[var(--c-warning-border)] bg-[var(--c-warning-bg)] px-4 py-3 text-sm" role="status">
          <Info className="mt-0.5 size-4 shrink-0 text-[var(--c-warning)]" aria-hidden />
          <span>{t("offlineNotice")}</span>
        </div>
      )}
      <div className="dash-grid">
        <div className="dash-grid__wide min-w-0">
          <ChatPanel disabled={offline} />
        </div>
        <NutritionSuggestPanel />
      </div>
    </div>
  );
}

export default AiCoachView;
