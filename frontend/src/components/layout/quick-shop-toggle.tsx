"use client";

import { Zap } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useHomeSection } from "@/components/home/home-section-context";
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
  const router = useRouter();
  const pathname = usePathname();

  const options: { key: HomeSectionKey; label: string }[] = [
    { key: "QUICK", label: "Quick" },
    { key: "SHOP_ALL", label: "Shop All" },
  ];

  const select = (key: HomeSectionKey) => {
    setActiveKey(key);
    // The header is on every page; the section feed only exists on the home
    // page, so send the shopper there when they pick a tab elsewhere.
    if (pathname !== "/" && !pathname.startsWith("/quick-shop")) {
      router.push("/");
    }
  };

  const isUsable = (key: HomeSectionKey) => {
    const meta = sections.find((s) => s.key === key);
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
                  ? "bg-[#fdf6d8] text-[#5b0a0a] shadow-sm"
                  : "bg-white text-[#5b0a0a]"
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
