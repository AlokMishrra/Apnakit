import api from './api';
import { ApiResponse, Product, PaginatedResponse, ProductFilters } from '../types';

export const productService = {
  getProducts: async (
    filters?: ProductFilters
  ): Promise<ApiResponse<PaginatedResponse<Product>>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const response = await api.get(`/products?${params.toString()}`);
    return response.data;
  },

  getProduct: async (id: string): Promise<ApiResponse<Product>> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  getProductBySlug: async (slug: string): Promise<ApiResponse<Product>> => {
    const response = await api.get(`/products/slug/${slug}`);
    return response.data;
  },

  getFeaturedProducts: async (): Promise<ApiResponse<Product[]>> => {
    const response = await api.get('/products/featured');
    return response.data;
  },

  getTrendingProducts: async (): Promise<ApiResponse<Product[]>> => {
    const response = await api.get('/products/trending');
    return response.data;
  },

  getBestSellers: async (): Promise<ApiResponse<Product[]>> => {
    const response = await api.get('/products/bestsellers');
    return response.data;
  },

  getRelatedProducts: async (id: string): Promise<ApiResponse<Product[]>> => {
    const response = await api.get(`/products/${id}/related`);
    return response.data;
  },

  searchProducts: async (
    query: string,
    page = 1,
    limit = 20
  ): Promise<ApiResponse<PaginatedResponse<Product>>> => {
    const response = await api.get('/search', {
      params: { q: query, page, limit },
    });
    return response.data;
  },
};
