import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Dumbbell } from 'lucide-react';

export default function WorkoutsPage() {
  return (
    <div className="space-y-6">
      <Card className="border border-[#e8f4fc] shadow-sm">
        <CardHeader className="flex flex-row items-center gap-4 bg-slate-50/50 border-b border-[#e8f4fc] p-6">
          <div className="w-12 h-12 rounded-xl bg-[#54B7F0]/10 flex items-center justify-center text-[#54B7F0] shrink-0">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-slate-800 font-display">Lịch tập luyện chu kỳ AI</CardTitle>
            <CardDescription className="text-xs font-semibold text-slate-400 mt-1">
              Phân hệ quản lý và thiết lập lịch tập chu kỳ tối ưu cho thần kinh và cơ bắp.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="p-10 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center">
            <p className="text-sm font-bold text-slate-600">Đang phát triển phân hệ Lịch tập luyện...</p>
            <p className="text-xs text-slate-400 mt-2 max-w-sm font-semibold">
              Các giải thuật tính toán CNS Fatigue và tối ưu hóa Volume sẽ được liên kết trực tiếp tại đây ở các bước tiếp theo.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
