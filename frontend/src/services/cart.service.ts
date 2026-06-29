import api from './api';
import { ApiResponse, Cart, Coupon } from '../types';

export const cartService = {
  getCart: async (): Promise<ApiResponse<Cart>> => {
    const response = await api.get('/cart');
    return response.data;
  },

  addToCart: async (
    productId: string,
    variantId: string | undefined,
    quantity: number
  ): Promise<ApiResponse<Cart>> => {
    const response = await api.post('/cart/items', {
      productId,
      variantId,
      quantity,
    });
    return response.data;
  },

  updateCartItem: async (
    itemId: string,
    quantity: number
  ): Promise<ApiResponse<Cart>> => {
    const response = await api.patch(`/cart/items/${itemId}`, { quantity });
    return response.data;
  },

  removeFromCart: async (itemId: string): Promise<ApiResponse<Cart>> => {
    const response = await api.delete(`/cart/items/${itemId}`);
    return response.data;
  },

  applyCoupon: async (code: string): Promise<ApiResponse<{ cart: Cart; coupon: Coupon }>> => {
    const response = await api.post('/cart/coupon', { code });
    return response.data;
  },

  removeCoupon: async (): Promise<ApiResponse<Cart>> => {
    const response = await api.delete('/cart/coupon');
    return response.data;
  },
};
