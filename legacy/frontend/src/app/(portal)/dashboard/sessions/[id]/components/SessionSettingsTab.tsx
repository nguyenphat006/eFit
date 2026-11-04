import React, { useState } from 'react';
import { format, addWeeks, addMonths, parseISO } from 'date-fns';
import { Session, SessionUpdate } from '@/types/session';
import { sessionService } from '@/services/api/sessionService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Loader2, Save, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

interface Props {
  session: Session;
  onSessionUpdated: () => void;
}

export default function SessionSettingsTab({ session, onSessionUpdated }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: session.name,
    goal_type: session.goal_type,
  });

  const [date, setDate] = useState<{ from: Date; to: Date }>({
    from: parseISO(session.start_date),
    to: parseISO(session.end_date)
  });

  const [isActivateConfirmOpen, setIsActivateConfirmOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: SessionUpdate = {
        name: formData.name,
        goal_type: formData.goal_type,
        start_date: format(date.from, 'yyyy-MM-dd'),
        end_date: format(date.to, 'yyyy-MM-dd'),
      };

      await sessionService.updateSession(session.id, payload);
      alert('Cập nhật mùa giải thành công!');
      onSessionUpdated();
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra!');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateConfirm = async () => {
    setLoading(true);
    try {
      await sessionService.updateSessionStatus(session.id, 'Active');
      setIsActivateConfirmOpen(false);
      onSessionUpdated();
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl">
      <div className="bg-card p-6 rounded-2xl border shadow-sm">
        <h3 className="font-display font-black text-xl mb-6">Cài đặt Mùa giải</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-foreground font-semibold">Tên Mùa Giải</Label>
            <Input
              required
              value={formData.name}
              onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
              className="bg-input/50"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground font-semibold">Mục Tiêu</Label>
            <Select
              value={formData.goal_type}
              onValueChange={val => setFormData(f => ({ ...f, goal_type: val as any }))}
            >
              <SelectTrigger className="bg-input/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cutting">Siết cơ (Cutting)</SelectItem>
                <SelectItem value="Bulking">Tăng cơ (Bulking)</SelectItem>
                <SelectItem value="Recomp">Giảm mỡ tăng cơ (Recomp)</SelectItem>
                <SelectItem value="Maintaining">Duy trì (Maintaining)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground font-semibold">Thời Gian Diễn Ra</Label>
            <div className="flex items-center gap-2 mb-2">
              <Select
                onValueChange={(val: string) => {
                  const from = date.from || new Date();
                  let to = date.to;
                  if (val === '1w') to = addWeeks(from, 1);
                  if (val === '4w') to = addWeeks(from, 4);
                  if (val === '8w') to = addWeeks(from, 8);
                  if (val === '12w') to = addWeeks(from, 12);
                  if (val === '6m') to = addMonths(from, 6);
                  setDate({ from, to });
                }}
              >
                <SelectTrigger className="bg-input/50 w-[200px]">
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
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-input/50",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "dd/MM/yyyy")} - {format(date.to, "dd/MM/yyyy")}
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
                  mode="range"
                  defaultMonth={date?.from}
                  selected={{ from: date?.from, to: date?.to }}
                  onSelect={(val) => setDate({ from: val?.from as Date, to: val?.to as Date })}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button
            type="submit"
            disabled={loading || !date?.from || !date?.to || !formData.name}
            className="w-full bg-[#54B7F0] hover:bg-[#3FA3DC] text-white shadow-button-blue"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Lưu Thay Đổi
          </Button>
        </form>
      </div>

      <div className="bg-card p-6 rounded-2xl border border-destructive/20 shadow-sm">
        <h3 className="font-display font-black text-xl text-destructive mb-4 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" /> Vùng Nguy Hiểm
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Các hành động dưới đây sẽ ảnh hưởng trực tiếp đến trạng thái của mùa giải.
        </p>

        <div className="space-y-4">
          {session.status === 'Draft' && (
            <div className="flex items-center justify-between p-4 rounded-xl border bg-input/30">
              <div>
                <h4 className="font-bold text-foreground">Kích hoạt mùa giải</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Chuyển trạng thái sang Đang diễn ra.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsActivateConfirmOpen(true)}
                className="bg-white hover:bg-white/90 text-foreground font-bold shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4 mr-2 text-efit-green" /> Kích hoạt
              </Button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={isActivateConfirmOpen}
        onClose={() => setIsActivateConfirmOpen(false)}
        onConfirm={handleActivateConfirm}
        isLoading={loading}
        variant="orange"
        title="Kích hoạt mùa giải?"
        confirmText="Kích hoạt ngay"
        description={
          <>
            Sau khi kích hoạt, mùa giải này sẽ trở thành mùa giải chính thức.
            Mùa giải đang hoạt động hiện tại (nếu có) sẽ bị dừng lại.
          </>
        }
      />
    </div>
  );
}
