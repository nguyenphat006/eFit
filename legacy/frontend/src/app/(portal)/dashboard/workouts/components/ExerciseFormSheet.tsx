'use client';

import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { workoutService } from '@/services/api/workoutService';
import { exerciseService } from '@/services/api/exerciseService';
import { WorkoutExercise } from '@/types/workout';
import { Exercise } from '@/types/exercise';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Info, Search, Check } from 'lucide-react';

const schema = z.object({
  exercise_id: z.coerce.number().optional().nullable(),
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
    defaultValues: { exercise_id: null, exercise_name: '', order: 0, sets: 3, reps: '8-10', target_rpe: '', tempo: '', rest_seconds: 120, notes: '' },
  });

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Exercise[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      reset(isEdit ? {
        exercise_id: initialData.exercise_id || null,
        exercise_name: initialData.exercise_name,
        order: initialData.order,
        sets: initialData.sets,
        reps: initialData.reps,
        target_rpe: initialData.target_rpe ?? '',
        tempo: initialData.tempo ?? '',
        rest_seconds: initialData.rest_seconds ?? 120,
        notes: initialData.notes ?? '',
      } : { exercise_id: null, exercise_name: '', order: 0, sets: 3, reps: '8-10', target_rpe: '', tempo: '', rest_seconds: 120, notes: '' });
      setSearch(isEdit ? initialData.exercise_name : '');
    }
  }, [isOpen, initialData]);

  // Handle outside click for dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Simple debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch exercises when debounced search changes
  useEffect(() => {
    async function fetchSearch() {
      if (!debouncedSearch.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await exerciseService.getExercises(0, 10, debouncedSearch);
        setSearchResults(res.items);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }
    fetchSearch();
  }, [debouncedSearch]);

  const handleSelectExercise = (ex: Exercise) => {
    setValue('exercise_id', ex.id);
    setValue('exercise_name', ex.name);
    setSearch(ex.name);
    setShowDropdown(false);
  };

  const onSubmit = async (data: FormData) => {
    const payload = {
      exercise_id: data.exercise_id,
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
          {/* Exercise Search Combobox */}
          <div className="relative" ref={dropdownRef}>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">
              Tìm & Chọn bài tập <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Gõ để tìm kiếm..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setValue('exercise_name', e.target.value);
                  setValue('exercise_id', null);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-[#54B7F0]"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            {errors.exercise_name && <p className="text-xs text-red-500 mt-1">{errors.exercise_name.message}</p>}

            {/* Dropdown Results */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((ex) => (
                  <div
                    key={ex.id}
                    onClick={() => handleSelectExercise(ex)}
                    className="flex items-center px-4 py-2 cursor-pointer hover:bg-slate-50"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{ex.name}</p>
                      {(ex.target || ex.equipment) && (
                        <p className="text-xs text-muted-foreground capitalize">
                          {ex.target} • {ex.equipment}
                        </p>
                      )}
                    </div>
                    {watched.exercise_id === ex.id && <Check className="w-4 h-4 text-[#54B7F0]" />}
                  </div>
                ))}
              </div>
            )}
            
            {showDropdown && search.trim() !== '' && searchResults.length === 0 && !isSearching && (
              <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg p-4 text-center text-sm text-muted-foreground">
                Không tìm thấy bài tập nào. Nó sẽ được lưu dưới dạng Text tự do.
              </div>
            )}
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

          <div className="flex flex-wrap gap-1.5 mt-2">
            {REPS_PRESETS.map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => setValue('reps', preset)}
                className={`text-[10px] px-2 py-1 rounded-md border transition-all ${
                  watched.reps === preset
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* RPE & Tempo */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center justify-between">
                Target RPE
                <Info className="w-3 h-3 text-slate-400" />
              </Label>
              <Input
                type="number"
                step="0.5"
                {...register('target_rpe')}
                placeholder="VD: 8, 8.5"
                className="bg-slate-50 border-slate-200 focus-visible:ring-[#54B7F0]"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center justify-between">
                Tempo
                <Info className="w-3 h-3 text-slate-400" />
              </Label>
              <Input
                {...register('tempo')}
                placeholder="VD: 3010"
                className="bg-slate-50 border-slate-200 focus-visible:ring-[#54B7F0]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="flex flex-wrap gap-1">
              {RPE_PRESETS.map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setValue('target_rpe', preset)}
                  className={`text-[10px] px-1.5 py-0.5 rounded border ${
                    watched.target_rpe === preset
                      ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 border-slate-200'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {TEMPO_PRESETS.map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setValue('tempo', preset)}
                  className={`text-[10px] px-1.5 py-0.5 rounded border ${
                    watched.tempo === preset
                      ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 border-slate-200'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Rest */}
          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">
              Thời gian nghỉ (Rest)
            </Label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                {...register('rest_seconds')}
                placeholder="Giây..."
                className="w-24 bg-slate-50 border-slate-200 focus-visible:ring-[#54B7F0]"
              />
              <span className="text-sm text-slate-500">giây</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {REST_PRESETS.map(preset => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setValue('rest_seconds', preset.value)}
                  className={`text-[11px] px-2 py-1 rounded-md border transition-all ${
                    watched.rest_seconds === preset.value
                      ? 'bg-orange-100 text-orange-700 border-orange-200'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-orange-200 hover:text-orange-600'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">
              Ghi chú thêm
            </Label>
            <Input
              {...register('notes')}
              placeholder="Ghi chú kỹ thuật, cue cho học viên..."
              className="bg-slate-50 border-slate-200 focus-visible:ring-[#54B7F0]"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 mt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full text-slate-500 border-slate-200 hover:bg-slate-50"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#54B7F0] hover:bg-[#54B7F0]/90 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                isEdit ? 'Lưu bài tập' : 'Thêm vào ngày tập'
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
