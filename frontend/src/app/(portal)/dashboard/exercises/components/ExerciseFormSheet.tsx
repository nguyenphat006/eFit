import { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { exerciseService } from '@/services/api/exerciseService';
import { axiosClient } from '@/lib/axiosClient';
import { Exercise, ExerciseCreate } from '@/types/exercise';
import { Loader2, X, UploadCloud, ImageIcon, Film } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORIES = ['back', 'cardio', 'chest', 'lower arms', 'lower legs', 'neck', 'shoulders', 'upper arms', 'upper legs', 'waist'];
const EQUIPMENTS = ['assisted', 'band', 'barbell', 'body weight', 'cable', 'dumbbell', 'elliptical machine', 'ez barbell', 'hammer', 'kettlebell', 'leverage machine', 'medicine ball', 'olympic barbell', 'resistance band', 'roller', 'rope', 'skierg machine', 'sled machine', 'smith machine', 'stability ball', 'stationary bike', 'stepmill machine', 'tire', 'trap bar', 'upper body ergometer', 'weight', 'wheel roller'];
const TARGETS = ['abductors', 'abs', 'adductors', 'biceps', 'calves', 'cardiovascular system', 'delts', 'forearms', 'glutes', 'hamstrings', 'lats', 'levator scapulae', 'pectorals', 'quads', 'serratus anterior', 'spine', 'traps', 'triceps', 'upper back'];

interface ExerciseFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Exercise | null;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  category: string;
  body_part: string;
  equipment: string;
  target: string;
  muscle_group: string;
  instructions_en: string;
  is_active: boolean;
}

function MediaUpload({ 
  label, 
  value, 
  onChange, 
  accept, 
  icon: Icon 
}: { 
  label: string; 
  value: string; 
  onChange: (url: string) => void; 
  accept: string;
  icon: any;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axiosClient.post('/api/v1/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onChange(res.data.url);
    } catch (error) {
      console.error(error);
      alert('Upload lỗi. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div 
        className={cn(
          "border-2 border-dashed rounded-xl relative overflow-hidden bg-muted/20 flex flex-col items-center justify-center transition-colors hover:bg-muted/40 cursor-pointer",
          value ? "h-48" : "h-32"
        )}
        onClick={() => !isUploading && inputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={inputRef} 
          className="hidden" 
          accept={accept} 
          onChange={handleUpload} 
        />
        
        {isUploading ? (
          <div className="flex flex-col items-center text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <span className="text-sm">Đang tải lên...</span>
          </div>
        ) : value ? (
          <>
            {accept.includes('video') && value.endsWith('.mp4') ? (
              <video src={value} autoPlay loop muted playsInline className="w-full h-full object-cover" />
            ) : (
              <img src={value} alt="Preview" className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
              <Button variant="secondary" size="sm" type="button" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>
                <UploadCloud className="w-4 h-4 mr-2" /> Đổi file khác
              </Button>
            </div>
            <Button 
              variant="destructive" 
              size="icon" 
              className="absolute top-2 right-2 w-7 h-7 rounded-full shadow-sm"
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
            >
              <X className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center text-muted-foreground p-4 text-center">
            <Icon className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-sm font-medium">Nhấn để tải lên file</span>
            <span className="text-xs opacity-70 mt-1">Hỗ trợ {accept} (Max: 15MB)</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExerciseFormSheet({ isOpen, onClose, initialData, onSuccess }: ExerciseFormSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Custom states that fall outside react-hook-form natively
  const [secondaryMuscles, setSecondaryMuscles] = useState<string[]>([]);
  const [muscleInput, setMuscleInput] = useState('');
  
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>();

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        let instructionsEn = '';
        if (initialData.instructions) {
          instructionsEn = typeof initialData.instructions === 'string' ? initialData.instructions : (initialData.instructions['en'] || '');
        }

        reset({
          name: initialData.name || '',
          category: initialData.category || '',
          body_part: initialData.body_part || '',
          equipment: initialData.equipment || '',
          target: initialData.target || '',
          muscle_group: initialData.muscle_group || '',
          instructions_en: instructionsEn,
          is_active: initialData.is_active ?? true,
        });
        setSecondaryMuscles(initialData.secondary_muscles || []);
        setImageUrl(initialData.image_url || '');
        setVideoUrl(initialData.video_url || '');
      } else {
        reset({
          name: '',
          category: '',
          body_part: '',
          equipment: '',
          target: '',
          muscle_group: '',
          instructions_en: '',
          is_active: true,
        });
        setSecondaryMuscles([]);
        setImageUrl('');
        setVideoUrl('');
      }
      setMuscleInput('');
    }
  }, [isOpen, initialData, reset]);

  const handleAddMuscle = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = muscleInput.trim();
      if (val && !secondaryMuscles.includes(val)) {
        setSecondaryMuscles([...secondaryMuscles, val]);
      }
      setMuscleInput('');
    }
  };

  const removeMuscle = (m: string) => {
    setSecondaryMuscles(secondaryMuscles.filter(x => x !== m));
  };

  const onSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      const payload: ExerciseCreate = {
        name: formData.name,
        category: formData.category || null,
        body_part: formData.body_part || null,
        equipment: formData.equipment || null,
        target: formData.target || null,
        muscle_group: formData.muscle_group || null,
        secondary_muscles: secondaryMuscles.length > 0 ? secondaryMuscles : null,
        instructions: formData.instructions_en ? { en: formData.instructions_en } : null,
        image_url: imageUrl || null,
        video_url: videoUrl || null,
        is_active: formData.is_active,
      };

      if (initialData) {
        await exerciseService.updateExercise(initialData.id, payload);
      } else {
        await exerciseService.createExercise(payload);
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
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-[500px] overflow-y-auto custom-scrollbar p-0">
        <div className="px-6 pt-6 pb-4 border-b bg-card sticky top-0 z-10">
          <SheetHeader>
            <SheetTitle>{initialData ? 'Sửa bài tập' : 'Thêm bài tập mới'}</SheetTitle>
            <SheetDescription>
              Điền thông tin chi tiết cho bài tập. Các trường được cung cấp sẵn danh mục chuẩn.
            </SheetDescription>
          </SheetHeader>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
          
          {/* MEDIA SECTION - AT THE TOP */}
          <div className="grid grid-cols-2 gap-4">
            <MediaUpload 
              label="Ảnh tĩnh minh hoạ" 
              value={imageUrl} 
              onChange={setImageUrl} 
              accept="image/jpeg, image/png, image/webp" 
              icon={ImageIcon} 
            />
            <MediaUpload 
              label="Video/GIF minh hoạ" 
              value={videoUrl} 
              onChange={setVideoUrl} 
              accept="image/gif, video/mp4" 
              icon={Film} 
            />
          </div>

          <div className="space-y-2">
            <Label>Tên bài tập <span className="text-red-500">*</span></Label>
            <Input {...register('name', { required: true })} placeholder="VD: Barbell Bench Press" className="font-semibold text-lg" />
            {errors.name && <span className="text-xs text-red-500">Tên không được để trống</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Danh mục (Category)</Label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="capitalize">
                      <SelectValue placeholder="Chọn..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Dụng cụ (Equipment)</Label>
              <Controller
                control={control}
                name="equipment"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="capitalize">
                      <SelectValue placeholder="Chọn..." />
                    </SelectTrigger>
                    <SelectContent>
                      {EQUIPMENTS.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cơ mục tiêu (Target)</Label>
              <Controller
                control={control}
                name="target"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="capitalize">
                      <SelectValue placeholder="Chọn..." />
                    </SelectTrigger>
                    <SelectContent>
                      {TARGETS.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Nhóm cơ (Muscle Group)</Label>
              <Input {...register('muscle_group')} placeholder="VD: chest" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Các cơ phụ (Secondary Muscles)</Label>
            <div className="flex flex-wrap gap-2 mb-2 p-2 min-h-10 border rounded-md bg-muted/10 items-center">
              {secondaryMuscles.map(m => (
                <Badge key={m} variant="secondary" className="flex items-center gap-1 font-normal capitalize">
                  {m}
                  <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => removeMuscle(m)} />
                </Badge>
              ))}
              <input 
                type="text" 
                value={muscleInput}
                onChange={e => setMuscleInput(e.target.value)}
                onKeyDown={handleAddMuscle}
                className="flex-1 bg-transparent border-none outline-none text-sm min-w-24 placeholder:text-muted-foreground/70"
                placeholder={secondaryMuscles.length === 0 ? "Nhấn Enter hoặc phẩy để thêm" : "..."}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Bộ phận cơ thể (Body Part)</Label>
            <Input {...register('body_part')} placeholder="VD: chest" />
          </div>

          <div className="space-y-2">
            <Label>Hướng dẫn (Tiếng Anh)</Label>
            <Textarea {...register('instructions_en')} placeholder="Lie on a flat bench..." rows={4} />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/5">
            <div>
              <p className="font-semibold text-sm">Trạng thái hoạt động</p>
              <p className="text-xs text-muted-foreground">Bật để cho phép chọn bài tập này trong giáo án</p>
            </div>
            <Controller
              control={control}
              name="is_active"
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>

          <div className="pt-4 flex justify-end gap-2 pb-6 border-t mt-6">
            <Button type="button" variant="ghost" onClick={onClose}>Hủy</Button>
            <Button type="submit" className="bg-[#54B7F0] hover:bg-[#54B7F0]/90 text-white min-w-32" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {initialData ? 'Lưu thay đổi' : 'Thêm bài tập mới'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
