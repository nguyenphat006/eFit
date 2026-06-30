import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chi tiết học viên',
  description: 'Thông tin cá nhân, mùa giải và nhật ký của học viên.',
};

export default function ClientDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
