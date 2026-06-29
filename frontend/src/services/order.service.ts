import api from './api';
import { ApiResponse, Order, CreateOrderData, PaginatedResponse, TrackOrder } from '../types';

export const orderService = {
  createOrder: async (data: CreateOrderData): Promise<ApiResponse<Order>> => {
    const response = await api.post('/orders', data);
    return response.data;
  },

  getOrders: async (
    filters?: Record<string, string | number>
  ): Promise<ApiResponse<PaginatedResponse<Order>>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const response = await api.get(`/orders?${params.toString()}`);
    return response.data;
  },

  getOrder: async (id: string): Promise<ApiResponse<Order>> => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  cancelOrder: async (id: string, reason?: string): Promise<ApiResponse<Order>> => {
    const response = await api.post(`/orders/${id}/cancel`, { reason });
    return response.data;
  },

  trackOrder: async (orderNumber: string): Promise<ApiResponse<TrackOrder>> => {
    const response = await api.get(`/orders/track/${orderNumber}`);
    return response.data;
  },
};
