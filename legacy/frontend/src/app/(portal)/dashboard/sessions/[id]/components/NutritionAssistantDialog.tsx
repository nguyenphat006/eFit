import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Calculator, Info, Loader2, Target } from 'lucide-react';
import { useAuthStore } from '@/hooks/useAuthStore';
import { authService } from '@/services/api/authService';
import { sessionService } from '@/services/api/sessionService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface NutritionAssistantDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sessionGoal: string;
  phaseDesc: string;
  onApply: (macros: { target_calories: number, target_protein: number, target_carbs: number, target_fat: number }) => void;
}

export function NutritionAssistantDialog({ isOpen, onClose, sessionGoal, phaseDesc, onApply }: NutritionAssistantDialogProps) {
  const { user } = useAuthStore();
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profile, setProfile] = useState({
    gender: 'Nam',
    age: 25,
    height: 170,
    current_weight: 70,
    body_fat_percentage: 15,
    activity_level: 1.55,
  });

  const [selectedGoalTab, setSelectedGoalTab] = useState('Maintenance');
  const [selectedMacroSplit, setSelectedMacroSplit] = useState('Moderate');

  // AI states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  const { calcBmr, calcTdee, formulaUsed } = React.useMemo(() => {
    let bmrVal = 0;
    let formulaName = "Mifflin-St Jeor";
    
    // Nếu có nhập Body Fat, ưu tiên dùng công thức Katch-McArdle (chính xác hơn)
    if (profile.body_fat_percentage && profile.body_fat_percentage > 0) {
      const leanBodyMass = profile.current_weight * (1 - (profile.body_fat_percentage / 100));
      bmrVal = 370 + (21.6 * leanBodyMass);
      formulaName = "Katch-McArdle";
    } else {
      if (profile.gender === 'Nam') {
        bmrVal = (10 * profile.current_weight) + (6.25 * profile.height) - (5 * profile.age) + 5;
      } else {
        bmrVal = (10 * profile.current_weight) + (6.25 * profile.height) - (5 * profile.age) - 161;
      }
    }
    return { calcBmr: Math.round(bmrVal), calcTdee: Math.round(bmrVal * profile.activity_level), formulaUsed: formulaName };
  }, [profile]);

  const targetCalByGoal = React.useMemo(() => {
    if (selectedGoalTab === 'Bulking') return calcTdee + 500;
    if (selectedGoalTab === 'Cutting') return calcTdee - 500;
    return calcTdee;
  }, [calcTdee, selectedGoalTab]);

  const macroSplits = React.useMemo(() => {
    const cals = targetCalByGoal;
    return {
      Moderate: { p: Math.round(cals * 0.3 / 4), f: Math.round(cals * 0.35 / 9), c: Math.round(cals * 0.35 / 4), desc: '30/35/35' },
      Lower: { p: Math.round(cals * 0.4 / 4), f: Math.round(cals * 0.4 / 9), c: Math.round(cals * 0.2 / 4), desc: '40/40/20' },
      Higher: { p: Math.round(cals * 0.3 / 4), f: Math.round(cals * 0.2 / 9), c: Math.round(cals * 0.5 / 4), desc: '30/20/50' }
    };
  }, [targetCalByGoal]);

  useEffect(() => {
    if (isOpen && user) {
      // Calculate age from dob if exists
      let age = 25;
      if (user.date_of_birth) {
        const diff = Date.now() - new Date(user.date_of_birth).getTime();
        age = Math.abs(new Date(diff).getUTCFullYear() - 1970);
      }
      setProfile({
        gender: user.gender || 'Nam',
        age: age,
        height: user.height || 170,
        current_weight: user.current_weight || 70,
        body_fat_percentage: user.body_fat_percentage || 15,
        activity_level: user.activity_level || 1.55,
      });
    }
  }, [isOpen, user]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setLoadingProfile(true);
    try {
      await authService.updateProfile({
        gender: profile.gender,
        height: profile.height,
        current_weight: profile.current_weight,
        body_fat_percentage: profile.body_fat_percentage,
        activity_level: profile.activity_level
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleApplyTDEE = async () => {
    await handleUpdateProfile();
    const selMacros = macroSplits[selectedMacroSplit as keyof typeof macroSplits];
    onApply({
      target_calories: targetCalByGoal,
      target_protein: selMacros.p,
      target_fat: selMacros.f,
      target_carbs: selMacros.c
    });
    onClose();
  };

  const handleCallAI = async () => {
    setAiLoading(true);
    setAiResult(null);
    await handleUpdateProfile();
    try {
      const res = await sessionService.suggestNutrition({
        goal: sessionGoal,
        phase_description: phaseDesc,
        gender: profile.gender,
        age: profile.age,
        height: profile.height,
        current_weight: profile.current_weight,
        body_fat_percentage: profile.body_fat_percentage,
        activity_level: profile.activity_level
      });
      setAiResult(res);
    } catch (e) {
      console.error(e);
      alert("Lỗi khi gọi AI: " + e);
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAI = () => {
    if (!aiResult) return;
    onApply({
      target_calories: aiResult.calories,
      target_protein: aiResult.protein,
      target_fat: aiResult.fat,
      target_carbs: aiResult.carbs
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-slate-800">
            <Target className="w-6 h-6 text-[#54B7F0]" />
            Trợ lý Dinh dưỡng
          </DialogTitle>
          <DialogDescription>
            Kiểm tra thông tin thể trạng của bạn để hệ thống tính toán hoặc đưa cho AI phân tích.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.8fr] gap-6 mt-4">
          
          {/* Cột 1: Profile Form */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
            <h4 className="font-bold text-slate-700 flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-400" /> Thông tin cơ sở
            </h4>
            
            <div className="space-y-3">

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">Giới tính</Label>
                  <Select value={profile.gender} onValueChange={v => setProfile({...profile, gender: v})}>
                    <SelectTrigger className="h-8 text-sm bg-white"><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Nam">Nam</SelectItem>
                      <SelectItem value="Nữ">Nữ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">Tuổi</Label>
                  <Input type="number" className="h-8 text-sm bg-white" value={profile.age} onChange={e => setProfile({...profile, age: parseInt(e.target.value)||0})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">Chiều cao (cm)</Label>
                  <Input type="number" className="h-8 text-sm bg-white" value={profile.height} onChange={e => setProfile({...profile, height: parseFloat(e.target.value)||0})} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">Cân nặng (kg)</Label>
                  <Input type="number" className="h-8 text-sm bg-white" value={profile.current_weight} onChange={e => setProfile({...profile, current_weight: parseFloat(e.target.value)||0})} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">% Mỡ (Body Fat)</Label>
                <Input type="number" className="h-8 text-sm bg-white" value={profile.body_fat_percentage} onChange={e => setProfile({...profile, body_fat_percentage: parseFloat(e.target.value)||0})} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">Mức độ vận động (Activity)</Label>
                <Select value={profile.activity_level.toString()} onValueChange={v => setProfile({...profile, activity_level: parseFloat(v)})}>
                  <SelectTrigger className="h-8 text-sm bg-white"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1.2">Ít vận động (Không tập luyện)</SelectItem>
                    <SelectItem value="1.375">Vận động nhẹ (Tập 1-3 buổi/tuần)</SelectItem>
                    <SelectItem value="1.55">Vận động vừa (Tập 3-5 buổi/tuần)</SelectItem>
                    <SelectItem value="1.725">Vận động nhiều (Tập 6-7 buổi/tuần)</SelectItem>
                    <SelectItem value="1.9">Cường độ cao (Lao động nặng/Tập 2 lần/ngày)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 italic mt-2">
              * Thay đổi ở đây sẽ tự động được lưu vào Profile của bạn.
            </p>
          </div>

          {/* Cột 2: Tabs Tính toán & AI */}
          <div>
            <Tabs defaultValue="tdee" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 shrink-0">
                <TabsTrigger value="tdee" className="font-semibold"><Calculator className="w-4 h-4 mr-2" /> TDEE Formula</TabsTrigger>
                <TabsTrigger value="ai" className="font-semibold text-emerald-600 data-[state=active]:text-emerald-700 data-[state=active]:bg-emerald-50"><Sparkles className="w-4 h-4 mr-2" /> eFit AI</TabsTrigger>
              </TabsList>

              <TabsContent value="tdee" className="space-y-4">
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                  <Tabs value={selectedGoalTab} onValueChange={setSelectedGoalTab} className="w-full">
                    <TabsList className="w-full justify-start border-b border-slate-200 bg-transparent p-0 h-auto rounded-none">
                      <TabsTrigger value="Maintenance" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#EF9035] data-[state=active]:bg-transparent data-[state=active]:text-[#EF9035] data-[state=active]:shadow-none px-4 py-2">Duy trì (Maintain)</TabsTrigger>
                      <TabsTrigger value="Cutting" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#EF9035] data-[state=active]:bg-transparent data-[state=active]:text-[#EF9035] data-[state=active]:shadow-none px-4 py-2">Giảm mỡ (Cutting)</TabsTrigger>
                      <TabsTrigger value="Bulking" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#EF9035] data-[state=active]:bg-transparent data-[state=active]:text-[#EF9035] data-[state=active]:shadow-none px-4 py-2">Tăng cơ (Bulking)</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="mt-4 text-sm text-slate-600 mb-6">
                    Bảng tỷ lệ dinh dưỡng (Macros) dưới đây được tính toán dựa trên mục tiêu <strong className="text-[#EF9035]">{selectedGoalTab === 'Maintenance' ? 'Duy trì' : selectedGoalTab === 'Cutting' ? 'Giảm mỡ' : 'Tăng cơ'}</strong> với mức năng lượng là <strong className="text-slate-900">{targetCalByGoal.toLocaleString()}</strong> calo mỗi ngày.
                    <div className="text-xs text-slate-400 mt-1">(BMR: {calcBmr} kcal • TDEE: {calcTdee} kcal • Áp dụng công thức: {formulaUsed})</div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Moderate */}
                    <div 
                      onClick={() => setSelectedMacroSplit('Moderate')}
                      className={cn("cursor-pointer bg-[#FDF9F1] rounded-xl overflow-hidden border-2 transition-all", selectedMacroSplit === 'Moderate' ? "border-[#EF9035] shadow-sm" : "border-transparent opacity-70 hover:opacity-100")}
                    >
                      <div className="bg-[#4E73A6] text-white text-xs font-bold px-3 py-1 text-center">Carb Vừa phải ({macroSplits.Moderate.desc})</div>
                      <div className="p-4 text-center space-y-3">
                        <div>
                          <div className="text-2xl font-black text-[#2B394A] border-b border-dotted border-slate-300 inline-block px-2">{macroSplits.Moderate.p}g</div>
                          <div className="text-xs text-slate-500 italic mt-0.5">đạm (protein)</div>
                        </div>
                        <div>
                          <div className="text-2xl font-black text-[#2B394A] border-b border-dotted border-slate-300 inline-block px-2">{macroSplits.Moderate.f}g</div>
                          <div className="text-xs text-slate-500 italic mt-0.5">béo (fats)</div>
                        </div>
                        <div>
                          <div className="text-2xl font-black text-[#2B394A] border-b border-dotted border-slate-300 inline-block px-2">{macroSplits.Moderate.c}g</div>
                          <div className="text-xs text-slate-500 italic mt-0.5">tinh bột (carbs)</div>
                        </div>
                      </div>
                    </div>

                    {/* Lower */}
                    <div 
                      onClick={() => setSelectedMacroSplit('Lower')}
                      className={cn("cursor-pointer bg-[#FDF9F1] rounded-xl overflow-hidden border-2 transition-all", selectedMacroSplit === 'Lower' ? "border-[#EF9035] shadow-sm" : "border-transparent opacity-70 hover:opacity-100")}
                    >
                      <div className="bg-[#4E73A6] text-white text-xs font-bold px-3 py-1 text-center">Ít Carb ({macroSplits.Lower.desc})</div>
                      <div className="p-4 text-center space-y-3">
                        <div>
                          <div className="text-2xl font-black text-[#2B394A] border-b border-dotted border-slate-300 inline-block px-2">{macroSplits.Lower.p}g</div>
                          <div className="text-xs text-slate-500 italic mt-0.5">đạm (protein)</div>
                        </div>
                        <div>
                          <div className="text-2xl font-black text-[#2B394A] border-b border-dotted border-slate-300 inline-block px-2">{macroSplits.Lower.f}g</div>
                          <div className="text-xs text-slate-500 italic mt-0.5">béo (fats)</div>
                        </div>
                        <div>
                          <div className="text-2xl font-black text-[#2B394A] border-b border-dotted border-slate-300 inline-block px-2">{macroSplits.Lower.c}g</div>
                          <div className="text-xs text-slate-500 italic mt-0.5">tinh bột (carbs)</div>
                        </div>
                      </div>
                    </div>

                    {/* Higher */}
                    <div 
                      onClick={() => setSelectedMacroSplit('Higher')}
                      className={cn("cursor-pointer bg-[#FDF9F1] rounded-xl overflow-hidden border-2 transition-all", selectedMacroSplit === 'Higher' ? "border-[#EF9035] shadow-sm" : "border-transparent opacity-70 hover:opacity-100")}
                    >
                      <div className="bg-[#4E73A6] text-white text-xs font-bold px-3 py-1 text-center">Nhiều Carb ({macroSplits.Higher.desc})</div>
                      <div className="p-4 text-center space-y-3">
                        <div>
                          <div className="text-2xl font-black text-[#2B394A] border-b border-dotted border-slate-300 inline-block px-2">{macroSplits.Higher.p}g</div>
                          <div className="text-xs text-slate-500 italic mt-0.5">đạm (protein)</div>
                        </div>
                        <div>
                          <div className="text-2xl font-black text-[#2B394A] border-b border-dotted border-slate-300 inline-block px-2">{macroSplits.Higher.f}g</div>
                          <div className="text-xs text-slate-500 italic mt-0.5">béo (fats)</div>
                        </div>
                        <div>
                          <div className="text-2xl font-black text-[#2B394A] border-b border-dotted border-slate-300 inline-block px-2">{macroSplits.Higher.c}g</div>
                          <div className="text-xs text-slate-500 italic mt-0.5">tinh bột (carbs)</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleApplyTDEE}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-12"
                  disabled={loadingProfile}
                >
                  {loadingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Áp dụng Công thức'}
                </Button>
              </TabsContent>

              <TabsContent value="ai" className="space-y-4 flex flex-col h-[550px]">
                {!aiResult && !aiLoading && (
                  <div className="bg-[#54B7F0]/5 border border-[#54B7F0]/20 rounded-xl p-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                      <Sparkles className="w-8 h-8 text-[#54B7F0]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">eFit AI - Trợ lý Dinh dưỡng</h4>
                      <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
                        AI sẽ đọc profile của bạn, mục tiêu của Session và mô tả của Phase để đưa ra tỷ lệ dinh dưỡng cá nhân hóa và phù hợp nhất.
                      </p>
                    </div>
                    <Button onClick={handleCallAI} className="bg-[#54B7F0] hover:bg-[#3FA3DC] text-white rounded-full px-8">
                      Bắt đầu Phân tích
                    </Button>
                  </div>
                )}

                {aiLoading && (
                  <div className="h-64 flex flex-col items-center justify-center space-y-4 bg-slate-50 rounded-xl border border-slate-100">
                    <Loader2 className="w-8 h-8 text-[#54B7F0] animate-spin" />
                    <p className="text-sm font-medium text-slate-500 animate-pulse">eFit AI đang phân tích thể trạng của bạn...</p>
                  </div>
                )}

                {aiResult && !aiLoading && (
                  <div className="flex flex-col h-full space-y-4 animate-in fade-in zoom-in-95 duration-300">
                    <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100 flex-1 overflow-y-auto">
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div className="w-full">
                          <h4 className="font-bold text-emerald-800 mb-2">Đề xuất từ AI</h4>
                          <div className="text-sm text-emerald-800 leading-relaxed prose prose-sm max-w-none prose-emerald">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {aiResult.explanation}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                       <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                         <div className="text-xs text-slate-500 mb-1">Calories</div>
                         <div className="font-black text-lg text-slate-800">{aiResult.calories}</div>
                       </div>
                       <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-center">
                         <div className="text-xs text-blue-600 mb-1">Protein</div>
                         <div className="font-black text-lg text-blue-800">{aiResult.protein}g</div>
                       </div>
                       <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-center">
                         <div className="text-xs text-amber-600 mb-1">Carbs</div>
                         <div className="font-black text-lg text-amber-800">{aiResult.carbs}g</div>
                       </div>
                       <div className="bg-rose-50 p-3 rounded-xl border border-rose-100 text-center">
                         <div className="text-xs text-rose-600 mb-1">Fat</div>
                         <div className="font-black text-lg text-rose-800">{aiResult.fat}g</div>
                       </div>
                    </div>

                    <div className="flex gap-3 shrink-0">
                      <Button variant="outline" onClick={() => setAiResult(null)} className="flex-1">
                        Phân tích lại
                      </Button>
                      <Button onClick={handleApplyAI} className="flex-1 bg-[#54B7F0] hover:bg-[#3FA3DC] text-white">
                        Áp dụng kết quả
                      </Button>
                    </div>
                  </div>
                )}

              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
