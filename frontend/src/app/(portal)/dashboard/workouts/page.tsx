'use client';

import { useState, useEffect, useCallback } from 'react';
import { workoutService } from '@/services/api/workoutService';
import { WorkoutProgramListItem } from '@/types/workout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from "@/components/ui/card"
import {
  Plus, Dumbbell, Edit, Trash2,
  Calendar, Flame, Activity, ArrowUpRight, Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import ProgramFormSheet from './components/ProgramFormSheet';
import ProgramWorkspaceModal from './components/ProgramWorkspaceModal';
import { cn } from '@/lib/utils';

const FREQUENCY_LABELS: Record<number, string> = {
  1: '1 buổi / tuần', 2: '2 buổi / tuần', 3: '3 buổi / tuần',
  4: '4 buổi / tuần', 5: '5 buổi / tuần', 6: '6 buổi / tuần', 7: 'Mỗi ngày',
};

export default function WorkoutsPage() {
  const [programs, setPrograms] = useState<WorkoutProgramListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // States for Modals
  const [isProgramFormOpen, setIsProgramFormOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<WorkoutProgramListItem | null>(null);
  const [workspaceProgramId, setWorkspaceProgramId] = useState<number | null>(null);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await workoutService.listPrograms();
      setPrograms(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPrograms(); }, [fetchPrograms]);

  const handleDeleteProgram = async (id: number) => {
    if (!confirm('Xóa chương trình và toàn bộ nội dung?')) return;
    try {
      await workoutService.deleteProgram(id);
      fetchPrograms();
    } catch (e) { console.error(e); }
  };

  const handleProgramCreated = (id?: number) => {
    fetchPrograms();
    if (id) {
      setWorkspaceProgramId(id);
      setIsWorkspaceOpen(true);
    }
  };

  const filteredPrograms = programs.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 p-6 md:p-10 space-y-8 bg-slate-50/30 min-h-full">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-200">
                <Activity className="w-6 h-6 text-[#54B7F0]" />
             </div>
             <h1 className="text-4xl font-black text-slate-900 tracking-tight">Giáo án Tập luyện</h1>
          </div>
          <p className="text-slate-500 font-medium max-w-lg leading-relaxed">
            Thiết kế và tối ưu hóa các chu kỳ tập luyện (Periodization) để đạt được mục tiêu thể hình của bạn.
          </p>
        </div>
        
        <Button
          onClick={() => { setEditingProgram(null); setIsProgramFormOpen(true); }}
          className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-7 rounded-[2rem] text-lg font-bold shadow-xl shadow-slate-200 transition-all active:scale-95 shrink-0 h-auto"
        >
          <Plus className="w-6 h-6 mr-2 text-[#54B7F0]" /> Tạo giáo án mới
        </Button>
      </div>

      {/* Stats / Controls Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#54B7F0] transition-colors" />
            <Input 
               placeholder="Tìm kiếm chương trình..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="pl-11 h-12 bg-white border-slate-100 rounded-2xl shadow-sm focus-visible:ring-[#54B7F0] focus-visible:ring-offset-0 border-none font-medium"
            />
         </div>
         
         <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-50">
            <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Bộ lọc:</div>
            <Button variant="ghost" className="rounded-xl text-xs font-black uppercase text-[#54B7F0] bg-[#54B7F0]/5">Tất cả</Button>
            <Button variant="ghost" className="rounded-xl text-xs font-bold uppercase text-slate-400">Đang chạy</Button>
            <Button variant="ghost" className="rounded-xl text-xs font-bold uppercase text-slate-400">Lưu trữ</Button>
         </div>
      </div>

      {/* Program Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-[2.5rem] h-72 animate-pulse border border-slate-50 shadow-sm" />
          ))
        ) : filteredPrograms.length === 0 ? (
          <div className="col-span-full py-32 flex flex-col items-center justify-center text-center">
             <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-slate-100 border border-slate-50">
                <Dumbbell className="w-10 h-10 text-slate-200" />
             </div>
             <h3 className="text-xl font-bold text-slate-800">Không tìm thấy giáo án</h3>
             <p className="text-slate-400 mt-2">Bắt đầu bằng cách tạo một chương trình tập luyện mới.</p>
          </div>
        ) : (
          filteredPrograms.map(program => (
            <Card 
              key={program.id}
              className="group border-none bg-white rounded-[2.5rem] shadow-sm shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500 overflow-hidden cursor-pointer active:scale-[0.98]"
              onClick={() => { setWorkspaceProgramId(program.id); setIsWorkspaceOpen(true); }}
            >
               <CardContent className="p-0 flex flex-col h-full">
                  <div className="p-8 space-y-6 flex-1">
                     <div className="flex items-start justify-between">
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-500 shadow-inner",
                          program.is_active ? "bg-slate-900 text-[#54B7F0]" : "bg-slate-50 text-slate-300"
                        )}>
                           <Dumbbell className="w-7 h-7" />
                        </div>
                        {program.is_active && (
                          <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase tracking-tighter rounded-full px-2">
                             Active
                          </Badge>
                        )}
                     </div>

                     <div className="space-y-2">
                        <h3 className="text-xl font-black text-slate-900 leading-tight group-hover:text-[#54B7F0] transition-colors line-clamp-2 uppercase italic">{program.name}</h3>
                        <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                           <Flame className="w-4 h-4 text-orange-400" />
                           <span>{FREQUENCY_LABELS[program.frequency_per_week]}</span>
                        </div>
                     </div>

                     <div className="flex items-center gap-2 pt-2">
                        <Badge variant="outline" className="rounded-lg border-slate-100 bg-slate-50 text-slate-500 font-mono text-[10px]">
                           {program.day_count ?? 0} DAYS
                        </Badge>
                        <Badge variant="outline" className="rounded-lg border-slate-100 bg-slate-50 text-slate-500 font-mono text-[10px]">
                           {new Date(program.created_at || '').toLocaleDateString('en-GB', { year: 'numeric', month: 'short' })}
                        </Badge>
                     </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="px-6 py-5 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                     <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => { e.stopPropagation(); setEditingProgram(program); setIsProgramFormOpen(true); }}
                          className="h-9 w-9 rounded-xl hover:bg-white text-slate-400 hover:text-slate-600 shadow-sm border border-transparent hover:border-slate-100"
                        >
                           <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => { e.stopPropagation(); handleDeleteProgram(program.id); }}
                          className="h-9 w-9 rounded-xl hover:bg-red-50 text-slate-300 hover:text-red-500"
                        >
                           <Trash2 className="w-4 h-4" />
                        </Button>
                     </div>
                     <div className="flex items-center gap-1.5 text-[#54B7F0] font-black text-[10px] uppercase tracking-widest">
                        Workspace <ArrowUpRight className="w-4 h-4" />
                     </div>
                  </div>
               </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Program Form Sheet */}
      <ProgramFormSheet
        isOpen={isProgramFormOpen}
        onClose={() => setIsProgramFormOpen(false)}
        initialData={editingProgram}
        onSuccess={handleProgramCreated}
      />

      {/* Fullscreen Workspace Modal */}
      <ProgramWorkspaceModal 
        programId={workspaceProgramId}
        isOpen={isWorkspaceOpen}
        onClose={() => { setIsWorkspaceOpen(false); fetchPrograms(); }}
      />
    </div>
  );
}
