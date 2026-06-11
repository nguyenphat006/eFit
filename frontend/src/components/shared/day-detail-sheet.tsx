'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Save, Loader2, Plus, X, Camera, Dumbbell, Activity, Moon,
  Image as ImageIcon, AlertTriangle, Heart, Footprints, Utensils,
  Trophy, ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusPill } from '@/components/shared/status-pill';
import type { DailyLog } from '@/types/session';
import type { DailyLogCreate, DailyLogUpdate } from '@/services/api/dailyLogService';
import { useCreateDailyLog, useUpdateDailyLog } from '@/hooks/useDailyLogs';
import { uploadService } from '@/services/api/uploadService';
import { axiosClient } from '@/lib/axiosClient';

interface PhaseInfo {
  sessionId: number;
  sessionName: string;
  phaseName: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  dateStr: string | null;          // 'yyyy-MM-dd'
  existingLog: DailyLog | null;
  userId: number;
  phaseInfo?: PhaseInfo;
  onPhaseClick?: (sessionId: number) => void;
  phaseId?: number | null;
}

const EMPTY: Partial<DailyLogCreate> = {
  diet_target_meals: 4,
  diet_cheat_status: 'NONE',
  diet_completed_meal_ids: [],
  is_workout_completed: false,
  body_images: [],
};

function ComplianceBigRing({ score, size = 120 }: { score: number; size?: number }) {
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#EF9035' : '#ef4444';
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e8f4fc" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display font-black tabular-nums leading-none" style={{ color, fontSize: 28 }}>
          {score}
        </span>
        <span className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground mt-0.5">
          Compliance
        </span>
      </div>
    </div>
  );
}

function MacroBar({
  label, value, target, color,
}: { label: string; value?: number | null; target?: number | null; color: string }) {
  const pct = value && target ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </span>
        <div className="font-display tabular-nums">
          <span className="font-extrabold text-sm" style={{ color }}>
            {value ?? '—'}
          </span>
          <span className="text-xs text-muted-foreground"> / {target ?? '—'}</span>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-input overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

export function DayDetailSheet({
  open, onClose, dateStr, existingLog, userId, phaseInfo, onPhaseClick, phaseId,
}: Props) {
  const createMutation = useCreateDailyLog();
  const updateMutation = useUpdateDailyLog();

  const [form, setForm] = useState<Partial<DailyLogCreate>>(EMPTY);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Fetch Nutrition Plan for the Phase to get real meals
  const [nutritionPlan, setNutritionPlan] = useState<any>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);

  useEffect(() => {
    if (!open || !phaseId) {
      setNutritionPlan(null);
      return;
    }
    setLoadingPlan(true);
    axiosClient.get(`/api/v1/nutrition-plans/phase/${phaseId}`)
      .then(res => setNutritionPlan(res.data))
      .catch(() => setNutritionPlan(null))
      .finally(() => setLoadingPlan(false));
  }, [open, phaseId]);

  // Sync form when sheet opens with new date or new log data
  useEffect(() => {
    if (!open || !dateStr) return;
    if (existingLog) {
      setForm({
        user_id: existingLog.user_id,
        log_date: dateStr,
        weight: existingLog.weight ?? undefined,
        sleep_hours: existingLog.sleep_hours ?? undefined,
        fatigue_level: existingLog.fatigue_level ?? undefined,
        diet_meals_completed: existingLog.diet_meals_completed ?? undefined,
        diet_completed_meal_ids: existingLog.diet_completed_meal_ids ?? [],
        diet_target_meals: existingLog.diet_target_meals ?? 4,
        diet_cheat_status: existingLog.diet_cheat_status ?? 'NONE',
        diet_notes: existingLog.diet_notes ?? undefined,
        is_workout_completed: existingLog.is_workout_completed ?? false,
        steps: existingLog.steps ?? undefined,
        cardio_duration_minutes: existingLog.cardio_duration_minutes ?? undefined,
        cardio_type: existingLog.cardio_type ?? undefined,
        body_images: existingLog.body_images ?? [],
        chest_measure: existingLog.chest_measure ?? undefined,
        waist_measure: existingLog.waist_measure ?? undefined,
        hips_measure: existingLog.hips_measure ?? undefined,
      });
    } else {
      setForm({ ...EMPTY, user_id: userId, log_date: dateStr, diet_completed_meal_ids: [] });
    }
  }, [open, dateStr, existingLog, userId]);

  const handleMealToggle = (mealId: number) => {
    const currentIds = form.diet_completed_meal_ids || [];
    let nextIds: number[];
    if (currentIds.includes(mealId)) {
      nextIds = currentIds.filter(id => id !== mealId);
    } else {
      nextIds = [...currentIds, mealId];
    }
    setForm(prev => ({
      ...prev,
      diet_completed_meal_ids: nextIds,
      diet_meals_completed: nextIds.length,
      diet_target_meals: nutritionPlan?.meals?.length || prev.diet_target_meals || 4
    }));
  };

  const tickedMacros = useMemo(() => {
    if (!nutritionPlan || !nutritionPlan.meals || !form.diet_completed_meal_ids) {
      return null;
    }
    let cal = 0;
    let pro = 0;
    let carb = 0;
    let fat = 0;
    
    for (const mId of form.diet_completed_meal_ids) {
      const meal = nutritionPlan.meals.find((m: any) => m.id === mId);
      if (meal) {
        cal += meal.target_calories || 0;
        pro += meal.target_protein || 0;
        carb += meal.target_carbs || 0;
        fat += meal.target_fat || 0;
      }
    }
    return { cal, pro, carb, fat };
  }, [nutritionPlan, form.diet_completed_meal_ids]);

  const displayMacros = useMemo(() => {
    const cal = tickedMacros ? tickedMacros.cal : (existingLog?.calories_in ?? 0);
    const pro = tickedMacros ? tickedMacros.pro : (existingLog?.protein_in ?? 0);
    const carb = tickedMacros ? tickedMacros.carb : (existingLog?.carbs_in ?? 0);
    const fat = tickedMacros ? tickedMacros.fat : (existingLog?.fat_in ?? 0);
    
    const targetCal = existingLog?.target_calories_snapshot ?? nutritionPlan?.target_calories ?? null;
    const targetPro = existingLog?.target_protein_snapshot ?? nutritionPlan?.target_protein ?? null;
    const targetCarb = existingLog?.target_carbs_snapshot ?? nutritionPlan?.target_carbs ?? null;
    const targetFat = existingLog?.target_fat_snapshot ?? nutritionPlan?.target_fat ?? null;
    
    return { cal, pro, carb, fat, targetCal, targetPro, targetCarb, targetFat };
  }, [tickedMacros, existingLog, nutritionPlan]);

  const isToday = useMemo(() => {
    if (!dateStr) return false;
    return dateStr === format(new Date(), 'yyyy-MM-dd');
  }, [dateStr]);

  const handleSave = () => {
    if (!form.log_date) return;
    if (existingLog) {
      updateMutation.mutate(
        { id: existingLog.id, data: form as DailyLogUpdate },
        { onSuccess: () => onClose() },
      );
    } else {
      createMutation.mutate(form as DailyLogCreate, { onSuccess: () => onClose() });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploadingImage(true);
    try {
      const files = Array.from(e.target.files);
      const uploadedUrls: string[] = [];
      for (const f of files) {
        const { url } = await uploadService.uploadImage(f);
        uploadedUrls.push(url);
      }
      setForm((prev) => ({ ...prev, body_images: [...(prev.body_images || []), ...uploadedUrls] }));
    } catch (err) {
      console.error(err);
      alert('Tải ảnh lên thất bại!');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const removeImage = (idx: number) => {
    setForm((prev) => ({ ...prev, body_images: (prev.body_images || []).filter((_, i) => i !== idx) }));
  };

  if (!dateStr) return null;

  const dateObj = parseISO(dateStr);
  const dayName = format(dateObj, 'EEEE', { locale: vi });
  const fullDate = format(dateObj, 'dd MMMM yyyy', { locale: vi });

  const compliancePct = existingLog?.compliance_score ?? 0;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div
          className="relative px-6 pt-8 pb-6 text-white"
          style={{
            background: 'linear-gradient(135deg, #0c1730 0%, #0e1424 60%, #1a1208 100%)',
          }}
        >
          <div
            className="absolute pointer-events-none"
            style={{
              right: '-40px', top: '-30px', width: '160px', height: '160px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(84,183,240,.45) 0%, transparent 70%)',
              filter: 'blur(24px)',
            }}
          />
          <SheetHeader className="text-left">
            <SheetTitle className="sr-only">{fullDate}</SheetTitle>
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 mb-2">
                  {isToday && (
                    <StatusPill tone="blue" icon={<span className="w-1.5 h-1.5 rounded-full bg-[#54B7F0]" />}>
                      Hôm nay
                    </StatusPill>
                  )}
                  {existingLog ? (
                    <StatusPill tone="green">Đã log</StatusPill>
                  ) : (
                    <StatusPill tone="orange">Chưa log</StatusPill>
                  )}
                </div>
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-white/60">
                  {dayName}
                </p>
                <h2 className="font-display font-black text-3xl tracking-tight mt-1">
                  {fullDate.split(' ')[0]}{' '}
                  <span className="text-white/70 text-lg font-extrabold">
                    {fullDate.split(' ').slice(1).join(' ')}
                  </span>
                </h2>
              </div>
              {existingLog && existingLog.compliance_score !== null && existingLog.compliance_score !== undefined && (
                <ComplianceBigRing score={compliancePct} />
              )}
            </div>
          </SheetHeader>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Phase context — clickable link to session detail */}
          {phaseInfo && onPhaseClick && (
            <button
              type="button"
              onClick={() => onPhaseClick(phaseInfo.sessionId)}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-[rgba(167,139,250,0.30)] bg-[rgba(167,139,250,0.08)] hover:bg-[rgba(167,139,250,0.14)] transition-colors group/phase text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-[rgba(167,139,250,0.15)] grid place-items-center shrink-0">
                <Trophy className="w-5 h-5 text-[#a78bfa]" strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
                  Thuộc giai đoạn
                </p>
                <p className="font-extrabold text-sm tracking-tight text-foreground truncate">
                  {phaseInfo.phaseName}
                </p>
                <p className="text-xs font-semibold text-muted-foreground truncate">
                  Mùa giải: {phaseInfo.sessionName}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#a78bfa] group-hover/phase:translate-x-0.5 transition-transform shrink-0" />
            </button>
          )}

          {/* Macros vs target */}
          {(displayMacros.targetCal !== null || displayMacros.cal > 0) && (
            <section>
              <div className="flex items-baseline gap-2 mb-3">
                <Utensils className="w-4 h-4 text-[#EF9035]" />
                <h3 className="font-display font-extrabold text-base tracking-tight">Dinh dưỡng thực tế vs Mục tiêu</h3>
              </div>
              <div className="space-y-3 bg-card border rounded-xl p-4">
                <MacroBar label="Calories" value={displayMacros.cal} target={displayMacros.targetCal} color="#EF9035" />
                <MacroBar label="Protein" value={displayMacros.pro} target={displayMacros.targetPro} color="#54B7F0" />
                <MacroBar label="Carbs" value={displayMacros.carb} target={displayMacros.targetCarb} color="#10b981" />
                <MacroBar label="Fat" value={displayMacros.fat} target={displayMacros.targetFat} color="#a78bfa" />
              </div>
            </section>
          )}

          {/* Weight */}
          <section>
            <div className="flex items-baseline gap-2 mb-2">
              <Heart className="w-4 h-4 text-[#EF9035]" />
              <h3 className="font-display font-extrabold text-base tracking-tight">Cân nặng & số đo</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Cân nặng (kg)">
                <Input
                  type="number" step="0.1"
                  value={form.weight ?? ''}
                  onChange={(e) => setForm({ ...form, weight: parseFloat(e.target.value) || undefined })}
                />
              </Field>
              <div /> {/* spacer */}
              <Field label="Ngực (cm)">
                <Input type="number" value={form.chest_measure ?? ''} onChange={(e) => setForm({ ...form, chest_measure: parseFloat(e.target.value) || undefined })} />
              </Field>
              <Field label="Eo (cm)">
                <Input type="number" value={form.waist_measure ?? ''} onChange={(e) => setForm({ ...form, waist_measure: parseFloat(e.target.value) || undefined })} />
              </Field>
              <Field label="Mông (cm)">
                <Input type="number" value={form.hips_measure ?? ''} onChange={(e) => setForm({ ...form, hips_measure: parseFloat(e.target.value) || undefined })} />
              </Field>
            </div>
          </section>

          {/* Diet */}
          <section>
            <div className="flex items-baseline gap-2 mb-2">
              <Utensils className="w-4 h-4 text-[#10b981]" />
              <h3 className="font-display font-extrabold text-base tracking-tight">Tuân thủ chế độ ăn</h3>
            </div>
            <div className="space-y-3 bg-card border rounded-xl p-4">
              <div>
                <Label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Danh sách bữa ăn
                </Label>
                {loadingPlan ? (
                  <div className="text-xs text-muted-foreground py-2 flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin text-primary" /> Đang tải lịch ăn từ giáo án...
                  </div>
                ) : nutritionPlan && nutritionPlan.meals && nutritionPlan.meals.length > 0 ? (
                  <div className="space-y-2 mt-2">
                    {nutritionPlan.meals.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)).map((meal: any) => {
                      const isChecked = (form.diet_completed_meal_ids || []).includes(meal.id);
                      return (
                        <label
                          key={meal.id}
                          className={cn(
                            "flex items-start gap-3 p-3 rounded-xl border cursor-pointer hover:bg-slate-50 transition-all select-none",
                            isChecked ? "bg-[rgba(16,185,129,0.06)] border-[rgba(16,185,129,0.20)]" : "bg-card"
                          )}
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5 w-4 h-4 rounded text-[#10b981] focus:ring-[#10b981]/10 border-slate-300 cursor-pointer"
                            checked={isChecked}
                            onChange={() => handleMealToggle(meal.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-extrabold text-sm text-foreground">
                              {meal.name}
                            </p>
                            {meal.items && meal.items.length > 0 && (
                              <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                                {meal.items.map((item: any) => item.primary_food_text).join(" + ")}
                              </p>
                            )}
                            <p className="text-[10px] font-extrabold text-muted-foreground/60 uppercase tracking-wider mt-1">
                              {meal.target_calories} Kcal · {meal.target_protein}g P · {meal.target_carbs}g C · {meal.target_fat}g F
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-sm font-semibold text-muted-foreground">Đã ăn</span>
                    <select
                      className="flex h-10 w-24 rounded-lg border border-input bg-background px-3 py-2 text-sm font-semibold"
                      value={form.diet_meals_completed ?? ''}
                      onChange={(e) => setForm({ ...form, diet_meals_completed: e.target.value !== '' ? parseInt(e.target.value) : undefined })}
                    >
                      <option value="">--</option>
                      {Array.from({ length: (form.diet_target_meals || 4) + 1 }, (_, i) => (
                        <option key={i} value={i}>{i}</option>
                      ))}
                    </select>
                    <span className="text-sm font-semibold text-muted-foreground">/ {form.diet_target_meals || 4} bữa</span>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Trạng thái ăn ngoài
                </Label>
                <select
                  className="flex h-10 w-full mt-1.5 rounded-lg border border-input bg-background px-3 py-2 text-sm font-semibold"
                  value={form.diet_cheat_status || 'NONE'}
                  onChange={(e) => setForm({ ...form, diet_cheat_status: e.target.value })}
                >
                  <option value="NONE">Sạch 100% (không ăn ngoài)</option>
                  <option value="PLANNED">Cheat có kế hoạch</option>
                  <option value="UNPLANNED">Ăn bậy (mất kiểm soát)</option>
                </select>
              </div>

              {form.diet_cheat_status !== 'NONE' && (
                <div>
                  <Label className="text-[10px] font-extrabold uppercase tracking-wider text-destructive flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Ghi chú ăn ngoài
                  </Label>
                  <textarea
                    placeholder="Ví dụ: 1 ly trà sữa..."
                    className="flex min-h-[60px] w-full mt-1.5 rounded-lg border border-input bg-background px-3 py-2 text-sm font-semibold custom-scrollbar"
                    value={form.diet_notes ?? ''}
                    onChange={(e) => setForm({ ...form, diet_notes: e.target.value || undefined })}
                  />
                </div>
              )}
            </div>
          </section>

          {/* Workout / Cardio */}
          <section>
            <div className="flex items-baseline gap-2 mb-2">
              <Dumbbell className="w-4 h-4 text-[#54B7F0]" />
              <h3 className="font-display font-extrabold text-base tracking-tight">Tập luyện & vận động</h3>
            </div>
            <div className="space-y-3 bg-card border rounded-xl p-4">
              <div className="flex items-center justify-between p-2 px-3 rounded-lg bg-input/40 border">
                <Label className="flex items-center text-sm font-bold">
                  <Dumbbell className="w-4 h-4 mr-2 text-[#54B7F0]" /> Hoàn thành tập tạ?
                </Label>
                <Switch
                  checked={form.is_workout_completed || false}
                  onCheckedChange={(v) => setForm({ ...form, is_workout_completed: v })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Bước chân" icon={<Footprints className="w-3 h-3" />}>
                  <Input type="number" value={form.steps ?? ''} onChange={(e) => setForm({ ...form, steps: parseInt(e.target.value) || undefined })} />
                </Field>
                <Field label="Phút Cardio" icon={<Heart className="w-3 h-3" />}>
                  <Input type="number" value={form.cardio_duration_minutes ?? ''} onChange={(e) => setForm({ ...form, cardio_duration_minutes: parseInt(e.target.value) || undefined })} />
                </Field>
              </div>
            </div>
          </section>

          {/* Sleep & fatigue */}
          <section>
            <div className="flex items-baseline gap-2 mb-2">
              <Moon className="w-4 h-4 text-[#a78bfa]" />
              <h3 className="font-display font-extrabold text-base tracking-tight">Phục hồi</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Giờ ngủ" icon={<Moon className="w-3 h-3" />}>
                <Input type="number" step="0.5" value={form.sleep_hours ?? ''} onChange={(e) => setForm({ ...form, sleep_hours: parseFloat(e.target.value) || undefined })} />
              </Field>
              <Field label="Mệt mỏi 1-5" icon={<Activity className="w-3 h-3" />}>
                <Input type="number" min={1} max={5} value={form.fatigue_level ?? ''} onChange={(e) => setForm({ ...form, fatigue_level: parseInt(e.target.value) || undefined })} />
              </Field>
            </div>
          </section>

          {/* Images */}
          <section>
            <div className="flex items-baseline gap-2 mb-2">
              <Camera className="w-4 h-4 text-[#54B7F0]" />
              <h3 className="font-display font-extrabold text-base tracking-tight">Ảnh body check-in</h3>
            </div>
            <div className="space-y-3 bg-card border border-dashed rounded-xl p-4">
              <div className="flex flex-wrap gap-2">
                {(form.body_images || []).map((img, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border shadow-sm group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="checkin" className="object-cover w-full h-full" />
                    <button onClick={() => removeImage(idx)} type="button" className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <label
                  htmlFor="day-image-upload"
                  className={cn(
                    'w-20 h-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-input/40 transition-colors',
                    uploadingImage && 'opacity-50 pointer-events-none',
                  )}
                >
                  {uploadingImage ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4 text-muted-foreground" />
                      <span className="text-[9px] font-extrabold uppercase text-muted-foreground">Thêm</span>
                    </>
                  )}
                </label>
                <Input
                  id="day-image-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              {(form.body_images || []).length === 0 && !uploadingImage && (
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" /> Chưa có ảnh nào
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Sticky footer */}
        <div className="sticky bottom-0 bg-card border-t p-4 flex justify-end gap-2 z-10">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Đóng
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#54B7F0] hover:bg-[#3FA3DC] text-white shadow-button-blue font-display font-extrabold h-10 px-5"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {existingLog ? 'Cập nhật nhật ký' : 'Lưu nhật ký'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({
  label, icon, children,
}: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
        {icon} {label}
      </Label>
      {children}
    </div>
  );
}
