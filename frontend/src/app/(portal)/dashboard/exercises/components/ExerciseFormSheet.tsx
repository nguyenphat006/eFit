import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { exerciseService } from '@/services/api/exerciseService';
import { Exercise, ExerciseCreate } from '@/types/exercise';
import { Loader2 } from 'lucide-react';

interface ExerciseFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Exercise | null;
  onSuccess: () => void;
}

export default function ExerciseFormSheet({ isOpen, onClose, initialData, onSuccess }: ExerciseFormSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ExerciseCreate>();

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          name: initialData.name,
          category: initialData.category,
          body_part: initialData.body_part,
          equipment: initialData.equipment,
          target: initialData.target,
          muscle_group: initialData.muscle_group,
        });
      } else {
        reset({
          name: '',
          category: '',
          body_part: '',
          equipment: '',
          target: '',
          muscle_group: '',
        });
      }
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = async (data: ExerciseCreate) => {
    setIsSubmitting(true);
    try {
      if (initialData) {
        await exerciseService.updateExercise(initialData.id, data);
      } else {
        await exerciseService.createExercise(data);
      }
      onSuccess();
      onClose();
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra khi lưu bài tập');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto custom-scrollbar">
        <SheetHeader className="mb-6">
          <SheetTitle>{initialData ? 'Chỉnh sửa Bài tập' : 'Thêm Bài tập mới'}</SheetTitle>
          <SheetDescription>
            Điền thông tin chi tiết của bài tập.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Tên bài tập (*)</Label>
            <Input {...register('name', { required: true })} placeholder="VD: Barbell Bench Press" />
            {errors.name && <span className="text-xs text-red-500">Bắt buộc nhập</span>}
          </div>

          <div className="space-y-2">
            <Label>Nhóm cơ chính (Category)</Label>
            <Input {...register('category')} placeholder="VD: chest" />
          </div>

          <div className="space-y-2">
            <Label>Dụng cụ (Equipment)</Label>
            <Input {...register('equipment')} placeholder="VD: barbell" />
          </div>

          <div className="space-y-2">
            <Label>Cơ mục tiêu (Target)</Label>
            <Input {...register('target')} placeholder="VD: pectorals" />
          </div>

          <div className="space-y-2">
            <Label>Phần cơ thể (Body Part)</Label>
            <Input {...register('body_part')} placeholder="VD: chest" />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>Huỷ</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-[#54B7F0] hover:bg-[#54B7F0]/90">
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {initialData ? 'Lưu thay đổi' : 'Tạo mới'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
