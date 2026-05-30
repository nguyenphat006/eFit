import AuthView from "@/modules/auth/auth-index";
import { getLocale } from "next-intl/server";

export async function generateMetadata() {
  const locale = await getLocale();
  return {
    title: locale === "vi" ? "Đăng nhập / Đăng ký - eFit" : "Sign In / Sign Up - eFit",
    description: "Access your eFit AI-First Fitness Periodization account",
  };
}

export default function LoginPage() {
  return <AuthView />;
}
