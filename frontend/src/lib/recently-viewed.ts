import type { Product } from "@/types";

const STORAGE_KEY = "recentlyViewed";
const MAX_ITEMS = 20;
const STALE_IDS = new Set(["r1", "r2", "r3", "r4"]);

export interface RecentlyViewedProduct {
  _id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice: number;
  images: string[];
  brand?: { name: string };
  category?: { name: string };
  stock: number;
}

function readStorage(): RecentlyViewedProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed: RecentlyViewedProduct[] = JSON.parse(stored);
    const filtered = parsed.filter((p) => !STALE_IDS.has(p._id));
    if (filtered.length !== parsed.length) {
      writeStorage(filtered);
    }
    return filtered;
  } catch {
    return [];
  }
}

function writeStorage(items: RecentlyViewedProduct[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export function trackProductView(product: RecentlyViewedProduct) {
  const items = readStorage().filter((p) => p._id !== product._id);
  items.unshift(product);
  writeStorage(items.slice(0, MAX_ITEMS));
}

export function getRecentlyViewed(): RecentlyViewedProduct[] {
  return readStorage().slice(0, 8);
}
