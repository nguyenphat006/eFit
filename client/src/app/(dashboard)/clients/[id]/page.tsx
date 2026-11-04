import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ClientDetailView } from "@/modules/clients";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("clients");
  return { title: t("detailPageTitle") };
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClientDetailView clientId={parseInt(id, 10)} />;
}
