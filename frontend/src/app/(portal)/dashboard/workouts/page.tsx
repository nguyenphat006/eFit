'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { workoutService } from '@/services/api/workoutService';
import { WorkoutProgramListItem } from '@/types/workout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus, Dumbbell, Edit, Trash2, Search, ArrowUpRight,
  Calendar, Activity, Flame, Layers, Clock, History,
} from 'lucide-react';
import ProgramFormSheet from './components/ProgramFormSheet';
import ProgramWorkspaceModal from './components/ProgramWorkspaceModal';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { HeroHeader } from '@/components/shared/hero-header';
import { KpiTile } from '@/components/shared/kpi-tile';
import { StatusPill } from '@/components/shared/status-pill';
import { cn } from '@/lib/utils';

const FREQUENCY_LABELS: Record<number, string> = {
  0: 'Chưa có buổi', 1: '1 buổi / tuần', 2: '2 buổi / tuần', 3: '3 buổi / tuần',
  4: '4 buổi / tuần', 5: '5 buổi / tuần', 6: '6 buổi / tuần', 7: 'Mỗi ngày',
};

export default function WorkoutsPage() {
  const [programs, setPrograms] = useState<WorkoutProgramListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [isProgramFormOpen, setIsProgramFormOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<WorkoutProgramListItem | null>(null);
  const [workspaceProgramId, setWorkspaceProgramId] = useState<number | null>(null);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);

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
    } catch (e) { console.error(e); }
    finally { setIsDeleting(false); }
  };

  const handleProgramCreated = (id?: number, isNew?: boolean) => {
    fetchPrograms();
    if (id && isNew) { setWorkspaceProgramId(id); setIsWorkspaceOpen(true); }
  };

  const filteredPrograms = programs.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // ─── Stats ───
  const stats = useMemo(() => {
    const total = programs.length;
    const active = programs.filter((p) => p.is_active).length;
    const totalDays = programs.reduce((sum, p) => sum + (p.day_count ?? 0), 0);
    const avgFreq = total > 0
      ? Math.round(programs.reduce((sum, p) => sum + p.frequency_per_week, 0) / total)
      : 0;
    return { total, active, totalDays, avgFreq };
  }, [programs]);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {stats.total === 0 ? (
        <HeroHeader
          eyebrow="Lịch tập · Programming"
          title="Thiết kế"
          titleAccent="giáo án của bạn."
          subtitle="Tạo và quản lý các chu kỳ tập luyện (Periodization), gắn vào Phase trong mùa giải để đạt mục tiêu."
          action={
            <Button
              onClick={() => { setEditingProgram(null); setIsProgramFormOpen(true); }}
              className="btn-gradient-orange text-white font-extrabold tracking-wide shrink-0 h-10 px-5"
            >
              <Plus className="w-4 h-4 mr-2" /> Tạo giáo án mới
            </Button>
          }
          meta={
            <>
              <span>{stats.total} giáo án</span>
              <span>{stats.active} đang dùng</span>
              <span>{stats.totalDays} buổi tổng</span>
            </>
          }
        />
      ) : (
        <div className="flex items-center justify-between border-b pb-4 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Danh sách giáo án
            </h1>
            <p className="text-xs font-semibold text-muted-foreground mt-1">
              {stats.total} giáo án được thiết kế · {stats.active} giáo án đang kích hoạt
            </p>
          </div>
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile label="Đang dùng" value={stats.active} icon={Activity} tone="green" loading={loading} />
        <KpiTile label="Tổng giáo án" value={stats.total} icon={Layers} tone="blue" loading={loading} />
        <KpiTile label="Tổng buổi tập" value={stats.totalDays} icon={Calendar} tone="orange" loading={loading} />
        <KpiTile label="Trung bình / tuần" value={stats.avgFreq} unit="buổi" icon={Flame} tone="red" loading={loading} />
      </div>

      {/* Search & Action Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm giáo án..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card border-border focus-visible:ring-[#54B7F0]"
          />
        </div>

        {stats.total > 0 && (
          <Button
            onClick={() => { setEditingProgram(null); setIsProgramFormOpen(true); }}
            className="btn-gradient-orange text-white font-extrabold tracking-wide shrink-0 h-10 px-5"
          >
            <Plus className="w-4 h-4 mr-2" /> Tạo giáo án mới
          </Button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl h-52 animate-pulse border shadow-card-light" />
          ))
        ) : filteredPrograms.length === 0 ? (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-card rounded-2xl border border-dashed">
            <div className="inline-flex w-14 h-14 rounded-full bg-input items-center justify-center mb-3">
              <Dumbbell className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-extrabold text-lg text-foreground">Không tìm thấy giáo án</p>
            <p className="text-sm font-semibold text-muted-foreground mt-1">Tạo chương trình mới để bắt đầu.</p>
            <Button
              onClick={() => { setEditingProgram(null); setIsProgramFormOpen(true); }}
              className="mt-4 bg-[#54B7F0] hover:bg-[#3FA3DC] text-white shadow-button-blue font-extrabold"
            >
              <Plus className="w-4 h-4 mr-2" /> Tạo giáo án đầu tiên
            </Button>
          </div>
        ) : (
          filteredPrograms.map((program: any) => {
            const lastUsed = program.last_used_at ? parseISO(program.last_used_at) : null;
            const daysAgo = lastUsed ? differenceInDays(new Date(), lastUsed) : null;
            const totalLogged = program.total_workouts_logged ?? 0;
            const totalEx = program.total_exercises ?? 0;
            const lastUsedLabel =
              daysAgo === null ? 'Chưa dùng'
                : daysAgo === 0 ? 'Hôm nay'
                : daysAgo === 1 ? 'Hôm qua'
                : daysAgo < 7 ? `${daysAgo} ngày trước`
                : daysAgo < 30 ? `${Math.floor(daysAgo / 7)} tuần trước`
                : `${Math.floor(daysAgo / 30)} tháng trước`;

            return (
              <button
                key={program.id}
                type="button"
                className={cn(
                  'group bg-card border rounded-2xl shadow-card-light hover:shadow-card-hover transition-all overflow-hidden cursor-pointer text-left',
                  program.is_active && 'ring-1 ring-[#54B7F0]/30',
                )}
                onClick={() => { setWorkspaceProgramId(program.id); setIsWorkspaceOpen(true); }}
              >
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center',
                        program.is_active
                          ? 'bg-[rgba(84,183,240,0.10)] text-[#54B7F0]'
                          : 'bg-input text-muted-foreground',
                      )}
                    >
                      <Dumbbell className="w-6 h-6" strokeWidth={1.75} />
                    </div>
                    {program.is_active ? (
                      <StatusPill
                        tone="green"
                        icon={<span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />}
                        size="xs"
                      >
                        Active
                      </StatusPill>
                    ) : daysAgo !== null && daysAgo > 60 ? (
                      <StatusPill tone="neutral" size="xs">Lưu kho</StatusPill>
                    ) : null}
                  </div>

                  <div>
                    <h3 className="text-lg font-extrabold tracking-tight text-foreground line-clamp-1 group-hover:text-[#54B7F0] transition-colors">
                      {program.name}
                    </h3>
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mt-1.5 uppercase tracking-wider">
                      <Flame className="w-3 h-3 text-[#EF9035]" />
                      {FREQUENCY_LABELS[program.frequency_per_week]}
                    </p>
                  </div>

                  {/* Usage stats — 3 mini stats */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                    <UsageStat
                      icon={Calendar}
                      label="Buổi"
                      value={program.day_count ?? 0}
                    />
                    <UsageStat
                      icon={Dumbbell}
                      label="Bài tập"
                      value={totalEx || '—'}
                    />
                    <UsageStat
                      icon={History}
                      label="Đã log"
                      value={totalLogged}
                    />
                  </div>

                  {/* Last used + notes */}
                  <div className="flex items-start justify-between gap-2 pt-1 text-[11px]">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 font-bold uppercase tracking-wider shrink-0',
                        daysAgo === null ? 'text-muted-foreground/60' :
                        daysAgo === 0 ? 'text-[#10b981]' :
                        daysAgo < 7 ? 'text-[#54B7F0]' :
                        daysAgo < 30 ? 'text-muted-foreground' :
                        'text-muted-foreground/60',
                      )}
                    >
                      <Clock className="w-3 h-3" />
                      {lastUsedLabel}
                    </span>
                    {program.notes && (
                      <p className="text-muted-foreground line-clamp-1 text-right font-semibold">{program.notes}</p>
                    )}
                  </div>
                </div>

                <div className="px-5 py-3 bg-input/30 border-t flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); setEditingProgram(program); setIsProgramFormOpen(true); }}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); setProgramToDelete(program); }}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-1 text-[#54B7F0] font-extrabold text-xs uppercase tracking-wider">
                    Mở workspace <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      <ProgramFormSheet
        isOpen={isProgramFormOpen}
        onClose={() => setIsProgramFormOpen(false)}
        initialData={editingProgram}
        onSuccess={handleProgramCreated}
      />

      <ProgramWorkspaceModal
        programId={workspaceProgramId}
        isOpen={isWorkspaceOpen}
        onClose={() => { setIsWorkspaceOpen(false); fetchPrograms(); }}
      />

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

// ─── Helper: usage stat tile inside a card ───
function UsageStat({
  icon: Icon, label, value,
}: { icon: typeof Calendar; label: string; value: number | string }) {
  return (
    <div className="flex flex-col items-start">
      <div className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground mb-0.5">
        <Icon className="w-2.5 h-2.5" />
        <span>{label}</span>
      </div>
      <span className="font-extrabold text-base tabular-nums text-foreground">{value}</span>
    </div>
  );
}
