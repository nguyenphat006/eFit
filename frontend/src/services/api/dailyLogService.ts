import { axiosClient } from '@/lib/axiosClient';
import { BaseResponse } from './authService';

const API_URL = '/api/v1/daily-logs';

export interface DailyLog {
  id: number;
  user_id: number;
  log_date: string;
  weight: number | null;
  sleep_hours: number | null;
  calories_in: number | null;
  compliance_score: number | null;
  compliance_notes: string | null;
}

export interface DailyLogCreate {
  user_id: number;
  log_date: string;
  weight?: number;
  sleep_hours?: number;
  calories_in?: number;
  compliance_score?: number;
  compliance_notes?: string;
}

export interface DailyLogUpdate {
  log_date?: string;
  weight?: number;
  sleep_hours?: number;
  calories_in?: number;
  compliance_score?: number;
  compliance_notes?: string;
}

export interface PaginatedResponse<T> extends BaseResponse<T[]> {
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export const dailyLogService = {
  getAll: async (page = 1, size = 50): Promise<PaginatedResponse<DailyLog>> => {
    const response = await axiosClient.get<any, PaginatedResponse<DailyLog>>(`${API_URL}/?page=${page}&size=${size}`);
    return response;
  },

  create: async (data: DailyLogCreate): Promise<BaseResponse<DailyLog>> => {
    const response = await axiosClient.post<any, BaseResponse<DailyLog>>(API_URL, data);
    return response;
  },

  update: async (id: number, data: DailyLogUpdate): Promise<BaseResponse<DailyLog>> => {
    const response = await axiosClient.put<any, BaseResponse<DailyLog>>(`${API_URL}/${id}`, data);
    return response;
  },

  delete: async (id: number): Promise<BaseResponse<any>> => {
    const response = await axiosClient.delete<any, BaseResponse<any>>(`${API_URL}/${id}`);
    return response;
  }
};
