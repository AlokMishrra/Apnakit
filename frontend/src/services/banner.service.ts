import api from './api';

export const bannerService = {
  getBanners: async (position?: string): Promise<any> => {
    const params = position ? `?position=${position}` : '';
    const response = await api.get(`/banners${params}`);
    return response.data;
  },

  getBannerById: async (id: string): Promise<any> => {
    const response = await api.get(`/banners/${id}`);
    return response.data;
  },

  createBanner: async (data: any): Promise<any> => {
    const response = await api.post('/banners', data);
    return response.data;
  },

  updateBanner: async (id: string, data: any): Promise<any> => {
    const response = await api.patch(`/banners/${id}`, data);
    return response.data;
  },

  deleteBanner: async (id: string): Promise<any> => {
    const response = await api.delete(`/banners/${id}`);
    return response.data;
  },
};
