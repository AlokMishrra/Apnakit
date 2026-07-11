"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/ui/product-card";
import api from "@/services/api";
import type { Product } from "@/types";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  isComingSoon?: boolean;
  _count?: { products?: number };
  children?: Category[];
}

interface CategoryWithProducts extends Category {
  products: Product[];
}

function mapBackendProduct(raw: any): Product {
  const firstVariant = raw.variants?.[0];
  const price = firstVariant ? Number(firstVariant.price) : raw.minPrice || 0;
  const originalPrice = firstVariant
    ? Number(firstVariant.compareAtPrice || firstVariant.price)
    : raw.maxPrice || price;
  const totalStock = raw.totalStock ?? raw.variants?.reduce((s: number, v: any) => s + (v.stock || 0), 0) ?? 0;

  return {
    _id: raw.id,
    name: raw.name || "",
    slug: raw.slug || "",
    description: raw.description || "",
    price,
    originalPrice,
    sku: raw.sku || "",
    stock: totalStock,
    images: (raw.images || []).map((img: any, i: number) => ({
      url: img.url || img,
      alt: raw.name || "",
      isPrimary: i === 0,
    })),
    category: raw.category
      ? { _id: raw.category.id, name: raw.category.name, slug: raw.category.slug, productCount: 0, isActive: true, createdAt: "", updatedAt: "" }
      : { _id: "", name: "", slug: "", productCount: 0, isActive: true, createdAt: "", updatedAt: "" },
    brand: raw.brand
      ? { _id: raw.brand.id, name: raw.brand.name, slug: raw.brand.slug, productCount: 0, isActive: true }
      : { _id: "", name: "", slug: "", productCount: 0, isActive: true },
    variants: (raw.variants || []).map((v: any) => ({
      _id: v.id,
      name: v.name || "",
      sku: v.sku || "",
      price: Number(v.price),
      compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : undefined,
      stock: v.stock || 0,
      attributes: v.attributes || {},
      image: v.image,
    })),
    tags: raw.tags ? raw.tags.split(",") : [],
    specifications: [],
    ratings: { average: raw.averageRating || 0, count: raw.reviewCount || 0 },
    isActive: raw.isActive ?? true,
    isFeatured: raw.isFeatured ?? false,
    isTrending: false,
    isBestSeller: false,
    createdAt: raw.createdAt || "",
    updatedAt: raw.updatedAt || "",
  };
}

function CategorySection({ category }: { category: CategoryWithProducts }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
    }
    return () => {
      if (el) el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [category.products]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = direction === "left" ? -280 : 280;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  if (category.products.length === 0) return null;

  const sortedProducts = [...category.products].sort((a, b) => {
    const aStock = Number(a.totalStock ?? a.stock ?? (a.variants || []).reduce((s: number, v: any) => s + (Number(v.stock) || 0), 0) ?? 0);
    const bStock = Number(b.totalStock ?? b.stock ?? (b.variants || []).reduce((s: number, v: any) => s + (Number(v.stock) || 0), 0) ?? 0);
    const aInStock = aStock > 0;
    const bInStock = bStock > 0;
    if (aInStock && !bInStock) return -1;
    if (!aInStock && bInStock) return 1;
    if (aInStock && bInStock && aStock !== bStock) return bStock - aStock;
    const aDate = new Date(a.createdAt || 0).getTime();
    const bDate = new Date(b.createdAt || 0).getTime();
    return bDate - aDate;
  });

  return (
    <section className="py-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{category.name}</h2>
        <Link
          href={`/category/${category.slug}`}
          className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          See All
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="relative">
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 shadow-md border rounded-full p-1.5 hidden sm:flex items-center justify-center"
          >
            <ChevronLeft className="h-5 w-5 text-gray-700" />
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 shadow-md border rounded-full p-1.5 hidden sm:flex items-center justify-center"
          >
            <ChevronRight className="h-5 w-5 text-gray-700" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto no-scrollbar pb-2"
          style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
        >
          {sortedProducts.map((product) => (
            <div key={product._id} className="flex-shrink-0 w-[160px] sm:w-[200px] scroll-snap-align-start">
              <ProductCard product={product} variant="home" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CategoryWiseProducts() {
  const [categories, setCategories] = useState<CategoryWithProducts[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const catRes = await api.get("/categories");
        const catData = catRes?.data?.data;

        if (!catData || !Array.isArray(catData)) {
          setIsLoading(false);
          return;
        }

        const flatCategories: Category[] = [];

        for (const cat of catData) {
          if (!cat.isComingSoon) {
            flatCategories.push({ ...cat, children: [] });
          }
        }

        const BATCH_SIZE = 3;
        const categoriesWithProducts: CategoryWithProducts[] = [];

        for (let i = 0; i < flatCategories.length; i += BATCH_SIZE) {
          const batch = flatCategories.slice(i, i + BATCH_SIZE);
          const results = await Promise.all(
            batch.map(async (cat) => {
              try {
                const prodRes = await api.get(`/products?category=${cat.slug}&limit=8`);
                const prodData = prodRes?.data?.data;
                const products = (prodData?.items || prodData || []).map(mapBackendProduct);
                return { ...cat, products };
              } catch {
                return { ...cat, products: [] };
              }
            })
          );
          categoriesWithProducts.push(...results);
          if (i + BATCH_SIZE < flatCategories.length) {
            await new Promise((r) => setTimeout(r, 200));
          }
        }

        setCategories(categoriesWithProducts.filter(c => c.products.length > 0));
      } catch (err) {
        console.error("Error fetching category products:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <div key={i} className="py-4">
            <div className="mb-4 h-6 w-32 animate-pulse rounded bg-gray-200" />
            <div className="flex gap-3 overflow-hidden">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="h-64 w-[160px] flex-shrink-0 animate-pulse rounded-lg bg-gray-200 sm:w-[200px]" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (categories.length === 0) return null;

  return (
    <div className="space-y-2">
      {categories.map((category) => (
        <CategorySection key={category.id} category={category} />
      ))}
    </div>
  );
}
