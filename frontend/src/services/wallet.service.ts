import api from './api';

export const walletService = {
  getWallet: async (): Promise<any> => {
    const response = await api.get('/wallet');
    return response.data;
  },

  addFunds: async (amount: number): Promise<any> => {
    const response = await api.post('/wallet/add', { amount });
    return response.data;
  },

  getTransactions: async (params?: Record<string, any>): Promise<any> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const response = await api.get(`/wallet/transactions?${searchParams.toString()}`);
    return response.data;
  },
};
