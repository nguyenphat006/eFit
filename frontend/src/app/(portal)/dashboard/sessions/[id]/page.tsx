'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { sessionService } from '@/services/api/sessionService';
import { Session, Phase } from '@/types/session';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, CheckCircle2, Target, Settings, CalendarRange, 
  AlignLeft, LayoutGrid
} from 'lucide-react';
import PhaseFormSheet from './components/PhaseFormSheet';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { HeroHeader } from '@/components/shared/hero-header';
import { StatusPill } from '@/components/shared/status-pill';
import { usePageMeta } from '@/hooks/usePageMeta';
import { cn } from '@/lib/utils';
import { format, parseISO, differenceInDays } from 'date-fns';

import SessionOverviewTab from './components/SessionOverviewTab';
import SessionPhaseTab from './components/SessionPhaseTab';
import SessionDailyLogsTab from './components/SessionDailyLogsTab';
import SessionSettingsTab from './components/SessionSettingsTab';

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

  // Tabs & Selections
  const [activeTab, setActiveTab] = useState<'overview' | 'phases' | 'logs' | 'settings'>('overview');
  const [selectedPhaseId, setSelectedPhaseId] = useState<number | null>(null);

  // Forms & Dialogs
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<Phase | null>(null);

  const [phaseToDelete, setPhaseToDelete] = useState<number | null>(null);
  const [isActivateConfirmOpen, setIsActivateConfirmOpen] = useState(false);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const fetchSession = useCallback(async () => {
    setLoading(true);
    try {
      const data = await sessionService.getSession(sessionId);
      setSession(data);
      // Automatically select the current phase or the first phase if not already selected
      if (!selectedPhaseId && data.phases.length > 0) {
        const today = new Date();
        const current = data.phases.find((p: Phase) => {
          const ps = parseISO(p.start_date);
          const pe = parseISO(p.end_date);
          return today >= ps && today <= pe;
        });
        setSelectedPhaseId(current ? current.id : data.phases[0].id);
      }
    } catch (e) {
      console.error(e);
      router.push('/dashboard/sessions');
    } finally {
      setLoading(false);
    }
  }, [sessionId, router, selectedPhaseId]);

  useEffect(() => {
    if (!isNaN(sessionId)) fetchSession();
  }, [sessionId, fetchSession]);

  usePageMeta({ breadcrumb: session?.name ?? null, title: session?.name ?? null });

  const handleDeletePhaseConfirm = async () => {
    if (!phaseToDelete) return;
    setIsSubmittingAction(true);
    try {
      await sessionService.deletePhase(phaseToDelete);
      fetchSession();
      setPhaseToDelete(null);
      // If we deleted the selected phase, reset it
      if (selectedPhaseId === phaseToDelete) {
        setSelectedPhaseId(null);
      }
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

  const handlePhaseSelectAndNavigate = (phaseId: number, tab: 'phases' | 'logs') => {
    setSelectedPhaseId(phaseId);
    setActiveTab(tab);
  };

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

      {/* ─── NAVIGATION TABS ─── */}
      <div className="flex items-center gap-2 border-b overflow-x-auto custom-scrollbar pb-px">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap",
            activeTab === 'overview' ? "border-[#54B7F0] text-[#54B7F0]" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          )}
        >
          <LayoutGrid className="w-4 h-4" /> Tổng quan
        </button>
        <button
          onClick={() => setActiveTab('phases')}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap",
            activeTab === 'phases' ? "border-[#54B7F0] text-[#54B7F0]" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          )}
        >
          <AlignLeft className="w-4 h-4" /> Giai đoạn (Phases)
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap",
            activeTab === 'logs' ? "border-[#54B7F0] text-[#54B7F0]" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          )}
        >
          <CalendarRange className="w-4 h-4" /> Nhật ký hàng ngày
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap",
            activeTab === 'settings' ? "border-[#54B7F0] text-[#54B7F0]" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          )}
        >
          <Settings className="w-4 h-4" /> Cài đặt
        </button>
      </div>

      {/* ─── TAB CONTENT ─── */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <SessionOverviewTab 
            session={session} 
            computed={computed} 
            onPhaseSelect={(id) => handlePhaseSelectAndNavigate(id, 'phases')}
            onAddPhase={() => { setEditingPhase(null); setIsFormOpen(true); }}
          />
        )}
        
        {activeTab === 'phases' && (
          <SessionPhaseTab 
            session={session} 
            selectedPhaseId={selectedPhaseId} 
            onPhaseSelect={(id) => setSelectedPhaseId(id)}
            onEditPhase={(p) => { setEditingPhase(p); setIsFormOpen(true); }}
            onDeletePhase={(id) => setPhaseToDelete(id)}
          />
        )}
        
        {activeTab === 'logs' && (
          <SessionDailyLogsTab 
            session={session} 
            selectedPhaseId={selectedPhaseId}
            onPhaseSelect={(id) => setSelectedPhaseId(id)}
          />
        )}
        
        {activeTab === 'settings' && (
          <SessionSettingsTab 
            session={session} 
            onSessionUpdated={fetchSession}
          />
        )}
      </div>

      {/* ─── DIALOGS ─── */}
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
        description={
          <>
            Bạn có chắc muốn xóa giai đoạn này?
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
