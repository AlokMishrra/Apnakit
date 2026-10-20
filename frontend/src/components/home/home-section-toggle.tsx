"use client";

import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HomeSectionKey } from "@/services/home-section.service";

interface HomeSectionToggleProps {
  sections: { key: HomeSectionKey; title: string; isActive: boolean }[];
  value: HomeSectionKey;
  onChange: (key: HomeSectionKey) => void;
  className?: string;
}

/**
 * Quick / Shop All switcher shown above the home page content.
 *
 * A two-option pill where the active option is filled and the inactive one sits
 * on white. A section that is switched off in the admin dashboard is disabled.
 */
export function HomeSectionToggle({
  sections,
  value,
  onChange,
  className,
}: HomeSectionToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Storefront section"
      className={cn(
        "mx-auto flex w-full max-w-2xl items-stretch gap-1 rounded-2xl p-1",
        "bg-gradient-to-r from-[#5b0a0a] to-[#7a0f14] shadow-sm",
        className,
      )}
    >
      {sections.map((section) => {
        const isSelected = section.key === value;

        return (
          <button
            key={section.key}
            type="button"
            role="tab"
            aria-selected={isSelected}
            disabled={!section.isActive}
            onClick={() => onChange(section.key)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5",
              "text-sm font-bold tracking-wide transition-all duration-200 sm:text-base",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
              "disabled:cursor-not-allowed disabled:opacity-50",
              isSelected
                ? "bg-[#d7f5ea] text-[#5b0a0a] shadow-sm"
                : "bg-white text-[#5b0a0a] hover:bg-[#f6eaea]",
            )}
          >
            {section.key === "QUICK" && (
              <Zap className="h-4 w-4 shrink-0 fill-current sm:h-5 sm:w-5" />
            )}
            <span className="truncate">{section.title}</span>
          </button>
        );
      })}
    </div>
  );
}