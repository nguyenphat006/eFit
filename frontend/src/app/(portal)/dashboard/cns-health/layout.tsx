import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CNS & Sức khỏe',
  description:
    'Theo dõi độ mỏi thần kinh trung ương (CNS Fatigue), HRV, nhịp tim nghỉ và chất lượng giấc ngủ.',
};

export default function CnsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
