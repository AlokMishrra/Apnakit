"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  ShoppingCart,
  Trash2,
  Star,
  Share2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, calculateDiscount } from "@/lib/utils";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { toast } from "sonner";
import api from "@/services/api";
import type { Product } from "@/types";

interface WishlistEntry {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    originalPrice: number;
    totalStock: number;
    images: { url: string; alt: string }[];
    brand: { name: string } | null;
    category: { name: string } | null;
    ratings: { average: number; count: number };
  };
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const res = await api.get("/wishlist");
      const data = res.data?.data;
      setItems(data?.items || []);
    } catch {
      toast.error("Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (entry: WishlistEntry) => {
    try {
      setRemovingId(entry.id);
      await api.delete(`/wishlist/${entry.productId}`);
      setItems((prev) => prev.filter((i) => i.id !== entry.id));
      toast.success("Removed from wishlist");
    } catch {
      toast.error("Failed to remove item");
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="mb-8 text-2xl font-bold text-foreground">My Wishlist</h1>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse rounded-lg border bg-white p-3">
                <div className="aspect-square rounded-lg bg-gray-200" />
                <div className="mt-3 space-y-2">
                  <div className="h-3 w-16 rounded bg-gray-200" />
                  <div className="h-4 w-full rounded bg-gray-200" />
                  <div className="h-4 w-3/4 rounded bg-gray-200" />
                  <div className="h-6 w-20 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
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
              ({items.length} {items.length === 1 ? "item" : "items"})
            </span>
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((entry) => {
            const p = entry.product;
            const imageUrl = p.images?.[0]?.url || "https://placehold.co/300x300/e2e8f0/94a3b8?text=No+Image";
            const discount = calculateDiscount(p.price, p.originalPrice);
            const inStock = p.totalStock > 0;

            return (
              <Card
                key={entry.id}
                className="group overflow-hidden transition-all hover:shadow-md"
              >
                <div className="relative aspect-square bg-gray-50">
                  <Link href={`/product/${p.slug}`}>
                    <Image
                      src={imageUrl}
                      alt={p.images?.[0]?.alt || p.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  </Link>

                  <div className="absolute left-2 top-2 flex flex-col gap-1">
                    {discount > 0 && (
                      <Badge className="bg-emerald-500 text-white text-xs">
                        {discount}% off
                      </Badge>
                    )}
                    {!inStock && (
                      <Badge variant="destructive" className="text-xs">
                        Out of Stock
                      </Badge>
                    )}
                  </div>

                  <div className="absolute right-2 top-2 flex flex-col gap-1">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 bg-white/90 backdrop-blur-sm hover:bg-white"
                      onClick={() => handleRemove(entry)}
                      disabled={removingId === entry.id}
                    >
                      {removingId === entry.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 bg-white/90 backdrop-blur-sm hover:bg-white"
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.origin + `/product/${p.slug}`);
                        toast.success("Link copied!");
                      }}
                    >
                      <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>

                <CardContent className="p-3">
                  {p.brand && (
                    <p className="text-xs font-medium text-indigo-600">{p.brand.name}</p>
                  )}
                  <Link href={`/product/${p.slug}`}>
                    <h3 className="mt-0.5 text-sm font-medium text-foreground line-clamp-2 hover:text-indigo-600">
                      {p.name}
                    </h3>
                  </Link>

                  <div className="mt-1.5 flex items-center gap-1">
                    {p.ratings?.average > 0 && (
                      <div className="flex items-center gap-0.5 rounded bg-emerald-500 px-1.5 py-0.5">
                        <Star className="h-3 w-3 fill-white text-white" />
                        <span className="text-xs font-medium text-white">{p.ratings.average}</span>
                      </div>
                    )}
                    {p.ratings?.count > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({p.ratings.count.toLocaleString()})
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-lg font-bold text-foreground">
                      {formatCurrency(p.price)}
                    </span>
                    {p.originalPrice > p.price && (
                      <span className="text-xs text-muted-foreground line-through">
                        {formatCurrency(p.originalPrice)}
                      </span>
                    )}
                  </div>

                  {inStock ? (
                    <div className="mt-3">
                      <AddToCartButton
                        product={
                          {
                            _id: p.id,
                            name: p.name,
                            slug: p.slug,
                            description: "",
                            price: p.price,
                            originalPrice: p.originalPrice,
                            sku: "",
                            stock: p.totalStock,
                            images: p.images?.length ? p.images : [{ url: imageUrl, alt: p.name, isPrimary: true }],
                            category: { _id: "", name: p.category?.name || "", slug: "", productCount: 0, isActive: true, createdAt: "", updatedAt: "" },
                            brand: { _id: "", name: p.brand?.name || "", slug: "", productCount: 0, isActive: true },
                            variants: [],
                            tags: [],
                            specifications: [],
                            ratings: { average: p.ratings?.average || 0, count: p.ratings?.count || 0 },
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
