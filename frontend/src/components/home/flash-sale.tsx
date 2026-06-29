"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency, getImageUrl } from "@/lib/utils";
import { flashSaleService } from "@/services/flash-sale.service";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import type { Product } from "@/types";

function useCountdown(endTime: Date | string | null) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    if (!endTime) return;
    const calculate = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const diff = Math.max(0, end - now);

      if (diff === 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }

      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        expired: false,
      });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return timeLeft;
}

function FlashSaleSkeleton() {
  return (
    <div className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="min-w-[240px] flex-shrink-0 rounded-xl border bg-white p-4">
            <Skeleton className="mb-3 aspect-square w-full" />
            <Skeleton className="mb-2 h-3 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return null; // Hide entire section if no active flash sales
}

interface FlashSaleCardProps {
  sale: any;
  onTimeUp?: () => void;
}

function FlashSaleCard({ sale }: FlashSaleCardProps) {
  const { hours, minutes, seconds, expired } = useCountdown(sale.expiresAt);
  const product = sale.product || {};
  const image = getImageUrl(product.image);
  const soldPercent = sale.soldPercent || 0;
  const stockLeft = sale.stockLeft || 0;
  const isLowStock = stockLeft > 0 && stockLeft <= Math.max(1, Math.floor((sale.totalStock || 1) * 0.2));
  const isOutOfStock = stockLeft <= 0;
  const link = `/product/${product.slug || product.id}`;

  // Map flash-sale product to our Product type for the cart
  const productForCart: Product = {
    _id: product.id || sale.productId,
    name: product.name || sale.title || "Flash deal",
    slug: product.slug || "",
    description: product.description || "",
    price: Number(sale.salePrice ?? product.price ?? 0),
    originalPrice: Number(sale.originalPrice ?? product.price ?? 0),
    sku: product.sku || "",
    stock: stockLeft,
    images: product.image
      ? [{ url: product.image, alt: product.name || "", isPrimary: true }]
      : [],
    category: { _id: "", name: "", slug: "", productCount: 0, isActive: true, createdAt: "", updatedAt: "" },
    brand: { _id: "", name: product.brand || "", slug: "", productCount: 0, isActive: true },
    variants: [],
    tags: [],
    specifications: [],
    ratings: { average: 0, count: 0 },
    isActive: true,
    isFeatured: false,
    isTrending: false,
    isBestSeller: false,
    createdAt: "",
    updatedAt: "",
  } as Product;

  return (
    <div className="flex min-w-[240px] flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link href={link} className="relative block bg-gray-50 p-4">
        {image ? (
          <img
            src={image}
            alt={product.name}
            className={cn(
              "mx-auto h-36 w-36 object-contain transition-transform hover:scale-105",
              isOutOfStock && "opacity-50 grayscale"
            )}
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/images/placeholder.svg";
            }}
          />
        ) : (
          <div className="mx-auto flex h-36 w-36 items-center justify-center text-4xl text-gray-300">
            📦
          </div>
        )}
        {sale.discount > 0 && !isOutOfStock && (
          <Badge variant="destructive" className="absolute left-2 top-2">
            -{sale.discount}%
          </Badge>
        )}
        {isLowStock && !isOutOfStock && (
          <Badge className="absolute right-2 top-2 bg-amber-500 text-white">
            Low Stock
          </Badge>
        )}
        {isOutOfStock && (
          <Badge variant="destructive" className="absolute left-2 top-2 uppercase">
            Sold Out
          </Badge>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link
          href={link}
          className="line-clamp-2 text-sm font-medium text-gray-900 hover:text-indigo-600"
        >
          {sale.title || product.name}
        </Link>
        {product.brand && (
          <p className="text-xs text-muted-foreground">{product.brand}</p>
        )}
        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-foreground">
            {formatCurrency(sale.salePrice)}
          </span>
          {sale.originalPrice > sale.salePrice && (
            <span className="text-xs text-muted-foreground line-through">
              {formatCurrency(sale.originalPrice)}
            </span>
          )}
        </div>
        {!expired && !isOutOfStock && (
          <div className="mt-auto">
            <div className="mb-1 flex justify-between text-xs text-gray-500">
              <span className="font-medium text-red-600">
                {soldPercent >= 80 ? "Almost gone!" : `${soldPercent}% sold`}
              </span>
              <span>{stockLeft} left</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  soldPercent > 80 ? "bg-red-500" : soldPercent > 50 ? "bg-orange-500" : "bg-emerald-500"
                )}
                style={{ width: `${Math.min(100, soldPercent)}%` }}
              />
            </div>
          </div>
        )}
        {!expired && !isOutOfStock && (
          <AddToCartButton product={productForCart} size="sm" className="mt-2" />
        )}
        {(expired || isOutOfStock) && (
          <Button
            size="sm"
            variant="outline"
            className="mt-2 w-full"
            disabled
          >
            {expired ? "Expired" : "Sold Out"}
          </Button>
        )}
      </div>
    </div>
  );
}

export function FlashSale() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrollRef, setScrollRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        setLoading(true);
        const res = await flashSaleService.getActive();
        const data = res?.data || res;
        const list = Array.isArray(data) ? data : [];
        setSales(list);
      } catch (err) {
        // Silently fail - just hide the section
        setSales([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSales();
    // Refresh every 60s to pick up new sales
    const interval = setInterval(fetchSales, 60000);
    return () => clearInterval(interval);
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef) return;
    scrollRef.scrollBy({ left: direction === "left" ? -300 : 300, behavior: "smooth" });
  };

  // Always compute nextExpiring + useCountdown at the top so hook order is stable
  const nextExpiring = sales.reduce((earliest: any, sale: any) => {
    if (!earliest) return sale;
    return new Date(sale.expiresAt) < new Date(earliest.expiresAt) ? sale : earliest;
  }, null as any);
  const { hours, minutes, seconds } = useCountdown(nextExpiring?.expiresAt ?? null);

  if (loading) return <FlashSaleSkeleton />;
  if (sales.length === 0) return <EmptyState />;

  return (
    <section className="bg-gradient-to-r from-orange-50 to-red-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Flash Sale</h2>
              <p className="text-sm text-gray-500">Limited time deals you don&apos;t want to miss</p>
            </div>
          </div>

          {nextExpiring && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-gray-700">Ends in:</span>
              <div className="flex gap-1">
                {[
                  { value: hours, label: "H" },
                  { value: minutes, label: "M" },
                  { value: seconds, label: "S" },
                ].map((item, i) => (
                  <span key={i} className="flex items-baseline gap-0.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded bg-red-500 text-sm font-bold text-white">
                      {String(item.value).padStart(2, "0")}
                    </span>
                    <span className="text-xs text-gray-500">{item.label}</span>
                    {i < 2 && <span className="mx-0.5 text-red-400">:</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute -left-4 top-1/2 z-10 hidden -translate-y-1/2 bg-white shadow-md hover:bg-gray-50 sm:flex"
            onClick={() => scroll("left")}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div
            ref={setScrollRef}
            className="scrollbar-hide flex gap-4 overflow-x-auto pb-4"
          >
            {sales.map((sale) => (
              <FlashSaleCard key={sale.id} sale={sale} />
            ))}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 bg-white shadow-md hover:bg-gray-50 sm:flex"
            onClick={() => scroll("right")}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}
