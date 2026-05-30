'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/hooks/useAuthStore';
import { authService } from '@/services/api/authService';
import { Loader2 } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, user, isAuthenticated, setAuth, logout, _hasHydrated } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    // Wait until Zustand has read from localStorage
    if (!_hasHydrated) return;

    const verifyAuth = async () => {
      // If we are on public routes like /login or /register, we don't strictly need to guard, 
      // but if we are logged in, we might want to redirect to /dashboard.
      const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');
      
      if (!token) {
        if (!isAuthRoute) {
          router.replace('/login');
        } else {
          setIsVerifying(false);
        }
        return;
      }

      try {
        // We have a token, fetch the latest profile to ensure it's valid
        const res = await authService.getMe();
        setAuth(res.data, token);
        
        // If we are on login page but have a valid token, go to dashboard
        if (isAuthRoute) {
          router.replace('/dashboard');
        }
      } catch (error) {
        // Token is invalid or expired
        logout();
        if (!isAuthRoute) {
          router.replace('/login');
        }
      } finally {
        setIsVerifying(false);
      }
    };

    verifyAuth();
  }, [pathname, token, setAuth, logout, router, _hasHydrated]);

  // Show loading spinner while verifying or hydrating
  if (!_hasHydrated || isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
