import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AiCoachView } from "@/modules/ai-coach";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("aiCoach");
  return { title: t("pageTitle") };
}

export default function AiCoachPage() {
  return <AiCoachView />;
}
