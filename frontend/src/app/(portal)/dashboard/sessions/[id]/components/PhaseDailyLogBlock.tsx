'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { sessionService } from '@/services/api/sessionService';
import { workoutService } from '@/services/api/workoutService';
import { uploadService } from '@/services/api/uploadService';
import { Phase, DailyLog, DailyLogInlineUpsert } from '@/types/session';
import { WorkoutProgram } from '@/types/workout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import NutritionPlanDialog from './NutritionPlanDialog';
import {
  Edit, Trash2, Dumbbell, UploadCloud, X,
  Moon, Activity, Save, Edit3, Image as ImageIcon,
  CheckCircle2, XCircle, ChevronLeft, ChevronRight, Eye, Apple, Plus
} from 'lucide-react';
import { format, parseISO, eachDayOfInterval, isToday, isFuture } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Props {
  phase: Phase;
  onEditPhase: (phase: Phase) => void;
  onDeletePhase: (id: number) => void;
}

export default function PhaseDailyLogBlock({ phase, onEditPhase, onDeletePhase }: Props) {
  const [logs, setLogs] = useState<Record<string, DailyLog>>({});
  const [loading, setLoading] = useState(true);

  // Edit State
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<DailyLogInlineUpsert | null>(null);

  // Pagination State (7 days per page)
  const itemsPerPage = 7;
  const [currentPage, setCurrentPage] = useState(0);

  const [isProgramDialogOpen, setIsProgramDialogOpen] = useState(false);
  const [workoutProgram, setWorkoutProgram] = useState<WorkoutProgram | null>(null);
  const [loadingProgram, setLoadingProgram] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Nutrition Plan Dialog State
  const [isNutritionPlanOpen, setIsNutritionPlanOpen] = useState(false);

  // Lightbox State
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const dailyLogs = await sessionService.getPhaseDailyLogs(phase.id);
      const logsMap: Record<string, DailyLog> = {};
      dailyLogs.forEach(log => {
        logsMap[log.log_date] = log;
      });
      setLogs(logsMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [phase.id]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !editForm) return;
    setIsUploading(true);
    try {
      const files = Array.from(e.target.files);
      const uploadedUrls = [];
      for (const file of files) {
        const { url } = await uploadService.uploadImage(file);
        uploadedUrls.push(url);
      }
      setEditForm({
        ...editForm,
        body_images: [...(editForm.body_images || []), ...uploadedUrls]
      });
    } catch (error) {
      console.error('Error uploading image', error);
      alert('Tải ảnh lên thất bại!');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    if (!editForm || !editForm.body_images) return;
    const newImages = [...editForm.body_images];
    newImages.splice(index, 1);
    setEditForm({ ...editForm, body_images: newImages });
  };

  const days = useMemo(() => {
    return eachDayOfInterval({
      start: parseISO(phase.start_date),
      end: parseISO(phase.end_date)
    });
  }, [phase]);

  const totalPages = Math.ceil(days.length / itemsPerPage);
  const currentDays = useMemo(() => {
    return days.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
  }, [days, currentPage]);

  const openEditor = (dateStr: string) => {
    const existing = logs[dateStr];
    setEditingDate(dateStr);
    setEditForm({
      log_date: dateStr,
      weight: existing?.weight ?? null,
      calories_in: existing?.calories_in ?? null,
      protein_in: existing?.protein_in ?? null,
      carbs_in: existing?.carbs_in ?? null,
      fat_in: existing?.fat_in ?? null,
      sleep_hours: existing?.sleep_hours ?? null,
      work_hours: existing?.work_hours ?? null,
      fatigue_level: existing?.fatigue_level ?? 3,
      is_workout_completed: existing?.is_workout_completed ?? false,
      body_images: existing?.body_images ?? null,
      chest_measure: existing?.chest_measure ?? null,
      waist_measure: existing?.waist_measure ?? null,
      hips_measure: existing?.hips_measure ?? null,
    });
  };

  const handleSaveLog = async () => {
    if (!editForm) return;
    try {
      const res = await sessionService.upsertDailyLog(phase.id, editForm);
      setLogs(prev => ({ ...prev, [res.log_date]: res }));
      setEditingDate(null);
    } catch (e) {
      console.error(e);
      alert("Lỗi khi lưu log");
    }
  };

  const handleViewProgram = async () => {
    setIsProgramDialogOpen(true);
    
    // Nếu đã snapshot thì đọc luôn không cần call API
    if (phase.workout_program_snapshot) {
      setWorkoutProgram(phase.workout_program_snapshot);
      return;
    }

    // Fallback cho dữ liệu cũ (những phase tạo trước khi có snapshot)
    if (!phase.workout_program_id) return;
    if (workoutProgram?.id === phase.workout_program_id) return; 
    
    setLoadingProgram(true);
    try {
      const data = await workoutService.getProgram(phase.workout_program_id);
      setWorkoutProgram(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProgram(false);
    }
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  return (
    <Card className="mb-8 overflow-hidden glass-card">
      <CardHeader className="bg-background/50 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-efit-blue text-white uppercase tracking-wider text-[10px] rounded-pill">
              Phase {phase.order}
            </Badge>
            <h3 className="text-xl font-display font-extrabold text-foreground">{phase.name}</h3>
          </div>
          <p className="text-sm text-muted-foreground font-semibold">
            {format(parseISO(phase.start_date), 'dd/MM/yyyy')} - {format(parseISO(phase.end_date), 'dd/MM/yyyy')}
            <span className="ml-2 font-medium">({days.length} ngày)</span>
          </p>
          {phase.description && <p className="text-sm mt-2 text-muted-foreground max-w-2xl">{phase.description}</p>}
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
           {/* Targets */}
           <div className="flex gap-4 text-sm bg-card p-2 px-4 rounded-xl border shadow-sm">
             <div className="flex flex-col">
               <span className="label-eyebrow">Target Calories</span>
               <span className="font-display font-bold text-foreground">{phase.target_calories || '-'} kcal</span>
             </div>
             <div className="w-px bg-border"></div>
             <div className="flex flex-col">
               <span className="label-eyebrow">Target Macros</span>
               <span className="font-display font-bold text-foreground">
                 {phase.target_protein || '-'}P / {phase.target_carbs || '-'}C / {phase.target_fat || '-'}F
               </span>
             </div>
           </div>

           {/* Actions */}
           <div className="flex items-center gap-2">
             <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsNutritionPlanOpen(true)}
                className="text-efit-green border-efit-green/30 bg-efit-green/10 hover:bg-efit-green/20"
             >
                <Apple className="w-4 h-4 mr-1.5" /> Lịch Ăn
             </Button>
             {(phase.workout_program_id || phase.workout_program_snapshot) && (
                <Button 
                   variant="outline" 
                   size="sm" 
                   onClick={handleViewProgram}
                   className="text-efit-orange border-efit-orange/30 bg-efit-orange/10 hover:bg-efit-orange/20"
                >
                   <Eye className="w-4 h-4 mr-1.5" /> Giáo án
                </Button>
             )}
             <Button variant="ghost" size="icon" onClick={() => onEditPhase(phase)} className="text-muted-foreground hover:text-efit-blue">
               <Edit className="w-4 h-4" />
             </Button>
             <Button variant="ghost" size="icon" onClick={() => onDeletePhase(phase.id)} className="text-muted-foreground hover:text-destructive">
               <Trash2 className="w-4 h-4" />
             </Button>
           </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 bg-background/30">
        <div className="flex flex-col">
           {/* Custom Pagination Header */}
           <div className="flex items-center justify-between p-3 px-5 bg-card/50 border-b">
             <span className="text-sm font-bold text-foreground">
                Hiển thị Tuần {currentPage + 1} / {totalPages}
             </span>
             <div className="flex items-center gap-2">
                <Button 
                   variant="outline" 
                   size="sm" 
                   onClick={handlePrevPage} 
                   disabled={currentPage === 0}
                   className="h-8"
                >
                   <ChevronLeft className="w-4 h-4 mr-1" /> Tuần trước
                </Button>
                <Button 
                   variant="outline" 
                   size="sm" 
                   onClick={handleNextPage} 
                   disabled={currentPage === totalPages - 1}
                   className="h-8"
                >
                   Tuần sau <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
             </div>
           </div>

           {/* Mobile-First Grid of Day Cards */}
           <div className="p-4 md:p-6">
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
               {currentDays.map(dateObj => {
                 const dateStr = format(dateObj, 'yyyy-MM-dd');
                 const future = isFuture(dateObj) && !isToday(dateObj);
                 const today = isToday(dateObj);
                 const log = logs[dateStr];

                 return (
                   <div 
                    key={dateStr} 
                    className={cn(
                      "flex flex-col bg-card rounded-2xl border p-4 transition-all duration-300",
                      today ? "border-efit-blue shadow-card-hover ring-1 ring-efit-blue/20" : "shadow-sm hover:shadow-md",
                      future ? "opacity-60 grayscale-[0.5]" : ""
                    )}
                   >
                     {/* Date Header */}
                     <div className="flex justify-between items-start mb-3 pb-3 border-b">
                       <div className="flex flex-col">
                         <span className="label-eyebrow text-muted-foreground">
                           {format(dateObj, 'EEE', { locale: vi })} {today && '(Nay)'}
                         </span>
                         <span className={cn("font-display font-extrabold text-2xl leading-none mt-1", today ? "text-efit-blue" : "text-foreground")}>
                           {format(dateObj, 'dd/MM')}
                         </span>
                       </div>
                       {log?.compliance_score !== null && log?.compliance_score !== undefined && (
                         <div className={cn("pill", log.compliance_score >= 80 ? 'pill-green' : log.compliance_score >= 50 ? 'pill-orange' : 'pill-red')}>
                           {log.compliance_score}%
                         </div>
                       )}
                     </div>

                     {/* Content */}
                     <div className="flex-1 flex flex-col gap-3">
                       {future ? (
                         <div className="flex-1 flex items-center justify-center text-xs font-semibold text-muted-foreground italic">
                           Chưa đến ngày
                         </div>
                       ) : (
                         <>
                           {/* Body Image Thumbnail */}
                           {log?.body_images && log.body_images.length > 0 ? (
                              <div 
                                className="w-full aspect-video rounded-lg overflow-hidden border cursor-pointer hover:border-primary transition-all relative group"
                                onClick={() => setLightboxImage(log.body_images![0])}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={log.body_images[0]} alt="Check-in" className="w-full h-full object-cover" />
                                {log.body_images.length > 1 && (
                                  <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                    +{log.body_images.length - 1}
                                  </div>
                                )}
                              </div>
                           ) : (
                              <div className="w-full h-12 rounded-lg bg-input/50 border border-dashed flex items-center justify-center text-[10px] uppercase font-bold text-muted-foreground">
                                Không có ảnh
                              </div>
                           )}

                           {/* Metrics Grid */}
                           <div className="grid grid-cols-2 gap-2 mt-1">
                             <div className="flex flex-col bg-input/30 p-2 rounded-lg">
                               <span className="text-[10px] text-muted-foreground font-bold uppercase">Cân nặng</span>
                               <span className="font-display font-bold text-sm">{log?.weight ? `${log.weight} kg` : '-'}</span>
                             </div>
                             <div className="flex flex-col bg-input/30 p-2 rounded-lg">
                               <span className="text-[10px] text-muted-foreground font-bold uppercase">Calories</span>
                               <span className={cn("font-display font-bold text-sm", log?.calories_in && phase.target_calories && log.calories_in > phase.target_calories * 1.1 ? "text-destructive" : "")}>
                                 {log?.calories_in ? `${log.calories_in} kcal` : '-'}
                               </span>
                             </div>
                             <div className="flex flex-col bg-input/30 p-2 rounded-lg">
                               <span className="text-[10px] text-muted-foreground font-bold uppercase">Tập luyện</span>
                               <span className="font-display font-bold text-sm">{log?.is_workout_completed ? <CheckCircle2 className="w-4 h-4 text-efit-green"/> : <XCircle className="w-4 h-4 text-muted-foreground/50"/>}</span>
                             </div>
                             <div className="flex flex-col bg-input/30 p-2 rounded-lg">
                               <span className="text-[10px] text-muted-foreground font-bold uppercase">Giấc ngủ</span>
                               <span className="font-display font-bold text-sm">{log?.sleep_hours ? `${log.sleep_hours} h` : '-'}</span>
                             </div>
                           </div>
                         </>
                       )}
                     </div>

                     {/* Footer Action */}
                     {!future && (
                       <Button 
                         variant={log ? "outline" : "default"} 
                         size="sm" 
                         className={cn("w-full mt-4 h-9", !log && "shadow-button-blue")}
                         onClick={() => openEditor(dateStr)}
                       >
                         {log ? <Edit3 className="w-3 h-3 mr-1.5" /> : <Plus className="w-3 h-3 mr-1.5" />}
                         {log ? 'Sửa' : 'Nhập'}
                       </Button>
                     )}
                   </div>
                 );
               })}
             </div>
           </div>
        </div>
      </CardContent>

      {/* Inline Edit Dialog */}
      <Dialog open={!!editingDate} onOpenChange={(open) => !open && setEditingDate(null)}>
        <DialogContent className="max-w-md sm:max-w-lg glass-card border-primary/20">
          <DialogHeader>
            <DialogTitle className="display-sm text-center">
               Nhật ký ngày {editingDate && format(parseISO(editingDate), 'dd/MM/yyyy')}
            </DialogTitle>
          </DialogHeader>
          
          {editForm && (
             <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto px-1 custom-scrollbar">
               {/* Ảnh Body Check-in */}
               <div className="space-y-3 bg-card p-4 rounded-xl border shadow-sm">
                  <div className="flex items-center justify-between">
                     <Label className="label-eyebrow flex items-center text-foreground">
                        <ImageIcon className="w-4 h-4 mr-1.5 text-primary"/> Ảnh Body Check-in
                     </Label>
                     <div>
                       <Input 
                          type="file" 
                          accept="image/*" 
                          multiple
                          onChange={handleImageUpload}
                          className="hidden" 
                          id="image-upload" 
                       />
                       <Label htmlFor="image-upload" className={cn("cursor-pointer flex items-center justify-center px-3 py-1.5 text-xs font-bold rounded-lg border bg-input hover:bg-input/80 transition-colors", isUploading && "opacity-50 pointer-events-none")}>
                          {isUploading ? <UploadCloud className="w-3 h-3 mr-1 animate-pulse" /> : <Camera className="w-3 h-3 mr-1" />}
                          {isUploading ? 'Đang tải...' : 'Tải ảnh lên'}
                       </Label>
                     </div>
                  </div>
                  {editForm.body_images && editForm.body_images.length > 0 && (
                     <div className="flex flex-wrap gap-2 mt-3">
                        {editForm.body_images.map((imgUrl, idx) => (
                           <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border shadow-sm group">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={imgUrl} alt="checkin" className="object-cover w-full h-full" />
                              <button onClick={() => handleRemoveImage(idx)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <X className="w-3 h-3" />
                              </button>
                           </div>
                        ))}
                     </div>
                  )}
               </div>

               {/* Cân nặng & Calories */}
               <div className="grid grid-cols-2 gap-4 bg-card p-4 rounded-xl border shadow-sm">
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                     <Label className="label-eyebrow">Cân nặng (kg)</Label>
                     <Input 
                        type="number" 
                        value={editForm.weight || ''} 
                        onChange={e => setEditForm({...editForm, weight: parseFloat(e.target.value) || null})}
                     />
                  </div>
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                     <Label className="label-eyebrow text-efit-orange">Calories In (kcal)</Label>
                     <Input 
                        type="number" 
                        value={editForm.calories_in || ''} 
                        onChange={e => setEditForm({...editForm, calories_in: parseFloat(e.target.value) || null})}
                     />
                  </div>
                  
                  <div className="col-span-2 grid grid-cols-3 gap-2 mt-2">
                     <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase text-muted-foreground font-bold">Protein (g)</Label>
                        <Input 
                           type="number" 
                           value={editForm.protein_in || ''} 
                           onChange={e => setEditForm({...editForm, protein_in: parseFloat(e.target.value) || null})}
                           className="h-8 text-sm"
                        />
                     </div>
                     <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase text-muted-foreground font-bold">Carbs (g)</Label>
                        <Input 
                           type="number" 
                           value={editForm.carbs_in || ''} 
                           onChange={e => setEditForm({...editForm, carbs_in: parseFloat(e.target.value) || null})}
                           className="h-8 text-sm"
                        />
                     </div>
                     <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase text-muted-foreground font-bold">Fat (g)</Label>
                        <Input 
                           type="number" 
                           value={editForm.fat_in || ''} 
                           onChange={e => setEditForm({...editForm, fat_in: parseFloat(e.target.value) || null})}
                           className="h-8 text-sm"
                        />
                     </div>
                  </div>
               </div>

               {/* Tập luyện & Phục hồi */}
               <div className="space-y-4 bg-card p-4 rounded-xl border shadow-sm">
                  <div className="flex items-center justify-between bg-input/50 p-2 px-3 rounded-lg">
                     <Label className="flex items-center text-sm font-bold">
                       <Dumbbell className="w-4 h-4 mr-2 text-primary"/> Hoàn thành giáo án?
                     </Label>
                     <Switch 
                        checked={editForm.is_workout_completed || false}
                        onCheckedChange={v => setEditForm({...editForm, is_workout_completed: v})}
                     />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <Label className="label-eyebrow flex items-center"><Moon className="w-3 h-3 mr-1"/> Giờ ngủ</Label>
                        <Input 
                           type="number" 
                           value={editForm.sleep_hours || ''} 
                           onChange={e => setEditForm({...editForm, sleep_hours: parseFloat(e.target.value) || null})}
                        />
                     </div>
                     <div className="space-y-1.5">
                        <Label className="label-eyebrow flex items-center"><Activity className="w-3 h-3 mr-1 text-destructive"/> Mệt mỏi (1-5)</Label>
                        <Input 
                           type="number" min={1} max={5}
                           value={editForm.fatigue_level || ''} 
                           onChange={e => setEditForm({...editForm, fatigue_level: parseInt(e.target.value) || null})}
                        />
                     </div>
                  </div>
               </div>

               {/* Số đo cơ thể */}
               <div className="space-y-3 bg-card p-4 rounded-xl border shadow-sm">
                  <Label className="label-eyebrow flex items-center">
                    <Activity className="w-4 h-4 mr-1.5"/> Số đo cơ thể (cm)
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                     <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground font-bold">Ngực</Label>
                        <Input 
                           type="number" 
                           value={editForm.chest_measure || ''} 
                           onChange={e => setEditForm({...editForm, chest_measure: parseFloat(e.target.value) || null})}
                           className="h-9 text-sm"
                        />
                     </div>
                     <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground font-bold">Eo</Label>
                        <Input 
                           type="number" 
                           value={editForm.waist_measure || ''} 
                           onChange={e => setEditForm({...editForm, waist_measure: parseFloat(e.target.value) || null})}
                           className="h-9 text-sm"
                        />
                     </div>
                     <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground font-bold">Mông</Label>
                        <Input 
                           type="number" 
                           value={editForm.hips_measure || ''} 
                           onChange={e => setEditForm({...editForm, hips_measure: parseFloat(e.target.value) || null})}
                           className="h-9 text-sm"
                        />
                     </div>
                  </div>
               </div>

             </div>
          )}

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setEditingDate(null)} className="rounded-xl">Hủy</Button>
            <Button onClick={handleSaveLog} className="shadow-button-blue rounded-xl">
               <Save className="w-4 h-4 mr-2" /> Lưu Nhật Ký
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Program Details Dialog */}
      <Dialog open={isProgramDialogOpen} onOpenChange={setIsProgramDialogOpen}>
         <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto glass-card">
            <DialogHeader>
               <DialogTitle className="flex items-center gap-2 text-2xl font-display font-extrabold">
                  <Dumbbell className="w-6 h-6 text-efit-orange" />
                  Giáo án: {workoutProgram?.name || 'Đang tải...'}
               </DialogTitle>
            </DialogHeader>

            {loadingProgram ? (
               <div className="p-8 text-center text-muted-foreground">Đang tải dữ liệu giáo án...</div>
            ) : workoutProgram ? (
               <div className="mt-4">
                  <div className="space-y-6">
                     {(workoutProgram.days || []).sort((a,b) => (a.order || 0) - (b.order || 0)).map((day, idx) => (
                        <div key={day.id} className="flex flex-col bg-card p-4 rounded-2xl border shadow-card-light">
                           <div className="flex items-center gap-3 mb-4 pb-3 border-b">
                              <h4 className="text-xl font-display font-bold text-foreground">
                                 {day.day_label}
                              </h4>
                              {day.day_of_week !== null && day.day_of_week !== undefined && (
                                 <Badge className="bg-input text-foreground font-bold rounded-pill shadow-none hover:bg-input">
                                    Thứ {day.day_of_week === 0 ? 'Chủ Nhật' : day.day_of_week + 1}
                                 </Badge>
                              )}
                           </div>
                           
                           {day.exercises && day.exercises.length > 0 ? (
                              <div className="rounded-xl border overflow-hidden bg-background">
                                 <Table>
                                    <TableHeader className="bg-input/50">
                                       <TableRow>
                                          <TableHead className="w-[50px] text-center text-xs font-bold uppercase tracking-wider">#</TableHead>
                                          <TableHead className="text-xs font-bold uppercase tracking-wider">Bài tập</TableHead>
                                          <TableHead className="text-center w-[80px] text-xs font-bold uppercase tracking-wider">Sets</TableHead>
                                          <TableHead className="text-center w-[100px] text-xs font-bold uppercase tracking-wider">Reps</TableHead>
                                          <TableHead className="text-center w-[80px] text-xs font-bold uppercase tracking-wider">RPE</TableHead>
                                          <TableHead className="text-center w-[120px] text-xs font-bold uppercase tracking-wider">Tempo</TableHead>
                                          <TableHead className="text-center w-[100px] text-xs font-bold uppercase tracking-wider">Nghỉ</TableHead>
                                       </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                       {day.exercises.sort((a,b) => (a.order || 0) - (b.order || 0)).map((ex, i) => (
                                          <TableRow key={ex.id}>
                                             <TableCell className="text-center font-bold text-muted-foreground">{i + 1}</TableCell>
                                             <TableCell className="font-semibold">{ex.exercise_name}</TableCell>
                                             <TableCell className="text-center font-display font-extrabold">{ex.sets}</TableCell>
                                             <TableCell className="text-center font-semibold">{ex.reps}</TableCell>
                                             <TableCell className="text-center text-muted-foreground font-medium">{ex.target_rpe || '-'}</TableCell>
                                             <TableCell className="text-center text-muted-foreground">{ex.tempo || '-'}</TableCell>
                                             <TableCell className="text-center text-muted-foreground">{ex.rest_seconds ? `${ex.rest_seconds}s` : '-'}</TableCell>
                                          </TableRow>
                                       ))}
                                    </TableBody>
                                 </Table>
                              </div>
                           ) : (
                              <div className="text-muted-foreground text-sm italic py-4 flex justify-center bg-input/30 rounded-xl border border-dashed">
                                 Nghỉ ngơi (Không có bài tập)
                              </div>
                           )}
                        </div>
                     ))}
                  </div>
                  {(!workoutProgram.days || workoutProgram.days.length === 0) && (
                     <div className="text-center p-8 text-muted-foreground bg-input/30 rounded-2xl border border-dashed">
                        Giáo án này chưa có lịch tập chi tiết.
                     </div>
                  )}
               </div>
            ) : null}
         </DialogContent>
      </Dialog>

      {/* Nutrition Plan Dialog */}
      <NutritionPlanDialog
        isOpen={isNutritionPlanOpen}
        onClose={() => setIsNutritionPlanOpen(false)}
        phase={phase}
      />

      {/* --- LIGHTBOX (Full Image Viewer) --- */}
      <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
        <DialogContent className="max-w-3xl bg-transparent border-0 shadow-none p-0 flex justify-center">
          {lightboxImage && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={lightboxImage} className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" alt="Full size body check" />
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
