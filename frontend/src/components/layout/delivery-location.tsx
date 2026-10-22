"use client";

import { ChevronDown, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/hooks/use-settings";
import { useLocation } from "@/components/layout/location-context";

interface DeliveryLocationProps {
  variant?: "header" | "mobile";
  className?: string;
  onClick?: () => void;
}

function formatLocation(city?: string, state?: string, pincode?: string) {
  const parts = [city, state, pincode].filter(Boolean).map((p) => String(p).toUpperCase());
  return parts.join(", ");
}

/**
 * Delivery promise plus the shopper's location.
 *
 * Desktop: a dark red "Delivery in 19 mins" badge next to the location.
 * Mobile: the same two lines stacked under the Quick / Shop All bar.
 */
export function DeliveryLocation({
  variant = "header",
  className,
  onClick,
}: DeliveryLocationProps) {
  const { settings } = useSettings();
  const { location } = useLocation();

  const minutes = settings.delivery.quickDeliveryMinutes ?? 19;
  const days = settings.delivery.standardDeliveryDays ?? 2;
  const place = formatLocation(location?.city, location?.state, location?.pincode);

  if (variant === "mobile") {
    return (
      <div className={cn("w-full", className)}>
        <p className="text-xs text-muted-foreground">Delivery in</p>
        <p className="text-lg font-bold leading-tight text-foreground">
          {minutes} mins
        </p>
        <button
          type="button"
          onClick={onClick}
          className="flex w-full items-center gap-1 text-left text-sm text-muted-foreground"
        >
          <span className="truncate">
            <span className="font-medium text-foreground">Location :</span>{" "}
            {place || "Set location"}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0" />
        </button>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="rounded-lg bg-[#8c1020] px-3 py-1.5 text-center text-white">
        <p className="text-[10px] font-semibold uppercase leading-tight tracking-wide">
          Delivery in
        </p>
        <p className="text-sm font-bold leading-tight">
          {minutes} mins
        </p>
      </div>
      <button
        type="button"
        onClick={onClick}
        className="group flex max-w-[220px] flex-col text-left"
      >
        <span className="flex items-center gap-1 text-base font-semibold leading-tight text-foreground">
          Location
          <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {place || "Set location"}
        </span>
      </button>
    </div>
  );
}

export { formatLocation };
