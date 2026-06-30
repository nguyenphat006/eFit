import { Client } from '@/types/client';
import { ComingSoon } from '@/components/shared/coming-soon';
import { LineChart, BarChart3 } from 'lucide-react';

interface ClientMetricsTabProps {
  client: Client;
}

export default function ClientMetricsTab({ client }: ClientMetricsTabProps) {
  return (
    <div className="space-y-4">
      <div className="bg-card rounded-2xl border shadow-sm p-6">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <LineChart className="w-5 h-5 text-[#54B7F0]" />
          Biểu đồ cân nặng
        </h3>
        <ComingSoon 
          title="Tính năng biểu đồ đang được phát triển" 
          description="Sắp tới PT có thể theo dõi biểu đồ thay đổi cân nặng và lượng mỡ cơ thể của học viên qua các tuần."
          icon={<LineChart className="w-12 h-12 text-slate-300" />}
        />
      </div>

      <div className="bg-card rounded-2xl border shadow-sm p-6">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#54B7F0]" />
          Số đo cơ thể
        </h3>
        <ComingSoon 
          title="Chưa có dữ liệu số đo" 
          description="Tính năng ghi nhận các số đo vòng ngực, eo, mông đang trong lộ trình phát triển."
          icon={<BarChart3 className="w-12 h-12 text-slate-300" />}
        />
      </div>
    </div>
  );
}
