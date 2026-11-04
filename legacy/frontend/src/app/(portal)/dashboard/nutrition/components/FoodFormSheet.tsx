'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FoodCategory, FoodItem } from '@/types/nutrition';
import { nutritionService } from '@/services/api/nutritionService';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, X, ImageIcon } from 'lucide-react';

// Form Validation Schema
const formSchema = z.object({
  name: z.string().min(2, { message: 'Tên món ăn phải có ít nhất 2 ký tự' }),
  category_code: z.string().min(1, { message: 'Vui lòng chọn danh mục' }),
  calories: z.coerce.number().min(0, { message: 'Calories phải lớn hơn hoặc bằng 0' }),
  protein: z.coerce.number().min(0, { message: 'Protein không hợp lệ' }),
  carbs: z.coerce.number().min(0, { message: 'Carbs không hợp lệ' }),
  fat: z.coerce.number().min(0, { message: 'Fat không hợp lệ' }),
  fiber: z.coerce.number().min(0).optional().default(0),
  base_unit: z.string().min(1, { message: 'Đơn vị tính không được để trống' }),
  default_serving_name: z.string().optional().or(z.literal('')),
  default_serving_weight: z.coerce.number().optional().or(z.literal(0)),
});

type FormValues = z.infer<typeof formSchema>;

interface FoodFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  categories: FoodCategory[];
  initialData?: FoodItem | null;
  onSuccess: () => void;
}

export function FoodFormSheet({ isOpen, onClose, categories, initialData, onSuccess }: FoodFormSheetProps) {
  const isEditing = !!initialData;

  // Image upload state (managed outside react-hook-form)
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      category_code: '',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      base_unit: '100g',
      default_serving_name: '',
      default_serving_weight: 0,
    },
  });

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData && isOpen) {
      form.reset({
        name: initialData.name,
        category_code: initialData.category_code,
        calories: initialData.calories,
        protein: initialData.protein,
        carbs: initialData.carbs,
        fat: initialData.fat,
        fiber: initialData.fiber || 0,
        base_unit: initialData.base_unit || '100g',
        default_serving_name: initialData.default_serving_name || '',
        default_serving_weight: initialData.default_serving_weight || 0,
      });
      // Set existing image preview
      setImagePreview(initialData.image_url || null);
      setImageFile(null);
    } else if (!initialData && isOpen) {
      form.reset({
        name: '',
        category_code: '',
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        base_unit: '100g',
        default_serving_name: '',
        default_serving_weight: 0,
      });
      setImagePreview(null);
      setImageFile(null);
    }
  }, [initialData, isOpen, form]);

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    // Validate type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP.');
      return;
    }
    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Ảnh phải nhỏ hơn 5MB.');
      return;
    }
    setImageFile(file);
    // Create local preview
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  // Drag & Drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSubmit = async (values: FormValues) => {
    try {
      let imageUrl: string | undefined = undefined;

      // If there's a new file to upload, upload it first
      if (imageFile) {
        setIsUploading(true);
        try {
          imageUrl = await nutritionService.uploadImage(imageFile);
        } catch (uploadError) {
          console.error('Failed to upload image:', uploadError);
          alert('Upload ảnh thất bại. Vui lòng thử lại.');
          setIsUploading(false);
          return;
        }
        setIsUploading(false);
      } else if (imagePreview && !imageFile) {
        // Keep existing image URL (editing mode, image not changed)
        imageUrl = imagePreview;
      }

      // Build payload
      const payload: Partial<FoodItem> = {
        ...values,
        image_url: imageUrl || undefined,
        default_serving_name: values.default_serving_name === '' ? undefined : values.default_serving_name,
        default_serving_weight: values.default_serving_weight === 0 ? undefined : values.default_serving_weight,
      };

      if (isEditing && initialData) {
        await nutritionService.updateFood(initialData.id, payload);
      } else {
        await nutritionService.createFood(payload);
      }

      form.reset();
      setImageFile(null);
      setImagePreview(null);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save food:', error);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto hide-scrollbar sm:rounded-l-2xl">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-500 bg-clip-text text-transparent">
            {isEditing ? 'Sửa thông tin Món ăn' : 'Thêm Món ăn mới'}
          </SheetTitle>
          <SheetDescription>
            {isEditing
              ? 'Cập nhật lại các thông số dinh dưỡng cho món ăn này.'
              : 'Thêm một món ăn hoặc thực phẩm mới vào cơ sở dữ liệu hệ thống.'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4">
            {/* Image Upload Drop Zone */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Hình ảnh
              </label>
              {imagePreview ? (
                <div className="relative group w-full h-40 rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-50">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={removeImage}
                      className="bg-red-500 text-white rounded-full p-2 shadow-lg hover:bg-red-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  {isUploading && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-[#54B7F0]" />
                    </div>
                  )}
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`w-full h-36 rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                    isDragOver
                      ? 'border-[#54B7F0] bg-[#54B7F0]/5 scale-[1.02]'
                      : 'border-slate-200 bg-slate-50/50 hover:border-[#54B7F0]/50 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    isDragOver ? 'bg-[#54B7F0]/10' : 'bg-slate-100'
                  }`}>
                    {isDragOver ? (
                      <Upload className="w-5 h-5 text-[#54B7F0]" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-600">
                      {isDragOver ? 'Thả ảnh vào đây' : 'Nhấn để chọn hoặc kéo thả ảnh'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">JPEG, PNG, WebP • Tối đa 5MB</p>
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Tên món ăn <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="VD: Ức gà luộc" {...field} className="border-slate-200 focus-visible:ring-[#54B7F0]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Danh mục <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="flex h-8 w-full items-center rounded-lg border border-slate-200 bg-transparent px-2.5 py-1.5 text-sm outline-none transition-colors focus:border-[#54B7F0] focus:ring-2 focus:ring-[#54B7F0]/30 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="" disabled>Chọn danh mục</option>
                      {categories.map((cat) => (
                        <option key={cat.code} value={cat.code}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="base_unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Đơn vị chuẩn <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="VD: 100g, 1 cái" {...field} className="border-slate-200 focus-visible:ring-[#54B7F0]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="calories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Calories (Kcal) <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} className="border-slate-200 focus-visible:ring-[#54B7F0]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-4">
              <h4 className="text-sm font-semibold text-slate-700">Thành phần Đa lượng (Macros)</h4>
              <div className="grid grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="protein"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-emerald-700 text-xs">Protein (g) <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} className="border-emerald-200 focus-visible:ring-emerald-400 bg-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="carbs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-amber-700 text-xs">Carbs (g) <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} className="border-amber-200 focus-visible:ring-amber-400 bg-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-rose-700 text-xs">Fat (g) <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} className="border-rose-200 focus-visible:ring-rose-400 bg-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="default_serving_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 text-xs">Tên khẩu phần gợi ý</FormLabel>
                    <FormControl>
                      <Input placeholder="VD: 1 bát con" {...field} className="border-slate-200 focus-visible:ring-[#54B7F0]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="default_serving_weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 text-xs">Trọng lượng gợi ý (g)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} className="border-slate-200 focus-visible:ring-[#54B7F0]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-6 pb-2 flex gap-3 w-full">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-slate-200">
                Hủy
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting || isUploading} className="flex-1 bg-[#54B7F0] hover:bg-[#3FA3DC] text-white shadow-sm">
                {(form.formState.isSubmitting || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isUploading ? 'Đang upload ảnh...' : isEditing ? 'Lưu thay đổi' : 'Thêm món ăn'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
