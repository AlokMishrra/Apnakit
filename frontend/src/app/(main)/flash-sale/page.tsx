"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Flame, Clock, Zap, Loader2, Package, AlertCircle } from "lucide-react";
import { ProductCard } from "@/components/ui/product-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { flashSaleService } from "@/services/flash-sale.service";
import { toast } from "sonner";
import { getSafeErrorMessage } from "@/lib/safe-error";

function useCountdown(endTime: Date | string | null) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, expired: true });

  useEffect(() => {
    if (!endTime) {
      setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true });
      return;
    }
    const calculate = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const diff = Math.max(0, end - now);
      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        expired: diff === 0,
      });
    };
    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return timeLeft;
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-white p-3">
          <Skeleton className="aspect-square w-full" />
          <Skeleton className="mt-2 h-3 w-3/4" />
          <Skeleton className="mt-1 h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export default function FlashSalePage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      const res = await flashSaleService.getActive();
      const data = res?.data || res;
      const list = Array.isArray(data) ? data : [];
      setSales(list);
    } catch (err) {
      setError(getSafeErrorMessage(err, "Failed to load flash sales"));
      setSales([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  // Compute nextExpiring at the top so hook order stays stable
  const nextExpiring = useMemo(() => {
    if (sales.length === 0) return null;
    return sales.reduce((earliest: any, sale: any) => {
      if (!earliest) return sale;
      return new Date(sale.expiresAt) < new Date(earliest.expiresAt) ? sale : earliest;
    }, null);
  }, [sales]);

  const { hours, minutes, seconds, expired } = useCountdown(nextExpiring?.expiresAt ?? null);

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center text-white">
              <Skeleton className="mb-2 h-8 w-48 bg-white/30" />
              <Skeleton className="mb-6 h-4 w-64 bg-white/30" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-20 rounded-lg bg-white/30" />
                <Skeleton className="h-16 w-20 rounded-lg bg-white/30" />
                <Skeleton className="h-16 w-20 rounded-lg bg-white/30" />
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <ProductGridSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Flash Sale Header */}
      <div className="bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center text-white">
            <div className="mb-3 flex items-center gap-2">
              <Zap className="h-8 w-8 animate-pulse" />
              <Badge className="border-0 bg-white/20 text-white text-sm">
                {sales.length > 0 ? "LIVE NOW" : "NO ACTIVE SALES"}
              </Badge>
            </div>
            <h1 className="mb-2 text-4xl font-bold md:text-5xl">Flash Sale</h1>
            <p className="mb-6 text-lg text-white/90">
              Lightning-fast deals that won&apos;t last. Hurry up!
            </p>

            {/* Countdown Timer */}
            {nextExpiring && !expired && (
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-white/20 px-5 py-3 text-center backdrop-blur-sm">
                  <div className="text-3xl font-bold">{String(hours).padStart(2, "0")}</div>
                  <div className="text-xs text-white/80">Hours</div>
                </div>
                <span className="text-2xl font-bold">:</span>
                <div className="rounded-lg bg-white/20 px-5 py-3 text-center backdrop-blur-sm">
                  <div className="text-3xl font-bold">{String(minutes).padStart(2, "0")}</div>
                  <div className="text-xs text-white/80">Minutes</div>
                </div>
                <span className="text-2xl font-bold">:</span>
                <div className="rounded-lg bg-white/20 px-5 py-3 text-center backdrop-blur-sm">
                  <div className="text-3xl font-bold">{String(seconds).padStart(2, "0")}</div>
                  <div className="text-xs text-white/80">Seconds</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Flash Sale Products */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Hurry! Deals ending soon</h2>
            <p className="text-muted-foreground">
              {sales.length} {sales.length === 1 ? "product" : "products"} on flash sale
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/">
              <Clock className="mr-2 h-4 w-4" />
              Browse All
            </Link>
          </Button>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <AlertCircle className="mx-auto mb-2 h-8 w-8 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
            <Button onClick={fetchSales} variant="outline" size="sm" className="mt-3">
              Try Again
            </Button>
          </div>
        ) : sales.length === 0 ? (
          <div className="rounded-lg border bg-card p-12 text-center">
            <Package className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
            <h3 className="mb-1 text-base font-semibold">No active flash sales</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Check back soon for amazing limited-time deals!
            </p>
            <Button asChild>
              <Link href="/">Browse Products</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {sales.map((sale) => {
              const product = sale.product || {};
              const image = product.image;
              const price = Number(sale.salePrice) || 0;
              const originalPrice = Number(sale.originalPrice) || 0;
              const discount = sale.discount || 0;
              const stockLeft = sale.stockLeft || 0;
              const isOutOfStock = stockLeft <= 0;
              const productSlug = product.slug || product.id;

              return (
                <div key={sale.id} className="relative">
                  {discount > 0 && !isOutOfStock && (
                    <Badge className="absolute left-2 top-2 z-10 bg-red-500 text-white">
                      {discount}% OFF
                    </Badge>
                  )}
                  {isOutOfStock && (
                    <Badge variant="destructive" className="absolute left-2 top-2 z-10">
                      SOLD OUT
                    </Badge>
                  )}
                  <Link
                    href={`/product/${productSlug}`}
                    className="block overflow-hidden rounded-lg border bg-white transition-shadow hover:shadow-md"
                  >
                    <div className="relative aspect-square bg-gray-50 p-3">
                      {image ? (
                        <img
                          src={image}
                          alt={product.name}
                          className={`h-full w-full object-contain ${
                            isOutOfStock ? "opacity-50 grayscale" : ""
                          }`}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/images/placeholder.svg";
                          }}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-4xl text-gray-300">
                          📦
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-2 text-sm font-medium text-foreground">
                        {sale.title || product.name}
                      </p>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-base font-bold text-foreground">
                          ₹{price.toLocaleString("en-IN")}
                        </span>
                        {originalPrice > price && (
                          <span className="text-xs text-muted-foreground line-through">
                            ₹{originalPrice.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                      {stockLeft > 0 && (
                        <div className="mt-2">
                          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                            <span className="font-medium text-red-600">
                              {sale.soldPercent >= 80
                                ? "Almost gone!"
                                : `${sale.soldPercent || 0}% sold`}
                            </span>
                            <span>{stockLeft} left</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                            <div
                              className={`h-full rounded-full transition-all ${
                                sale.soldPercent > 80
                                  ? "bg-red-500"
                                  : sale.soldPercent > 50
                                  ? "bg-orange-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{ width: `${Math.min(100, sale.soldPercent || 0)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {/* Flash Sale Banner */}
        <div className="mt-10 rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Flame className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Want to be notified of flash sales?</h3>
                <p className="text-sm text-muted-foreground">
                  Get alerts for the best deals before anyone else
                </p>
              </div>
            </div>
            <Button onClick={() => toast.success("You'll be notified about flash sales!")}>
              <Bell className="mr-2 h-4 w-4" />
              Enable Notifications
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Bell({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
