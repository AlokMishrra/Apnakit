import api from './api';

export const couponService = {
  validateCoupon: async (code: string): Promise<any> => {
    const response = await api.post('/coupons/validate', { code });
    return response.data;
  },

  getCoupons: async (params?: Record<string, any>): Promise<any> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const response = await api.get(`/coupons?${searchParams.toString()}`);
    return response.data;
  },

  createCoupon: async (data: any): Promise<any> => {
    const response = await api.post('/coupons', data);
    return response.data;
  },

  updateCoupon: async (id: string, data: any): Promise<any> => {
    const response = await api.patch(`/coupons/${id}`, data);
    return response.data;
  },

  deleteCoupon: async (id: string): Promise<any> => {
    const response = await api.delete(`/coupons/${id}`);
    return response.data;
  },
};
