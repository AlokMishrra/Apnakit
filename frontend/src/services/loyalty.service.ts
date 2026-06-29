import api from './api';

export const loyaltyService = {
  getPoints: async (): Promise<any> => {
    const response = await api.get('/loyalty/points');
    return response.data;
  },

  redeem: async (points: number): Promise<any> => {
    const response = await api.post('/loyalty/redeem', { points });
    return response.data;
  },

  getHistory: async (params?: Record<string, any>): Promise<any> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const response = await api.get(`/loyalty/history?${searchParams.toString()}`);
    return response.data;
  },
};
