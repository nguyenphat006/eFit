import DashboardView from '@/modules/dashboard/dashboard-index';

export const metadata = {
  title: 'Bảng điều khiển',
  description: 'Tổng quan hôm nay — buổi tập, dinh dưỡng, tiến độ mùa giải, và đề xuất từ AI Coach.',
};

export default function DashboardPage() {
  return <DashboardView />;
}
