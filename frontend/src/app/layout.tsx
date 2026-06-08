import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";
import "@/styles/globals.css";
import { Inter, Outfit, JetBrains_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import { ReactQueryProvider } from "@/providers/ReactQueryProvider";
import AuthGuard from "@/components/auth/AuthGuard";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({ subsets: ['latin', 'vietnamese'], variable: '--font-sans' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-display' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: "eFit - AI-First Fitness Periodization System",
  description: "AI-First Fitness Periodization & Smart Training System",
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
    <html lang={locale} className={cn(inter.variable, outfit.variable, jetbrainsMono.variable)}>
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
