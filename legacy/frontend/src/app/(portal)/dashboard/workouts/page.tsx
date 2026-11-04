'use client';

import { useState, useEffect, useCallback } from 'react';
import { workoutService } from '@/services/api/workoutService';
import { WorkoutProgramListItem } from '@/types/workout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Dumbbell, Edit, Trash2, Search, ArrowUpRight } from 'lucide-react';
import ProgramFormSheet from './components/ProgramFormSheet';
import ProgramWorkspaceModal from './components/ProgramWorkspaceModal';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { HeroHeader } from '@/components/shared/hero-header';
import { DataTable } from '@/components/shared/data-table';
import { ColumnDef } from '@tanstack/react-table';

const FREQUENCY_LABELS: Record<number, string> = {
  0: 'Chưa có buổi', 1: '1 buổi / tuần', 2: '2 buổi / tuần', 3: '3 buổi / tuần',
  4: '4 buổi / tuần', 5: '5 buổi / tuần', 6: '6 buổi / tuần', 7: 'Mỗi ngày',
};

export default function WorkoutsPage() {
  const [programs, setPrograms] = useState<WorkoutProgramListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [isProgramFormOpen, setIsProgramFormOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<WorkoutProgramListItem | null>(null);
  const [workspaceProgramId, setWorkspaceProgramId] = useState<number | null>(null);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);

  const [programToDelete, setProgramToDelete] = useState<WorkoutProgramListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPrograms = useCallback(async (pageNum = 1) => {
    setLoading(true);
    try {
      const res = await workoutService.listPrograms(pageNum, 20, true);
      setPrograms(res.data);
      setTotal(res.total);
      setPage(pageNum);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPrograms(1); }, [fetchPrograms]);

  const handleDeleteConfirm = async () => {
    if (!programToDelete) return;
    setIsDeleting(true);
    try {
      await workoutService.deleteProgram(programToDelete.id);
      setProgramToDelete(null);
      fetchPrograms(page);
    } catch (e) { console.error(e); }
    finally { setIsDeleting(false); }
  };

  const handleProgramCreated = (id?: number, isNew?: boolean) => {
    fetchPrograms(page);
    if (id && isNew) { setWorkspaceProgramId(id); setIsWorkspaceOpen(true); }
  };

  const filteredPrograms = programs.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const columns: ColumnDef<WorkoutProgramListItem>[] = [
    {
      accessorKey: 'name',
      header: 'Tên Giáo Án',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-input flex items-center justify-center shrink-0">
            <Dumbbell className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-extrabold text-foreground">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{FREQUENCY_LABELS[row.original.frequency_per_week]}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'day_count',
      header: 'Số Buổi',
      cell: ({ row }) => (
        <span className="font-semibold text-slate-700">{row.original.day_count ?? 0} buổi</span>
      ),
    },
    {
      accessorKey: 'notes',
      header: 'Ghi chú',
      cell: ({ row }) => (
        <span className="text-sm text-slate-500 line-clamp-1 max-w-[200px]">
          {row.original.notes || '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const program = row.original;
        return (
          <div className="flex justify-end items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setWorkspaceProgramId(program.id); setIsWorkspaceOpen(true); }}
              className="text-[#54B7F0] border-[#54B7F0]/20 hover:bg-[#54B7F0]/10 font-bold tracking-wide"
            >
              Workspace <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { setEditingProgram(program); setIsProgramFormOpen(true); }}
              className="h-8 w-8 text-slate-400 hover:text-slate-700"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setProgramToDelete(program)}
              className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {total === 0 ? (
        <HeroHeader
          eyebrow="Thư viện mẫu"
          title="Thư viện"
          titleAccent="giáo án mẫu."
          subtitle="Tạo các giáo án mẫu làm chuẩn để copy cho học viên hoặc sử dụng lại trong tương lai."
          action={
            <Button
              onClick={() => { setEditingProgram(null); setIsProgramFormOpen(true); }}
              className="btn-gradient-orange text-white font-extrabold tracking-wide shrink-0 h-10 px-5"
            >
              <Plus className="w-4 h-4 mr-2" /> Tạo mẫu giáo án
            </Button>
          }
        />
      ) : (
        <div className="flex items-center justify-between border-b pb-4 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Thư viện giáo án mẫu
            </h1>
            <p className="text-xs font-semibold text-muted-foreground mt-1">
              {total} giáo án mẫu đang có sẵn
            </p>
          </div>
        </div>
      )}

      {/* Search & Action Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm giáo án mẫu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card border-border focus-visible:ring-[#54B7F0]"
          />
        </div>

        {total > 0 && (
          <Button
            onClick={() => { setEditingProgram(null); setIsProgramFormOpen(true); }}
            className="btn-gradient-orange text-white font-extrabold tracking-wide shrink-0 h-10 px-5"
          >
            <Plus className="w-4 h-4 mr-2" /> Tạo mẫu giáo án
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filteredPrograms}
        isLoading={loading}
        pagination={{
          page: page,
          size: 20,
          total: total,
        }}
        onPageChange={(p) => fetchPrograms(p)}
      />

      <ProgramFormSheet
        isOpen={isProgramFormOpen}
        onClose={() => setIsProgramFormOpen(false)}
        initialData={editingProgram}
        onSuccess={handleProgramCreated}
      />

      <ProgramWorkspaceModal
        programId={workspaceProgramId}
        isOpen={isWorkspaceOpen}
        onClose={() => { setIsWorkspaceOpen(false); fetchPrograms(page); }}
      />

      <ConfirmDialog
        isOpen={!!programToDelete}
        onClose={() => setProgramToDelete(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title="Xóa giáo án mẫu?"
        itemName={programToDelete?.name}
      />
    </div>
  );
}
