import { axiosClient } from '@/lib/axiosClient';
import { withFallback } from './withFallback';
import { Client, ClientListItem, ClientCreate, ClientUpdate } from '@/types/client';

interface BaseResponse<T> {
  data: T;
  message?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_CLIENTS: ClientListItem[] = [
  {
    id: 1,
    full_name: 'Nguyễn Văn An',
    phone: '0901234567',
    email: 'an.nguyen@gmail.com',
    gender: 'Nam',
    current_weight: 75.5,
    fitness_goal: 'Cutting',
    status: 'Active',
    user_id: null,
  },
  {
    id: 2,
    full_name: 'Trần Thị Bích',
    phone: '0912345678',
    email: 'bich.tran@gmail.com',
    gender: 'Nữ',
    current_weight: 58.0,
    fitness_goal: 'Maintaining',
    status: 'Active',
    user_id: null,
  },
  {
    id: 3,
    full_name: 'Lê Hoàng Cường',
    phone: '0923456789',
    email: null,
    gender: 'Nam',
    current_weight: 82.0,
    fitness_goal: 'Bulking',
    status: 'Active',
    user_id: null,
  },
];

// ─── Service ──────────────────────────────────────────────────────────────────

export const clientService = {
  listClients: async (
    page = 1,
    size = 20,
    status?: string,
    search?: string,
  ): Promise<PaginatedResponse<ClientListItem>> => {
    const fallback: PaginatedResponse<ClientListItem> = {
      data: MOCK_CLIENTS,
      total: MOCK_CLIENTS.length,
      page: 1,
      size: MOCK_CLIENTS.length,
      total_pages: 1,
    };

    let url = `/api/v1/clients?page=${page}&size=${size}`;
    if (status) url += `&status=${status}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    return withFallback(
      axiosClient.get<any, PaginatedResponse<ClientListItem>>(url),
      fallback,
      'clientService.listClients',
    );
  },

  getClient: async (id: number): Promise<Client> => {
    const res = await axiosClient.get<any, BaseResponse<Client>>(
      `/api/v1/clients/${id}`,
    );
    return res.data;
  },

  createClient: async (payload: ClientCreate): Promise<Client> => {
    const res = await axiosClient.post<any, BaseResponse<Client>>(
      '/api/v1/clients',
      payload,
    );
    return res.data;
  },

  updateClient: async (id: number, payload: ClientUpdate): Promise<Client> => {
    const res = await axiosClient.put<any, BaseResponse<Client>>(
      `/api/v1/clients/${id}`,
      payload,
    );
    return res.data;
  },

  deleteClient: async (id: number): Promise<void> => {
    await axiosClient.delete(`/api/v1/clients/${id}`);
  },

  linkAccount: async (clientId: number, userId: number): Promise<Client> => {
    const res = await axiosClient.post<any, BaseResponse<Client>>(
      `/api/v1/clients/${clientId}/link-account`,
      { user_id: userId },
    );
    return res.data;
  },

  unlinkAccount: async (clientId: number): Promise<Client> => {
    const res = await axiosClient.delete<any, BaseResponse<Client>>(
      `/api/v1/clients/${clientId}/link-account`,
    );
    return res.data;
  },
};
