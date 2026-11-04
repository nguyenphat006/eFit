import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Học viên',
  description: 'Quản lý danh sách học viên của bạn.',
};

export default function ClientsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
