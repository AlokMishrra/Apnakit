"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Navigation,
  Search,
  X,
  Loader2,
  CheckCircle2,
  PartyPopper,
  ChevronRight,
  Check,
  AlertCircle,
  Shield,
} from "lucide-react";
import { useLocation, type UserLocation } from "./location-context";
import { ALL_INDIAN_CITIES } from "./indian-cities";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface LocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isFirstTimePrompt?: boolean;
}

function DetectedLocationCard({
  city,
  state,
  isServiceable,
  loading,
  onConfirm,
  onRetry,
  onChange,
}: {
  city: string;
  state: string;
  isServiceable: boolean;
  loading: boolean;
  onConfirm: () => void;
  onRetry: () => void;
  onChange: () => void;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-colors",
        isServiceable
          ? "border-emerald-200 bg-emerald-50/40"
          : "border-amber-200 bg-amber-50/40"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg",
            isServiceable ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"
          )}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isServiceable ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <PartyPopper className="h-5 w-5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            We detected you in
          </p>
          <p className="mt-0.5 truncate text-base font-semibold text-foreground">
            {city}
            {state ? <span className="text-muted-foreground">, {state}</span> : ""}
          </p>
          <p
            className={cn(
              "mt-0.5 text-xs font-medium",
              isServiceable ? "text-emerald-700" : "text-amber-700"
            )}
          >
            {loading
              ? "Verifying..."
              : isServiceable
                ? "We deliver here"
                : "Not yet in our delivery network"}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {isServiceable ? (
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="h-9 flex-1 gap-2"
          >
            <Check className="h-4 w-4" />
            Use this location
          </Button>
        ) : (
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="h-9 flex-1 gap-2"
            variant="outline"
          >
            <MapPin className="h-4 w-4" />
            Save anyway
          </Button>
        )}
        <Button
          onClick={onRetry}
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          title="Detect again"
        >
          <Loader2 className="h-4 w-4" />
        </Button>
        <Button
          onClick={onChange}
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          title="Pick another location"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

type Banner =
  | { type: "idle" }
  | {
      type: "success";
      city: string;
      state?: string;
      days?: number;
      minFree?: number | null;
      cities?: { name: string; isActive?: boolean }[];
      pincode?: string;
    }
  | {
      type: "unserviceable";
      pincode?: string;
      city?: string;
      state?: string;
      message: string;
    };

export function LocationModal({
  open,
  onOpenChange,
  isFirstTimePrompt = false,
}: LocationModalProps) {
  const {
    location,
    setLocation,
    requestLocation,
    markPrompted,
    serviceableCities,
    isCityServiceable,
    isPincodeServiceable,
    searchCities,
  } = useLocation();
  const [search, setSearch] = React.useState("");
  const [pincodeInput, setPincodeInput] = React.useState("");
  const [checking, setChecking] = React.useState(false);
  const [detecting, setDetecting] = React.useState(false);
  const [searching, setSearching] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<
    { city: string; state: string; country: string }[]
  >([]);
  const [banner, setBanner] = React.useState<Banner>({ type: "idle" });
  const [pincodeDebounceRef, setPincodeDebounceRef] =
    React.useState<ReturnType<typeof setTimeout> | null>(null);
  const [pincodeCities, setPincodeCities] = React.useState<
    { city: string; state: string; country: string }[]
  >([]);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Detected location (after GPS): user must confirm before saving
  const [detectedLocation, setDetectedLocation] = React.useState<{
    city: string;
    state: string;
    country: string;
  } | null>(null);

  React.useEffect(() => {
    if (!open) {
      setBanner({ type: "idle" });
      setPincodeInput("");
      setSearch("");
      setSearchResults([]);
      setDetectedLocation(null);
      setPincodeCities([]);
    } else {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [open]);

  React.useEffect(() => {
    const q = search.trim();
    if (q.length === 0) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      const results = await searchCities(q);
      setSearchResults(results);
      setSearching(false);
    }, 200);
    return () => clearTimeout(t);
  }, [search, searchCities]);

  const serviceableKeySet = React.useMemo(() => {
    const s = new Set<string>();
    serviceableCities.forEach((c) => {
      s.add(`${c.city.toLowerCase().trim()}|${(c.state || "").toLowerCase().trim()}`);
    });
    return s;
  }, [serviceableCities]);

  const isServiceable = React.useCallback(
    (city: string, state: string) => {
      if (serviceableCities.length === 0) return true;
      return serviceableKeySet.has(
        `${(city || "").toLowerCase().trim()}|${(state || "").toLowerCase().trim()}`
      );
    },
    [serviceableCities, serviceableKeySet]
  );

  const listItems = React.useMemo(() => {
    const q = search.trim();
    const seen = new Set<string>();
    const out: { city: string; state: string; country: string; isServiceable: boolean; pincode?: string }[] = [];

    const addIfNew = (city: string, state: string, country: string, svc: boolean, pincode?: string) => {
      const key = `${city.toLowerCase().trim()}|${state.toLowerCase().trim()}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ city, state, country, isServiceable: svc, pincode });
    };

    // Default: show all serviceable cities
    if (q.length === 0) {
      for (const c of serviceableCities) {
        addIfNew(c.city, c.state, c.country || "India", true);
      }
      return out;
    }

    // Search serviceable cities
    const ql = q.toLowerCase();
    for (const c of serviceableCities) {
      if (c.city.toLowerCase().includes(ql) || c.state.toLowerCase().includes(ql)) {
        addIfNew(c.city, c.state, c.country || "India", true);
      }
      if (out.length >= 100) break;
    }
    for (const c of searchResults) {
      addIfNew(c.city, c.state, c.country || "India", true);
      if (out.length >= 120) break;
    }

    // If search query doesn't match any serviceable city, show non-serviceable matches as Coming Soon
    if (out.length === 0 && q.length >= 2) {
      const seenCities = new Set<string>();
      for (const c of ALL_INDIAN_CITIES) {
        const key = `${c.city.toLowerCase()}|${c.state.toLowerCase()}`;
        if (seenCities.has(key)) continue;
        if (c.city.toLowerCase().includes(ql) || c.state.toLowerCase().includes(ql)) {
          seenCities.add(key);
          out.push({ city: c.city, state: c.state, country: "India", isServiceable: false });
        }
        if (out.length >= 20) break;
      }
    }

    return out;
  }, [search, searchResults, serviceableCities]);

  const handleSelect = (loc: UserLocation) => {
    setLocation(loc);
    setSearch("");
    setPincodeInput("");
    setBanner({ type: "idle" });
    setDetectedLocation(null);
    setPincodeCities([]);
    markPrompted();
    onOpenChange(false);
    setTimeout(() => {
      if (typeof window !== "undefined") window.location.reload();
    }, 100);
  };

  const handleDetect = async () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast.error("Your browser does not support location services.");
      return;
    }
    setDetecting(true);
    try {
      // 1. Request GPS permission and get coordinates
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 5 * 60 * 1000,
        });
      });
      const { latitude, longitude } = pos.coords;
      // 2. requestLocation reverse-geocodes the coordinates to a city name
      //    and saves it to the context. It also handles IP fallback.
      await requestLocation();
      // 3. After requestLocation resolves, the context location is updated.
      //    We capture the detected city from a fresh location read.
      //    We use a small timeout to allow the React state to settle.
      await new Promise((r) => setTimeout(r, 200));
      // 4. Re-read the saved location from localStorage directly to
      //    avoid any stale-closure issues with the React state.
      let detected: { city: string; state: string; country: string } | null = null;
      try {
        const raw = localStorage.getItem("apnakit:user-location");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (
            parsed &&
            parsed.city &&
            !parsed.city.startsWith("Location (")
          ) {
            detected = {
              city: parsed.city,
              state: parsed.state || "",
              country: parsed.country || "India",
            };
          }
        }
      } catch {
        // ignore
      }
      if (!detected && location && location.city && !location.city.startsWith("Location (")) {
        detected = {
          city: location.city,
          state: location.state || "",
          country: location.country || "India",
        };
      }
      if (detected) {
        setDetectedLocation(detected);
      } else {
        toast.error("Could not determine your city. Please enter pincode or pick a city.");
      }
    } catch (err: any) {
      // Permission denied or other error
      const code = err?.code;
      if (code === 1) {
        toast.error("Location permission denied. Please enter pincode or pick a city.");
      } else if (code === 3) {
        toast.error("Location request timed out. Please try again or enter pincode.");
      } else {
        toast.error("Could not detect your location. Please enter pincode or pick a city.");
      }
    } finally {
      setDetecting(false);
    }
  };

  const handleConfirmDetected = () => {
    if (!detectedLocation) return;
    handleSelect({
      city: detectedLocation.city,
      state: detectedLocation.state,
      country: detectedLocation.country,
      source: "gps",
    });
  };

  const handleRetryDetect = () => {
    setDetectedLocation(null);
    handleDetect();
  };

  const triggerPincodeCheck = React.useCallback(
    (pin: string) => {
      if (pincodeDebounceRef) clearTimeout(pincodeDebounceRef);
      if (pin.length !== 6) {
        setBanner({ type: "idle" });
        setPincodeCities([]);
        return;
      }
      setBanner({ type: "idle" });
      setChecking(true);
      const t = setTimeout(async () => {
        const res = await isPincodeServiceable(pin);
        setChecking(false);
        if (res.serviceable) {
          setBanner({
            type: "success",
            city: res.city || "your area",
            state: res.state,
            days: res.estimatedDays,
            minFree: res.minOrderFreeDelivery,
            cities: res.cities || [],
            pincode: pin,
          });
          // Populate pincode cities for the city list
          const cities = res.cities || [];
          if (cities.length > 0) {
            setPincodeCities(
              cities
                .filter((c: any) => c.isActive !== false)
                .map((c: any) => ({
                  city: c.name,
                  state: res.state || "",
                  country: res.country || "India",
                }))
            );
          } else if (res.city) {
            setPincodeCities([{ city: res.city, state: res.state || "", country: res.country || "India" }]);
          }
        } else {
          setBanner({
            type: "unserviceable",
            pincode: pin,
            message:
              res.message ||
              "We're working on delivering to this pincode. Stay tuned — it will be available very soon!",
          });
        }
      }, 400);
      setPincodeDebounceRef(t);
    },
    [isPincodeServiceable, pincodeDebounceRef]
  );

  React.useEffect(() => {
    return () => {
      if (pincodeDebounceRef) clearTimeout(pincodeDebounceRef);
    };
  }, [pincodeDebounceRef]);

  const handlePincodeApply = async () => {
    if (pincodeInput.trim().length !== 6) return;
    const pin = pincodeInput.trim();
    if (pincodeDebounceRef) clearTimeout(pincodeDebounceRef);
    setChecking(true);
    const res = await isPincodeServiceable(pin);
    setChecking(false);
    setLocation({
      city: res.city || `PIN ${pin}`,
      state: res.state,
      pincode: pin,
      country: res.country || "India",
      source: "manual",
    });
    markPrompted();
    if (res.serviceable) {
      setBanner({
        type: "success",
        city: res.city || "your area",
        state: res.state,
        days: res.estimatedDays,
        minFree: res.minOrderFreeDelivery,
        cities: res.cities || [],
        pincode: pin,
      });
      // Populate pincode cities for the city list
      const cities = res.cities || [];
      if (cities.length > 0) {
        setPincodeCities(
          cities
            .filter((c: any) => c.isActive !== false)
            .map((c: any) => ({
              city: c.name,
              state: res.state || "",
              country: res.country || "India",
            }))
        );
      } else if (res.city) {
        setPincodeCities([{ city: res.city, state: res.state || "", country: res.country || "India" }]);
      }
    } else {
      setBanner({
        type: "unserviceable",
        pincode: pin,
        message:
          res.message ||
          "We're working on delivering to this pincode. Stay tuned — it will be available very soon!",
      });
    }
    onOpenChange(false);
    setTimeout(() => {
      if (typeof window !== "undefined") window.location.reload();
    }, 600);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-2xl">
        {/* Modern header with subtle gradient */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-600 to-purple-600 px-6 pb-7 pt-6 text-white">
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-white/5 blur-xl" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold tracking-tight text-white">
                {isFirstTimePrompt ? "Set your location" : "Change location"}
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-sm text-white/80">
                We&apos;ll show products available for delivery to you
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="max-h-[60vh] space-y-3 overflow-y-auto px-5 py-4">
          {/* Detect location button OR confirmation step */}
          {detectedLocation ? (
            <DetectedLocationCard
              city={detectedLocation.city}
              state={detectedLocation.state}
              isServiceable={isServiceable(
                detectedLocation.city,
                detectedLocation.state
              )}
              loading={detecting}
              onConfirm={handleConfirmDetected}
              onRetry={handleRetryDetect}
              onChange={() => setDetectedLocation(null)}
            />
          ) : (
            <button
              type="button"
              onClick={handleDetect}
              disabled={detecting}
              className="group flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3.5 text-left transition-all hover:border-indigo-300 hover:bg-indigo-50/50 hover:shadow-sm disabled:opacity-60"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                {detecting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Navigation className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {detecting ? "Detecting your location..." : "Use current location"}
                </p>
                <p className="text-xs text-muted-foreground">
                  We&apos;ll detect your city using GPS
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          )}

          {/* Pincode check */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Pincode
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="tel"
                inputMode="numeric"
                maxLength={6}
                value={pincodeInput}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setPincodeInput(v);
                  triggerPincodeCheck(v);
                }}
                placeholder="Enter 6-digit pincode"
                className="h-11 flex-1 rounded-lg border-border text-sm shadow-none"
              />
              <Button
                onClick={handlePincodeApply}
                disabled={pincodeInput.length !== 6 || checking}
                size="default"
                className={cn(
                  "h-11 px-4 transition-all",
                  banner.type === "success" &&
                    "bg-emerald-600 text-white hover:bg-emerald-700",
                  banner.type === "unserviceable" &&
                    "border-amber-500 bg-amber-500 text-white hover:bg-amber-600 hover:text-white"
                )}
              >
                {checking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : banner.type === "success" ? (
                  <>
                    <Check className="mr-1.5 h-4 w-4" />
                    Apply
                  </>
                ) : banner.type === "unserviceable" ? (
                  <>
                    <MapPin className="mr-1.5 h-4 w-4" />
                    Save anyway
                  </>
                ) : (
                  "Check"
                )}
              </Button>
            </div>

            {checking && (
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Checking...
              </div>
            )}

            {!checking && banner.type === "success" && (
              <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs">
                <div className="flex items-start gap-2 text-emerald-900">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-600" />
                  <div className="flex-1">
                    <p className="font-medium">Find and select your nearest location</p>
                    <p className="text-emerald-700">
                      {banner.cities && banner.cities.length > 1
                        ? `We deliver to ${banner.city} — ${banner.cities.length} areas available:`
                        : banner.days
                          ? `Delivery in ${banner.days} day${banner.days > 1 ? "s" : ""}`
                          : `We deliver to ${banner.city}`}
                    </p>
                  </div>
                </div>
                {banner.cities && banner.cities.length > 1 && (
                  <ul className="mt-2 divide-y divide-emerald-200 overflow-hidden rounded-md border border-emerald-200 bg-white">
                    {banner.cities
                      .filter((c) => c.isActive !== false)
                      .map((c) => (
                        <li key={c.name}>
                          <button
                            type="button"
                            onClick={() => {
                              handleSelect({
                                city: c.name,
                                state: banner.state,
                                country: "India",
                                pincode: banner.pincode,
                                source: "manual",
                              });
                            }}
                            className="flex w-full items-center gap-2 px-2.5 py-2 text-left text-xs text-emerald-900 transition-colors hover:bg-emerald-50 active:bg-emerald-100"
                          >
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-emerald-600" />
                            <span className="font-medium">{c.name}</span>
                            {banner.state && (
                              <span className="text-emerald-700/70">· {banner.state}</span>
                            )}
                            <ChevronRight className="ml-auto h-3.5 w-3.5 flex-shrink-0 text-emerald-600/50" />
                          </button>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            )}

            {!checking && banner.type === "unserviceable" && (
              <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs">
                <PartyPopper className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-600" />
                <div className="flex-1 text-amber-900">
                  <p className="font-medium">Coming soon to {banner.pincode}!</p>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
              <span className="bg-background px-2 font-medium text-muted-foreground">
                {pincodeCities.length > 0 ? "select your area" : "or pick a city"}
              </span>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search city or state..."
              className="h-11 rounded-lg border-border pl-9 pr-9 text-sm shadow-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            {searching && (
              <Loader2 className="absolute right-9 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Cities list */}
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            {searching ? (
              <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Searching cities...</span>
              </div>
            ) : listItems.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                {search.trim()
                  ? `No cities found for "${search}"`
                  : "Loading cities..."}
              </div>
            ) : (
              <ul className="max-h-72 divide-y divide-border overflow-y-auto">
                {listItems.map((loc) => {
                  const isSelected =
                    location?.city === loc.city &&
                    location?.state === loc.state &&
                    !location?.pincode;
                  return (
                    <li key={`${loc.city}-${loc.state}`}>
                      {loc.isServiceable ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleSelect({
                              city: loc.city,
                              state: loc.state,
                              country: loc.country,
                              pincode: loc.pincode,
                              source: "manual",
                            })
                          }
                          className={cn(
                            "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted/60 active:bg-muted",
                            isSelected && "bg-indigo-50/60"
                          )}
                        >
                          <div className="relative flex-shrink-0">
                            <MapPin className="h-4 w-4 text-emerald-600" />
                            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-emerald-600 ring-1 ring-card">
                              <Check className="h-1.5 w-1.5 text-white" strokeWidth={4} />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                "truncate font-medium",
                                isSelected ? "text-indigo-700" : "text-foreground"
                              )}
                            >
                              {loc.city}
                            </p>
                            {loc.state && (
                              <p className="truncate text-xs text-muted-foreground">
                                {loc.state}
                              </p>
                            )}
                          </div>
                          {isSelected ? (
                            <Badge variant="default" className="bg-indigo-600 text-xs">
                              Selected
                            </Badge>
                          ) : (
                            <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/50" />
                          )}
                        </button>
                      ) : (
                        <div className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm opacity-60">
                          <div className="relative flex-shrink-0">
                            <MapPin className="h-4 w-4 text-amber-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-foreground">
                              {loc.city}
                            </p>
                            {loc.state && (
                              <p className="truncate text-xs text-muted-foreground">
                                {loc.state}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className="text-[10px] border-amber-300 bg-amber-50 text-amber-700 whitespace-nowrap">
                            Coming Soon
                          </Badge>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Minimal footer with trust message */}
        <div className="flex items-center justify-center gap-1.5 border-t border-border bg-muted/30 px-5 py-2.5 text-[11px] text-muted-foreground">
          <Shield className="h-3 w-3" />
          <span>Your location is stored locally. We don&apos;t share it.</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
