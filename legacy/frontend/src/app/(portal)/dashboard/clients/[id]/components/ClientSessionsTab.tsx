import { useState, useEffect } from 'react';
import { sessionService } from '@/services/api/sessionService';
import { SessionListItem, Session } from '@/types/session';
import { StatusPill } from '@/components/shared/status-pill';
import { Target, ChevronRight, ChevronDown, Layers, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import PhaseRoadmapBlock from '@/app/(portal)/dashboard/sessions/[id]/components/PhaseRoadmapBlock';

interface ClientSessionsTabProps {
  clientId: number;
}

const GOAL_TONES: Record<string, 'blue' | 'orange' | 'purple' | 'neutral'> = {
  Cutting: 'orange',
  Bulking: 'blue',
  Recomp: 'purple',
  Maintaining: 'neutral',
};

function SessionDetailInline({ sessionBase, defaultExpanded }: { sessionBase: SessionListItem, defaultExpanded: boolean }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isExpanded && !session) {
      setLoading(true);
      sessionService.getSession(sessionBase.id)
        .then(setSession)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isExpanded, sessionBase.id, session]);

  return (
    <div className="bg-card rounded-2xl border shadow-sm p-5 hover:border-[#54B7F0] transition-colors group">
      <div 
        className="flex items-start justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-bold text-foreground group-hover:text-[#54B7F0] transition-colors">
              {sessionBase.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <StatusPill tone={sessionBase.is_active ? 'green' : 'neutral'} size="xs">
                {sessionBase.is_active ? 'Đang chạy' : sessionBase.status}
              </StatusPill>
              <StatusPill tone={GOAL_TONES[sessionBase.goal_type] || 'neutral'} size="xs">
                {sessionBase.goal_type}
              </StatusPill>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Target className="w-4 h-4" />
              <span>{sessionBase.phase_count || 0} Giai đoạn</span>
            </div>
            <div>
              {format(parseISO(sessionBase.start_date), 'dd/MM/yyyy')} - {format(parseISO(sessionBase.end_date), 'dd/MM/yyyy')}
            </div>
          </div>
        </div>
        
        <div className="w-10 h-10 rounded-full bg-slate-50 grid place-items-center group-hover:bg-[#54B7F0]/10 transition-colors">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-[#54B7F0]" />
          ) : (
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#54B7F0]" />
          )}
        </div>
      </div>

      {/* Expanded Content: Phases */}
      {isExpanded && (
        <div className="mt-5 pt-5 border-t space-y-4">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : session ? (
            session.phases && session.phases.length > 0 ? (
              session.phases.map(phase => (
                <PhaseRoadmapBlock
                  key={phase.id}
                  phase={phase}
                  onEditPhase={() => {}}
                  onDeletePhase={() => {}}
                />
              ))
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground bg-slate-50 rounded-xl">
                Chưa có giai đoạn nào được tạo cho mùa giải này.
              </div>
            )
          ) : null}
        </div>
      )}
    </div>
  );
}

export default function ClientSessionsTab({ clientId }: ClientSessionsTabProps) {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sessionService.listByClient(clientId)
      .then(res => setSessions(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [clientId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[#54B7F0]" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-card rounded-2xl border shadow-sm p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 grid place-items-center mx-auto mb-4">
          <Layers className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">Chưa có mùa giải nào</h3>
        <p className="text-slate-500 mb-6 max-w-md mx-auto">
          Học viên này chưa được giao giáo án hay mùa giải nào. Hãy bắt đầu bằng cách giao một giáo án mẫu cho học viên.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map(session => (
        <SessionDetailInline 
          key={session.id} 
          sessionBase={session} 
          defaultExpanded={sessions.length === 1 || session.is_active} 
        />
      ))}
    </div>
  );
}
