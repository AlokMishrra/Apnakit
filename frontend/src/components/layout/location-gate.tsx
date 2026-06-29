"use client";

import * as React from "react";
import { LocationProvider, useLocation } from "./location-context";
import { LocationModal } from "./location-modal";

/**
 * Wraps the app with the LocationProvider and triggers the first-time
 * location prompt after a short delay (so it doesn't feel intrusive on first paint).
 */
export function LocationGate({ children }: { children: React.ReactNode }) {
  return (
    <LocationProvider>
      <LocationGateInner>{children}</LocationGateInner>
    </LocationProvider>
  );
}

function LocationGateInner({ children }: { children: React.ReactNode }) {
  const { hasPrompted, markPrompted, location, requestLocation } = useLocation();
  const [promptOpen, setPromptOpen] = React.useState(false);
  const [manualOpen, setManualOpen] = React.useState(false);

  // Listen for the global "open-location-modal" event (from DeliveryGate)
  React.useEffect(() => {
    const handler = () => setManualOpen(true);
    window.addEventListener("open-location-modal", handler);
    return () => window.removeEventListener("open-location-modal", handler);
  }, []);

  React.useEffect(() => {
    if (hasPrompted) return;
    // Wait briefly so the page paints first
    const t = setTimeout(() => {
      // Try auto-detect via geolocation API (browser will prompt user for permission)
      if (
        typeof navigator !== "undefined" &&
        navigator.geolocation &&
        typeof navigator.permissions !== "undefined"
      ) {
        navigator.permissions
          .query({ name: "geolocation" })
          .then((status) => {
            if (status.state === "granted") {
              requestLocation();
              markPrompted();
            } else if (status.state === "prompt") {
              setPromptOpen(true);
            } else {
              // denied
              setPromptOpen(true);
            }
          })
          .catch(() => {
            setPromptOpen(true);
          });
      } else {
        setPromptOpen(true);
      }
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isOpen = promptOpen || manualOpen;
  const isFirstTime = !location && promptOpen;

  return (
    <>
      {children}
      <LocationModal
        open={isOpen}
        onOpenChange={(o) => {
          setPromptOpen(o);
          setManualOpen(o);
          if (!o) markPrompted();
        }}
        isFirstTimePrompt={isFirstTime}
      />
    </>
  );
}
