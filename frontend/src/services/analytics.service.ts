import api from './api';

export const analyticsService = {
  getDashboardAnalytics: async (): Promise<any> => {
    const response = await api.get('/analytics/dashboard');
    return response.data;
  },

  getSellerAnalytics: async (sellerId?: string): Promise<any> => {
    const id = sellerId || 'me';
    const response = await api.get(`/analytics/seller/${id}`);
    return response.data;
  },
};
