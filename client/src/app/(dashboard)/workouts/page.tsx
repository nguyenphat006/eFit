import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { WorkoutProgramsView } from "@/modules/workouts";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("workouts");
  return { title: t("pageTitle") };
}

export default function WorkoutProgramsPage() {
  return <WorkoutProgramsView />;
}
