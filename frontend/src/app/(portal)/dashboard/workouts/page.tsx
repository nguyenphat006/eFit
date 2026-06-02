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
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

import { cn } from '@/lib/utils';

const FREQUENCY_LABELS: Record<number, string> = {
  0: 'Chưa có buổi tập', 1: '1 buổi / tuần', 2: '2 buổi / tuần', 3: '3 buổi / tuần',
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

  // Delete State
  const [programToDelete, setProgramToDelete] = useState<WorkoutProgramListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await workoutService.listPrograms();
      setPrograms(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPrograms(); }, [fetchPrograms]);

  const handleDeleteConfirm = async () => {
    if (!programToDelete) return;
    setIsDeleting(true);
    try {
      await workoutService.deleteProgram(programToDelete.id);
      setProgramToDelete(null);
      fetchPrograms();
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleProgramCreated = (id?: number, isNew?: boolean) => {
    fetchPrograms();
    if (id && isNew) {
      setWorkspaceProgramId(id);
      setIsWorkspaceOpen(true);
    }
  };

  const filteredPrograms = programs.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col space-y-2">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-500 bg-clip-text text-transparent">
            Giáo án Tập luyện
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            Thiết kế và tối ưu hóa các chu kỳ tập luyện (Periodization) để đạt được mục tiêu thể hình của bạn.
          </p>
        </div>
        <Button
          onClick={() => { setEditingProgram(null); setIsProgramFormOpen(true); }}
          className="bg-[#54B7F0] hover:bg-[#3FA3DC] text-white shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" /> Tạo giáo án mới
        </Button>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm chương trình..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-[#54B7F0]"
          />
        </div>
      </div>

      {/* Program Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-48 animate-pulse border border-slate-100 shadow-sm" />
          ))
        ) : filteredPrograms.length === 0 ? (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <Dumbbell className="w-10 h-10 text-slate-200 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700">Không tìm thấy giáo án</h3>
            <p className="text-slate-400 text-sm mt-1">Bắt đầu bằng cách tạo một chương trình tập luyện mới.</p>
          </div>
        ) : (
          filteredPrograms.map(program => (
            <Card
              key={program.id}
              className="group border-slate-100 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer"
              onClick={() => { setWorkspaceProgramId(program.id); setIsWorkspaceOpen(true); }}
            >
              <CardContent className="p-0 flex flex-col h-full">
                <div className="p-6 space-y-4 flex-1">
                  <div className="flex items-start justify-between">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                      program.is_active ? "bg-[#54B7F0]/10 text-[#54B7F0]" : "bg-slate-50 text-slate-400"
                    )}>
                      <Dumbbell className="w-6 h-6" />
                    </div>
                    {program.is_active && (
                      <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-semibold text-[10px] uppercase">
                        Active
                      </Badge>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-800 line-clamp-1 group-hover:text-[#54B7F0] transition-colors">{program.name}</h3>
                    <div className="flex items-center gap-1.5 text-slate-500 text-sm mt-1">
                      <Flame className="w-3.5 h-3.5 text-orange-400" />
                      <span>{FREQUENCY_LABELS[program.frequency_per_week]}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Badge variant="outline" className="rounded-md border-slate-200 bg-slate-50 text-slate-600 font-medium text-[10px]">
                      {program.day_count ?? 0} DAYS
                    </Badge>
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); setEditingProgram(program); setIsProgramFormOpen(true); }}
                      className="h-8 w-8 text-slate-400 hover:text-slate-600"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); setProgramToDelete(program); }}
                      className="h-8 w-8 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-1 text-[#54B7F0] font-semibold text-xs">
                    Chi tiết <ArrowUpRight className="w-3.5 h-3.5" />
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!programToDelete}
        onClose={() => setProgramToDelete(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title="Xóa giáo án?"
        itemName={programToDelete?.name}
      />
    </div>
  );
}
