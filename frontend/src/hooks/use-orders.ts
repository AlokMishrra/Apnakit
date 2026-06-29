import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../services/order.service';
import { paymentService } from '../services/payment.service';
import { CreateOrderData } from '../types';
import toast from 'react-hot-toast';

export const useOrders = (filters?: Record<string, string | number>) => {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: async () => {
      const response = await orderService.getOrders(filters);
      return response.data;
    },
  });
};

export const useOrder = (id: string) => {
  return useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const response = await orderService.getOrder(id);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateOrder = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOrderData) => {
      const orderResponse = await orderService.createOrder(data);
      const paymentResponse = await paymentService.createPaymentOrder(
        orderResponse.data._id
      );
      return {
        order: orderResponse.data,
        payment: paymentResponse.data,
      };
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Order placed successfully!');
      navigate(`/orders/${response.order._id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to place order');
    },
  });
};

export const useTrackOrder = (orderNumber: string) => {
  return useQuery({
    queryKey: ['order', 'track', orderNumber],
    queryFn: async () => {
      const response = await orderService.trackOrder(orderNumber);
      return response.data;
    },
    enabled: !!orderNumber,
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      orderService.cancelOrder(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order cancelled successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel order');
    },
  });
};
