import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import FoodsView from "@/modules/library/foods";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("foods");
  return { title: t("pageTitle") };
}

export default function FoodsPage() {
  return <FoodsView />;
}
