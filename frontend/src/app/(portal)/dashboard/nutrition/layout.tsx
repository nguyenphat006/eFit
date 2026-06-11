import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dinh dưỡng',
  description: 'Thư viện thực phẩm với calo và macro chuẩn — hơn 1000+ món Việt và quốc tế.',
};

export default function NutritionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
