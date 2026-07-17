"use client";

import { useState, useEffect } from "react";
import { History } from "lucide-react";
import { ProductCard } from "@/components/ui/product-card";
import { getRecentlyViewed } from "@/lib/recently-viewed";
import type { Product } from "@/types";

export function RecentlyViewed() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const items = getRecentlyViewed();
    if (items.length > 0) {
      setProducts(
        items.map((item) => ({
          _id: item._id,
          name: item.name,
          slug: item.slug,
          description: "",
          price: item.price,
          originalPrice: item.originalPrice,
          images: item.images.map((url) => ({
            url,
            alt: item.name,
            isPrimary: true,
          })),
          category: item.category
            ? {
                _id: "",
                name: item.category.name,
                slug: "",
                productCount: 0,
                isActive: true,
                createdAt: "",
                updatedAt: "",
              }
            : { _id: "", name: "", slug: "", productCount: 0, isActive: true, createdAt: "", updatedAt: "" },
          brand: item.brand
            ? { _id: "", name: item.brand.name, slug: "", productCount: 0, isActive: true }
            : undefined,
          rating: 0,
          numReviews: 0,
          stock: item.stock,
          isFeatured: false,
          isVeg: true,
          isDeal: false,
          createdAt: "",
          updatedAt: "",
        }))
      );
    }
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="py-8">
      <div className="mb-6 flex items-center gap-2">
        <History className="h-5 w-5 text-gray-500" />
        <h2 className="text-2xl font-bold text-gray-900">Recently Viewed</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {products.slice(0, 4).map((product) => (
          <ProductCard key={product._id} product={product} variant="home" />
        ))}
      </div>
    </section>
  );
}
