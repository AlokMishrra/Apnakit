"use client";

import * as React from "react";
import { Heart, Eye } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";
import { Price } from "./price";
import { Rating } from "./rating";
import { Button } from "./button";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { getImageUrl, calculateDiscount } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  /** Optional callback kept for backwards compatibility. */
  onAddToCart?: (product: Product) => void;
  onAddToWishlist?: (product: Product) => void;
  isInWishlist?: boolean;
  className?: string;
}

function ProductCard({
  product,
  onAddToCart: _onAddToCart,
  onAddToWishlist,
  isInWishlist = false,
  className,
}: ProductCardProps) {
  const discount = calculateDiscount(product.price, product.compareAtPrice || product.originalPrice);
  const totalStock = product.stock ?? product.totalStock ?? product.variants?.reduce((s: number, v: any) => s + (v.stock || 0), 0) ?? 0;
  const inStock = totalStock > 0;

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border bg-card transition-all hover:shadow-md",
        className
      )}
    >
      <Link
        href={`/product/${product.slug || product._id}`}
        className="relative block aspect-square overflow-hidden bg-muted p-4"
      >
        <Image
          src={getImageUrl(product.images[0])}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={cn(
            "object-contain transition-transform duration-300 group-hover:scale-105",
            !inStock && "opacity-60 grayscale"
          )}
          unoptimized
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/images/placeholder.svg";
          }}
        />
        {discount > 0 && (
          <Badge variant="destructive" className="absolute left-2 top-2 z-10">
            -{discount}%
          </Badge>
        )}
        {product.isDeal && (
          <Badge variant="warning" className="absolute right-2 top-2 z-10">
            Deal
          </Badge>
        )}
        {!inStock && (
          <div className="absolute inset-0 z-[5] flex items-center justify-center bg-black/30">
            <Badge
              variant="destructive"
              className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider shadow-lg"
            >
              Out of Stock
            </Badge>
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/10 group-hover:opacity-100">
          <Button
            size="icon"
            variant="secondary"
            className="h-9 w-9 rounded-full shadow-sm"
            onClick={(e) => {
              e.preventDefault();
              onAddToWishlist?.(product);
            }}
          >
            <Heart
              className={cn("h-4 w-4", isInWishlist && "fill-red-500 text-red-500")}
            />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-9 w-9 rounded-full shadow-sm"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = `/product/${product.slug || product._id}`;
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {product.brand && (
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            {product.brand.name}
          </span>
        )}
        <Link
          href={`/product/${product.slug || product._id}`}
          className="line-clamp-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          {product.name}
        </Link>

        <Rating value={product.rating} size="sm" showCount count={product.numReviews} />

        <Price
          amount={product.price}
          originalAmount={product.compareAtPrice || product.originalPrice}
          size="md"
        />

        <div className="mt-auto pt-2">
          <AddToCartButton product={product} size="sm" />
        </div>
      </div>
    </div>
  );
}

export { ProductCard };
export type { ProductCardProps };
