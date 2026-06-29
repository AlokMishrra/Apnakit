import api from './api';
import apiClient from '@/lib/api-client';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  category: string;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface WrappedResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

function unwrap<T>(res: { data: WrappedResponse<T> }): T {
  if (!res?.data) throw new Error("Empty response from server");
  return res.data.data;
}

export const contactService = {
  submit: async (data: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    category?: string;
    message: string;
  }): Promise<{ message: string; id: string }> => {
    const res = await apiClient.post<WrappedResponse<{ message: string; id: string }>>('/contact', data);
    return unwrap(res);
  },

  // Admin
  getAll: async (params?: { status?: string; page?: number; limit?: number }): Promise<any> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    const res = await api.get(`/admin/contact?${searchParams.toString()}`);
    return res.data;
  },

  updateStatus: async (id: string, status: string): Promise<any> => {
    const res = await api.patch(`/admin/contact/${id}/status`, { status });
    return res.data;
  },

  delete: async (id: string): Promise<any> => {
    const res = await api.delete(`/admin/contact/${id}`);
    return res.data;
  },
};
