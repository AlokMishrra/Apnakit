"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { HomeSectionToggle } from "./home-section-toggle";
import { HomeSectionContent } from "./home-section-content";
import {
  homeSectionService,
  type HomeSectionKey,
  type HomeSectionMeta,
  type HomeSectionItem,
  type HomeSectionCategory,
  type SectionBanner,
} from "@/services/home-section.service";

/** Quick is a short curated rail; Shop All gets the full grid. */
const QUICK_LIMIT = 12;

interface HomeSectionSwitchProps {
  /** Rendered between the toggle and the section content (the category grid). */
  children?: React.ReactNode;
}

export function HomeSectionSwitch({ children }: HomeSectionSwitchProps) {
  const [sections, setSections] = useState<HomeSectionMeta[]>([]);
  const [activeKey, setActiveKey] = useState<HomeSectionKey>("QUICK");
  const [items, setItems] = useState<HomeSectionItem[]>([]);
  const [categories, setCategories] = useState<HomeSectionCategory[]>([]);
  const [banners, setBanners] = useState<SectionBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Keep the metadata for whichever section is showing (title/subtitle).
  const activeMeta = useMemo(
    () => sections.find((s) => s.key === activeKey),
    [sections, activeKey],
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const meta = await homeSectionService.getSections();
        if (cancelled) return;
        setSections(meta);

        // Land on the first section that actually has content, so the page is
        // never showing an empty tab on first paint.
        const firstUsable = meta.find((s) => s.isActive && s.itemCount > 0);
        if (firstUsable) setActiveKey(firstUsable.key);
      } catch {
        // A failure here should not take the home page down; the toggle simply
        // falls back to its default tab.
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      try {
        const [section, sectionBanners] = await Promise.all([
          homeSectionService.getSection(
            activeKey,
            activeKey === "QUICK" ? QUICK_LIMIT : undefined,
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

  const handleChange = useCallback((key: HomeSectionKey) => setActiveKey(key), []);

  if (sections.length === 0) return null;

  return (
    <div className="space-y-5">
      <HomeSectionToggle
        sections={sections.map((s) => ({
          key: s.key,
          title: s.title,
          isActive: s.isActive && s.itemCount > 0,
        }))}
        value={activeKey}
        onChange={handleChange}
      />

      {children}

      <HomeSectionContent
        title={activeMeta?.title ?? ""}
        subtitle={activeMeta?.subtitle ?? null}
        items={items}
        categories={categories}
        banners={banners}
        isLoading={isLoading}
        layout={activeKey === "QUICK" ? "rail" : "grid"}
      />
    </div>
  );
}