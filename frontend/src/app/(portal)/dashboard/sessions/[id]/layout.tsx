import type { Metadata } from 'next';

// Server-side metadata for the detail page. The actual session name is set
// client-side via usePageMeta() so the browser tab + breadcrumb stay in sync
// with the loaded data.
export const metadata: Metadata = {
  title: 'Chi tiết mùa giải',
  description: 'Roadmap các giai đoạn (Phase), tiến độ tập luyện và nhật ký hằng ngày.',
};

export default function SessionDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
