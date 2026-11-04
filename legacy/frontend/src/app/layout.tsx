import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";
import "@/styles/globals.css";
import { Inter } from "next/font/google";
import { ReactQueryProvider } from "@/providers/ReactQueryProvider";
import AuthGuard from "@/components/auth/AuthGuard";
import { TooltipProvider } from "@/components/ui/tooltip";

// Single typeface — Inter — supports full Vietnamese diacritics with weights 100-900.
// Visual hierarchy is achieved by weight/size/letter-spacing, not by switching fonts.
const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: "eFit · AI-First Fitness Periodization",
    template: "%s · eFit",
  },
  description: "Hệ thống lập kế hoạch tập luyện chu kỳ AI-First — quản lý mùa giải, theo dõi nhật ký, dinh dưỡng và phục hồi.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Safe load of locale and message dictionary on server side
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={inter.variable}>
      <body className="bg-background text-foreground font-sans antialiased">
        <ReactQueryProvider>
          <NextIntlClientProvider messages={messages} locale={locale}>
            <TooltipProvider>
              <AuthGuard>
                {children}
              </AuthGuard>
            </TooltipProvider>
          </NextIntlClientProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
