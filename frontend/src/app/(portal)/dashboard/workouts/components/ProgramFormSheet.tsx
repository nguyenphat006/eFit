'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { workoutService } from '@/services/api/workoutService';
import { WorkoutProgramListItem } from '@/types/workout';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

const schema = z.object({
  name: z.string().min(1, 'Tên chương trình không được để trống'),
  frequency_per_week: z.coerce.number().min(1).max(7),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  is_active: z.boolean().default(true),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData?: WorkoutProgramListItem | null;
  onSuccess: () => void;
}

const FREQUENCY_OPTIONS = [
  { value: 1, label: '1 buổi / tuần' },
  { value: 2, label: '2 buổi / tuần' },
  { value: 3, label: '3 buổi / tuần (PPL, Full Body...)' },
  { value: 4, label: '4 buổi / tuần (Upper/Lower)' },
  { value: 5, label: '5 buổi / tuần' },
  { value: 6, label: '6 buổi / tuần' },
  { value: 7, label: 'Mỗi ngày' },
];

export default function ProgramFormSheet({ isOpen, onClose, initialData, onSuccess }: Props) {
  const isEdit = !!initialData;

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      frequency_per_week: 3,
      is_active: true,
      notes: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset(isEdit ? {
        name: initialData.name,
        frequency_per_week: initialData.frequency_per_week,
        start_date: initialData.start_date ?? '',
        end_date: initialData.end_date ?? '',
        is_active: initialData.is_active,
        notes: initialData.notes ?? '',
      } : { name: '', frequency_per_week: 3, is_active: true, notes: '' });
    }
  }, [isOpen, initialData]);

  const onSubmit = async (data: FormData) => {
    const payload = {
      ...data,
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
      notes: data.notes || undefined,
    };
    if (isEdit) {
      await workoutService.updateProgram(initialData!.id, payload);
    } else {
      await workoutService.createProgram(payload);
    }
    onSuccess();
    onClose();
  };

  const isActive = watch('is_active');

  return (
    <Sheet open={isOpen} onOpenChange={open => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="font-display text-slate-800">
            {isEdit ? 'Sửa chương trình' : 'Tạo chương trình tập mới'}
          </SheetTitle>
          <SheetDescription className="text-slate-400 text-sm">
            {isEdit ? 'Cập nhật thông tin chương trình tập' : 'Định nghĩa lịch tập tuần cho chu kỳ mới'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Name */}
          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">
              Tên chương trình <span className="text-red-500">*</span>
            </Label>
            <Input
              {...register('name')}
              placeholder="VD: PPL – Hypertrophy Block, Upper/Lower..."
              className="bg-slate-50 border-slate-200 focus-visible:ring-[#54B7F0]"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          {/* Frequency */}
          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">
              Số buổi tập / tuần <span className="text-red-500">*</span>
            </Label>
            <select
              {...register('frequency_per_week', { valueAsNumber: true })}
              className="w-full h-10 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#54B7F0] focus:border-transparent"
            >
              {FREQUENCY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Bắt đầu</Label>
              <Input
                type="date"
                {...register('start_date')}
                className="bg-slate-50 border-slate-200 focus-visible:ring-[#54B7F0]"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Kết thúc</Label>
              <Input
                type="date"
                {...register('end_date')}
                className="bg-slate-50 border-slate-200 focus-visible:ring-[#54B7F0]"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Ghi chú</Label>
            <textarea
              {...register('notes')}
              rows={3}
              placeholder="Mô tả mục tiêu, ghi chú về chương trình..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#54B7F0] focus:border-transparent resize-none"
            />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div>
              <p className="text-sm font-semibold text-slate-700">Chương trình đang dùng</p>
              <p className="text-xs text-slate-400 mt-0.5">Đánh dấu là chương trình tập hiện tại</p>
            </div>
            <button
              type="button"
              onClick={() => setValue('is_active', !isActive)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${isActive ? 'bg-emerald-500' : 'bg-slate-200'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-[#54B7F0] hover:bg-[#3FA3DC] text-white"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? 'Cập nhật' : 'Tạo chương trình'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
