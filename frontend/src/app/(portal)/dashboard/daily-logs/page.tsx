"use client";

import React, { useState, useRef } from 'react';
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { Plus, Pencil, Trash2, Camera, Loader2, Image as ImageIcon, X } from "lucide-react";

import { useDailyLogs, useCreateDailyLog, useUpdateDailyLog, useDeleteDailyLog } from "@/hooks/useDailyLogs";
import { DailyLogCreate, DailyLogUpdate, DailyLog } from "@/services/api/dailyLogService";
import { uploadService } from "@/services/api/uploadService";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export default function DailyLogsPage() {
  const { data: logs, isLoading, error } = useDailyLogs();
  const createMutation = useCreateDailyLog();
  const updateMutation = useUpdateDailyLog();
  const deleteMutation = useDeleteDailyLog();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null);
  const [logToDelete, setLogToDelete] = useState<number | null>(null);

  // --- Image Upload & Lightbox State ---
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<DailyLogCreate>({
    defaultValues: {
      user_id: 1, // default mock user
      log_date: format(new Date(), 'yyyy-MM-dd'),
      weight: undefined,
      sleep_hours: undefined,
      calories_in: undefined,
      compliance_score: 0,
      compliance_notes: "",
    },
  });

  const onSubmit = (data: DailyLogCreate) => {
    // Clean and cast to Number, add body_images array
    const payload = {
      ...data,
      weight: data.weight ? Number(data.weight) : undefined,
      sleep_hours: data.sleep_hours ? Number(data.sleep_hours) : undefined,
      calories_in: data.calories_in ? Number(data.calories_in) : undefined,
      compliance_score: data.compliance_score ? Number(data.compliance_score) : 0,
      body_images: currentImages.length > 0 ? currentImages : [],
    };

    if (editingLog) {
      updateMutation.mutate({ id: editingLog.id, data: payload as DailyLogUpdate }, {
        onSuccess: () => {
          setIsDialogOpen(false);
          form.reset();
        }
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          setIsDialogOpen(false);
          form.reset();
        }
      });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const res = await uploadService.uploadImage(file);
      setCurrentImages(prev => [...prev, res.url]);
    } catch (err) {
      console.error("Failed to upload image", err);
      alert("Tải ảnh lên thất bại. Vui lòng thử lại.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (indexToRemove: number) => {
    setCurrentImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const openCreateDialog = () => {
    setEditingLog(null);
    setCurrentImages([]);
    form.reset({
      user_id: 1,
      log_date: format(new Date(), 'yyyy-MM-dd'),
      weight: undefined,
      sleep_hours: undefined,
      calories_in: undefined,
      compliance_score: 0,
      compliance_notes: "",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (log: DailyLog) => {
    setEditingLog(log);
    setCurrentImages(log.body_images || []);
    form.reset({
      user_id: log.user_id,
      log_date: String(log.log_date),
      weight: log.weight || undefined,
      sleep_hours: log.sleep_hours || undefined,
      calories_in: log.calories_in || undefined,
      compliance_score: log.compliance_score || 0,
      compliance_notes: log.compliance_notes || "",
    });
    setIsDialogOpen(true);
  };

  const confirmDelete = (id: number) => {
    setLogToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (logToDelete !== null) {
      deleteMutation.mutate(logToDelete, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setLogToDelete(null);
        }
      });
    }
  };

  // Pulse Design: Render a KPI Row
  const renderKPI = (label: string, value: string | number | undefined, unit: string) => (
    <div className="flex flex-col">
      <span className="label-eyebrow">{label}</span>
      <span className="font-display font-extrabold text-xl">
        {value !== undefined && value !== null ? value : '-'}
        <span className="text-sm text-muted-foreground ml-1">{unit}</span>
      </span>
    </div>
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="display-md mb-2 text-brand-gradient inline-block">Nhật ký Hằng ngày</h2>
          <p className="body-sm">
            Quản lý chỉ số cơ thể, giấc ngủ, và hình ảnh check-in.
          </p>
        </div>
        <Button onClick={openCreateDialog} className="shadow-button-blue" size="sm">
          <Plus className="mr-2 h-4 w-4" /> Thêm Log mới
        </Button>
      </div>

      {/* Main Content: Mobile-First Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
            <p className="font-display font-bold">Đang tải nhật ký...</p>
          </div>
        ) : error ? (
          <div className="col-span-full py-12 text-center text-destructive font-display font-bold">
            Đã xảy ra lỗi khi tải dữ liệu!
          </div>
        ) : !logs?.data || logs.data.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground font-display font-bold">
            Chưa có nhật ký nào. Nhấn "Thêm Log mới" để bắt đầu!
          </div>
        ) : (
          logs.data.map((log) => (
            <Card key={log.id} className="glass-card glow-ocean flex flex-col p-5 overflow-hidden relative">
              {/* Top Header inside Card */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col">
                  <span className="label-eyebrow text-primary">Ngày</span>
                  <span className="font-display font-extrabold text-2xl tracking-tight leading-none mt-1">
                    {format(new Date(String(log.log_date)), 'dd/MM')}
                  </span>
                </div>
                {log.compliance_score !== null && (
                  <div className={`pill ${log.compliance_score >= 80 ? 'pill-green' : log.compliance_score >= 50 ? 'pill-orange' : 'pill-red'}`}>
                    {log.compliance_score}% Tuân thủ
                  </div>
                )}
              </div>

              {/* Body Images Thumbnail */}
              {log.body_images && log.body_images.length > 0 && (
                <div className="mb-4">
                  <span className="label-eyebrow mb-2 block">Body Check-in</span>
                  <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                    {log.body_images.map((imgUrl, idx) => (
                      <div 
                        key={idx} 
                        className="h-16 w-16 shrink-0 rounded-lg overflow-hidden border cursor-pointer hover:border-primary transition-all shadow-sm"
                        onClick={() => setLightboxImage(imgUrl)}
                      >
                        <img src={imgUrl} alt={`Body ${idx}`} className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-y-4 gap-x-2 flex-grow">
                {renderKPI("Cân nặng", log.weight, "kg")}
                {renderKPI("Giấc ngủ", log.sleep_hours, "h")}
                {renderKPI("Calories", log.calories_in, "kcal")}
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-2 mt-5 pt-3 border-t">
                <Button variant="ghost" size="icon" onClick={() => openEditDialog(log)} className="h-8 w-8">
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => confirmDelete(log.id)} className="h-8 w-8 hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* --- FORMS --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md sm:max-w-lg glass-card rounded-2xl border-primary/20">
          <DialogHeader>
            <DialogTitle className="display-md">{editingLog ? 'Cập nhật Nhật ký' : 'Thêm Nhật ký'}</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="log_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="label-eyebrow">Ngày ghi nhận (YYYY-MM-DD)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="label-eyebrow">Cân nặng (kg)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} value={field.value || ''} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sleep_hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="label-eyebrow">Giấc ngủ (hours)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.5" {...field} value={field.value || ''} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="calories_in"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="label-eyebrow">Nạp Calories (kcal)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} value={field.value || ''} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="compliance_score"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="label-eyebrow">Điểm Tuân thủ (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} value={field.value || ''} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* --- IMAGE UPLOAD FIELD --- */}
              <div className="border rounded-xl p-4 bg-input/50 space-y-3">
                <div className="flex items-center justify-between">
                  <FormLabel className="label-eyebrow">Ảnh Body Check-in</FormLabel>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="xs" 
                    className="h-7 text-xs"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Camera className="h-3 w-3 mr-1" />}
                    Tải ảnh lên
                  </Button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/jpeg, image/png, image/webp"
                    onChange={handleImageUpload}
                  />
                </div>
                
                {/* Uploaded Images Preview */}
                {currentImages.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {currentImages.map((img, idx) => (
                      <div key={idx} className="relative h-16 w-16 rounded-md overflow-hidden border shadow-sm group">
                        <img src={img} className="object-cover h-full w-full" alt="preview" />
                        <button 
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 text-muted-foreground border-2 border-dashed rounded-lg">
                    <ImageIcon className="h-6 w-6 mb-1 opacity-50" />
                    <span className="text-[10px] uppercase tracking-wider font-bold">Chưa có ảnh</span>
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="compliance_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="label-eyebrow">Ghi chú thêm</FormLabel>
                    <FormControl>
                      <Input placeholder="Hôm nay thấy khoẻ / đói..." {...field} value={field.value || ''} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || uploadingImage}>
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingLog ? 'Lưu Thay đổi' : 'Thêm Nhật ký'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* --- DELETE CONFIRMATION --- */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display font-extrabold text-2xl">Xoá Nhật ký này?</AlertDialogTitle>
            <AlertDialogDescription className="font-semibold text-muted-foreground">
              Hành động này không thể hoàn tác. Dữ liệu này sẽ bị xoá vĩnh viễn khỏi hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">Huỷ</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl shadow-button-orange">
              Xác nhận Xoá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* --- LIGHTBOX (Full Image Viewer) --- */}
      <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
        <DialogContent className="max-w-3xl bg-transparent border-0 shadow-none p-0 flex justify-center">
          {lightboxImage && (
            <img src={lightboxImage} className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" alt="Full size body check" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
