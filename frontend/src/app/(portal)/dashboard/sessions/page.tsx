'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { sessionService } from '@/services/api/sessionService';
import { SessionListItem } from '@/types/session';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import {
  Plus, Edit, Trash2, Search, Trophy, CheckCircle2, ChevronRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import SessionFormSheet from './components/SessionFormSheet';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionListItem | null>(null);

  // Delete state
  const [sessionToDelete, setSessionToDelete] = useState<SessionListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sessionService.listSessions(1, 50);
      setSessions(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleDeleteConfirm = async () => {
    if (!sessionToDelete) return;
    setIsDeleting(true);
    try {
      await sessionService.deleteSession(sessionToDelete.id);
      setSessionToDelete(null);
      fetchSessions();
    } catch (e) {
      console.error(e);
      // alert('Không thể xóa mùa giải đang active. Vui lòng chuyển trạng thái trước.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreated = (id?: number) => {
    fetchSessions();
  };

  const getGoalColor = (goal: string) => {
    switch (goal) {
      case 'Cutting': return 'text-red-600 bg-red-50 border-red-200';
      case 'Bulking': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Recomp': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (isActive) {
      return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 uppercase text-[10px] font-semibold"><CheckCircle2 className="w-3 h-3 mr-1" /> Đang Diễn Ra</Badge>;
    }
    if (status === 'Completed') {
      return <Badge variant="outline" className="text-slate-500 border-slate-200 bg-slate-50 uppercase text-[10px]">Đã Hoàn Thành</Badge>;
    }
    if (status === 'Draft') {
      return <Badge variant="outline" className="text-orange-500 border-orange-200 bg-orange-50 uppercase text-[10px]">Bản Nháp</Badge>;
    }
    return <Badge variant="outline" className="uppercase text-[10px]">{status}</Badge>;
  };

  const columns = useMemo<ColumnDef<SessionListItem>[]>(() => [
    {
      accessorKey: "name",
      header: "Tên Mùa Giải",
      cell: ({ row }) => (
        <span
          className="font-medium text-slate-800 cursor-pointer hover:text-[#EF9035] transition-colors"
          onClick={() => router.push(`/dashboard/sessions/${row.original.id}`)}
        >
          {row.getValue("name")}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Trạng Thái",
      cell: ({ row }) => getStatusBadge(row.getValue("status"), row.original.is_active),
    },
    {
      accessorKey: "goal_type",
      header: "Mục Tiêu",
      cell: ({ row }) => (
        <Badge variant="outline" className={getGoalColor(row.getValue("goal_type"))}>
          {row.getValue("goal_type")}
        </Badge>
      ),
    },
    {
      id: "timeRange",
      header: "Thời Gian",
      cell: ({ row }) => (
        <span className="text-slate-600 text-sm">
          {format(parseISO(row.original.start_date), 'dd/MM/yyyy')} <span className="text-slate-400 mx-1">-</span> {format(parseISO(row.original.end_date), 'dd/MM/yyyy')}
        </span>
      ),
    },
    {
      accessorKey: "phase_count",
      header: () => <div className="text-center">Số Phase</div>,
      cell: ({ row }) => <div className="text-center text-slate-600 font-medium">{row.getValue("phase_count") || 0}</div>,
    },
    {
      id: "actions",
      header: () => <div className="text-right">Hành động</div>,
      cell: ({ row }) => {
        const session = row.original;
        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { setEditingSession(session); setIsFormOpen(true); }}
              className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-200"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSessionToDelete(session)}
              className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/dashboard/sessions/${session.id}`)}
              className="h-8 w-8 text-[#EF9035] hover:text-[#D97D2A] hover:bg-orange-100"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        );
      },
    },
  ], [router]);

  const filteredSessions = sessions.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col space-y-2">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-500 bg-clip-text text-transparent flex items-center gap-2">
            <Trophy className="w-8 h-8 text-[#EF9035]" /> Quản Lý Mùa Giải
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            Mùa giải (Session) là chu kỳ tập luyện lớn nhất, giúp bạn theo đuổi một mục tiêu cụ thể như Siết cơ, Xả cơ hoặc Giữ dáng.
          </p>
        </div>
        <Button
          onClick={() => { setEditingSession(null); setIsFormOpen(true); }}
          className="bg-[#EF9035] hover:bg-[#D97D2A] text-white shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" /> Tạo mùa giải mới
        </Button>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm mùa giải..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white border-slate-200 focus-visible:ring-[#EF9035]"
          />
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredSessions}
        isLoading={loading}
      />

      <SessionFormSheet
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={editingSession}
        onSuccess={handleCreated}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!sessionToDelete}
        onClose={() => setSessionToDelete(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title="Xóa mùa giải?"
        itemName={sessionToDelete?.name}
        description={
          <>
            Bạn có chắc chắn muốn xóa mùa giải <b>{sessionToDelete?.name}</b>?
            Toàn bộ Phase và Log bên trong sẽ bị xóa vĩnh viễn!
          </>
        }
      />

    </div>
  );
}
