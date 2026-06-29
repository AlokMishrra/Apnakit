import api from './api';

export const deliveryService = {
  // Assignments
  getAssignments: async (params?: Record<string, any>): Promise<any> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const response = await api.get(`/delivery/assignments?${searchParams.toString()}`);
    return response.data;
  },

  updateAssignmentStatus: async (id: string, data: any): Promise<any> => {
    const response = await api.patch(`/delivery/assignments/${id}/status`, data);
    return response.data;
  },

  // Availability
  updateAvailability: async (isAvailable: boolean): Promise<any> => {
    const response = await api.patch('/delivery/availability', { isAvailable });
    return response.data;
  },

  // Earnings
  getEarnings: async (params?: Record<string, any>): Promise<any> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const response = await api.get(`/delivery/earnings?${searchParams.toString()}`);
    return response.data;
  },

  // Route
  getRoute: async (): Promise<any> => {
    const response = await api.get('/delivery/route');
    return response.data;
  },

  // Stats
  getStats: async (): Promise<any> => {
    const response = await api.get('/delivery/stats');
    return response.data;
  },

  // Location
  updateLocation: async (data: { latitude: number; longitude: number }): Promise<any> => {
    const response = await api.patch('/delivery/location', data);
    return response.data;
  },

  // Profile (uses user profile endpoints)
  getProfile: async (): Promise<any> => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  updateProfile: async (data: any): Promise<any> => {
    const response = await api.patch('/users/profile', data);
    return response.data;
  },
};
