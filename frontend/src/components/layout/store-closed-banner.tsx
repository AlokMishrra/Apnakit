"use client";

import { useEffect, useState } from "react";
import { Clock, Store, Truck, ShoppingBag, CheckCircle } from "lucide-react";
import { settingsService } from "@/services/settings.service";

export function StoreClosedBanner() {
  const [storeStatus, setStoreStatus] = useState<any>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const status = await settingsService.getStoreStatus();
        setStoreStatus(status);
      } catch {
        // Silently fail
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!storeStatus) return null;

  if (storeStatus.isOpen) {
    return (
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          <div className="flex items-center gap-1.5 text-center">
            <p className="text-xs sm:text-sm font-medium">
              Store is Open
            </p>
            <span className="hidden sm:inline text-emerald-200">|</span>
            <p className="text-xs text-emerald-100">
              Delivery available until {storeStatus.closeTime} IST
            </p>
          </div>
          <Truck className="h-4 w-4 flex-shrink-0" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
        <Store className="h-4 w-4 flex-shrink-0" />
        <div className="text-center">
          <p className="font-semibold text-xs sm:text-sm">We&apos;re Currently Closed</p>
          <p className="text-xs text-red-100">
            {!storeStatus.isDayOpen
              ? `We&apos;re not open on ${storeStatus.currentDay.charAt(0).toUpperCase() + storeStatus.currentDay.slice(1)}s`
              : `Opens at ${storeStatus.openTime} IST`}
          </p>
        </div>
        <Clock className="h-4 w-4 flex-shrink-0" />
      </div>
    </div>
  );
}
