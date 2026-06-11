'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/hooks/useAuthStore';
import { authService, MOCK_TOKEN } from '@/services/api/authService';
import { Loader2 } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, setAuth, logout, _hasHydrated } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    if (!_hasHydrated) return;

    const verifyAuth = async () => {
      const isAuthRoute =
        pathname.startsWith('/login') || pathname.startsWith('/register');

      // No token case: try to bootstrap via getMe. If API is reachable,
      // it will throw 401 and we redirect to /login. If API is unreachable,
      // authService.getMe falls back to MOCK_USER so the UI stays usable
      // without a working backend (dev convenience).
      if (!token) {
        if (isAuthRoute) {
          setIsVerifying(false);
          return;
        }
        try {
          const res = await authService.getMe();
          setAuth(res.data, MOCK_TOKEN);
        } catch {
          router.replace('/login');
          return;
        } finally {
          setIsVerifying(false);
        }
        return;
      }

      // Has token: verify by calling /me. Same fallback behavior applies.
      try {
        const res = await authService.getMe();
        setAuth(res.data, token);
        if (isAuthRoute) router.replace('/dashboard');
      } catch {
        logout();
        if (!isAuthRoute) router.replace('/login');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyAuth();
  }, [pathname, token, setAuth, logout, router, _hasHydrated]);

  if (!_hasHydrated || isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
