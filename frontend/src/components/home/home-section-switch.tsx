"use client";

import { useEffect, useState } from "react";
import { HomeSectionToggle } from "./home-section-toggle";
import { useLocation } from "@/components/layout/location-context";
import { deliveryZoneService } from "@/services/delivery-zone.service";
import { HomeSectionContent } from "./home-section-content";
import { useHomeSection, QUICK_LIMIT } from "./home-section-context";
import {
  homeSectionService,
  type HomeSectionItem,
  type HomeSectionCategory,
  type SectionBanner,
} from "@/services/home-section.service";

interface HomeSectionSwitchProps {
  /** Rendered above the section content (the category grid). */
  children?: React.ReactNode;
  /**
   * The Quick / Shop All switch normally lives in the header and in the
   * mobile top bar, both driven by the same shared state. Set this to also
   * show an inline toggle.
   */
  showToggle?: boolean;
}

/**
 * Renders the active home section (Quick or Shop All). The selection itself
 * is held in HomeSectionProvider, so the header toggle and this content
 * always agree.
 */
export function HomeSectionSwitch({ children, showToggle = false }: HomeSectionSwitchProps) {
  const { activeKey, sections } = useHomeSection();
  const [items, setItems] = useState<HomeSectionItem[]>([]);
  const [categories, setCategories] = useState<HomeSectionCategory[]>([]);
  const [banners, setBanners] = useState<SectionBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quickAvailable, setQuickAvailable] = useState<boolean | null>(null);
  const { location } = useLocation();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Quick is only available for pincodes we can deliver to within 24h.
      if (!location?.pincode) {
        setQuickAvailable(true);
        return;
      }
      try {
        const res = await deliveryZoneService.check(location.pincode);
        const data = (res?.data || res) as { serviceable?: boolean; estimatedMinutes?: number; estimatedDays?: number };
        const quick = !!data.serviceable && (
          (typeof data.estimatedMinutes === "number" && data.estimatedMinutes <= 24 * 60) ||
          (typeof data.estimatedDays === "number" && data.estimatedDays <= 1)
        );
        if (cancelled) return;
        setQuickAvailable(quick);
        if (!quick) setActiveKey("SHOP_ALL");
      } catch {
        if (cancelled) return;
        setQuickAvailable(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [location?.pincode]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      try {
        const [section, sectionBanners] = await Promise.all([
          homeSectionService.getSection(
            activeKey,
            activeKey === "QUICK" ? QUICK_LIMIT : undefined
          ),
          homeSectionService.getSectionBanners(activeKey),
        ]);
        if (cancelled) return;
        setItems(section?.items ?? []);
        setCategories(section?.categories ?? []);
        setBanners(sectionBanners ?? []);
      } catch {
        if (cancelled) return;
        setItems([]);
        setCategories([]);
        setBanners([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeKey]);

  const activeMeta = sections.find((s) => s.key === activeKey);

  return (
    <>
      {quickAvailable === false && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          We&apos;re not available in your area for Quick delivery yet. Please
          shop from <span className="font-semibold">Shop All</span>.
        </div>
      )}
      {showToggle && (
        <HomeSectionToggle
          sections={sections}
          value={activeKey}
          onChange={() => {}}
          className="mb-4"
        />
      )}
      {children}
      <HomeSectionContent
        title={activeMeta?.title ?? (activeKey === "QUICK" ? "Quick" : "Shop All")}
        subtitle={activeMeta?.subtitle ?? null}
        items={items}
        categories={categories}
        banners={banners}
        isLoading={isLoading}
        layout={activeKey === "QUICK" ? "rail" : "grid"}
      />
    </>
  );
}
