"use client";

import { useEffect, useState } from "react";
import { Clock, Store } from "lucide-react";
import { settingsService } from "@/services/settings.service";

export function StoreClosedBanner() {
  const [storeStatus, setStoreStatus] = useState<any>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const status = await settingsService.getStoreStatus();
        setStoreStatus(status);
      } catch {
        // Silently fail - don't show banner if API fails
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!storeStatus || storeStatus.isOpen) return null;

  return (
    <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
        <Store className="h-5 w-5" />
        <div className="text-center">
          <p className="font-semibold text-sm">We&apos;re Currently Closed</p>
          <p className="text-xs text-red-100">
            {!storeStatus.isDayOpen
              ? `We&apos;re not open on ${storeStatus.currentDay.charAt(0).toUpperCase() + storeStatus.currentDay.slice(1)}s`
              : `Opens at ${storeStatus.openTime} IST`}
          </p>
        </div>
        <Clock className="h-5 w-5" />
      </div>
    </div>
  );
}
