import api from './api';

export const searchService = {
  search: async (query: string, params?: Record<string, any>): Promise<any> => {
    const searchParams = new URLSearchParams({ q: query });
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const response = await api.get(`/search?${searchParams.toString()}`);
    return response.data;
  },

  getSuggestions: async (query: string): Promise<any> => {
    const response = await api.get('/search/suggestions', { params: { q: query } });
    return response.data;
  },

  getPopular: async (): Promise<any> => {
    const response = await api.get('/search/popular');
    return response.data;
  },
};
