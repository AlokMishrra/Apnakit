"use client";

import { useState, useEffect, useCallback } from "react";
import { settingsService, type AllSettings } from "@/services/settings.service";

const CACHE_TTL = 5 * 60 * 1000;

const DEFAULTS: AllSettings = {
  delivery: { deliveryCharge: 99, freeDeliveryThreshold: 999, enableFreeDelivery: true },
  tax: { gstRate: 18, gstEnabled: true, gstNumber: "", companyName: "ApnaKit" },
  store: { storeName: "ApnaKit", storeEmail: "", storePhone: "", storeDescription: "", currency: "INR" },
  payment: {
    cod: { enabled: true },
    razorpay: { enabled: true },
    upi: { enabled: false },
    card: { enabled: false },
    netbanking: { enabled: false },
    wallet: { enabled: false },
  },
};

let cachedSettings: AllSettings | null = DEFAULTS;
let cacheTime = 0;

export function useSettings() {
  const [settings, setSettings] = useState<AllSettings>(cachedSettings ?? DEFAULTS);
  const [loading, setLoading] = useState(!cachedSettings);

  const fetchSettings = useCallback(async () => {
    const now = Date.now();
    if (cachedSettings && now - cacheTime < CACHE_TTL) {
      setSettings(cachedSettings);
      setLoading(false);
      return cachedSettings;
    }
    try {
      setLoading(true);
      const data = await settingsService.getSettings();
      cachedSettings = data;
      cacheTime = now;
      setSettings(data);
      return data;
    } catch {
      setSettings(DEFAULTS);
      cachedSettings = DEFAULTS;
      return DEFAULTS;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const refresh = useCallback(() => {
    cachedSettings = null;
    cacheTime = 0;
    return fetchSettings();
  }, [fetchSettings]);

  return { settings, loading, refresh };
}
