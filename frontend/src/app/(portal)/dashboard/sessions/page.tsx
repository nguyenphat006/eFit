'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { sessionService } from '@/services/api/sessionService';
import { SessionListItem } from '@/types/session';
import { Button } from '@/components/ui/button';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/data-table';
import { HeroHeader } from '@/components/shared/hero-header';
import { KpiTile } from '@/components/shared/kpi-tile';
import { StatusPill } from '@/components/shared/status-pill';
import {
  Plus, Edit, Trash2, Search, ChevronRight, Activity,
  CheckCircle2, ListChecks, Target, Layers, ArrowRight,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import SessionFormSheet from './components/SessionFormSheet';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { cn } from '@/lib/utils';
import { format, parseISO, differenceInDays } from 'date-fns';

type GoalTone = 'blue' | 'orange' | 'purple' | 'neutral';

const GOAL_META: Record<
  string,
  { tone: GoalTone; label: string }
> = {
  Cutting:   { tone: 'orange', label: 'Siết cơ' },
  Bulking:   { tone: 'blue',   label: 'Tăng cơ' },
  Recomp:    { tone: 'purple', label: 'Recomp' },
  Maintaining: { tone: 'neutral', label: 'Duy trì' },
};

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionListItem | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<SessionListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sessionService.listSessions(1, 50);
      setSessions(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const handleDeleteConfirm = async () => {
    if (!sessionToDelete) return;
    setIsDeleting(true);
    try {
      await sessionService.deleteSession(sessionToDelete.id);
      setSessionToDelete(null);
      fetchSessions();
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── KPI Stats ───
  const stats = useMemo(() => {
    const total = sessions.length;
    const active = sessions.filter((s) => s.is_active).length;
    const completed = sessions.filter((s) => s.status === 'Completed').length;
    const totalPhases = sessions.reduce((sum, s) => sum + (s.phase_count || 0), 0);

    const activeSession = sessions.find((s) => s.is_active);
    let activeProgress = 0;
    let activeDaysLeft = 0;
    if (activeSession) {
      const start = parseISO(activeSession.start_date);
      const end = parseISO(activeSession.end_date);
      const today = new Date();
      const totalDays = differenceInDays(end, start) || 1;
      const passed = Math.max(0, differenceInDays(today, start));
      activeProgress = Math.min(100, Math.round((passed / totalDays) * 100));
      activeDaysLeft = Math.max(0, differenceInDays(end, today));
    }

    return { total, active, completed, totalPhases, activeSession, activeProgress, activeDaysLeft };
  }, [sessions]);

  const columns = useMemo<ColumnDef<SessionListItem>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Mùa giải',
      cell: ({ row }) => {
        const s = row.original;
        const goal = GOAL_META[s.goal_type] ?? GOAL_META.Maintaining;
        return (
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => router.push(`/dashboard/sessions/${s.id}`)}
          >
            <div
              className={cn(
                'w-10 h-10 rounded-xl grid place-items-center shrink-0',
                goal.tone === 'orange' && 'bg-[rgba(239,144,53,0.10)] text-[#EF9035]',
                goal.tone === 'blue' && 'bg-[rgba(84,183,240,0.10)] text-[#54B7F0]',
                goal.tone === 'purple' && 'bg-[rgba(167,139,250,0.10)] text-[#a78bfa]',
                goal.tone === 'neutral' && 'bg-[rgba(148,163,184,0.10)] text-[#64748b]',
              )}
            >
              <Target className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-foreground group-hover:text-[#EF9035] transition-colors truncate">
                {s.name}
              </div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
                {goal.label} · {s.phase_count || 0} phase
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => {
        const s = row.original;
        if (s.is_active) {
          return (
            <StatusPill tone="green" icon={<span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />}>
              Đang diễn ra
            </StatusPill>
          );
        }
        if (s.status === 'Completed') return <StatusPill tone="neutral">Hoàn thành</StatusPill>;
        if (s.status === 'Draft') return <StatusPill tone="orange">Bản nháp</StatusPill>;
        if (s.status === 'Abandoned') return <StatusPill tone="red">Đã hủy</StatusPill>;
        return <StatusPill tone="neutral">{s.status}</StatusPill>;
      },
    },
    {
      id: 'timeRange',
      header: 'Khoảng thời gian',
      cell: ({ row }) => {
        const start = parseISO(row.original.start_date);
        const end = parseISO(row.original.end_date);
        const totalDays = differenceInDays(end, start) || 0;
        return (
          <div className="flex flex-col">
            <span className="text-foreground font-semibold tabular-nums">
              {format(start, 'dd/MM/yyyy')} <span className="text-muted-foreground mx-1">→</span> {format(end, 'dd/MM/yyyy')}
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
              {totalDays} ngày
            </span>
          </div>
        );
      },
    },
    {
      id: 'progress',
      header: 'Tiến độ',
      cell: ({ row }) => {
        const s = row.original;
        const start = parseISO(s.start_date);
        const end = parseISO(s.end_date);
        const today = new Date();
        const totalDays = differenceInDays(end, start) || 1;
        const passed = differenceInDays(today, start);
        let pct = 0;
        if (s.status === 'Completed') pct = 100;
        else if (s.status === 'Active' || s.is_active) pct = Math.max(0, Math.min(100, Math.round((passed / totalDays) * 100)));
        else if (s.status === 'Draft') pct = 0;

        const goal = GOAL_META[s.goal_type] ?? GOAL_META.Maintaining;
        const barColor =
          goal.tone === 'orange' ? '#EF9035'
            : goal.tone === 'blue' ? '#54B7F0'
            : goal.tone === 'purple' ? '#a78bfa'
            : '#64748b';

        return (
          <div className="w-32">
            <div className="flex items-baseline justify-between mb-1">
              <span className="font-display font-extrabold text-sm tabular-nums" style={{ color: barColor }}>
                {pct}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-input overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: barColor }}
              />
            </div>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Hành động</div>,
      cell: ({ row }) => {
        const session = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); setEditingSession(session); setIsFormOpen(true); }}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); setSessionToDelete(session); }}
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/sessions/${session.id}`); }}
              className="h-8 w-8 text-[#EF9035] hover:text-[#EF9035] hover:bg-[rgba(239,144,53,0.10)]"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        );
      },
    },
  ], [router]);

  const filteredSessions = sessions.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ─── HERO ─── */}
      {stats.total === 0 ? (
        <HeroHeader
          eyebrow="Mùa giải · Periodization"
          title="Lập trình"
          titleAccent="chu kỳ tập luyện."
          subtitle="Mỗi mùa giải là một chu kỳ tập luyện lớn theo đuổi một mục tiêu cụ thể — Siết cơ, Tăng cơ, hoặc Duy trì. Chia thành các giai đoạn (Phase) nhỏ hơn để dễ kiểm soát tải lượng."
          action={
            <Button
              onClick={() => { setEditingSession(null); setIsFormOpen(true); }}
              className="btn-gradient-orange text-white font-display font-extrabold tracking-wide shrink-0 h-10 px-5"
            >
              <Plus className="w-4 h-4 mr-2" /> Tạo mùa giải mới
            </Button>
          }
          meta={
            <>
              <span>{stats.total} mùa tổng</span>
              <span>{stats.active} đang diễn ra</span>
              <span>{stats.totalPhases} phase tổng</span>
            </>
          }
        />
      ) : (
        <div className="flex items-center justify-between border-b pb-4 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Quản lý chu kỳ (Mùa giải)
            </h1>
            <p className="text-xs font-semibold text-muted-foreground mt-1">
              {stats.total} mùa giải · {stats.active} mùa giải đang chạy
            </p>
          </div>
        </div>
      )}

      {/* ─── KPI ROW ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile
          label="Đang diễn ra"
          value={stats.active}
          icon={Activity}
          tone="green"
          loading={loading}
          delta={stats.activeSession ? { value: `Còn ${stats.activeDaysLeft} ngày`, trend: 'flat' } : undefined}
        />
        <KpiTile
          label="Hoàn thành"
          value={stats.completed}
          icon={CheckCircle2}
          tone="blue"
          loading={loading}
        />
        <KpiTile
          label="Tổng mùa giải"
          value={stats.total}
          icon={ListChecks}
          tone="orange"
          loading={loading}
        />
        <KpiTile
          label="Tổng Phase"
          value={stats.totalPhases}
          icon={Layers}
          tone="purple"
          loading={loading}
        />
      </div>

      {/* ─── ACTIVE SESSION SPOTLIGHT ─── */}
      {stats.activeSession && (
        <div
          className="bg-card rounded-2xl border shadow-card-light p-5 md:p-6 cursor-pointer hover:shadow-card-hover transition-all"
          onClick={() => router.push(`/dashboard/sessions/${stats.activeSession!.id}`)}
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-2">
                <StatusPill tone="green" icon={<span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />}>
                  Đang diễn ra
                </StatusPill>
                <StatusPill tone={GOAL_META[stats.activeSession.goal_type]?.tone ?? 'neutral'}>
                  {GOAL_META[stats.activeSession.goal_type]?.label ?? stats.activeSession.goal_type}
                </StatusPill>
              </div>
              <h3 className="font-display font-black text-xl md:text-2xl tracking-tight text-foreground">
                {stats.activeSession.name}
              </h3>
              <p className="text-sm font-semibold text-muted-foreground mt-1">
                {format(parseISO(stats.activeSession.start_date), 'dd/MM/yyyy')} → {format(parseISO(stats.activeSession.end_date), 'dd/MM/yyyy')}
                <span className="mx-2 text-muted-foreground/50">·</span>
                {stats.activeSession.phase_count || 0} phase
              </p>
            </div>
            <Button variant="ghost" className="text-[#EF9035] hover:bg-[rgba(239,144,53,0.10)] font-display font-extrabold shrink-0">
              Vào mùa giải <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* Progress bar */}
          <div className="mt-5">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
                Tiến độ thời gian
              </span>
              <span className="font-display font-black text-lg tabular-nums text-foreground">
                {stats.activeProgress}<span className="text-sm text-muted-foreground">%</span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-input overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#54B7F0] via-[#F4BC41] to-[#EF9035] transition-all duration-700"
                style={{ width: `${stats.activeProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── SEARCH & ACTION BAR ─── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm mùa giải..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card border-border focus-visible:ring-[#EF9035]"
          />
        </div>
        
        {stats.total > 0 && (
          <Button
            onClick={() => { setEditingSession(null); setIsFormOpen(true); }}
            className="btn-gradient-orange text-white font-display font-extrabold tracking-wide shrink-0 h-10 px-5"
          >
            <Plus className="w-4 h-4 mr-2" /> Tạo mùa giải mới
          </Button>
        )}
      </div>

      {/* ─── DATA TABLE ─── */}
      <DataTable
        columns={columns}
        data={filteredSessions}
        isLoading={loading}
      />

      <SessionFormSheet
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={editingSession}
        onSuccess={() => fetchSessions()}
      />

      <ConfirmDialog
        isOpen={!!sessionToDelete}
        onClose={() => setSessionToDelete(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title="Xóa mùa giải?"
        itemName={sessionToDelete?.name}
        description={
          <>
            Bạn có chắc chắn muốn xóa mùa giải <b>{sessionToDelete?.name}</b>?
            Toàn bộ Phase và Log bên trong sẽ bị xóa vĩnh viễn!
          </>
        }
      />
    </div>
  );
}
