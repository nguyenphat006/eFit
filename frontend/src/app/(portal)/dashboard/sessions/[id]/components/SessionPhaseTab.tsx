import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format, parseISO, eachDayOfInterval, isBefore } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Phase, DailyLog, Session } from '@/types/session';
import { WorkoutProgram } from '@/types/workout';
import { sessionService } from '@/services/api/sessionService';
import { workoutService } from '@/services/api/workoutService';
import { axiosClient } from '@/lib/axiosClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import NutritionPlanDialog from './NutritionPlanDialog';
import {
  Edit, Trash2, Dumbbell, Apple, TrendingUp, TrendingDown, Minus, BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  session: Session;
  selectedPhaseId: number | null;
  onPhaseSelect: (phaseId: number) => void;
  onEditPhase: (phase: Phase) => void;
  onDeletePhase: (phaseId: number) => void;
}

export default function SessionPhaseTab({
  session, selectedPhaseId, onPhaseSelect, onEditPhase, onDeletePhase
}: Props) {
  const sortedPhases = [...session.phases].sort((a, b) => a.order - b.order);
  const phase = sortedPhases.find(p => p.id === selectedPhaseId) || sortedPhases[0];

  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [nutritionPlan, setNutritionPlan] = useState<any>(null);
  
  const [isNutritionPlanOpen, setIsNutritionPlanOpen] = useState(false);
  const [isProgramDialogOpen, setIsProgramDialogOpen] = useState(false);
  const [workoutProgram, setWorkoutProgram] = useState<WorkoutProgram | null>(null);
  const [loadingProgram, setLoadingProgram] = useState(false);

  // Fetch data for current phase
  useEffect(() => {
    if (!phase) return;
    
    let isMounted = true;
    setLoadingLogs(true);
    
    // Fetch logs
    sessionService.getPhaseDailyLogs(phase.id)
      .then(data => {
        if (isMounted) setLogs(data);
      })
      .catch(console.error)
      .finally(() => {
        if (isMounted) setLoadingLogs(false);
      });

    // Fetch nutrition plan
    axiosClient.get(`/api/v1/nutrition-plans/phase/${phase.id}`)
      .then(res => {
        if (isMounted) setNutritionPlan(res.data);
      })
      .catch(() => {
        if (isMounted) setNutritionPlan(null);
      });

    return () => { isMounted = false; };
  }, [phase]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!phase) return null;
    const days = eachDayOfInterval({ start: parseISO(phase.start_date), end: parseISO(phase.end_date) });
    const today = new Date();
    const pastDays = days.filter(d => isBefore(d, today) || format(d, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'));
    
    const loggedDays = logs.length;
    const logRate = pastDays.length > 0 ? Math.round((loggedDays / pastDays.length) * 100) : 0;

    const scores = logs.filter(l => l.compliance_score !== null && l.compliance_score !== undefined).map(l => l.compliance_score!);
    const avgCompliance = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

    const weights = logs.filter(l => l.weight !== null && l.weight !== undefined).sort((a, b) => String(a.log_date).localeCompare(String(b.log_date)));
    const firstWeight = weights.length > 0 ? weights[0].weight : null;
    const lastWeight = weights.length > 0 ? weights[weights.length - 1].weight : null;
    const deltaWeight = firstWeight && lastWeight ? +(lastWeight - firstWeight).toFixed(1) : null;

    return { totalDays: days.length, loggedDays, pastDays: pastDays.length, logRate, avgCompliance, firstWeight, lastWeight, deltaWeight };
  }, [logs, phase]);

  // Workout summary
  const workoutSummary = useMemo(() => {
    if (!phase) return null;
    const prog = phase.workout_program_snapshot || workoutProgram;
    if (!prog || !prog.days) return null;
    return prog.days.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)).map((day: any) => ({
      label: day.day_label,
      exerciseCount: day.exercises?.length || 0,
    }));
  }, [phase, workoutProgram]);

  const handleViewProgram = async () => {
    if (!phase) return;
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

  if (sortedPhases.length === 0 || !phase) {
    return (
      <div className="bg-card rounded-2xl border border-dashed py-16 text-center animate-in fade-in">
        <p className="font-display font-extrabold text-lg text-foreground">Chưa có phase nào</p>
        <p className="text-sm font-semibold text-muted-foreground mt-1 max-w-md mx-auto">
          Mùa giải này chưa có giai đoạn nào. Vui lòng thêm phase ở tab Tổng quan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ─── HEADER & SELECTOR ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 rounded-2xl border shadow-sm">
        <div className="flex items-center gap-3">
          <Select 
            value={phase.id.toString()} 
            onValueChange={(val) => onPhaseSelect(parseInt(val))}
          >
            <SelectTrigger className="w-[200px] h-10 font-display font-extrabold border-2 border-input bg-transparent">
              <SelectValue placeholder="Chọn Phase" />
            </SelectTrigger>
            <SelectContent>
              {sortedPhases.map((p) => (
                <SelectItem key={p.id} value={p.id.toString()} className="font-semibold">
                  Phase {p.order}: {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="hidden sm:flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <span>{format(parseISO(phase.start_date), 'dd/MM')} - {format(parseISO(phase.end_date), 'dd/MM/yyyy')}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onEditPhase(phase)} className="h-9">
            <Edit className="w-4 h-4 mr-1.5" /> Sửa
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDeletePhase(phase.id)} className="h-9 text-destructive hover:bg-destructive/10 hover:text-destructive border-transparent">
            <Trash2 className="w-4 h-4 mr-1.5" /> Xóa
          </Button>
        </div>
      </div>

      {phase.description && (
        <div className="bg-card p-4 rounded-xl border text-sm text-muted-foreground">
          {phase.description}
        </div>
      )}

      {/* ─── PROGRESS STATS BAR ─── */}
      {stats && (
        <Card className="grid grid-cols-2 md:grid-cols-4 border shadow-sm rounded-2xl overflow-hidden">
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
        </Card>
      )}

      {/* ─── MACROS TARGETS + NUTRITION + WORKOUT ─── */}
      <Card className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x border shadow-sm rounded-2xl overflow-hidden">
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
            <Button variant="ghost" size="sm" onClick={() => setIsNutritionPlanOpen(true)} className="text-xs h-7 text-efit-green hover:text-efit-green/80 hover:bg-efit-green/10">
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
              <Button variant="ghost" size="sm" onClick={handleViewProgram} className="text-xs h-7 text-efit-orange hover:text-efit-orange/80 hover:bg-efit-orange/10">
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
      </Card>

      {/* ─── DIALOGS ─── */}
      <NutritionPlanDialog
        isOpen={isNutritionPlanOpen}
        onClose={() => setIsNutritionPlanOpen(false)}
        phase={phase}
      />

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
    </div>
  );
}
