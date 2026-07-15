import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/database.config';

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

const DEFAULTS: AllSettings = {
  delivery: {
    deliveryCharge: 99,
    freeDeliveryThreshold: 999,
    enableFreeDelivery: true,
  },
  tax: {
    gstRate: 18,
    gstEnabled: true,
    gstNumber: '',
    companyName: 'ApnaKit',
  },
  store: {
    storeName: 'ApnaKit',
    storeEmail: 'support@apnakit.in',
    storePhone: '+91 1800-123-4567',
    storeDescription: 'ApnaKit - Your trusted online shopping destination.',
    currency: 'INR',
    storeOpen: true,
    openTime: '09:00',
    closeTime: '22:00',
    storeOpenDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
  },
  payment: {
    cod: { enabled: true },
    razorpay: { enabled: true },
    upi: { enabled: false },
    card: { enabled: false },
    netbanking: { enabled: false },
    wallet: { enabled: false },
  },
};

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getSettings(): Promise<AllSettings> {
    try {
      const rows = await this.prisma.systemSettings.findMany();
      const map: Record<string, any> = {};
      for (const row of rows) {
        map[row.key] = row.value;
      }
      return {
        delivery: { ...DEFAULTS.delivery, ...(map['delivery'] || {}) },
        tax: { ...DEFAULTS.tax, ...(map['tax'] || {}) },
        store: { ...DEFAULTS.store, ...(map['store'] || {}) },
        payment: { ...DEFAULTS.payment, ...(map['payment'] || {}) },
      };
    } catch (error) {
      this.logger.warn('Failed to read settings from DB, using defaults');
      return DEFAULTS;
    }
  }

  async getDeliverySettings(): Promise<DeliverySettings> {
    const all = await this.getSettings();
    return all.delivery;
  }

  async getTaxSettings(): Promise<TaxSettings> {
    const all = await this.getSettings();
    return all.tax;
  }

  async updateSettings(key: string, value: any): Promise<void> {
    await this.prisma.systemSettings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  async updateDeliverySettings(delivery: Partial<DeliverySettings>): Promise<DeliverySettings> {
    const current = await this.getDeliverySettings();
    const updated = { ...current, ...delivery };
    await this.updateSettings('delivery', updated);
    return updated;
  }

  async updateTaxSettings(tax: Partial<TaxSettings>): Promise<TaxSettings> {
    const current = await this.getTaxSettings();
    const updated = { ...current, ...tax };
    await this.updateSettings('tax', updated);
    return updated;
  }

  async updateStoreSettings(store: Partial<StoreSettings>): Promise<StoreSettings> {
    const current = (await this.getSettings()).store;
    const updated = { ...current, ...store };
    await this.updateSettings('store', updated);
    return updated;
  }

  async getPaymentSettings(): Promise<PaymentSettings> {
    const all = await this.getSettings();
    return all.payment;
  }

  async updatePaymentSettings(payment: Partial<PaymentSettings>): Promise<PaymentSettings> {
    const current = await this.getPaymentSettings();
    const updated = { ...current, ...payment };
    await this.updateSettings('payment', updated);
    return updated;
  }

  async getStoreStatus() {
    const settings = await this.getSettings();
    const { storeOpen, openTime, closeTime, storeOpenDays } = settings.store;
    const now = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = days[now.getDay()];
    const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();
    const currentTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    const isDayOpen = storeOpenDays.includes(currentDay);
    const isTimeOpen = currentTime >= openTime && currentTime < closeTime;
    const isOpen = storeOpen && isDayOpen && isTimeOpen;
    return {
      isOpen,
      storeOpen,
      isDayOpen,
      isTimeOpen,
      currentDay,
      currentTime,
      openTime,
      closeTime,
      storeOpenDays,
    };
  }
}
