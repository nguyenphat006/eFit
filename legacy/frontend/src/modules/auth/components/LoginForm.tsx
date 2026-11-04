'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { loginSchema, LoginFormData } from '../types';

interface LoginFormProps {
  onToggleForm: () => void;
  onSubmitSuccess: (data: LoginFormData) => Promise<void>;
}

export default function LoginForm({ onToggleForm, onSubmitSuccess }: LoginFormProps) {
  const t = useTranslations('Auth');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await onSubmitSuccess(data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-extrabold text-efit-navy font-display">
          {t('login_title')}
        </h2>
        <p className="text-sm text-efit-gray-text font-medium px-4">
          {t('login_subtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-efit-navy/70 ml-1">
            {t('email')}
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-efit-gray-muted w-4 h-4" />
            <input
              type="email"
              placeholder="example@email.com"
              {...register('email')}
              className={`w-full bg-background border rounded-xl pl-11 pr-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 transition-all ${
                errors.email 
                  ? 'border-destructive focus:border-destructive focus:ring-destructive/20' 
                  : 'border-border focus:border-primary focus:ring-primary/20'
              }`}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-destructive font-bold ml-1">
              {t(errors.email.message as any)}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-efit-navy/70 ml-1">
            {t('password')}
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-efit-gray-muted w-4 h-4" />
            <input
              type="password"
              placeholder="••••••••"
              {...register('password')}
              className={`w-full bg-background border rounded-xl pl-11 pr-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 transition-all ${
                errors.password 
                  ? 'border-destructive focus:border-destructive focus:ring-destructive/20' 
                  : 'border-border focus:border-primary focus:ring-primary/20'
              }`}
            />
          </div>
          {errors.password && (
            <p className="text-xs text-destructive font-bold ml-1">
              {t(errors.password.message as any)}
            </p>
          )}
        </div>

        {/* Submit button with loader */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary hover:bg-efit-blue-600 text-primary-foreground font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 glow-ocean disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              {t('sign_in')}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch Form Trigger */}
      <div className="text-center pt-2">
        <p className="text-sm text-efit-gray-text font-medium">
          {t('dont_have_account')}{' '}
          <button
            onClick={onToggleForm}
            className="text-primary hover:text-efit-blue-600 font-bold transition-all focus:outline-none underline underline-offset-4"
          >
            {t('sign_up')}
          </button>
        </p>
      </div>
    </div>
  );
}
