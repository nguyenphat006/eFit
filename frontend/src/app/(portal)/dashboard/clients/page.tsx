'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserPlus, Users, Search, MoreHorizontal, Pencil, Archive,
  Phone, Mail, Target, Weight,
} from 'lucide-react';
import { HeroHeader } from '@/components/shared/hero-header';
import { KpiTile } from '@/components/shared/kpi-tile';
import { StatusPill } from '@/components/shared/status-pill';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { ClientFormSheet } from './components/ClientFormSheet';
import { clientService } from '@/services/api/clientService';
import { ClientListItem, ClientCreate } from '@/types/client';

const GOAL_LABELS: Record<string, string> = {
  Cutting: 'Siết cơ',
  Bulking: 'Tăng cơ',
  Recomp: 'Recomp',
  Maintaining: 'Duy trì',
};

const GOAL_TONES: Record<string, 'blue' | 'orange' | 'green' | 'red' | 'purple' | 'neutral'> = {
  Cutting: 'red',
  Bulking: 'blue',
  Recomp: 'purple',
  Maintaining: 'green',
};

const STATUS_TONES: Record<string, 'blue' | 'orange' | 'green' | 'red' | 'purple' | 'neutral'> = {
  Active: 'green',
  Inactive: 'orange',
  Archived: 'neutral',
};

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Sheet state
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientListItem | null>(null);

  // Confirm dialog state
  const [archiveTarget, setArchiveTarget] = useState<ClientListItem | null>(null);

  const fetchClients = useCallback(async (pageNum: number, searchTerm: string) => {
    setIsLoading(true);
    try {
      const res = await clientService.listClients(pageNum, 20, undefined, searchTerm || undefined);
      setClients(res.data);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients(page, search);
  }, [page, fetchClients]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchClients(1, search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchClients]);

  const handleCreate = () => {
    setEditingClient(null);
    setIsSheetOpen(true);
  };

  const handleEdit = (client: ClientListItem) => {
    setEditingClient(client);
    setIsSheetOpen(true);
  };

  const handleSave = async (data: ClientCreate) => {
    if (editingClient) {
      await clientService.updateClient(editingClient.id, data);
    } else {
      await clientService.createClient(data);
    }
    fetchClients(page, search);
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;
    await clientService.deleteClient(archiveTarget.id);
    setArchiveTarget(null);
    fetchClients(page, search);
  };

  // KPI data
  const activeCount = clients.filter(c => c.status === 'Active').length;
  const cuttingCount = clients.filter(c => c.fitness_goal === 'Cutting').length;
  const bulkingCount = clients.filter(c => c.fitness_goal === 'Bulking').length;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <HeroHeader
        eyebrow="Quản lý · Học viên"
        title="Danh sách"
        titleAccent="học viên."
        subtitle="Quản lý hồ sơ thể chất và theo dõi tiến trình của học viên."
        action={
          <Button
            onClick={handleCreate}
            className="bg-[#54B7F0] hover:bg-[#3FA3DC] text-white font-extrabold shadow-button-blue"
          >
            <UserPlus className="w-4 h-4 mr-2" /> Thêm học viên
          </Button>
        }
        meta={
          <>
            <span>{total} học viên</span>
            <span>{activeCount} đang hoạt động</span>
          </>
        }
      />

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile label="Tổng học viên" value={total} icon={Users} tone="blue" />
        <KpiTile label="Đang hoạt động" value={activeCount} icon={Users} tone="green" />
        <KpiTile label="Đang Cutting" value={cuttingCount} icon={Target} tone="red" />
        <KpiTile label="Đang Bulking" value={bulkingCount} icon={Target} tone="blue" />
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên hoặc SĐT..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-card border"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border shadow-card-light overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead className="font-extrabold text-xs uppercase tracking-wider">Học viên</TableHead>
              <TableHead className="font-extrabold text-xs uppercase tracking-wider">Liên hệ</TableHead>
              <TableHead className="font-extrabold text-xs uppercase tracking-wider">Giới tính</TableHead>
              <TableHead className="font-extrabold text-xs uppercase tracking-wider">Cân nặng</TableHead>
              <TableHead className="font-extrabold text-xs uppercase tracking-wider">Mục tiêu</TableHead>
              <TableHead className="font-extrabold text-xs uppercase tracking-wider">Trạng thái</TableHead>
              <TableHead className="font-extrabold text-xs uppercase tracking-wider">Tài khoản</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  {search ? 'Không tìm thấy học viên nào.' : 'Chưa có học viên nào. Hãy thêm học viên đầu tiên!'}
                </TableCell>
              </TableRow>
            ) : (
              clients.map(client => (
                <TableRow key={client.id} className="group hover:bg-slate-50/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[rgba(84,183,240,0.10)] grid place-items-center shrink-0">
                        <span className="text-sm font-extrabold text-[#54B7F0]">
                          {client.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-semibold text-sm">{client.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      {client.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" /> {client.phone}
                        </div>
                      )}
                      {client.email && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" /> {client.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{client.gender || '—'}</TableCell>
                  <TableCell>
                    {client.current_weight ? (
                      <div className="flex items-center gap-1 text-sm font-semibold">
                        <Weight className="w-3.5 h-3.5 text-muted-foreground" />
                        {client.current_weight} kg
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {client.fitness_goal ? (
                      <StatusPill tone={GOAL_TONES[client.fitness_goal] || 'neutral'} size="xs">
                        {GOAL_LABELS[client.fitness_goal] || client.fitness_goal}
                      </StatusPill>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusPill tone={STATUS_TONES[client.status] || 'neutral'} size="xs">
                      {client.status}
                    </StatusPill>
                  </TableCell>
                  <TableCell>
                    {client.user_id ? (
                      <StatusPill tone="blue" size="xs">Đã liên kết</StatusPill>
                    ) : (
                      <span className="text-xs text-muted-foreground">Chưa có</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(client)}>
                          <Pencil className="w-4 h-4 mr-2" /> Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setArchiveTarget(client)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Archive className="w-4 h-4 mr-2" /> Lưu trữ
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-xs text-muted-foreground">
              Trang {page} / {totalPages} · {total} học viên
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Sheet */}
      <ClientFormSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onSave={handleSave}
        initialData={editingClient}
      />

      {/* Confirm Archive */}
      <ConfirmDialog
        open={!!archiveTarget}
        onOpenChange={() => setArchiveTarget(null)}
        onConfirm={handleArchive}
        title="Lưu trữ học viên"
        description={`Bạn có chắc muốn lưu trữ học viên "${archiveTarget?.full_name}"? Dữ liệu lịch sử sẽ được giữ nguyên.`}
        confirmText="Lưu trữ"
        variant="destructive"
      />
    </div>
  );
}
