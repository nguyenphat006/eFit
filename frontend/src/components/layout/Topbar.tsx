'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  Bell,
  Activity,
  Sparkles,
  PanelLeftClose,
  PanelLeft,
  ChevronRight
} from 'lucide-react';
import { useSidebar, SidebarTrigger } from '@/components/ui/sidebar';

interface TopbarProps {
  serverStatus?: string;
}

export default function Topbar({ serverStatus = 'online' }: TopbarProps) {
  const pathname = usePathname();
  const { toggleSidebar, state } = useSidebar();
  const sidebarOpen = state === "expanded";

  // Dynamic breadcrumb labels mapping
  const getBreadcrumbLabel = (segment: string) => {
    switch (segment) {
      case 'dashboard':
        return 'Bảng điều khiển';
      case 'workouts':
        return 'Lịch tập luyện';
      case 'nutrition':
        return 'Nhật ký dinh dưỡng';
      case 'cns-health':
        return 'CNS & Sức khỏe';
      case 'ai-coach':
        return 'Trợ lý AI';
      case 'settings':
        return 'Cài đặt';
      default:
        return segment;
    }
  };

  // Generate breadcrumb items dynamically based on pathname
  const generateBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs = [
      { name: 'eFit', href: '/dashboard', current: paths.length === 0 }
    ];

    let currentHref = '';
    paths.forEach((path, index) => {
      currentHref += `/${path}`;
      // Prevent duplicating dashboard in path matching if it's the only one
      if (path === 'dashboard' && index === 0) {
        breadcrumbs[0] = { name: 'eFit', href: '/dashboard', current: false };
        breadcrumbs.push({
          name: 'Bảng điều khiển',
          href: '/dashboard',
          current: index === paths.length - 1
        });
      } else {
        breadcrumbs.push({
          name: getBreadcrumbLabel(path),
          href: currentHref,
          current: index === paths.length - 1
        });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <header className="h-16 border-b border-[#e8f4fc] bg-white flex items-center justify-between px-6 z-10 sticky top-0 shadow-sm">

      {/* Left side: Panel Toggle Button + Dynamic Breadcrumbs */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-50 border border-slate-100 hover:text-[#54B7F0] hover:border-[#54B7F0]/30 transition-all active:scale-95"
          title={sidebarOpen ? "Thu gọn Sidebar" : "Mở rộng Sidebar"}
        >
          {sidebarOpen ? (
            <PanelLeftClose className="w-5 h-5" />
          ) : (
            <PanelLeft className="w-5 h-5" />
          )}
        </button>

        {/* Dynamic Breadcrumbs */}
        <nav className="flex items-center text-xs font-semibold text-slate-400 font-display select-none">
          {breadcrumbs.map((item, index) => (
            <div key={`${item.href}-${index}`} className="flex items-center">
              {index > 0 && <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-300 shrink-0" />}
              {item.current ? (
                <span className="text-slate-800 font-extrabold text-sm transition-all duration-300">
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-[#54B7F0] transition-colors duration-200"
                >
                  {item.name}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Center side: Premium AI Command / Search Bar (Desktop only) */}
      <div className="hidden md:flex items-center w-full max-w-[360px] relative group">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 group-focus-within:text-[#54B7F0] transition-colors" />
        <input
          type="text"
          placeholder="Hỏi AI Coach hoặc tìm tính năng..."
          className="w-full bg-slate-50 border border-slate-200/80 rounded-full pl-10 pr-4 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#54B7F0] focus:ring-4 focus:ring-[#54B7F0]/10 transition-all duration-300"
        />
        <div className="absolute right-3 bg-gradient-to-r from-[#54B7F0]/20 to-[#EF9035]/20 text-[#54B7F0] text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 select-none pointer-events-none group-focus-within:opacity-0 transition-opacity">
          <Sparkles className="w-2.5 h-2.5" />
          <span>Lệnh AI</span>
        </div>
      </div>

      {/* Right side: CNS Status Pill + Notifications + Server Status */}
      <div className="flex items-center gap-4 shrink-0">

        {/* CNS Readiness Status Pill */}
        <div className="flex items-center gap-2 bg-[#54B7F0]/5 border border-[#54B7F0]/20 px-3 py-1.5 rounded-full text-xs font-bold text-[#54B7F0] select-none hover:bg-[#54B7F0]/10 transition-colors relative group">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#54B7F0] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#54B7F0]"></span>
          </div>
          <Activity className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">CNS: </span>
          <span>92% (Tốt)</span>

          {/* Tooltip */}
          <div className="absolute top-10 right-0 w-64 bg-slate-800 text-white text-[11px] p-2.5 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-lg z-50">
            Hệ thần kinh của bạn đã phục hồi rất tốt! Thích hợp cho các bài tập nặng cường độ cao hôm nay.
          </div>
        </div>

        {/* Notifications Icon Button */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/50 text-slate-500 hover:text-slate-800 transition-all active:scale-95">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#EF9035] rounded-full border border-white"></span>
        </button>

        {/* Server Status Indicators */}
        <div className="hidden sm:flex items-center gap-1 text-[10px] text-emerald-500 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg font-bold uppercase select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{serverStatus}</span>
        </div>
      </div>
    </header>
  );
}
