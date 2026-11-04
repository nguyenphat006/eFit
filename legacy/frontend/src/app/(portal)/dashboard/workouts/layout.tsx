import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lịch tập luyện',
  description:
    'Thiết kế và quản lý chu kỳ tập luyện (Periodization) — giáo án PPL, Upper/Lower, 5/3/1.',
};

export default function WorkoutsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
