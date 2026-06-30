"use client";

import * as React from "react";
import { deliveryZoneService } from "@/services/delivery-zone.service";

export type ServiceabilityState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "invalid" }
  | { status: "unserviceable"; pincode: string; message: string }
  | {
      status: "serviceable";
      pincode: string;
      city: string;
      state: string;
      country: string;
      estimatedDays?: number;
      codEnabled?: boolean;
      prepaidOnly?: boolean;
      minOrderFreeDelivery?: number | null;
      cities?: { name: string; isActive?: boolean }[];
    };

const IDLE: ServiceabilityState = { status: "idle" };

export function usePincodeCheck(debounceMs = 400) {
  const [state, setState] = React.useState<ServiceabilityState>(IDLE);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCheckedRef = React.useRef<string>("");

  const check = React.useCallback(
    (rawPincode: string) => {
      const pin = (rawPincode || "").replace(/\D/g, "").slice(0, 6);
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (pin.length === 0) {
        setState(IDLE);
        return;
      }
      if (pin.length < 6) {
        setState({ status: "invalid" });
        return;
      }
      if (lastCheckedRef.current === pin) return;
      setState({ status: "checking" });
      debounceRef.current = setTimeout(async () => {
        try {
          const res = await deliveryZoneService.check(pin);
          const payload = (res as any)?.data ?? res;
          if (payload?.serviceable) {
            setState({
              status: "serviceable",
              pincode: payload.pincode,
              city: payload.city,
              state: payload.state,
              country: payload.country || "India",
              estimatedDays: payload.estimatedDays,
              codEnabled: payload.codEnabled,
              prepaidOnly: payload.prepaidOnly,
              minOrderFreeDelivery: payload.minOrderFreeDelivery,
              cities: payload.cities || [],
            });
            lastCheckedRef.current = pin;
          } else {
            setState({
              status: "unserviceable",
              pincode: pin,
              message:
                payload?.message ||
                "We are working on delivering to your area. Stay tuned -- it will be available very soon.",
            });
            lastCheckedRef.current = pin;
          }
        } catch {
          setState({
            status: "unserviceable",
            pincode: pin,
            message: "Could not verify serviceability. Please try again.",
          });
        }
      }, debounceMs);
    },
    [debounceMs]
  );

  const reset = React.useCallback(() => setState(IDLE), []);

  React.useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    []
  );

  return { state, check, reset };
}
