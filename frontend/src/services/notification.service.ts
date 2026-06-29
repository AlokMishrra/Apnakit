import api from './api';

export const notificationService = {
  getNotifications: async (params?: Record<string, any>): Promise<any> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const response = await api.get(`/notifications?${searchParams.toString()}`);
    return response.data;
  },

  markAsRead: async (id: string): Promise<any> => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<any> => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },
};
