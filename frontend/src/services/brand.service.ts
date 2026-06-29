import api from './api';
import { ApiResponse, Brand } from '../types';

export const brandService = {
  getBrands: async (): Promise<ApiResponse<Brand[]>> => {
    const response = await api.get('/brands');
    return response.data;
  },
};
