'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { sessionService } from '@/services/api/sessionService';
import { Session, Phase } from '@/types/session';
import { Button } from '@/components/ui/button';
import {
  Plus, ArrowLeft, Target, CheckCircle2, Layers, Calendar, Clock, Flag,
} from 'lucide-react';
import PhaseFormSheet from './components/PhaseFormSheet';
import PhaseRoadmapBlock from './components/PhaseRoadmapBlock';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { HeroHeader } from '@/components/shared/hero-header';
import { KpiTile } from '@/components/shared/kpi-tile';
import { StatusPill } from '@/components/shared/status-pill';
import { usePageMeta } from '@/hooks/usePageMeta';
import { cn } from '@/lib/utils';
import { format, parseISO, differenceInDays } from 'date-fns';

type GoalTone = 'blue' | 'orange' | 'purple' | 'neutral';

const GOAL_META: Record<string, { tone: GoalTone; label: string }> = {
  Cutting: { tone: 'orange', label: 'Siết cơ' },
  Bulking: { tone: 'blue', label: 'Tăng cơ' },
  Recomp: { tone: 'purple', label: 'Recomp' },
  Maintaining: { tone: 'neutral', label: 'Duy trì' },
};

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = parseInt(params.id as string);

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<Phase | null>(null);

  const [phaseToDelete, setPhaseToDelete] = useState<Phase | null>(null);
  const [isActivateConfirmOpen, setIsActivateConfirmOpen] = useState(false);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const fetchSession = useCallback(async () => {
    setLoading(true);
    try {
      const data = await sessionService.getSession(sessionId);
      setSession(data);
    } catch (e) {
      console.error(e);
      router.push('/dashboard/sessions');
    } finally {
      setLoading(false);
    }
  }, [sessionId, router]);

  useEffect(() => {
    if (!isNaN(sessionId)) fetchSession();
  }, [sessionId, fetchSession]);

  // Push the session name into the topbar breadcrumb + browser tab title.
  usePageMeta({ breadcrumb: session?.name ?? null, title: session?.name ?? null });

  const handleDeletePhaseConfirm = async () => {
    if (!phaseToDelete) return;
    setIsSubmittingAction(true);
    try {
      await sessionService.deletePhase(phaseToDelete.id);
      fetchSession();
      setPhaseToDelete(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleActivateConfirm = async () => {
    setIsSubmittingAction(true);
    try {
      await sessionService.updateSessionStatus(sessionId, 'Active');
      setIsActivateConfirmOpen(false);
      fetchSession();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleActivateClick = () => {
    if (session?.phases.length === 0) {
      alert('Cần tạo ít nhất 1 Phase trước khi Activate Mùa giải');
      return;
    }
    setIsActivateConfirmOpen(true);
  };

  // ─── Derived state ───
  const computed = useMemo(() => {
    if (!session) return null;
    const start = parseISO(session.start_date);
    const end = parseISO(session.end_date);
    const today = new Date();
    const totalDays = Math.max(1, differenceInDays(end, start));
    const passed = Math.max(0, differenceInDays(today, start));
    const daysLeft = Math.max(0, differenceInDays(end, today));
    const progress = Math.min(100, Math.round((passed / totalDays) * 100));

    const phases = [...session.phases].sort((a, b) => a.order - b.order);
    const currentPhase = phases.find((p) => {
      const ps = parseISO(p.start_date);
      const pe = parseISO(p.end_date);
      return today >= ps && today <= pe;
    });
    const currentPhaseIndex = currentPhase
      ? phases.findIndex((p) => p.id === currentPhase.id)
      : -1;

    return {
      start, end, totalDays, passed, daysLeft, progress,
      phases, currentPhase, currentPhaseIndex,
    };
  }, [session]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-[#54B7F0] border-t-transparent animate-spin" />
          <p className="text-sm font-semibold text-muted-foreground">Đang tải mùa giải...</p>
        </div>
      </div>
    );
  }

  if (!session || !computed) return null;

  const goal = GOAL_META[session.goal_type] ?? GOAL_META.Maintaining;
  const sortedPhases = computed.phases;

  // Hero status pill content
  const statusPill = session.is_active ? (
    <StatusPill tone="green" icon={<span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />}>
      Đang diễn ra
    </StatusPill>
  ) : session.status === 'Completed' ? (
    <StatusPill tone="neutral">Hoàn thành</StatusPill>
  ) : session.status === 'Draft' ? (
    <StatusPill tone="orange">Bản nháp</StatusPill>
  ) : (
    <StatusPill tone="neutral">{session.status}</StatusPill>
  );

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ─── BACK ─── */}
      <Button
        variant="ghost"
        onClick={() => router.push('/dashboard/sessions')}
        className="text-muted-foreground -ml-2 hover:bg-transparent hover:text-foreground font-display font-extrabold tracking-wide"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Danh sách mùa giải
      </Button>

      {/* ─── HERO ─── */}
      {sortedPhases.length === 0 ? (
        <HeroHeader
          pill={
            <div className="inline-flex items-center gap-2">
              {statusPill}
              <StatusPill tone={goal.tone}>{goal.label}</StatusPill>
            </div>
          }
          title={session.name}
          subtitle={
            <>
              {format(computed.start, 'dd/MM/yyyy')} → {format(computed.end, 'dd/MM/yyyy')}{' '}
              <span className="mx-2 text-white/40">·</span> {computed.totalDays} ngày tổng
              <span className="mx-2 text-white/40">·</span> {sortedPhases.length} phase
            </>
          }
          action={
            <div className="flex items-center gap-2">
              {session.status === 'Draft' && (
                <Button
                  onClick={handleActivateClick}
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur font-display font-extrabold h-10 px-4"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Kích hoạt
                </Button>
              )}
              <Button
                onClick={() => { setEditingPhase(null); setIsFormOpen(true); }}
                className="bg-[#54B7F0] hover:bg-[#3FA3DC] text-white shadow-button-blue font-display font-extrabold h-10 px-5"
              >
                <Plus className="w-4 h-4 mr-2" /> Thêm Phase
              </Button>
            </div>
          }
          meta={
            <>
              {session.is_active && (
                <span style={{ color: '#6AE5F7' }}>● Đang diễn ra</span>
              )}
              <span>Tiến độ {computed.progress}%</span>
              <span>Còn {computed.daysLeft} ngày</span>
              {computed.currentPhase && (
                <span>Đang ở {computed.currentPhase.name}</span>
              )}
            </>
          }
        />
      ) : (
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b pb-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              {session.name}
              <div className="inline-flex items-center gap-1.5 ml-2">
                {statusPill}
                <StatusPill tone={goal.tone}>{goal.label}</StatusPill>
              </div>
            </h1>
            <p className="text-xs font-semibold text-muted-foreground mt-1">
              {format(computed.start, 'dd/MM/yyyy')} → {format(computed.end, 'dd/MM/yyyy')}{' '}
              <span className="mx-2">·</span> {computed.totalDays} ngày tổng{' '}
              <span className="mx-2">·</span> {sortedPhases.length} phase
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {session.status === 'Draft' && (
              <Button
                onClick={handleActivateClick}
                variant="outline"
                className="font-display font-extrabold h-10 px-4"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" /> Kích hoạt
              </Button>
            )}
            <Button
              onClick={() => { setEditingPhase(null); setIsFormOpen(true); }}
              className="bg-[#54B7F0] hover:bg-[#3FA3DC] text-white shadow-button-blue font-display font-extrabold h-10 px-5"
            >
              <Plus className="w-4 h-4 mr-2" /> Thêm Phase
            </Button>
          </div>
        </div>
      )}

      {/* ─── KPI ROW ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile
          label="Tiến độ thời gian"
          value={computed.progress}
          unit="%"
          icon={Clock}
          tone={
            computed.progress >= 80 ? 'green'
              : computed.progress >= 40 ? 'orange'
              : 'blue'
          }
          delta={{
            value: `${computed.passed} / ${computed.totalDays} ngày`,
            trend: 'flat',
          }}
        />
        <KpiTile
          label="Còn lại"
          value={computed.daysLeft}
          unit="ngày"
          icon={Calendar}
          tone="orange"
        />
        <KpiTile
          label="Tổng Phase"
          value={sortedPhases.length}
          icon={Layers}
          tone="purple"
          delta={
            computed.currentPhase
              ? {
                  value: `Phase ${computed.currentPhaseIndex + 1} hiện tại`,
                  trend: 'up',
                }
              : undefined
          }
        />
        <KpiTile
          label="Mục tiêu"
          value={goal.label}
          icon={Flag}
          tone={goal.tone === 'neutral' ? 'blue' : goal.tone}
        />
      </div>

      {/* ─── TIMELINE PROGRESS BAR ─── */}
      <div className="bg-card rounded-2xl border shadow-card-light p-5 md:p-6">
        <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
          <div>
            <h3 className="font-display font-black text-lg tracking-tight">Dòng thời gian</h3>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5">
              {sortedPhases.length === 0
                ? 'Chưa có phase nào. Thêm phase để chia chu kỳ tập luyện.'
                : `Mùa giải chia thành ${sortedPhases.length} giai đoạn nối tiếp`}
            </p>
          </div>
          <div className="font-display font-black tabular-nums text-2xl">
            {computed.progress}<span className="text-base text-muted-foreground">%</span>
          </div>
        </div>

        {/* Main progress bar */}
        <div className="relative h-3 rounded-full bg-input overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#54B7F0] via-[#F4BC41] to-[#EF9035] transition-all duration-700"
            style={{ width: `${computed.progress}%` }}
          />
        </div>

        {/* Phase chips beneath the bar */}
        {sortedPhases.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {sortedPhases.map((p, idx) => {
              const isCurrent = idx === computed.currentPhaseIndex;
              const isPast = parseISO(p.end_date) < new Date();
              return (
                <div
                  key={p.id}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-colors',
                    isCurrent && 'bg-[rgba(84,183,240,0.10)] border-[rgba(84,183,240,0.30)] text-[#54B7F0]',
                    isPast && !isCurrent && 'bg-[rgba(16,185,129,0.06)] border-[rgba(16,185,129,0.20)] text-[#10b981]',
                    !isCurrent && !isPast && 'bg-input/50 border-border text-muted-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'w-5 h-5 rounded-full grid place-items-center text-[10px] font-extrabold',
                      isCurrent && 'bg-[#54B7F0] text-white',
                      isPast && !isCurrent && 'bg-[#10b981] text-white',
                      !isCurrent && !isPast && 'bg-muted-foreground/20 text-muted-foreground',
                    )}
                  >
                    {isPast && !isCurrent ? '✓' : idx + 1}
                  </span>
                  <span className="truncate max-w-[160px]">{p.name}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── PHASES LIST ─── */}
      <div className="space-y-6 pt-2">
        <div className="flex items-baseline justify-between">
          <h3 className="font-display font-black text-xl tracking-tight">Giai đoạn (Phase)</h3>
          <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
            {sortedPhases.length} phase
          </span>
        </div>

        {sortedPhases.length === 0 ? (
          <div className="bg-card rounded-2xl border border-dashed py-16 text-center">
            <div className="inline-flex w-14 h-14 rounded-full bg-input items-center justify-center mb-4">
              <Target className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-display font-extrabold text-lg text-foreground">Chưa có phase nào</p>
            <p className="text-sm font-semibold text-muted-foreground mt-1 max-w-md mx-auto">
              Mùa giải này chưa có giai đoạn nào. Bấm "Thêm Phase" để chia nhỏ chu kỳ tập luyện.
            </p>
            <Button
              onClick={() => { setEditingPhase(null); setIsFormOpen(true); }}
              className="mt-5 bg-[#54B7F0] hover:bg-[#3FA3DC] text-white shadow-button-blue font-display font-extrabold"
            >
              <Plus className="w-4 h-4 mr-2" /> Thêm Phase đầu tiên
            </Button>
          </div>
        ) : (
          sortedPhases.map((phase) => (
            <PhaseRoadmapBlock
              key={phase.id}
              phase={phase}
              onEditPhase={(p) => { setEditingPhase(p); setIsFormOpen(true); }}
              onDeletePhase={() => setPhaseToDelete(phase)}
            />
          ))
        )}
      </div>

      <PhaseFormSheet
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        session={session}
        initialData={editingPhase}
        onSuccess={fetchSession}
      />

      <ConfirmDialog
        isOpen={!!phaseToDelete}
        onClose={() => setPhaseToDelete(null)}
        onConfirm={handleDeletePhaseConfirm}
        isLoading={isSubmittingAction}
        title="Xóa giai đoạn?"
        itemName={phaseToDelete?.name}
        description={
          <>
            Bạn có chắc muốn xóa giai đoạn <b>{phaseToDelete?.name}</b>?
            Toàn bộ dữ liệu nhật ký bên trong sẽ bị mất hết và không thể khôi phục.
          </>
        }
      />

      <ConfirmDialog
        isOpen={isActivateConfirmOpen}
        onClose={() => setIsActivateConfirmOpen(false)}
        onConfirm={handleActivateConfirm}
        isLoading={isSubmittingAction}
        variant="orange"
        title="Kích hoạt mùa giải?"
        confirmText="Kích hoạt ngay"
        description={
          <>
            Sau khi kích hoạt, mùa giải này sẽ trở thành mùa giải chính thức.
            Mùa giải đang hoạt động hiện tại (nếu có) sẽ bị dừng lại.
          </>
        }
      />
    </div>
  );
}
