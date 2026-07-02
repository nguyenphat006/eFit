'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { clientService } from '@/services/api/clientService';
import { Client } from '@/types/client';
import { usePageMeta } from '@/hooks/usePageMeta';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ClientProfileCard from './components/ClientProfileCard';
import ClientInfoTab from './components/ClientInfoTab';
import ClientSessionsTab from './components/ClientSessionsTab';
import ClientDailyLogsTab from './components/ClientDailyLogsTab';
import ClientMetricsTab from './components/ClientMetricsTab';
import AssignTemplateSheet from '../../sessions/components/AssignTemplateSheet';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = Number(params.id);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  usePageMeta({ 
    breadcrumb: client ? client.full_name : `Học viên #${clientId}`,
    title: client ? `${client.full_name} - Hồ sơ` : 'Chi tiết học viên'
  });

  useEffect(() => {
    clientService.getClient(clientId)
      .then(res => setClient(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [clientId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#54B7F0]" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex-1 p-8 text-center">
        <h2 className="text-xl font-bold text-slate-800">Không tìm thấy học viên</h2>
        <p className="text-slate-500 mt-2">Học viên này không tồn tại hoặc bạn không có quyền truy cập.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column: Sticky Profile Card */}
        <div className="w-full lg:w-[320px] shrink-0">
          <ClientProfileCard 
            client={client}
            onEdit={() => setActiveTab('info')}
            onAssignTemplate={() => setIsAssignOpen(true)}
          />
        </div>

        {/* Right Column: Tabs */}
        <div className="flex-1 w-full min-w-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6 bg-slate-100/50 p-1 rounded-xl">
              <TabsTrigger value="info" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Thông tin
              </TabsTrigger>
              <TabsTrigger value="sessions" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Mùa giải
              </TabsTrigger>
              <TabsTrigger value="logs" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Nhật ký
              </TabsTrigger>
              <TabsTrigger value="metrics" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Đo lường
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="m-0 border-none p-0 outline-none">
              <ClientInfoTab client={client} onUpdate={setClient} />
            </TabsContent>

            <TabsContent value="sessions" className="m-0 border-none p-0 outline-none">
              <ClientSessionsTab clientId={clientId} />
            </TabsContent>

            <TabsContent value="logs" className="m-0 border-none p-0 outline-none">
              <ClientDailyLogsTab clientId={clientId} />
            </TabsContent>

            <TabsContent value="metrics" className="m-0 border-none p-0 outline-none">
              <ClientMetricsTab client={client} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <AssignTemplateSheet 
        isOpen={isAssignOpen} 
        onClose={() => setIsAssignOpen(false)} 
        client={client as any}
        onSuccess={() => {
          setIsAssignOpen(false);
          // router.refresh() doesn't work well with client-side fetch, better to force reload or re-fetch tab
          window.location.reload();
        }}
      />
    </div>
  );
}
