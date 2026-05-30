import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Activity } from 'lucide-react';

export default function CnsHealthPage() {
  return (
    <div className="space-y-6">
      <Card className="border border-[#e8f4fc] shadow-sm">
        <CardHeader className="flex flex-row items-center gap-4 bg-slate-50/50 border-b border-[#e8f4fc] p-6">
          <div className="w-12 h-12 rounded-xl bg-[#54B7F0]/10 flex items-center justify-center text-[#54B7F0] shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-slate-800 font-display">Đánh giá CNS & Sức khỏe</CardTitle>
            <CardDescription className="text-xs font-semibold text-slate-400 mt-1">
              Hệ thống theo dõi độ mỏi thần kinh trung ương (CNS Fatigue) và phân tích chỉ số phục hồi nâng cao.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="p-10 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center">
            <p className="text-sm font-bold text-slate-600">Đang phát triển phân hệ Đánh giá CNS & Sức khỏe...</p>
            <p className="text-xs text-slate-400 mt-2 max-w-sm font-semibold">
              Các chỉ số HRV, nhịp tim nghỉ ngơi RHR, và biểu đồ phục hồi thần kinh sẽ được vẽ chi tiết tại đây.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
