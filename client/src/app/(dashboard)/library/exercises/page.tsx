import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import ExercisesView from "@/modules/library/exercises";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("exercises");
  return { title: t("pageTitle") };
}

export default function ExercisesPage() {
  return <ExercisesView />;
}
