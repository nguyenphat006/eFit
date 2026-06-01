'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { workoutService } from '@/services/api/workoutService';
import { WorkoutProgram, WorkoutDay, WorkoutExercise, DAY_OF_WEEK_LABELS } from '@/types/workout';
import { Loader2, Plus, Trash2, Calendar, GripVertical, ChevronLeft, Save, Sparkles, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface Props {
  programId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProgramWorkspaceModal({ programId, isOpen, onClose }: Props) {
  const [program, setProgram] = useState<WorkoutProgram | null>(null);
  const [loading, setLoading] = useState(false);

  // Thêm một ref để handle timeout auto-save tránh gọi API liên tục
  const saveTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  const fetchProgramDetail = useCallback(async () => {
    if (!programId) return;
    setLoading(true);
    try {
      const res = await workoutService.getProgram(programId);
      setProgram(res);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [programId]);

  useEffect(() => {
    if (isOpen && programId) {
      fetchProgramDetail();
    } else {
      setProgram(null);
    }
  }, [isOpen, programId, fetchProgramDetail]);

  const handleAddDay = async () => {
    if (!program) return;
    try {
      const newOrder = program.days.length + 1;
      const newDay = await workoutService.createDay(program.id, {
        day_label: `Buổi ${newOrder}`,
        day_of_week: null,
        order: newOrder
      });
      setProgram({ ...program, days: [...program.days, { ...newDay, exercises: [] }] });
    } catch (e) { console.error(e); }
  };

  const handleDeleteDay = async (dayId: number) => {
    if (!confirm('Xóa buổi tập này và toàn bộ bài tập?')) return;
    try {
      await workoutService.deleteDay(dayId);
      setProgram(prev => prev ? { ...prev, days: prev.days.filter(d => d.id !== dayId) } : null);
    } catch (e) { console.error(e); }
  };

  const handleDayChange = (dayId: number, field: keyof WorkoutDay, value: any) => {
    setProgram(prev => {
      if (!prev) return prev;
      const newDays = prev.days.map(d => d.id === dayId ? { ...d, [field]: value } : d);
      return { ...prev, days: newDays };
    });

    const key = `day-${dayId}-${field}`;
    if (saveTimeoutRef.current[key]) clearTimeout(saveTimeoutRef.current[key]);
    
    saveTimeoutRef.current[key] = setTimeout(async () => {
      try {
        await workoutService.updateDay(dayId, { [field]: value });
      } catch (e) { console.error('Auto save failed', e); }
    }, 1000);
  };

  const handleAddExercise = async (dayId: number) => {
    if (!program) return;
    const dayIndex = program.days.findIndex(d => d.id === dayId);
    if (dayIndex === -1) return;
    
    try {
      const newOrder = program.days[dayIndex].exercises.length + 1;
      const newEx = await workoutService.createExercise(dayId, {
        exercise_name: '',
        sets: 3,
        reps: '10',
        order: newOrder,
        target_rpe: null,
        tempo: null,
        rest_seconds: null,
        notes: null
      });
      
      setProgram(prev => {
        if (!prev) return prev;
        const newDays = [...prev.days];
        newDays[dayIndex] = {
          ...newDays[dayIndex],
          exercises: [...newDays[dayIndex].exercises, newEx]
        };
        return { ...prev, days: newDays };
      });
    } catch (e) { console.error(e); }
  };

  const handleDeleteExercise = async (dayId: number, exerciseId: number) => {
    try {
      await workoutService.deleteExercise(exerciseId);
      setProgram(prev => {
        if (!prev) return prev;
        const newDays = prev.days.map(d => {
          if (d.id === dayId) {
            return { ...d, exercises: d.exercises.filter(ex => ex.id !== exerciseId) };
          }
          return d;
        });
        return { ...prev, days: newDays };
      });
    } catch (e) { console.error(e); }
  };

  const handleExerciseChange = (dayId: number, exerciseId: number, field: keyof WorkoutExercise, value: any) => {
    // Optimistic UI Update
    setProgram(prev => {
      if (!prev) return prev;
      const newDays = prev.days.map(d => {
        if (d.id === dayId) {
          const newExs = d.exercises.map(ex => ex.id === exerciseId ? { ...ex, [field]: value } : ex);
          return { ...d, exercises: newExs };
        }
        return d;
      });
      return { ...prev, days: newDays };
    });

    const key = `ex-${exerciseId}-${field}`;
    if (saveTimeoutRef.current[key]) clearTimeout(saveTimeoutRef.current[key]);

    saveTimeoutRef.current[key] = setTimeout(async () => {
      try {
        const payload: any = { [field]: value === '' ? null : value };
        await workoutService.updateExercise(exerciseId, payload);
      } catch (e) { console.error('Auto save exercise failed', e); }
    }, 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-none w-screen h-screen m-0 p-0 rounded-none bg-[#F8FAFC] flex flex-col gap-0 border-none duration-500 overflow-hidden">
        
        {/* Header Bar */}
        <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.02)] z-20">
          <div className="flex items-center gap-6">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={onClose} 
              className="text-slate-500 hover:text-slate-800 rounded-xl border-slate-100 shadow-none hover:bg-slate-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            {loading ? (
              <div className="w-48 h-7 bg-slate-100 rounded-lg animate-pulse" />
            ) : (
              <div className="flex items-center gap-3">
                <h2 className="font-bold text-xl text-slate-900 tracking-tight">{program?.name}</h2>
                {program?.is_active && (
                  <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full border border-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Active Workspace</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2 text-xs text-slate-400 font-medium bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                <Save className="w-3.5 h-3.5 text-emerald-500"/> 
                <span>Tự động lưu...</span>
             </div>
             <div className="h-6 w-[1px] bg-slate-200" />
             <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-5 shadow-lg shadow-slate-200">
                <Sparkles className="w-4 h-4 mr-2 text-[#54B7F0]" /> Tối ưu AI
             </Button>
          </div>
        </div>

        <DialogHeader className="sr-only">
          <DialogTitle>Program Workspace</DialogTitle>
          <DialogDescription>Excel-like editing environment for your workout programs.</DialogDescription>
        </DialogHeader>

        {/* Main Workspace Area */}
        <div className="flex-1 overflow-auto custom-scrollbar relative">
          <div className="max-w-[1400px] mx-auto p-8 space-y-12 pb-32">
            
            {loading ? (
               <div className="flex flex-col items-center justify-center h-96 gap-4">
                 <div className="relative">
                   <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-[#54B7F0] animate-spin" />
                   <Activity className="absolute inset-0 m-auto w-6 h-6 text-[#54B7F0]" />
                 </div>
                 <p className="text-slate-400 font-medium animate-pulse">Đang thiết lập không gian làm việc...</p>
               </div>
            ) : program?.days && program.days.length > 0 ? (
               program.days.map((day, dIndex) => (
                 <div key={day.id} className="bg-white rounded-3xl border border-slate-200 shadow-[0_2px_15px_-1px_rgba(0,0,0,0.04)] overflow-hidden transition-all hover:shadow-[0_10px_25px_-3px_rgba(0,0,0,0.06)] group/card">
                   
                   {/* Day Header - Sticky */}
                   <div className="bg-slate-50/80 backdrop-blur-sm px-6 py-4 border-b border-slate-100 flex items-center justify-between group/header sticky top-0 z-10">
                     <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 group-hover/header:text-[#54B7F0] transition-colors cursor-grab active:cursor-grabbing">
                           <GripVertical className="w-5 h-5" />
                        </div>
                        
                        <div className="flex items-center gap-2 flex-1 max-w-2xl">
                          <input 
                            type="text" 
                            value={day.day_label} 
                            onChange={e => handleDayChange(day.id, 'day_label', e.target.value)}
                            placeholder="Nhập tên buổi tập..."
                            className="font-black text-slate-800 bg-transparent border-none focus:ring-0 focus:outline-none w-full p-0 text-lg placeholder:text-slate-300"
                          />
                          <div className="h-6 w-[1px] bg-slate-200 mx-2" />
                          <select 
                            value={day.day_of_week ?? ''} 
                            onChange={e => handleDayChange(day.id, 'day_of_week', e.target.value ? parseInt(e.target.value) : null)}
                            className="bg-white/50 border border-slate-200 rounded-xl text-xs px-3 py-1.5 text-slate-600 font-bold focus:outline-none focus:ring-2 focus:ring-[#54B7F0] focus:bg-white transition-all cursor-pointer hover:border-[#54B7F0]"
                          >
                            <option value="">🗓️ Linh hoạt</option>
                            {Object.entries(DAY_OF_WEEK_LABELS).map(([key, label]) => (
                              <option key={key} value={key}>{label}</option>
                            ))}
                          </select>
                        </div>
                     </div>
                     
                     <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-white border-slate-100 text-slate-400 font-mono text-[10px] px-2 rounded-lg">
                          DAY_{day.id}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteDay(day.id)}
                          className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover/card:opacity-100 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                     </div>
                   </div>

                   {/* Exercises "Excel" Grid */}
                   <div className="w-full overflow-x-auto">
                     <table className="w-full text-left text-sm border-collapse">
                       <thead>
                         <tr className="bg-white text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black border-b border-slate-50">
                           <th className="px-6 py-4 w-12 text-center">#</th>
                           <th className="px-4 py-4 min-w-[300px]">Tên bài tập</th>
                           <th className="px-2 py-4 w-28 text-center">Hiệp (Sets)</th>
                           <th className="px-2 py-4 w-32 text-center">Số lần (Reps)</th>
                           <th className="px-2 py-4 w-24 text-center">Cường độ (RPE)</th>
                           <th className="px-2 py-4 w-32 text-center">Nhịp (Tempo)</th>
                           <th className="px-2 py-4 w-32 text-center">Nghỉ (Giây)</th>
                           <th className="px-6 py-4 w-14 text-center"></th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                         {day.exercises.sort((a,b) => a.order - b.order).map((ex, eIndex) => (
                           <tr key={ex.id} className="hover:bg-slate-50/30 group/row transition-all duration-150">
                             <td className="px-6 py-3">
                               <div className="flex items-center justify-center">
                                 <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-400 text-[10px] font-black flex items-center justify-center border border-slate-200/50 group-hover/row:bg-[#54B7F0] group-hover/row:text-white group-hover/row:border-transparent transition-all">
                                   {eIndex + 1}
                                 </span>
                               </div>
                             </td>
                             <td className="px-4 py-3">
                               <input 
                                 type="text" 
                                 value={ex.exercise_name} 
                                 onChange={e => handleExerciseChange(day.id, ex.id, 'exercise_name', e.target.value)}
                                 placeholder="Gõ tên bài tập..."
                                 className="w-full bg-transparent border-none focus:ring-0 focus:outline-none p-0 text-slate-800 font-bold placeholder:text-slate-200 placeholder:font-normal"
                               />
                             </td>
                             <td className="px-2 py-3">
                               <div className="flex justify-center">
                                 <input 
                                   type="number" 
                                   value={ex.sets || ''} 
                                   onChange={e => handleExerciseChange(day.id, ex.id, 'sets', parseInt(e.target.value) || 0)}
                                   className="w-20 bg-white border border-slate-100 rounded-xl px-2 py-1.5 text-center font-mono font-bold text-slate-700 shadow-sm focus:border-[#54B7F0] focus:ring-2 focus:ring-[#54B7F0]/10 outline-none transition-all"
                                 />
                               </div>
                             </td>
                             <td className="px-2 py-3">
                               <div className="flex justify-center">
                                 <input 
                                   type="text" 
                                   value={ex.reps || ''} 
                                   onChange={e => handleExerciseChange(day.id, ex.id, 'reps', e.target.value)}
                                   placeholder="VD: 8-12"
                                   className="w-24 bg-white border border-slate-100 rounded-xl px-2 py-1.5 text-center font-mono font-bold text-slate-700 shadow-sm focus:border-[#54B7F0] focus:ring-2 focus:ring-[#54B7F0]/10 outline-none transition-all placeholder:text-slate-200"
                                 />
                               </div>
                             </td>
                             <td className="px-2 py-3">
                               <div className="flex justify-center">
                                 <input 
                                   type="number" step="0.5" max="10" min="0"
                                   value={ex.target_rpe || ''} 
                                   onChange={e => handleExerciseChange(day.id, ex.id, 'target_rpe', parseFloat(e.target.value) || null)}
                                   placeholder="@8.5"
                                   className="w-20 bg-white border border-slate-100 rounded-xl px-2 py-1.5 text-center font-mono font-black text-[#EF9035] shadow-sm focus:border-[#54B7F0] focus:ring-2 focus:ring-[#54B7F0]/10 outline-none transition-all placeholder:text-slate-200"
                                 />
                               </div>
                             </td>
                             <td className="px-2 py-3">
                               <div className="flex justify-center">
                                 <input 
                                   type="text" 
                                   value={ex.tempo || ''} 
                                   onChange={e => handleExerciseChange(day.id, ex.id, 'tempo', e.target.value)}
                                   placeholder="3-0-1-0"
                                   className="w-24 bg-white border border-slate-100 rounded-xl px-2 py-1.5 text-center font-mono text-[11px] font-bold text-slate-500 shadow-sm focus:border-[#54B7F0] focus:ring-2 focus:ring-[#54B7F0]/10 outline-none transition-all placeholder:text-slate-200"
                                 />
                               </div>
                             </td>
                             <td className="px-2 py-3">
                               <div className="flex justify-center">
                                 <div className="relative w-24">
                                   <input 
                                     type="number" step="10"
                                     value={ex.rest_seconds || ''} 
                                     onChange={e => handleExerciseChange(day.id, ex.id, 'rest_seconds', parseInt(e.target.value) || null)}
                                     placeholder="90"
                                     className="w-full bg-white border border-slate-100 rounded-xl px-2 py-1.5 text-center font-mono font-bold text-slate-600 shadow-sm focus:border-[#54B7F0] focus:ring-2 focus:ring-[#54B7F0]/10 outline-none transition-all placeholder:text-slate-200"
                                   />
                                   <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300 pointer-events-none uppercase">s</span>
                                 </div>
                               </div>
                             </td>
                             <td className="px-6 py-3">
                               <div className="flex justify-end">
                                 <Button 
                                   variant="ghost" 
                                   size="icon-xs" 
                                   onClick={() => handleDeleteExercise(day.id, ex.id)}
                                   className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover/row:opacity-100 transition-all scale-75 group-hover/row:scale-100"
                                 >
                                   <Trash2 className="w-4 h-4" />
                                 </Button>
                               </div>
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                     
                     {/* Add Exercise Row */}
                     <button 
                       onClick={() => handleAddExercise(day.id)}
                       className="w-full py-4 bg-slate-50/50 hover:bg-[#54B7F0]/5 border-t border-slate-50 flex items-center justify-center gap-3 text-[11px] text-slate-400 hover:text-[#54B7F0] font-black uppercase tracking-widest transition-all group/add"
                     >
                       <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover/add:border-[#54B7F0] group-hover/add:bg-[#54B7F0] group-hover/add:text-white transition-all shadow-sm">
                         <Plus className="w-3.5 h-3.5" />
                       </div>
                       Thêm bài tập mới
                     </button>
                   </div>
                 </div>
               ))
            ) : (
               <div className="flex flex-col items-center justify-center bg-white border-2 border-dashed border-slate-200 rounded-[3rem] h-[500px] text-center max-w-2xl mx-auto shadow-sm">
                 <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                    <Calendar className="w-10 h-10 text-slate-200" />
                 </div>
                 <h3 className="font-black text-2xl text-slate-800 tracking-tight">Kế hoạch trống</h3>
                 <p className="text-slate-400 text-sm mt-3 mb-10 max-w-sm leading-relaxed">Hãy chia chương trình này thành các buổi tập cụ thể để AI có thể phân tích cường độ của bạn.</p>
                 <Button 
                   onClick={handleAddDay} 
                   className="bg-[#54B7F0] hover:bg-[#3FA3DC] text-white rounded-2xl px-10 py-7 h-auto text-lg font-bold shadow-xl shadow-[#54B7F0]/20 active:scale-95 transition-all"
                 >
                   <Plus className="w-5 h-5 mr-3" /> Tạo buổi tập đầu tiên
                 </Button>
               </div>
            )}
            
            {program && program.days.length > 0 && (
              <div className="flex justify-center pb-24 pt-4 animate-in slide-in-from-bottom-8">
                <Button 
                  variant="outline" 
                  onClick={handleAddDay} 
                  className="bg-white border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 rounded-[2rem] px-10 py-8 h-auto text-lg font-black uppercase tracking-widest shadow-xl shadow-slate-200 transition-all active:scale-95"
                >
                  <Plus className="w-6 h-6 mr-3 text-[#54B7F0]" /> Thêm buổi tập mới
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
