import api from './api';

export interface PartnerCommissionRow {
  id: string;
  orderNumber: string;
  orderStatus: string;
  customerName: string;
  orderAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "PAID";
  createdAt: string;
}

export interface PartnerEarnings {
  pending: number;
  confirmed: number;
  paid: number;
  cancelled: number;
}

export type MyPartner =
  | { isPartner: false }
  | {
      isPartner: true;
      isActive: boolean;
      code: string;
      customerDiscountType: "PERCENTAGE" | "FIXED";
      customerDiscountValue: number;
      commissionRate: number;
      customerCount: number;
      earnings: PartnerEarnings;
      commissions: PartnerCommissionRow[];
    };

export interface AdminPartner {
  id: string;
  code: string;
  customerDiscountType: "PERCENTAGE" | "FIXED";
  customerDiscountValue: string | number;
  commissionRate: string | number;
  isActive: boolean;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; phone: string | null; email: string | null };
  customerCount: number;
  earnings: PartnerEarnings;
}

export interface CreatePartnerInput {
  userId: string;
  code?: string;
  customerDiscountType: "PERCENTAGE" | "FIXED";
  customerDiscountValue: number;
  commissionRate: number;
  isActive?: boolean;
}

const unwrap = <T>(res: { data: any }): T => (res.data?.data ?? res.data) as T;

export const partnerService = {
  getMine: async (): Promise<MyPartner> => unwrap<MyPartner>(await api.get("/partners/me")),

  validateCode: async (code: string) =>
    unwrap<{ valid: boolean; code: string; message?: string; customerDiscountType?: string; customerDiscountValue?: number }>(
      await api.post("/partners/validate", { code }),
    ),

  // Admin
  adminList: async (): Promise<AdminPartner[]> => unwrap<AdminPartner[]>(await api.get("/partners")),
  adminCreate: async (input: CreatePartnerInput) => unwrap(await api.post("/partners", input)),
  adminUpdate: async (id: string, input: Partial<CreatePartnerInput>) =>
    unwrap(await api.patch(`/partners/${id}`, input)),
  adminPayout: async (id: string): Promise<{ paidCount: number; paidAmount: number }> =>
    unwrap(await api.post(`/partners/${id}/payout`)),
};
