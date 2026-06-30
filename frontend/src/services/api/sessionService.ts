import { axiosClient } from '@/lib/axiosClient';
import { withFallback } from './withFallback';
import {
  MOCK_SESSIONS,
  buildMockSessionDetail,
  mockPhaseDailyLogs,
} from './mockData';
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
  SessionAssignPayload,
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

  listSessions: async (page = 1, size = 20, is_template?: boolean, client_id?: number): Promise<PaginatedResponse<SessionListItem>> => {
    let mockData = MOCK_SESSIONS;
    if (is_template !== undefined) {
      mockData = mockData.filter(s => !!s.is_template === is_template);
    }
    if (client_id !== undefined) {
      mockData = mockData.filter(s => s.client_id === client_id);
    }
    const mockFallback: PaginatedResponse<SessionListItem> = {
      data: mockData,
      total: mockData.length,
      page,
      size,
      total_pages: 1,
    };
    let url = `/api/v1/sessions?page=${page}&size=${size}`;
    if (is_template !== undefined) url += `&is_template=${is_template}`;
    if (client_id !== undefined) url += `&client_id=${client_id}`;
    
    return withFallback(
      axiosClient.get<any, PaginatedResponse<SessionListItem>>(url),
      mockFallback,
      'sessionService.listSessions',
    );
  },
  
  listTemplates: async (page = 1, size = 20): Promise<PaginatedResponse<SessionListItem>> => {
      return sessionService.listSessions(page, size, true);
  },
  
  listByClient: async (clientId: number, page = 1, size = 20): Promise<PaginatedResponse<SessionListItem>> => {
    return sessionService.listSessions(page, size, false, clientId);
  },

  getSession: async (id: number): Promise<Session> => {
    return withFallback(
      axiosClient
        .get<any, BaseResponse<Session>>(`/api/v1/sessions/${id}`)
        .then((res) => res.data),
      buildMockSessionDetail(id),
      `sessionService.getSession(${id})`,
    );
  },

  getActiveSession: async (): Promise<Session | null> => {
    try {
      const res = await axiosClient.get<any, BaseResponse<Session>>('/api/v1/sessions/active');
      return res.data;
    } catch {
      const active = MOCK_SESSIONS.find((s) => s.is_active);
      return active ? buildMockSessionDetail(active.id) : null;
    }
  },

  createSession: async (payload: SessionCreate): Promise<Session> => {
    const res = await axiosClient.post<any, BaseResponse<Session>>('/api/v1/sessions', payload);
    return res.data;
  },

  assignTemplate: async (payload: SessionAssignPayload): Promise<Session> => {
    const res = await axiosClient.post<any, BaseResponse<Session>>('/api/v1/sessions/assign', payload);
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
    return withFallback(
      axiosClient
        .get<any, BaseResponse<DailyLog[]>>(`/api/v1/daily-logs/phase/${phaseId}`)
        .then((res) => res.data),
      mockPhaseDailyLogs(phaseId),
      `sessionService.getPhaseDailyLogs(${phaseId})`,
    );
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

  // ─── Nutrition Plan ───────────────────────────────────────────────────────
  saveNutritionPlan: async (phaseId: number, payload: any): Promise<any> => {
    return axiosClient.put(`/api/v1/nutrition-plans/phase/${phaseId}`, payload);
  }
};
