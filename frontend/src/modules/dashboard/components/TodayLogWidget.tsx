'use client';

import { useDailyLogs } from '@/hooks/useDailyLogs';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Edit3, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TodayLogWidget() {
  const { data: logsPage, isLoading } = useDailyLogs(1); // dummy user_id=1
  const router = useRouter();

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const logs = logsPage?.data || [];
  const todayLog = logs.find(l => String(l.log_date) === todayStr);

  if (isLoading) return null;

  return (
    <div className="bg-card border shadow-sm rounded-2xl p-5 md:p-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h3 className="font-display font-extrabold text-xl text-foreground flex items-center gap-2">
          {todayLog ? (
            <>
               <CheckCircle2 className="w-6 h-6 text-efit-green" /> 
               Bạn đã hoàn thành nhật ký hôm nay!
            </>
          ) : (
            'Hôm nay bạn thế nào?'
          )}
        </h3>
        <p className="text-muted-foreground text-sm font-medium mt-1">
          {todayLog 
             ? `Điểm tuân thủ: ${todayLog.compliance_score ?? '-'}%`
             : 'Đừng quên ghi nhận lại Cân nặng, Dinh dưỡng và Tập luyện để bám sát lộ trình nhé.'}
        </p>
      </div>

      <Button 
        className={cn("shadow-sm shrink-0", !todayLog && "bg-efit-blue hover:bg-efit-blue/90 text-white")}
        variant={todayLog ? "outline" : "default"}
        onClick={() => router.push('/dashboard/daily-logs')}
      >
        {todayLog ? <Edit3 className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
        {todayLog ? 'Sửa nhật ký' : 'Nhập nhật ký ngay'}
      </Button>
    </div>
  );
}
