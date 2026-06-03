import { axiosClient } from '@/lib/axiosClient';
import {
  Session,
  SessionListItem,
  SessionCreate,
  SessionUpdate,
  Phase,
  PhaseCreate,
  PhaseUpdate,
  DailyLog,
  DailyLogInlineUpsert,
} from '@/types/session';

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

export const sessionService = {
  // ─── Session CRUD ─────────────────────────────────────────────────────────

  listSessions: async (page = 1, size = 20): Promise<PaginatedResponse<SessionListItem>> => {
    return axiosClient.get<any, PaginatedResponse<SessionListItem>>(
      `/api/v1/sessions?page=${page}&size=${size}`
    );
  },

  getSession: async (id: number): Promise<Session> => {
    const res = await axiosClient.get<any, BaseResponse<Session>>(`/api/v1/sessions/${id}`);
    return res.data;
  },

  getActiveSession: async (): Promise<Session | null> => {
    try {
      const res = await axiosClient.get<any, BaseResponse<Session>>('/api/v1/sessions/active');
      return res.data;
    } catch {
      return null; // No active session
    }
  },

  createSession: async (payload: SessionCreate): Promise<Session> => {
    const res = await axiosClient.post<any, BaseResponse<Session>>('/api/v1/sessions', payload);
    return res.data;
  },

  updateSession: async (id: number, payload: SessionUpdate): Promise<Session> => {
    const res = await axiosClient.put<any, BaseResponse<Session>>(`/api/v1/sessions/${id}`, payload);
    return res.data;
  },

  updateSessionStatus: async (id: number, status: string): Promise<Session> => {
    const res = await axiosClient.put<any, BaseResponse<Session>>(
      `/api/v1/sessions/${id}/status`,
      { status }
    );
    return res.data;
  },

  deleteSession: async (id: number): Promise<void> => {
    await axiosClient.delete(`/api/v1/sessions/${id}`);
  },

  // ─── Phase CRUD ───────────────────────────────────────────────────────────

  getPhase: async (phaseId: number): Promise<Phase> => {
    const res = await axiosClient.get<any, BaseResponse<Phase>>(
      `/api/v1/sessions/phases/${phaseId}`
    );
    return res.data;
  },

  createPhase: async (sessionId: number, payload: PhaseCreate): Promise<Phase> => {
    const res = await axiosClient.post<any, BaseResponse<Phase>>(
      `/api/v1/sessions/${sessionId}/phases`,
      payload
    );
    return res.data;
  },

  updatePhase: async (phaseId: number, payload: PhaseUpdate): Promise<Phase> => {
    const res = await axiosClient.put<any, BaseResponse<Phase>>(
      `/api/v1/sessions/phases/${phaseId}`,
      payload
    );
    return res.data;
  },

  deletePhase: async (phaseId: number): Promise<void> => {
    await axiosClient.delete(`/api/v1/sessions/phases/${phaseId}`);
  },

  // ─── DailyLog (Phase-based) ───────────────────────────────────────────────

  getPhaseDailyLogs: async (phaseId: number): Promise<DailyLog[]> => {
    const res = await axiosClient.get<any, BaseResponse<DailyLog[]>>(
      `/api/v1/daily-logs/phase/${phaseId}`
    );
    return res.data;
  },

  upsertDailyLog: async (phaseId: number, payload: DailyLogInlineUpsert): Promise<DailyLog> => {
    const res = await axiosClient.put<any, BaseResponse<DailyLog>>(
      `/api/v1/daily-logs/phase/${phaseId}/upsert`,
      payload
    );
    return res.data;
  },

  suggestNutrition: async (payload: {
    goal: string;
    phase_description: string;
    gender?: string;
    height?: number;
    current_weight?: number;
    body_fat_percentage?: number;
    activity_level?: number;
  }): Promise<any> => {
    const res = await axiosClient.post<any, BaseResponse<any>>('/api/v1/sessions/suggest-nutrition', payload);
    return res.data;
  },
};
