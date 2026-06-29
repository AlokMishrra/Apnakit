"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  ShoppingCart,
  Trash2,
  Star,
  PackageOpen,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, calculateDiscount } from "@/lib/utils";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import type { Product } from "@/types";

interface WishlistItem {
  id: string;
  name: string;
  image: string;
  price: number;
  originalPrice: number;
  brand: string;
  rating: number;
  numReviews: number;
  inStock: boolean;
}

const mockWishlist: WishlistItem[] = [
  {
    id: "1",
    name: "Logitech MX Master 3S Wireless Mouse",
    image: "https://placehold.co/300x300/c4b5fd/312e81?text=Mouse",
    price: 7995,
    originalPrice: 9995,
    brand: "Logitech",
    rating: 4.7,
    numReviews: 2341,
    inStock: true,
  },
  {
    id: "2",
    name: "Keychron K2 Wireless Mechanical Keyboard",
    image: "https://placehold.co/300x300/ddd6fe/4c1d95?text=Keyboard",
    price: 8499,
    originalPrice: 9999,
    brand: "Keychron",
    rating: 4.5,
    numReviews: 892,
    inStock: true,
  },
  {
    id: "3",
    name: "Samsung 34-inch Ultrawide Curved Monitor",
    image: "https://placehold.co/300x300/a78bfa/ffffff?text=Monitor",
    price: 34999,
    originalPrice: 44999,
    brand: "Samsung",
    rating: 4.6,
    numReviews: 567,
    inStock: true,
  },
  {
    id: "4",
    name: "Apple AirPods Pro 2nd Generation",
    image: "https://placehold.co/300x300/d1d5db/374151?text=AirPods",
    price: 24900,
    originalPrice: 27900,
    brand: "Apple",
    rating: 4.8,
    numReviews: 5623,
    inStock: false,
  },
  {
    id: "5",
    name: "Sony WF-1000XM5 Truly Wireless Earbuds",
    image: "https://placehold.co/300x300/6366f1/ffffff?text=Earbuds",
    price: 24990,
    originalPrice: 29990,
    brand: "Sony",
    rating: 4.7,
    numReviews: 1234,
    inStock: true,
  },
  {
    id: "6",
    name: "Dyson V15 Detect Absolute Cordless Vacuum",
    image: "https://placehold.co/300x300/f472b6/ffffff?text=Dyson",
    price: 52900,
    originalPrice: 62900,
    brand: "Dyson",
    rating: 4.4,
    numReviews: 345,
    inStock: true,
  },
];

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>(mockWishlist);

  const handleRemove = (id: string) => {
    setWishlist((items) => items.filter((item) => item.id !== id));
  };

  const handleMoveToCart = (id: string) => {
    // In real app, add to cart and remove from wishlist
    setWishlist((items) => items.filter((item) => item.id !== id));
  };

  if (wishlist.length === 0) {
    return (
      <div className="min-h-[60vh]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="mb-8 text-2xl font-bold text-foreground">My Wishlist</h1>
          <Card>
            <CardContent className="py-16">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="mb-6 rounded-full bg-pink-50 p-6">
                  <Heart className="h-16 w-16 text-pink-300" />
                </div>
                <h2 className="mb-2 text-xl font-semibold text-foreground">
                  Your wishlist is empty
                </h2>
                <p className="mb-8 max-w-sm text-muted-foreground">
                  Save your favorite items here for easy access later. Click the heart icon on any product to add it to your wishlist.
                </p>
                <Link href="/">
                  <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Explore Products
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">
            My Wishlist{" "}
            <span className="text-base font-normal text-muted-foreground">
              ({wishlist.length} {wishlist.length === 1 ? "item" : "items"})
            </span>
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {wishlist.map((item) => {
            const discount = calculateDiscount(item.price, item.originalPrice);

            return (
              <Card
                key={item.id}
                className="group overflow-hidden transition-all hover:shadow-md"
              >
                <div className="relative aspect-square bg-gray-50">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />

                  {/* Badges */}
                  <div className="absolute left-2 top-2 flex flex-col gap-1">
                    {discount > 0 && (
                      <Badge className="bg-emerald-500 text-white text-xs">
                        {discount}% off
                      </Badge>
                    )}
                    {!item.inStock && (
                      <Badge variant="destructive" className="text-xs">
                        Out of Stock
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="absolute right-2 top-2 flex flex-col gap-1">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 bg-white/90 backdrop-blur-sm hover:bg-white"
                      onClick={() => handleRemove(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 bg-white/90 backdrop-blur-sm hover:bg-white"
                    >
                      <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>

                <CardContent className="p-3">
                  <p className="text-xs font-medium text-indigo-600">{item.brand}</p>
                  <h3 className="mt-0.5 text-sm font-medium text-foreground line-clamp-2">
                    {item.name}
                  </h3>

                  {/* Rating */}
                  <div className="mt-1.5 flex items-center gap-1">
                    <div className="flex items-center gap-0.5 rounded bg-emerald-500 px-1.5 py-0.5">
                      <Star className="h-3 w-3 fill-white text-white" />
                      <span className="text-xs font-medium text-white">{item.rating}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      ({item.numReviews.toLocaleString()})
                    </span>
                  </div>

                  {/* Price */}
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-lg font-bold text-foreground">
                      {formatCurrency(item.price)}
                    </span>
                    <span className="text-xs text-muted-foreground line-through">
                      {formatCurrency(item.originalPrice)}
                    </span>
                  </div>

                  {/* Add to Cart */}
                  {item.inStock ? (
                    <div className="mt-3">
                      <AddToCartButton
                        product={
                          {
                            _id: item.id,
                            name: item.name,
                            slug: item.id,
                            description: "",
                            price: item.price,
                            originalPrice: item.originalPrice,
                            sku: "",
                            stock: 99,
                            images: [{ url: item.image, alt: item.name, isPrimary: true }],
                            category: { _id: "", name: "", slug: "", productCount: 0, isActive: true, createdAt: "", updatedAt: "" },
                            brand: { _id: "", name: item.brand, slug: "", productCount: 0, isActive: true },
                            variants: [],
                            tags: [],
                            specifications: [],
                            ratings: { average: item.rating, count: item.numReviews },
                            isActive: true,
                            isFeatured: false,
                            isTrending: false,
                            isBestSeller: false,
                            createdAt: "",
                            updatedAt: "",
                          } as Product
                        }
                        size="sm"
                      />
                    </div>
                  ) : (
                    <Button className="mt-3 w-full" size="sm" disabled variant="outline">
                      Out of Stock
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
