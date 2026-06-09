'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { LoginFormData, RegisterFormData } from './types';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import { authService } from '@/services/api/authService';
import { useAuthStore } from '@/hooks/useAuthStore';

export default function AuthView() {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLoginSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      const formData = new FormData();
      formData.append('username', data.email);
      formData.append('password', data.password);
      
      // 1. Get token
      const tokenResponse = await authService.login(formData);
      const token = tokenResponse.data.access_token;
      
      // Temporarily set token in localStorage so we can fetch /me
      // We will do this by saving it to Zustand, then fetching /me
      useAuthStore.setState({ token });
      
      // 2. Get profile
      const profileResponse = await authService.getMe();
      
      // 3. Save to global store
      setAuth(profileResponse.data, token);
      
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.detail || 'Invalid email or password');
    }
  };

  const handleRegisterSubmit = async (data: RegisterFormData) => {
    try {
      setError(null);
      await authService.register({
        email: data.email,
        password: data.password,
        full_name: data.fullName,
      });
      
      alert(`Đăng ký thành công học viên: ${data.fullName}! Tiến hành đăng nhập...`);
      setIsLogin(true);
    } catch (err: any) {
      setError(err?.detail || 'Failed to register account');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">

      {/* Background Fitness Watermark (DISCIPLINE - Chữ lớn thể thao chìm) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0">
        <div className="font-display font-black italic tracking-tighter text-primary/[0.04] uppercase text-[15vw] rotate-[-12deg] transform translate-y-[-10%] select-none">
          DISCIPLINE
        </div>
      </div>

      <div className="w-full max-w-[460px] space-y-6 z-10 relative">

        {/* Brand Header with Lub-Dub Heartbeat Halo (60 BPM) */}
        <div className="flex flex-col items-center justify-center relative">

          {/* Quầng sáng mô phỏng nhịp tim đập 60 BPM chìm sau Logo */}
          <div className="absolute w-64 h-32 rounded-full bg-primary/10 blur-3xl animate-heartbeat -z-10" />

          <Image
            src="/images/name-bg.png"
            alt="eFit Logo"
            width={240}
            height={80}
            priority
            className="object-contain hover:scale-105 transition-all duration-300 relative z-10 drop-shadow-[0_0_20px_rgba(84,183,240,0.15)]"
          />
        </div>

        {/* Central Auth Container */}
        <div className={`glass-card p-8 rounded-2xl border border-border shadow-lg transition-all duration-500 hover:shadow-xl relative z-10 ${isLogin ? 'glow-ocean' : 'glow-yellow'
          }`}>
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-sm font-medium text-center">
              {error}
            </div>
          )}
          
          {isLogin ? (
            <LoginForm
              onToggleForm={() => { setIsLogin(false); setError(null); }}
              onSubmitSuccess={handleLoginSubmit}
            />
          ) : (
            <RegisterForm
              onToggleForm={() => { setIsLogin(true); setError(null); }}
              onSubmitSuccess={handleRegisterSubmit}
            />
          )}
        </div>
      </div>
    </div>
  );
}
