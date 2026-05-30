'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { setLocaleAction } from '@/lib/actions';
import { useLocale } from 'next-intl';

export default function LanguageSwitcher() {
  const router = useRouter();
  const currentLocale = useLocale();
  const [isPending, startTransition] = useTransition();

  const handleLanguageChange = (newLocale: string) => {
    if (newLocale === currentLocale) return;
    
    startTransition(async () => {
      // 1. Update NEXT_LOCALE cookie on server
      await setLocaleAction(newLocale);
      // 2. Dynamic reload Server Components in-place
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-1 bg-efit-charcoal-200 p-1 rounded-lg border border-efit-charcoal-100 shadow-lg">
      <button
        onClick={() => handleLanguageChange('vi')}
        disabled={isPending}
        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
          currentLocale === 'vi' 
            ? 'bg-efit-cyan text-efit-charcoal shadow-md font-extrabold' 
            : 'text-efit-gray-text hover:text-white hover:bg-efit-charcoal-100'
        } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        Tiếng Việt
      </button>
      <button
        onClick={() => handleLanguageChange('en')}
        disabled={isPending}
        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
          currentLocale === 'en' 
            ? 'bg-efit-cyan text-efit-charcoal shadow-md font-extrabold' 
            : 'text-efit-gray-text hover:text-white hover:bg-efit-charcoal-100'
        } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        English
      </button>
    </div>
  );
}
