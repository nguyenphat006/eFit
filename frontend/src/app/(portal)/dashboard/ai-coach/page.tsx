'use client';

import { Bot, Sparkles, MessageCircle, Brain, ImageIcon } from 'lucide-react';
import { HeroHeader } from '@/components/shared/hero-header';
import { KpiTile } from '@/components/shared/kpi-tile';
import { ComingSoon } from '@/components/shared/coming-soon';

export default function AiCoachPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <HeroHeader
        eyebrow="AI Coach · Personal"
        title="Trợ lý AI"
        titleAccent="của riêng bạn."
        subtitle="Hỏi đáp 24/7 về tập luyện, dinh dưỡng, phục hồi. AI Coach phân tích dữ liệu cá nhân hoá từ mùa giải và nhật ký hằng ngày của bạn để đưa ra lời khuyên cụ thể."
      />

      {/* Quick KPI snapshot (placeholder until chat ships) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile label="Tin nhắn tuần này" value={0} icon={MessageCircle} tone="blue" />
        <KpiTile label="Đề xuất từ AI" value={0} icon={Sparkles} tone="orange" />
        <KpiTile label="Phân tích đã chạy" value={0} icon={Brain} tone="purple" />
        <KpiTile label="Ảnh body đã đọc" value={0} icon={ImageIcon} tone="green" />
      </div>

      <ComingSoon
        icon={Bot}
        title="Khu chat trợ lý AI"
        description="Trò chuyện trực tiếp với AI Coach. Mọi gợi ý đều có badge ✨, kèm lý do chuyên môn, và bạn luôn có quyền sửa/bỏ qua."
        eta="Q2 2026"
        features={[
          'Chat realtime với streaming response (Inter font, không emoji decorative)',
          'AI Coach tự đọc context: mùa giải hiện tại + phase + 7 ngày log gần nhất',
          'Phân tích ảnh body check-in → đánh giá thay đổi vóc dáng',
          'Đề xuất chỉnh deficit/protein khi compliance giảm hoặc cân không hạ',
          'Lịch sử trò chuyện theo chủ đề: dinh dưỡng, kỹ thuật, phục hồi',
        ]}
      />
    </div>
  );
}
