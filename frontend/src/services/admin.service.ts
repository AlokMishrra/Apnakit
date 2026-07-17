import api from './api';
import axios from 'axios';

export const adminService = {
  // Dashboard
  getDashboardStats: async (): Promise<any> => {
    const response = await api.get('/analytics/dashboard');
    return response.data;
  },

  // Orders
  getAllOrders: async (params?: Record<string, any>): Promise<any> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const response = await api.get(`/orders/admin/all?${searchParams.toString()}`);
    return response.data;
  },

  getOrderById: async (id: string): Promise<any> => {
    const response = await api.get(`/orders/admin/${id}`);
    return response.data;
  },

  updateOrderStatus: async (id: string, status: string): Promise<any> => {
    const response = await api.patch(`/orders/${id}/status`, { status });
    return response.data;
  },

  // Products
  getProductStats: async (): Promise<any> => {
    const response = await api.get('/products/admin/stats');
    return response.data;
  },

  getAllProducts: async (params?: Record<string, any>): Promise<any> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const response = await api.get(`/products?${searchParams.toString()}`);
    return response.data;
  },

  getAllProductsUnlimited: async (params?: Record<string, any>): Promise<any> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const response = await api.get(`/products/admin/all?${searchParams.toString()}`);
    return response.data;
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

  addProductImagesByUrls: async (id: string, urls: string[], alt?: string): Promise<any> => {
    const response = await api.post(`/products/${id}/images/urls`, { urls, alt });
    return response.data;
  },

  deleteProductImage: async (productId: string, imageId: string): Promise<any> => {
    const response = await api.delete(`/products/${productId}/images/${imageId}`);
    return response.data;
  },

  deleteProductImages: async (productId: string, imageIds: string[]): Promise<any> => {
    const response = await api.delete(`/products/${productId}/images`, { data: { imageIds } });
    return response.data;
  },

  setPrimaryProductImage: async (productId: string, imageId: string): Promise<any> => {
    const response = await api.patch(`/products/${productId}/images/primary`, { imageId });
    return response.data;
  },

  // Categories
  getCategoryById: async (id: string): Promise<any> => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  getCategories: async (): Promise<any> => {
    const response = await api.get('/categories');
    return response.data;
  },

  getCategoriesFlat: async (): Promise<any> => {
    const response = await api.get('/categories/flat');
    return response.data;
  },

  createCategory: async (data: any): Promise<any> => {
    const response = await api.post('/categories', data);
    return response.data;
  },

  updateCategory: async (id: string, data: any): Promise<any> => {
    const response = await api.patch(`/categories/${id}`, data);
    return response.data;
  },

  deleteCategory: async (id: string): Promise<any> => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },

  reorderCategories: async (orders: { id: string; sortOrder: number }[]): Promise<any> => {
    const response = await api.post(`/categories/reorder`, { orders });
    return response.data;
  },

  // Delivery Zones
  getDeliveryZones: async (params?: Record<string, any>): Promise<any> => {
    const response = await api.get("/delivery-zones", { params });
    return response.data;
  },

  getDeliveryZone: async (id: string): Promise<any> => {
    const response = await api.get(`/delivery-zones/${id}`);
    return response.data;
  },

  createDeliveryZone: async (data: any): Promise<any> => {
    const response = await api.post("/delivery-zones", data);
    return response.data;
  },

  updateDeliveryZone: async (id: string, data: any): Promise<any> => {
    const response = await api.patch(`/delivery-zones/${id}`, data);
    return response.data;
  },

  deleteDeliveryZone: async (id: string): Promise<any> => {
    const response = await api.delete(`/delivery-zones/${id}`);
    return response.data;
  },

  /**
   * Bulk activate/deactivate/delete multiple zones in a single transaction.
   * Returns { action, updated, deleted, ids }.
   */
  bulkDeliveryZones: async (
    action: "activate" | "deactivate" | "delete",
    ids: string[]
  ): Promise<any> => {
    const response = await api.post("/delivery-zones/bulk", { action, ids });
    return response.data;
  },

  // Brands
  getBrandById: async (id: string): Promise<any> => {
    const response = await api.get(`/brands/${id}`);
    return response.data;
  },

  getBrands: async (): Promise<any> => {
    const response = await api.get('/brands');
    return response.data;
  },

  createBrand: async (data: any): Promise<any> => {
    const response = await api.post('/brands', data);
    return response.data;
  },

  updateBrand: async (id: string, data: any): Promise<any> => {
    const response = await api.patch(`/brands/${id}`, data);
    return response.data;
  },

  deleteBrand: async (id: string): Promise<any> => {
    const response = await api.delete(`/brands/${id}`);
    return response.data;
  },

  // Banners
  getBannerById: async (id: string): Promise<any> => {
    const response = await api.get(`/banners/${id}`);
    return response.data;
  },

  getBanners: async (): Promise<any> => {
    const response = await api.get('/banners/admin/all');
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

  // Coupons
  getCouponById: async (id: string): Promise<any> => {
    const response = await api.get(`/coupons/${id}`);
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

  // Sellers
  getSellers: async (params?: Record<string, any>): Promise<any> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const response = await api.get(`/sellers?${searchParams.toString()}`);
    return response.data;
  },

  getSellerById: async (id: string): Promise<any> => {
    const response = await api.get(`/sellers/${id}`);
    return response.data;
  },

  verifySeller: async (id: string, data: any): Promise<any> => {
    const response = await api.patch(`/sellers/${id}/verify`, data);
    return response.data;
  },

  updateSellerStatus: async (id: string, data: any): Promise<any> => {
    const response = await api.patch(`/sellers/${id}/status`, data);
    return response.data;
  },

  updateSellerCommission: async (id: string, data: any): Promise<any> => {
    const response = await api.patch(`/sellers/${id}/commission`, data);
    return response.data;
  },

  // Customers (users with role CUSTOMER)
  getCustomers: async (params?: Record<string, any>): Promise<any> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const response = await api.get(`/users?${searchParams.toString()}`);
    return response.data;
  },

  // Reviews
  getReviews: async (params?: Record<string, any>): Promise<any> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const response = await api.get(`/reviews?${searchParams.toString()}`);
    return response.data;
  },

  approveReview: async (id: string): Promise<any> => {
    const response = await api.patch(`/reviews/${id}/approve`);
    return response.data;
  },

  deleteReview: async (id: string): Promise<any> => {
    const response = await api.delete(`/reviews/${id}`);
    return response.data;
  },

  // Support
  getAllTickets: async (params?: Record<string, any>): Promise<any> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const response = await api.get(`/support/admin/tickets?${searchParams.toString()}`);
    return response.data;
  },

  updateTicketStatus: async (id: string, data: any): Promise<any> => {
    const response = await api.patch(`/support/tickets/${id}`, data);
    return response.data;
  },

  // Upload — bypass Next.js rewrite proxy for large files to avoid Vercel function timeout
  uploadImage: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('accessToken');
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://apnakit-backend.onrender.com'}/api/v1/upload/image`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        timeout: 120000,
      }
    );
    return response.data;
  },

  uploadVideo: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('accessToken');
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://apnakit-backend.onrender.com'}/api/v1/upload/video`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        timeout: 300000,
      }
    );
    return response.data;
  },

  // Inventory
  getInventory: async (params?: Record<string, any>): Promise<any> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const response = await api.get(`/inventory?${searchParams.toString()}`);
    return response.data;
  },

  getLowStock: async (): Promise<any> => {
    const response = await api.get('/inventory/low-stock');
    return response.data;
  },

  updateStock: async (id: string, data: any): Promise<any> => {
    const response = await api.patch(`/inventory/${id}`, data);
    return response.data;
  },

  adjustStock: async (data: any): Promise<any> => {
    const response = await api.post('/inventory/adjust', data);
    return response.data;
  },

  // Notifications
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

  // Sellers (admin)
  createSeller: async (data: any): Promise<any> => {
    const response = await api.post('/sellers', data);
    return response.data;
  },

  // Delivery Partners (admin)
  createDeliveryPartner: async (data: any): Promise<any> => {
    const response = await api.post('/delivery', data);
    return response.data;
  },

  getDeliveryPartners: async (): Promise<any> => {
    const response = await api.get('/delivery');
    return response.data;
  },

  getDeliveryPartner: async (id: string): Promise<any> => {
    const response = await api.get(`/delivery/${id}`);
    return response.data;
  },

  suspendDeliveryPartner: async (id: string, suspended: boolean): Promise<any> => {
    const response = await api.patch(`/delivery/${id}/suspend`, { suspended });
    return response.data;
  },

  resetDeliveryPartnerPassword: async (id: string, password: string): Promise<any> => {
    const response = await api.patch(`/delivery/${id}/password`, { password });
    return response.data;
  },

  deleteDeliveryPartner: async (id: string): Promise<any> => {
    const response = await api.delete(`/delivery/${id}`);
    return response.data;
  },

  // Orders (admin)
  deleteOrder: async (id: string): Promise<any> => {
    const response = await api.delete(`/orders/admin/${id}`);
    return response.data;
  },

  // Dashboard stats
  getDashboardStats: async (dateRange?: string): Promise<any> => {
    const params = dateRange ? `?dateRange=${encodeURIComponent(dateRange)}` : '';
    const response = await api.get(`/analytics/dashboard${params}`);
    return response.data;
  },

  // Analytics
  getSalesAnalytics: async (params?: Record<string, any>): Promise<any> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const response = await api.get(`/analytics/sales?${searchParams.toString()}`);
    return response.data;
  },
};
