'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Save, User as UserIcon, Activity, RefreshCcw, CheckCircle2, AlertTriangle,
  CalendarDays, Ruler, Weight, Target, LogOut, Bell, Shield, Mail,
} from 'lucide-react';
import { useAuthStore, User } from '@/hooks/useAuthStore';
import { authService } from '@/services/api/authService';
import { HeroHeader } from '@/components/shared/hero-header';
import { StatusPill } from '@/components/shared/status-pill';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  fitness_goal: z.string().optional(),
  date_of_birth: z.string().optional().nullable(),
  current_weight: z.preprocess(
    (val) => (val === '' || Number.isNaN(Number(val)) ? null : Number(val)),
    z.number().min(20, 'Cân nặng không hợp lệ').max(300, 'Cân nặng không hợp lệ').optional().nullable(),
  ),
  height: z.preprocess(
    (val) => (val === '' || Number.isNaN(Number(val)) ? null : Number(val)),
    z.number().min(100, 'Chiều cao không hợp lệ').max(250, 'Chiều cao không hợp lệ').optional().nullable(),
  ),
  training_frequency: z.preprocess(
    (val) => (val === '' || Number.isNaN(Number(val)) ? null : Number(val)),
    z.number().min(0).max(7).optional().nullable(),
  ),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const GOALS = [
  { value: 'Cutting', label: 'Siết cơ (Cutting)' },
  { value: 'Bulking', label: 'Tăng cơ (Bulking)' },
  { value: 'Recomp', label: 'Recomp (giữ cân, đổi tỉ lệ)' },
  { value: 'Maintenance', label: 'Duy trì (Maintenance)' },
];

export default function SettingsPage() {
  const { user, setUser, logout } = useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      fitness_goal: user?.fitness_goal || 'Maintenance',
      date_of_birth: user?.date_of_birth || '',
      current_weight: user?.current_weight ?? undefined,
      height: user?.height ?? undefined,
      training_frequency: user?.training_frequency ?? undefined,
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        full_name: user.full_name,
        fitness_goal: user.fitness_goal || 'Maintenance',
        date_of_birth: user.date_of_birth || '',
        current_weight: user.current_weight ?? undefined,
        height: user.height ?? undefined,
        training_frequency: user.training_frequency ?? undefined,
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
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const dobValue = form.watch('date_of_birth');
  const age = calculateAge(dobValue);
  const weight = form.watch('current_weight');
  const height = form.watch('height');
  const bmi = weight && height ? (weight / Math.pow(height / 100, 2)) : null;
  const bmiLabel = bmi
    ? bmi < 18.5 ? { text: 'Thiếu cân', tone: 'orange' as const }
    : bmi < 25 ? { text: 'Bình thường', tone: 'green' as const }
    : bmi < 30 ? { text: 'Thừa cân', tone: 'orange' as const }
    : { text: 'Béo phì', tone: 'red' as const }
    : null;

  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);
    setMessage(null);
    try {
      const payload: Partial<User> = {
        ...data,
        date_of_birth: data.date_of_birth || undefined,
      } as Partial<User>;
      const res = await authService.updateProfile(payload);
      setUser(res.data);
      setMessage({ type: 'success', text: 'Cập nhật hồ sơ thành công!' });
    } catch (error: any) {
      console.error(error);
      setMessage({
        type: 'error',
        text: error?.response?.data?.detail || 'Có lỗi xảy ra khi cập nhật hồ sơ.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
      {/* ─── HERO (HIDDEN WHEN HAS DATA) ─── */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Cài đặt cá nhân
          </h1>
          <p className="text-xs font-semibold text-muted-foreground mt-1">
            Thiết lập thông tin sinh trắc học và mục tiêu thể chất của bạn
          </p>
        </div>
      </div>

      {/* Quick stats from profile */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBlock label="Tuổi" value={age !== null ? `${age}` : '—'} unit={age !== null ? 'tuổi' : undefined} icon={CalendarDays} />
        <StatBlock label="Chiều cao" value={height ? `${height}` : '—'} unit={height ? 'cm' : undefined} icon={Ruler} />
        <StatBlock label="Cân nặng" value={weight ? `${weight}` : '—'} unit={weight ? 'kg' : undefined} icon={Weight} />
        <StatBlock
          label="BMI"
          value={bmi ? bmi.toFixed(1) : '—'}
          icon={Activity}
          pill={bmiLabel ? <StatusPill tone={bmiLabel.tone} size="xs">{bmiLabel.text}</StatusPill> : undefined}
        />
      </div>

      {/* Status message */}
      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-[rgba(16,185,129,0.10)] text-[#10b981] border border-[rgba(16,185,129,0.30)]'
              : 'bg-[rgba(239,68,68,0.10)] text-[#ef4444] border border-[rgba(239,68,68,0.30)]'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-card border h-11 p-1">
          <TabsTrigger
            value="profile"
            className="data-[state=active]:bg-[rgba(84,183,240,0.10)] data-[state=active]:text-[#54B7F0] data-[state=active]:shadow-none font-extrabold tracking-wide px-4"
          >
            <UserIcon className="w-4 h-4 mr-2" /> Hồ sơ
          </TabsTrigger>
          <TabsTrigger
            value="goal"
            className="data-[state=active]:bg-[rgba(239,144,53,0.10)] data-[state=active]:text-[#EF9035] data-[state=active]:shadow-none font-extrabold tracking-wide px-4"
          >
            <Target className="w-4 h-4 mr-2" /> Mục tiêu
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="data-[state=active]:bg-[rgba(167,139,250,0.10)] data-[state=active]:text-[#a78bfa] data-[state=active]:shadow-none font-extrabold tracking-wide px-4"
          >
            <Bell className="w-4 h-4 mr-2" /> Thông báo
          </TabsTrigger>
          <TabsTrigger
            value="account"
            className="data-[state=active]:bg-[rgba(239,68,68,0.10)] data-[state=active]:text-[#ef4444] data-[state=active]:shadow-none font-extrabold tracking-wide px-4"
          >
            <Shield className="w-4 h-4 mr-2" /> Tài khoản
          </TabsTrigger>
        </TabsList>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Tab 1: Profile (personal info + body metrics) */}
          <TabsContent value="profile" className="mt-5 space-y-5">
            <FormSection icon={UserIcon} title="Thông tin chung" description="Tên hiển thị trên toàn hệ thống.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField label="Họ và tên" error={form.formState.errors.full_name?.message}>
                  <Input {...form.register('full_name')} placeholder="Nguyễn Văn A" />
                </FormField>
                <FormField label="Ngày sinh">
                  <div className="relative">
                    <Input type="date" {...form.register('date_of_birth')} />
                    {age !== null && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-[#54B7F0] bg-[rgba(84,183,240,0.10)] px-2 py-0.5 rounded-md">
                        {age} tuổi
                      </span>
                    )}
                  </div>
                </FormField>
              </div>
            </FormSection>

            <FormSection icon={Activity} title="Chỉ số cơ thể" description="Dùng để tính BMI và TDEE — cập nhật khi cân lại.">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <FormField label="Cân nặng (kg)" error={form.formState.errors.current_weight?.message}>
                  <Input type="number" step="0.1" {...form.register('current_weight', { valueAsNumber: true })} placeholder="Ví dụ: 70.5" />
                </FormField>
                <FormField label="Chiều cao (cm)" error={form.formState.errors.height?.message}>
                  <Input type="number" {...form.register('height', { valueAsNumber: true })} placeholder="Ví dụ: 175" />
                </FormField>
                <FormField label="BMI">
                  <div className="flex items-center h-10 px-3 rounded-lg border border-input bg-input/30 text-sm font-extrabold tabular-nums">
                    {bmi ? bmi.toFixed(1) : '—'}
                    {bmiLabel && <StatusPill tone={bmiLabel.tone} size="xs" className="ml-2">{bmiLabel.text}</StatusPill>}
                  </div>
                </FormField>
              </div>
            </FormSection>
          </TabsContent>

          {/* Tab 2: Goal */}
          <TabsContent value="goal" className="mt-5 space-y-5">
            <FormSection icon={Target} title="Mục tiêu tập luyện" description="Quyết định chiến lược macro/calo mà AI Coach đề xuất.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField label="Mục tiêu chính">
                  <select
                    {...form.register('fitness_goal')}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-semibold"
                  >
                    {GOALS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </FormField>
                <FormField label="Tần suất tập (buổi/tuần)" error={form.formState.errors.training_frequency?.message}>
                  <Input type="number" min={0} max={7} {...form.register('training_frequency', { valueAsNumber: true })} placeholder="Ví dụ: 4" />
                </FormField>
              </div>

              {/* Goal explanation card */}
              <div className="mt-5 p-4 rounded-xl bg-[rgba(84,183,240,0.06)] border border-[rgba(84,183,240,0.20)]">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded grid place-items-center bg-[#54B7F0] text-white shrink-0 mt-0.5">
                    <Target className="w-3 h-3" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-wider text-[#54B7F0]">Gợi ý từ AI Coach</p>
                    <p className="text-sm font-semibold text-muted-foreground mt-1 leading-relaxed">
                      {form.watch('fitness_goal') === 'Cutting' && 'Mục tiêu Cutting: giảm calo 300-500 kcal dưới TDEE, ưu tiên protein ≥ 2g/kg để giữ cơ.'}
                      {form.watch('fitness_goal') === 'Bulking' && 'Mục tiêu Bulking: tăng calo 200-400 kcal trên TDEE. Tăng tạ chậm để hạn chế tích mỡ.'}
                      {form.watch('fitness_goal') === 'Recomp' && 'Recomp: giữ calo bằng TDEE, tăng protein. Phù hợp người mới hoặc body fat cao.'}
                      {form.watch('fitness_goal') === 'Maintenance' && 'Maintenance: ăn quanh TDEE, giữ vóc dáng và sức khoẻ.'}
                    </p>
                  </div>
                </div>
              </div>
            </FormSection>
          </TabsContent>

          {/* Tab 3: Notifications (placeholder) */}
          <TabsContent value="notifications" className="mt-5 space-y-5">
            <FormSection icon={Bell} title="Thông báo" description="Chọn loại thông báo bạn muốn nhận. Có thể tắt từng kênh riêng.">
              <div className="space-y-3">
                {[
                  { id: 'phase_start', label: 'Phase mới bắt đầu', desc: 'Khi mùa giải chuyển sang phase tiếp theo.' },
                  { id: 'streak_milestone', label: 'Cột mốc streak', desc: 'Khi đạt 7, 30, 90 ngày log liên tiếp.' },
                  { id: 'weight_off_target', label: 'Cân nặng lệch mục tiêu', desc: 'Khi cân đi ngược goal 3 ngày liên tiếp.' },
                  { id: 'compliance_warning', label: 'Compliance thấp', desc: 'Khi compliance < 50% trong 3 ngày.' },
                ].map((n) => (
                  <div key={n.id} className="flex items-start justify-between gap-3 p-3 rounded-xl border bg-input/20">
                    <div>
                      <p className="font-extrabold text-sm tracking-tight">{n.label}</p>
                      <p className="text-xs font-semibold text-muted-foreground mt-0.5">{n.desc}</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded shrink-0 mt-0.5" disabled />
                  </div>
                ))}
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 text-center pt-1">
                  Tính năng này sẽ được kích hoạt khi backend ready.
                </p>
              </div>
            </FormSection>
          </TabsContent>

          {/* Tab 4: Account (read-only + danger zone) */}
          <TabsContent value="account" className="mt-5 space-y-5">
            <FormSection icon={Mail} title="Thông tin tài khoản" description="Email không thay đổi được — liên hệ admin nếu cần.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    Email
                  </Label>
                  <div className="mt-1.5 flex items-center h-10 px-3 rounded-lg border border-input bg-input/30 text-sm font-semibold text-foreground">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground mr-2" />
                    {user?.email ?? '—'}
                  </div>
                </div>
                <div>
                  <Label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    Vai trò
                  </Label>
                  <div className="mt-1.5 flex items-center h-10 px-3 rounded-lg border border-input bg-input/30 text-sm font-semibold">
                    <Shield className="w-3.5 h-3.5 text-muted-foreground mr-2" />
                    {user?.role?.name ?? '—'}
                    {user?.role?.description && (
                      <span className="text-xs text-muted-foreground ml-2">· {user.role.description}</span>
                    )}
                  </div>
                </div>
              </div>
            </FormSection>

            {/* Danger zone */}
            <div className="bg-card rounded-2xl border border-[rgba(239,68,68,0.30)] shadow-card-light p-5 md:p-6">
              <div className="flex items-start gap-3 mb-4 pb-3 border-b border-[rgba(239,68,68,0.20)]">
                <div className="w-10 h-10 rounded-xl bg-[rgba(239,68,68,0.10)] grid place-items-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-[#ef4444]" strokeWidth={1.75} />
                </div>
                <div>
                  <h2 className="font-extrabold text-base tracking-tight text-[#ef4444]">Vùng nguy hiểm</h2>
                  <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                    Hành động ở đây không thể hoàn tác.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-extrabold text-sm">Đăng xuất khỏi tài khoản</p>
                  <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                    Bạn cần đăng nhập lại để truy cập dữ liệu.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLogout}
                  className="text-[#ef4444] border-[rgba(239,68,68,0.30)] hover:bg-[rgba(239,68,68,0.10)] hover:text-[#ef4444] font-extrabold shrink-0"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Đăng xuất
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Save bar — sticky at the bottom across all tabs */}
          <div className="sticky bottom-4 mt-6 flex items-center justify-end gap-3">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#54B7F0] hover:bg-[#3FA3DC] text-white shadow-button-blue font-extrabold h-10 px-6"
            >
              {isLoading ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </Tabs>
    </div>
  );
}

// ─── Helpers ───
function StatBlock({
  label, value, unit, icon: Icon, pill,
}: {
  label: string; value: string; unit?: string;
  icon: typeof CalendarDays;
  pill?: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-2xl border shadow-card-light p-4 flex items-start justify-between">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="font-extrabold text-2xl text-foreground tabular-nums" style={{ letterSpacing: '-0.02em' }}>
            {value}
          </span>
          {unit && <span className="text-xs font-bold text-muted-foreground">{unit}</span>}
        </div>
        {pill && <div className="mt-2">{pill}</div>}
      </div>
      <div className="w-9 h-9 rounded-[10px] bg-[rgba(84,183,240,0.10)] grid place-items-center shrink-0">
        <Icon className="w-4 h-4 text-[#54B7F0]" strokeWidth={1.75} />
      </div>
    </div>
  );
}

function FormSection({
  icon: Icon, title, description, children,
}: {
  icon: typeof UserIcon; title: string; description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card rounded-2xl border shadow-card-light p-5 md:p-6">
      <header className="flex items-start gap-3 mb-5 pb-4 border-b">
        <div className="w-10 h-10 rounded-xl bg-[rgba(84,183,240,0.10)] grid place-items-center shrink-0">
          <Icon className="w-5 h-5 text-[#54B7F0]" strokeWidth={1.75} />
        </div>
        <div>
          <h2 className="font-extrabold text-base tracking-tight">{title}</h2>
          <p className="text-xs font-semibold text-muted-foreground mt-0.5">{description}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-[10px] text-destructive font-semibold">{error}</p>}
    </div>
  );
}
