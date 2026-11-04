import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SeasonsView } from "@/modules/seasons";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("seasons");
  return { title: t("pageTitle") };
}

export default function SeasonsPage() {
  return <SeasonsView />;
}
