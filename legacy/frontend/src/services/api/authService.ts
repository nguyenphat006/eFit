import { AxiosError } from 'axios';
import { axiosClient } from '@/lib/axiosClient';
import { User } from '@/hooks/useAuthStore';

// We map to the backend BaseResponse format implicitly by letting axiosClient return response.data.
// This interface helps TypeScript understand the wrapper.
export interface BaseResponse<T> {
  status: string;
  message: string;
  data: T;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

/**
 * Mock user surfaced when the backend is unreachable. Lets the frontend keep
 * working in offline / dev-only environments where there is no API to log in
 * against. NEVER used when the backend actually responds.
 */
export const MOCK_USER: User = {
  id: 1,
  email: 'demo@efit.local',
  full_name: 'Hoàng Nam (Demo)',
  fitness_goal: 'Cutting',
  date_of_birth: '1998-05-12',
  current_weight: 78.4,
  height: 175,
  training_frequency: 5,
  role_id: 1,
  role: {
    id: 1,
    name: 'Member',
    description: 'Standard user',
  },
};

export const MOCK_TOKEN = 'mock-token.dev-only.no-backend';

/** True if axios threw because no response came back (network error / DNS / refused). */
function isNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const ax = err as AxiosError;
  return !ax.response;
}

export const authService = {
  login: async (formData: FormData): Promise<BaseResponse<TokenResponse>> => {
    try {
      const response = await axiosClient.post<any, BaseResponse<TokenResponse>>(
        '/api/v1/auth/login',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return response;
    } catch (err) {
      // Backend down → return a mock token so the user can still browse the UI.
      // When the real backend is reachable, this branch never runs.
      if (isNetworkError(err)) {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn('[mock-fallback] authService.login: API unreachable, issuing demo token.');
        }
        return {
          status: 'success',
          message: 'Mock login (API unreachable)',
          data: { access_token: MOCK_TOKEN, token_type: 'bearer' },
        };
      }
      throw err;
    }
  },

  register: async (data: any): Promise<BaseResponse<User>> => {
    const response = await axiosClient.post<any, BaseResponse<User>>('/api/v1/auth/register', data);
    return response;
  },

  getMe: async (): Promise<BaseResponse<User>> => {
    try {
      const response = await axiosClient.get<any, BaseResponse<User>>('/api/v1/auth/me');
      return response;
    } catch (err) {
      // Only fall back to mock user when the API is truly unreachable.
      // A 401/403 from a working API means the token is invalid — let caller handle it.
      if (isNetworkError(err)) {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn('[mock-fallback] authService.getMe: API unreachable, using demo user.');
        }
        return { status: 'success', message: 'Mock user (API unreachable)', data: MOCK_USER };
      }
      throw err;
    }
  },

  updateProfile: async (data: Partial<User>): Promise<BaseResponse<User>> => {
    const response = await axiosClient.put<any, BaseResponse<User>>('/api/v1/auth/me', data);
    return response;
  },
};
