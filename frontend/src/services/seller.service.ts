import api from './api';

export const sellerService = {
  // Dashboard
  getDashboard: async (): Promise<any> => {
    const response = await api.get('/sellers/dashboard');
    const data = response.data;
    return data?.data || data;
  },

  // Profile
  getProfile: async (): Promise<any> => {
    const response = await api.get('/sellers/dashboard');
    const data = response.data;
    return data?.data || data;
  },

  updateProfile: async (data: any): Promise<any> => {
    const response = await api.patch('/sellers/me', data);
    return response.data;
  },

  // Products
  getProducts: async (params?: Record<string, any>): Promise<any> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const response = await api.get(`/products?${searchParams.toString()}`);
    const data = response.data;
    const products = data?.data?.products || data?.data?.data || data?.data || data?.products || (Array.isArray(data) ? data : []);
    return Array.isArray(products) ? products : [];
  },

  createProduct: async (data: any): Promise<any> => {
    const response = await api.post('/products', data);
    return response.data;
  },

  updateProduct: async (id: string, data: any): Promise<any> => {
    const response = await api.patch(`/products/${id}`, data);
    return response.data;
  },

  deleteProduct: async (id: string): Promise<any> => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  uploadProductImages: async (id: string, formData: FormData): Promise<any> => {
    const response = await api.post(`/products/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updateVariants: async (id: string, data: any): Promise<any> => {
    const response = await api.patch(`/products/${id}/variants`, data);
    return response.data;
  },

  // Orders
  getOrders: async (params?: Record<string, any>): Promise<any> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const response = await api.get(`/orders/seller/all?${searchParams.toString()}`);
    return response.data;
  },

  getOrderById: async (id: string): Promise<any> => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  updateOrderStatus: async (id: string, status: string): Promise<any> => {
    const response = await api.patch(`/orders/${id}/status`, { status });
    return response.data;
  },

  // Analytics
  getAnalytics: async (): Promise<any> => {
    const response = await api.get('/sellers/dashboard');
    return response.data;
  },

  // Categories (for product form)
  getCategories: async (): Promise<any> => {
    const response = await api.get('/categories/flat');
    const data = response.data;
    return data?.data || (Array.isArray(data) ? data : []);
  },

  // Brands (for product form)
  getBrands: async (): Promise<any> => {
    const response = await api.get('/brands');
    const data = response.data;
    const brands = data?.data?.data || data?.data || data?.brands || (Array.isArray(data) ? data : []);
    return Array.isArray(brands) ? brands : [];
  },

  // Delivery
  getDeliveryAssignments: async (): Promise<any> => {
    const response = await api.get('/delivery/assignments');
    return response.data;
  },

  updateDeliveryStatus: async (id: string, data: any): Promise<any> => {
    const response = await api.patch(`/delivery/assignments/${id}/status`, data);
    return response.data;
  },
};
