'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { DashboardMetrics, WorkoutExercise } from './types';
import WorkoutList from './components/WorkoutList';
import HealthLogger from './components/HealthLogger';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sparkles, Bot, Send } from 'lucide-react';

interface DashboardViewProps {
  initialData: any;
}

const mockExercises: WorkoutExercise[] = [
  { id: '1', name: 'Barbell Back Squat (Gánh đùi sau)', sets: 4, reps: '6-8', weight: 100 },
  { id: '2', name: 'Romanian Deadlift (Mông đùi sau)', sets: 3, reps: '8-10', weight: 80 },
  { id: '3', name: 'Standing Calf Raise (Nhón bắp chân)', sets: 4, reps: '12-15', weight: 50 },
];

export default function DashboardView({ initialData }: DashboardViewProps) {
  const t = useTranslations('Dashboard');
  const [messages, setMessages] = useState<string[]>([]);
  const [aiInput, setAiInput] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    setMessages((prev) => [
      ...prev, 
      aiInput, 
      `🤖 [AI Coach]: Lịch tập chân hôm nay của bạn có cường độ rất tốt. Dựa vào độ sẵn sàng CNS (92%) và cân nặng hiện tại, hãy uống tối thiểu 2.5 lít nước và nạp tinh bột phức hợp trước buổi tập 2 tiếng để đạt hiệu suất tối đa nhé!`
    ]);
    setAiInput('');
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Quick Welcome banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-[#54B7F0]/10 via-slate-50 to-[#EF9035]/10 border border-[#e8f4fc] p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 font-display">
            Chào Hoàng Nam,
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            {t('welcome')} Lịch tập luyện chu kỳ AI của bạn đã sẵn sàng.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-extrabold text-[#54B7F0] bg-[#54B7F0]/10 border border-[#54B7F0]/20 px-3 py-1.5 rounded-full uppercase tracking-wider">
            Gói tập: Premium (AI-Powered)
          </span>
        </div>
      </div>

      {/* 2. Grid Layout for dashboard modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Workout list card */}
        <div className="glow-ocean h-full">
          <WorkoutList exercises={mockExercises} />
        </div>

        {/* Health Logger card */}
        <div className="glow-yellow h-full">
          <HealthLogger />
        </div>

        {/* AI Fitness Assistant */}
        <Card className="border border-[#e8f4fc] shadow-sm flex flex-col h-[480px] lg:h-full overflow-hidden">
          <CardHeader className="border-b border-[#e8f4fc] bg-slate-50/50 pb-4">
            <div className="flex items-center gap-3">
              <Avatar className="w-9 h-9 border border-[#54B7F0]/30 shadow-sm shrink-0">
                <AvatarFallback className="bg-gradient-to-tr from-[#54B7F0] to-[#6AE5F7] text-white">
                  <Bot className="w-5 h-5 animate-pulse" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base font-bold text-slate-800 font-display flex items-center gap-1.5">
                  <span>{t('ai_assistant')}</span>
                  <Sparkles className="w-3.5 h-3.5 text-[#EF9035] fill-[#EF9035]" />
                </CardTitle>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-[#54B7F0] rounded-full animate-ping"></span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hoạt động</span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 flex-1 flex flex-col overflow-hidden bg-slate-50/20">
            {/* Conversation Log */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1 custom-scrollbar flex flex-col">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 py-10 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
                    <Bot className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-slate-400 italic font-semibold max-w-[200px]">
                    Hãy đặt bất kỳ câu hỏi nào về giáo án, dinh dưỡng hoặc CNS của bạn!
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isAi = msg.startsWith('🤖');
                  return (
                    <div 
                      key={idx} 
                      className={`flex gap-2.5 items-start max-w-[85%] ${
                        isAi ? 'self-start' : 'self-end ml-auto flex-row-reverse'
                      }`}
                    >
                      {isAi && (
                        <Avatar className="w-7 h-7 border border-[#54B7F0]/20 shrink-0 select-none">
                          <AvatarFallback className="bg-[#54B7F0] text-white">
                            <Bot className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div 
                        className={`p-3.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm ${
                          isAi 
                            ? 'bg-white border border-[#e8f4fc] text-slate-700 rounded-tl-sm' 
                            : 'bg-gradient-to-r from-[#54B7F0] to-[#54B7F0]/90 text-white rounded-tr-sm'
                        }`}
                      >
                        {isAi ? msg.replace('🤖 [AI Coach]: ', '') : msg}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Message Form */}
            <form onSubmit={handleSendMessage} className="flex gap-2 shrink-0 border-t border-slate-100 pt-3 bg-white">
              <Input
                type="text"
                placeholder={t('ai_input_placeholder')}
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-5 text-xs text-slate-800 placeholder-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-[#54B7F0] focus:ring-4 focus:ring-[#54B7F0]/10 transition-all font-semibold"
              />
              <Button
                type="submit"
                size="icon"
                className="bg-[#54B7F0] hover:bg-[#48a2d6] text-white h-10 w-10 rounded-xl shrink-0 transition-all shadow-md active:scale-95 flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
