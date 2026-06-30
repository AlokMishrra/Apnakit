"use client";

import { useEffect, useState } from "react";
import { X, Download, Share2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa_install_dismissed";
const DISMISS_DAYS = 3;

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Already installed?
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }
    if ((navigator as any).standalone === true) {
      setInstalled(true);
      return;
    }

    // Dismissed recently?
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const daysSince = (Date.now() - Number(dismissed)) / (1000 * 60 * 60 * 24);
      if (daysSince < DISMISS_DAYS) return;
    }

    // Detect iOS
    const ua = navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIOS(iOS);

    // Listen for install completion
    const installedHandler = () => {
      setInstalled(true);
      setShow(false);
      localStorage.removeItem(DISMISS_KEY);
    };
    window.addEventListener("appinstalled", installedHandler);

    if (iOS) {
      // iOS: show the persistent banner after a short delay
      const timer = setTimeout(() => setShow(true), 2000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("appinstalled", installedHandler);
      };
    }

    // Android/Chrome: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShow(false);
  };

  if (installed || !show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
      <div className="mx-auto flex max-w-2xl items-center gap-3 p-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
          <Smartphone className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            Install ApnaKit App
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {isIOS
              ? 'Tap the Share button, then "Add to Home Screen"'
              : "Faster access • Works offline • No downloads"}
          </p>
        </div>
        {isIOS ? (
          <div className="flex flex-shrink-0 items-center gap-1 text-indigo-600">
            <Share2 className="h-5 w-5" />
          </div>
        ) : (
          <Button
            onClick={handleInstall}
            size="sm"
            className="h-8 flex-shrink-0 rounded-full px-4 text-xs font-semibold"
          >
            <Download className="mr-1 h-3.5 w-3.5" />
            Install
          </Button>
        )}
        <button
          onClick={handleDismiss}
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-gray-100 hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
