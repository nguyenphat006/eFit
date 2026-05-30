'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Settings, Save, User as UserIcon, Calendar, Activity, RefreshCcw } from 'lucide-react';
import { useAuthStore, User } from '@/hooks/useAuthStore';
import { authService } from '@/services/api/authService';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  fitness_goal: z.string().optional(),
  date_of_birth: z.string().optional().nullable(),
  current_weight: z.preprocess((val) => (val === '' || Number.isNaN(Number(val)) ? null : Number(val)), z.number().min(20, 'Cân nặng không hợp lệ').max(300, 'Cân nặng không hợp lệ').optional().nullable()),
  height: z.preprocess((val) => (val === '' || Number.isNaN(Number(val)) ? null : Number(val)), z.number().min(100, 'Chiều cao không hợp lệ').max(250, 'Chiều cao không hợp lệ').optional().nullable()),
  training_frequency: z.preprocess((val) => (val === '' || Number.isNaN(Number(val)) ? null : Number(val)), z.number().min(0).max(7).optional().nullable()),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      fitness_goal: user?.fitness_goal || 'Maintenance',
      date_of_birth: user?.date_of_birth || '',
      current_weight: user?.current_weight || undefined,
      height: user?.height || undefined,
      training_frequency: user?.training_frequency || undefined,
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        full_name: user.full_name,
        fitness_goal: user.fitness_goal || 'Maintenance',
        date_of_birth: user.date_of_birth || '',
        current_weight: user.current_weight || undefined,
        height: user.height || undefined,
        training_frequency: user.training_frequency || undefined,
      });
    }
  }, [user, form]);

  const calculateAge = (dob: string | undefined | null) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const dobValue = form.watch('date_of_birth');
  const age = calculateAge(dobValue);

  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);
    setMessage(null);
    try {
      // Convert empty string to undefined/null for dates
      const payload: Partial<User> = {
        ...data,
        date_of_birth: data.date_of_birth || undefined,
      };
      
      const res = await authService.updateProfile(payload);
      setUser(res.data);
      setMessage({ type: 'success', text: 'Cập nhật hồ sơ thành công!' });
    } catch (error: any) {
      console.error(error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Có lỗi xảy ra khi cập nhật hồ sơ.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card className="border border-[#e8f4fc] shadow-sm">
        <CardHeader className="flex flex-row items-center gap-4 bg-slate-50/50 border-b border-[#e8f4fc] p-6 rounded-t-xl">
          <div className="w-12 h-12 rounded-xl bg-[#54B7F0]/10 flex items-center justify-center text-[#54B7F0] shrink-0">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-slate-800 font-display">Hồ sơ & Cài đặt</CardTitle>
            <CardDescription className="text-xs font-semibold text-slate-400 mt-1">
              Quản lý thông tin cá nhân, chỉ số cơ thể, và tùy chỉnh tài khoản eFit.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {message && (
            <div className={`p-4 mb-6 rounded-xl text-sm font-semibold flex items-center gap-2 ${
              message.type === 'success' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'
            }`}>
              <Activity className="w-4 h-4" /> {message.text}
            </div>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Group 1: General Info */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-[#54B7F0]" /> Thông tin chung
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600">Họ và tên</label>
                  <input
                    {...form.register('full_name')}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#54B7F0] focus:ring-1 focus:ring-[#54B7F0] transition-all text-sm font-semibold text-slate-800 bg-slate-50 focus:bg-white"
                    placeholder="Nguyễn Văn A"
                  />
                  {form.formState.errors.full_name && (
                    <p className="text-[10px] text-red-500 font-semibold mt-1">{form.formState.errors.full_name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600">Mục tiêu tập luyện</label>
                  <select
                    {...form.register('fitness_goal')}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#54B7F0] focus:ring-1 focus:ring-[#54B7F0] transition-all text-sm font-semibold text-slate-800 bg-slate-50 focus:bg-white"
                  >
                    <option value="Hypertrophy">Hypertrophy (Tăng cơ)</option>
                    <option value="Strength">Strength (Tăng sức mạnh)</option>
                    <option value="Fat Loss">Fat Loss (Giảm mỡ)</option>
                    <option value="Maintenance">Maintenance (Duy trì)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Group 2: Body Metrics */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-t border-slate-100 pt-6">
                <Activity className="w-4 h-4 text-[#EF9035]" /> Chỉ số cơ thể & Thể chất
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 relative">
                  <label className="text-xs font-bold text-slate-600">Ngày sinh</label>
                  <input
                    type="date"
                    {...form.register('date_of_birth')}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#54B7F0] focus:ring-1 focus:ring-[#54B7F0] transition-all text-sm font-semibold text-slate-800 bg-slate-50 focus:bg-white"
                  />
                  {age !== null && (
                    <span className="absolute right-4 top-[38px] text-xs font-bold text-[#54B7F0] bg-[#54B7F0]/10 px-2 py-0.5 rounded-md">
                      {age} tuổi
                    </span>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600">Tần suất tập (buổi/tuần)</label>
                  <input
                    type="number"
                    {...form.register('training_frequency', { valueAsNumber: true })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#54B7F0] focus:ring-1 focus:ring-[#54B7F0] transition-all text-sm font-semibold text-slate-800 bg-slate-50 focus:bg-white"
                    placeholder="Ví dụ: 4"
                  />
                  {form.formState.errors.training_frequency && (
                    <p className="text-[10px] text-red-500 font-semibold mt-1">{form.formState.errors.training_frequency.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600">Cân nặng (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    {...form.register('current_weight', { valueAsNumber: true })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#54B7F0] focus:ring-1 focus:ring-[#54B7F0] transition-all text-sm font-semibold text-slate-800 bg-slate-50 focus:bg-white"
                    placeholder="Ví dụ: 70.5"
                  />
                  {form.formState.errors.current_weight && (
                    <p className="text-[10px] text-red-500 font-semibold mt-1">{form.formState.errors.current_weight.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600">Chiều cao (cm)</label>
                  <input
                    type="number"
                    {...form.register('height', { valueAsNumber: true })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#54B7F0] focus:ring-1 focus:ring-[#54B7F0] transition-all text-sm font-semibold text-slate-800 bg-slate-50 focus:bg-white"
                    placeholder="Ví dụ: 175"
                  />
                  {form.formState.errors.height && (
                    <p className="text-[10px] text-red-500 font-semibold mt-1">{form.formState.errors.height.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-all shadow-md shadow-slate-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
              >
                {isLoading ? (
                  <RefreshCcw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Lưu thay đổi
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
