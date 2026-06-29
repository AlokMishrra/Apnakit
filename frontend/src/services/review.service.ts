import api from './api';
import { ApiResponse, Review, PaginatedResponse } from '../types';

export const reviewService = {
  getReviews: async (
    productId: string,
    page = 1,
    limit = 10
  ): Promise<ApiResponse<PaginatedResponse<Review>>> => {
    const response = await api.get(`/reviews/product/${productId}`, {
      params: { page, limit },
    });
    return response.data;
  },

  createReview: async (data: {
    productId: string;
    rating: number;
    title: string;
    comment: string;
    images?: string[];
  }): Promise<ApiResponse<Review>> => {
    const response = await api.post('/reviews', data);
    return response.data;
  },

  markHelpful: async (reviewId: string): Promise<ApiResponse<Review>> => {
    const response = await api.post(`/reviews/${reviewId}/helpful`);
    return response.data;
  },
};
