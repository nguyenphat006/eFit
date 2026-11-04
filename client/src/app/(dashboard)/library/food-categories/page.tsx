import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import FoodCategoriesView from "@/modules/library/food-categories";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("foodCategories");
  return { title: t("pageTitle") };
}

export default function FoodCategoriesPage() {
  return <FoodCategoriesView />;
}
