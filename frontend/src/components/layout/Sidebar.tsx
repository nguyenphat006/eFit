'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Dumbbell, 
  Utensils, 
  Activity, 
  Bot, 
  Settings, 
  LogOut,
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuthStore } from '@/hooks/useAuthStore';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export default function Sidebar({ onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { user, logout } = useAuthStore();

  const menuItems = [
    {
      name: 'Bảng điều khiển',
      href: '/dashboard',
      icon: LayoutDashboard,
      color: 'hover:text-[#54B7F0]',
      glowClass: 'glow-ocean',
    },
    {
      name: 'Nhật ký tập luyện',
      href: '/dashboard/workouts',
      icon: Dumbbell,
      color: 'hover:text-[#EF9035]',
      glowClass: 'glow-yellow',
    },
    {
      name: 'Nhật ký dinh dưỡng',
      href: '/dashboard/nutrition',
      icon: Utensils,
      color: 'hover:text-[#54B7F0]',
      glowClass: 'glow-ocean',
    },
    {
      name: 'Bài test & Fitness',
      href: '/dashboard/tests',
      icon: ClipboardList,
      color: 'hover:text-[#EF9035]',
      glowClass: 'glow-yellow',
    },
    {
      name: 'CNS & Sức khỏe',
      href: '/dashboard/cns-health',
      icon: Activity,
      color: 'hover:text-[#54B7F0]',
      glowClass: 'glow-ocean',
    },
    {
      name: 'eFit AI Coach',
      href: '/dashboard/ai-coach',
      icon: Bot,
      color: 'hover:text-[#EF9035]',
      glowClass: 'glow-yellow',
    },
    {
      name: 'Cài đặt hệ thống',
      href: '/dashboard/settings',
      icon: Settings,
      color: 'hover:text-[#54B7F0]',
      glowClass: 'glow-ocean',
    },
  ];

  const handleLogout = () => {
    logout();
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    if (onCloseMobile) onCloseMobile();
    router.push('/login');
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const words = name.split(' ');
    if (words.length >= 2) {
      return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <ShadcnSidebar collapsible="icon" className="border-r border-[#e8f4fc] shadow-sm z-20 bg-white">
      <SidebarHeader className="p-6 flex flex-col items-center justify-center border-b border-[#e8f4fc] relative overflow-hidden bg-white group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:py-4">
        {/* Heartbeat radial glow behind logo */}
        <div className="absolute w-28 h-28 rounded-full bg-[#54B7F0]/10 blur-2xl animate-heartbeat -z-10 group-data-[collapsible=icon]:hidden" />
        
        <Link href="/dashboard" className="relative group block" onClick={onCloseMobile}>
          <Image
            src="/images/no-name-no-bg.png"
            alt="eFit Logo"
            width={120}
            height={120}
            priority
            className="object-contain transition-transform duration-300 group-hover:scale-105 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8"
          />
        </Link>
      </SidebarHeader>

      <SidebarContent className="bg-white">
        <nav className="flex-1 px-4 group-data-[collapsible=icon]:px-1 py-6 space-y-2 overflow-y-auto custom-scrollbar overflow-x-hidden">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Tooltip key={item.href} delayDuration={0}>
                <TooltipTrigger render={
                  <Link
                    href={item.href}
                    onClick={onCloseMobile}
                    className={`flex items-center justify-between px-4 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center py-3.5 group-data-[collapsible=icon]:py-2 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 rounded-xl text-sm font-semibold transition-all duration-300 group relative ${
                      isActive
                        ? 'bg-[#54B7F0]/10 text-[#54B7F0] border-l-4 border-[#54B7F0] group-data-[collapsible=icon]:border-l-0 group-data-[collapsible=icon]:bg-[#54B7F0] group-data-[collapsible=icon]:text-white'
                        : 'text-[#475569] hover:bg-slate-50 group-data-[collapsible=icon]:hover:bg-slate-100'
                    } ${item.glowClass}`}
                  />
                }>
                  <div className="flex items-center gap-3.5 group-data-[collapsible=icon]:gap-0">
                    <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${
                      isActive ? 'text-[#54B7F0] group-data-[collapsible=icon]:text-white' : 'text-slate-400 group-hover:text-slate-600 group-data-[collapsible=icon]:text-slate-500'
                    }`} />
                    <span className="group-data-[collapsible=icon]:hidden">{item.name}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform duration-300 group-data-[collapsible=icon]:hidden ${
                    isActive ? 'text-[#54B7F0] translate-x-0.5' : 'text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5'
                  }`} />
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right" className="font-semibold ml-2 z-[100]">
                    {item.name}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </nav>
      </SidebarContent>

      <SidebarFooter className="p-4 group-data-[collapsible=icon]:p-1 border-t border-[#e8f4fc] bg-slate-50/50">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:gap-0 p-2 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:border-none group-data-[collapsible=icon]:shadow-none bg-white rounded-2xl border border-[#e8f4fc] shadow-sm relative group">
          <div className="w-10 h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:rounded-lg rounded-xl bg-gradient-to-tr from-[#54B7F0] to-[#EF9035] flex items-center justify-center text-white font-display font-bold text-sm shadow-inner shrink-0 group-data-[collapsible=icon]:mx-auto cursor-pointer">
            {getInitials(user?.full_name || 'User')}
          </div>
          
          <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
            <h4 className="text-xs font-bold text-slate-800 truncate font-display">
              {user?.full_name || 'Đang tải...'}
            </h4>
            <span className="text-[10px] font-bold text-[#EF9035] bg-[#EF9035]/10 px-2 py-0.5 rounded-full inline-block mt-0.5 uppercase tracking-wide">
              {user?.role?.name || 'Học Viên Pro'}
            </span>
          </div>

          <button
            onClick={handleLogout}
            title="Đăng xuất"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors duration-200 shrink-0 group-data-[collapsible=icon]:hidden"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </SidebarFooter>
    </ShadcnSidebar>
  );
}
