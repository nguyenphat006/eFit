import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Thư viện Bài tập',
  description: 'Quản lý danh sách các bài tập dùng trong giáo án',
};

export default function ExercisesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
