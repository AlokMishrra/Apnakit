"use client";

import * as React from "react";
import { deliveryZoneService } from "@/services/delivery-zone.service";
import { reverseGeocode, ipGeolocation } from "@/services/geocoding.service";

export interface UserLocation {
  city: string;
  state?: string;
  pincode?: string;
  country?: string;
  fullAddress?: string;
  source: "gps" | "manual" | "ip" | "default";
  lat?: number;
  lng?: number;
}

export interface ServiceablePlace {
  city: string;
  state: string;
  country: string;
}

interface LocationContextValue {
  location: UserLocation | null;
  setLocation: (loc: UserLocation | null) => void;
  requestLocation: () => void;
  loading: boolean;
  hasPrompted: boolean;
  markPrompted: () => void;
  clearLocation: () => void;
  // Serviceability data — all sourced from real API
  serviceableCities: ServiceablePlace[];
  isCityServiceable: (city: string, state?: string) => boolean;
  isPincodeServiceable: (pincode: string) => Promise<{
    serviceable: boolean;
    city?: string;
    state?: string;
    estimatedDays?: number;
    message?: string;
  }>;
  refreshServiceability: () => Promise<void>;
  searchCities: (query: string) => Promise<ServiceablePlace[]>;
}

const LocationContext = React.createContext<LocationContextValue | undefined>(
  undefined
);

const STORAGE_KEY = "apnakit:user-location";
const PROMPTED_KEY = "apnakit:location-prompted";
const SERVICEABLE_CACHE_KEY = "apnakit:serviceable-cities";
const SERVICEABLE_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedServiceableCities {
  cities: ServiceablePlace[];
  cachedAt: number;
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocationState] = React.useState<UserLocation | null>(null);
  const [hasPrompted, setHasPrompted] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [hydrated, setHydrated] = React.useState(false);
  const [serviceableCities, setServiceableCities] = React.useState<
    ServiceablePlace[]
  >([]);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setLocationState(JSON.parse(stored));
      const prompted = localStorage.getItem(PROMPTED_KEY);
      if (prompted === "true") setHasPrompted(true);
    } catch {
      // ignore
    } finally {
      setHydrated(true);
    }
  }, []);

  const refreshServiceability = React.useCallback(async () => {
    try {
      const cached = localStorage.getItem(SERVICEABLE_CACHE_KEY);
      if (cached) {
        const parsed: CachedServiceableCities = JSON.parse(cached);
        if (Date.now() - parsed.cachedAt < SERVICEABLE_CACHE_TTL_MS && parsed.cities?.length) {
          setServiceableCities(parsed.cities);
          return;
        }
      }
      const res = await deliveryZoneService.cities();
      const data = res?.data || res;
      const list: ServiceablePlace[] = Array.isArray(data) ? data : [];
      setServiceableCities(list);
      try {
        localStorage.setItem(
          SERVICEABLE_CACHE_KEY,
          JSON.stringify({ cities: list, cachedAt: Date.now() })
        );
      } catch {
        // ignore
      }
    } catch {
      setServiceableCities([]);
    }
  }, []);

  React.useEffect(() => {
    if (hydrated) {
      refreshServiceability();
    }
  }, [hydrated, refreshServiceability]);

  const setLocation = React.useCallback((loc: UserLocation | null) => {
    setLocationState(loc);
    try {
      if (loc) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, []);

  const markPrompted = React.useCallback(() => {
    setHasPrompted(true);
    try {
      localStorage.setItem(PROMPTED_KEY, "true");
    } catch {
      // ignore
    }
  }, []);

  const clearLocation = React.useCallback(() => {
    setLocationState(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const requestLocation = React.useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      // Browser doesn't support geolocation — fall back to IP-based detection
      setLoading(true);
      try {
        const ip = await ipGeolocation();
        if (ip) {
          setLocation({
            city: ip.city,
            state: ip.state,
            country: ip.country || "India",
            source: "ip",
          });
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          // Reverse geocode to get a real city name
          const result = await reverseGeocode(lat, lng);
          if (result && result.city) {
            setLocation({
              city: result.city,
              state: result.state,
              country: result.country || "India",
              source: "gps",
              lat,
              lng,
            });
          } else {
            // Geocoding failed — fall back to IP
            const ip = await ipGeolocation();
            if (ip) {
              setLocation({
                city: ip.city,
                state: ip.state,
                country: ip.country || "India",
                source: "ip",
                lat,
                lng,
              });
            } else {
              // Last resort: save raw lat/lng
              setLocation({
                city: `Location (${lat.toFixed(2)}, ${lng.toFixed(2)})`,
                country: "India",
                source: "gps",
                lat,
                lng,
              });
            }
          }
        } catch {
          setLocation({
            city: `Location (${lat.toFixed(2)}, ${lng.toFixed(2)})`,
            country: "India",
            source: "gps",
            lat,
            lng,
          });
        } finally {
          setLoading(false);
        }
      },
      async (err) => {
        // Geolocation permission denied or failed — fall back to IP
        try {
          const ip = await ipGeolocation();
          if (ip) {
            setLocation({
              city: ip.city,
              state: ip.state,
              country: ip.country || "India",
              source: "ip",
            });
          }
        } catch {
          // ignore
        } finally {
          setLoading(false);
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  }, [setLocation]);

  /**
   * Match a city against the serviceable list. We do prefix/substring match
   * so that typing "Mumbai" matches "Mumbai Fort", "Mumbai Central", etc.
   */
  const isCityServiceable = React.useCallback(
    (city: string, state?: string) => {
      const c = (city || "").toLowerCase().trim();
      if (!c) return false;
      if (serviceableCities.length === 0) return true;
      return serviceableCities.some((entry) => {
        const ec = (entry.city || "").toLowerCase().trim();
        const es = (entry.state || "").toLowerCase().trim();
        const s = (state || "").toLowerCase().trim();
        // Exact match on city (with optional state)
        if (ec === c && (!s || es === s)) return true;
        // Substring match — "Mumbai" matches "Mumbai Fort"
        if (ec.includes(c) || c.includes(ec)) {
          if (!s || !es || s === es) return true;
        }
        return false;
      });
    },
    [serviceableCities]
  );

  const isPincodeServiceable = React.useCallback(
    async (pincode: string) => {
      if (!/^\d{6}$/.test(pincode)) {
        return { serviceable: false, message: "Please enter a valid 6-digit pincode." };
      }
      try {
        const res = await deliveryZoneService.check(pincode);
        const data = (res?.data || res) as {
          serviceable: boolean;
          city?: string;
          state?: string;
          estimatedDays?: number;
          message?: string;
        };
        return data;
      } catch {
        return {
          serviceable: false,
          message: "We could not verify this pincode. Please try again later.",
        };
      }
    },
    []
  );

  const searchCities = React.useCallback(
    async (query: string): Promise<ServiceablePlace[]> => {
      if (!query || query.trim().length < 1) return [];
      try {
        const res = await deliveryZoneService.cities(query.trim());
        const data = res?.data || res;
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
    []
  );

  if (!hydrated) {
    return <>{children}</>;
  }

  return (
    <LocationContext.Provider
      value={{
        location,
        setLocation,
        requestLocation,
        loading,
        hasPrompted,
        markPrompted,
        clearLocation,
        serviceableCities,
        isCityServiceable,
        isPincodeServiceable,
        refreshServiceability,
        searchCities,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = React.useContext(LocationContext);
  if (!ctx) {
    return {
      location: null,
      setLocation: () => {},
      requestLocation: () => {},
      loading: false,
      hasPrompted: false,
      markPrompted: () => {},
      clearLocation: () => {},
      serviceableCities: [],
      isCityServiceable: () => true,
      isPincodeServiceable: async () => ({
        serviceable: false,
        message: "Unable to verify pincode",
      }),
      refreshServiceability: async () => {},
      searchCities: async () => [],
    } as LocationContextValue;
  }
  return ctx;
}
