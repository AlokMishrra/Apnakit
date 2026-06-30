"use client";

import { useEffect, useState } from "react";
import { X, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa_install_dismissed";
const DISMISS_DAYS = 7;

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if already dismissed recently
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const daysSince = (Date.now() - Number(dismissed)) / (1000 * 60 * 60 * 24);
      if (daysSince < DISMISS_DAYS) return;
    }

    // Check if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Detect iOS (which doesn't fire beforeinstallprompt)
    const ua = navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIOS(iOS);

    if (iOS) {
      // Show iOS prompt after a short delay
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    }

    // Listen for beforeinstallprompt (Android/Chrome)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4">
      <div className="relative mx-auto flex max-w-md items-start gap-3 rounded-xl border bg-white p-4 shadow-2xl">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100">
          <Download className="h-5 w-5 text-indigo-600" />
        </div>
        <div className="flex-1 pr-6">
          <p className="text-sm font-semibold text-foreground">Install ApnaKit App</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {isIOS
              ? "Tap the Share button, then select \"Add to Home Screen\""
              : "Install for faster access and a better shopping experience"}
          </p>
          {!isIOS && deferredPrompt && (
            <Button
              onClick={handleInstall}
              size="sm"
              className="mt-2 h-8 text-xs"
            >
              <Download className="mr-1 h-3 w-3" />
              Install App
            </Button>
          )}
          {isIOS && (
            <div className="mt-2 flex items-center gap-1 text-xs text-indigo-600">
              <Share2 className="h-3.5 w-3.5" />
              <span>Then tap &quot;Add to Home Screen&quot;</span>
            </div>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="absolute right-2 top-2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
