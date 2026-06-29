import { Suspense } from "react";
import { Metadata } from "next";
import { Tag, Percent, Truck, Gift, Clock, Flame } from "lucide-react";
import { ProductCard } from "@/components/ui/product-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import type { Product } from "@/types";

export const metadata: Metadata = {
  title: "Deals & Offers",
  description:
    "Explore the best deals and offers on electronics, fashion, home & kitchen products. Save big with our exclusive discounts.",
};

const dealCategories = [
  { label: "All Deals", icon: Tag, active: true },
  { label: "Flash Sale", icon: Flame, active: false },
  { label: "% Off", icon: Percent, active: false },
  { label: "Free Shipping", icon: Truck, active: false },
  { label: "Bundle Offers", icon: Gift, active: false },
];

function DealsContent() {
  const dealProducts = MOCK_PRODUCTS.filter(
    (p) => p.originalPrice && p.originalPrice > p.price
  ).slice(0, 12);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Hero Banner */}
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 p-8 text-white">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="h-6 w-6 animate-pulse" />
            <Badge className="bg-white/20 text-white border-0">LIVE</Badge>
          </div>
          <h1 className="text-3xl font-bold mb-2">Mega Deals Festival</h1>
          <p className="text-white/90 text-lg mb-4">
            Up to 80% off on thousands of products. Limited time only!
          </p>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold">12</div>
              <div className="text-xs text-white/80">Days</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">08</div>
              <div className="text-xs text-white/80">Hours</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">45</div>
              <div className="text-xs text-white/80">Mins</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">30</div>
              <div className="text-xs text-white/80">Secs</div>
            </div>
          </div>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-transparent to-transparent opacity-20">
          <div className="absolute right-10 top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute bottom-10 right-20 h-24 w-24 rounded-full bg-white/10" />
        </div>
      </div>

      {/* Deal Categories */}
      <div className="mb-8 flex flex-wrap gap-3">
        {dealCategories.map((cat) => (
          <button
            key={cat.label}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              cat.active
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <cat.icon className="h-4 w-4" />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Deal of the Day */}
      <div className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Deal of the Day</h2>
            <p className="text-muted-foreground">
              Don&apos;t miss out on today&apos;s best deal
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Ends in 04:23:15</span>
          </div>
        </div>
        {dealProducts[0] && (
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex items-center justify-center rounded-lg bg-muted/50 p-8">
                <div className="text-center text-muted-foreground">
                  <Tag className="mx-auto h-16 w-16 mb-2" />
                  <p>{dealProducts[0].name}</p>
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <Badge className="mb-2 w-fit bg-red-500 text-white">
                  {Math.round(
                    ((dealProducts[0].originalPrice! - dealProducts[0].price) /
                      dealProducts[0].originalPrice!) *
                      100
                  )}
                  % OFF
                </Badge>
                <h3 className="text-2xl font-bold mb-2">
                  {dealProducts[0].name}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {dealProducts[0].description?.slice(0, 150)}...
                </p>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-bold text-primary">
                    ₹{dealProducts[0].price.toLocaleString("en-IN")}
                  </span>
                  <span className="text-lg text-muted-foreground line-through">
                    ₹{dealProducts[0].originalPrice?.toLocaleString("en-IN")}
                  </span>
                </div>
                <AddToCartButton
                  product={dealProducts[0] as unknown as Product}
                  size="md"
                  className="w-fit"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* All Deals */}
      <div>
        <h2 className="text-2xl font-bold mb-4">All Deals</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {dealProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DealsPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-muted animate-pulse" />}
    >
      <DealsContent />
    </Suspense>
  );
}
