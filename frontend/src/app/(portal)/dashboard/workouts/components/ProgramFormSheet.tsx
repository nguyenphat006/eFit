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
  notes: z.string().optional(),
});


type FormData = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData?: WorkoutProgramListItem | null;
  onSuccess: (id?: number, isNew?: boolean) => void;
}

export default function ProgramFormSheet({ isOpen, onClose, initialData, onSuccess }: Props) {

  const isEdit = !!initialData;

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      notes: '',
    },
  });


  useEffect(() => {
    if (isOpen) {
      reset(isEdit ? {
        name: initialData.name,
        notes: initialData.notes ?? '',
      } : { name: '', notes: '' });
    }

  }, [isOpen, initialData]);

  const onSubmit = async (data: FormData) => {
    const payload = {
      ...data,
      frequency_per_week: initialData?.frequency_per_week ?? 0,
      notes: data.notes || undefined,
    };

    let program;
    if (isEdit) {
      program = await workoutService.updateProgram(initialData!.id, payload);
    } else {
      program = await workoutService.createProgram(payload);
    }
    onSuccess(program.id, !isEdit);
    onClose();
  };


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
