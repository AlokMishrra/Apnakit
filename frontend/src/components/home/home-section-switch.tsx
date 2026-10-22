"use client";

import { useEffect, useState } from "react";
import { HomeSectionToggle } from "./home-section-toggle";
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
