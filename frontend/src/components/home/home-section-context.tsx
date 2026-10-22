"use client";

import * as React from "react";
import { homeSectionService, type HomeSectionKey, type HomeSectionMeta } from "@/services/home-section.service";

interface HomeSectionContextValue {
  /** The section the shopper is looking at: Quick or Shop All. */
  activeKey: HomeSectionKey;
  setActiveKey: (key: HomeSectionKey) => void;
  /** Metadata for both sections (titles, counts). */
  sections: HomeSectionMeta[];
  loading: boolean;
}

const HomeSectionContext = React.createContext<HomeSectionContextValue | null>(null);

const QUICK_LIMIT = 12;

/**
 * Holds the active home section so the toggle can live in the header (desktop)
 * and in the mobile top bar, while the page content reacts to the same state.
 */
export function HomeSectionProvider({ children }: { children: React.ReactNode }) {
  const [activeKey, setActiveKey] = React.useState<HomeSectionKey>("QUICK");
  const [sections, setSections] = React.useState<HomeSectionMeta[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
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
        // A failure here must not take the home page down; the toggle falls
        // back to its default tab.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = React.useMemo(
    () => ({ activeKey, setActiveKey, sections, loading }),
    [activeKey, sections, loading]
  );

  return <HomeSectionContext.Provider value={value}>{children}</HomeSectionContext.Provider>;
}

export function useHomeSection() {
  const ctx = React.useContext(HomeSectionContext);
  if (!ctx) {
    // Used outside the provider (e.g. the admin area): a working default.
    return {
      activeKey: "QUICK" as HomeSectionKey,
      setActiveKey: () => {},
      sections: [] as HomeSectionMeta[],
      loading: false,
    };
  }
  return ctx;
}

export { QUICK_LIMIT };
