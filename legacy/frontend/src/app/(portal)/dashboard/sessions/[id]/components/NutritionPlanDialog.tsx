import { useState, useEffect } from 'react';
import { Phase } from '@/types/session';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Apple, Wand2, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { axiosClient } from '@/lib/axiosClient';
import NutritionPlanBuilder from './NutritionPlanBuilder';
import { sessionService } from '@/services/api/sessionService';

export default function NutritionPlanDialog({ 
  isOpen, 
  onClose, 
  phase 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  phase: Phase; 
}) {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPlan();
      setIsEditing(false);
    }
  }, [isOpen]);

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`/api/v1/nutrition-plans/phase/${phase.id}`);
      setPlan(res.data);
    } catch (e: any) {
      if (e.detail === "Chưa có giáo án dinh dưỡng" || e.status_code === 404) {
        setPlan(null);
      } else {
        console.error(e);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await axiosClient.post(`/api/v1/nutrition-plans/phase/${phase.id}/generate`);
      setPlan(res.data);
    } catch (e) {
      console.error(e);
      alert("Lỗi khi sinh thực đơn. Vui lòng thử lại.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSavePlan = async (payload: any) => {
    try {
      await sessionService.saveNutritionPlan(phase.id, payload);
      setIsEditing(false);
      fetchPlan();
    } catch (e) {
      console.error(e);
      alert("Lỗi khi lưu lịch ăn.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0 bg-slate-50">
        
        {isEditing ? (
          <div className="flex flex-col h-[90vh]">
            <NutritionPlanBuilder 
              phase={phase} 
              initialPlan={plan} 
              onSave={handleSavePlan} 
              onCancel={() => {
                if (!plan) onClose();
                else setIsEditing(false);
              }}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            <DialogHeader className="mb-6">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Apple className="w-5 h-5" />
                </div>
                Giáo án Dinh dưỡng: {phase.name}
              </DialogTitle>
            </DialogHeader>

            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-emerald-500" />
                <p>Đang tải giáo án...</p>
              </div>
            ) : !plan ? (
              <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-dashed border-emerald-200">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                  <Apple className="w-8 h-8 text-emerald-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Chưa có Giáo án Dinh dưỡng</h3>
                <p className="text-slate-500 text-center max-w-sm mb-6">
                  Mùa giải này chưa được thiết lập lịch ăn cụ thể. Bạn có thể sử dụng AI để tự động chia bữa hoặc tạo thủ công.
                </p>
                <div className="flex gap-3">
                  <Button onClick={() => setIsEditing(true)} variant="outline" className="border-emerald-200 text-emerald-600 hover:bg-emerald-50">
                    Tạo Thủ Công
                  </Button>
                  <Button onClick={handleGenerate} disabled={generating} className="bg-emerald-500 hover:bg-emerald-600">
                    {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                    {generating ? 'Đang tạo thực đơn...' : 'Tạo Tự Động (AI)'}
                  </Button>
                </div>
              </div>
            ) : (
          <div className="space-y-6 mt-4">
            {/* Header info */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-500 uppercase font-bold tracking-wider mb-1">Mục tiêu hằng ngày</p>
                <div className="flex gap-4">
                  <div className="text-xl font-black text-slate-800">{plan.target_calories} <span className="text-sm font-medium text-slate-500">kcal</span></div>
                  <div className="w-px bg-slate-200"></div>
                  <div className="flex gap-3 text-sm font-bold text-slate-600 items-center">
                    <span className="text-blue-500">{plan.target_protein}g P</span>
                    <span className="text-orange-500">{plan.target_carbs}g C</span>
                    <span className="text-amber-500">{plan.target_fat}g F</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setIsEditing(true)} variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-50">
                  Chỉnh Sửa
                </Button>
                <Button onClick={handleGenerate} variant="outline" disabled={generating} className="border-emerald-200 text-emerald-600 hover:bg-emerald-50">
                  {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                  Tạo lại với AI
                </Button>
              </div>
            </div>

            {plan.notes && (
              <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl text-sm leading-relaxed border border-emerald-100">
                <strong className="block mb-1">💡 Lời khuyên từ AI:</strong>
                {plan.notes}
              </div>
            )}

            {/* Meals List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(plan.meals || []).map((meal: any, idx: number) => (
                <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                    <h4 className="font-bold text-lg text-slate-800">{meal.name}</h4>
                    <div className="text-xs font-semibold text-slate-500 flex gap-2">
                      <span>{meal.target_calories} kcal</span>
                      <span>({meal.target_protein}P/{meal.target_carbs}C/{meal.target_fat}F)</span>
                    </div>
                  </div>
                  <div className="p-4 space-y-4 flex-1">
                    {(meal.items || []).map((item: any, i: number) => {
                      const isCarb = item.food_category_code === 'GRAINS';
                      const isProtein = item.food_category_code === 'MEATS' || item.food_category_code === 'SEAFOOD';
                      const isFat = item.food_category_code === 'FATS';
                      const isVeg = item.food_category_code === 'VEGETABLES';
                      
                      let colorClass = "bg-slate-100 text-slate-600";
                      let bgClass = "bg-slate-50/50";
                      let borderClass = "border-slate-100";
                      
                      if (isCarb) { colorClass = "bg-orange-100 text-orange-700"; bgClass = "bg-orange-50/30"; borderClass = "border-orange-100"; }
                      if (isProtein) { colorClass = "bg-blue-100 text-blue-700"; bgClass = "bg-blue-50/30"; borderClass = "border-blue-100"; }
                      if (isFat) { colorClass = "bg-amber-100 text-amber-700"; bgClass = "bg-amber-50/30"; borderClass = "border-amber-100"; }
                      if (isVeg) { colorClass = "bg-emerald-100 text-emerald-700"; bgClass = "bg-emerald-50/30"; borderClass = "border-emerald-100"; }

                      return (
                        <div key={i} className={cn("p-3 rounded-xl border flex flex-col gap-1", bgClass, borderClass)}>
                          <div className="flex justify-between items-start mb-1">
                            <Badge variant="secondary" className={cn("text-[10px] uppercase font-bold tracking-wider", colorClass)}>
                              {item.food_category_code}
                            </Badge>
                            <span className="text-xs font-semibold text-slate-400">
                              {item.target_protein}P / {item.target_carbs}C / {item.target_fat}F
                            </span>
                          </div>
                          
                          <div className="font-bold text-slate-800 text-base">{item.primary_food_text}</div>
                          
                          {item.alternatives_text && (
                            <div className="flex mt-1 items-start gap-1">
                              <ArrowRight className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                              <span className="text-xs italic text-slate-500 leading-snug">
                                {item.alternatives_text}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
