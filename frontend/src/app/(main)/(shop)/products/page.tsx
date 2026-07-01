"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { PackageOpen, Loader2 } from "lucide-react";
import { ProductCard } from "@/components/ui/product-card";
import api from "@/services/api";
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
    compareAtPrice: firstVariant?.compareAtPrice ? Number(firstVariant.compareAtPrice) : undefined,
    sku: raw.sku || "",
    stock: totalStock,
    totalStock,
    images: (raw.images || []).map((img: any, i: number) => ({
      url: img.url || img,
      alt: raw.name || "",
      isPrimary: i === 0,
    })),
    category: raw.category
      ? { _id: raw.category.id || raw.category._id, name: raw.category.name, slug: raw.category.slug, productCount: 0, isActive: true, createdAt: "", updatedAt: "" }
      : { _id: "", name: "", slug: "", productCount: 0, isActive: true, createdAt: "", updatedAt: "" },
    brand: raw.brand
      ? { _id: raw.brand.id || raw.brand._id, name: raw.brand.name, slug: raw.brand.slug, productCount: 0, isActive: true }
      : { _id: "", name: "", slug: "", productCount: 0, isActive: true },
    variants: (raw.variants || []).map((v: any) => ({
      _id: v.id || v._id,
      name: v.name || "",
      sku: v.sku || "",
      price: Number(v.price),
      compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : undefined,
      stock: v.stock || 0,
      attributes: v.attributes || {},
      image: v.image,
    })),
    tags: raw.tags ? (typeof raw.tags === "string" ? raw.tags.split(",") : raw.tags) : [],
    specifications: [],
    ratings: { average: raw.averageRating || 0, count: raw.reviewCount || 0 },
    rating: raw.averageRating || 0,
    numReviews: raw.reviewCount || 0,
    isActive: raw.isActive ?? true,
    isFeatured: raw.isFeatured ?? false,
    isTrending: false,
    isBestSeller: false,
    createdAt: raw.createdAt || "",
    updatedAt: raw.updatedAt || "",
  };
}

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter") || "all";
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [total, setTotal] = React.useState(0);

  const title = React.useMemo(() => {
    switch (filter) {
      case "featured": return "Featured Products";
      case "best-sellers": return "Best Sellers";
      case "trending": return "Trending Products";
      default: return "All Products";
    }
  }, [filter]);

  React.useEffect(() => {
    setLoading(true);

    let url: string;
    if (filter === "featured") {
      url = "/products/featured?limit=100";
    } else if (filter === "best-sellers") {
      url = "/products/bestsellers?limit=100";
    } else if (filter === "trending") {
      url = "/products/trending?limit=100";
    } else {
      url = "/products?limit=100";
    }

    api
      .get(url)
      .then((res: any) => {
        const payload = res?.data?.data ?? res?.data ?? res;
        let rawData: any[] = [];

        if (Array.isArray(payload)) {
          rawData = payload;
        } else if (payload?.data && Array.isArray(payload.data)) {
          rawData = payload.data;
        } else if (payload?.products && Array.isArray(payload.products)) {
          rawData = payload.products;
        }

        const transformed = rawData.map(mapBackendProduct);
        setProducts(transformed);
        setTotal(rawData.length);
      })
      .catch(() => {
        setProducts([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {!loading && (
            <p className="mt-1 text-sm text-muted-foreground">
              {total} product{total !== 1 ? "s" : ""} found
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <PackageOpen className="mb-4 h-16 w-16 text-muted-foreground/50" />
            <h3 className="text-lg font-bold text-foreground">No products found</h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              We couldn&apos;t find any products. Try browsing categories instead.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
