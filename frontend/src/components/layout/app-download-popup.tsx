"use client";

import * as React from "react";
import {
  X, Star, Download, Sparkles, Smartphone, Apple, Monitor,
  ChevronRight, ArrowRight, ShoppingBag, Truck, Zap, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { appBannerService, type AppBannerConfig } from "@/services/app-banner.service";

const POPUP_DISMISSED_KEY = "apnakit:popup-dismissed";
const POPUP_DISMISSED_TS_KEY = "apnakit:popup-dismissed-ts";
const CONFIG_CACHE_KEY = "apnakit:app-banner-config";
const CONFIG_CACHE_TS = "apnakit:app-banner-config-ts";
const CACHE_TTL_MS = 60 * 1000;

function detectPlatform(): "android" | "ios" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  const ua = window.navigator.userAgent.toLowerCase();
  if (/android/.test(ua)) return "android";
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  return "desktop";
}

function shouldShowPopup(config: AppBannerConfig): boolean {
  if (!config.popupEnabled) return false;
  if (typeof window === "undefined") return false;

  const frequency = config.popupFrequency || "once_per_device";

  if (frequency === "every_visit") return true;

  if (frequency === "once_per_day") {
    const lastDismissed = localStorage.getItem(POPUP_DISMISSED_TS_KEY);
    if (!lastDismissed) return true;
    const diff = Date.now() - parseInt(lastDismissed, 10);
    return diff > 24 * 60 * 60 * 1000;
  }

  // once_per_device
  const dismissed = localStorage.getItem(POPUP_DISMISSED_KEY);
  return !dismissed;
}

function IconWithFallback({ src, size = "lg" }: { src: string; size?: "sm" | "lg" }) {
  const [error, setError] = React.useState(false);
  if (error) return <Sparkles className={size === "lg" ? "h-10 w-10" : "h-5 w-5"} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="App icon"
      className={cn("object-cover", size === "lg" ? "h-full w-full" : "h-full w-full")}
      onError={() => setError(true)}
    />
  );
}

export function AppDownloadPopup() {
  const [open, setOpen] = React.useState(false);
  const [config, setConfig] = React.useState<AppBannerConfig | null>(null);
  const [showAllOptions, setShowAllOptions] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);
  const [hasAnimated, setHasAnimated] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (typeof window !== "undefined") {
          const ts = parseInt(localStorage.getItem(CONFIG_CACHE_TS) || "0", 10);
          if (Date.now() - ts < CACHE_TTL_MS) {
            const raw = localStorage.getItem(CONFIG_CACHE_KEY);
            if (raw) {
              const parsed = JSON.parse(raw) as AppBannerConfig;
              if (!cancelled && parsed && shouldShowPopup(parsed)) {
                setConfig(parsed);
              }
            }
          }
        }
        const fresh = await appBannerService.getPublic();
        if (cancelled) return;
        if (fresh && fresh.isActive && shouldShowPopup(fresh)) {
          setConfig(fresh);
          try {
            localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(fresh));
            localStorage.setItem(CONFIG_CACHE_TS, String(Date.now()));
          } catch {}
        }
      } catch {
        // silently fail
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  React.useEffect(() => {
    if (!config) return;
    const t = setTimeout(() => {
      setOpen(true);
      requestAnimationFrame(() => setHasAnimated(true));
    }, 1200);
    return () => clearTimeout(t);
  }, [config]);

  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      setOpen(false);
      setIsClosing(false);
      try {
        localStorage.setItem(POPUP_DISMISSED_KEY, "true");
        localStorage.setItem(POPUP_DISMISSED_TS_KEY, String(Date.now()));
      } catch {}
    }, 300);
  };

  const handleContinueWebsite = () => {
    handleDismiss();
  };

  const buildDownloadUrl = (): string | null => {
    if (!config) return null;
    const platform = detectPlatform();
    if (platform === "android") {
      return config.apkFileUrl || config.playStoreUrl || null;
    }
    if (platform === "ios") {
      return config.ipaFileUrl || config.appStoreUrl || null;
    }
    return config.playStoreUrl || config.appStoreUrl || config.apkFileUrl || null;
  };

  const handleDownloadApp = () => {
    const url = buildDownloadUrl();
    if (url) {
      const isApk = url.includes(".apk") || url.includes("apk");
      if (isApk) {
        const a = document.createElement("a");
        a.href = url;
        a.download = config?.apkFileName || "apnakit.apk";
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } else {
      setShowAllOptions(true);
    }
  };

  const hasAnyDownload = config && (
    config.playStoreUrl || config.appStoreUrl || config.apkFileUrl ||
    config.ipaFileUrl || config.windowsAppUrl || config.macAppUrl
  );

  if (!open || !config) return null;

  return (
    <>
      <style jsx global>{`
        @keyframes popup-overlay-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes popup-overlay-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes popup-card-in {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes popup-card-out {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(40px) scale(0.95); }
        }
        @keyframes popup-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes popup-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(124,58,237,0.3), 0 0 60px rgba(124,58,237,0.1); }
          50% { box-shadow: 0 0 30px rgba(124,58,237,0.5), 0 0 80px rgba(124,58,237,0.2); }
        }
        @keyframes popup-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes popup-slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes popup-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .popup-overlay {
          animation: ${isClosing ? 'popup-overlay-out 0.3s ease-in forwards' : 'popup-overlay-in 0.4s ease-out'};
        }
        .popup-card {
          animation: ${isClosing ? 'popup-card-out 0.3s ease-in forwards' : 'popup-card-in 0.5s cubic-bezier(0.16, 1, 0.3, 1)'};
        }
        .popup-float {
          animation: popup-float 3s ease-in-out infinite;
        }
        .popup-glow {
          animation: popup-glow 2s ease-in-out infinite;
        }
        .popup-shimmer {
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%);
          background-size: 200% 100%;
          animation: popup-shimmer 2s ease-in-out infinite;
        }
        .popup-slide-up {
          animation: popup-slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .popup-pulse {
          animation: popup-pulse 2s ease-in-out infinite;
        }
      `}</style>

      <div
        className={cn(
          "popup-overlay fixed inset-0 z-[100] flex items-center justify-center p-4",
          "bg-black/60 backdrop-blur-sm"
        )}
        onClick={handleContinueWebsite}
      >
        <div
          className={cn(
            "popup-card relative w-full max-w-[420px] overflow-hidden rounded-3xl",
            "bg-white shadow-2xl"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Gradient header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 px-6 pt-8 pb-20">
            {/* Decorative circles */}
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/5" />
            <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/5" />
            <div className="absolute top-1/2 right-8 h-20 w-20 rounded-full bg-white/5" />

            {/* Close button */}
            <button
              onClick={handleContinueWebsite}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            {/* App icon */}
            <div className="popup-float relative z-10 mx-auto mb-4">
              <div
                className="popup-glow mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/20"
                style={{
                  backgroundColor: config.iconBgColor || "#FACC15",
                  color: config.iconFgColor || "#7C3AED",
                }}
              >
                {config.iconImage ? (
                  <IconWithFallback src={config.iconImage} />
                ) : (
                  <Sparkles className="h-10 w-10" />
                )}
              </div>
            </div>

            {/* Title */}
            <div className="popup-slide-up relative z-10 text-center" style={{ animationDelay: "0.1s" }}>
              <h2 className="text-2xl font-bold text-white">
                {config.popupTitle || "Get the ApnaKit App"}
              </h2>
              <p className="mt-2 text-sm text-white/80 leading-relaxed">
                {config.popupSubtitle || "Shop faster, get exclusive deals & track orders in real-time"}
              </p>
            </div>

            {/* Rating & downloads */}
            {(config.rating || config.downloadCount) && (
              <div className="popup-slide-up relative z-10 mt-4 flex items-center justify-center gap-3 text-sm text-white/90" style={{ animationDelay: "0.2s" }}>
                {config.rating && (
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-semibold">{config.rating}</span>
                  </span>
                )}
                {config.rating && config.downloadCount && (
                  <span className="text-white/40">|</span>
                )}
                {config.downloadCount && (
                  <span>{config.downloadCount} Downloads</span>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="relative -mt-12 z-10 space-y-3 px-6 pb-6">
            {/* Download App button */}
            <Button
              onClick={handleDownloadApp}
              className={cn(
                "popup-slide-up popup-pulse h-14 w-full rounded-2xl text-base font-bold shadow-lg transition-all duration-200",
                "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700",
                "hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              )}
              style={{ animationDelay: "0.3s" }}
            >
              <Download className="mr-2 h-5 w-5" />
              {config.buttonText || "Download App"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            {/* Continue Website button */}
            <button
              onClick={handleContinueWebsite}
              className="popup-slide-up flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-600 transition-all duration-200 hover:bg-gray-100 hover:text-gray-800 hover:border-gray-300"
              style={{ animationDelay: "0.4s" }}
            >
              Continue on Website
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Features row */}
          <div className="popup-slide-up border-t border-gray-100 px-6 py-4" style={{ animationDelay: "0.5s" }}>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Zap, text: "Fast Delivery", color: "text-amber-500" },
                { icon: Shield, text: "Secure Pay", color: "text-emerald-500" },
                { icon: ShoppingBag, text: "Best Deals", color: "text-indigo-500" },
              ].map(({ icon: Icon, text, color }) => (
                <div key={text} className="flex flex-col items-center gap-1.5">
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50", color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-medium text-gray-500">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* All download options modal */}
          {showAllOptions && hasAnyDownload && (
            <div
              className="fixed inset-0 z-[110] flex items-end justify-center bg-black/50 sm:items-center"
              onClick={() => setShowAllOptions(false)}
            >
              <div
                className="w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <h3 className="text-base font-bold text-gray-900">All Download Options</h3>
                  <button
                    onClick={() => setShowAllOptions(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-2 p-4">
                  {config.playStoreUrl && (
                    <button
                      onClick={() => window.open(config.playStoreUrl!, "_blank", "noopener,noreferrer")}
                      className="flex h-14 w-full items-center gap-4 rounded-2xl border border-gray-200 px-4 text-left transition-all hover:border-emerald-300 hover:bg-emerald-50"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                        <Smartphone className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] text-gray-500">Get it on</p>
                        <p className="text-sm font-bold text-gray-900">Google Play</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </button>
                  )}
                  {config.apkFileUrl && (
                    <button
                      onClick={() => {
                        const a = document.createElement("a");
                        a.href = config.apkFileUrl!;
                        a.download = config.apkFileName || "apnakit.apk";
                        a.click();
                      }}
                      className="flex h-14 w-full items-center gap-4 rounded-2xl border border-gray-200 px-4 text-left transition-all hover:border-indigo-300 hover:bg-indigo-50"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
                        <Download className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] text-gray-500">Direct download</p>
                        <p className="text-sm font-bold text-gray-900">Android APK</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </button>
                  )}
                  {config.appStoreUrl && (
                    <button
                      onClick={() => window.open(config.appStoreUrl!, "_blank", "noopener,noreferrer")}
                      className="flex h-14 w-full items-center gap-4 rounded-2xl border border-gray-200 px-4 text-left transition-all hover:border-gray-400 hover:bg-gray-50"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                        <Apple className="h-5 w-5 text-gray-900" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] text-gray-500">Download on the</p>
                        <p className="text-sm font-bold text-gray-900">App Store</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </button>
                  )}
                  {config.ipaFileUrl && (
                    <button
                      onClick={() => {
                        const a = document.createElement("a");
                        a.href = config.ipaFileUrl!;
                        a.download = config.ipaFileName || "apnakit.ipa";
                        a.click();
                      }}
                      className="flex h-14 w-full items-center gap-4 rounded-2xl border border-gray-200 px-4 text-left transition-all hover:border-purple-300 hover:bg-purple-50"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                        <Download className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] text-gray-500">Direct download</p>
                        <p className="text-sm font-bold text-gray-900">iOS IPA</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </button>
                  )}
                  {config.windowsAppUrl && (
                    <button
                      onClick={() => window.open(config.windowsAppUrl!, "_blank", "noopener,noreferrer")}
                      className="flex h-14 w-full items-center gap-4 rounded-2xl border border-gray-200 px-4 text-left transition-all hover:border-blue-300 hover:bg-blue-50"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                        <Monitor className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] text-gray-500">Download for</p>
                        <p className="text-sm font-bold text-gray-900">Windows</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </button>
                  )}
                  {config.macAppUrl && (
                    <button
                      onClick={() => window.open(config.macAppUrl!, "_blank", "noopener,noreferrer")}
                      className="flex h-14 w-full items-center gap-4 rounded-2xl border border-gray-200 px-4 text-left transition-all hover:border-gray-400 hover:bg-gray-50"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                        <Monitor className="h-5 w-5 text-gray-700" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] text-gray-500">Download for</p>
                        <p className="text-sm font-bold text-gray-900">macOS</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </button>
                  )}
                </div>
                <div className="border-t border-gray-100 px-6 py-3">
                  <button
                    onClick={() => setShowAllOptions(false)}
                    className="w-full text-center text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
