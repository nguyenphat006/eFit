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

  // TDEE states
  const [bmr, setBmr] = useState(0);
  const [tdee, setTdee] = useState(0);
  const [targetCalories, setTargetCalories] = useState(0);
  const [macros, setMacros] = useState({ protein: 0, fat: 0, carbs: 0 });

  // AI states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

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

  useEffect(() => {
    // TDEE Calculation
    let calcBmr = 0;
    if (profile.gender === 'Nam') {
      calcBmr = (10 * profile.current_weight) + (6.25 * profile.height) - (5 * profile.age) + 5;
    } else {
      calcBmr = (10 * profile.current_weight) + (6.25 * profile.height) - (5 * profile.age) - 161;
    }
    
    const calcTdee = calcBmr * profile.activity_level;
    let targetCal = calcTdee;
    
    if (sessionGoal === 'Bulking') targetCal += 300;
    else if (sessionGoal === 'Cutting') targetCal -= 500;

    const p = profile.current_weight * 2.2;
    const f = profile.current_weight * 0.8;
    const c = (targetCal - (p * 4) - (f * 9)) / 4;

    setBmr(Math.round(calcBmr));
    setTdee(Math.round(calcTdee));
    setTargetCalories(Math.round(targetCal));
    setMacros({
      protein: Math.round(p),
      fat: Math.round(f),
      carbs: Math.round(c > 0 ? c : 0)
    });
  }, [profile, sessionGoal]);

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
    onApply({
      target_calories: targetCalories,
      target_protein: macros.protein,
      target_fat: macros.fat,
      target_carbs: macros.carbs
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
                  <h4 className="font-semibold text-slate-700 mb-4 border-b border-slate-200 pb-2">Giải thích Công thức (Mifflin-St Jeor)</h4>
                  
                  <div className="space-y-3 text-sm text-slate-600">
                    <div className="flex justify-between">
                      <span>1. Tỷ lệ trao đổi chất (BMR):</span>
                      <strong className="font-mono text-slate-800">{bmr} kcal</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>2. Tổng năng lượng tiêu hao (TDEE): <br/><span className="text-[10px] text-slate-400">(BMR × {profile.activity_level})</span></span>
                      <strong className="font-mono text-slate-800">{tdee} kcal</strong>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                      <span className="font-medium text-[#54B7F0]">3. Calories mục tiêu (Goal: {sessionGoal}):</span>
                      <strong className="font-mono text-lg text-[#54B7F0]">{targetCalories} kcal</strong>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 mb-2">Phân bổ Macros đề xuất:</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white p-2 rounded-lg border border-slate-100">
                        <div className="text-[10px] text-slate-400">Protein (2.2g/kg)</div>
                        <div className="font-bold text-slate-700">{macros.protein}g</div>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-100">
                        <div className="text-[10px] text-slate-400">Fat (0.8g/kg)</div>
                        <div className="font-bold text-slate-700">{macros.fat}g</div>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-100">
                        <div className="text-[10px] text-slate-400">Carbs (còn lại)</div>
                        <div className="font-bold text-slate-700">{macros.carbs}g</div>
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
