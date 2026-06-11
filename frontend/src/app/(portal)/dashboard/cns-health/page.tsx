'use client';

import { Activity, HeartPulse, BedDouble, AlertTriangle } from 'lucide-react';
import { HeroHeader } from '@/components/shared/hero-header';
import { KpiTile } from '@/components/shared/kpi-tile';
import { ComingSoon } from '@/components/shared/coming-soon';

export default function CnsHealthPage() {
  // Placeholder demo values until backend exposes CNS metrics.
  const cnsScore = 92;
  const hrv = 64;
  const restingHr = 58;
  const sleepScore = 81;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <HeroHeader
        eyebrow="CNS · Recovery"
        title="Phục hồi"
        titleAccent="hệ thần kinh."
        subtitle="Theo dõi độ mỏi thần kinh trung ương (CNS Fatigue) qua HRV, nhịp tim nghỉ và chất lượng giấc ngủ. Cảnh báo sớm trước khi over-training."
        meta={
          <>
            <span style={{ color: '#6AE5F7' }}>● CNS hôm nay {cnsScore}%</span>
            <span>HRV {hrv} ms</span>
            <span>Resting HR {restingHr} bpm</span>
          </>
        }
      />

      {/* KPI snapshot */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile
          label="CNS hôm nay"
          value={cnsScore}
          unit="%"
          icon={Activity}
          tone="blue"
          delta={{ value: '+3% so với tuần trước', trend: 'up' }}
          spark={[78, 82, 85, 80, 88, 90, cnsScore]}
        />
        <KpiTile
          label="HRV (RMSSD)"
          value={hrv}
          unit="ms"
          icon={HeartPulse}
          tone="green"
          spark={[55, 58, 60, 59, 62, 63, hrv]}
        />
        <KpiTile
          label="Nhịp tim nghỉ"
          value={restingHr}
          unit="bpm"
          icon={HeartPulse}
          tone="red"
        />
        <KpiTile
          label="Điểm giấc ngủ"
          value={sleepScore}
          unit="%"
          icon={BedDouble}
          tone="purple"
          spark={[70, 75, 72, 80, 78, 83, sleepScore]}
        />
      </div>

      <ComingSoon
        icon={Activity}
        title="Phân hệ CNS & sức khỏe chi tiết"
        description="Khu vực này sẽ vẽ biểu đồ HRV-RHR-Sleep theo thời gian, đề xuất khối lượng tập phù hợp dựa trên hồi phục, và cảnh báo over-training."
        eta="Q3 2026"
        features={[
          'Biểu đồ HRV và RHR theo ngày (kéo từ Apple Health / Garmin / Whoop)',
          'Sleep stages chi tiết: deep, REM, light',
          'Cảnh báo CNS Fatigue khi giảm > 15% so với baseline',
          'Đề xuất volume tập tự động theo trạng thái phục hồi',
          'Đối chiếu CNS với compliance score và biến cố căng thẳng',
        ]}
      />

      {/* Light alert / disclaimer */}
      <div className="bg-[rgba(239,144,53,0.06)] border border-[rgba(239,144,53,0.20)] rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-[#EF9035] mt-0.5 shrink-0" />
        <div className="text-xs font-semibold text-muted-foreground leading-relaxed">
          Các chỉ số CNS hiện tại là dữ liệu mẫu để demo. Khi kết nối với thiết bị đo nhịp tim hoặc ứng dụng sức khoẻ,
          eFit sẽ tự động đồng bộ và tính toán theo dữ liệu thực.
        </div>
      </div>
    </div>
  );
}
