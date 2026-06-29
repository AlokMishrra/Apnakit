import api from './api';
import { ApiResponse, Wishlist, Product } from '../types';

export const wishlistService = {
  getWishlist: async (): Promise<ApiResponse<Wishlist>> => {
    const response = await api.get('/wishlist');
    return response.data;
  },

  addToWishlist: async (productId: string): Promise<ApiResponse<Wishlist>> => {
    const response = await api.post(`/wishlist/${productId}`);
    return response.data;
  },

  removeFromWishlist: async (productId: string): Promise<ApiResponse<Wishlist>> => {
    const response = await api.delete(`/wishlist/${productId}`);
    return response.data;
  },
};
