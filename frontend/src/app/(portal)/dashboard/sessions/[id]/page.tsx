'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { sessionService } from '@/services/api/sessionService';
import { Session, Phase } from '@/types/session';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Plus, ArrowLeft, Target, Trophy, CheckCircle2
} from 'lucide-react';
import PhaseFormSheet from './components/PhaseFormSheet';
import PhaseRoadmapBlock from './components/PhaseRoadmapBlock';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = parseInt(params.id as string);

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Phase state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<Phase | null>(null);

  // Confirm dialogs state
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
    if (!isNaN(sessionId)) {
      fetchSession();
    }
  }, [sessionId, fetchSession]);

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
    } catch(e) {
      console.error(e);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleActivateClick = () => {
    if (session?.phases.length === 0) {
      alert("Cần tạo ít nhất 1 Phase trước khi Activate Mùa giải");
      return;
    }
    setIsActivateConfirmOpen(true);
  };

  if (loading) {
    return <div className="p-8 text-slate-500 flex items-center justify-center">Đang tải dữ liệu Mùa giải...</div>;
  }

  if (!session) return null;

  const sortedPhases = [...session.phases].sort((a,b) => a.order - b.order);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.push('/dashboard/sessions')} className="text-slate-500 -ml-4 hover:bg-transparent hover:text-slate-800">
         <ArrowLeft className="w-4 h-4 mr-2" /> Trở lại danh sách
      </Button>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-start gap-4">
           <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
              session.is_active ? "bg-[#EF9035]/10 text-[#EF9035]" : "bg-slate-50 text-slate-400"
           )}>
              <Trophy className="w-6 h-6" />
           </div>
           <div className="flex flex-col space-y-1">
             <div className="flex items-center gap-2">
               <h2 className="text-2xl font-bold text-slate-800">{session.name}</h2>
               {session.is_active && (
                 <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200">Đang Active</Badge>
               )}
               <Badge variant="outline" className="text-slate-500">{session.goal_type}</Badge>
             </div>
             <div className="flex items-center text-sm text-slate-500 gap-4">
                <div className="flex items-center">
                   {format(parseISO(session.start_date), 'dd/MM/yyyy')} - {format(parseISO(session.end_date), 'dd/MM/yyyy')}
                </div>
                <div>Trạng thái: <strong className="uppercase">{session.status}</strong></div>
             </div>
           </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {session.status === 'Draft' && (
            <Button
               variant="outline"
               onClick={handleActivateClick}
               className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" /> Kích hoạt
            </Button>
          )}
          <Button
            onClick={() => { setEditingPhase(null); setIsFormOpen(true); }}
            className="bg-[#54B7F0] hover:bg-[#3FA3DC] text-white shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> Thêm Phase mới
          </Button>
        </div>
      </div>

      {/* Phases Linear List */}
      <div className="space-y-8 pt-4">
        {sortedPhases.length === 0 ? (
           <div className="h-64 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
              <Target className="w-12 h-12 mb-3 text-slate-200" />
              <p>Mùa giải này chưa có Phase nào. Hãy bắt đầu bằng cách thêm một Phase mới.</p>
           </div>
        ) : (
           sortedPhases.map(phase => (
             <PhaseRoadmapBlock 
               key={phase.id} 
               phase={phase} 
               onEditPhase={(p) => { setEditingPhase(p); setIsFormOpen(true); }}
               onDeletePhase={(id) => setPhaseToDelete(phase)}
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

      {/* Confirm Deleting Phase */}
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

      {/* Confirm Activating Session */}
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
