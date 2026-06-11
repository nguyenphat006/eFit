import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nhật ký hằng ngày',
  description:
    'Ghi nhật ký cân nặng, dinh dưỡng, buổi tập, giấc ngủ. Compliance Score tự động tính theo từng ngày.',
};

export default function DailyLogsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
