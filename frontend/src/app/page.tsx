'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import Image from 'next/image';
import { Activity, Users, Dumbbell, BarChart, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image 
            src="/images/nobg-noname.png" 
            alt="eFit Logo" 
            width={64} 
            height={64} 
            className="w-16 h-16 object-contain drop-shadow-sm" 
          />
          <span className="font-bold text-xl tracking-tight text-slate-800">eFit</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
          <Link href="#features" className="hover:text-primary transition-colors">Tính năng</Link>
          <Link href="#workflow" className="hover:text-primary transition-colors">Dành cho HLV</Link>
          <Link href="#student" className="hover:text-primary transition-colors">Dành cho Học viên</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" className="font-semibold text-slate-600">Đăng nhập</Button>
          </Link>
          <Link href="/register">
            <Button className="bg-[#54B7F0] hover:bg-[#3FA3DC] text-white font-semibold rounded-full px-6 shadow-[0_4px_14px_rgba(84,183,240,0.4)]">
              Đăng ký miễn phí
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden min-h-[100dvh] flex flex-col items-center justify-center">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#54B7F0]/10 rounded-full blur-3xl -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#EF9035]/5 rounded-full blur-3xl -z-10 translate-x-20 -translate-y-20" />
      
      <div className="max-w-7xl mx-auto px-6 text-center relative z-10 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500 mb-8 shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
          Phiên bản Beta đã sẵn sàng
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.1] text-slate-900 max-w-4xl"
        >
          Huấn luyện chuyên nghiệp. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#54B7F0] to-[#3FA3DC]">Quản lý toàn diện.</span>
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl leading-relaxed"
        >
          Nền tảng duy nhất hợp nhất chu kỳ hóa tập luyện, theo dõi dinh dưỡng và quản lý học viên dành cho Personal Trainer.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4"
        >
          <Link href="/register">
            <Button size="lg" className="bg-[#54B7F0] hover:bg-[#3FA3DC] text-white font-bold rounded-full px-8 h-14 text-base shadow-[0_8px_24px_rgba(84,183,240,0.3)] transition-transform hover:-translate-y-1">
              Bắt đầu miễn phí
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-base font-bold border-slate-200 text-slate-600 hover:bg-slate-50 transition-transform hover:-translate-y-1">
              Khám phá tính năng
            </Button>
          </Link>
        </motion.div>

        {/* Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-20 w-full max-w-5xl mx-auto rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm shadow-2xl p-2 relative"
        >
           <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent bottom-0 h-32 mt-auto rounded-b-2xl z-10" />
           <div className="w-full aspect-[16/9] bg-slate-100 rounded-xl overflow-hidden relative flex items-center justify-center">
             {/* Fake UI for visual appeal */}
             <div className="absolute inset-0 bg-white" />
             <div className="w-full h-full flex flex-col">
                <div className="h-12 border-b border-slate-100 flex items-center px-4 gap-4 bg-slate-50/50">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-slate-200" />
                    <div className="w-3 h-3 rounded-full bg-slate-200" />
                    <div className="w-3 h-3 rounded-full bg-slate-200" />
                  </div>
                  <div className="w-64 h-6 bg-white border border-slate-100 rounded-md" />
                </div>
                <div className="flex-1 p-8 flex gap-6">
                   <div className="w-64 space-y-4">
                     <div className="w-full h-24 bg-slate-50 rounded-xl border border-slate-100" />
                     <div className="w-full h-40 bg-slate-50 rounded-xl border border-slate-100" />
                   </div>
                   <div className="flex-1 space-y-6">
                     <div className="w-full h-12 bg-slate-50 rounded-xl border border-slate-100" />
                     <div className="flex gap-4">
                       <div className="flex-1 h-32 bg-[#54B7F0]/10 rounded-xl border border-[#54B7F0]/20" />
                       <div className="flex-1 h-32 bg-[#10b981]/10 rounded-xl border border-[#10b981]/20" />
                       <div className="flex-1 h-32 bg-[#EF9035]/10 rounded-xl border border-[#EF9035]/20" />
                     </div>
                     <div className="w-full h-64 bg-slate-50 rounded-xl border border-slate-100" />
                   </div>
                </div>
             </div>
           </div>
        </motion.div>
      </div>
    </section>
  );
}

function LogoWall() {
  return (
    <section className="py-12 border-y border-slate-100 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-sm font-bold tracking-widest text-slate-400 uppercase mb-8">
          Được tin dùng bởi các huấn luyện viên chuyên nghiệp
        </p>
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-40 grayscale">
           <div className="text-xl font-black tracking-tighter">FITNESS FIRST</div>
           <div className="text-xl font-black tracking-tighter">CALISTHENICS VN</div>
           <div className="text-xl font-black tracking-tighter">POWERLIFTING HUB</div>
           <div className="text-xl font-black tracking-tighter">ELITE COACH</div>
           <div className="text-xl font-black tracking-tighter">IRON TEAM</div>
        </div>
      </div>
    </section>
  );
}

function PeriodizationSection() {
  return (
    <section id="features" className="py-32 bg-background relative">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
        <div className="space-y-6">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 leading-[1.1]">
            Lập trình mùa giải, <br/>không chỉ là buổi tập.
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed max-w-[500px]">
            Thay vì gửi những file Excel rời rạc và khó theo dõi, eFit giúp bạn cấu trúc một lộ trình dài hạn thông qua các Season (Cutting, Bulking) và Phase chi tiết. Nhìn thấy bức tranh toàn cảnh để ra quyết định huấn luyện chính xác hơn.
          </p>
          <ul className="space-y-4 pt-4">
            {['Lên kế hoạch Block Training từ 4-12 tuần', 'Thiết lập mục tiêu vĩ mô (TDEE, Macro, Cân nặng)', 'Tự động tính toán ngày chuyển Phase'].map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-slate-700 font-medium">
                <CheckCircle2 className="w-6 h-6 text-[#10b981] shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative">
          <div className="aspect-[4/3] bg-white border border-slate-200 rounded-3xl shadow-xl p-8 flex flex-col gap-4 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-[#EF9035]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
             <div className="flex items-center justify-between pb-4 border-b border-slate-100">
               <div>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Season Đang chạy</p>
                 <p className="text-lg font-black text-slate-900">Summer Shredding 2026</p>
               </div>
               <div className="px-3 py-1 bg-[#10b981]/10 text-[#10b981] rounded-full text-xs font-bold">
                 Cutting
               </div>
             </div>
             
             <div className="flex-1 flex flex-col justify-center gap-3 relative z-10">
                <div className="w-full bg-[#54B7F0]/10 border border-[#54B7F0]/30 rounded-xl p-4 flex justify-between items-center relative overflow-hidden">
                   <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#54B7F0]" />
                   <div>
                     <p className="font-bold text-[#3FA3DC]">Phase 1: Hypertrophy</p>
                     <p className="text-xs text-[#54B7F0] font-medium">Tuần 1 - Tuần 4</p>
                   </div>
                   <div className="text-right">
                     <p className="text-sm font-bold text-slate-700">1800 kcal</p>
                     <p className="text-xs text-slate-500">140g P • 50g F • 190g C</p>
                   </div>
                </div>
                <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 flex justify-between items-center opacity-70">
                   <div>
                     <p className="font-bold text-slate-700">Phase 2: Strength</p>
                     <p className="text-xs text-slate-500 font-medium">Tuần 5 - Tuần 8</p>
                   </div>
                   <div className="text-right">
                     <p className="text-sm font-bold text-slate-700">1700 kcal</p>
                     <p className="text-xs text-slate-500">150g P • 45g F • 170g C</p>
                   </div>
                </div>
                <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 flex justify-between items-center opacity-40">
                   <div>
                     <p className="font-bold text-slate-700">Phase 3: Peak & Taper</p>
                     <p className="text-xs text-slate-500 font-medium">Tuần 9 - Tuần 10</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PTWorkflowSection() {
  return (
    <section id="workflow" className="py-32 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 leading-[1.1]">
            Quản lý học viên <br/>tập trung tại một nơi
          </h2>
          <p className="mt-6 text-lg text-slate-600 leading-relaxed">
            Mọi công cụ bạn cần để theo dõi, giao bài và điều chỉnh kế hoạch cho nhiều học viên mà không cần mở hàng tá tab Excel hay ứng dụng chat.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 auto-rows-[320px]">
          <div className="md:col-span-2 bg-[#f4f6fb] rounded-3xl p-8 relative overflow-hidden group">
             <div className="relative z-10 max-w-[280px]">
               <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-[#54B7F0]">
                 <Dumbbell className="w-6 h-6" />
               </div>
               <h3 className="text-2xl font-bold text-slate-900 mb-3">Giao giáo án tập & dinh dưỡng</h3>
               <p className="text-slate-600">Thao tác kéo thả các bài tập vào lịch tuần, phân bổ macro chính xác và đồng bộ thẳng tới app của học viên.</p>
             </div>
             <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-80 h-80 bg-white border border-slate-200 rounded-tl-3xl shadow-2xl p-6 group-hover:-translate-y-4 group-hover:-translate-x-4 transition-transform duration-500">
               <div className="space-y-4 opacity-50">
                 <div className="w-full h-10 bg-slate-100 rounded-lg" />
                 <div className="w-3/4 h-10 bg-slate-100 rounded-lg" />
                 <div className="w-full h-24 bg-[#54B7F0]/10 rounded-xl border border-[#54B7F0]/20" />
               </div>
             </div>
          </div>
          
          <div className="bg-slate-900 rounded-3xl p-8 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-64 h-64 bg-[#EF9035]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
             <div className="relative z-10">
               <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 text-[#EF9035]">
                 <Activity className="w-6 h-6" />
               </div>
               <h3 className="text-2xl font-bold text-white mb-3">Real-time <br/>Daily Logs</h3>
               <p className="text-slate-400">Xem ngay tạ, RPE, số set hoàn thành và calo nạp vào ngay sau khi học viên log.</p>
             </div>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-8 relative overflow-hidden group">
             <div className="relative z-10">
               <div className="w-12 h-12 bg-[#ef4444]/10 rounded-2xl flex items-center justify-center mb-6 text-[#ef4444]">
                 <BarChart className="w-6 h-6" />
               </div>
               <h3 className="text-2xl font-bold text-slate-900 mb-3">Cảnh báo chệch mục tiêu</h3>
               <p className="text-slate-600">Hệ thống tự động highlight nếu học viên tăng/giảm cân sai tốc độ của Season.</p>
             </div>
          </div>

          <div className="md:col-span-2 bg-[#10b981]/5 border border-[#10b981]/20 rounded-3xl p-8 relative overflow-hidden group">
             <div className="relative z-10 max-w-[300px]">
               <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-[#10b981]">
                 <Users className="w-6 h-6" />
               </div>
               <h3 className="text-2xl font-bold text-slate-900 mb-3">Nhận xét & Feedback</h3>
               <p className="text-slate-600">Thêm comment trực tiếp vào từng set tập hoặc cuối ngày để điều chỉnh ngay lập tức.</p>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StudentFocusSection() {
  return (
    <section id="student" className="py-32 bg-background relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
        <div className="order-2 md:order-1 relative">
          <div className="aspect-[3/4] max-w-sm mx-auto bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl p-4 flex flex-col relative overflow-hidden">
             <div className="flex-1 rounded-[2rem] border border-slate-100 bg-[#f8fafc] overflow-hidden flex flex-col">
               <div className="p-6 bg-white border-b border-slate-100">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Hôm nay</p>
                 <h4 className="text-xl font-black text-slate-900">Thứ 3, Upper Body</h4>
               </div>
               <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                 <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                   <p className="font-bold text-slate-800">1. Bench Press</p>
                   <div className="mt-3 space-y-2">
                     <div className="flex items-center gap-2 text-sm">
                       <span className="w-6 text-slate-400 font-mono">1</span>
                       <div className="flex-1 h-8 bg-slate-50 rounded px-2 flex items-center border border-slate-100 text-slate-600 font-mono">80kg x 8</div>
                       <div className="w-12 h-8 bg-slate-50 rounded flex items-center justify-center border border-slate-100 text-slate-600 font-mono text-xs">@8</div>
                     </div>
                     <div className="flex items-center gap-2 text-sm">
                       <span className="w-6 text-slate-400 font-mono">2</span>
                       <div className="flex-1 h-8 bg-[#10b981]/10 rounded px-2 flex items-center border border-[#10b981]/20 text-[#10b981] font-mono font-bold">82.5kg x 8</div>
                       <div className="w-12 h-8 bg-[#10b981]/10 rounded flex items-center justify-center border border-[#10b981]/20 text-[#10b981] font-mono font-bold text-xs">@9</div>
                     </div>
                   </div>
                 </div>
                 
                 <div className="bg-[#EF9035]/10 border border-[#EF9035]/20 rounded-xl p-4 flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#EF9035]">
                     <Activity className="w-5 h-5" />
                   </div>
                   <div>
                     <p className="text-sm font-bold text-[#D6812F]">Calo: 1850 / 2200</p>
                     <p className="text-xs text-[#EF9035] mt-0.5">Còn 350 kcal</p>
                   </div>
                 </div>
               </div>
             </div>
          </div>
        </div>
        
        <div className="order-1 md:order-2 space-y-6">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 leading-[1.1]">
            App tập luyện mà <br/>học viên muốn dùng.
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed max-w-[500px]">
            Ghi chép set/rep, RPE, tempo và nhật ký dinh dưỡng hàng ngày dễ dàng trên giao diện tối giản. Chào tạm biệt những ghi chú lộn xộn ở app Notes.
          </p>
          <ul className="space-y-4 pt-4">
            <li className="flex items-start gap-3 text-slate-700 font-medium">
              <CheckCircle2 className="w-6 h-6 text-[#54B7F0] shrink-0" />
              Giao diện logging siêu tốc tại phòng gym
            </li>
            <li className="flex items-start gap-3 text-slate-700 font-medium">
              <CheckCircle2 className="w-6 h-6 text-[#54B7F0] shrink-0" />
              Calendar Heatmap theo dõi sự kiên trì
            </li>
            <li className="flex items-start gap-3 text-slate-700 font-medium">
              <CheckCircle2 className="w-6 h-6 text-[#54B7F0] shrink-0" />
              Xem lịch sử mức tạ (1RM) từng bài tập
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-32 bg-slate-900 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-[#54B7F0]/20 rounded-full blur-3xl -z-10" />
      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white leading-[1.1] mb-8">
          Sẵn sàng nâng tầm <br/>dịch vụ Coaching của bạn?
        </h2>
        <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto">
          Tham gia cùng các PT tiên phong đang sử dụng eFit để quản lý chuyên nghiệp, tiết kiệm thời gian và giúp học viên đạt kết quả tốt nhất.
        </p>
        <Link href="/register">
          <Button size="lg" className="bg-[#54B7F0] hover:bg-[#3FA3DC] text-white font-bold rounded-full px-12 h-16 text-lg shadow-[0_8px_32px_rgba(84,183,240,0.4)] transition-transform hover:-translate-y-1">
            Đăng ký tài khoản PT
          </Button>
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <Image 
            src="/images/nobg-noname.png" 
            alt="eFit Logo" 
            width={48} 
            height={48} 
            className="w-12 h-12 object-contain drop-shadow-sm" 
          />
          <span className="font-bold text-lg tracking-tight text-slate-800">eFit</span>
        </div>
        <div className="text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} eFit Platform. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 flex flex-col font-sans">
      <Nav />
      <main className="flex-1">
        <HeroSection />
        <LogoWall />
        <PeriodizationSection />
        <PTWorkflowSection />
        <StudentFocusSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
