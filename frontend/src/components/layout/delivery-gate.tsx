"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useLocation } from "./location-context";
import { deliveryZoneService } from "@/services/delivery-zone.service";
import { MapPin, PartyPopper, ArrowRight, Search, Home, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeliveryGateProps {
  children: React.ReactNode;
  /**
   * Skips the serviceability check entirely (e.g. on the home page where
   * users can browse without selecting a location).
   * @default false
   */
  disabled?: boolean;
  /**
   * When true, requires a location to be set before showing content.
   * When false (default), shows content even without a location — but if
   * a location is set and unserviceable, the coming-soon page is shown.
   */
  requireLocation?: boolean;
}

interface ServiceableState {
  loading: boolean;
  serviceable: boolean;
  city?: string;
  state?: string;
  pincode?: string;
  estimatedDays?: number;
  message?: string;
}

const PENDING_KEY = "apnakit:gate-pending-pincode";

export function DeliveryGate({
  children,
  disabled = false,
  requireLocation = false,
}: DeliveryGateProps) {
  const { location, serviceableCities, isCityServiceable } = useLocation();
  const [state, setState] = React.useState<ServiceableState>({
    loading: true,
    serviceable: true,
  });

  // Pages where the gate should not block browsing (allow free navigation
  // even if no location is selected).
  const pathname = usePathname() || "/";
  const isBrowseablePage =
    pathname === "/" ||
    pathname.startsWith("/help") ||
    pathname.startsWith("/track-order");

  // Determine the relevant pincode/city for the gate
  const relevantPincode = location?.pincode;
  const relevantCity = location?.city;

  // Stable key so the effect re-runs whenever the relevant identifiers change
  const gateKey = `${relevantPincode || ""}|${(relevantCity || "").toLowerCase()}|${(location?.state || "").toLowerCase()}`;

  React.useEffect(() => {
    let cancelled = false;
    // Bypass the gate only when:
    //  - the parent explicitly disables it
    //  - OR the user is on a browseable page AND has not selected a location
    if (disabled) {
      setState({ loading: false, serviceable: true });
      return;
    }
    if (isBrowseablePage && !location) {
      setState({ loading: false, serviceable: true });
      return;
    }
    // No location set
    if (!location) {
      if (requireLocation) {
        setState({ loading: false, serviceable: false, message: "no_location" });
      } else {
        setState({ loading: false, serviceable: true, message: "no_location" });
      }
      return;
    }
    // Has explicit pincode — verify against the serviceability API
    if (relevantPincode) {
      setState((s) => ({ ...s, loading: true }));
      deliveryZoneService
        .check(relevantPincode)
        .then((res) => {
          if (cancelled) return;
          const data = (res?.data || res) as {
            serviceable: boolean;
            city?: string;
            state?: string;
            estimatedDays?: number;
            message?: string;
          };
          if (data.serviceable) {
            setState({
              loading: false,
              serviceable: true,
              city: data.city,
              state: data.state,
              pincode: relevantPincode,
              estimatedDays: data.estimatedDays,
            });
          } else {
            setState({
              loading: false,
              serviceable: false,
              city: data.city,
              state: data.state,
              pincode: relevantPincode,
              message:
                data.message ||
                "This pincode is not yet on our delivery list. Stay tuned — we will be available very soon!",
            });
          }
        })
        .catch(() => {
          if (cancelled) return;
          // On network error, optimistically allow
          setState({ loading: false, serviceable: true });
        });
      return () => {
        cancelled = true;
      };
    }
    // City only (no pincode) — check against known serviceable cities
    if (serviceableCities.length > 0 && relevantCity) {
      const ok = isCityServiceable(relevantCity, location.state);
      if (!ok) {
        setState({
          loading: false,
          serviceable: false,
          city: relevantCity,
          state: location.state,
          message:
            "This city is not yet on our delivery list. We are working hard to reach you very soon!",
        });
        return;
      }
    }
    // Default: serviceable
    setState({ loading: false, serviceable: true });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    disabled,
    isBrowseablePage,
    requireLocation,
    gateKey,
    relevantPincode,
    relevantCity,
    serviceableCities,
    isCityServiceable,
  ]);

  if (disabled) return <>{children}</>;

  if (state.loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (state.serviceable) {
    return <>{children}</>;
  }

  // Unserviceable — show "coming soon" gate
  return (
    <div className="min-h-[60vh] bg-gradient-to-b from-amber-50/40 via-white to-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="text-center">
          {/* Compact icon */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 shadow-sm">
            <PartyPopper className="h-7 w-7 text-amber-600" />
          </div>

          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            We&apos;re coming to your area
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {state.message}
          </p>

          {/* Location pill */}
          {(state.pincode || state.city) && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50/60 px-3.5 py-1.5 text-sm text-amber-900">
              <MapPin className="h-3.5 w-3.5" />
              {state.pincode ? (
                <>
                  <span className="text-muted-foreground">Pincode</span>
                  <span className="font-mono font-semibold">{state.pincode}</span>
                </>
              ) : (
                <span className="font-medium">
                  {state.city}
                  {state.state ? `, ${state.state}` : ""}
                </span>
              )}
            </div>
          )}

          {/* Single, focused CTA */}
          <div className="mt-7 flex flex-col items-center gap-2.5 sm:flex-row sm:justify-center">
            <Button
              onClick={() => {
                window.dispatchEvent(new CustomEvent("open-location-modal"));
              }}
              className="gap-2 px-5"
            >
              <Search className="h-4 w-4" />
              Try a different location
            </Button>
            <Button
              variant="ghost"
              onClick={() => (window.location.href = "/")}
              className="gap-2 text-muted-foreground"
            >
              <Home className="h-4 w-4" />
              Back to home
            </Button>
          </div>

          {/* Subtle trust footer */}
          <div className="mx-auto mt-10 max-w-sm rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-medium text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              <span>Stay in the loop</span>
            </div>
            <p className="mt-1 text-left text-[11px] text-muted-foreground">
              We&apos;re expanding to 200+ new cities every month. Pick a
              nearby serviceable city to start shopping today, and we&apos;ll
              notify you when we launch in your area.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
