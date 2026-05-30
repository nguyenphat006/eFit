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

export const authService = {
  login: async (formData: FormData): Promise<BaseResponse<TokenResponse>> => {
    // Backend OAuth2PasswordRequestForm requires form-urlencoded data, but wait, 
    // the backend custom LoginForm uses Form() from FastAPI, which accepts x-www-form-urlencoded or multipart/form-data.
    const response = await axiosClient.post<any, BaseResponse<TokenResponse>>('/api/v1/auth/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  },

  register: async (data: any): Promise<BaseResponse<User>> => {
    const response = await axiosClient.post<any, BaseResponse<User>>('/api/v1/auth/register', data);
    return response;
  },

  getMe: async (): Promise<BaseResponse<User>> => {
    const response = await axiosClient.get<any, BaseResponse<User>>('/api/v1/auth/me');
    return response;
  },

  updateProfile: async (data: Partial<User>): Promise<BaseResponse<User>> => {
    const response = await axiosClient.put<any, BaseResponse<User>>('/api/v1/auth/me', data);
    return response;
  },
};
