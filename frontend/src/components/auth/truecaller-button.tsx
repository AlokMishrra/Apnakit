"use client";

import * as React from "react";
import { Loader2, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { truecallerService, TruecallerStatus } from "@/services/truecaller.service";

interface TruecallerButtonProps {
  onSuccess: (data: { user: any; tokens: any }) => void;
  onError?: (error: string) => void;
  label?: string;
  className?: string;
  autoTrigger?: boolean;
}

const TRUECALLER_PARTNER_KEY = process.env.NEXT_PUBLIC_TRUECALLER_KEY || "";
const TRUECALLER_PARTNER_NAME = "ApnaKit";

function detectPlatform(): "android" | "ios" | "desktop" {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios";
  return "desktop";
}

export function TruecallerButton({
  onSuccess,
  onError,
  label = "Continue with Truecaller",
  className = "",
  autoTrigger = true,
}: TruecallerButtonProps) {
  const [showWaiting, setShowWaiting] = React.useState(false);
  const pollingRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const [platform] = React.useState(() => detectPlatform());
  const hasTriggered = React.useRef(false);

  const startPolling = (requestId: string) => {
    setShowWaiting(true);
    let polls = 0;
    const maxPolls = 10;
    pollingRef.current = setInterval(async () => {
      polls++;
      try {
        const result: TruecallerStatus = await truecallerService.getStatus(requestId);
        if (result.status === "completed" && result.user && result.tokens) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          sessionStorage.removeItem("tc_requestId");
          onSuccess({ user: result.user, tokens: result.tokens });
        } else if (result.status === "rejected") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setShowWaiting(false);
          sessionStorage.removeItem("tc_requestId");
          onError?.(result.error || "Truecaller verification was denied.");
        } else if (polls >= maxPolls || result.status === "expired") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setShowWaiting(false);
          sessionStorage.removeItem("tc_requestId");
          onError?.("Verification timed out. Please try again or use OTP.");
        }
      } catch {
        if (polls >= maxPolls) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setShowWaiting(false);
          sessionStorage.removeItem("tc_requestId");
          onError?.("Verification timed out. Please try again or use OTP.");
        }
      }
    }, 3000);
  };

  const triggerTruecaller = async () => {
    if (hasTriggered.current) return;
    hasTriggered.current = true;

    try {
      const { requestId } = await truecallerService.getNonce();

      const deepLink = new URL("truecallersdk://truesdk/web_verify");
      deepLink.searchParams.set("type", "btmsheet");
      deepLink.searchParams.set("requestNonce", requestId);
      deepLink.searchParams.set("partnerKey", TRUECALLER_PARTNER_KEY);
      deepLink.searchParams.set("partnerName", TRUECALLER_PARTNER_NAME);
      deepLink.searchParams.set("lang", "en");
      deepLink.searchParams.set("loginPrefix", "continue");
      deepLink.searchParams.set("loginSuffix", "verifymobile");
      deepLink.searchParams.set("ctaPrefix", "continuewith");
      deepLink.searchParams.set("skipOption", "useanothermethod");
      deepLink.searchParams.set("ctaColor", "%2325D366");
      deepLink.searchParams.set("ctaTextColor", "%23FFFFFF");
      deepLink.searchParams.set("btnShape", "round");
      deepLink.searchParams.set("ttl", "30000");

      sessionStorage.setItem("tc_requestId", requestId);

      // Start polling immediately — the deep link triggers Chrome's
      // "Open in Truecaller?" dialog, then Truecaller opens.
      startPolling(requestId);

      // Fire the deep link — this shows Chrome's native "Open app?" dialog
      window.location.href = deepLink.toString();

      // If after 1.5s the user hasn't left the page, Truecaller likely isn't installed
      setTimeout(() => {
        if (document.hasFocus() && showWaiting) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setShowWaiting(false);
          hasTriggered.current = false;
          sessionStorage.removeItem("tc_requestId");
          onError?.("Truecaller app not found. Please install from Play Store or use OTP.");
        }
      }, 1500);
    } catch (err: any) {
      hasTriggered.current = false;
      onError?.(err.message || "Failed to start Truecaller verification.");
    }
  };

  React.useEffect(() => {
    if (platform === "android" && autoTrigger && TRUECALLER_PARTNER_KEY && !hasTriggered.current) {
      triggerTruecaller();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform, autoTrigger]);

  React.useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  if (!TRUECALLER_PARTNER_KEY) return null;

  return (
    <div className={className}>
      {showWaiting && (
        <div className="rounded-lg border bg-green-50 p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">Waiting for Truecaller...</p>
              <p className="text-xs text-green-700">Please complete verification in the Truecaller app</p>
            </div>
            <button
              onClick={() => {
                if (pollingRef.current) clearInterval(pollingRef.current);
                setShowWaiting(false);
                hasTriggered.current = false;
                sessionStorage.removeItem("tc_requestId");
                onError?.("Cancelled. Please use OTP instead.");
              }}
              className="rounded p-1 hover:bg-green-100"
              type="button"
            >
              <X className="h-4 w-4 text-green-700" />
            </button>
          </div>
        </div>
      )}
      {!showWaiting && (
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => {
            hasTriggered.current = false;
            triggerTruecaller();
          }}
          type="button"
        >
          <Phone className="h-4 w-4 text-green-600" />
          {label}
        </Button>
      )}
    </div>
  );
}
