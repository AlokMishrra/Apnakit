"use client";

import * as React from "react";
import { MapPin, ChevronDown } from "lucide-react";
import { useLocation } from "./location-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LocationSelectorProps {
  className?: string;
  onClick?: () => void;
  variant?: "dark" | "light";
}

export function LocationSelector({
  className,
  onClick,
  variant = "dark",
}: LocationSelectorProps) {
  const { location } = useLocation();

  const display = location
    ? [location.city, location.pincode].filter(Boolean).join(" - ")
    : "Select location";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex items-center gap-1.5 text-xs transition-colors",
        variant === "dark"
          ? "text-gray-100 hover:text-white"
          : "text-foreground hover:text-primary",
        className
      )}
      aria-label="Change delivery location"
    >
      <MapPin className="h-3 w-3 flex-shrink-0" />
      <span className="truncate max-w-[180px]">
        {location ? (
          <>
            <span className="opacity-70">Deliver to </span>
            <span className="font-medium">{display}</span>
          </>
        ) : (
          <span>Choose delivery location</span>
        )}
      </span>
      <ChevronDown className="h-3 w-3 opacity-60 group-hover:opacity-100" />
    </button>
  );
}
