import { Client } from '@/types/client';
import { StatusPill } from '@/components/shared/status-pill';
import { Button } from '@/components/ui/button';
import {
  Phone, Mail, Calendar, Weight, Target, Activity, Flame, Edit, Layers
} from 'lucide-react';
import { differenceInYears, parseISO } from 'date-fns';

interface ClientProfileCardProps {
  client: Client;
  onEdit: () => void;
  onAssignTemplate: () => void;
}

const GOAL_LABELS: Record<string, string> = {
  Cutting: 'Siết cơ',
  Bulking: 'Tăng cơ',
  Recomp: 'Recomp',
  Maintaining: 'Duy trì',
};

const GOAL_TONES: Record<string, 'blue' | 'orange' | 'green' | 'red' | 'purple' | 'neutral'> = {
  Cutting: 'red',
  Bulking: 'blue',
  Recomp: 'purple',
  Maintaining: 'green',
};

export default function ClientProfileCard({ client, onEdit, onAssignTemplate }: ClientProfileCardProps) {
  const age = client.date_of_birth ? differenceInYears(new Date(), parseISO(client.date_of_birth)) : null;

  return (
    <div className="bg-card rounded-2xl border shadow-card-light overflow-hidden sticky top-6">
      {/* Header / Avatar */}
      <div className="p-6 text-center space-y-4 border-b">
        <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-[#54B7F0]/20 to-[#EF9035]/20 grid place-items-center shrink-0 border border-[#54B7F0]/20 shadow-sm">
          <span className="text-3xl font-extrabold text-[#54B7F0]">
            {client.full_name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-foreground">{client.full_name}</h2>
          <div className="flex justify-center items-center gap-2 mt-2">
            <StatusPill tone={client.status === 'Active' ? 'green' : 'neutral'} size="sm">
              {client.status}
            </StatusPill>
            {client.fitness_goal && (
              <StatusPill tone={GOAL_TONES[client.fitness_goal] || 'neutral'} size="sm">
                {GOAL_LABELS[client.fitness_goal] || client.fitness_goal}
              </StatusPill>
            )}
          </div>
        </div>
      </div>

      {/* Info List */}
      <div className="p-5 space-y-4 text-sm border-b">
        {client.phone && (
          <div className="flex items-center gap-3 text-muted-foreground">
            <Phone className="w-4 h-4 text-[#54B7F0]" />
            <span className="font-medium text-foreground">{client.phone}</span>
          </div>
        )}
        {client.email && (
          <div className="flex items-center gap-3 text-muted-foreground">
            <Mail className="w-4 h-4 text-[#54B7F0]" />
            <span className="font-medium text-foreground break-all">{client.email}</span>
          </div>
        )}
        <div className="flex items-center gap-3 text-muted-foreground">
          <Calendar className="w-4 h-4 text-[#54B7F0]" />
          <span>
            {client.gender || 'Chưa cập nhật GT'} · {age ? `${age} tuổi` : 'Chưa cập nhật tuổi'}
          </span>
        </div>
      </div>

      {/* Body Stats Grid */}
      <div className="p-5 grid grid-cols-2 gap-4 border-b bg-slate-50/50">
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Weight className="w-3.5 h-3.5" /> Cân nặng
          </div>
          <div className="font-bold text-foreground">
            {client.current_weight ? `${client.current_weight} kg` : '—'}
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" /> Chiều cao
          </div>
          <div className="font-bold text-foreground">
            {client.height ? `${client.height} cm` : '—'}
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5" /> Body Fat
          </div>
          <div className="font-bold text-foreground">
            {client.body_fat_percentage ? `${client.body_fat_percentage}%` : '—'}
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" /> Tần suất
          </div>
          <div className="font-bold text-foreground">
            {client.training_frequency ? `${client.training_frequency} buổi/tuần` : '—'}
          </div>
        </div>
      </div>

      {/* Notes */}
      {client.notes && (
        <div className="p-5 border-b">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Ghi chú của PT
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
            {client.notes}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="p-5 space-y-3 bg-slate-50/50">
        <Button 
          onClick={onAssignTemplate}
          className="w-full bg-[#54B7F0] hover:bg-[#3FA3DC] text-white shadow-button-blue font-extrabold"
        >
          <Layers className="w-4 h-4 mr-2" /> Giao giáo án mới
        </Button>
        <Button 
          onClick={onEdit}
          variant="outline"
          className="w-full"
        >
          <Edit className="w-4 h-4 mr-2 text-muted-foreground" /> Chỉnh sửa hồ sơ
        </Button>
      </div>
    </div>
  );
}
