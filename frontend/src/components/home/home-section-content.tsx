"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  PackageX,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, getImageUrl, productPlaceholder } from "@/lib/utils";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import type {
  HomeSectionItem,
  HomeSectionCategory,
  SectionBanner,
} from "@/services/home-section.service";

interface HomeSectionContentProps {
  title: string;
  subtitle?: string | null;
  items: HomeSectionItem[];
  categories: HomeSectionCategory[];
  banners: SectionBanner[];
  isLoading: boolean;
  layout: "rail" | "grid";
}

function toCartProduct(item: HomeSectionItem) {
  // AddToCartButton expects the storefront Product shape.
  return {
    _id: item.productId,
    id: item.productId,
    name: item.name,
    slug: item.slug,
    price: item.price,
    originalPrice: item.compareAtPrice ?? item.price,
    image: item.image,
    stock: 1,
    variantId: item.variantId,
  } as any;
}

/** Compact card sized so three fit across a phone and four-plus on desktop. */
function SectionCard({ item, compact }: { item: HomeSectionItem; compact: boolean }) {
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md">
      <Link
        href={`/product/${item.slug}`}
        className={cn(
          "relative block overflow-hidden bg-muted",
          compact ? "aspect-square p-2" : "aspect-square p-3",
        )}
      >
        {item.discount > 0 && (
          <Badge
            variant="destructive"
            className="absolute left-1 top-1 z-10 rounded-none rounded-br px-1.5 py-0.5 text-[9px] font-bold text-white"
          >
            {item.discount}% OFF
          </Badge>
        )}
        <Image
          src={getImageUrl(item.image, productPlaceholder(item.name))}
          alt={item.alt}
          fill
          sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 20vw"
          className="object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </Link>

      <div className={cn("flex flex-1 flex-col", compact ? "gap-0.5 p-2" : "gap-1 p-2.5")}>
        {item.brand && (
          <span className="truncate text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
            {item.brand}
          </span>
        )}
        <Link
          href={`/product/${item.slug}`}
          className={cn(
            "line-clamp-2 leading-tight hover:text-primary",
            compact ? "text-[11px] font-medium" : "text-sm font-medium",
          )}
        >
          {item.name}
        </Link>
        <Price
          amount={item.price}
          originalAmount={item.compareAtPrice ?? undefined}
          size="sm"
          className="mt-auto pt-1 [&_span]:text-[12px] sm:[&_span]:text-[13px]"
        />
        <AddToCartButton
          product={toCartProduct(item)}
          size="sm"
          label="Add"
          className={cn("mt-1 w-full [&_span]:text-[10px]", compact && "px-1")}
        />
      </div>
    </div>
  );
}

function BannerStrip({ banners }: { banners: SectionBanner[] }) {
  const [index, setIndex] = useState(0);

  if (banners.length === 0) return null;

  const banner = banners[Math.min(index, banners.length - 1)];
  const multiple = banners.length > 1;

  return (
    <div className="relative overflow-hidden rounded-xl border bg-muted">
      <Link
        href={banner.link || "/products"}
        className="relative block aspect-[16/9] w-full sm:aspect-[32/9]"
      >
        <Image
          src={getImageUrl(banner.image)}
          alt={banner.title}
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 flex flex-col justify-center bg-gradient-to-r from-black/70 via-black/40 to-transparent px-5 sm:px-10">
          <h3 className="max-w-[80%] text-base font-bold leading-tight text-white sm:text-2xl">
            {banner.title}
          </h3>
          {banner.subtitle && (
            <p className="mt-1 max-w-[85%] text-[11px] leading-snug text-white/85 sm:text-sm">
              {banner.subtitle}
            </p>
          )}
        </div>
      </Link>

      {multiple && (
        <>
          <button
            type="button"
            aria-label="Previous banner"
            onClick={() =>
              setIndex((i) => (i - 1 + banners.length) % banners.length)
            }
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-1 text-white transition hover:bg-black/70"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next banner"
            onClick={() => setIndex((i) => (i + 1) % banners.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-1 text-white transition hover:bg-black/70"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                aria-label={`Go to banner ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-4 bg-white" : "w-1.5 bg-white/50",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function HomeSectionContent({
  title,
  subtitle,
  items,
  categories,
  banners,
  isLoading,
  layout,
}: HomeSectionContentProps) {
  // Category chips narrow the section client-side.
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Only offer chips that actually match something in this section.
  const chips = categories.filter((category) =>
    items.some((item) => item.categoryId === category.id),
  );

  const visibleItems = activeCategory
    ? items.filter((item) => item.categoryId === activeCategory)
    : items;

  return (
    <section aria-label={title} className="space-y-4">
      <BannerStrip banners={banners} />

      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold sm:text-xl">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground sm:text-sm">
              {subtitle}
            </p>
          )}
        </div>
        <Button asChild variant="ghost" size="sm" className="shrink-0">
          <Link href="/products">
            See All
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {chips.length > 0 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {chips.map((category) => {
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() =>
                  setActiveCategory(isActive ? null : category.id)
                }
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-card hover:border-primary/50 hover:bg-accent",
                )}
              >
                {category.name}
              </button>
            );
          })}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-2">
              <Skeleton variant="rounded" className="aspect-square w-full" />
              <Skeleton className="mt-2 h-2.5 w-3/4" />
              <Skeleton className="mt-1.5 h-2.5 w-1/2" />
            </div>
          ))}
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-12 text-center">
          <PackageX className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {activeCategory
              ? "No products in this category."
              : "No products in this section yet."}
          </p>
          {!activeCategory && (
            <p className="text-xs text-muted-foreground">
              Add items from Admin → Home Sections.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
          {visibleItems.map((item) => (
            <SectionCard
              key={item.id}
              item={item}
              compact={layout === "rail"}
            />
          ))}
        </div>
      )}
    </section>
  );
}