import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ExerciseDetailView } from "@/modules/library/exercises";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("exercises");
  return { title: t("detailPageTitle") };
}

export default async function ExerciseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ExerciseDetailView exerciseId={parseInt(id, 10)} />;
}
