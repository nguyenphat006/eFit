'use client';

import { 
  mockSessionStatus, 
  mockCompliance, 
  mockCorrelationChart, 
  mockAIInsights 
} from './types/mock-api';
import SessionStatus from './components/SessionStatus';
import ComplianceDonut from './components/ComplianceDonut';
import CorrelationChart from './components/CorrelationChart';
import AIInsightsList from './components/AIInsightsList';

interface DashboardViewProps {
  initialData: unknown;
}

export default function DashboardView({ initialData }: DashboardViewProps) {
  // initialData logic preserved for server-side compatibility if needed in future
  // @ts-expect-error - initialData status property check
  console.log('Dashboard Initial Data Status:', initialData?.status);

  return (
    <div className="space-y-8 flex flex-col pb-10">
      
      {/* 1. KHỐI TỔNG QUAN CHU KỲ (Current Session Status) */}
      <SessionStatus status={mockSessionStatus} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. KHỐI CHỈ SỐ KỶ LUẬT (Compliance Dashboard) */}
        <div className="lg:col-span-1">
          <ComplianceDonut stats={mockCompliance} />
        </div>

        {/* 3. KHỐI TƯƠNG QUAN DINH DƯỠNG & THỂ CHẤT (Correlation Analytics) */}
        <div className="lg:col-span-2">
          <CorrelationChart data={mockCorrelationChart} />
        </div>
      </div>

      {/* 4. KHỐI DỰ BÁO & KHUYẾN NGHỊ TỪ TRỢ LÝ AI (AI Insights) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="size-2 bg-[#54B7F0] rounded-full animate-pulse" />
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">
            Dự báo & Khuyến nghị từ AI
          </h3>
        </div>
        <AIInsightsList insights={mockAIInsights} />
      </div>
    </div>
  );
}
