import { axiosClient } from '@/lib/axiosClient';
import { BaseResponse } from './authService';
import { DailyLog } from '@/types/session';

const API_URL = '/api/v1/daily-logs';

export type { DailyLog };

export interface DailyLogCreate {
  user_id: number;
  log_date: string;
  weight?: number;
  sleep_hours?: number;
  work_hours?: number;
  fatigue_level?: number;
  calories_in?: number;
  protein_in?: number;
  carbs_in?: number;
  fat_in?: number;
  steps?: number;
  cardio_duration_minutes?: number;
  cardio_type?: string;
  diet_meals_completed?: number;
  diet_target_meals?: number;
  diet_protein_estimated?: boolean;
  diet_cheat_status?: string;
  diet_notes?: string;
  body_images?: string[];
  chest_measure?: number;
  waist_measure?: number;
  hips_measure?: number;
}

export type DailyLogUpdate = Partial<Omit<DailyLogCreate, 'user_id'>>;

export interface PaginatedResponse<T> extends BaseResponse<T[]> {
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export const dailyLogService = {
  getAll: async (page = 1, size = 50, user_id?: number): Promise<PaginatedResponse<DailyLog>> => {
    let url = `${API_URL}/?page=${page}&size=${size}`;
    if (user_id) url += `&user_id=${user_id}`;
    const response = await axiosClient.get<any, PaginatedResponse<DailyLog>>(url);
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
