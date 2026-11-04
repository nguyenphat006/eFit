'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { sessionService } from '@/services/api/sessionService';
import { workoutService } from '@/services/api/workoutService';
import { uploadService } from '@/services/api/uploadService';
import { Phase, DailyLog, DailyLogInlineUpsert } from '@/types/session';
import { WorkoutProgram } from '@/types/workout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import NutritionPlanDialog from './NutritionPlanDialog';
import {
  Edit, Trash2, Dumbbell,
  Eye, Apple, TrendingUp, TrendingDown, Minus,
  CalendarCheck, BarChart3, UploadCloud, X,
  Moon, Activity, Save, Edit3, Image as ImageIcon,
  CheckCircle2, XCircle, ChevronLeft, ChevronRight, Plus,
  Camera, Utensils, Loader2
} from 'lucide-react';
import { format, parseISO, eachDayOfInterval, isBefore, isAfter, isToday, isFuture } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { axiosClient } from '@/lib/axiosClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Props {
  phase: Phase;
  onEditPhase: (phase: Phase) => void;
  onDeletePhase: (id: number) => void;
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

export default function PhaseRoadmapBlock({ phase, onEditPhase, onDeletePhase }: Props) {
  const [isProgramDialogOpen, setIsProgramDialogOpen] = useState(false);
  const [workoutProgram, setWorkoutProgram] = useState<WorkoutProgram | null>(null);
  const [loadingProgram, setLoadingProgram] = useState(false);
  const [isNutritionPlanOpen, setIsNutritionPlanOpen] = useState(false);

  // Stats data
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [nutritionPlan, setNutritionPlan] = useState<any>(null);

  // Pagination State (7 days per page)
  const itemsPerPage = 7;
  const [currentPage, setCurrentPage] = useState(0);

  // Edit State
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<DailyLogInlineUpsert | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Lightbox State
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);

  const days = useMemo(() => eachDayOfInterval({
    start: parseISO(phase.start_date),
    end: parseISO(phase.end_date)
  }), [phase.start_date, phase.end_date]);

  const totalPages = Math.ceil(days.length / itemsPerPage);
  const currentDays = useMemo(() => {
    return days.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
  }, [days, currentPage]);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  // Convert logs array to map for fast date lookup
  const logByDateMap = useMemo(() => {
    const map = new Map<string, DailyLog>();
    for (const l of logs) {
      map.set(String(l.log_date), l);
    }
    return map;
  }, [logs]);

  const openEditor = (dateStr: string) => {
    const existing = logByDateMap.get(dateStr);
    setEditingDate(dateStr);
    setEditForm({
      log_date: dateStr,
      weight: existing?.weight ?? null,
      diet_meals_completed: existing?.diet_meals_completed ?? null,
      diet_target_meals: existing?.diet_target_meals ?? 4,
      diet_completed_meal_ids: existing?.diet_completed_meal_ids ?? [],
      diet_cheat_status: existing?.diet_cheat_status ?? 'NONE',
      diet_notes: existing?.diet_notes ?? null,
      sleep_hours: existing?.sleep_hours ?? null,
      work_hours: existing?.work_hours ?? null,
      fatigue_level: existing?.fatigue_level ?? 3,
      is_workout_completed: existing?.is_workout_completed ?? false,
      steps: existing?.steps ?? null,
      cardio_duration_minutes: existing?.cardio_duration_minutes ?? null,
      cardio_type: existing?.cardio_type ?? null,
      body_images: existing?.body_images ?? null,
      chest_measure: existing?.chest_measure ?? null,
      waist_measure: existing?.waist_measure ?? null,
      hips_measure: existing?.hips_measure ?? null,
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !editForm) return;
    setIsUploading(true);
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
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    if (!editForm || !editForm.body_images) return;
    const newImages = [...editForm.body_images];
    newImages.splice(index, 1);
    setEditForm({ ...editForm, body_images: newImages });
  };

  const handleMealToggle = (mealId: number) => {
    if (!editForm) return;
    const currentIds = editForm.diet_completed_meal_ids || [];
    let nextIds: number[];
    if (currentIds.includes(mealId)) {
      nextIds = currentIds.filter(id => id !== mealId);
    } else {
      nextIds = [...currentIds, mealId];
    }
    setEditForm(prev => {
      if (!prev) return null;
      return {
        ...prev,
        diet_completed_meal_ids: nextIds,
        diet_meals_completed: nextIds.length,
        diet_target_meals: nutritionPlan?.meals?.length || prev.diet_target_meals || 4
      };
    });
  };

  const tickedMacros = useMemo(() => {
    if (!nutritionPlan || !nutritionPlan.meals || !editForm || !editForm.diet_completed_meal_ids) {
      return null;
    }
    let cal = 0;
    let pro = 0;
    let carb = 0;
    let fat = 0;
    
    for (const mId of editForm.diet_completed_meal_ids) {
      const meal = nutritionPlan.meals.find((m: any) => m.id === mId);
      if (meal) {
        cal += meal.target_calories || 0;
        pro += meal.target_protein || 0;
        carb += meal.target_carbs || 0;
        fat += meal.target_fat || 0;
      }
    }
    return { cal, pro, carb, fat };
  }, [nutritionPlan, editForm?.diet_completed_meal_ids]);

  const displayMacros = useMemo(() => {
    const existingLog = editingDate ? logByDateMap.get(editingDate) : null;
    const cal = tickedMacros ? tickedMacros.cal : (existingLog?.calories_in ?? 0);
    const pro = tickedMacros ? tickedMacros.pro : (existingLog?.protein_in ?? 0);
    const carb = tickedMacros ? tickedMacros.carb : (existingLog?.carbs_in ?? 0);
    const fat = tickedMacros ? tickedMacros.fat : (existingLog?.fat_in ?? 0);
    
    const targetCal = existingLog?.target_calories_snapshot ?? nutritionPlan?.target_calories ?? phase?.target_calories ?? null;
    const targetPro = existingLog?.target_protein_snapshot ?? nutritionPlan?.target_protein ?? phase?.target_protein ?? null;
    const targetCarb = existingLog?.target_carbs_snapshot ?? nutritionPlan?.target_carbs ?? phase?.target_carbs ?? null;
    const targetFat = existingLog?.target_fat_snapshot ?? nutritionPlan?.target_fat ?? phase?.target_fat ?? null;
    
    return { cal, pro, carb, fat, targetCal, targetPro, targetCarb, targetFat };
  }, [tickedMacros, editingDate, logByDateMap, nutritionPlan, phase]);

  const handleSaveLog = async () => {
    if (!editForm) return;
    try {
      const res = await sessionService.upsertDailyLog(phase.id, editForm);
      setLogs(prev => {
        const idx = prev.findIndex(l => l.log_date === res.log_date);
        if (idx > -1) {
          const next = [...prev];
          next[idx] = res;
          return next;
        } else {
          return [...prev, res];
        }
      });
      setEditingDate(null);
    } catch (e) {
      console.error(e);
      alert("Lỗi khi lưu log");
    }
  };

  // Fetch daily logs for this phase
  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const data = await sessionService.getPhaseDailyLogs(phase.id);
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  }, [phase.id]);

  // Fetch nutrition plan (lightweight)
  const fetchNutritionPlan = useCallback(async () => {
    try {
      const res = await axiosClient.get(`/api/v1/nutrition-plans/phase/${phase.id}`);
      setNutritionPlan(res.data);
    } catch {
      setNutritionPlan(null);
    }
  }, [phase.id]);

  useEffect(() => {
    fetchLogs();
    fetchNutritionPlan();
  }, [fetchLogs, fetchNutritionPlan]);

  // Calculate stats
  const stats = useMemo(() => {
    const today = new Date();
    const pastDays = days.filter(d => isBefore(d, today) || format(d, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'));
    const totalDays = days.length;
    const loggedDays = logs.length;
    const logRate = pastDays.length > 0 ? Math.round((loggedDays / pastDays.length) * 100) : 0;

    const scores = logs.filter(l => l.compliance_score !== null && l.compliance_score !== undefined).map(l => l.compliance_score!);
    const avgCompliance = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

    const weights = logs.filter(l => l.weight !== null && l.weight !== undefined).sort((a, b) => String(a.log_date).localeCompare(String(b.log_date)));
    const firstWeight = weights.length > 0 ? weights[0].weight : null;
    const lastWeight = weights.length > 0 ? weights[weights.length - 1].weight : null;
    const deltaWeight = firstWeight && lastWeight ? +(lastWeight - firstWeight).toFixed(1) : null;

    return { totalDays, loggedDays, pastDays: pastDays.length, logRate, avgCompliance, firstWeight, lastWeight, deltaWeight };
  }, [logs, days]);

  // Workout summary from snapshot or program
  const workoutSummary = useMemo(() => {
    const prog = phase.workout_program_snapshot || workoutProgram;
    if (!prog || !prog.days) return null;
    return prog.days.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)).map((day: any) => ({
      label: day.day_label,
      exerciseCount: day.exercises?.length || 0,
    }));
  }, [phase.workout_program_snapshot, workoutProgram]);

  const handleViewProgram = async () => {
    setIsProgramDialogOpen(true);
    if (phase.workout_program_snapshot) {
      setWorkoutProgram(phase.workout_program_snapshot);
      return;
    }
    if (!phase.workout_program_id) return;
    if (workoutProgram?.id === phase.workout_program_id) return;
    setLoadingProgram(true);
    try {
      const data = await workoutService.getProgram(phase.workout_program_id);
      setWorkoutProgram(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProgram(false);
    }
  };

  return (
    <Card className="mb-6 overflow-hidden glass-card">
      {/* ─── HEADER ─── */}
      <CardHeader className="bg-background/50 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-efit-blue text-white uppercase tracking-wider text-[10px] rounded-pill">
              Phase {phase.order}
            </Badge>
            <h3 className="text-xl font-display font-extrabold text-foreground">{phase.name}</h3>
          </div>
          <p className="text-sm text-muted-foreground font-semibold">
            {format(parseISO(phase.start_date), 'dd/MM/yyyy')} - {format(parseISO(phase.end_date), 'dd/MM/yyyy')}
            <span className="ml-2 font-medium">({days.length} ngày)</span>
          </p>
          {phase.description && <p className="text-sm mt-2 text-muted-foreground max-w-2xl">{phase.description}</p>}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="icon" onClick={() => onEditPhase(phase)} className="text-muted-foreground hover:text-efit-blue">
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDeletePhase(phase.id)} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      {/* ─── CONTENT ─── */}
      <CardContent className="p-0 bg-background/30">
        <Tabs defaultValue="overview" className="w-full">
          <div className="flex border-b bg-slate-50/50 px-5 py-2 justify-between items-center">
            <TabsList className="bg-input/60 border h-9 p-0.5">
              <TabsTrigger
                value="overview"
                className="text-xs font-display font-extrabold px-3 py-1 data-[state=active]:bg-card"
              >
                Tổng quan & Giáo án
              </TabsTrigger>
              <TabsTrigger
                value="logs"
                className="text-xs font-display font-extrabold px-3 py-1 data-[state=active]:bg-card"
              >
                Nhật ký hằng ngày
              </TabsTrigger>
            </TabsList>
            <div className="text-xs font-bold text-muted-foreground hidden sm:block">
              Tuần {currentPage + 1} / {totalPages}
            </div>
          </div>

          <TabsContent value="overview" className="m-0 bg-card">
            {/* 1. PROGRESS STATS BAR */}
            <div className="grid grid-cols-2 md:grid-cols-4 border-b">
              {/* Logged Days */}
              <div className="flex flex-col items-center justify-center p-4 border-r border-b md:border-b-0">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Ngày đã log</span>
                <span className="font-display font-extrabold text-2xl text-foreground">
                  {loadingLogs ? '...' : stats.loggedDays}<span className="text-sm font-semibold text-muted-foreground">/{stats.pastDays}</span>
                </span>
                {!loadingLogs && (
                  <div className="w-full max-w-[80px] h-1.5 bg-input rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-efit-blue rounded-full transition-all duration-500" style={{ width: `${stats.logRate}%` }} />
                  </div>
                )}
              </div>

              {/* Avg Compliance */}
              <div className="flex flex-col items-center justify-center p-4 md:border-r border-b md:border-b-0">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Compliance TB</span>
                {loadingLogs ? (
                  <span className="font-display font-extrabold text-2xl text-muted-foreground">...</span>
                ) : stats.avgCompliance !== null ? (
                  <span className={cn("font-display font-extrabold text-2xl", stats.avgCompliance >= 80 ? "text-efit-green" : stats.avgCompliance >= 50 ? "text-efit-orange" : "text-destructive")}>
                    {stats.avgCompliance}%
                  </span>
                ) : (
                  <span className="font-display font-extrabold text-2xl text-muted-foreground/40">—</span>
                )}
              </div>

              {/* Latest Weight */}
              <div className="flex flex-col items-center justify-center p-4 border-r">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Cân nặng hiện tại</span>
                <span className="font-display font-extrabold text-2xl text-foreground">
                  {loadingLogs ? '...' : stats.lastWeight ? `${stats.lastWeight}` : '—'}
                  {stats.lastWeight && <span className="text-sm font-semibold text-muted-foreground ml-0.5">kg</span>}
                </span>
              </div>

              {/* Delta Weight */}
              <div className="flex flex-col items-center justify-center p-4">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Thay đổi</span>
                {loadingLogs ? (
                  <span className="font-display font-extrabold text-2xl text-muted-foreground">...</span>
                ) : stats.deltaWeight !== null ? (
                  <div className="flex items-center gap-1">
                    {stats.deltaWeight > 0 ? <TrendingUp className="w-5 h-5 text-efit-orange" /> : stats.deltaWeight < 0 ? <TrendingDown className="w-5 h-5 text-efit-green" /> : <Minus className="w-5 h-5 text-muted-foreground" />}
                    <span className={cn("font-display font-extrabold text-2xl", stats.deltaWeight > 0 ? "text-efit-orange" : stats.deltaWeight < 0 ? "text-efit-green" : "text-muted-foreground")}>
                      {stats.deltaWeight > 0 ? '+' : ''}{stats.deltaWeight} kg
                    </span>
                  </div>
                ) : (
                  <span className="font-display font-extrabold text-2xl text-muted-foreground/40">—</span>
                )}
              </div>
            </div>

            {/* 2. MACROS TARGETS + NUTRITION + WORKOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x">
              {/* Macro Targets */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-efit-blue" />
                  <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Mục tiêu Dinh dưỡng</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-input/30 rounded-lg p-3 text-center">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Calories</span>
                    <span className="font-display font-extrabold text-lg">{phase.target_calories || '—'}</span>
                    {phase.target_calories && <span className="text-xs text-muted-foreground ml-0.5">kcal</span>}
                  </div>
                  <div className="bg-input/30 rounded-lg p-3 text-center">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Protein</span>
                    <span className="font-display font-extrabold text-lg text-blue-500">{phase.target_protein || '—'}</span>
                    {phase.target_protein && <span className="text-xs text-muted-foreground ml-0.5">g</span>}
                  </div>
                  <div className="bg-input/30 rounded-lg p-3 text-center">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Carbs</span>
                    <span className="font-display font-extrabold text-lg text-efit-orange">{phase.target_carbs || '—'}</span>
                    {phase.target_carbs && <span className="text-xs text-muted-foreground ml-0.5">g</span>}
                  </div>
                  <div className="bg-input/30 rounded-lg p-3 text-center">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Fat</span>
                    <span className="font-display font-extrabold text-lg text-amber-500">{phase.target_fat || '—'}</span>
                    {phase.target_fat && <span className="text-xs text-muted-foreground ml-0.5">g</span>}
                  </div>
                </div>
              </div>

              {/* Nutrition Plan Summary */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Apple className="w-4 h-4 text-efit-green" />
                    <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Lịch ăn</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setIsNutritionPlanOpen(true)} className="text-xs h-7 text-efit-green hover:text-efit-green/80">
                    {nutritionPlan ? 'Chi tiết' : 'Tạo mới'}
                  </Button>
                </div>
                {nutritionPlan && nutritionPlan.meals ? (
                  <div className="space-y-2">
                    {nutritionPlan.meals.map((meal: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between bg-input/30 rounded-lg px-3 py-2">
                        <span className="text-sm font-semibold text-foreground">{meal.name}</span>
                        <span className="text-xs font-bold text-muted-foreground">{meal.target_calories} kcal</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-24 bg-input/20 rounded-xl border border-dashed text-xs text-muted-foreground">
                    <Apple className="w-5 h-5 opacity-30 mb-1" />
                    Chưa có lịch ăn
                  </div>
                )}
              </div>

              {/* Workout Summary */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-efit-orange" />
                    <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Giáo án tập</span>
                  </div>
                  {(phase.workout_program_id || phase.workout_program_snapshot) && (
                    <Button variant="ghost" size="sm" onClick={handleViewProgram} className="text-xs h-7 text-efit-orange hover:text-efit-orange/80">
                      Chi tiết
                    </Button>
                  )}
                </div>
                {workoutSummary && workoutSummary.length > 0 ? (
                  <div className="space-y-2">
                    {workoutSummary.map((day: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between bg-input/30 rounded-lg px-3 py-2">
                        <span className="text-sm font-semibold text-foreground">{day.label}</span>
                        <Badge variant="outline" className="text-[10px] font-bold">{day.exerciseCount} bài tập</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-24 bg-input/20 rounded-xl border border-dashed text-xs text-muted-foreground">
                    <Dumbbell className="w-5 h-5 opacity-30 mb-1" />
                    Chưa có giáo án
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="m-0 bg-card/40 p-4 md:p-6">
            {/* Custom Pagination Header */}
            <div className="flex items-center justify-between p-3 px-5 bg-card border rounded-t-xl">
              <span className="text-sm font-bold text-foreground">
                Hiển thị Tuần {currentPage + 1} / {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 0}
                  className="h-8 bg-card"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Tuần trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages - 1}
                  className="h-8 bg-card"
                >
                  Tuần sau <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>

            {/* Grid of Day Cards */}
            <div className="p-4 md:p-6 bg-card border-x border-b rounded-b-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {currentDays.map(dateObj => {
                  const dateStr = format(dateObj, 'yyyy-MM-dd');
                  const future = isFuture(dateObj) && !isToday(dateObj);
                  const today = isToday(dateObj);
                  const log = logByDateMap.get(dateStr);

                  return (
                    <div
                      key={dateStr}
                      className={cn(
                        "flex flex-col bg-card rounded-2xl border p-4 transition-all duration-300",
                        today ? "border-efit-blue shadow-card-hover ring-1 ring-efit-blue/20" : "shadow-sm hover:shadow-md",
                        future ? "opacity-60 grayscale-[0.5]" : ""
                      )}
                    >
                      {/* Date Header */}
                      <div className="flex justify-between items-start mb-3 pb-3 border-b">
                        <div className="flex flex-col">
                          <span className="label-eyebrow text-muted-foreground">
                            {format(dateObj, 'EEE', { locale: vi })} {today && '(Nay)'}
                          </span>
                          <span className={cn("font-display font-extrabold text-2xl leading-none mt-1", today ? "text-efit-blue" : "text-foreground")}>
                            {format(dateObj, 'dd/MM')}
                          </span>
                        </div>
                        {log?.compliance_score !== null && log?.compliance_score !== undefined && (
                          <div className={cn("pill", log.compliance_score >= 80 ? 'pill-green' : log.compliance_score >= 50 ? 'pill-orange' : 'pill-red')}>
                            {log.compliance_score}%
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex flex-col gap-3">
                        {future ? (
                          <div className="flex-1 flex items-center justify-center text-xs font-semibold text-muted-foreground italic">
                            Chưa đến ngày
                          </div>
                        ) : (
                          <>
                            {/* Body Image Thumbnail */}
                            {log?.body_images && log.body_images.length > 0 ? (
                              <div 
                                className="w-full aspect-[3/4] rounded-xl overflow-hidden border cursor-pointer hover:border-efit-blue transition-all relative group shadow-sm"
                                onClick={() => { setLightboxImages(log.body_images!); setLightboxIndex(0); }}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={log.body_images[0]} alt="Check-in" className="w-full h-full object-cover object-center" />
                                {log.body_images.length > 1 && (
                                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-md backdrop-blur-sm">
                                    +{log.body_images.length - 1}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="w-full h-32 rounded-xl bg-input/50 border border-dashed flex flex-col items-center justify-center text-xs uppercase font-bold text-muted-foreground gap-2">
                                <ImageIcon className="w-6 h-6 opacity-40" />
                                Không có ảnh
                              </div>
                            )}

                            {/* Metrics Grid */}
                            <div className="grid grid-cols-2 gap-2 mt-1">
                              <div className="flex flex-col bg-input/30 p-2 rounded-lg">
                                <span className="text-[10px] text-muted-foreground font-bold uppercase">Cân nặng</span>
                                <span className="font-display font-bold text-sm">{log?.weight ? `${log.weight} kg` : '-'}</span>
                              </div>
                              <div className="flex flex-col bg-input/30 p-2 rounded-lg">
                                <span className="text-[10px] text-muted-foreground font-bold uppercase">Dinh dưỡng</span>
                                <span className="font-display font-bold text-sm">
                                  {log?.diet_meals_completed !== undefined && log?.diet_meals_completed !== null
                                    ? `${log.diet_meals_completed}/${log.diet_target_meals || 4} bữa`
                                    : '-'}
                                  {log?.diet_cheat_status === 'UNPLANNED' && <span className="ml-1 text-destructive">(Ăn bậy)</span>}
                                  {log?.diet_cheat_status === 'PLANNED' && <span className="ml-1 text-efit-green">(Ăn xả)</span>}
                                </span>
                              </div>
                              <div className="flex flex-col bg-input/30 p-2 rounded-lg">
                                <span className="text-[10px] text-muted-foreground font-bold uppercase">Tập luyện</span>
                                <div className="flex items-center gap-1">
                                  <span className="font-display font-bold text-sm">{log?.is_workout_completed ? <CheckCircle2 className="w-4 h-4 text-efit-green"/> : <XCircle className="w-4 h-4 text-muted-foreground/50"/>}</span>
                                </div>
                              </div>
                              <div className="flex flex-col bg-input/30 p-2 rounded-lg">
                                <span className="text-[10px] text-muted-foreground font-bold uppercase">Bước chân</span>
                                <span className="font-display font-bold text-sm">{log?.steps ? log.steps.toLocaleString() : '-'}</span>
                              </div>
                              <div className="col-span-2 flex flex-col bg-input/30 p-2 rounded-lg">
                                <span className="text-[10px] text-muted-foreground font-bold uppercase">Cardio</span>
                                <span className="font-display font-bold text-sm">
                                  {log?.cardio_duration_minutes && log?.cardio_type ? `${log.cardio_duration_minutes} phút - ${log.cardio_type}` : '-'}
                                </span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Footer Action */}
                      {!future && (
                        <Button
                          variant={log ? "outline" : "default"}
                          size="sm"
                          className={cn("w-full mt-4 h-9", !log && "shadow-button-blue")}
                          onClick={() => openEditor(dateStr)}
                        >
                          {log ? <Edit3 className="w-3 h-3 mr-1.5" /> : <Plus className="w-3 h-3 mr-1.5" />}
                          {log ? 'Sửa' : 'Nhập'}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* ─── DIALOGS ─── */}

      {/* Program Details Dialog */}
      <Dialog open={isProgramDialogOpen} onOpenChange={setIsProgramDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto glass-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-display font-extrabold">
              <Dumbbell className="w-6 h-6 text-efit-orange" />
              Giáo án: {workoutProgram?.name || 'Đang tải...'}
            </DialogTitle>
          </DialogHeader>

          {loadingProgram ? (
            <div className="p-8 text-center text-muted-foreground">Đang tải dữ liệu giáo án...</div>
          ) : workoutProgram ? (
            <div className="mt-4">
              <div className="space-y-6">
                {(workoutProgram.days || []).sort((a, b) => (a.order || 0) - (b.order || 0)).map((day) => (
                  <div key={day.id} className="flex flex-col bg-card p-4 rounded-2xl border shadow-card-light">
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b">
                      <h4 className="text-xl font-display font-bold text-foreground">
                        {day.day_label}
                      </h4>
                      {day.day_of_week !== null && day.day_of_week !== undefined && (
                        <Badge className="bg-input text-foreground font-bold rounded-pill shadow-none hover:bg-input">
                          Thứ {day.day_of_week === 0 ? 'Chủ Nhật' : day.day_of_week + 1}
                        </Badge>
                      )}
                    </div>

                    {day.exercises && day.exercises.length > 0 ? (
                      <div className="rounded-xl border overflow-hidden bg-background">
                        <Table>
                          <TableHeader className="bg-input/50">
                            <TableRow>
                              <TableHead className="w-[50px] text-center text-xs font-bold uppercase tracking-wider">#</TableHead>
                              <TableHead className="text-xs font-bold uppercase tracking-wider">Bài tập</TableHead>
                              <TableHead className="text-center w-[80px] text-xs font-bold uppercase tracking-wider">Sets</TableHead>
                              <TableHead className="text-center w-[100px] text-xs font-bold uppercase tracking-wider">Reps</TableHead>
                              <TableHead className="text-center w-[80px] text-xs font-bold uppercase tracking-wider">RPE</TableHead>
                              <TableHead className="text-center w-[120px] text-xs font-bold uppercase tracking-wider">Tempo</TableHead>
                              <TableHead className="text-center w-[100px] text-xs font-bold uppercase tracking-wider">Nghỉ</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {day.exercises.sort((a, b) => (a.order || 0) - (b.order || 0)).map((ex, i) => (
                              <TableRow key={ex.id}>
                                <TableCell className="text-center font-bold text-muted-foreground">{i + 1}</TableCell>
                                <TableCell className="font-semibold">{ex.exercise_name}</TableCell>
                                <TableCell className="text-center font-display font-extrabold">{ex.sets}</TableCell>
                                <TableCell className="text-center font-semibold">{ex.reps}</TableCell>
                                <TableCell className="text-center text-muted-foreground font-medium">{ex.target_rpe || '-'}</TableCell>
                                <TableCell className="text-center text-muted-foreground">{ex.tempo || '-'}</TableCell>
                                <TableCell className="text-center text-muted-foreground">{ex.rest_seconds ? `${ex.rest_seconds}s` : '-'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-muted-foreground text-sm italic py-4 flex justify-center bg-input/30 rounded-xl border border-dashed">
                        Nghỉ ngơi (Không có bài tập)
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {(!workoutProgram.days || workoutProgram.days.length === 0) && (
                <div className="text-center p-8 text-muted-foreground bg-input/30 rounded-2xl border border-dashed">
                  Giáo án này chưa có lịch tập chi tiết.
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Nutrition Plan Dialog */}
      <NutritionPlanDialog
        isOpen={isNutritionPlanOpen}
        onClose={() => setIsNutritionPlanOpen(false)}
        phase={phase}
      />

      {/* Inline Edit Dialog */}
      <Dialog open={!!editingDate} onOpenChange={(open) => !open && setEditingDate(null)}>
        <DialogContent className="max-w-md sm:max-w-lg glass-card border-primary/20">
          <DialogHeader>
            <DialogTitle className="display-sm text-center">
              Nhật ký ngày {editingDate && format(parseISO(editingDate), 'dd/MM/yyyy')}
            </DialogTitle>
          </DialogHeader>

          {editForm && (
            <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto px-1 custom-scrollbar">
              {/* Ảnh Body Check-in */}
              <div className="space-y-3 bg-card p-4 rounded-xl border shadow-sm">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center text-foreground">
                    <ImageIcon className="w-4 h-4 mr-1.5 text-primary" /> Ảnh Body Check-in
                  </Label>
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <Label htmlFor="image-upload" className={cn("cursor-pointer flex items-center justify-center px-3 py-1.5 text-xs font-bold rounded-lg border bg-input hover:bg-input/80 transition-colors", isUploading && "opacity-50 pointer-events-none")}>
                      {isUploading ? <UploadCloud className="w-3 h-3 mr-1 animate-pulse" /> : <Camera className="w-3 h-3 mr-1" />}
                      {isUploading ? 'Đang tải...' : 'Tải ảnh lên'}
                    </Label>
                  </div>
                </div>
                {editForm.body_images && editForm.body_images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {editForm.body_images.map((imgUrl, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border shadow-sm group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imgUrl} alt="checkin" className="object-cover w-full h-full" />
                        <button onClick={() => handleRemoveImage(idx)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Macros vs target */}
              {(displayMacros.targetCal !== null || displayMacros.cal > 0) && (
                <div className="space-y-3 bg-card border rounded-xl p-4 shadow-sm">
                  <div className="flex items-baseline gap-2 mb-1">
                    <Utensils className="w-4 h-4 text-[#EF9035]" />
                    <Label className="text-sm font-bold text-foreground">Dinh dưỡng thực tế vs Mục tiêu</Label>
                  </div>
                  <MacroBar label="Calories" value={displayMacros.cal} target={displayMacros.targetCal} color="#EF9035" />
                  <MacroBar label="Protein" value={displayMacros.pro} target={displayMacros.targetPro} color="#54B7F0" />
                  <MacroBar label="Carbs" value={displayMacros.carb} target={displayMacros.targetCarb} color="#10b981" />
                  <MacroBar label="Fat" value={displayMacros.fat} target={displayMacros.targetFat} color="#a78bfa" />
                </div>
              )}

              {/* Cân nặng & Dinh dưỡng */}
              <div className="grid grid-cols-2 gap-4 bg-card p-4 rounded-xl border shadow-sm">
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-sm font-medium text-muted-foreground">Cân nặng (kg)</Label>
                  <Input
                    type="number"
                    value={editForm.weight || ''}
                    onChange={e => setEditForm({ ...editForm, weight: parseFloat(e.target.value) || null })}
                  />
                </div>
                
                <div className="space-y-1.5 col-span-2 mt-2 pt-2 border-t">
                  <Label className="text-sm font-medium text-efit-orange">Danh sách bữa ăn (Tuân thủ Bữa chính)</Label>
                  {nutritionPlan && nutritionPlan.meals && nutritionPlan.meals.length > 0 ? (
                    <div className="space-y-2 mt-2">
                      {nutritionPlan.meals.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)).map((meal: any) => {
                        const isChecked = (editForm.diet_completed_meal_ids || []).includes(meal.id);
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
                      <span className="text-sm font-medium text-muted-foreground">Số bữa ăn chuẩn (theo giáo án)</span>
                      <select 
                        className="flex h-10 w-24 rounded-lg border border-input bg-input px-3 py-2 text-sm ring-offset-background transition-all font-semibold ml-2"
                        value={editForm.diet_meals_completed !== null && editForm.diet_meals_completed !== undefined ? editForm.diet_meals_completed : ''}
                        onChange={e => setEditForm({...editForm, diet_meals_completed: e.target.value !== '' ? parseInt(e.target.value) : null})}
                      >
                        <option value="">--</option>
                        {Array.from({ length: (editForm.diet_target_meals || 4) + 1 }, (_, i) => (
                          <option key={i} value={i}>{i} bữa</option>
                        ))}
                      </select>
                      <span className="text-sm font-medium text-muted-foreground">/ {editForm.diet_target_meals || 4} bữa mục tiêu</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-1.5 col-span-2 mt-2">
                  <Label className="text-sm font-medium text-muted-foreground">Phá lệ / Ăn ngoài giáo án</Label>
                  <select 
                      className="flex h-10 w-full rounded-lg border border-input bg-input px-3 py-2 text-sm ring-offset-background transition-all font-semibold"
                      value={editForm.diet_cheat_status || 'NONE'}
                      onChange={e => setEditForm({...editForm, diet_cheat_status: e.target.value || 'NONE'})}
                  >
                      <option value="NONE">Sạch 100% (Không ăn ngoài)</option>
                      <option value="PLANNED">Có ăn ngoài (Trong kế hoạch cho phép)</option>
                      <option value="UNPLANNED">Ăn bậy (Mất kiểm soát)</option>
                  </select>
                </div>
                
                {editForm.diet_cheat_status !== 'NONE' && (
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-sm font-medium text-destructive">Ghi chú ăn ngoài (Bắt buộc)</Label>
                    <textarea
                      placeholder="VD: Trưa ăn bún bò, chiều uống 1 ly trà sữa..."
                      className="flex min-h-[60px] w-full rounded-lg border border-input bg-input px-3 py-2 text-sm transition-all custom-scrollbar"
                      value={editForm.diet_notes || ''}
                      onChange={e => setEditForm({...editForm, diet_notes: e.target.value || null})}
                    />
                  </div>
                )}
              </div>

              {/* Tập luyện & Phục hồi */}
              <div className="space-y-4 bg-card p-4 rounded-xl border shadow-sm">
                <div className="flex items-center justify-between bg-input/50 p-2 px-3 rounded-lg">
                  <Label className="flex items-center text-sm font-bold">
                    <Dumbbell className="w-4 h-4 mr-2 text-primary"/> Hoàn thành giáo án tạ?
                  </Label>
                  <Switch 
                      checked={editForm.is_workout_completed || false}
                      onCheckedChange={v => setEditForm({...editForm, is_workout_completed: v})}
                  />
                </div>
                
                {/* Vận động bổ sung (Cardio & Steps) */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <Label className="text-sm font-medium text-muted-foreground">Bước chân (Steps)</Label>
                      <Input 
                          type="number" 
                          placeholder="VD: 8000"
                          value={editForm.steps || ''} 
                          onChange={e => setEditForm({...editForm, steps: parseInt(e.target.value) || null})}
                      />
                    </div>
                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <Label className="text-sm font-medium text-muted-foreground">Thời lượng Cardio (phút)</Label>
                      <Input 
                          type="number" 
                          placeholder="VD: 30"
                          value={editForm.cardio_duration_minutes || ''} 
                          onChange={e => setEditForm({...editForm, cardio_duration_minutes: parseInt(e.target.value) || null})}
                      />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <Label className="text-sm font-medium text-muted-foreground">Loại Cardio</Label>
                      <select 
                          className="flex h-11 w-full rounded-lg border border-input bg-input px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all font-semibold"
                          value={editForm.cardio_type || ''}
                          onChange={e => setEditForm({...editForm, cardio_type: e.target.value || null})}
                      >
                          <option value="">Chọn loại Cardio (Không bắt buộc)</option>
                          <option value="Chạy bộ">Chạy bộ</option>
                          <option value="Đạp xe">Đạp xe</option>
                          <option value="Đi bộ nhanh">Đi bộ nhanh</option>
                          <option value="LISS">LISS (Cardio cường độ thấp)</option>
                          <option value="HIIT">HIIT (Cardio cường độ cao)</option>
                          <option value="Bơi lội">Bơi lội</option>
                          <option value="Khác">Khác</option>
                      </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-2">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-muted-foreground flex items-center"><Moon className="w-3 h-3 mr-1"/> Giờ ngủ</Label>
                    <Input 
                        type="number" 
                        value={editForm.sleep_hours || ''} 
                        onChange={e => setEditForm({...editForm, sleep_hours: parseFloat(e.target.value) || null})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-destructive flex items-center"><Activity className="w-3 h-3 mr-1 text-destructive"/> Mệt mỏi (1-5)</Label>
                    <Input 
                        type="number" min={1} max={5}
                        value={editForm.fatigue_level || ''} 
                        onChange={e => setEditForm({...editForm, fatigue_level: parseInt(e.target.value) || null})}
                    />
                  </div>
                </div>
              </div>

              {/* Số đo cơ thể */}
              <div className="space-y-3 bg-card p-4 rounded-xl border shadow-sm">
                <Label className="text-sm font-medium flex items-center">
                  <Activity className="w-4 h-4 mr-1.5" /> Số đo cơ thể (cm)
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-muted-foreground">Ngực</Label>
                    <Input
                      type="number"
                      value={editForm.chest_measure || ''}
                      onChange={e => setEditForm({ ...editForm, chest_measure: parseFloat(e.target.value) || null })}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-muted-foreground">Eo</Label>
                    <Input
                      type="number"
                      value={editForm.waist_measure || ''}
                      onChange={e => setEditForm({ ...editForm, waist_measure: parseFloat(e.target.value) || null })}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-muted-foreground">Mông</Label>
                    <Input
                      type="number"
                      value={editForm.hips_measure || ''}
                      onChange={e => setEditForm({ ...editForm, hips_measure: parseFloat(e.target.value) || null })}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setEditingDate(null)} className="rounded-xl">Hủy</Button>
            <Button onClick={handleSaveLog} className="shadow-button-blue rounded-xl">
              <Save className="w-4 h-4 mr-2" /> Lưu Nhật Ký
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- LIGHTBOX (Full Image Viewer) --- */}
      <Dialog open={lightboxImages.length > 0} onOpenChange={(open) => !open && setLightboxImages([])}>
        <DialogContent className="max-w-3xl bg-transparent border-0 shadow-none p-0 flex justify-center items-center outline-none">
          <DialogTitle className="sr-only">Xem ảnh Check-in</DialogTitle>
          {lightboxImages.length > 0 && (
            <div className="relative group flex items-center justify-center w-full max-w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={lightboxImages[lightboxIndex]} className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" alt={`Full size body check ${lightboxIndex + 1}`} />
              
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
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md">
                    {lightboxIndex + 1} / {lightboxImages.length}
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
