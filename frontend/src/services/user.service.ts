import api from './api';
import { ApiResponse, User, Address } from '../types';

export const userService = {
  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await api.patch('/users/profile', data);
    return response.data;
  },

  getAddresses: async (): Promise<ApiResponse<Address[]>> => {
    const response = await api.get('/users/addresses');
    return response.data;
  },

  createAddress: async (data: Omit<Address, 'id' | '_id'>): Promise<ApiResponse<Address>> => {
    const response = await api.post('/users/addresses', data);
    return response.data;
  },

  updateAddress: async (id: string, data: Partial<Address>): Promise<ApiResponse<Address>> => {
    const response = await api.patch(`/users/addresses/${id}`, data);
    return response.data;
  },

  deleteAddress: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/users/addresses/${id}`);
    return response.data;
  },
};
