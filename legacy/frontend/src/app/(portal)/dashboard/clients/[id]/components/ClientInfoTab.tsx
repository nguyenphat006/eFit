import { useState } from 'react';
import { Client, ClientUpdate } from '@/types/client';
import { clientService } from '@/services/api/clientService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';

interface Props {
  client: Client;
  onUpdate: (updatedClient: Client) => void;
}

const GOALS = [
  { value: 'Cutting', label: 'Siết cơ (Cutting)' },
  { value: 'Bulking', label: 'Tăng cơ (Bulking)' },
  { value: 'Recomp', label: 'Recomp' },
  { value: 'Maintaining', label: 'Duy trì (Maintaining)' },
];

const GENDERS = [
  { value: 'Nam', label: 'Nam' },
  { value: 'Nữ', label: 'Nữ' },
  { value: 'Khác', label: 'Khác' },
];

export default function ClientInfoTab({ client, onUpdate }: Props) {
  const [formData, setFormData] = useState<ClientUpdate>({
    full_name: client.full_name,
    phone: client.phone,
    email: client.email,
    gender: client.gender,
    date_of_birth: client.date_of_birth,
    current_weight: client.current_weight,
    height: client.height,
    body_fat_percentage: client.body_fat_percentage,
    chest_measure: client.chest_measure,
    waist_measure: client.waist_measure,
    hips_measure: client.hips_measure,
    arm_measure: client.arm_measure,
    leg_measure: client.leg_measure,
    fitness_goal: client.fitness_goal || 'Maintaining',
    activity_level: client.activity_level,
    notes: client.notes,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await clientService.updateClient(client.id, formData);
      onUpdate(updated);
      alert('Đã cập nhật thông tin học viên');
    } catch (error) {
      alert('Lỗi khi cập nhật thông tin');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl border shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Cột 1: Thông tin cá nhân */}
      <div className="space-y-6">
        <div>
          <h3 className="font-display font-extrabold text-lg">Thông tin cá nhân</h3>
          <p className="text-sm text-muted-foreground mt-1">Thông tin cơ bản để liên lạc.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium">Họ và tên</Label>
            <Input 
              value={formData.full_name || ''} 
              onChange={e => setFormData({ ...formData, full_name: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Số điện thoại</Label>
              <Input 
                value={formData.phone || ''} 
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Email</Label>
              <Input 
                type="email"
                value={formData.email || ''} 
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Giới tính</Label>
              <Select
                value={formData.gender || 'Nam'}
                onValueChange={val => setFormData({ ...formData, gender: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GENDERS.map(g => (
                    <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Ngày sinh</Label>
              <Input 
                type="date"
                value={formData.date_of_birth || ''} 
                onChange={e => setFormData({ ...formData, date_of_birth: e.target.value || null })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cột 2: Chỉ số thể chất & Ghi chú */}
      <div className="space-y-6">
        <div>
          <h3 className="font-display font-extrabold text-lg text-[#EF9035]">Chỉ số thể chất & Ghi chú</h3>
          <p className="text-sm text-muted-foreground mt-1">Lưu trữ các thông số cơ thể hiện tại.</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium text-xs">Cân nặng (kg)</Label>
            <Input 
              type="number" step="0.1"
              value={formData.current_weight ?? ''} 
              onChange={e => setFormData({ ...formData, current_weight: e.target.value ? parseFloat(e.target.value) : null })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium text-xs">Chiều cao (cm)</Label>
            <Input 
              type="number" step="0.1"
              value={formData.height ?? ''} 
              onChange={e => setFormData({ ...formData, height: e.target.value ? parseFloat(e.target.value) : null })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium text-xs">% Mỡ</Label>
            <Input 
              type="number" step="0.1"
              value={formData.body_fat_percentage ?? ''} 
              onChange={e => setFormData({ ...formData, body_fat_percentage: e.target.value ? parseFloat(e.target.value) : null })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium text-xs">Ngực (cm)</Label>
            <Input 
              type="number" step="0.1"
              value={formData.chest_measure ?? ''} 
              onChange={e => setFormData({ ...formData, chest_measure: e.target.value ? parseFloat(e.target.value) : null })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium text-xs">Eo (cm)</Label>
            <Input 
              type="number" step="0.1"
              value={formData.waist_measure ?? ''} 
              onChange={e => setFormData({ ...formData, waist_measure: e.target.value ? parseFloat(e.target.value) : null })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium text-xs">Mông (cm)</Label>
            <Input 
              type="number" step="0.1"
              value={formData.hips_measure ?? ''} 
              onChange={e => setFormData({ ...formData, hips_measure: e.target.value ? parseFloat(e.target.value) : null })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium text-xs">Bắp tay (cm)</Label>
            <Input 
              type="number" step="0.1"
              value={formData.arm_measure ?? ''} 
              onChange={e => setFormData({ ...formData, arm_measure: e.target.value ? parseFloat(e.target.value) : null })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium text-xs">Bắp đùi (cm)</Label>
            <Input 
              type="number" step="0.1"
              value={formData.leg_measure ?? ''} 
              onChange={e => setFormData({ ...formData, leg_measure: e.target.value ? parseFloat(e.target.value) : null })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium">Mục tiêu</Label>
            <Select
              value={formData.fitness_goal || 'Maintaining'}
              onValueChange={val => setFormData({ ...formData, fitness_goal: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GOALS.map(g => (
                  <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium">Hệ số vận động</Label>
            <Input 
              type="number" step="0.1" min="1.0" max="2.0"
              value={formData.activity_level ?? ''} 
              onChange={e => setFormData({ ...formData, activity_level: e.target.value ? parseFloat(e.target.value) : null })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-700 font-medium">Ghi chú tình trạng</Label>
          <Textarea 
            value={formData.notes || ''} 
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Ghi chú về chấn thương, tiền sử bệnh, thói quen sinh hoạt..."
            className="min-h-[100px]"
          />
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={isSaving} className="bg-[#54B7F0] hover:bg-[#54B7F0]/90 text-white shadow-md">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Lưu thay đổi
          </Button>
        </div>
      </div>
    </div>
  );
}
