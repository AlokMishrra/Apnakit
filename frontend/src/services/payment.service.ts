import api from './api';
import { ApiResponse, PaymentOrder, PaymentVerification } from '../types';

export const paymentService = {
  createPaymentOrder: async (orderId: string): Promise<ApiResponse<PaymentOrder>> => {
    const response = await api.post('/payments/create-order', { orderId });
    return response.data;
  },

  verifyPayment: async (
    data: PaymentVerification
  ): Promise<ApiResponse<{ success: boolean }>> => {
    const response = await api.post('/payments/verify', data);
    return response.data;
  },
};
