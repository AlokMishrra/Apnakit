"use client";

import { Zap } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useHomeSection } from "@/components/home/home-section-context";
import { useEffect, useState } from "react";
import { useLocation } from "@/components/layout/location-context";
import { deliveryZoneService } from "@/services/delivery-zone.service";
import type { HomeSectionKey } from "@/services/home-section.service";

interface QuickShopToggleProps {
  /** "header" is the desktop pill, "mobile" is the full-width bar. */
  variant?: "header" | "mobile";
  className?: string;
}

/**
 * Quick / Shop All switcher.
 *
 * Desktop: a grey pill with an orange "Quick" button next to a "Shop all"
 * label, sitting in the header.
 * Mobile: a full-width maroon bar with a cream "Quick" button and a white
 * "Shop All" button.
 *
 * The chosen section is shared through HomeSectionProvider, so the home page
 * content follows the same selection.
 */
export function QuickShopToggle({ variant = "header", className }: QuickShopToggleProps) {
  const { activeKey, setActiveKey, sections } = useHomeSection();
  const { location } = useLocation();
  const [quickAvailable, setQuickAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!location?.pincode) { setQuickAvailable(false); return; }
      try {
        const res = await deliveryZoneService.check(location.pincode);
        const data = (res?.data || res) as { serviceable?: boolean; quickDelivery?: boolean };
        const quick = !!data.serviceable && !!data.quickDelivery;
        if (cancelled) return;
        setQuickAvailable(quick);
        if (!quick && activeKey === "QUICK") setActiveKey("SHOP_ALL");
      } catch {
        if (!cancelled) setQuickAvailable(true);
      }
    })();
    return () => { cancelled = true; };
  }, [location?.pincode]);
  const router = useRouter();
  const pathname = usePathname();

  const options: { key: HomeSectionKey; label: string }[] = [
    { key: "QUICK", label: "Quick" },
    { key: "SHOP_ALL", label: "Shop All" },
  ];

  const select = (key: HomeSectionKey) => {
    if (key === "QUICK" && quickAvailable === false) return;
    setActiveKey(key);
    // The header is on every page; the section feed only exists on the home
    // page, so send the shopper there when they pick a tab elsewhere.
    if (pathname !== "/" && !pathname.startsWith("/quick-shop")) {
      router.push("/");
    }
  };

  const isUsable = (key: HomeSectionKey) => {
    const meta = sections.find((s) => s.key === key);
    if (key === "QUICK" && quickAvailable === false) return false;
    return !meta || meta.isActive;
  };

  if (variant === "mobile") {
    return (
      <div className={cn("flex w-full items-stretch gap-2", className)}>
        {options.map((option) => {
          const selected = activeKey === option.key;
          const disabled = !isUsable(option.key);
          return (
            <button
              key={option.key}
              type="button"
              role="tab"
              aria-selected={selected}
              disabled={disabled}
              onClick={() => select(option.key)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold tracking-wide transition-colors",
                "disabled:cursor-not-allowed disabled:opacity-50",
                selected
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "bg-card text-primary"
              )}
            >
              {option.key === "QUICK" && (
                <Zap className="h-4 w-4 shrink-0 fill-current" />
              )}
              <span>{option.key === "SHOP_ALL" ? "ShopAll" : option.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="tablist"
      aria-label="Storefront section"
      className={cn("flex items-center gap-1 rounded-full bg-[#f2f2f2] p-1", className)}
    >
      {options.map((option) => {
        const selected = activeKey === option.key;
        const disabled = !isUsable(option.key);
        return (
          <button
            key={option.key}
            type="button"
            role="tab"
            aria-selected={selected}
            disabled={disabled}
            onClick={() => select(option.key)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold tracking-wide transition-colors",
              "disabled:cursor-not-allowed disabled:opacity-50",
              selected
                ? "bg-[#f5a623] text-[#5b0a0a] shadow-sm"
                : "text-[#5b0a0a] hover:bg-white"
            )}
          >
            {option.key === "QUICK" && (
              <Zap className="h-4 w-4 shrink-0 fill-current" />
            )}
            <span>{option.key === "SHOP_ALL" ? "Shop all" : option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
