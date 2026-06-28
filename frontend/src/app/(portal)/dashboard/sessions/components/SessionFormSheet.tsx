import { useState, useEffect } from 'react';
import { SessionListItem, SessionCreate, SessionUpdate } from '@/types/session';
import { sessionService } from '@/services/api/sessionService';
import { workoutService } from '@/services/api/workoutService';
import { clientService } from '@/services/api/clientService';
import { WorkoutProgramListItem } from '@/types/workout';
import { ClientListItem } from '@/types/client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format, addWeeks, addMonths } from "date-fns";
import { cn } from "@/lib/utils";
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
}
from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { WorkoutCombobox } from '@/components/shared/combobox/workout-combobox';
import { ClientCombobox } from '@/components/shared/combobox/client-combobox';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData: SessionListItem | null;
  onSuccess: (id?: number) => void;
}

export default function SessionFormSheet({ isOpen, onClose, initialData, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SessionCreate>({
    name: '',
    goal_type: 'Maintaining',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(new Date().setMonth(new Date().getMonth() + 3)), 'yyyy-MM-dd'),
    is_active: false,
  });

  const [date, setDate] = useState<{from: Date, to: Date} | undefined>({
    from: new Date(),
    to: new Date(new Date().setMonth(new Date().getMonth() + 3))
  });

  const [templates, setTemplates] = useState<WorkoutProgramListItem[]>([]);
  const [clients, setClients] = useState<ClientListItem[]>([]);
  
  useEffect(() => {
    // Fetch workout templates
    workoutService.listPrograms(1, 100, true).then(res => {
      setTemplates(res.data);
    }).catch(console.error);

    // Fetch clients
    clientService.listClients(1, 100, 'Active').then(res => {
      setClients(res.data);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        name: initialData.name,
        goal_type: initialData.goal_type,
        start_date: initialData.start_date,
        end_date: initialData.end_date,
        is_active: initialData.is_active,
        client_id: initialData.client_id || null,
      });
      setDate({
        from: new Date(initialData.start_date),
        to: new Date(initialData.end_date)
      });
    } else if (isOpen) {
      setFormData({
        name: '',
        goal_type: 'Maintaining',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(new Date(new Date().setMonth(new Date().getMonth() + 3)), 'yyyy-MM-dd'),
        is_active: false,
        client_id: null,
      });
      setDate({
        from: new Date(),
        to: new Date(new Date().setMonth(new Date().getMonth() + 3))
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        start_date: date?.from ? format(date.from, 'yyyy-MM-dd') : formData.start_date,
        end_date: date?.to ? format(date.to, 'yyyy-MM-dd') : formData.end_date,
      };

      if (initialData) {
        await sessionService.updateSession(initialData.id, payload as SessionUpdate);
        onSuccess(initialData.id);
      } else {
        const res = await sessionService.createSession(payload);
        onSuccess(res.id);
      }
      onClose();
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md w-full bg-slate-50 border-l border-slate-200">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl font-bold text-slate-800">
            {initialData ? 'Chỉnh sửa Mùa giải' : 'Tạo Mùa giải mới'}
          </SheetTitle>
          <SheetDescription className="text-slate-500">
            {initialData 
              ? 'Chỉnh sửa thông tin mùa giải của bạn.' 
              : 'Mùa giải là một chu kỳ tập luyện lớn (ví dụ: Siết cơ 3 tháng).'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Giao cho Học viên</Label>
              <ClientCombobox 
                clients={clients}
                value={formData.client_id || null}
                onChange={(val) => setFormData(f => ({ ...f, client_id: val }))}
              />
              <p className="text-[12px] text-slate-500">Nếu để trống, mùa giải này sẽ được tính cho chính bạn.</p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <Label className="text-slate-700 font-medium">Tên Mùa Giải</Label>
              <Input 
                required
                value={formData.name}
                onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                placeholder="VD: Mùa Siết Cơ Hè 2026"
                className="bg-slate-50 border-slate-200 focus-visible:ring-[#54B7F0]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Mục Tiêu Chính</Label>
              <Select 
                value={formData.goal_type} 
                onValueChange={(val: any) => setFormData(f => ({ ...f, goal_type: val }))}
              >
                <SelectTrigger className="bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Chọn mục tiêu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cutting">🔥 Cutting (Siết mỡ)</SelectItem>
                  <SelectItem value="Bulking">💪 Bulking (Xả cơ)</SelectItem>
                  <SelectItem value="Recomp">⚖️ Recomp (Tăng cơ giảm mỡ)</SelectItem>
                  <SelectItem value="Maintaining">🛡️ Maintaining (Giữ cân)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 flex flex-col pt-2 border-t border-slate-100">
              <Label className="text-slate-700 font-medium">Thời Gian Diễn Ra</Label>
              
              <div className="flex items-center gap-2">
                 <Select 
                   onValueChange={(val: string) => {
                     const from = new Date();
                     let to = new Date();
                     if (val === '1w') to = addWeeks(from, 1);
                     if (val === '4w') to = addWeeks(from, 4);
                     if (val === '8w') to = addWeeks(from, 8);
                     if (val === '12w') to = addWeeks(from, 12);
                     if (val === '6m') to = addMonths(from, 6);
                     setDate({ from, to });
                   }}
                 >
                   <SelectTrigger className="bg-slate-50 border-slate-200">
                     <SelectValue placeholder="Chọn nhanh thời gian..." />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="1w">1 Tuần</SelectItem>
                     <SelectItem value="4w">4 Tuần (1 Tháng)</SelectItem>
                     <SelectItem value="8w">8 Tuần (2 Tháng)</SelectItem>
                     <SelectItem value="12w">12 Tuần (3 Tháng)</SelectItem>
                     <SelectItem value="6m">6 Tháng</SelectItem>
                   </SelectContent>
                 </Select>
              </div>
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
                      <span>Chọn ngày bắt đầu và kết thúc</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={{ from: date?.from, to: date?.to }}
                    onSelect={(val) => setDate({ from: val?.from as Date, to: val?.to as Date })}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {!initialData && (
              <>
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <Label className="text-slate-700 font-medium">Chọn Giáo Án Mẫu (Tùy chọn)</Label>
                  <WorkoutCombobox 
                    programs={templates}
                    value={formData.workout_template_id || null}
                    onChange={(val) => setFormData(f => ({ ...f, workout_template_id: val }))}
                  />
                  <p className="text-[12px] text-slate-500">Giáo án này sẽ được tự động copy và gắn vào Phase 1 của mùa giải.</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                  <div className="space-y-0.5">
                    <Label className="text-slate-700 font-medium">Kích Hoạt Ngay</Label>
                    <div className="text-[12px] text-slate-500">Mùa giải hiện tại sẽ tự động bị kết thúc.</div>
                  </div>
                  <Switch 
                    checked={formData.is_active}
                    onCheckedChange={v => setFormData(f => ({ ...f, is_active: v }))}
                  />
                </div>
              </>
            )}

          </div>

          <SheetFooter className="mt-8">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="border-slate-200 text-slate-600 w-full"
            >
              Hủy
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !date?.from || !date?.to || !formData.name}
              className="bg-[#54B7F0] hover:bg-[#3FA3DC] text-white w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
