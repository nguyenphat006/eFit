import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Utensils } from 'lucide-react';

export default function NutritionPage() {
  return (
    <div className="space-y-6">
      <Card className="border border-[#e8f4fc] shadow-sm">
        <CardHeader className="flex flex-row items-center gap-4 bg-slate-50/50 border-b border-[#e8f4fc] p-6">
          <div className="w-12 h-12 rounded-xl bg-[#EF9035]/10 flex items-center justify-center text-[#EF9035] shrink-0">
            <Utensils className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-slate-800 font-display">Kế hoạch dinh dưỡng thông minh</CardTitle>
            <CardDescription className="text-xs font-semibold text-slate-400 mt-1">
              Phân hệ thiết lập bữa ăn và kiểm soát Calo/Macro tối ưu cho mục tiêu thể trạng của bạn.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="p-10 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center">
            <p className="text-sm font-bold text-slate-600">Đang phát triển phân hệ Kế hoạch dinh dưỡng...</p>
            <p className="text-xs text-slate-400 mt-2 max-w-sm font-semibold">
              Các tính năng gợi ý thực đơn thích ứng theo logo vàng năng lượng của eFit sẽ hiển thị tại đây ở bước kế tiếp.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
