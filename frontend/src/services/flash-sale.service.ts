import api from './api';

export const flashSaleService = {
  // Public — active flash sales
  getActive: async (): Promise<any> => {
    const response = await api.get('/flash-sales');
    return response.data;
  },

  // Public — single flash sale
  getById: async (id: string): Promise<any> => {
    const response = await api.get(`/flash-sales/${id}`);
    return response.data;
  },

  // Admin — all flash sales
  getAllAdmin: async (): Promise<any> => {
    const response = await api.get('/flash-sales/admin/all');
    return response.data;
  },

  // Admin — create
  create: async (data: any): Promise<any> => {
    const response = await api.post('/flash-sales', data);
    return response.data;
  },

  // Admin — update
  update: async (id: string, data: any): Promise<any> => {
    const response = await api.patch(`/flash-sales/${id}`, data);
    return response.data;
  },

  // Admin — delete
  remove: async (id: string): Promise<any> => {
    const response = await api.delete(`/flash-sales/${id}`);
    return response.data;
  },
};
