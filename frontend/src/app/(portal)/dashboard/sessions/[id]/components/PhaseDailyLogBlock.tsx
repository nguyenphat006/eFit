'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { sessionService } from '@/services/api/sessionService';
import { Phase, DailyLog, DailyLogInlineUpsert } from '@/types/session';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Edit, Trash2, Dumbbell,
  Moon, Activity, Save, Edit3, Image as ImageIcon,
  CheckCircle2, XCircle, ChevronLeft, ChevronRight
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
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";

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

  const tableData = [
    { id: 'weight', title: 'Cân nặng' },
    { id: 'calories', title: 'Calo In' },
    { id: 'macros', title: 'P / C / F' },
    { id: 'workout', title: 'Tập luyện' },
    { id: 'recovery', title: 'Ngủ / Mệt mỏi' },
    { id: 'score', title: 'Điểm Kỷ Luật' },
    { id: 'actions', title: 'Hành động' }
  ];

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

  const columns = useMemo<ColumnDef<any>[]>(() => {
    const cols: ColumnDef<any>[] = [
      {
        accessorKey: "title",
        header: "Chỉ số",
        cell: ({ row }) => <span className="font-semibold text-slate-700 whitespace-nowrap">{row.original.title}</span>
      }
    ];

    currentDays.forEach(dateObj => {
      const dateStr = format(dateObj, 'yyyy-MM-dd');
      const future = isFuture(dateObj) && !isToday(dateObj);
      const today = isToday(dateObj);
      const log = logs[dateStr];

      cols.push({
        id: dateStr,
        header: () => (
           <div className="flex flex-col text-center min-w-[80px]">
              <span className={cn("font-semibold text-base", today ? "text-[#EF9035]" : future ? "text-slate-400" : "text-slate-800")}>
                 {format(dateObj, 'dd/MM')}
              </span>
              <span className="text-[10px] text-slate-500 uppercase">
                 {format(dateObj, 'EEE', { locale: vi })} {today && '(Nay)'}
              </span>
           </div>
        ),
        cell: ({ row }) => {
          if (future && row.original.id !== 'actions') return <div className="text-center text-slate-300">-</div>;
          
          switch (row.original.id) {
            case 'weight':
              return <div className="text-center">{log?.weight ? <span className="font-medium text-slate-700">{log.weight}kg</span> : <span className="text-slate-300">-</span>}</div>;
            case 'calories':
              if (!log?.calories_in) return <div className="text-center text-slate-300">-</div>;
              const target = phase.target_calories;
              let color = "text-slate-700";
              if (target) {
                const ratio = log.calories_in / target;
                if (ratio > 1.1) color = "text-red-500 font-bold";
                else if (ratio < 0.9) color = "text-orange-500 font-bold";
                else color = "text-emerald-600 font-bold";
              }
              return <div className={cn("text-center font-semibold", color)}>{log.calories_in}</div>;
            case 'macros':
              if (!log || (!log.protein_in && !log.carbs_in && !log.fat_in)) return <div className="text-center text-slate-300">-</div>;
              return <div className="text-center text-xs text-slate-700 font-medium">{log.protein_in || 0}/{log.carbs_in || 0}/{log.fat_in || 0}</div>;
            case 'workout':
              if (!log) return <div className="text-center text-slate-300">-</div>;
              return <div className="text-center">{log.is_workout_completed ? <CheckCircle2 className="w-4 h-4 mx-auto text-emerald-500"/> : <XCircle className="w-4 h-4 mx-auto text-slate-300"/>}</div>;
            case 'recovery':
              if (!log) return <div className="text-center text-slate-300">-</div>;
              return <div className="text-center text-[11px] text-slate-600 font-medium">{log.sleep_hours || '-'}h / {log.fatigue_level || '-'} mệt</div>;
            case 'score':
               if (!log || log.compliance_score === null) return <div className="text-center text-slate-300">-</div>;
               const score = log.compliance_score;
               const badgeColor = score >= 80 ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                                  score >= 50 ? "bg-orange-50 text-orange-600 border-orange-200" :
                                  "bg-red-50 text-red-600 border-red-200";
               return <div className="text-center"><Badge variant="outline" className={cn("px-1.5 py-0 text-[10px]", badgeColor)}>{score}%</Badge></div>;
            case 'actions':
              if (future) return <div className="text-center text-[10px] italic text-slate-400">Chưa đến</div>;
              return (
                <div className="flex justify-center">
                   <Button variant="outline" size="sm" onClick={() => openEditor(dateStr)} className="h-6 px-2 text-xs text-[#54B7F0] border-[#54B7F0]/30 hover:bg-[#54B7F0]/10">
                      <Edit3 className="w-3 h-3 mr-1" /> {log ? 'Sửa' : 'Nhập'}
                   </Button>
                </div>
              );
          }
        }
      });
    });

    return cols;
  }, [currentDays, logs, phase.target_calories]);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  return (
    <Card className="mb-8 border-2 border-slate-200 overflow-hidden shadow-sm">
      <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-200 uppercase tracking-wider text-[10px]">
              Phase {phase.order}
            </Badge>
            <h3 className="text-xl font-bold text-slate-800">{phase.name}</h3>
          </div>
          <p className="text-sm text-slate-500">
            {format(parseISO(phase.start_date), 'dd/MM/yyyy')} - {format(parseISO(phase.end_date), 'dd/MM/yyyy')}
            <span className="ml-2 font-medium">({days.length} ngày)</span>
          </p>
          {phase.description && <p className="text-sm mt-2 text-slate-600 max-w-2xl">{phase.description}</p>}
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
           {/* Targets */}
           <div className="flex gap-4 text-sm bg-white p-2 px-4 rounded-lg border border-slate-200">
             <div className="flex flex-col">
               <span className="text-[10px] uppercase text-slate-400 font-bold">Target Calories</span>
               <span className="font-semibold text-slate-700">{phase.target_calories || '-'} kcal</span>
             </div>
             <div className="w-px bg-slate-200"></div>
             <div className="flex flex-col">
               <span className="text-[10px] uppercase text-slate-400 font-bold">Target Macros</span>
               <span className="font-semibold text-slate-700">
                 {phase.target_protein || '-'}P / {phase.target_carbs || '-'}C / {phase.target_fat || '-'}F
               </span>
             </div>
           </div>

           {/* Actions */}
           <div className="flex items-center gap-2">
             <Button variant="ghost" size="icon" onClick={() => onEditPhase(phase)} className="text-slate-500 hover:text-[#54B7F0]">
               <Edit className="w-4 h-4" />
             </Button>
             <Button variant="ghost" size="icon" onClick={() => onDeletePhase(phase.id)} className="text-slate-500 hover:text-red-500">
               <Trash2 className="w-4 h-4" />
             </Button>
           </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="border-t border-slate-100 flex flex-col">
           {/* Custom Pagination Header */}
           <div className="flex items-center justify-between p-3 px-5 bg-white border-b border-slate-100">
             <span className="text-sm font-medium text-slate-700">
                Hiển thị Tuần {currentPage + 1} / {totalPages}
             </span>
             <div className="flex items-center gap-2">
                <Button 
                   variant="outline" 
                   size="sm" 
                   onClick={handlePrevPage} 
                   disabled={currentPage === 0}
                   className="h-8 border-slate-200"
                >
                   <ChevronLeft className="w-4 h-4 mr-1" /> Tuần trước
                </Button>
                <Button 
                   variant="outline" 
                   size="sm" 
                   onClick={handleNextPage} 
                   disabled={currentPage === totalPages - 1}
                   className="h-8 border-slate-200"
                >
                   Tuần sau <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
             </div>
           </div>

           {/* Data Table */}
           <div className="overflow-x-auto">
             <DataTable 
               columns={columns} 
               data={tableData} 
               isLoading={loading}
             />
           </div>
        </div>
      </CardContent>

      {/* Inline Edit Dialog */}
      <Dialog open={!!editingDate} onOpenChange={(open) => !open && setEditingDate(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
               Nhật ký ngày {editingDate && format(parseISO(editingDate), 'dd/MM/yyyy')}
            </DialogTitle>
          </DialogHeader>
          
          {editForm && (
             <div className="space-y-4 py-4">
               {/* Calories & Macros */}
               <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="col-span-2 space-y-1">
                     <Label>Calories In (kcal)</Label>
                     <Input 
                        type="number" 
                        value={editForm.calories_in || ''} 
                        onChange={e => setEditForm({...editForm, calories_in: parseFloat(e.target.value) || null})}
                        className="bg-white"
                     />
                  </div>
                  <div className="space-y-1">
                     <Label>Protein (g)</Label>
                     <Input 
                        type="number" 
                        value={editForm.protein_in || ''} 
                        onChange={e => setEditForm({...editForm, protein_in: parseFloat(e.target.value) || null})}
                        className="bg-white"
                     />
                  </div>
                  <div className="space-y-1">
                     <Label>Carbs (g)</Label>
                     <Input 
                        type="number" 
                        value={editForm.carbs_in || ''} 
                        onChange={e => setEditForm({...editForm, carbs_in: parseFloat(e.target.value) || null})}
                        className="bg-white"
                     />
                  </div>
                  <div className="space-y-1">
                     <Label>Fat (g)</Label>
                     <Input 
                        type="number" 
                        value={editForm.fat_in || ''} 
                        onChange={e => setEditForm({...editForm, fat_in: parseFloat(e.target.value) || null})}
                        className="bg-white"
                     />
                  </div>
                  <div className="space-y-1">
                     <Label>Cân nặng (kg)</Label>
                     <Input 
                        type="number" 
                        value={editForm.weight || ''} 
                        onChange={e => setEditForm({...editForm, weight: parseFloat(e.target.value) || null})}
                        className="bg-white"
                     />
                  </div>
               </div>

               {/* Tập luyện & Phục hồi */}
               <div className="space-y-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between">
                     <Label className="flex items-center"><Dumbbell className="w-4 h-4 mr-2"/> Hoàn thành giáo án?</Label>
                     <Switch 
                        checked={editForm.is_workout_completed || false}
                        onCheckedChange={v => setEditForm({...editForm, is_workout_completed: v})}
                     />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <Label className="flex items-center text-xs"><Moon className="w-3 h-3 mr-1"/> Giờ ngủ</Label>
                        <Input 
                           type="number" 
                           value={editForm.sleep_hours || ''} 
                           onChange={e => setEditForm({...editForm, sleep_hours: parseFloat(e.target.value) || null})}
                           className="bg-white h-8 text-sm"
                        />
                     </div>
                     <div className="space-y-1">
                        <Label className="flex items-center text-xs"><Activity className="w-3 h-3 mr-1"/> Mệt mỏi (1-5)</Label>
                        <Input 
                           type="number" min={1} max={5}
                           value={editForm.fatigue_level || ''} 
                           onChange={e => setEditForm({...editForm, fatigue_level: parseInt(e.target.value) || null})}
                           className="bg-white h-8 text-sm"
                        />
                     </div>
                  </div>
               </div>
             </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDate(null)}>Hủy</Button>
            <Button onClick={handleSaveLog} className="bg-[#54B7F0] hover:bg-[#3FA3DC] text-white">
               <Save className="w-4 h-4 mr-2" /> Lưu Nhật Ký
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
