"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/ui/product-card";
import { useFeaturedProducts } from "@/hooks/use-products";
import type { Product } from "@/types";

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

export function FeaturedProducts() {
  const { data, isLoading } = useFeaturedProducts();

  const products: Product[] = data
    ? (Array.isArray(data) ? data : []).map(mapBackendProduct)
    : [];

  if (isLoading) {
    return (
      <section className="py-2">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-2">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
        <Link
          href="/products?filter=featured"
          className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          View All
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} variant="home" />
        ))}
      </div>
    </section>
  );
}
