import { useState, useEffect, useCallback } from 'react';
import { Phase, PhaseCreate, PhaseUpdate, Session } from '@/types/session';
import { WorkoutProgramListItem } from '@/types/workout';
import { sessionService } from '@/services/api/sessionService';
import { workoutService } from '@/services/api/workoutService';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Save, X, CalendarIcon, Loader2, Info } from 'lucide-react';
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { NutritionAssistantDialog } from "./NutritionAssistantDialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  session: Session;
  initialData: Phase | null;
  onSuccess: () => void;
}

export default function PhaseFormSheet({ isOpen, onClose, session, initialData, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [programs, setPrograms] = useState<WorkoutProgramListItem[]>([]);
  const [isNutritionAssistantOpen, setIsNutritionAssistantOpen] = useState(false);
  
  const [formData, setFormData] = useState<PhaseCreate>({
    name: '',
    description: '',
    order: 1,
    start_date: '',
    end_date: '',
    target_calories: null,
    target_protein: null,
    target_carbs: null,
    target_fat: null,
    workout_program_id: null,
  });

  const [date, setDate] = useState<{from: Date, to: Date} | undefined>();

  const fetchPrograms = useCallback(async () => {
    try {
      const res = await workoutService.listPrograms(1, 100);
      setPrograms(res.data);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    if (isOpen) fetchPrograms();
  }, [isOpen, fetchPrograms]);

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        name: initialData.name,
        description: initialData.description || '',
        order: initialData.order,
        start_date: initialData.start_date,
        end_date: initialData.end_date,
        target_calories: initialData.target_calories,
        target_protein: initialData.target_protein,
        target_carbs: initialData.target_carbs,
        target_fat: initialData.target_fat,
        workout_program_id: initialData.workout_program_id,
      });
      setDate({
        from: new Date(initialData.start_date),
        to: new Date(initialData.end_date)
      });
    } else if (isOpen) {
      setFormData({
        name: '',
        description: '',
        order: session.phases.length + 1,
        start_date: session.start_date,
        end_date: session.end_date,
        target_calories: null,
        target_protein: null,
        target_carbs: null,
        target_fat: null,
        workout_program_id: null,
      });
      setDate(undefined);
    }
  }, [initialData, isOpen, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date?.from || !date?.to) return;
    setLoading(true);
    try {
      const payload: PhaseCreate = {
        ...formData,
        start_date: format(date.from, 'yyyy-MM-dd'),
        end_date: format(date.to, 'yyyy-MM-dd'),
        workout_program_id: formData.workout_program_id === 0 ? null : formData.workout_program_id,
      };

      if (initialData) {
        await sessionService.updatePhase(initialData.id, payload as PhaseUpdate);
      } else {
        await sessionService.createPhase(session.id, payload);
      }
      onSuccess();
      onClose();
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.detail || 'Có lỗi xảy ra!');
    } finally {
      setLoading(false);
    }
  };

  const getGapWarning = () => {
    if (!date?.from || !date?.to) return null;
    const sessionDays = differenceInDays(new Date(session.end_date), new Date(session.start_date)) + 1;
    const phaseDays = differenceInDays(date.to, date.from) + 1;
    
    if (phaseDays < sessionDays) {
       return (
         <div className="flex items-start gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg text-sm border border-amber-200 mt-3">
            <Info className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
               Phase này ({phaseDays} ngày) ngắn hơn Mùa giải ({sessionDays} ngày). Bạn cần tạo thêm các Phase khác để lấp đầy khoảng trống lịch của Mùa giải.
            </div>
         </div>
       );
    }
    return null;
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-xl w-full bg-slate-50 border-l border-slate-200 overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl font-bold text-slate-800">
            {initialData ? 'Chỉnh sửa Giai đoạn (Phase)' : 'Thêm Phase Mới'}
          </SheetTitle>
          <SheetDescription className="text-slate-500">
            Thiết lập mục tiêu dinh dưỡng và giáo án cho giai đoạn này.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Thông tin cơ bản */}
          <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-semibold text-slate-800">1. Thông tin cơ bản</h3>
            
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Tên Phase</Label>
              <Input 
                required
                value={formData.name}
                onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                placeholder="VD: Tuần 1-4 Thích Nghi"
                className="bg-slate-50 border-slate-200 focus-visible:ring-[#54B7F0]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Mô tả chi tiết</Label>
              <Textarea 
                value={formData.description || ''}
                onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                placeholder="Ghi chú về Phase này..."
                className="bg-slate-50 border-slate-200 min-h-[80px]"
              />
            </div>

            <div className="space-y-2 flex flex-col">
              <Label className="text-slate-700 font-medium">Thời gian diễn ra</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "justify-start text-left font-normal bg-slate-50 border-slate-200",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "dd/MM/yyyy")} -{" "}
                          {format(date.to, "dd/MM/yyyy")}
                        </>
                      ) : (
                        format(date.from, "dd/MM/yyyy")
                      )
                    ) : (
                      <span>Chọn ngày (nằm trong {format(new Date(session.start_date), 'dd/MM/yyyy')} - {format(new Date(session.end_date), 'dd/MM/yyyy')})</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from || new Date(session.start_date)}
                    selected={{ from: date?.from, to: date?.to }}
                    onSelect={(val) => setDate({ from: val?.from as Date, to: val?.to as Date })}
                    numberOfMonths={2}
                    fromDate={new Date(session.start_date)}
                    toDate={new Date(session.end_date)}
                  />
                </PopoverContent>
              </Popover>

              {getGapWarning()}
            </div>
          </div>

          {/* Dinh dưỡng */}
          <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">2. Mục tiêu Dinh dưỡng (Mỗi ngày)</h3>
              <Button 
                type="button"
                variant="outline" 
                size="sm" 
                onClick={() => setIsNutritionAssistantOpen(true)}
                className="text-[#54B7F0] border-[#54B7F0] hover:bg-[#54B7F0]/5 font-semibold"
              >
                <Sparkles className="w-4 h-4 mr-2" /> Trợ lý Dinh dưỡng
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-700 text-sm">Calories (kcal)</Label>
                <Input 
                  type="number"
                  value={formData.target_calories || ''}
                  onChange={e => setFormData(f => ({ ...f, target_calories: parseFloat(e.target.value) || null }))}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 text-sm">Protein (g)</Label>
                <Input 
                  type="number"
                  value={formData.target_protein || ''}
                  onChange={e => setFormData(f => ({ ...f, target_protein: parseFloat(e.target.value) || null }))}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 text-sm">Carbs (g)</Label>
                <Input 
                  type="number"
                  value={formData.target_carbs || ''}
                  onChange={e => setFormData(f => ({ ...f, target_carbs: parseFloat(e.target.value) || null }))}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 text-sm">Fat (g)</Label>
                <Input 
                  type="number"
                  value={formData.target_fat || ''}
                  onChange={e => setFormData(f => ({ ...f, target_fat: parseFloat(e.target.value) || null }))}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Tập luyện */}
          <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-semibold text-slate-800">3. Giáo án Tập luyện</h3>
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Chọn Giáo án gốc</Label>
              <Select 
                value={formData.workout_program_id?.toString() || '0'} 
                onValueChange={(val: any) => setFormData(f => ({ ...f, workout_program_id: parseInt(val) }))}
              >
                <SelectTrigger className="bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Không áp dụng giáo án" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">--- Không áp dụng ---</SelectItem>
                  {programs.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1">
                Dữ liệu giáo án sẽ được chụp và lưu cứng vào Phase tại thời điểm này. Các sửa đổi ở giáo án gốc sau này sẽ không ảnh hưởng đến lịch tập của Phase.
              </p>
            </div>
          </div>

          <SheetFooter className="mt-8 pb-8">
            <Button 
              type="submit" 
              disabled={loading || !date?.from || !date?.to || !formData.name}
              className="bg-[#54B7F0] hover:bg-[#3FA3DC] text-white w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>

      <NutritionAssistantDialog
        isOpen={isNutritionAssistantOpen}
        onClose={() => setIsNutritionAssistantOpen(false)}
        sessionGoal={session.goal_type || 'maintenance'}
        phaseDesc={formData.description || ''}
        onApply={(macros) => {
          setFormData(f => ({ 
            ...f, 
            target_calories: macros.target_calories,
            target_protein: macros.target_protein,
            target_carbs: macros.target_carbs,
            target_fat: macros.target_fat
          }));
        }}
      />
    </Sheet>
  );
}
