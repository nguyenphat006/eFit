import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import ClientsView from "@/modules/clients";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("clients");
  return { title: t("pageTitle") };
}

export default function ClientsPage() {
  return <ClientsView />;
}
