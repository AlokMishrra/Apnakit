import api from "./api";

export type HomeSectionKey = "QUICK" | "SHOP_ALL";

export interface HomeSectionMeta {
  key: HomeSectionKey;
  title: string;
  subtitle: string | null;
  isActive: boolean;
  sortOrder: number;
  itemCount: number;
}

export interface HomeSectionItem {
  id: string;
  productId: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  image: string;
  alt: string;
  brand: string | null;
  brandSlug: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  price: number;
  compareAtPrice: number | null;
  discount: number;
  variantId: string | null;
  variantName: string | null;
  sortOrder: number;
  isProductActive: boolean;
}

export interface HomeSectionCategory {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  image: string;
  sortOrder: number;
}

export interface HomeSection {
  key: HomeSectionKey;
  title: string;
  subtitle: string | null;
  categories: HomeSectionCategory[];
  items: HomeSectionItem[];
}

export interface SectionBanner {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  link: string | null;
  position: string;
}

export interface AdminSectionItem extends HomeSectionItem {
  isActive: boolean;
}

export interface AdminSection extends Omit<HomeSection, "items" | "categories"> {
  isActive: boolean;
  sortOrder: number;
  items: AdminSectionItem[];
  categories: (HomeSectionCategory & { isActive: boolean })[];
}

export const homeSectionService = {
  /** Metadata for both sections — drives the toggle labels and enabled state. */
  getSections: async (): Promise<HomeSectionMeta[]> => {
    const response = await api.get("/home-sections");
    return response.data?.data ?? response.data;
  },

  /** A section's products. `limit` trims the payload for the Quick rail. */
  getSection: async (key: HomeSectionKey, limit?: number): Promise<HomeSection | null> => {
    const response = await api.get(`/home-sections/${key}`, {
      params: limit ? { limit } : undefined,
    });
    return response.data?.data ?? null;
  },

  // ── Admin ──────────────────────────────────────────────────────────────────

  getAdminSection: async (key: HomeSectionKey): Promise<AdminSection> => {
    const response = await api.get(`/home-sections/${key}/admin`);
    return response.data?.data;
  },

  updateSection: async (
    key: HomeSectionKey,
    payload: { title?: string; subtitle?: string; isActive?: boolean },
  ): Promise<unknown> => {
    const response = await api.patch(`/home-sections/${key}`, payload);
    return response.data?.data;
  },

  addItem: async (key: HomeSectionKey, productId: string): Promise<HomeSectionItem> => {
    const response = await api.post(`/home-sections/${key}/items`, { productId });
    return response.data?.data;
  },

  removeItem: async (key: HomeSectionKey, productId: string): Promise<void> => {
    await api.delete(`/home-sections/${key}/items/${productId}`);
  },

  /** Replaces the whole ordered list in one request. */
  replaceItems: async (key: HomeSectionKey, productIds: string[]): Promise<AdminSection> => {
    const response = await api.put(`/home-sections/${key}/items`, {
      items: productIds.map((productId, sortOrder) => ({ productId, sortOrder })),
    });
    return response.data?.data;
  },

  /** Banners pinned to a home section, rendered under the toggle. */
  getSectionBanners: async (key: HomeSectionKey): Promise<SectionBanner[]> => {
    const response = await api.get("/banners", {
      params: { homeSectionKey: key, position: "PROMOTIONAL" },
    });
    return response.data?.data ?? [];
  },

  // ── Categories ─────────────────────────────────────────────────────────────

  addCategory: async (
    key: HomeSectionKey,
    categoryId: string,
  ): Promise<HomeSectionCategory> => {
    const response = await api.post(`/home-sections/${key}/categories`, { categoryId });
    return response.data?.data;
  },

  removeCategory: async (key: HomeSectionKey, categoryId: string): Promise<void> => {
    await api.delete(`/home-sections/${key}/categories/${categoryId}`);
  },

  /** Replaces the whole pinned category list in one request. */
  replaceCategories: async (
    key: HomeSectionKey,
    categoryIds: string[],
  ): Promise<AdminSection> => {
    const response = await api.put(`/home-sections/${key}/categories`, { categoryIds });
    return response.data?.data;
  },
};