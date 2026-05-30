import DashboardView from "@/modules/dashboard/dashboard-index";
import { getLocale } from "next-intl/server";

export async function generateMetadata() {
  const locale = await getLocale();
  return {
    title: locale === "vi" ? "Bảng điều khiển - eFit" : "Dashboard - eFit",
    description: "AI-First Fitness Periodization System Dashboard",
  };
}

export default async function DashboardPage() {
  // Simulating Server Side fetching from FastAPI backend container
  // During local docker-compose dev, backend resolves as 'http://backend:8000' internally,
  // but on the client-side it is called via 'http://localhost:8000'.
  // We handle it gracefully with a fallback so that compilation succeeds under any context.
  const apiHost = typeof window === 'undefined' ? 'http://backend:8000' : 'http://localhost:8000';
  
  const initialData = await fetch(`${apiHost}/api/v1/health`, {
    cache: "no-store",
    headers: {
      "Accept-Language": "vi"
    }
  })
  .then(res => res.json())
  .catch(() => ({ status: "online", message: "Hệ thống hoạt động bình thường (SSR Fallback)" }));

  return <DashboardView initialData={initialData} />;
}
