import React from 'react';
import { format, parseISO } from 'date-fns';
import { Phase, Session } from '@/types/session';
import { Button } from '@/components/ui/button';
import { Target, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusPill } from '@/components/shared/status-pill';

interface Props {
  session: Session;
  computed: {
    start: Date;
    end: Date;
    totalDays: number;
    passed: number;
    daysLeft: number;
    progress: number;
    phases: Phase[];
    currentPhaseIndex: number;
  };
  onPhaseSelect: (phaseId: number) => void;
  onAddPhase: () => void;
}

export default function SessionOverviewTab({ session, computed, onPhaseSelect, onAddPhase }: Props) {
  const sortedPhases = computed.phases;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
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
                <button
                  key={p.id}
                  onClick={() => onPhaseSelect(p.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-colors cursor-pointer hover:shadow-sm',
                    isCurrent && 'bg-[rgba(84,183,240,0.10)] border-[rgba(84,183,240,0.30)] text-[#54B7F0]',
                    isPast && !isCurrent && 'bg-[rgba(16,185,129,0.06)] border-[rgba(16,185,129,0.20)] text-[#10b981]',
                    !isCurrent && !isPast && 'bg-input/50 border-border text-muted-foreground hover:bg-input',
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
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── PHASES LIST ─── */}
      <div className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h3 className="font-display font-black text-xl tracking-tight">Các Giai đoạn (Phases)</h3>
          {sortedPhases.length > 0 && (
            <Button
              onClick={onAddPhase}
              size="sm"
              variant="outline"
              className="text-xs font-display font-extrabold h-8"
            >
              <Plus className="w-3 h-3 mr-1" /> Thêm Phase
            </Button>
          )}
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
              onClick={onAddPhase}
              className="mt-5 bg-[#54B7F0] hover:bg-[#3FA3DC] text-white shadow-button-blue font-display font-extrabold"
            >
              <Plus className="w-4 h-4 mr-2" /> Thêm Phase đầu tiên
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedPhases.map((phase, idx) => {
              const isCurrent = idx === computed.currentPhaseIndex;
              const isPast = parseISO(phase.end_date) < new Date();
              
              return (
                <div 
                  key={phase.id}
                  onClick={() => onPhaseSelect(phase.id)}
                  className={cn(
                    "bg-card rounded-2xl border shadow-sm p-5 cursor-pointer hover:border-[#54B7F0] hover:shadow-md transition-all group flex flex-col",
                    isCurrent && "border-[#54B7F0] ring-1 ring-[#54B7F0]/20"
                  )}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="bg-input text-foreground text-xs font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Phase {phase.order}
                    </div>
                    {isCurrent ? (
                      <StatusPill tone="blue" size="xs">Hiện tại</StatusPill>
                    ) : isPast ? (
                      <StatusPill tone="green" size="xs">Đã qua</StatusPill>
                    ) : (
                      <StatusPill tone="neutral" size="xs">Sắp tới</StatusPill>
                    )}
                  </div>
                  
                  <h4 className="font-display font-black text-lg text-foreground group-hover:text-[#54B7F0] transition-colors line-clamp-1 mb-1">
                    {phase.name}
                  </h4>
                  <p className="text-xs font-semibold text-muted-foreground mb-4">
                    {format(parseISO(phase.start_date), 'dd/MM/yyyy')} - {format(parseISO(phase.end_date), 'dd/MM/yyyy')}
                  </p>
                  
                  <div className="mt-auto grid grid-cols-4 gap-2 pt-4 border-t">
                    <div className="text-center">
                      <span className="block text-[9px] font-extrabold uppercase text-muted-foreground tracking-wider mb-0.5">Cal</span>
                      <span className="font-display font-bold text-xs">{phase.target_calories || '-'}</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-[9px] font-extrabold uppercase text-muted-foreground tracking-wider mb-0.5 text-blue-500/70">Pro</span>
                      <span className="font-display font-bold text-xs text-blue-600">{phase.target_protein || '-'}</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-[9px] font-extrabold uppercase text-muted-foreground tracking-wider mb-0.5 text-[#EF9035]/70">Carb</span>
                      <span className="font-display font-bold text-xs text-[#EF9035]">{phase.target_carbs || '-'}</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-[9px] font-extrabold uppercase text-muted-foreground tracking-wider mb-0.5 text-amber-500/70">Fat</span>
                      <span className="font-display font-bold text-xs text-amber-600">{phase.target_fat || '-'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
