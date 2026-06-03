'use client';

import { Card, CardContent } from "@/components/ui/card";
import { SessionActiveStatus } from "../types/mock-api";

interface SessionStatusProps {
  status: SessionActiveStatus;
}

export default function SessionStatus({ status }: SessionStatusProps) {
  const progressValue = (status.currentDay / status.totalDays) * 100;

  return (
    <Card className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-0 shadow-xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#54B7F0]/10 rounded-full blur-3xl -mr-16 -mt-16" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#EF9035]/10 rounded-full blur-3xl -ml-12 -mb-12" />
      
      <CardContent className="p-6 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight font-display bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              {status.phaseName}
            </h2>
            <p className="text-slate-400 text-sm font-medium">
              Bạn đang ở ngày <span className="text-white font-bold">{status.currentDay}</span> của lộ trình {status.totalDays} ngày. Còn {status.daysRemaining} ngày.
            </p>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black mb-1">Cân nặng hiện tại</p>
              <p className="text-3xl font-black text-white leading-none">
                {status.currentWeight} <span className="text-lg text-slate-500 font-medium">kg</span>
              </p>
            </div>
            <div className="w-px h-10 bg-slate-700" />
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black mb-1">Mục tiêu Phase</p>
              <p className="text-3xl font-black text-[#54B7F0] leading-none">
                {status.targetWeight} <span className="text-lg text-[#54B7F0]/50 font-medium">kg</span>
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Tiến độ mùa giải</span>
            <span className="text-sm font-black text-[#54B7F0]">{Math.round(progressValue)}%</span>
          </div>
          <div className="relative h-3 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#54B7F0] to-[#6AE5F7] transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(84,183,240,0.4)]"
              style={{ width: `${progressValue}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
