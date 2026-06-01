'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { workoutService } from '@/services/api/workoutService';
import { WorkoutExercise } from '@/types/workout';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Info } from 'lucide-react';

const schema = z.object({
  exercise_name: z.string().min(1, 'Tên bài tập không được để trống'),
  order: z.coerce.number().min(0).default(0),
  sets: z.coerce.number().min(1, 'Phải có ít nhất 1 set').default(3),
  reps: z.string().min(1, 'Nhập số rep').default('8-10'),
  target_rpe: z.coerce.number().min(5).max(10).optional().or(z.literal('')),
  tempo: z.string().optional(),
  rest_seconds: z.coerce.number().min(0).optional().or(z.literal('')),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  dayId: number;
  initialData?: WorkoutExercise | null;
  onSuccess: () => void;
}

const EXERCISE_PRESETS = [
  'Bench Press', 'Incline Bench Press', 'Overhead Press', 'Lateral Raise',
  'Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Curl', 'Leg Extension',
  'Pull-up', 'Barbell Row', 'Lat Pulldown', 'Cable Row', 'Deadlift',
  'Dumbbell Curl', 'Tricep Pushdown', 'Skull Crusher', 'Face Pull',
];

const REPS_PRESETS = ['4-6', '6-8', '8-10', '10-12', '12-15', '15-20', 'AMRAP'];
const RPE_PRESETS = [6, 7, 7.5, 8, 8.5, 9, 9.5, 10];
const TEMPO_PRESETS = ['3010', '4010', '2011', '3110', '1010', 'Controlled'];
const REST_PRESETS = [
  { label: '60"', value: 60 }, { label: '90"', value: 90 }, { label: "2'", value: 120 },
  { label: "3'", value: 180 }, { label: "4'", value: 240 }, { label: "5'", value: 300 },
];

export default function ExerciseFormSheet({ isOpen, onClose, dayId, initialData, onSuccess }: Props) {
  const isEdit = !!initialData;

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { exercise_name: '', order: 0, sets: 3, reps: '8-10', target_rpe: '', tempo: '', rest_seconds: 120, notes: '' },
  });

  useEffect(() => {
    if (isOpen) {
      reset(isEdit ? {
        exercise_name: initialData.exercise_name,
        order: initialData.order,
        sets: initialData.sets,
        reps: initialData.reps,
        target_rpe: initialData.target_rpe ?? '',
        tempo: initialData.tempo ?? '',
        rest_seconds: initialData.rest_seconds ?? 120,
        notes: initialData.notes ?? '',
      } : { exercise_name: '', order: 0, sets: 3, reps: '8-10', target_rpe: '', tempo: '', rest_seconds: 120, notes: '' });
    }
  }, [isOpen, initialData]);

  const onSubmit = async (data: FormData) => {
    const payload = {
      exercise_name: data.exercise_name,
      order: data.order,
      sets: data.sets,
      reps: data.reps,
      target_rpe: data.target_rpe === '' ? null : Number(data.target_rpe),
      tempo: data.tempo || null,
      rest_seconds: data.rest_seconds === '' ? null : Number(data.rest_seconds),
      notes: data.notes || null,
    };
    if (isEdit) {
      await workoutService.updateExercise(initialData!.id, payload);
    } else {
      await workoutService.createExercise(dayId, payload);
    }
    onSuccess();
    onClose();
  };

  const watched = watch();

  return (
    <Sheet open={isOpen} onOpenChange={open => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="font-display text-slate-800">
            {isEdit ? 'Sửa bài tập' : 'Thêm bài tập mới'}
          </SheetTitle>
          <SheetDescription className="text-slate-400 text-sm">
            Nhập đầy đủ thông số để lập trình tập chính xác
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Exercise Name */}
          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">
              Tên bài tập <span className="text-red-500">*</span>
            </Label>
            <Input
              {...register('exercise_name')}
              placeholder="VD: Bench Press, Squat..."
              className="bg-slate-50 border-slate-200 focus-visible:ring-[#54B7F0] mb-2"
            />
            {errors.exercise_name && <p className="text-xs text-red-500 mt-1">{errors.exercise_name.message}</p>}
            <div className="flex flex-wrap gap-1.5">
              {EXERCISE_PRESETS.map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setValue('exercise_name', preset)}
                  className={`text-xs px-2 py-1 rounded-full border transition-all ${
                    watched.exercise_name === preset
                      ? 'bg-[#54B7F0] text-white border-[#54B7F0]'
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-[#54B7F0]/50 hover:text-[#54B7F0]'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Sets & Reps */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                Số Set <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                min={1}
                {...register('sets', { valueAsNumber: true })}
                className="bg-slate-50 border-slate-200 focus-visible:ring-[#54B7F0]"
              />
              {errors.sets && <p className="text-xs text-red-500 mt-1">{errors.sets.message}</p>}
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                Số Rep <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register('reps')}
                placeholder="VD: 6-8, 10, AMRAP"
                className="bg-slate-50 border-slate-200 focus-visible:ring-[#54B7F0]"
              />
              {errors.reps && <p className="text-xs text-red-500 mt-1">{errors.reps.message}</p>}
            </div>
          </div>
          {/* Reps presets */}
          <div className="flex flex-wrap gap-1.5 -mt-2">
            {REPS_PRESETS.map(r => (
              <button key={r} type="button" onClick={() => setValue('reps', r)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                  watched.reps === r ? 'bg-[#54B7F0] text-white border-[#54B7F0]' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-[#54B7F0]/50'
                }`}>
                {r}
              </button>
            ))}
          </div>

          {/* RPE */}
          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
              Target RPE
              <span className="text-[10px] font-normal text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">(Tùy chọn)</span>
              <div className="group relative cursor-help">
                <Info className="w-3 h-3 text-slate-400" />
                <div className="absolute bottom-5 left-0 w-48 bg-slate-800 text-white text-xs p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                  RPE 10 = hết sức, 8 = còn ~2 rep, 7 = còn ~3 rep
                </div>
              </div>
            </Label>
            <Input
              type="number"
              step={0.5}
              min={5}
              max={10}
              placeholder="VD: 8.5"
              {...register('target_rpe')}
              className="bg-slate-50 border-slate-200 focus-visible:ring-[#54B7F0]"
            />
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {RPE_PRESETS.map(r => (
                <button key={r} type="button" onClick={() => setValue('target_rpe', r)}
                  className={`text-xs px-2 py-1 rounded-full border transition-all font-mono ${
                    Number(watched.target_rpe) === r ? 'bg-[#EF9035] text-white border-[#EF9035]' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-orange-300'
                  }`}>
                  @{r}
                </button>
              ))}
            </div>
          </div>

          {/* Tempo */}
          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
              Tempo
              <span className="text-[10px] font-normal text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">(Tùy chọn)</span>
              <div className="group relative cursor-help">
                <Info className="w-3 h-3 text-slate-400" />
                <div className="absolute bottom-5 left-0 w-56 bg-slate-800 text-white text-xs p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                  Ký hiệu ETCT: 3010 = Hạ 3s – 0s dừng – Nâng 1s – 0s đỉnh
                </div>
              </div>
            </Label>
            <Input
              {...register('tempo')}
              placeholder="VD: 3010"
              className="bg-slate-50 border-slate-200 focus-visible:ring-[#54B7F0] font-mono"
            />
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {TEMPO_PRESETS.map(t => (
                <button key={t} type="button" onClick={() => setValue('tempo', t)}
                  className={`text-xs px-2 py-1 rounded-full border transition-all font-mono ${
                    watched.tempo === t ? 'bg-slate-700 text-white border-slate-700' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-400'
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Rest Time */}
          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">
              Thời gian nghỉ giữa set
            </Label>
            <div className="flex gap-2 flex-wrap mb-2">
              {REST_PRESETS.map(r => (
                <button key={r.value} type="button" onClick={() => setValue('rest_seconds', r.value)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    Number(watched.rest_seconds) === r.value ? 'bg-[#54B7F0] text-white border-[#54B7F0]' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-[#54B7F0]/50'
                  }`}>
                  {r.label}
                </button>
              ))}
            </div>
            <Input
              type="number"
              min={0}
              {...register('rest_seconds')}
              placeholder="Nhập thủ công (giây)"
              className="bg-slate-50 border-slate-200 focus-visible:ring-[#54B7F0] w-40 text-sm"
            />
          </div>

          {/* Notes */}
          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Ghi chú</Label>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="VD: Tập đến failure set cuối, trọng tâm vào squeeze..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#54B7F0] focus:border-transparent resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Hủy</Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-[#54B7F0] hover:bg-[#3FA3DC] text-white">
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? 'Cập nhật' : 'Thêm bài tập'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
