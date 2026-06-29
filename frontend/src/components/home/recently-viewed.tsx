"use client";

import { useState, useEffect } from "react";
import { History } from "lucide-react";
import { ProductCard } from "@/components/ui/product-card";
import type { Product } from "@/types";

const mockRecentProducts: Product[] = [
  {
    _id: "r1",
    name: "Samsung Galaxy Buds2 Pro - Graphite",
    slug: "galaxy-buds2-pro",
    description: "True wireless earbuds with intelligent ANC and 360 Audio.",
    price: 11999,
    originalPrice: 17999,
    images: ["https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=400&h=400&fit=crop"],
    category: { _id: "2", name: "Audio", slug: "audio" },
    brand: { _id: "2", name: "Samsung", slug: "samsung" },
    rating: 4.5,
    numReviews: 1890,
    countInStock: 80,
    isFeatured: false,
    isDeal: false,
    createdAt: "2026-03-01",
  },
  {
    _id: "r2",
    name: "Apple AirPods Pro (2nd Gen) with MagSafe Case",
    slug: "airpods-pro-2nd-gen",
    description: "Up to 2x more noise cancellation with Adaptive Transparency.",
    price: 22900,
    originalPrice: 24900,
    images: ["https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&h=400&fit=crop"],
    category: { _id: "2", name: "Audio", slug: "audio" },
    brand: { _id: "1", name: "Apple", slug: "apple" },
    rating: 4.7,
    numReviews: 3456,
    countInStock: 150,
    isFeatured: false,
    isDeal: false,
    createdAt: "2026-03-05",
  },
  {
    _id: "r3",
    name: "Nike Air Jordan 1 Retro High OG - Chicago",
    slug: "air-jordan-1-chicago",
    description: "Iconic basketball shoe with premium leather upper.",
    price: 16995,
    originalPrice: 18995,
    images: ["https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop"],
    category: { _id: "4", name: "Footwear", slug: "footwear" },
    brand: { _id: "4", name: "Nike", slug: "nike" },
    rating: 4.8,
    numReviews: 567,
    countInStock: 10,
    isFeatured: false,
    isDeal: false,
    createdAt: "2026-03-10",
  },
  {
    _id: "r4",
    name: "Kindle Paperwhite Signature Edition - 32GB",
    slug: "kindle-paperwhite-signature",
    description: "7-inch glare-free display with auto-adjusting front light.",
    price: 17999,
    originalPrice: 19999,
    images: ["https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400&h=400&fit=crop"],
    category: { _id: "12", name: "E-Readers", slug: "e-readers" },
    brand: { _id: "1", name: "Amazon", slug: "amazon" },
    rating: 4.6,
    numReviews: 2345,
    countInStock: 60,
    isFeatured: false,
    isDeal: false,
    createdAt: "2026-03-15",
  },
];

function getRecentFromStorage(): Product[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("recentlyViewed");
    if (stored) {
      return JSON.parse(stored).slice(0, 8);
    }
  } catch {
    // ignore
  }
  return [];
}

function saveToStorage(products: Product[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("recentlyViewed", JSON.stringify(products));
  } catch {
    // ignore
  }
}

export function RecentlyViewed() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const stored = getRecentFromStorage();
    if (stored.length > 0) {
      setProducts(stored);
    } else {
      setProducts(mockRecentProducts);
      saveToStorage(mockRecentProducts);
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
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
}
