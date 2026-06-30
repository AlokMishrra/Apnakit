"use client";

import * as React from "react";
import { MapPin, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ServiceabilityState } from "./use-pincode-check";

interface ServiceabilityBannerProps {
  state: ServiceabilityState;
  className?: string;
  onSelectCity?: (city: { name: string; state: string }) => void;
}

export function ServiceabilityBanner({ state, className, onSelectCity }: ServiceabilityBannerProps) {
  if (state.status === "idle" || state.status === "invalid") return null;

  if (state.status === "checking") {
    return (
      <div
        className={cn(
          "mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground",
          className
        )}
      >
        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        Checking serviceability...
      </div>
    );
  }

  if (state.status === "serviceable") {
    const activeCities = (state.cities || []).filter((c) => c.isActive !== false);
    const hasMultiple = activeCities.length > 1;

    return (
      <div
        className={cn(
          "mt-1.5 rounded-md border border-emerald-200 bg-emerald-50/60 px-2.5 py-1.5 text-xs",
          className
        )}
      >
        <div className="flex items-start gap-1.5 text-emerald-900">
          <span className="mt-0.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
          <div className="flex-1">
            <p className="font-medium">
              We deliver to {state.city}
              {state.state ? `, ${state.state}` : ""}
            </p>
            {hasMultiple ? (
              <p className="text-emerald-700">
                Select your area from {activeCities.length} locations:
              </p>
            ) : state.estimatedDays ? (
              <p className="text-emerald-700">
                Estimated delivery in {state.estimatedDays} day
                {state.estimatedDays > 1 ? "s" : ""}
              </p>
            ) : null}
          </div>
        </div>
        {hasMultiple && (
          <ul className="mt-1.5 divide-y divide-emerald-200 overflow-hidden rounded-md border border-emerald-200 bg-white">
            {activeCities.map((c) => (
              <li key={c.name}>
                <button
                  type="button"
                  onClick={() => onSelectCity?.({ name: c.name, state: state.state })}
                  className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs text-emerald-900 transition-colors hover:bg-emerald-50 active:bg-emerald-100"
                >
                  <MapPin className="h-3 w-3 flex-shrink-0 text-emerald-600" />
                  <span className="font-medium">{c.name}</span>
                  {state.state && (
                    <span className="text-emerald-700/70">· {state.state}</span>
                  )}
                  <ChevronRight className="ml-auto h-3 w-3 flex-shrink-0 text-emerald-600/50" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (state.status === "unserviceable") {
    return (
      <div
        className={cn(
          "mt-1.5 flex items-start gap-1.5 rounded-md border border-amber-200 bg-amber-50/60 px-2.5 py-1.5 text-xs",
          className
        )}
      >
        <span className="mt-0.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
        <div className="flex-1 text-amber-900">
          <p className="font-medium">Not yet serviceable</p>
          <p className="text-amber-800">{state.message}</p>
        </div>
      </div>
    );
  }

  return null;
}
