import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SeasonDetailView } from "@/modules/seasons";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("seasons");
  return { title: t("detailPageTitle") };
}

export default async function SeasonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SeasonDetailView seasonId={parseInt(id, 10)} />;
}
