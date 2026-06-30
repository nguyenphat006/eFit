import { useState, useEffect, useMemo } from 'react';
import { SessionListItem, SessionAssignPayload } from '@/types/session';
import { sessionService } from '@/services/api/sessionService';
import { ClientListItem } from '@/types/client';
import { clientService } from '@/services/api/clientService';

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
import { format } from "date-fns";
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
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ClientCombobox } from '@/components/shared/combobox/client-combobox';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  template?: SessionListItem | null; // Nếu mở từ Template tab, ta truyền template_id
  client?: ClientListItem | null;    // Nếu mở từ Client tab, ta truyền client_id
  onSuccess: () => void;
}

export default function AssignTemplateSheet({ isOpen, onClose, template, client, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  
  const [templates, setTemplates] = useState<SessionListItem[]>([]);
  const [clients, setClients] = useState<ClientListItem[]>([]);
  
  const [formData, setFormData] = useState<Partial<SessionAssignPayload>>({
    start_date: format(new Date(), 'yyyy-MM-dd'),
    is_active: true,
  });
  
  const [date, setDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    if (isOpen) {
      sessionService.listTemplates().then(res => setTemplates(res.data));
      clientService.listClients(1, 100).then(res => setClients(res.data));
      
      setFormData({
        template_id: template ? template.id : undefined,
        client_id: client ? client.id : undefined,
        start_date: format(new Date(), 'yyyy-MM-dd'),
        is_active: true,
        name: template ? template.name : undefined,
      });
      setDate(new Date());
    }
  }, [isOpen, template, client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.template_id || !formData.client_id || !date) return;
    
    setLoading(true);
    try {
      const payload: SessionAssignPayload = {
        template_id: formData.template_id,
        client_id: formData.client_id,
        name: formData.name,
        start_date: format(date, 'yyyy-MM-dd'),
        is_active: formData.is_active,
      };
      await sessionService.assignTemplate(payload);
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.template_id && formData.client_id && date;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-md w-full bg-slate-50 border-l border-slate-200">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl font-bold text-slate-800">
            Giao giáo án
          </SheetTitle>
          <SheetDescription className="text-slate-500">
            Copy toàn bộ dữ liệu từ giáo án mẫu và gán cho học viên.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Giáo án mẫu</Label>
              <Select 
                value={formData.template_id?.toString()}
                onValueChange={v => {
                    const tId = parseInt(v);
                    const selectedTpl = templates.find(t => t.id === tId);
                    setFormData(f => ({ ...f, template_id: tId, name: selectedTpl?.name || f.name }));
                }}
              >
                <SelectTrigger className="bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Chọn giáo án mẫu" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Học viên</Label>
              <ClientCombobox 
                clients={clients}
                value={formData.client_id || null}
                onChange={(val) => setFormData(f => ({ ...f, client_id: val }))}
              />
            </div>
            
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <Label className="text-slate-700 font-medium">Tên Mùa Giải (Tuỳ chọn)</Label>
              <Input 
                placeholder="Tên mùa giải mới..." 
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="bg-slate-50 border-slate-200 focus-visible:ring-[#54B7F0]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Ngày bắt đầu</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal bg-slate-50 border-slate-200 hover:bg-slate-100",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                    {date ? format(date, "dd/MM/yyyy") : <span>Chọn ngày</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <p className="text-[12px] text-slate-500">Các phase và bài tập bên trong sẽ tự động dịch chuyển theo ngày bắt đầu này.</p>
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
          </div>

          <SheetFooter className="mt-8">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Huỷ
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !isFormValid}
              className="bg-[#54B7F0] hover:bg-[#40a3dd] text-white shadow-sm"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Giao Giáo Án
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
