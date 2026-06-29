import api from './api';

export interface TruecallerNonce {
  requestId: string;
}

export interface TruecallerStatus {
  status: 'pending' | 'completed' | 'rejected' | 'expired';
  user?: any;
  tokens?: any;
  error?: string;
}

export const truecallerService = {
  getNonce: async (): Promise<TruecallerNonce> => {
    const response = await api.post('/auth/truecaller/nonce');
    return response.data?.data || response.data;
  },

  getStatus: async (requestId: string): Promise<TruecallerStatus> => {
    const response = await api.get(`/auth/truecaller/status/${requestId}`);
    return response.data?.data || response.data;
  },
};
