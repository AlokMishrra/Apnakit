import api from "./api";

export interface DeliverySettings {
  deliveryCharge: number;
  freeDeliveryThreshold: number;
  enableFreeDelivery: boolean;
}

export interface TaxSettings {
  gstRate: number;
  gstEnabled: boolean;
  gstNumber: string;
  companyName: string;
}

export interface StoreSettings {
  storeName: string;
  storeEmail: string;
  storePhone: string;
  storeDescription: string;
  currency: string;
  storeOpen: boolean;
  openTime: string;
  closeTime: string;
  storeOpenDays: string[];
}

export interface PaymentMethodSetting {
  enabled: boolean;
}

export interface PaymentSettings {
  cod: PaymentMethodSetting;
  razorpay: PaymentMethodSetting;
  upi: PaymentMethodSetting;
  card: PaymentMethodSetting;
  netbanking: PaymentMethodSetting;
  wallet: PaymentMethodSetting;
}

export interface AllSettings {
  delivery: DeliverySettings;
  tax: TaxSettings;
  store: StoreSettings;
  payment: PaymentSettings;
}

export const settingsService = {
  async getSettings(): Promise<AllSettings> {
    const res = await api.get("/settings");
    return res.data.data;
  },

  async getDeliverySettings(): Promise<DeliverySettings> {
    const res = await api.get("/settings/delivery");
    return res.data.data;
  },

  async getTaxSettings(): Promise<TaxSettings> {
    const res = await api.get("/settings/tax");
    return res.data.data;
  },

  async updateDeliverySettings(delivery: Partial<DeliverySettings>): Promise<DeliverySettings> {
    const res = await api.put("/settings/delivery", delivery);
    return res.data.data;
  },

  async updateTaxSettings(tax: Partial<TaxSettings>): Promise<TaxSettings> {
    const res = await api.put("/settings/tax", tax);
    return res.data.data;
  },

  async updateStoreSettings(store: Partial<StoreSettings>): Promise<StoreSettings> {
    const res = await api.put("/settings/store", store);
    return res.data.data;
  },

  async getPaymentSettings(): Promise<PaymentSettings> {
    const res = await api.get("/settings/payment");
    return res.data.data;
  },

  async updatePaymentSettings(payment: Partial<PaymentSettings>): Promise<PaymentSettings> {
    const res = await api.put("/settings/payment", payment);
    return res.data.data;
  },

  async getStoreStatus() {
    const res = await api.get("/settings/store-status");
    return res.data.data;
  },
};
