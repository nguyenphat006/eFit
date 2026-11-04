'use server';

import { cookies } from 'next/headers';

const SUPPORTED_LOCALES = ['vi', 'en'] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export async function setLocaleAction(locale: string): Promise<void> {
  if (!SUPPORTED_LOCALES.includes(locale as SupportedLocale)) {
    throw new Error(`Unsupported locale: ${locale}`);
  }
  const cookieStore = await cookies();
  cookieStore.set('NEXT_LOCALE', locale, {
    path: '/',
    maxAge: 31_536_000,
    sameSite: 'lax',
  });
}
