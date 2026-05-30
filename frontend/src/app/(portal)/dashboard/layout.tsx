'use client';

import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider className="flex h-screen w-full overflow-hidden bg-[#f8fafc] text-slate-800 font-sans">
      
      {/* Shadcn Sidebar Wrapper */}
      <Sidebar />

      {/* Main content viewport wrapper (Topbar + Scrollable content canvas) */}
      <SidebarInset className="flex flex-1 flex-col min-w-0 bg-transparent rounded-none border-none shadow-none m-0 overflow-hidden">
        
        {/* Main Header / Top Navigation bar */}
        <Topbar serverStatus="online" />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
          
          {/* Subtle sport text watermark ("DISCIPLINE") in the canvas background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0">
            <div className="font-display font-black italic tracking-tighter text-[#54B7F0]/[0.02] uppercase text-[15vw] rotate-[-12deg] transform select-none">
              DISCIPLINE
            </div>
          </div>

          <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full h-full">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
