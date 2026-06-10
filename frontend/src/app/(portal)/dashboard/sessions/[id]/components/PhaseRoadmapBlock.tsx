'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { sessionService } from '@/services/api/sessionService';
import { workoutService } from '@/services/api/workoutService';
import { Phase, DailyLog } from '@/types/session';
import { WorkoutProgram } from '@/types/workout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import NutritionPlanDialog from './NutritionPlanDialog';
import {
  Edit, Trash2, Dumbbell,
  Eye, Apple, TrendingUp, TrendingDown, Minus,
  CalendarCheck, BarChart3
} from 'lucide-react';
import { format, parseISO, eachDayOfInterval, isBefore, isAfter } from 'date-fns';
import { cn } from '@/lib/utils';
import { axiosClient } from '@/lib/axiosClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

export default function PhaseRoadmapBlock({ phase, onEditPhase, onDeletePhase }: Props) {
  const [isProgramDialogOpen, setIsProgramDialogOpen] = useState(false);
  const [workoutProgram, setWorkoutProgram] = useState<WorkoutProgram | null>(null);
  const [loadingProgram, setLoadingProgram] = useState(false);
  const [isNutritionPlanOpen, setIsNutritionPlanOpen] = useState(false);

  // Stats data
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [nutritionPlan, setNutritionPlan] = useState<any>(null);

  const days = useMemo(() => eachDayOfInterval({
    start: parseISO(phase.start_date),
    end: parseISO(phase.end_date)
  }), [phase.start_date, phase.end_date]);

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
      <CardContent className="p-0">

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
    </Card>
  );
}
