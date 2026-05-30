'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { HeartPulse, Scale, Moon, Flame } from 'lucide-react';

export default function HealthLogger() {
  const t = useTranslations('Dashboard');
  const [weight, setWeight] = useState('');
  const [sleep, setSleep] = useState('');
  const [calories, setCalories] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Ghi nhận nhật ký thành công: Cân nặng: ${weight}kg, Giấc ngủ: ${sleep}h, Calo: ${calories}kcal`);
    setWeight('');
    setSleep('');
    setCalories('');
  };

  return (
    <Card className="border border-[#e8f4fc] shadow-sm overflow-hidden h-full">
      <CardHeader className="border-b border-[#e8f4fc] bg-slate-50/50 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#EF9035]/10 flex items-center justify-center text-[#EF9035]">
            <HeartPulse className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-slate-800 font-display">
              {t('log_weight')}
            </CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Weight Input Field */}
          <div className="relative group">
            <Scale className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 group-focus-within:text-[#EF9035] transition-colors" />
            <Input
              type="number"
              step="0.1"
              required
              placeholder={t('weight_placeholder')}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="bg-slate-50 border border-slate-200 pl-10 pr-4 py-6 rounded-xl text-slate-800 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-[#EF9035] focus:ring-4 focus:ring-[#EF9035]/10 transition-all font-semibold"
            />
          </div>

          {/* Sleep Input Field */}
          <div className="relative group">
            <Moon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 group-focus-within:text-[#EF9035] transition-colors" />
            <Input
              type="number"
              step="0.5"
              required
              placeholder={t('sleep_placeholder')}
              value={sleep}
              onChange={(e) => setSleep(e.target.value)}
              className="bg-slate-50 border border-slate-200 pl-10 pr-4 py-6 rounded-xl text-slate-800 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-[#EF9035] focus:ring-4 focus:ring-[#EF9035]/10 transition-all font-semibold"
            />
          </div>

          {/* Calories Input Field */}
          <div className="relative group">
            <Flame className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 group-focus-within:text-[#EF9035] transition-colors" />
            <Input
              type="number"
              required
              placeholder={t('calories_placeholder')}
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              className="bg-slate-50 border border-slate-200 pl-10 pr-4 py-6 rounded-xl text-slate-800 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-[#EF9035] focus:ring-4 focus:ring-[#EF9035]/10 transition-all font-semibold"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-[#EF9035] hover:bg-[#d6812f] text-white font-bold py-6 rounded-xl transition-all shadow-md active:scale-95 glow-yellow font-display text-sm tracking-wide mt-2"
          >
            {t('submit')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
