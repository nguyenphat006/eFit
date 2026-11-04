import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  // Retrieve 'NEXT_LOCALE' cookie directly from Server Side cookies store
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'vi';

  return {
    locale,
    // Import correct translation file
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
