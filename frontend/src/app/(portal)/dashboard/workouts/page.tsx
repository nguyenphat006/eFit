'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { workoutService } from '@/services/api/workoutService';
import { WorkoutProgram, WorkoutProgramListItem, WorkoutDay, WorkoutExercise, DAY_OF_WEEK_LABELS } from '@/types/workout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Plus, Dumbbell, Calendar, Edit, Trash2,
  Clock, ChevronDown, ChevronUp, Flame, Info, ChevronRight, Activity
} from 'lucide-react';
import ProgramFormSheet from './components/ProgramFormSheet';
import DayFormSheet from './components/DayFormSheet';
import ExerciseFormSheet from './components/ExerciseFormSheet';
import { cn } from '@/lib/utils';

const FREQUENCY_LABELS: Record<number, string> = {
  1: '1 buổi / tuần', 2: '2 buổi / tuần', 3: '3 buổi / tuần',
  4: '4 buổi / tuần', 5: '5 buổi / tuần', 6: '6 buổi / tuần', 7: 'Mỗi ngày',
};

const RPE_COLOR = (rpe: number) => {
  if (rpe >= 9) return 'text-red-500';
  if (rpe >= 8) return 'text-orange-500';
  if (rpe >= 7) return 'text-amber-500';
  return 'text-emerald-500';
};

export default function WorkoutsPage() {
  const [programs, setPrograms] = useState<WorkoutProgramListItem[]>([]);
  const [activeProgram, setActiveProgram] = useState<WorkoutProgram | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());

  // Sheets state
  const [isProgramFormOpen, setIsProgramFormOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<WorkoutProgramListItem | null>(null);
  const [isDayFormOpen, setIsDayFormOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<WorkoutDay | null>(null);
  const [isExerciseFormOpen, setIsExerciseFormOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<WorkoutExercise | null>(null);
  const [targetDayId, setTargetDayId] = useState<number | null>(null);

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await workoutService.listPrograms();
      setPrograms(res.data);
      const active = res.data.find(p => p.is_active);
      if (active && !selectedProgramId) setSelectedProgramId(active.id);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [selectedProgramId]);

  const fetchProgramDetail = useCallback(async (id: number) => {
    setLoadingDetail(true);
    try {
      const program = await workoutService.getProgram(id);
      setActiveProgram(program);
      setExpandedDays(new Set(program.days.map(d => d.id)));
    } catch (e) { console.error(e); }
    finally { setLoadingDetail(false); }
  }, []);

  useEffect(() => { fetchPrograms(); }, []);
  useEffect(() => { if (selectedProgramId) fetchProgramDetail(selectedProgramId); }, [selectedProgramId]);

  const toggleDay = (dayId: number) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      next.has(dayId) ? next.delete(dayId) : next.add(dayId);
      return next;
    });
  };

  const handleDeleteDay = async (dayId: number) => {
    if (!confirm('Xóa buổi tập này và toàn bộ bài tập?')) return;
    await workoutService.deleteDay(dayId);
    if (selectedProgramId) fetchProgramDetail(selectedProgramId);
  };

  const handleDeleteExercise = async (exerciseId: number) => {
    if (!confirm('Xóa bài tập này?')) return;
    await workoutService.deleteExercise(exerciseId);
    if (selectedProgramId) fetchProgramDetail(selectedProgramId);
  };

  const handleDeleteProgram = async (id: number) => {
    if (!confirm('Xóa chương trình và toàn bộ nội dung?')) return;
    await workoutService.deleteProgram(id);
    if (selectedProgramId === id) { setSelectedProgramId(null); setActiveProgram(null); }
    fetchPrograms();
  };

  const sortedDays = useMemo(() => activeProgram?.days
    ? [...activeProgram.days].sort((a, b) => {
      if (a.day_of_week !== null && b.day_of_week !== null) return a.day_of_week - b.day_of_week;
      return a.order - b.order;
    })
    : [], [activeProgram]);

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50/40">
      {/* ── Left Panel: Program List ─────────────────────────── */}
      <aside className="w-80 shrink-0 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-6 border-b border-slate-100 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#54B7F0]" />
              <h2 className="font-bold text-slate-900 text-lg">Chương trình</h2>
            </div>
            <Button
              size="icon-xs"
              onClick={() => { setEditingProgram(null); setIsProgramFormOpen(true); }}
              className="bg-[#54B7F0] hover:bg-[#3FA3DC] text-white rounded-full w-8 h-8 shadow-sm"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#54B7F0]/10 to-transparent rounded-lg -z-0 pointer-events-none" />
            <p className="text-[11px] text-slate-500 font-medium px-3 py-1 relative z-10">Lịch tập luyện theo chu kỳ của bạn</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-3 space-y-1">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="mx-4 mb-3 h-20 rounded-2xl bg-slate-100 animate-pulse" />
            ))
          ) : programs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center px-8">
              <Dumbbell className="w-12 h-12 text-slate-200 mb-4" />
              <p className="text-sm text-slate-500 font-semibold">Chưa có chương trình</p>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">Hãy bắt đầu hành trình bằng cách tạo chương trình tập luyện đầu tiên.</p>
            </div>
          ) : (
            programs.map(program => (
              <div key={program.id} className="px-3">
                <button
                  onClick={() => setSelectedProgramId(program.id)}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl transition-all duration-200 group border border-transparent",
                    selectedProgramId === program.id
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                      : "hover:bg-slate-50 text-slate-700"
                  )}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {program.is_active && (
                            <span className="w-2 h-2 rounded-full bg-[#54B7F0] animate-pulse shrink-0" />
                          )}
                          <span className={cn(
                            "text-sm font-bold truncate block",
                            selectedProgramId === program.id ? "text-white" : "text-slate-900"
                          )}>
                            {program.name}
                          </span>
                        </div>
                        <Badge 
                          variant={selectedProgramId === program.id ? "secondary" : "outline"} 
                          className={cn(
                            "text-[10px] px-2 py-0 h-5 font-medium border-slate-200",
                            selectedProgramId === program.id ? "bg-white/10 border-transparent text-slate-100" : "text-slate-500 bg-slate-50"
                          )}
                        >
                          {FREQUENCY_LABELS[program.frequency_per_week]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingProgram(program); setIsProgramFormOpen(true); }}
                          className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            selectedProgramId === program.id ? "hover:bg-white/10 text-white/60 hover:text-white" : "hover:bg-white text-slate-400 hover:text-slate-600 shadow-sm border border-slate-100 bg-white"
                          )}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteProgram(program.id); }}
                          className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            selectedProgramId === program.id ? "hover:bg-red-500/20 text-white/60 hover:text-red-300" : "hover:bg-red-50 text-slate-300 hover:text-red-500 shadow-sm border border-slate-100 bg-white"
                          )}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* ── Main Content: Program Detail ─────────────────────── */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
        {!selectedProgramId ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
            <div className="w-24 h-24 rounded-3xl bg-white shadow-xl shadow-slate-200 flex items-center justify-center mb-8 border border-slate-50 animate-in zoom-in-50 duration-500">
              <Dumbbell className="w-12 h-12 text-[#54B7F0]" />
            </div>
            <h3 className="font-bold text-slate-900 text-2xl mb-3">Sẵn sàng để bứt phá?</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Chọn một chương trình luyện tập từ danh sách bên trái hoặc tạo lộ trình mới để theo dõi sự tiến bộ của bạn.
            </p>
            <Button
              onClick={() => { setEditingProgram(null); setIsProgramFormOpen(true); }}
              className="mt-8 bg-[#54B7F0] hover:bg-[#3FA3DC] text-white px-8 py-6 rounded-2xl shadow-lg shadow-[#54B7F0]/20 transition-all active:scale-95"
            >
              <Plus className="w-5 h-4 mr-2" /> Tạo chương trình mới
            </Button>
          </div>
        ) : loadingDetail ? (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl h-32 animate-pulse border border-slate-100" />
            <div className="grid grid-cols-1 gap-6">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="bg-white rounded-3xl h-64 animate-pulse border border-slate-100" />
              ))}
            </div>
          </div>
        ) : activeProgram ? (
          <div key={activeProgram.id} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Program Header Card */}
            <Card className="border-none bg-white shadow-sm shadow-slate-200/50 rounded-3xl overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="font-bold text-slate-900 text-3xl tracking-tight">{activeProgram.name}</h1>
                      {activeProgram.is_active && (
                        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded-full px-3 py-1 font-bold text-[10px] uppercase">
                          Đang kích hoạt
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span className="font-semibold text-slate-700">{FREQUENCY_LABELS[activeProgram.frequency_per_week]}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                        <Calendar className="w-4 h-4 text-[#54B7F0]" />
                        <span className="font-semibold text-slate-700">{activeProgram.days.length} Buổi tập</span>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                        <Dumbbell className="w-4 h-4 text-slate-400" />
                        <span className="font-semibold text-slate-700">{activeProgram.days.reduce((sum, d) => sum + d.exercises.length, 0)} Bài tập</span>
                      </div>
                    </div>
                    {activeProgram.notes && (
                      <div className="flex items-start gap-2 pt-2">
                        <Info className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
                        <p className="text-xs text-slate-400 italic leading-relaxed">{activeProgram.notes}</p>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => { setEditingDay(null); setTargetDayId(null); setIsDayFormOpen(true); }}
                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl px-6 py-6 h-auto shadow-xl shadow-slate-200 transition-all active:scale-95 shrink-0"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Thêm buổi tập
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Days List */}
            <div className="space-y-6">
              {sortedDays.length === 0 ? (
                <div className="bg-white rounded-[2rem] border-2 border-dashed border-slate-100 p-16 text-center shadow-sm">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <Calendar className="w-8 h-8 text-slate-200" />
                  </div>
                  <p className="text-slate-500 font-bold text-lg">Chưa có buổi tập nào</p>
                  <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto leading-relaxed">Thiết kế lịch trình cụ thể cho từng buổi tập để đạt hiệu quả cao nhất.</p>
                  <Button
                    variant="outline"
                    onClick={() => setIsDayFormOpen(true)}
                    className="mt-8 border-slate-200 rounded-2xl px-8 hover:bg-slate-50 text-slate-600 font-bold"
                  >
                    <Plus className="w-4 h-4 mr-2 text-[#54B7F0]" /> Bắt đầu ngay
                  </Button>
                </div>
              ) : (
                sortedDays.map((day, idx) => {
                  const isExpanded = expandedDays.has(day.id);
                  const sortedExercises = [...day.exercises].sort((a, b) => a.order - b.order);

                  return (
                    <Card key={day.id} className={cn(
                      "border-none shadow-sm shadow-slate-200/50 rounded-[2rem] overflow-hidden transition-all duration-300",
                      isExpanded ? "ring-2 ring-slate-900/5" : "hover:bg-white"
                    )}>
                      {/* Day Header */}
                      <div
                        className={cn(
                          "flex items-center justify-between px-6 py-5 cursor-pointer transition-colors",
                          isExpanded ? "bg-slate-900/5" : "hover:bg-slate-50/50"
                        )}
                        onClick={() => toggleDay(day.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shrink-0 shadow-sm transition-all duration-300",
                            isExpanded ? "bg-slate-900 text-white scale-110" : "bg-[#54B7F0] text-white"
                          )}>
                            {idx + 1}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-base">{day.day_label}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              {day.day_of_week !== null && (
                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none text-[10px] px-2 py-0">
                                  {DAY_OF_WEEK_LABELS[day.day_of_week]}
                                </Badge>
                              )}
                              <span className="text-xs text-slate-400 font-medium">{sortedExercises.length} bài tập</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={(e) => { e.stopPropagation(); setEditingDay(day); setIsDayFormOpen(true); }}
                            className="p-2 rounded-xl hover:bg-white text-slate-400 hover:text-slate-600 transition-all shadow-sm border border-transparent hover:border-slate-100">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteDay(day.id); }}
                            className="p-2 rounded-xl hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all shadow-sm border border-transparent hover:border-red-100">
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <div className={cn(
                            "p-2 rounded-xl transition-all ml-2",
                            isExpanded ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"
                          )}>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>

                      {/* Exercises */}
                      {isExpanded && (
                        <div className="p-6 pt-2">
                          {sortedExercises.length > 0 ? (
                            <div className="space-y-3">
                              {/* Exercise Table Header */}
                              <div className="grid grid-cols-[1fr_120px_80px_100px_80px_44px] gap-4 px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">
                                <span>Thông tin bài tập</span>
                                <span className="text-center">Số Set/Reps</span>
                                <span className="text-center">Cường độ</span>
                                <span className="text-center">Tempo</span>
                                <span className="text-center">Nghỉ</span>
                                <span></span>
                              </div>
                              
                              <div className="space-y-2">
                                {sortedExercises.map((exercise, exIdx) => (
                                  <div key={exercise.id}
                                    className="grid grid-cols-[1fr_120px_80px_100px_80px_44px] gap-4 px-4 py-4 items-center rounded-2xl hover:bg-slate-50 transition-all group">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-400 text-[10px] font-bold flex items-center justify-center shrink-0 border border-slate-200">
                                        {exIdx + 1}
                                      </span>
                                      <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-800 truncate">{exercise.exercise_name}</p>
                                        {exercise.notes && <p className="text-xs text-slate-400 truncate mt-0.5">{exercise.notes}</p>}
                                      </div>
                                    </div>
                                    <div className="text-center">
                                      <span className="text-sm font-mono font-bold text-slate-700 bg-slate-100/50 px-3 py-1 rounded-lg border border-slate-100">
                                        {exercise.sets} <span className="text-slate-300 mx-0.5">×</span> {exercise.reps}
                                      </span>
                                    </div>
                                    <div className="text-center">
                                      {exercise.target_rpe
                                        ? <span className={cn("text-sm font-black font-mono tracking-tighter", RPE_COLOR(exercise.target_rpe))}>@{exercise.target_rpe}</span>
                                        : <span className="text-slate-200 text-xs">—</span>}
                                    </div>
                                    <div className="text-center">
                                      {exercise.tempo
                                        ? <span className="text-[11px] font-mono font-bold bg-white text-slate-500 px-2 py-1 rounded-lg shadow-sm border border-slate-100 inline-block min-w-[60px]">{exercise.tempo}</span>
                                        : <span className="text-slate-200 text-xs">—</span>}
                                    </div>
                                    <div className="text-center">
                                      {exercise.rest_seconds
                                        ? <div className="text-xs text-slate-500 font-bold flex items-center justify-center gap-1.5">
                                          <Clock className="w-3.5 h-3.5 text-slate-300" />
                                          {exercise.rest_seconds >= 60
                                            ? <span className="font-mono">{Math.floor(exercise.rest_seconds / 60)}<span className="text-[10px] ml-0.5">m</span>{exercise.rest_seconds % 60 > 0 ? String(exercise.rest_seconds % 60) + <span className="text-[10px] ml-0.5">s</span> : ''}</span>
                                            : <span className="font-mono">{exercise.rest_seconds}<span className="text-[10px] ml-0.5">s</span></span>}
                                        </div>
                                        : <span className="text-slate-200 text-xs">—</span>}
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                      <button onClick={() => { setEditingExercise(exercise); setTargetDayId(day.id); setIsExerciseFormOpen(true); }}
                                        className="p-2 rounded-xl hover:bg-white text-slate-400 hover:text-slate-600 shadow-sm border border-transparent hover:border-slate-100 transition-all">
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button onClick={() => handleDeleteExercise(exercise.id)}
                                        className="p-2 rounded-xl hover:bg-red-50 text-slate-300 hover:text-red-500 shadow-sm border border-transparent hover:border-red-100 transition-all">
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-100">
                              <p className="text-slate-400 text-sm font-medium">Chưa có bài tập nào được thêm.</p>
                            </div>
                          )}

                          <div className="mt-4 flex justify-start">
                            <Button
                              variant="ghost"
                              onClick={() => { setEditingExercise(null); setTargetDayId(day.id); setIsExerciseFormOpen(true); }}
                              className="text-[#54B7F0] hover:text-[#3FA3DC] hover:bg-[#54B7F0]/5 font-bold text-xs rounded-xl px-4"
                            >
                              <Plus className="w-4 h-4 mr-2" /> Thêm bài tập
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        ) : null}
      </main>

      {/* Form Sheets */}
      <ProgramFormSheet
        isOpen={isProgramFormOpen}
        onClose={() => setIsProgramFormOpen(false)}
        initialData={editingProgram}
        onSuccess={() => { fetchPrograms(); if (selectedProgramId) fetchProgramDetail(selectedProgramId); }}
      />
      <DayFormSheet
        isOpen={isDayFormOpen}
        onClose={() => { setIsDayFormOpen(false); setEditingDay(null); }}
        programId={selectedProgramId!}
        initialData={editingDay}
        onSuccess={() => { if (selectedProgramId) fetchProgramDetail(selectedProgramId); }}
      />
      <ExerciseFormSheet
        isOpen={isExerciseFormOpen}
        onClose={() => { setIsExerciseFormOpen(false); setEditingExercise(null); setTargetDayId(null); }}
        dayId={targetDayId!}
        initialData={editingExercise}
        onSuccess={() => { if (selectedProgramId) fetchProgramDetail(selectedProgramId); }}
      />
    </div>
  );
}
