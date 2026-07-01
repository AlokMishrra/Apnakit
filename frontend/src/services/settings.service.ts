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
}

export interface AllSettings {
  delivery: DeliverySettings;
  tax: TaxSettings;
  store: StoreSettings;
}

export const settingsService = {
  async getSettings(): Promise<AllSettings> {
    const res = await api.get("/settings");
    return res.data;
  },

  async getDeliverySettings(): Promise<DeliverySettings> {
    const res = await api.get("/settings/delivery");
    return res.data;
  },

  async getTaxSettings(): Promise<TaxSettings> {
    const res = await api.get("/settings/tax");
    return res.data;
  },

  async updateDeliverySettings(delivery: Partial<DeliverySettings>): Promise<DeliverySettings> {
    const res = await api.put("/settings/delivery", delivery);
    return res.data;
  },

  async updateTaxSettings(tax: Partial<TaxSettings>): Promise<TaxSettings> {
    const res = await api.put("/settings/tax", tax);
    return res.data;
  },

  async updateStoreSettings(store: Partial<StoreSettings>): Promise<StoreSettings> {
    const res = await api.put("/settings/store", store);
    return res.data;
  },
};
