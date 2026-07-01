"use client";

import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";
import { ProductCard } from "@/components/ui/product-card";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/types";

interface RankedProduct extends Product {
  rank: number;
}

const bestSellers: RankedProduct[] = [
  {
    _id: "b1",
    rank: 1,
    name: "boAt Rockerz 450 Bluetooth Headphones - Luscious Black",
    slug: "boat-rockerz-450",
    description: "40mm dynamic drivers with padded ear cushions for comfort.",
    price: 1499,
    originalPrice: 3990,
    images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop"],
    category: { _id: "2", name: "Audio", slug: "audio" },
    brand: { _id: "11", name: "boAt", slug: "boat" },
    rating: 4.3,
    numReviews: 23456,
    countInStock: 1000,
    isFeatured: false,
    isDeal: true,
    createdAt: "2026-01-01",
  },
  {
    _id: "b2",
    rank: 2,
    name: "Realme Narzo 70 Turbo 5G - Turbo Purple (6GB, 128GB)",
    slug: "realme-narzo-70-turbo",
    description: "Dimensity 7300 Energy with 5000mAh battery and 45W charging.",
    price: 13999,
    originalPrice: 17999,
    images: ["https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=400&fit=crop"],
    category: { _id: "1", name: "Smartphones", slug: "smartphones" },
    brand: { _id: "16", name: "Realme", slug: "realme" },
    rating: 4.2,
    numReviews: 15678,
    countInStock: 500,
    isFeatured: false,
    isDeal: false,
    createdAt: "2026-01-10",
  },
  {
    _id: "b3",
    rank: 3,
    name: "Noise ColorFit Pro 5 Max Smartwatch - Jet Black",
    slug: "noise-colorfit-pro-5",
    description: "1.96-inch AMOLED display with Bluetooth calling and 100+ watch faces.",
    price: 2999,
    originalPrice: 6999,
    images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop"],
    category: { _id: "9", name: "Wearables", slug: "wearables" },
    brand: { _id: "17", name: "Noise", slug: "noise" },
    rating: 4.1,
    numReviews: 18901,
    countInStock: 750,
    isFeatured: false,
    isDeal: true,
    createdAt: "2026-01-15",
  },
  {
    _id: "b4",
    rank: 4,
    name: "Portronics Konnect L 1.2M Fast Charging Cable - Grey",
    slug: "portronics-konnect-l",
    description: "Braided nylon cable with 3A fast charging and data transfer.",
    price: 189,
    originalPrice: 699,
    images: ["https://images.unsplash.com/photo-1625842268584-8f3296236761?w=400&h=400&fit=crop"],
    category: { _id: "10", name: "Accessories", slug: "accessories" },
    brand: { _id: "18", name: "Portronics", slug: "portronics" },
    rating: 4.0,
    numReviews: 34567,
    countInStock: 5000,
    isFeatured: false,
    isDeal: false,
    createdAt: "2026-01-20",
  },
  {
    _id: "b5",
    rank: 5,
    name: "Honeywell Air Purifier for Room - HAC35M1101W",
    slug: "honeywell-air-purifier",
    description: "HEPA filter with 3D airflow for rooms up to 323 sq ft.",
    price: 8499,
    originalPrice: 14999,
    images: ["https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=400&fit=crop"],
    category: { _id: "6", name: "Home Appliances", slug: "home-appliances" },
    brand: { _id: "19", name: "Honeywell", slug: "honeywell" },
    rating: 4.4,
    numReviews: 4567,
    countInStock: 80,
    isFeatured: false,
    isDeal: true,
    createdAt: "2026-02-01",
  },
  {
    _id: "b6",
    rank: 6,
    name: "Cello Opalware Dinner Set - Mystic Rose (33 pcs)",
    slug: "cello-opalware-dinner-set",
    description: "Durable dinnerware set with elegant floral design.",
    price: 2149,
    originalPrice: 4190,
    images: ["https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop"],
    category: { _id: "11", name: "Kitchen & Dining", slug: "kitchen-dining" },
    brand: { _id: "20", name: "Cello", slug: "cello" },
    rating: 4.3,
    numReviews: 8901,
    countInStock: 300,
    isFeatured: false,
    isDeal: false,
    createdAt: "2026-02-10",
  },
  {
    _id: "b7",
    rank: 7,
    name: "Levi's 511 Slim Fit Jeans - Indigo Blue",
    slug: "levis-511-slim-jeans",
    description: "Classic slim fit jeans with stretch for all-day comfort.",
    price: 2499,
    originalPrice: 3999,
    images: ["https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop"],
    category: { _id: "4", name: "Fashion", slug: "fashion" },
    brand: { _id: "21", name: "Levi's", slug: "levis" },
    rating: 4.5,
    numReviews: 12345,
    countInStock: 600,
    isFeatured: false,
    isDeal: false,
    createdAt: "2026-02-15",
  },
  {
    _id: "b8",
    rank: 8,
    name: "Milton Thermosteel Flip Lid Flask - 500ml",
    slug: "milton-thermosteel-flask",
    description: "24-hour hot & cold retention with leak-proof design.",
    price: 699,
    originalPrice: 1499,
    images: ["https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=400&fit=crop"],
    category: { _id: "11", name: "Kitchen & Dining", slug: "kitchen-dining" },
    brand: { _id: "22", name: "Milton", slug: "milton" },
    rating: 4.2,
    numReviews: 23456,
    countInStock: 2000,
    isFeatured: false,
    isDeal: true,
    createdAt: "2026-02-20",
  },
];

function RankBadge({ rank }: { rank: number }) {
  const colors: Record<number, string> = {
    1: "bg-yellow-400 text-yellow-900",
    2: "bg-gray-300 text-gray-700",
    3: "bg-amber-600 text-white",
  };

  return (
    <Badge
      className={`absolute left-2 top-2 z-10 gap-1 ${colors[rank] || "bg-gray-200 text-gray-700"}`}
    >
      <Trophy className="h-3 w-3" />
      #{rank}
    </Badge>
  );
}

export function BestSellers() {
  return (
    <section className="py-2">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <h2 className="text-2xl font-bold text-gray-900">Best Sellers</h2>
        </div>
        <Link
          href="/products?filter=best-sellers"
          className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          View All
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {bestSellers.map((product) => (
          <div key={product._id} className="relative">
            <RankBadge rank={product.rank} />
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
