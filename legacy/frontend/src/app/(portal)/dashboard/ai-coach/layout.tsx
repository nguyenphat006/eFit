import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trợ lý AI',
  description:
    'Trò chuyện với AI Coach về tập luyện, dinh dưỡng và phục hồi. Cá nhân hóa theo nhật ký của bạn.',
};

export default function AiCoachLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
