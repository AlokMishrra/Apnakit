import api from './api';

export const supportService = {
  getTickets: async (params?: Record<string, any>): Promise<any> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const response = await api.get(`/support/tickets?${searchParams.toString()}`);
    return response.data;
  },

  getTicketById: async (id: string): Promise<any> => {
    const response = await api.get(`/support/tickets/${id}`);
    return response.data;
  },

  createTicket: async (data: any): Promise<any> => {
    const response = await api.post('/support/tickets', data);
    return response.data;
  },

  addMessage: async (ticketId: string, data: any): Promise<any> => {
    const response = await api.post(`/support/tickets/${ticketId}/messages`, data);
    return response.data;
  },

  getMessages: async (ticketId: string): Promise<any> => {
    const response = await api.get(`/support/tickets/${ticketId}/messages`);
    return response.data;
  },

  // Admin
  getAllTickets: async (params?: Record<string, any>): Promise<any> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const response = await api.get(`/support/admin/tickets?${searchParams.toString()}`);
    return response.data;
  },

  updateTicketStatus: async (id: string, data: any): Promise<any> => {
    const response = await api.patch(`/support/tickets/${id}`, data);
    return response.data;
  },
};
