"use client";

import { useState, useEffect, useCallback } from "react";
import { settingsService, type AllSettings } from "@/services/settings.service";

const CACHE_KEY = "apnakit:settings";
const CACHE_TTL = 5 * 60 * 1000; // 5 min

let cachedSettings: AllSettings | null = null;
let cacheTime = 0;

export function useSettings() {
  const [settings, setSettings] = useState<AllSettings | null>(cachedSettings);
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
      return null;
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
