import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mùa giải',
  description:
    'Quản lý chu kỳ tập luyện theo mục tiêu (Bulking, Cutting, Recomp, Maintaining). Chia mỗi mùa giải thành nhiều Phase nhỏ.',
};

export default function SessionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
