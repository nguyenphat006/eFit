"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { vi } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import {
  Plus, Loader2, CheckCircle2, XCircle, CalendarCheck,
  TrendingUp, BarChart3, Flame, Dumbbell, Camera, AlertTriangle,
  CalendarDays, List as ListIcon, Sparkles, Edit3, Trophy, ArrowRight,
} from "lucide-react";

import { useDailyLogs } from "@/hooks/useDailyLogs";
import { DailyLog } from "@/services/api/dailyLogService";
import { sessionService } from "@/services/api/sessionService";
import type { SessionListItem, Phase } from "@/types/session";

import { Button } from "@/components/ui/button";
import { HeroHeader } from "@/components/shared/hero-header";
import { KpiTile } from "@/components/shared/kpi-tile";
import { StatusPill } from "@/components/shared/status-pill";
import { CalendarHeatmap } from "@/components/shared/calendar-heatmap";
import { DayDetailSheet } from "@/components/shared/day-detail-sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface PhaseLookup {
  sessionId: number;
  sessionName: string;
  phaseName: string;
}

// Mini compliance ring used inline in list view
function MiniRing({ score, size = 48 }: { score: number; size?: number }) {
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const o = c - (score / 100) * c;
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#EF9035' : '#ef4444';
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#e8f4fc" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={o}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display font-extrabold tabular-nums text-xs" style={{ color }}>
          {score}
        </span>
      </div>
    </div>
  );
}

export default function DailyLogsPage() {
  const router = useRouter();
  const { data: logsPage, isLoading } = useDailyLogs(1);
  const logs = useMemo(() => logsPage?.data || [], [logsPage]);

  // ─── State ───
  const [month, setMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [phaseLookup, setPhaseLookup] = useState<Map<number, PhaseLookup>>(new Map());
  const [allPhases, setAllPhases] = useState<Phase[]>([]);

  // Build phase → session lookup so log rows can cross-link to the session detail.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await sessionService.listSessions(1, 50);
        if (cancelled) return;
        // Eagerly load each session detail to read its phases. Use Promise.all for parallel.
        const details = await Promise.all(
          res.data.map((s: SessionListItem) =>
            sessionService.getSession(s.id).catch(() => null),
          ),
        );
        if (cancelled) return;
        const map = new Map<number, PhaseLookup>();
        const phasesList: Phase[] = [];
        for (const session of details) {
          if (!session) continue;
          for (const p of session.phases || []) {
            phasesList.push(p);
            map.set(p.id, {
              sessionId: session.id,
              sessionName: session.name,
              phaseName: p.name,
            });
          }
        }
        setPhaseLookup(map);
        setAllPhases(phasesList);
      } catch {
        /* mock fallback already handled inside service */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // ─── Derived data ───
  const logByDate = useMemo(() => {
    const map = new Map<string, DailyLog>();
    for (const l of logs) map.set(String(l.log_date), l);
    return map;
  }, [logs]);

  const todayLog = logByDate.get(todayStr) || null;

  const matchingPhaseId = useMemo(() => {
    if (!selectedDate) return null;
    const existing = logByDate.get(selectedDate);
    if (existing?.phase_id) return existing.phase_id;

    const matching = allPhases.find((p) => {
      const pStart = p.start_date;
      const pEnd = p.end_date;
      return selectedDate >= pStart && selectedDate <= pEnd;
    });
    return matching ? matching.id : null;
  }, [selectedDate, logByDate, allPhases]);

  // Logs falling in current displayed month
  const monthLogs = useMemo(() => {
    const start = format(startOfMonth(month), 'yyyy-MM-dd');
    const end = format(endOfMonth(month), 'yyyy-MM-dd');
    return logs.filter((l) => String(l.log_date) >= start && String(l.log_date) <= end);
  }, [logs, month]);

  // Stats over ALL logs (for KPI row, so they aren't tied to month nav)
  const summary = useMemo(() => {
    const totalLogs = logs.length;
    const scores = logs.filter((l) => l.compliance_score != null).map((l) => l.compliance_score!);
    const avgCompliance = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    const weights = logs.filter((l) => l.weight != null).sort((a, b) => String(b.log_date).localeCompare(String(a.log_date)));
    const latestWeight = weights.length > 0 ? weights[0].weight : null;

    const sorted = [...logs].sort((a, b) => String(a.log_date).localeCompare(String(b.log_date)));
    const last7 = sorted.slice(-7);
    const sparkCompliance = last7.map((l) => l.compliance_score ?? 0);
    const sparkWeight = last7.map((l) => l.weight ?? 0).filter((v) => v > 0);

    let streak = 0;
    if (logs.length > 0) {
      const desc = [...logs].sort((a, b) => String(b.log_date).localeCompare(String(a.log_date)));
      let expected = todayStr;
      for (const log of desc) {
        const ld = String(log.log_date);
        if (ld === expected || (streak === 0 && ld <= todayStr)) {
          streak++;
          const d = new Date(ld);
          d.setDate(d.getDate() - 1);
          expected = format(d, 'yyyy-MM-dd');
        } else if (streak > 0) break;
      }
    }

    return { totalLogs, avgCompliance, latestWeight, streak, sparkCompliance, sparkWeight };
  }, [logs, todayStr]);

  const handleSelectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    setSheetOpen(true);
  };

  const handleLogToday = () => {
    setSelectedDate(todayStr);
    setSheetOpen(true);
  };

  return (
    <div className="w-full space-y-6 pb-20 p-4 md:p-8 animate-in fade-in duration-500">
      {/* ─── HERO ─── */}
      {summary.totalLogs === 0 ? (
        <HeroHeader
          eyebrow="Daily Log · Hành trình"
          title="Mỗi ngày một bước,"
          titleAccent="kỷ luật là chìa khoá."
          subtitle="Click vào ngày bất kỳ trên lịch để xem hoặc ghi nhật ký. Compliance Score tự động tính theo bữa ăn, buổi tập và cân nặng đã log."
          action={
            <Button
              onClick={handleLogToday}
              className="btn-gradient-orange text-white font-display font-extrabold tracking-wide shrink-0 h-10 px-5"
            >
              {todayLog ? <Edit3 className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              {todayLog ? 'Sửa log hôm nay' : 'Log hôm nay'}
            </Button>
          }
          meta={
            <>
              <span>{summary.totalLogs} ngày đã log</span>
              <span>Streak {summary.streak} ngày</span>
              {summary.avgCompliance !== null && <span>Compliance TB {summary.avgCompliance}%</span>}
            </>
          }
        />
      ) : (
        <div className="flex items-center justify-between border-b pb-4 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Nhật ký hành trình
            </h1>
            <p className="text-xs font-semibold text-muted-foreground mt-1">
              {summary.totalLogs} ngày đã ghi nhận · Streak {summary.streak} ngày liên tiếp
            </p>
          </div>
          
          <Button
            onClick={handleLogToday}
            className="btn-gradient-orange text-white font-display font-extrabold tracking-wide shrink-0 h-10 px-5"
          >
            {todayLog ? <Edit3 className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {todayLog ? 'Sửa log hôm nay' : 'Log hôm nay'}
          </Button>
        </div>
      )}

      {/* ─── TODAY CARD ─── */}
      <TodayCard log={todayLog} onAction={handleLogToday} />

      {/* ─── KPI ROW ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile
          label="Tổng ngày"
          value={summary.totalLogs}
          icon={CalendarCheck}
          tone="blue"
          loading={isLoading}
        />
        <KpiTile
          label="Compliance TB"
          value={summary.avgCompliance !== null ? summary.avgCompliance : '—'}
          unit={summary.avgCompliance !== null ? '%' : undefined}
          icon={BarChart3}
          tone={
            summary.avgCompliance !== null && summary.avgCompliance >= 80 ? 'green'
              : summary.avgCompliance !== null && summary.avgCompliance >= 50 ? 'orange'
              : 'red'
          }
          spark={summary.sparkCompliance.length > 1 ? summary.sparkCompliance : undefined}
          loading={isLoading}
        />
        <KpiTile
          label="Cân nặng mới nhất"
          value={summary.latestWeight ?? '—'}
          unit={summary.latestWeight ? 'kg' : undefined}
          icon={TrendingUp}
          tone="orange"
          spark={summary.sparkWeight.length > 1 ? summary.sparkWeight : undefined}
          loading={isLoading}
        />
        <KpiTile
          label="Streak"
          value={summary.streak}
          unit="ngày"
          icon={Flame}
          tone="red"
          loading={isLoading}
        />
      </div>

      {/* ─── TABS: CALENDAR / LIST ─── */}
      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="bg-card border h-11 p-1">
          <TabsTrigger
            value="calendar"
            className="data-[state=active]:bg-[rgba(84,183,240,0.10)] data-[state=active]:text-[#54B7F0] data-[state=active]:shadow-none font-display font-extrabold tracking-wide px-4"
          >
            <CalendarDays className="w-4 h-4 mr-2" /> Lịch
          </TabsTrigger>
          <TabsTrigger
            value="list"
            className="data-[state=active]:bg-[rgba(239,144,53,0.10)] data-[state=active]:text-[#EF9035] data-[state=active]:shadow-none font-display font-extrabold tracking-wide px-4"
          >
            <ListIcon className="w-4 h-4 mr-2" /> Danh sách
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-5">
          {isLoading ? (
            <SkeletonCalendar />
          ) : (
            <CalendarHeatmap
              month={month}
              onMonthChange={setMonth}
              logs={logs}
              selectedDate={selectedDate || undefined}
              onSelectDate={handleSelectDate}
            />
          )}
        </TabsContent>

        <TabsContent value="list" className="mt-5">
          {isLoading ? (
            <SkeletonList />
          ) : monthLogs.length === 0 ? (
            <EmptyMonth onLogToday={handleLogToday} month={month} />
          ) : (
            <div className="space-y-3">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground px-1">
                Tháng {format(month, 'MM/yyyy')} · {monthLogs.length} ngày đã log
              </p>
              {monthLogs
                .sort((a, b) => String(b.log_date).localeCompare(String(a.log_date)))
                .map((log) => (
                  <CompactLogRow
                    key={log.id}
                    log={log}
                    onClick={() => handleSelectDate(String(log.log_date))}
                    isToday={String(log.log_date) === todayStr}
                    phaseInfo={log.phase_id ? phaseLookup.get(log.phase_id) : undefined}
                    onPhaseClick={(sessionId) => router.push(`/dashboard/sessions/${sessionId}`)}
                  />
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ─── DETAIL SHEET ─── */}
      <DayDetailSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        dateStr={selectedDate}
        existingLog={selectedDate ? logByDate.get(selectedDate) || null : null}
        userId={1}
        phaseInfo={
          selectedDate && logByDate.get(selectedDate)?.phase_id
            ? phaseLookup.get(logByDate.get(selectedDate)!.phase_id!)
            : undefined
        }
        onPhaseClick={(sessionId) => {
          setSheetOpen(false);
          router.push(`/dashboard/sessions/${sessionId}`);
        }}
        phaseId={matchingPhaseId}
      />
    </div>
  );
}

// ─── Today summary card ───
function TodayCard({ log, onAction }: { log: DailyLog | null; onAction: () => void }) {
  const today = new Date();
  const dayName = format(today, 'EEEE', { locale: vi });
  const dateStr = format(today, 'dd MMMM yyyy', { locale: vi });

  if (!log) {
    return (
      <div className="bg-card border border-dashed rounded-2xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[rgba(239,144,53,0.10)] flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-[#EF9035]" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
              {dayName}, {dateStr}
            </p>
            <h3 className="font-display font-black text-xl tracking-tight mt-1">
              Bắt đầu nhật ký hôm nay
            </h3>
            <p className="text-sm font-semibold text-muted-foreground mt-1 max-w-md">
              Ghi cân nặng, bữa ăn, buổi tập để Compliance Score tự cập nhật.
            </p>
          </div>
        </div>
        <Button
          onClick={onAction}
          className="bg-[#54B7F0] hover:bg-[#3FA3DC] text-white shadow-button-blue font-display font-extrabold h-10 px-5"
        >
          <Plus className="w-4 h-4 mr-2" /> Log ngay
        </Button>
      </div>
    );
  }

  const score = log.compliance_score ?? 0;
  const ringColor = score >= 80 ? '#10b981' : score >= 50 ? '#EF9035' : '#ef4444';
  const ringLabel = score >= 80 ? 'Xuất sắc' : score >= 50 ? 'Khá' : 'Cần cố gắng';

  return (
    <div className="bg-card border rounded-2xl p-5 md:p-6 shadow-card-light">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-5">
          <div className="relative w-20 h-20 shrink-0">
            <svg width={80} height={80} className="-rotate-90">
              <circle cx={40} cy={40} r={34} stroke="#e8f4fc" strokeWidth={8} fill="none" />
              <circle
                cx={40} cy={40} r={34}
                stroke={ringColor} strokeWidth={8} fill="none"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 34}
                strokeDashoffset={2 * Math.PI * 34 * (1 - score / 100)}
                className="transition-[stroke-dashoffset] duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display font-black tabular-nums text-xl leading-none" style={{ color: ringColor }}>
                {score}
              </span>
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground mt-0.5">
                %
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <StatusPill tone="blue" icon={<span className="w-1.5 h-1.5 rounded-full bg-[#54B7F0]" />}>
                Hôm nay
              </StatusPill>
              <StatusPill
                tone={score >= 80 ? 'green' : score >= 50 ? 'orange' : 'red'}
              >
                {ringLabel}
              </StatusPill>
            </div>
            <h3 className="font-display font-black text-xl tracking-tight">
              {dayName}, {dateStr}
            </h3>
            <div className="flex items-center gap-4 mt-2 text-sm font-semibold text-muted-foreground flex-wrap">
              {log.weight && (
                <span className="inline-flex items-center gap-1">
                  <span className="font-extrabold text-foreground tabular-nums">{log.weight}</span> kg
                </span>
              )}
              {log.diet_meals_completed !== null && log.diet_meals_completed !== undefined && (
                <span className="inline-flex items-center gap-1">
                  <span className="font-extrabold text-foreground tabular-nums">
                    {log.diet_meals_completed}/{log.diet_target_meals || 4}
                  </span> bữa
                </span>
              )}
              {log.is_workout_completed && (
                <span className="inline-flex items-center gap-1 text-[#10b981]">
                  <Dumbbell className="w-3.5 h-3.5" /> Đã tập
                </span>
              )}
              {log.sleep_hours && (
                <span className="inline-flex items-center gap-1">
                  <span className="font-extrabold text-foreground tabular-nums">{log.sleep_hours}h</span> ngủ
                </span>
              )}
              {log.diet_cheat_status === 'UNPLANNED' && (
                <span className="inline-flex items-center gap-1 text-[#ef4444]">
                  <AlertTriangle className="w-3.5 h-3.5" /> Cheat
                </span>
              )}
            </div>
          </div>
        </div>
        <Button
          onClick={onAction}
          variant="outline"
          className="font-display font-extrabold border-[#54B7F0] text-[#54B7F0] hover:bg-[rgba(84,183,240,0.10)] h-10 shrink-0"
        >
          <Edit3 className="w-4 h-4 mr-2" /> Chỉnh sửa
        </Button>
      </div>
    </div>
  );
}

// ─── Compact log row for list view ───
function CompactLogRow({
  log, onClick, isToday, phaseInfo, onPhaseClick,
}: {
  log: DailyLog; onClick: () => void; isToday: boolean;
  phaseInfo?: PhaseLookup;
  onPhaseClick?: (sessionId: number) => void;
}) {
  const score = log.compliance_score ?? 0;
  return (
    <div
      className={cn(
        "w-full bg-card rounded-xl border shadow-card-light hover:shadow-card-hover transition-all",
        "p-4 flex items-center gap-4 cursor-pointer",
        isToday && "ring-2 ring-[#54B7F0]/40",
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
    >
      {/* Date stamp */}
      <div className="flex flex-col items-center justify-center w-14 shrink-0">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
          {format(parseISO(String(log.log_date)), 'EEE', { locale: vi })}
        </span>
        <span className="font-display font-black text-2xl tabular-nums leading-none text-foreground mt-1">
          {format(parseISO(String(log.log_date)), 'dd')}
        </span>
        <span className="text-[9px] font-bold uppercase text-muted-foreground/70 mt-0.5">
          {format(parseISO(String(log.log_date)), 'MM/yy')}
        </span>
      </div>

      {/* Compliance ring */}
      {log.compliance_score !== null && log.compliance_score !== undefined ? (
        <MiniRing score={score} />
      ) : (
        <div className="w-12 h-12 rounded-full bg-input/40 grid place-items-center text-[10px] font-extrabold text-muted-foreground border border-dashed">
          —
        </div>
      )}

      <div className="hidden md:block w-px h-10 bg-border" />

      {/* Stats row */}
      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 items-center min-w-0">
        <Stat label="Cân" value={log.weight ? `${log.weight}` : '—'} unit={log.weight ? 'kg' : undefined} />
        <Stat
          label="Bữa"
          value={log.diet_meals_completed !== undefined && log.diet_meals_completed !== null ? `${log.diet_meals_completed}/${log.diet_target_meals || 4}` : '—'}
        />
        <Stat
          label="Tập"
          value={log.is_workout_completed ? 'OK' : '—'}
          color={log.is_workout_completed ? '#10b981' : undefined}
        />
        <Stat
          label="Bước"
          value={log.steps ? `${(log.steps / 1000).toFixed(1)}k` : '—'}
        />
      </div>

      {/* Phase link (cross-link to session detail) */}
      {phaseInfo && onPhaseClick && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onPhaseClick(phaseInfo.sessionId); }}
          className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[rgba(167,139,250,0.30)] bg-[rgba(167,139,250,0.10)] text-[#a78bfa] hover:bg-[rgba(167,139,250,0.20)] transition-colors shrink-0 max-w-[160px] group/phase"
          title={`${phaseInfo.phaseName} · ${phaseInfo.sessionName}`}
        >
          <Trophy className="w-3 h-3 shrink-0" />
          <span className="text-[10px] font-extrabold uppercase tracking-wider truncate">
            {phaseInfo.phaseName}
          </span>
          <ArrowRight className="w-3 h-3 opacity-0 group-hover/phase:opacity-100 transition-opacity shrink-0" />
        </button>
      )}

      {/* Indicator chips */}
      <div className="hidden lg:flex items-center gap-1 shrink-0">
        {log.is_workout_completed && (
          <span className="w-7 h-7 rounded-full bg-[rgba(16,185,129,0.12)] flex items-center justify-center">
            <Dumbbell className="w-3.5 h-3.5 text-[#10b981]" />
          </span>
        )}
        {log.body_images && log.body_images.length > 0 && (
          <span className="w-7 h-7 rounded-full bg-[rgba(84,183,240,0.12)] flex items-center justify-center">
            <Camera className="w-3.5 h-3.5 text-[#54B7F0]" />
          </span>
        )}
        {log.diet_cheat_status === 'UNPLANNED' && (
          <span className="w-7 h-7 rounded-full bg-[rgba(239,68,68,0.12)] flex items-center justify-center">
            <AlertTriangle className="w-3.5 h-3.5 text-[#ef4444]" />
          </span>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, unit, color }: { label: string; value: string; unit?: string; color?: string }) {
  return (
    <div className="flex flex-col min-w-0">
      <span className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground mb-0.5">
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span className="font-display font-extrabold text-sm tabular-nums truncate" style={{ color }}>
          {value}
        </span>
        {unit && <span className="text-[10px] font-bold text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}

function EmptyMonth({ onLogToday, month }: { onLogToday: () => void; month: Date }) {
  return (
    <div className="bg-card rounded-2xl border border-dashed py-12 text-center">
      <div className="inline-flex w-12 h-12 rounded-full bg-input items-center justify-center mb-3">
        <CalendarCheck className="w-6 h-6 text-muted-foreground" />
      </div>
      <p className="font-display font-extrabold text-lg text-foreground">
        Tháng {format(month, 'MM/yyyy')} chưa có log nào
      </p>
      <p className="text-sm font-semibold text-muted-foreground mt-1">
        Mở tab Lịch để click vào ngày bất kỳ, hoặc bắt đầu log hôm nay.
      </p>
      <Button
        onClick={onLogToday}
        className="mt-5 bg-[#EF9035] hover:bg-[#D6812F] text-white shadow-button-orange font-display font-extrabold"
      >
        <Plus className="w-4 h-4 mr-2" /> Log hôm nay
      </Button>
    </div>
  );
}

function SkeletonCalendar() {
  return (
    <div className="bg-card rounded-2xl border shadow-card-light p-6">
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="aspect-square min-h-[64px] rounded-xl bg-input/40 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-card rounded-xl border h-20 animate-pulse" />
      ))}
    </div>
  );
}
