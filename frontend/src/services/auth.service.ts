import api from './api';
import {
  ApiResponse,
  AuthTokens,
  User,
  LoginData,
  RegisterData,
  OtpData,
  VerifyOtpData,
} from '../types';

export const authService = {
  login: async (data: LoginData): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  register: async (
    data: RegisterData
  ): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  sendOtp: async (data: OtpData): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post('/auth/otp/send', data);
    return response.data;
  },

  verifyOtp: async (
    data: VerifyOtpData
  ): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> => {
    const response = await api.post('/auth/otp/verify', data);
    return response.data;
  },

  refreshToken: async (token: string): Promise<ApiResponse<AuthTokens>> => {
    const response = await api.post('/auth/refresh', { refreshToken: token });
    return response.data;
  },

  googleLogin: async (
    data: { idToken: string; email: string; firstName: string; lastName: string; avatar?: string }
  ): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> => {
    const response = await api.post('/auth/google', data);
    return response.data;
  },

  // Alias used by some legacy callers
  googleLoginWithToken: async (
    token: string
  ): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> => {
    const response = await api.post('/auth/google', { token });
    return response.data;
  },

  logout: async (): Promise<ApiResponse<null>> => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getMe: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  changePassword: async (newPassword: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post('/auth/change-password', { newPassword });
    return response.data;
  },

  verifyFirebase: async (data: { idToken: string; phone?: string; email?: string; intent: 'login' | 'register' }): Promise<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>> => {
    const response = await api.post('/auth/firebase/verify', data);
    return response.data;
  },
};
