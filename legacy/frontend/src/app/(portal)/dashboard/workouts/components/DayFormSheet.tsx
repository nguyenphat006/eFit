'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { workoutService } from '@/services/api/workoutService';
import { WorkoutDay, DAY_OF_WEEK_LABELS } from '@/types/workout';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

const schema = z.object({
  day_label: z.string().min(1, 'Tên buổi tập không được để trống'),
  day_of_week: z.coerce.number().min(-1).max(6).optional(),
  order: z.coerce.number().min(0).default(0),
});

type FormData = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  programId: number;
  initialData?: WorkoutDay | null;
  onSuccess: () => void;
}

const DAY_OPTIONS = [
  { value: -1, label: 'Linh hoạt (không gắn ngày cố định)' },
  ...Object.entries(DAY_OF_WEEK_LABELS).map(([v, label]) => ({ value: Number(v), label })),
];

const PRESET_LABELS = [
  'Push Day', 'Pull Day', 'Legs Day', 'Upper Body', 'Lower Body',
  'Full Body', 'Push/Legs', 'Cardio & Core', 'Arms & Shoulders', 'Back & Chest',
];

export default function DayFormSheet({ isOpen, onClose, programId, initialData, onSuccess }: Props) {
  const isEdit = !!initialData;

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { day_label: '', day_of_week: -1, order: 0 },
  });

  useEffect(() => {
    if (isOpen) {
      reset(isEdit ? {
        day_label: initialData.day_label,
        day_of_week: initialData.day_of_week ?? -1,
        order: initialData.order,
      } : { day_label: '', day_of_week: -1, order: 0 });
    }
  }, [isOpen, initialData]);

  const onSubmit = async (data: FormData) => {
    const payload = {
      day_label: data.day_label,
      day_of_week: data.day_of_week === -1 ? null : data.day_of_week,
      order: data.order,
    };
    if (isEdit) {
      await workoutService.updateDay(initialData!.id, payload);
    } else {
      await workoutService.createDay(programId, payload);
    }
    onSuccess();
    onClose();
  };

  const dayLabel = watch('day_label');

  return (
    <Sheet open={isOpen} onOpenChange={open => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="font-display text-slate-800">
            {isEdit ? 'Sửa buổi tập' : 'Thêm buổi tập mới'}
          </SheetTitle>
          <SheetDescription className="text-slate-400 text-sm">
            Mỗi buổi tập đại diện cho một ngày trong chương trình
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Day Label */}
          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">
              Tên buổi tập <span className="text-red-500">*</span>
            </Label>
            <Input
              {...register('day_label')}
              placeholder="VD: Push Day, Pull Day, Legs..."
              className="bg-slate-50 border-slate-200 focus-visible:ring-[#54B7F0] mb-2"
            />
            {errors.day_label && <p className="text-xs text-red-500 mt-1">{errors.day_label.message}</p>}

            {/* Quick presets */}
            <div className="flex flex-wrap gap-1.5">
              {PRESET_LABELS.map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setValue('day_label', preset)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                    dayLabel === preset
                      ? 'bg-[#54B7F0] text-white border-[#54B7F0]'
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-[#54B7F0]/50 hover:text-[#54B7F0]'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Day of Week */}
          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Ngày trong tuần</Label>
            <select
              {...register('day_of_week', { valueAsNumber: true })}
              className="w-full h-10 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#54B7F0] focus:border-transparent"
            >
              {DAY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">
              Gắn với ngày cụ thể để hiển thị đúng trong lịch tuần
            </p>
          </div>

          {/* Order */}
          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Thứ tự hiển thị</Label>
            <Input
              type="number"
              {...register('order', { valueAsNumber: true })}
              min={0}
              className="bg-slate-50 border-slate-200 focus-visible:ring-[#54B7F0] w-24"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Hủy</Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-[#54B7F0] hover:bg-[#3FA3DC] text-white">
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? 'Cập nhật' : 'Thêm buổi tập'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
