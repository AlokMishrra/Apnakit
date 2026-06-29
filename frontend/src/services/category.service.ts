import api from './api';
import { ApiResponse, Category } from '../types';

export const categoryService = {
  getCategories: async (): Promise<ApiResponse<Category[]>> => {
    const response = await api.get('/categories');
    return response.data;
  },

  getCategoryBySlug: async (slug: string): Promise<ApiResponse<Category>> => {
    const response = await api.get(`/categories/${slug}`);
    return response.data;
  },
};
