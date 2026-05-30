'use client';

import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileSidebarOpen(prev => !prev);
    } else {
      setSidebarOpen(prev => !prev);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8fafc] text-slate-800 font-sans">
      
      {/* 1. Desktop Sidebar (Persistent left side with smooth slide transition) */}
      <div 
        className="hidden lg:block h-full border-r border-[#e8f4fc] bg-white transition-all duration-300 ease-in-out overflow-hidden shrink-0"
        style={{ 
          width: sidebarOpen ? '280px' : '0px', 
          opacity: sidebarOpen ? 1 : 0,
          borderRightWidth: sidebarOpen ? '1px' : '0px'
        }}
      >
        <div className="w-[280px] h-full">
          <Sidebar />
        </div>
      </div>

      {/* 2. Mobile Sidebar (Slide-out drawer with backdrop blur) */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          
          {/* Dark overlay backdrop */}
          <div 
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
          />
          
          {/* Sliding sidebar container */}
          <div className="relative flex w-[280px] max-w-[80vw] flex-1 flex-col bg-white animate-in slide-in-from-left duration-300">
            <Sidebar onCloseMobile={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* 3. Main content viewport wrapper (Topbar + Scrollable content canvas) */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        
        {/* Main Header / Top Navigation bar */}
        <Topbar 
          sidebarOpen={sidebarOpen}
          onToggleSidebar={handleToggleSidebar} 
          serverStatus="online"
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
          
          {/* Subtle sport text watermark ("DISCIPLINE") in the canvas background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0">
            <div className="font-display font-black italic tracking-tighter text-[#54B7F0]/[0.02] uppercase text-[15vw] rotate-[-12deg] transform select-none">
              DISCIPLINE
            </div>
          </div>

          <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
