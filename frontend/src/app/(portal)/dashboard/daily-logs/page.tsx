"use client";

import React, { useState, useMemo } from 'react';
import { format, parseISO } from "date-fns";
import { vi } from 'date-fns/locale';
import { Plus, Camera, Loader2, Image as ImageIcon, X, Dumbbell, Activity, Moon, CheckCircle2, XCircle, Save, ChevronLeft, ChevronRight, CalendarCheck, TrendingUp, BarChart3, Flame, Filter } from "lucide-react";

import { useDailyLogs, useCreateDailyLog, useUpdateDailyLog } from "@/hooks/useDailyLogs";
import { DailyLogCreate, DailyLogUpdate, DailyLog } from "@/services/api/dailyLogService";
import { uploadService } from "@/services/api/uploadService";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ─── HELPER: Fatigue dots ───
function FatigueDots({ level }: { level: number | null | undefined }) {
  if (!level) return <span className="text-sm font-semibold text-muted-foreground/40">—</span>;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className={cn("w-2 h-2 rounded-full", i <= level ? (level >= 4 ? "bg-destructive" : level >= 3 ? "bg-efit-orange" : "bg-efit-green") : "bg-input")} />
      ))}
    </div>
  );
}

export default function DailyLogsFeed() {
  const { data: logsPage, isLoading, error } = useDailyLogs(1);
  const createMutation = useCreateDailyLog();
  const updateMutation = useUpdateDailyLog();

  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [editForm, setEditForm] = useState<Partial<DailyLogCreate> | null>(null);
  
  const [uploadingImage, setUploadingImage] = useState(false);

  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const logs = useMemo(() => logsPage?.data || [], [logsPage]);

  // Apply filters
  const filteredLogs = useMemo(() => {
    let result = logs;
    if (dateFrom) {
      result = result.filter(l => String(l.log_date) >= dateFrom);
    }
    if (dateTo) {
      result = result.filter(l => String(l.log_date) <= dateTo);
    }
    return result;
  }, [logs, dateFrom, dateTo]);

  // ─── SUMMARY STATS ───
  const summaryStats = useMemo(() => {
    const totalLogs = filteredLogs.length;
    const scores = filteredLogs.filter(l => l.compliance_score != null).map(l => l.compliance_score!);
    const avgCompliance = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    
    const weights = filteredLogs.filter(l => l.weight != null).sort((a, b) => String(b.log_date).localeCompare(String(a.log_date)));
    const latestWeight = weights.length > 0 ? weights[0].weight : null;

    // Streak: consecutive days with logs (from most recent backward)
    let streak = 0;
    if (filteredLogs.length > 0) {
      const sorted = [...filteredLogs].sort((a, b) => String(b.log_date).localeCompare(String(a.log_date)));
      const today = format(new Date(), 'yyyy-MM-dd');
      let expectedDate = today;
      for (const log of sorted) {
        const logDate = String(log.log_date);
        if (logDate === expectedDate || (streak === 0 && logDate <= today)) {
          streak++;
          const d = new Date(logDate);
          d.setDate(d.getDate() - 1);
          expectedDate = format(d, 'yyyy-MM-dd');
        } else if (streak > 0) {
          break;
        }
      }
    }

    return { totalLogs, avgCompliance, latestWeight, streak };
  }, [filteredLogs]);

  // ─── GROUP BY PHASE ───
  const groupedLogs = useMemo(() => {
    const groups: { phaseLabel: string; logs: DailyLog[] }[] = [];
    const phaseMap = new Map<string, DailyLog[]>();
    
    for (const log of filteredLogs) {
      const key = log.phase_id ? `phase-${log.phase_id}` : 'no-phase';
      if (!phaseMap.has(key)) phaseMap.set(key, []);
      phaseMap.get(key)!.push(log);
    }

    for (const [key, phaseLogs] of phaseMap) {
      const label = key === 'no-phase' ? 'Không thuộc Phase nào' : `Phase (ID: ${key.replace('phase-', '')})`;
      groups.push({ phaseLabel: label, logs: phaseLogs });
    }

    return groups;
  }, [filteredLogs]);

  const hasMultipleGroups = groupedLogs.length > 1;

  const openEdit = (e: React.MouseEvent, log: DailyLog) => {
    e.stopPropagation();
    if (editingId === log.id) return;
    setEditingId(log.id);
    setEditForm({
      user_id: log.user_id,
      log_date: String(log.log_date),
      weight: log.weight ?? undefined,
      sleep_hours: log.sleep_hours ?? undefined,
      fatigue_level: log.fatigue_level ?? undefined,
      diet_meals_completed: log.diet_meals_completed ?? undefined,
      diet_target_meals: log.diet_target_meals ?? 4,
      diet_cheat_status: log.diet_cheat_status ?? 'NONE',
      diet_notes: log.diet_notes ?? undefined,
      is_workout_completed: log.is_workout_completed ?? false,
      steps: log.steps ?? undefined,
      cardio_duration_minutes: log.cardio_duration_minutes ?? undefined,
      cardio_type: log.cardio_type ?? undefined,
      body_images: log.body_images ?? [],
      chest_measure: log.chest_measure ?? undefined,
      waist_measure: log.waist_measure ?? undefined,
      hips_measure: log.hips_measure ?? undefined,
    });
  };

  const openNew = () => {
    setEditingId('new');
    setEditForm({
      user_id: 1,
      log_date: format(new Date(), 'yyyy-MM-dd'),
      diet_target_meals: 4,
      diet_cheat_status: 'NONE',
      is_workout_completed: false,
      body_images: [],
    });
  };

  const handleSave = () => {
    if (!editForm || !editForm.log_date) return;
    
    if (editingId === 'new') {
      createMutation.mutate(editForm as DailyLogCreate, {
        onSuccess: () => setEditingId(null)
      });
    } else if (editingId) {
      updateMutation.mutate({ id: editingId as number, data: editForm as DailyLogUpdate }, {
        onSuccess: () => setEditingId(null)
      });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !editForm) return;
    setUploadingImage(true);
    try {
      const files = Array.from(e.target.files);
      const uploadedUrls = [];
      for (const file of files) {
        const { url } = await uploadService.uploadImage(file);
        uploadedUrls.push(url);
      }
      setEditForm({
        ...editForm,
        body_images: [...(editForm.body_images || []), ...uploadedUrls]
      });
    } catch (error) {
      console.error('Error uploading image', error);
      alert('Tải ảnh lên thất bại!');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    if (!editForm || !editForm.body_images) return;
    const newImages = [...editForm.body_images];
    newImages.splice(index, 1);
    setEditForm({ ...editForm, body_images: newImages });
  };

  // ─── EDIT FORM ───
  const renderForm = () => {
    if (!editForm) return null;
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 bg-background p-4 rounded-xl border mt-3 shadow-inner" onClick={(e) => e.stopPropagation()}>
        {/* Date Input */}
        <div className="grid grid-cols-2 gap-4">
           <div className="space-y-1.5 col-span-2 sm:col-span-1">
             <Label className="text-sm font-medium">Ngày ghi nhận</Label>
             <Input 
                type="date" 
                value={editForm.log_date || ''} 
                onChange={e => setEditForm({...editForm, log_date: e.target.value})}
                disabled={editingId !== 'new'}
             />
           </div>
        </div>

        {/* Images */}
        <div className="space-y-3 p-3 rounded-lg bg-input/30 border border-dashed">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium flex items-center">
              <Camera className="w-4 h-4 mr-1.5" /> Ảnh Body Check-in
            </Label>
            <div>
              <Input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" id="image-upload" />
              <Label htmlFor="image-upload" className={cn("cursor-pointer flex items-center px-3 py-1.5 text-xs font-bold rounded-lg border bg-background shadow-sm hover:bg-input", uploadingImage && "opacity-50 pointer-events-none")}>
                {uploadingImage ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Plus className="w-3 h-3 mr-1" />}
                {uploadingImage ? 'Đang tải...' : 'Tải ảnh lên'}
              </Label>
            </div>
          </div>
          {editForm.body_images && editForm.body_images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {editForm.body_images.map((img, idx) => (
                <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border shadow-sm group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="checkin" className="object-cover w-full h-full" />
                  <button onClick={() => handleRemoveImage(idx)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nutrition */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5 col-span-2">
            <Label className="text-sm font-medium">Cân nặng (kg)</Label>
            <Input type="number" step="0.1" value={editForm.weight || ''} onChange={e => setEditForm({...editForm, weight: parseFloat(e.target.value) || undefined})} />
          </div>

          <div className="space-y-1.5 col-span-2 border-t pt-3">
            <Label className="text-sm font-medium text-efit-orange">Tuân thủ Bữa chính</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Đã ăn</span>
              <select 
                className="flex h-10 w-24 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={editForm.diet_meals_completed !== undefined ? editForm.diet_meals_completed : ''}
                onChange={e => setEditForm({...editForm, diet_meals_completed: e.target.value !== '' ? parseInt(e.target.value) : undefined})}
              >
                <option value="">--</option>
                {Array.from({ length: (editForm.diet_target_meals || 4) + 1 }, (_, i) => (
                  <option key={i} value={i}>{i} bữa</option>
                ))}
              </select>
              <span className="text-sm font-medium text-muted-foreground">/ {editForm.diet_target_meals || 4} bữa mục tiêu</span>
            </div>
          </div>
          
          <div className="space-y-1.5 col-span-2">
            <Label className="text-sm font-medium">Trạng thái ăn ngoài (Cheat Meal)</Label>
            <select 
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={editForm.diet_cheat_status || 'NONE'}
                onChange={e => setEditForm({...editForm, diet_cheat_status: e.target.value || 'NONE'})}
            >
                <option value="NONE">Sạch 100% (Không ăn ngoài)</option>
                <option value="PLANNED">Có ăn ngoài (Trong kế hoạch)</option>
                <option value="UNPLANNED">Ăn bậy (Mất kiểm soát)</option>
            </select>
          </div>

          {editForm.diet_cheat_status !== 'NONE' && (
            <div className="space-y-1.5 col-span-2">
              <Label className="text-sm font-medium text-destructive">Ghi chú ăn ngoài</Label>
              <textarea
                placeholder="Ví dụ: 1 ly trà sữa..."
                className="flex min-h-[60px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm custom-scrollbar"
                value={editForm.diet_notes || ''}
                onChange={e => setEditForm({...editForm, diet_notes: e.target.value || undefined})}
              />
            </div>
          )}
        </div>

        {/* Workout */}
        <div className="space-y-4 border-t pt-3">
          <div className="flex items-center justify-between bg-input/30 p-2 px-3 rounded-lg">
            <Label className="flex items-center text-sm font-bold">
              <Dumbbell className="w-4 h-4 mr-2"/> Hoàn thành tập tạ?
            </Label>
            <Switch 
                checked={editForm.is_workout_completed || false}
                onCheckedChange={v => setEditForm({...editForm, is_workout_completed: v})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Bước chân</Label>
              <Input type="number" value={editForm.steps || ''} onChange={e => setEditForm({...editForm, steps: parseInt(e.target.value) || undefined})} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Phút Cardio</Label>
              <Input type="number" value={editForm.cardio_duration_minutes || ''} onChange={e => setEditForm({...editForm, cardio_duration_minutes: parseInt(e.target.value) || undefined})} />
            </div>
          </div>
        </div>

        {/* Sleep & Fatigue */}
        <div className="grid grid-cols-2 gap-4 border-t pt-3">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium"><Moon className="w-3 h-3 mr-1 inline"/> Giờ ngủ</Label>
            <Input type="number" value={editForm.sleep_hours || ''} onChange={e => setEditForm({...editForm, sleep_hours: parseFloat(e.target.value) || undefined})} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-destructive"><Activity className="w-3 h-3 mr-1 inline"/> Mệt mỏi (1-5)</Label>
            <Input type="number" min={1} max={5} value={editForm.fatigue_level || ''} onChange={e => setEditForm({...editForm, fatigue_level: parseInt(e.target.value) || undefined})} />
          </div>
        </div>

        {/* Body Measurements */}
        <div className="grid grid-cols-3 gap-3 border-t pt-3">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-muted-foreground">Ngực (cm)</Label>
            <Input type="number" className="h-9 text-sm" value={editForm.chest_measure || ''} onChange={e => setEditForm({...editForm, chest_measure: parseFloat(e.target.value) || undefined})} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-muted-foreground">Eo (cm)</Label>
            <Input type="number" className="h-9 text-sm" value={editForm.waist_measure || ''} onChange={e => setEditForm({...editForm, waist_measure: parseFloat(e.target.value) || undefined})} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-muted-foreground">Mông (cm)</Label>
            <Input type="number" className="h-9 text-sm" value={editForm.hips_measure || ''} onChange={e => setEditForm({...editForm, hips_measure: parseFloat(e.target.value) || undefined})} />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setEditingId(null)}>Hủy</Button>
          <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} className="shadow-button-blue bg-efit-blue hover:bg-efit-blue/90 text-white">
            {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Lưu Nhật Ký
          </Button>
        </div>
      </div>
    );
  };

  // ─── LOG ROW ───
  const renderLogRow = (log: DailyLog) => {
    const isEditing = editingId === log.id;
    return (
      <div 
        key={log.id} 
        className={cn(
          "bg-card rounded-2xl border transition-all duration-300 overflow-hidden",
          isEditing ? "shadow-md ring-1 ring-primary/20" : "shadow-sm hover:shadow-md cursor-pointer"
        )}
        onClick={(e) => !isEditing && openEdit(e, log)}
      >
        {/* SUMMARY ROW */}
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center gap-4 md:gap-5">
          
          {/* Date & Score */}
          <div className="flex items-center justify-between md:flex-col md:items-start md:w-24 shrink-0">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {format(parseISO(String(log.log_date)), 'EEEE', { locale: vi })}
              </span>
              <span className="font-display font-extrabold text-2xl leading-none text-foreground">
                {format(parseISO(String(log.log_date)), 'dd/MM')}
              </span>
            </div>
            {log.compliance_score !== null && log.compliance_score !== undefined && (
              <div className={cn(
                "text-xs font-bold px-2 py-1 rounded-md md:mt-1.5 text-center", 
                log.compliance_score >= 80 ? "bg-efit-green/10 text-efit-green" : log.compliance_score >= 50 ? "bg-efit-orange/10 text-efit-orange" : "bg-destructive/10 text-destructive"
              )}>
                {log.compliance_score}%
              </div>
            )}
          </div>

          <div className="hidden md:block w-px h-12 bg-border shrink-0"></div>

          {/* Content Grid — 7 cols on xl, 4 on lg, 2 on mobile */}
          <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 items-center">
            
            {/* Thumbnail */}
            <div className="col-span-2 lg:col-span-1 flex items-center gap-2">
              {log.body_images && log.body_images.length > 0 ? (
                <div className="flex gap-1.5">
                  {log.body_images.slice(0, 2).map((img, idx) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={idx} src={img} alt="checkin" className="w-11 h-11 rounded-lg object-cover border shadow-sm" onClick={(e) => { e.stopPropagation(); setLightboxImages(log.body_images!); setLightboxIndex(idx); }} />
                  ))}
                  {log.body_images.length > 2 && (
                    <div className="w-11 h-11 rounded-lg bg-input/50 flex items-center justify-center text-[10px] font-bold text-muted-foreground border">
                      +{log.body_images.length - 2}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-input/20 px-2 py-1.5 rounded-lg border border-dashed">
                  <ImageIcon className="w-3 h-3 opacity-50" /> No img
                </div>
              )}
            </div>

            {/* Weight */}
            <div className="flex flex-col">
               <span className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Cân nặng</span>
               <span className="font-semibold text-sm">{log.weight ? `${log.weight} kg` : '—'}</span>
            </div>

            {/* Diet */}
            <div className="flex flex-col">
               <span className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Dinh dưỡng</span>
               {log.diet_meals_completed !== undefined && log.diet_meals_completed !== null ? (
                 <span className={cn("font-semibold text-sm", log.diet_cheat_status === 'UNPLANNED' ? 'text-destructive' : log.diet_cheat_status === 'PLANNED' ? 'text-efit-orange' : 'text-efit-green')}>
                   {log.diet_meals_completed}/{log.diet_target_meals} bữa
                 </span>
               ) : <span className="font-semibold text-sm">—</span>}
            </div>

            {/* Workout */}
            <div className="flex flex-col">
               <span className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Tập luyện</span>
               <span className="font-semibold text-sm flex items-center">
                 {log.is_workout_completed ? <CheckCircle2 className="w-3.5 h-3.5 text-efit-green mr-1" /> : <XCircle className="w-3.5 h-3.5 text-muted-foreground/40 mr-1"/>}
                 {log.is_workout_completed ? 'OK' : '—'}
               </span>
            </div>

            {/* Activity */}
            <div className="flex flex-col">
               <span className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Vận động</span>
               <span className="font-semibold text-sm">
                 {log.steps ? `${(log.steps/1000).toFixed(1)}k` : '—'}
                 {log.cardio_duration_minutes ? <span className="text-muted-foreground text-[10px] ml-1">+{log.cardio_duration_minutes}p</span> : null}
               </span>
            </div>

            {/* Sleep */}
            <div className="flex flex-col">
               <span className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Giấc ngủ</span>
               <span className="font-semibold text-sm">{log.sleep_hours ? `${log.sleep_hours}h` : '—'}</span>
            </div>

            {/* Fatigue */}
            <div className="flex flex-col">
               <span className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Mệt mỏi</span>
               <FatigueDots level={log.fatigue_level} />
            </div>

          </div>
        </div>

        {/* EXPANDED EDIT FORM */}
        {isEditing && (
          <div className="border-t bg-slate-50/50 p-4 sm:p-5">
            {renderForm()}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full space-y-6 pb-20 p-4 md:p-8 animate-in fade-in duration-500">
      {/* ─── HEADER ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-extrabold bg-gradient-to-r from-slate-900 to-slate-500 bg-clip-text text-transparent">Hành trình của tôi</h2>
          <p className="text-muted-foreground font-medium mt-1">Ghi nhận sự thay đổi và duy trì kỷ luật mỗi ngày.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="shrink-0">
            <Filter className="w-4 h-4 mr-2" /> Bộ lọc
          </Button>
          <Button onClick={openNew} className="shadow-button-blue shrink-0 bg-[#EF9035] hover:bg-[#D97D2A] text-white">
            <Plus className="mr-2 h-4 w-4" /> Log Hôm Nay
          </Button>
        </div>
      </div>

      {/* ─── FILTER BAR ─── */}
      {showFilters && (
        <div className="flex flex-wrap items-end gap-4 bg-card p-4 rounded-xl border shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="space-y-1">
            <Label className="text-xs font-bold text-muted-foreground">Từ ngày</Label>
            <Input type="date" className="w-40 h-9" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-bold text-muted-foreground">Đến ngày</Label>
            <Input type="date" className="w-40 h-9" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          {(dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-xs text-muted-foreground h-9">
              Xóa bộ lọc
            </Button>
          )}
        </div>
      )}

      {/* ─── SUMMARY STATS BAR ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border shadow-sm p-4 flex flex-col items-center">
          <CalendarCheck className="w-5 h-5 text-efit-blue mb-1" />
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Tổng ngày</span>
          <span className="font-display font-extrabold text-2xl text-foreground">{isLoading ? '...' : summaryStats.totalLogs}</span>
        </div>
        <div className="bg-card rounded-xl border shadow-sm p-4 flex flex-col items-center">
          <BarChart3 className="w-5 h-5 text-efit-green mb-1" />
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Compliance TB</span>
          <span className={cn("font-display font-extrabold text-2xl", summaryStats.avgCompliance !== null && summaryStats.avgCompliance >= 80 ? "text-efit-green" : summaryStats.avgCompliance !== null && summaryStats.avgCompliance >= 50 ? "text-efit-orange" : "text-foreground")}>
            {isLoading ? '...' : summaryStats.avgCompliance !== null ? `${summaryStats.avgCompliance}%` : '—'}
          </span>
        </div>
        <div className="bg-card rounded-xl border shadow-sm p-4 flex flex-col items-center">
          <TrendingUp className="w-5 h-5 text-efit-orange mb-1" />
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Cân nặng</span>
          <span className="font-display font-extrabold text-2xl text-foreground">
            {isLoading ? '...' : summaryStats.latestWeight ? `${summaryStats.latestWeight}` : '—'}
            {summaryStats.latestWeight && <span className="text-sm font-semibold text-muted-foreground ml-0.5">kg</span>}
          </span>
        </div>
        <div className="bg-card rounded-xl border shadow-sm p-4 flex flex-col items-center">
          <Flame className="w-5 h-5 text-destructive mb-1" />
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Streak</span>
          <span className="font-display font-extrabold text-2xl text-foreground">
            {isLoading ? '...' : summaryStats.streak}
            <span className="text-sm font-semibold text-muted-foreground ml-0.5">ngày</span>
          </span>
        </div>
      </div>

      {/* ─── NEW LOG FORM ─── */}
      {editingId === 'new' && (
        <div className="bg-card p-4 rounded-2xl shadow-sm border">
          <h3 className="font-display font-bold text-lg border-b pb-2 mb-2">Thêm Nhật Ký Mới</h3>
          {renderForm()}
        </div>
      )}

      {/* ─── LOGS LIST ─── */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">Lỗi tải dữ liệu.</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card/50 rounded-2xl border border-dashed">
            Chưa có dữ liệu nhật ký.
          </div>
        ) : hasMultipleGroups ? (
          // Grouped by Phase
          groupedLogs.map((group, gIdx) => (
            <div key={gIdx} className="space-y-3">
              <div className="flex items-center gap-3 py-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground bg-background px-3 py-1 rounded-full border">
                  {group.phaseLabel}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
              {group.logs.map(renderLogRow)}
            </div>
          ))
        ) : (
          // Flat list
          filteredLogs.map(renderLogRow)
        )}
      </div>

      {/* ─── LIGHTBOX ─── */}
      <Dialog open={lightboxImages.length > 0} onOpenChange={(open) => !open && setLightboxImages([])}>
        <DialogContent className="max-w-3xl bg-transparent border-0 shadow-none p-0 flex justify-center items-center outline-none">
          <DialogTitle className="sr-only">Xem ảnh Check-in</DialogTitle>
          {lightboxImages.length > 0 && (
            <div className="relative group flex items-center justify-center w-full max-w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={lightboxImages[lightboxIndex]} className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" alt="Full size" />
              
              {lightboxImages.length > 1 && (
                <>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity h-10 w-10"
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => prev > 0 ? prev - 1 : lightboxImages.length - 1); }}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity h-10 w-10"
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => prev < lightboxImages.length - 1 ? prev + 1 : 0); }}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
