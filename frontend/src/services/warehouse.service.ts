import api from './api';

export const warehouseService = {
  getWarehouses: async (params?: Record<string, any>): Promise<any> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const response = await api.get(`/warehouses?${searchParams.toString()}`);
    return response.data;
  },

  getWarehouseById: async (id: string): Promise<any> => {
    const response = await api.get(`/warehouses/${id}`);
    return response.data;
  },

  createWarehouse: async (data: any): Promise<any> => {
    const response = await api.post('/warehouses', data);
    return response.data;
  },

  updateWarehouse: async (id: string, data: any): Promise<any> => {
    const response = await api.patch(`/warehouses/${id}`, data);
    return response.data;
  },

  deleteWarehouse: async (id: string): Promise<any> => {
    const response = await api.delete(`/warehouses/${id}`);
    return response.data;
  },

  getWarehouseInventory: async (id: string): Promise<any> => {
    const response = await api.get(`/warehouses/${id}/inventory`);
    return response.data;
  },
};
