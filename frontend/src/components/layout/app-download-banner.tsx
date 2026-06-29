"use client";

import * as React from "react";
import { X, Star, Download, Sparkles, Loader2, Smartphone, Apple, Monitor, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { appBannerService, type AppBannerConfig } from "@/services/app-banner.service";

const CONFIG_CACHE_KEY = "apnakit:app-banner-config";
const CONFIG_CACHE_TS = "apnakit:app-banner-config-ts";
const CACHE_TTL_MS = 60 * 1000; // 60s

function detectPlatform(): "android" | "ios" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  const ua = window.navigator.userAgent.toLowerCase();
  if (/android/.test(ua)) return "android";
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  return "desktop";
}

function formatBytes(n: number | null | undefined): string {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function IconWithFallback({ src }: { src: string }) {
  const [error, setError] = React.useState(false);
  if (error) return <Sparkles className="h-5 w-5" />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="App icon"
      className="h-full w-full object-cover"
      onError={() => setError(true)}
    />
  );
}

export function AppDownloadBanner() {
  const [open, setOpen] = React.useState(false);
  const [config, setConfig] = React.useState<AppBannerConfig | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [showMenu, setShowMenu] = React.useState(false);
  const bannerRef = React.useRef<HTMLDivElement>(null);

  // Fetch config
  React.useEffect(() => {
    // Clear any leftover dismissal timestamp from older versions so the
    // banner comes back on every reload as required.
    try {
      localStorage.removeItem("apnakit:app-banner-dismissed-at");
    } catch {
      // ignore
    }
    let cancelled = false;
    const load = async () => {
      try {
        // Try cache first for snappy load
        if (typeof window !== "undefined") {
          const ts = parseInt(localStorage.getItem(CONFIG_CACHE_TS) || "0", 10);
          if (Date.now() - ts < CACHE_TTL_MS) {
            const raw = localStorage.getItem(CONFIG_CACHE_KEY);
            if (raw) {
              const parsed = JSON.parse(raw) as AppBannerConfig;
              if (!cancelled) {
                setConfig(parsed);
                setLoading(false);
              }
            }
          }
        }
        const fresh = await appBannerService.getPublic();
        if (cancelled) return;
        if (fresh && fresh.isActive) {
          setConfig(fresh);
          try {
            localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(fresh));
            localStorage.setItem(CONFIG_CACHE_TS, String(Date.now()));
          } catch {
            // ignore
          }
        } else {
          setConfig(null);
        }
      } catch {
        // silently fail — banner just won't show
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Show banner on every page load when the admin has it active.
  // Dismissing only hides it during the current session; the next reload
  // brings it back so customers keep seeing the app promo.
  React.useEffect(() => {
    if (loading) return;
    if (!config || !config.isActive) {
      setOpen(false);
      return;
    }
    // Show after a small delay so it doesn't jump the layout immediately
    const t = setTimeout(() => setOpen(true), 400);
    return () => clearTimeout(t);
  }, [loading, config]);

  // Expose banner height to the header so it can stick just below the banner.
  React.useEffect(() => {
    if (!open || !bannerRef.current) {
      document.documentElement.style.setProperty("--app-banner-h", "0px");
      return;
    }
    const el = bannerRef.current;
    const update = () => {
      const h = el.getBoundingClientRect().height;
      document.documentElement.style.setProperty("--app-banner-h", `${h}px`);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
      document.documentElement.style.setProperty("--app-banner-h", "0px");
    };
  }, [open]);

  const handleDismiss = () => {
    // Hide only for the current page session — the banner comes back
    // on the next reload so the app promo stays in front of the customer.
    setOpen(false);
  };

  const buildDownloadIntent = (): { url: string; isApk: boolean } | null => {
    if (!config) return null;
    const platform = detectPlatform();
    if (platform === "android") {
      if (config.apkFileUrl) return { url: config.apkFileUrl, isApk: true };
      if (config.playStoreUrl) return { url: config.playStoreUrl, isApk: false };
    } else if (platform === "ios") {
      if (config.ipaFileUrl) return { url: config.ipaFileUrl, isApk: false };
      if (config.appStoreUrl) return { url: config.appStoreUrl, isApk: false };
    }
    // desktop or fallback
    if (config.apkFileUrl) return { url: config.apkFileUrl, isApk: true };
    if (config.playStoreUrl) return { url: config.playStoreUrl, isApk: false };
    if (config.appStoreUrl) return { url: config.appStoreUrl, isApk: false };
    return null;
  };

  const handleUseApp = () => {
    const intent = buildDownloadIntent();
    if (!intent) {
      setShowMenu(true);
      return;
    }
    if (intent.isApk) {
      // Direct APK download — create a hidden anchor and click
      const a = document.createElement("a");
      a.href = intent.url;
      a.download = config?.apkFileName || "apnakit.apk";
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      window.open(intent.url, "_blank", "noopener,noreferrer");
    }
  };

  if (!open || !config) return null;

  const subtitleParts: string[] = [];
  if (config.rating) {
    subtitleParts.push(`${config.rating} ★`);
  }
  if (config.downloadCount) {
    subtitleParts.push(`${config.downloadCount} Downloads`);
  }
  const subtitle = subtitleParts.join("  |  ");

  return (
    <>
      <div
        ref={bannerRef}
        className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white text-foreground shadow-sm"
        role="region"
        aria-label="Download our app"
      >
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-2 sm:gap-4 sm:px-4 sm:py-2.5">
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss app banner"
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>

          {/* App icon */}
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg sm:h-11 sm:w-11"
            style={{
              backgroundColor: config.iconBgColor || "#FACC15",
              color: config.iconFgColor || "#7C3AED",
            }}
          >
            {config.iconImage ? (
              <IconWithFallback src={config.iconImage} />
            ) : (
              <Sparkles className="h-5 w-5" />
            )}
          </div>

          {/* Title + subtitle */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground sm:text-[15px]">
              {config.title}
            </p>
            {subtitle && (
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                {config.rating && (
                  <span className="inline-flex items-center gap-0.5 font-medium text-amber-500">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {config.rating}
                  </span>
                )}
                {config.rating && config.downloadCount && (
                  <span className="text-muted-foreground/60">|</span>
                )}
                {config.downloadCount && <span>{config.downloadCount} Downloads</span>}
              </p>
            )}
          </div>

          {/* Action button(s) */}
          <div className="flex flex-shrink-0 items-center gap-2">
            <Button
              onClick={handleUseApp}
              size="sm"
              className={cn(
                "h-9 gap-1.5 px-4 text-sm font-semibold",
                config.buttonStyle === "solid" && "shadow-sm",
                config.buttonStyle === "gradient" &&
                  "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700"
              )}
              style={
                config.buttonStyle === "outline"
                  ? {
                      background: "transparent",
                      color: config.buttonColor || "#7C3AED",
                      border: `1.5px solid ${config.buttonColor || "#7C3AED"}`,
                    }
                  : config.buttonStyle === "solid"
                    ? {
                        background: config.buttonColor || "#7C3AED",
                        color: "white",
                      }
                    : undefined
              }
            >
              {config.buttonText || "Use the App"}
            </Button>
            <Button
              onClick={() => setShowMenu(true)}
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="See all download options"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Sub-row: platforms available (always shown so user sees all options) */}
        <div className="mx-auto flex max-w-7xl items-center gap-3 overflow-x-auto border-t border-gray-100 px-3 py-1.5 text-[11px] text-muted-foreground sm:px-4">
          {config.apkFileUrl && (
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              <Download className="h-3 w-3" />
              APK {config.apkFileSize ? `(${formatBytes(config.apkFileSize)})` : ""}
            </span>
          )}
          {config.playStoreUrl && (
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              <Smartphone className="h-3 w-3" />
              Google Play
            </span>
          )}
          {config.ipaFileUrl && (
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              <Download className="h-3 w-3" />
              iOS IPA {config.ipaFileSize ? `(${formatBytes(config.ipaFileSize)})` : ""}
            </span>
          )}
          {config.appStoreUrl && (
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              <Apple className="h-3 w-3" />
              App Store
            </span>
          )}
          {(config.windowsAppUrl || config.macAppUrl) && (
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              <Monitor className="h-3 w-3" />
              Desktop
            </span>
          )}
        </div>
      </div>

      {/* Modal showing all download options */}
      {showMenu && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-3 sm:items-center"
          onClick={() => setShowMenu(false)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="text-base font-semibold text-foreground">Get the ApnaKit app</h3>
              <button
                onClick={() => setShowMenu(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2 p-3">
              {config.playStoreUrl && (
                <Button
                  onClick={() => {
                    window.open(config.playStoreUrl!, "_blank", "noopener,noreferrer");
                    setShowMenu(false);
                  }}
                  variant="outline"
                  className="h-12 w-full justify-start gap-3 px-4"
                >
                  <Smartphone className="h-5 w-5 text-emerald-600" />
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">Get it on</p>
                    <p className="text-sm font-semibold">Google Play</p>
                  </div>
                </Button>
              )}
              {config.apkFileUrl && (
                <Button
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = config.apkFileUrl!;
                    a.download = config.apkFileName || "apnakit.apk";
                    a.click();
                    setShowMenu(false);
                  }}
                  variant="outline"
                  className="h-12 w-full justify-start gap-3 px-4"
                >
                  <Download className="h-5 w-5 text-indigo-600" />
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">Direct download</p>
                    <p className="text-sm font-semibold">
                      Android APK {config.apkFileSize ? `(${formatBytes(config.apkFileSize)})` : ""}
                    </p>
                  </div>
                </Button>
              )}
              {config.appStoreUrl && (
                <Button
                  onClick={() => {
                    window.open(config.appStoreUrl!, "_blank", "noopener,noreferrer");
                    setShowMenu(false);
                  }}
                  variant="outline"
                  className="h-12 w-full justify-start gap-3 px-4"
                >
                  <Apple className="h-5 w-5 text-gray-900" />
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">Download on the</p>
                    <p className="text-sm font-semibold">App Store</p>
                  </div>
                </Button>
              )}
              {config.ipaFileUrl && (
                <Button
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = config.ipaFileUrl!;
                    a.download = config.ipaFileName || "apnakit.ipa";
                    a.click();
                    setShowMenu(false);
                  }}
                  variant="outline"
                  className="h-12 w-full justify-start gap-3 px-4"
                >
                  <Download className="h-5 w-5 text-indigo-600" />
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">Direct download</p>
                    <p className="text-sm font-semibold">
                      iOS IPA {config.ipaFileSize ? `(${formatBytes(config.ipaFileSize)})` : ""}
                    </p>
                  </div>
                </Button>
              )}
              {config.windowsAppUrl && (
                <Button
                  onClick={() => {
                    window.open(config.windowsAppUrl!, "_blank", "noopener,noreferrer");
                    setShowMenu(false);
                  }}
                  variant="outline"
                  className="h-12 w-full justify-start gap-3 px-4"
                >
                  <Monitor className="h-5 w-5 text-blue-600" />
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">Download for</p>
                    <p className="text-sm font-semibold">Windows</p>
                  </div>
                </Button>
              )}
              {config.macAppUrl && (
                <Button
                  onClick={() => {
                    window.open(config.macAppUrl!, "_blank", "noopener,noreferrer");
                    setShowMenu(false);
                  }}
                  variant="outline"
                  className="h-12 w-full justify-start gap-3 px-4"
                >
                  <Monitor className="h-5 w-5 text-gray-700" />
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">Download for</p>
                    <p className="text-sm font-semibold">macOS</p>
                  </div>
                </Button>
              )}
              {!config.playStoreUrl &&
                !config.appStoreUrl &&
                !config.apkFileUrl &&
                !config.ipaFileUrl &&
                !config.windowsAppUrl &&
                !config.macAppUrl && (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    No download links configured yet.
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
