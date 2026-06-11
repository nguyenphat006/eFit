'use client';

import { useEffect, useMemo, useState } from 'react';
import { format, parseISO, differenceInDays, isToday as isTodayFn } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts';
import {
  Dumbbell, Utensils, Activity, Flame, TrendingUp, CalendarCheck,
  Sparkles, ArrowRight, Heart, Bot, Trophy, ChevronRight, Plus, Target,
  Footprints, Moon, Droplet,
} from 'lucide-react';

import { sessionService } from '@/services/api/sessionService';
import { useDailyLogs } from '@/hooks/useDailyLogs';
import { useAuthStore } from '@/hooks/useAuthStore';

import { HeroHeader } from '@/components/shared/hero-header';
import { KpiTile } from '@/components/shared/kpi-tile';
import { StatusPill } from '@/components/shared/status-pill';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { Session, Phase, DailyLog } from '@/types/session';

const GOAL_LABEL: Record<string, string> = {
  Cutting: 'Siết cơ',
  Bulking: 'Tăng cơ',
  Recomp: 'Recomp',
  Maintaining: 'Duy trì',
};

export default function DashboardView() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const { data: logsPage, isLoading: loadingLogs } = useDailyLogs(1);

  useEffect(() => {
    sessionService
      .getActiveSession()
      .then(setActiveSession)
      .catch(() => setActiveSession(null))
      .finally(() => setLoadingSession(false));
  }, []);

  const logs = useMemo(() => logsPage?.data || [], [logsPage]);
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayLog = useMemo(() => logs.find((l) => String(l.log_date) === todayStr), [logs, todayStr]);

  // ─── Derived state ───
  const derived = useMemo(() => {
    if (!activeSession) {
      return {
        phases: [] as Phase[],
        currentPhase: null as Phase | null,
        currentPhaseIndex: -1,
        seasonProgress: 0,
        daysLeft: 0,
        weekVolume: 0,
        weekDone: 0,
      };
    }
    const phases = [...activeSession.phases].sort((a, b) => a.order - b.order);
    const today = new Date();
    const start = parseISO(activeSession.start_date);
    const end = parseISO(activeSession.end_date);
    const total = Math.max(1, differenceInDays(end, start));
    const passed = Math.max(0, differenceInDays(today, start));
    const seasonProgress = Math.min(100, Math.round((passed / total) * 100));
    const daysLeft = Math.max(0, differenceInDays(end, today));

    const currentPhase = phases.find((p) => {
      const ps = parseISO(p.start_date);
      const pe = parseISO(p.end_date);
      return today >= ps && today <= pe;
    }) ?? null;
    const currentPhaseIndex = currentPhase ? phases.findIndex((p) => p.id === currentPhase.id) : -1;

    // Logs in last 7 days
    const sevenDaysAgo = format(new Date(today.getTime() - 6 * 86400000), 'yyyy-MM-dd');
    const last7 = logs.filter((l) => String(l.log_date) >= sevenDaysAgo);
    const weekDone = last7.filter((l) => l.is_workout_completed).length;

    return {
      phases, currentPhase, currentPhaseIndex,
      seasonProgress, daysLeft, weekVolume: weekDone, weekDone,
    };
  }, [activeSession, logs]);

  // ─── Quick stats ───
  const stats = useMemo(() => {
    // Streak
    let streak = 0;
    const sorted = [...logs].sort((a, b) => String(b.log_date).localeCompare(String(a.log_date)));
    let expected = todayStr;
    for (const log of sorted) {
      const ld = String(log.log_date);
      if (ld === expected || (streak === 0 && ld <= todayStr)) {
        streak++;
        const d = new Date(ld);
        d.setDate(d.getDate() - 1);
        expected = format(d, 'yyyy-MM-dd');
      } else if (streak > 0) break;
    }

    // Latest weight + delta
    const weighed = logs.filter((l) => l.weight != null).sort((a, b) => String(b.log_date).localeCompare(String(a.log_date)));
    const latestWeight = weighed[0]?.weight ?? null;
    const olderWeight = weighed[6]?.weight ?? weighed[weighed.length - 1]?.weight ?? null;
    const weightDelta = latestWeight && olderWeight ? +(latestWeight - olderWeight).toFixed(1) : null;

    // 7-day compliance trend
    const sortedAsc = [...logs].sort((a, b) => String(a.log_date).localeCompare(String(b.log_date)));
    const last7 = sortedAsc.slice(-7);
    const chartData = last7.map((l) => ({
      date: format(parseISO(String(l.log_date)), 'dd/MM'),
      compliance: l.compliance_score ?? 0,
      weight: l.weight ?? null,
    }));

    const todayCompliance = todayLog?.compliance_score ?? null;
    const sparkCompliance = last7.map((l) => l.compliance_score ?? 0);

    return { streak, latestWeight, weightDelta, todayCompliance, chartData, sparkCompliance };
  }, [logs, todayStr, todayLog]);

  // Mock AI insights driven by current data
  const aiInsights = useMemo(() => {
    const insights: { tone: 'blue' | 'orange' | 'red'; icon: typeof Sparkles; title: string; body: string }[] = [];
    if (stats.streak >= 7) {
      insights.push({
        tone: 'blue',
        icon: Flame,
        title: `Streak ${stats.streak} ngày 🔥`,
        body: 'Bạn đang duy trì rất tốt. Giữ nhịp này — kết quả sẽ đến.',
      });
    }
    if (stats.weightDelta !== null && activeSession?.goal_type === 'Cutting' && stats.weightDelta > 0) {
      insights.push({
        tone: 'orange',
        icon: TrendingUp,
        title: 'Cân nặng đang đi ngược mục tiêu',
        body: `Trong 7 ngày qua bạn tăng ${stats.weightDelta} kg trong mùa Cutting. Cân nhắc giảm calo thêm 100-150 kcal/ngày.`,
      });
    }
    if (!todayLog) {
      insights.push({
        tone: 'blue',
        icon: Sparkles,
        title: 'Hôm nay chưa có log',
        body: 'Mở Daily Log để ghi cân nặng, bữa ăn và buổi tập. Compliance Score sẽ tự cập nhật.',
      });
    }
    if (derived.currentPhase) {
      const days = differenceInDays(parseISO(derived.currentPhase.end_date), new Date());
      if (days <= 7 && days >= 0) {
        insights.push({
          tone: 'orange',
          icon: Target,
          title: `Còn ${days} ngày của ${derived.currentPhase.name}`,
          body: 'Sắp kết thúc phase. Hãy review tổng kết và chuẩn bị Phase kế tiếp.',
        });
      }
    }
    if (insights.length === 0) {
      insights.push({
        tone: 'blue',
        icon: Bot,
        title: 'AI Coach đang quan sát',
        body: 'Cần thêm vài ngày dữ liệu để đưa ra đề xuất chính xác. Cứ log đều đặn nhé.',
      });
    }
    return insights.slice(0, 3);
  }, [stats, derived, activeSession, todayLog]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 11) return 'Chào buổi sáng';
    if (h < 14) return 'Chào buổi trưa';
    if (h < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  }, []);

  const firstName = useMemo(() => {
    if (!user?.full_name) return 'bạn';
    const parts = user.full_name.split(' ');
    return parts[parts.length - 1];
  }, [user]);

  const loading = loadingSession || loadingLogs;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ─── HERO ─── */}
      <HeroHeader
        eyebrow={
          activeSession
            ? `${GOAL_LABEL[activeSession.goal_type] ?? activeSession.goal_type} · ${activeSession.name}`
            : 'eFit · Personal Coaching'
        }
        title={`${greeting},`}
        titleAccent={`${firstName} sẵn sàng chứ?`}
        subtitle={
          activeSession && derived.currentPhase
            ? `Đang ở ${derived.currentPhase.name} (Phase ${derived.currentPhaseIndex + 1}/${derived.phases.length}). Mùa giải hoàn thành ${derived.seasonProgress}% · còn ${derived.daysLeft} ngày.`
            : 'Hôm nay là một ngày mới để xây dựng phiên bản tốt hơn của bạn. Bắt đầu bằng việc tạo mùa giải nếu bạn chưa có.'
        }
        action={
          <Button
            onClick={() => router.push(todayLog ? '/dashboard/daily-logs' : '/dashboard/daily-logs')}
            className="btn-gradient-orange text-white font-extrabold tracking-wide shrink-0 h-10 px-5"
          >
            {todayLog ? (
              <>
                <CalendarCheck className="w-4 h-4 mr-2" /> Xem log hôm nay
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" /> Log hôm nay
              </>
            )}
          </Button>
        }
        meta={
          activeSession
            ? (
              <>
                <span style={{ color: '#6AE5F7' }}>● Đang chạy</span>
                <span>{format(parseISO(activeSession.start_date), 'dd/MM')} → {format(parseISO(activeSession.end_date), 'dd/MM/yyyy')}</span>
                <span>{derived.phases.length} phase</span>
                {derived.daysLeft > 0 && <span>Còn {derived.daysLeft} ngày</span>}
              </>
            )
            : <span>Chưa có mùa giải nào đang chạy</span>
        }
      />

      {/* ─── KPI STRIP ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile
          label="Streak"
          value={stats.streak}
          unit="ngày"
          icon={Flame}
          tone="red"
          loading={loading}
        />
        <KpiTile
          label="Compliance hôm nay"
          value={stats.todayCompliance !== null ? stats.todayCompliance : '—'}
          unit={stats.todayCompliance !== null ? '%' : undefined}
          icon={Activity}
          tone={
            stats.todayCompliance === null ? 'neutral'
              : stats.todayCompliance >= 80 ? 'green'
              : stats.todayCompliance >= 50 ? 'orange'
              : 'red'
          }
          spark={stats.sparkCompliance.length > 1 ? stats.sparkCompliance : undefined}
          loading={loading}
        />
        <KpiTile
          label="Cân nặng"
          value={stats.latestWeight ?? '—'}
          unit={stats.latestWeight ? 'kg' : undefined}
          icon={TrendingUp}
          tone="orange"
          delta={
            stats.weightDelta !== null
              ? {
                  value: `${stats.weightDelta > 0 ? '+' : ''}${stats.weightDelta} kg / 7 ngày`,
                  trend: stats.weightDelta > 0 ? 'up' : stats.weightDelta < 0 ? 'down' : 'flat',
                }
              : undefined
          }
          loading={loading}
        />
        <KpiTile
          label="Buổi tập 7 ngày"
          value={derived.weekDone}
          unit="buổi"
          icon={Dumbbell}
          tone="blue"
          loading={loading}
        />
      </div>

      {/* ─── TODAY'S PLAN — 2 cols ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TodayWorkoutCard
          phase={derived.currentPhase}
          done={!!todayLog?.is_workout_completed}
          onAction={() => router.push('/dashboard/workouts')}
        />
        <TodayNutritionCard phase={derived.currentPhase} log={todayLog ?? null} />
      </div>

      {/* ─── SEASON TIMELINE ─── */}
      {activeSession && derived.phases.length > 0 && (
        <SeasonTimeline
          session={activeSession}
          phases={derived.phases}
          progress={derived.seasonProgress}
          currentIdx={derived.currentPhaseIndex}
          onClick={() => router.push(`/dashboard/sessions/${activeSession.id}`)}
        />
      )}

      {/* ─── CHART + AI INSIGHTS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card rounded-2xl border shadow-card-light p-5 md:p-6">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-lg tracking-tight">Tiến triển 7 ngày</h3>
              <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                Compliance Score và cân nặng theo ngày
              </p>
            </div>
          </div>
          <div className="h-[260px] w-full">
            {stats.chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8f4fc" />
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: 700 }} />
                  <YAxis
                    yAxisId="left"
                    stroke="#54B7F0"
                    tick={{ fontSize: 11, fontWeight: 700 }}
                    domain={[0, 100]}
                    width={36}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#EF9035"
                    tick={{ fontSize: 11, fontWeight: 700 }}
                    domain={['dataMin - 1', 'dataMax + 1']}
                    width={42}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#0e1424',
                      border: '1px solid rgba(148,163,184,0.14)',
                      borderRadius: 12,
                      color: '#e2e8f0',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 800, marginBottom: 4 }}
                  />
                  <ReferenceLine y={80} yAxisId="left" stroke="#10b981" strokeDasharray="4 4" strokeOpacity={0.4} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="compliance"
                    stroke="#54B7F0"
                    strokeWidth={2.5}
                    dot={{ fill: '#54B7F0', r: 3 }}
                    activeDot={{ r: 5 }}
                    name="Compliance %"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="weight"
                    stroke="#EF9035"
                    strokeWidth={2.5}
                    dot={{ fill: '#EF9035', r: 3 }}
                    activeDot={{ r: 5 }}
                    connectNulls
                    name="Cân nặng kg"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm font-semibold text-muted-foreground">
                Cần ít nhất 2 ngày log để vẽ biểu đồ
              </div>
            )}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 text-[10px] font-extrabold uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-[#54B7F0]">
              <span className="w-3 h-1 rounded bg-[#54B7F0]" /> Compliance %
            </span>
            <span className="flex items-center gap-1.5 text-[#EF9035]">
              <span className="w-3 h-1 rounded bg-[#EF9035]" /> Cân nặng (kg)
            </span>
            <span className="flex items-center gap-1.5 text-[#10b981]">
              <span className="w-3 h-0.5 rounded bg-[#10b981] opacity-50" /> Mục tiêu 80%
            </span>
          </div>
        </div>

        {/* AI insights */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="w-2 h-2 rounded-full bg-[#54B7F0] animate-pulse" />
            <h3 className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">
              Đề xuất từ AI Coach
            </h3>
          </div>
          {aiInsights.map((ins, i) => (
            <AIInsightCard key={i} {...ins} />
          ))}
        </div>
      </div>

      {/* ─── QUICK ACTIONS ─── */}
      <div>
        <div className="flex items-center gap-2 px-1 mb-3">
          <div className="w-2 h-2 rounded-full bg-[#EF9035]" />
          <h3 className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">
            Truy cập nhanh
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickAction icon={Trophy} label="Mùa giải" tone="blue" onClick={() => router.push('/dashboard/sessions')} />
          <QuickAction icon={Dumbbell} label="Lịch tập" tone="orange" onClick={() => router.push('/dashboard/workouts')} />
          <QuickAction icon={Utensils} label="Dinh dưỡng" tone="green" onClick={() => router.push('/dashboard/nutrition')} />
          <QuickAction icon={Heart} label="CNS & Health" tone="red" onClick={() => router.push('/dashboard/cns-health')} />
        </div>
      </div>
    </div>
  );
}

// ─── Today's workout card ───
function TodayWorkoutCard({
  phase, done, onAction,
}: { phase: Phase | null; done: boolean; onAction: () => void }) {
  return (
    <div className="bg-card rounded-2xl border shadow-card-light p-5 md:p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[rgba(84,183,240,0.10)] grid place-items-center">
            <Dumbbell className="w-5 h-5 text-[#54B7F0]" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
              Buổi tập hôm nay
            </p>
            <h3 className="font-extrabold text-base tracking-tight">
              {phase ? phase.name : 'Chưa có phase đang chạy'}
            </h3>
          </div>
        </div>
        {done ? (
          <StatusPill tone="green">✓ Đã tập</StatusPill>
        ) : (
          <StatusPill tone="orange">Chưa tập</StatusPill>
        )}
      </div>

      {phase ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-muted-foreground line-clamp-2">
            {phase.description ?? 'Phase chưa có mô tả chi tiết.'}
          </p>
          <div className="grid grid-cols-3 gap-2 pt-2">
            <MiniStat label="Calo target" value={phase.target_calories ? `${phase.target_calories}` : '—'} unit="kcal" />
            <MiniStat label="Protein" value={phase.target_protein ? `${phase.target_protein}` : '—'} unit="g" />
            <MiniStat label="Bài tập" value="—" unit="bài" />
          </div>
          <Button
            onClick={onAction}
            className="w-full bg-[#54B7F0] hover:bg-[#3FA3DC] text-white shadow-button-blue font-extrabold h-10 mt-2"
          >
            {done ? 'Xem chi tiết' : 'Bắt đầu buổi tập'} <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      ) : (
        <div className="py-6 text-center">
          <p className="text-sm font-semibold text-muted-foreground mb-3">
            Tạo mùa giải và thêm phase đầu tiên để bắt đầu lên lịch tập.
          </p>
          <Button
            onClick={onAction}
            variant="outline"
            className="font-extrabold border-[#54B7F0] text-[#54B7F0] hover:bg-[rgba(84,183,240,0.10)]"
          >
            <Plus className="w-4 h-4 mr-2" /> Tạo giáo án
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Today's nutrition card with macro progress bars ───
function TodayNutritionCard({ phase, log }: { phase: Phase | null; log: DailyLog | null }) {
  const targetCal = log?.target_calories_snapshot ?? phase?.target_calories ?? null;
  const targetProt = log?.target_protein_snapshot ?? phase?.target_protein ?? null;
  const targetCarbs = log?.target_carbs_snapshot ?? phase?.target_carbs ?? null;
  const targetFat = log?.target_fat_snapshot ?? phase?.target_fat ?? null;

  const remCal = targetCal && log?.calories_in ? Math.max(0, targetCal - log.calories_in) : targetCal;
  const calPct = targetCal && log?.calories_in ? Math.min(100, Math.round((log.calories_in / targetCal) * 100)) : 0;

  return (
    <div className="bg-card rounded-2xl border shadow-card-light p-5 md:p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[rgba(239,144,53,0.10)] grid place-items-center">
            <Utensils className="w-5 h-5 text-[#EF9035]" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
              Dinh dưỡng hôm nay
            </p>
            <h3 className="font-extrabold text-base tracking-tight">
              {targetCal ? `Còn ${remCal} / ${targetCal} kcal` : 'Chưa có mục tiêu macro'}
            </h3>
          </div>
        </div>
        <StatusPill tone={calPct >= 90 ? 'green' : calPct >= 50 ? 'orange' : 'neutral'}>
          {calPct}%
        </StatusPill>
      </div>

      <div className="space-y-3">
        <MacroBar label="Calories" value={log?.calories_in ?? null} target={targetCal} color="#EF9035" unit="kcal" />
        <MacroBar label="Protein" value={log?.protein_in ?? null} target={targetProt} color="#54B7F0" />
        <MacroBar label="Carbs" value={log?.carbs_in ?? null} target={targetCarbs} color="#10b981" />
        <MacroBar label="Fat" value={log?.fat_in ?? null} target={targetFat} color="#a78bfa" />
      </div>

      <div className="grid grid-cols-3 gap-2 pt-4 mt-4 border-t">
        <MiniStat
          icon={Footprints}
          label="Bước"
          value={log?.steps ? `${(log.steps / 1000).toFixed(1)}k` : '—'}
        />
        <MiniStat
          icon={Moon}
          label="Giấc ngủ"
          value={log?.sleep_hours ? `${log.sleep_hours}` : '—'}
          unit={log?.sleep_hours ? 'h' : undefined}
        />
        <MiniStat
          icon={Droplet}
          label="Nước"
          value="—"
          unit="ml"
        />
      </div>
    </div>
  );
}

function MacroBar({
  label, value, target, color, unit = 'g',
}: { label: string; value: number | null; target: number | null; color: string; unit?: string }) {
  const pct = value && target ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.10em] text-muted-foreground">
          {label}
        </span>
        <div className="tabular-nums text-xs">
          <span className="font-extrabold" style={{ color }}>{value ?? '—'}</span>
          <span className="text-muted-foreground"> / {target ?? '—'} {unit}</span>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-input overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

function MiniStat({
  label, value, unit, icon: Icon,
}: { label: string; value: string; unit?: string; icon?: typeof Footprints }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1">
        {Icon && <Icon className="w-3 h-3" />}
        <span>{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-extrabold text-sm tabular-nums text-foreground">{value}</span>
        {unit && <span className="text-[10px] font-bold text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}

// ─── Season timeline strip ───
function SeasonTimeline({
  session, phases, progress, currentIdx, onClick,
}: {
  session: Session;
  phases: Phase[];
  progress: number;
  currentIdx: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full bg-card rounded-2xl border shadow-card-light hover:shadow-card-hover transition-all p-5 md:p-6 text-left"
    >
      <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
            Mùa giải đang chạy
          </p>
          <h3 className="font-extrabold text-lg tracking-tight mt-0.5">{session.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-2xl tabular-nums">{progress}<span className="text-base text-muted-foreground">%</span></span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      {/* Main progress bar */}
      <div className="h-2 rounded-full bg-input overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#54B7F0] via-[#F4BC41] to-[#EF9035] transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Phase chips */}
      <div className="mt-4 flex flex-wrap gap-2">
        {phases.map((p, idx) => {
          const isCurrent = idx === currentIdx;
          const isPast = parseISO(p.end_date) < new Date();
          return (
            <span
              key={p.id}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold transition-colors',
                isCurrent && 'bg-[rgba(84,183,240,0.10)] border-[rgba(84,183,240,0.30)] text-[#54B7F0]',
                isPast && !isCurrent && 'bg-[rgba(16,185,129,0.06)] border-[rgba(16,185,129,0.20)] text-[#10b981]',
                !isCurrent && !isPast && 'bg-input/50 border-border text-muted-foreground',
              )}
            >
              <span
                className={cn(
                  'w-4 h-4 rounded-full grid place-items-center text-[9px] font-extrabold',
                  isCurrent && 'bg-[#54B7F0] text-white',
                  isPast && !isCurrent && 'bg-[#10b981] text-white',
                  !isCurrent && !isPast && 'bg-muted-foreground/20 text-muted-foreground',
                )}
              >
                {isPast && !isCurrent ? '✓' : idx + 1}
              </span>
              <span className="truncate max-w-[140px]">{p.name}</span>
            </span>
          );
        })}
      </div>
    </button>
  );
}

// ─── AI insight card ───
function AIInsightCard({
  tone, icon: Icon, title, body,
}: { tone: 'blue' | 'orange' | 'red'; icon: typeof Sparkles; title: string; body: string }) {
  const borderColor = tone === 'blue' ? 'border-[rgba(84,183,240,0.30)]' : tone === 'orange' ? 'border-[rgba(239,144,53,0.30)]' : 'border-[rgba(239,68,68,0.30)]';
  const bgGrad = tone === 'blue'
    ? 'linear-gradient(135deg, rgba(84,183,240,0.08), transparent)'
    : tone === 'orange'
    ? 'linear-gradient(135deg, rgba(239,144,53,0.08), transparent)'
    : 'linear-gradient(135deg, rgba(239,68,68,0.08), transparent)';
  const iconColor = tone === 'blue' ? '#54B7F0' : tone === 'orange' ? '#EF9035' : '#ef4444';

  return (
    <div
      className={cn('rounded-xl border p-4', borderColor)}
      style={{ background: `var(--card), ${bgGrad}`, backgroundImage: bgGrad, backgroundColor: 'var(--card)' }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-lg grid place-items-center shrink-0"
          style={{ background: `${iconColor}1A`, color: iconColor }}
        >
          <Icon className="w-4 h-4" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-3 h-3" style={{ color: iconColor }} />
            <span className="text-[9px] font-extrabold uppercase tracking-[0.14em]" style={{ color: iconColor }}>
              AI đề xuất
            </span>
          </div>
          <h4 className="font-extrabold text-sm tracking-tight mb-1">{title}</h4>
          <p className="text-xs font-semibold text-muted-foreground leading-relaxed">{body}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Quick action button ───
function QuickAction({
  icon: Icon, label, tone, onClick,
}: { icon: typeof Trophy; label: string; tone: 'blue' | 'orange' | 'green' | 'red'; onClick: () => void }) {
  const color = tone === 'blue' ? '#54B7F0' : tone === 'orange' ? '#EF9035' : tone === 'green' ? '#10b981' : '#ef4444';
  return (
    <button
      type="button"
      onClick={onClick}
      className="group bg-card rounded-2xl border shadow-card-light hover:shadow-card-hover transition-all p-4 flex items-center justify-between gap-3 text-left"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-10 h-10 rounded-xl grid place-items-center shrink-0"
          style={{ background: `${color}1A`, color }}
        >
          <Icon className="w-5 h-5" strokeWidth={1.75} />
        </div>
        <span className="font-extrabold text-sm tracking-tight truncate group-hover:text-[color:var(--c)]" style={{ ['--c' as any]: color }}>
          {label}
        </span>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
    </button>
  );
}
