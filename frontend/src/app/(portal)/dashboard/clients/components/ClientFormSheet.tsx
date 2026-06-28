'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, Loader2, UserPlus, Pencil } from 'lucide-react';
import { ClientCreate, ClientListItem } from '@/types/client';

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

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ClientCreate) => Promise<void>;
  initialData?: ClientListItem | null;
}

export function ClientFormSheet({ isOpen, onClose, onSave, initialData }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ClientCreate>({
    full_name: '',
    phone: '',
    email: '',
    gender: 'Nam',
    date_of_birth: null,
    current_weight: null,
    height: null,
    body_fat_percentage: null,
    fitness_goal: 'Maintaining',
    activity_level: 1.2,
    training_frequency: null,
    notes: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        full_name: initialData.full_name,
        phone: initialData.phone || '',
        email: initialData.email || '',
        gender: initialData.gender || 'Nam',
        date_of_birth: null,
        current_weight: initialData.current_weight,
        height: null,
        body_fat_percentage: null,
        fitness_goal: initialData.fitness_goal || 'Maintaining',
        activity_level: 1.2,
        training_frequency: null,
        notes: '',
      });
    } else {
      setFormData({
        full_name: '',
        phone: '',
        email: '',
        gender: 'Nam',
        date_of_birth: null,
        current_weight: null,
        height: null,
        body_fat_percentage: null,
        fitness_goal: 'Maintaining',
        activity_level: 1.2,
        training_frequency: null,
        notes: '',
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim()) return;
    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="flex items-center gap-2 text-lg">
            {initialData ? (
              <><Pencil className="w-5 h-5 text-[#54B7F0]" /> Chỉnh sửa học viên</>
            ) : (
              <><UserPlus className="w-5 h-5 text-[#54B7F0]" /> Thêm học viên mới</>
            )}
          </SheetTitle>
          <SheetDescription>
            {initialData
              ? 'Cập nhật thông tin hồ sơ học viên.'
              : 'Nhập thông tin cơ bản để thêm học viên vào danh sách quản lý.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-5">
          {/* Thông tin cơ bản */}
          <div className="space-y-1">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#54B7F0]">Thông tin cơ bản</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Họ và tên <span className="text-red-500">*</span></Label>
              <Input
                value={formData.full_name}
                onChange={e => setFormData(f => ({ ...f, full_name: e.target.value }))}
                placeholder="VD: Nguyễn Văn An"
                className="bg-slate-50 border-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">Số điện thoại</Label>
                <Input
                  value={formData.phone || ''}
                  onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))}
                  placeholder="VD: 0901234567"
                  className="bg-slate-50 border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">Email</Label>
                <Input
                  type="email"
                  value={formData.email || ''}
                  onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                  placeholder="VD: an@gmail.com"
                  className="bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">Giới tính</Label>
                <Select
                  value={formData.gender || 'Nam'}
                  onValueChange={val => setFormData(f => ({ ...f, gender: val }))}
                >
                  <SelectTrigger className="bg-slate-50 border-slate-200">
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
                  onChange={e => setFormData(f => ({ ...f, date_of_birth: e.target.value || null }))}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Chỉ số thể chất */}
          <div className="space-y-1 pt-3 border-t border-slate-100">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#EF9035]">Chỉ số thể chất</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Cân nặng (kg)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.current_weight ?? ''}
                onChange={e => setFormData(f => ({ ...f, current_weight: e.target.value ? parseFloat(e.target.value) : null }))}
                placeholder="70.5"
                className="bg-slate-50 border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Chiều cao (cm)</Label>
              <Input
                type="number"
                value={formData.height ?? ''}
                onChange={e => setFormData(f => ({ ...f, height: e.target.value ? parseFloat(e.target.value) : null }))}
                placeholder="175"
                className="bg-slate-50 border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">% Mỡ</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.body_fat_percentage ?? ''}
                onChange={e => setFormData(f => ({ ...f, body_fat_percentage: e.target.value ? parseFloat(e.target.value) : null }))}
                placeholder="15.0"
                className="bg-slate-50 border-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Mục tiêu</Label>
              <Select
                value={formData.fitness_goal || 'Maintaining'}
                onValueChange={val => setFormData(f => ({ ...f, fitness_goal: val }))}
              >
                <SelectTrigger className="bg-slate-50 border-slate-200">
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
              <Label className="text-slate-700 font-medium">Tần suất tập (buổi/tuần)</Label>
              <Input
                type="number"
                min={0}
                max={7}
                value={formData.training_frequency ?? ''}
                onChange={e => setFormData(f => ({ ...f, training_frequency: e.target.value ? parseInt(e.target.value) : null }))}
                placeholder="4"
                className="bg-slate-50 border-slate-200"
              />
            </div>
          </div>

          {/* Ghi chú */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <Label className="text-slate-700 font-medium">Ghi chú riêng</Label>
            <Textarea
              value={formData.notes || ''}
              onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
              placeholder="Ghi chú về tình trạng sức khỏe, chấn thương, mục tiêu đặc biệt..."
              rows={3}
              className="bg-slate-50 border-slate-200 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.full_name.trim()}
              className="bg-[#54B7F0] hover:bg-[#3FA3DC] text-white"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {initialData ? 'Cập nhật' : 'Thêm học viên'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
