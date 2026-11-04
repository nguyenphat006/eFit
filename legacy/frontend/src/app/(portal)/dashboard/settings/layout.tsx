import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cài đặt',
  description: 'Hồ sơ cá nhân, chỉ số cơ thể và tuỳ chỉnh tài khoản eFit.',
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
