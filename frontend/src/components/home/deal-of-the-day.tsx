"use client";

import { useState, useEffect } from "react";
import { Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { Rating } from "@/components/ui/rating";
import { formatCurrency, getImageUrl } from "@/lib/utils";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import type { Product } from "@/types";
import Link from "next/link";

interface DealProduct {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice: number;
  rating: number;
  numReviews: number;
  image: string;
  features: string[];
  totalStock: number;
  soldStock: number;
}

const dealProduct: DealProduct = {
  _id: "deal1",
  name: "Sony PlayStation 5 Digital Edition Console",
  slug: "ps5-digital-edition",
  description:
    "Experience lightning-fast loading with an ultra-high speed SSD, deeper immersion with haptic feedback, adaptive triggers, and 3D Audio. The PS5 Digital Edition lets you download games digitally.",
  price: 39990,
  originalPrice: 49990,
  rating: 4.8,
  numReviews: 5678,
  image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&h=600&fit=crop",
  features: [
    "Ultra-high speed SSD for near-instant load times",
    "Ray tracing for lifelike lighting and reflections",
    "3D Audio for immersive soundscapes",
    "DualSense wireless controller with haptic feedback",
    "Backwards compatible with PS4 games",
  ],
  totalStock: 100,
  soldStock: 87,
};

function useDealCountdown() {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const diff = endOfDay.getTime() - now.getTime();

      return {
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  return timeLeft;
}

export function DealOfTheDay() {
  const { hours, minutes, seconds } = useDealCountdown();
  const soldPercent = Math.round(
    (dealProduct.soldStock / dealProduct.totalStock) * 100
  );

  // Build a Product-like object for the cart
  const productForCart: Product = {
    _id: dealProduct._id,
    name: dealProduct.name,
    slug: dealProduct.slug,
    description: dealProduct.description,
    price: dealProduct.price,
    originalPrice: dealProduct.originalPrice,
    sku: "",
    stock: dealProduct.totalStock - dealProduct.soldStock,
    images: [{ url: dealProduct.image, alt: dealProduct.name, isPrimary: true }],
    category: { _id: "", name: "", slug: "", productCount: 0, isActive: true, createdAt: "", updatedAt: "" },
    brand: { _id: "", name: "", slug: "", productCount: 0, isActive: true },
    variants: [],
    tags: [],
    specifications: [],
    ratings: { average: dealProduct.rating, count: dealProduct.numReviews },
    isActive: true,
    isFeatured: true,
    isTrending: false,
    isBestSeller: false,
    createdAt: "",
    updatedAt: "",
  } as Product;

  return (
    <section className="bg-gradient-to-br from-indigo-50 via-white to-violet-50 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Deal of the Day</h2>
              <p className="text-sm text-gray-500">Hurry! Ends tonight</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Ends in:</span>
            <div className="flex gap-1">
              {[hours, minutes, seconds].map((val, i) => (
                <span key={i} className="flex items-baseline gap-0.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded bg-indigo-600 text-sm font-bold text-white">
                    {String(val).padStart(2, "0")}
                  </span>
                  {i < 2 && <span className="text-indigo-400">:</span>}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-8 rounded-2xl border bg-white p-6 shadow-lg lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-xl bg-gray-50">
            <Badge variant="destructive" className="absolute left-3 top-3 z-10">
              {Math.round(((dealProduct.originalPrice - dealProduct.price) / dealProduct.originalPrice) * 100)}% OFF
            </Badge>
            <img
              src={getImageUrl(dealProduct.image)}
              alt={dealProduct.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/images/placeholder.svg";
              }}
            />
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 lg:text-2xl">
                {dealProduct.name}
              </h3>
              <Rating
                value={dealProduct.rating}
                size="md"
                showValue
                showCount
                count={dealProduct.numReviews}
                className="mt-2"
              />
              <p className="mt-4 text-gray-600">{dealProduct.description}</p>
              <ul className="mt-4 space-y-2">
                {dealProduct.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 space-y-4">
              <Price
                amount={dealProduct.price}
                originalAmount={dealProduct.originalPrice}
                size="lg"
              />

              <div className="flex gap-3">
                <AddToCartButton
                  product={productForCart}
                  size="lg"
                  className="flex-1"
                  label="Add to Cart"
                />
                <Button size="lg" variant="outline" className="gap-2" asChild>
                  <Link href={`/product/${dealProduct.slug}`}>
                    View Details
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
