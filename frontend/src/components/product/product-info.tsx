"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Heart, Share2, ShoppingCart, Zap, Check, Loader2 } from "lucide-react";
import { cn, calculateDiscount, isFoodCategory } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Rating } from "@/components/ui/rating";
import { Price } from "@/components/ui/price";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { Separator } from "@/components/ui/separator";
import { VegNonVeg } from "@/components/ui/veg-non-veg";
import { cartService } from "@/services/cart.service";
import { toast } from "sonner";
import type { Product } from "@/types";

interface ProductInfoProps {
  product: Product;
  className?: string;
}

function ProductInfo({ product, className }: ProductInfoProps) {
  const router = useRouter();
  const [selectedVariant, setSelectedVariant] = React.useState<Record<string, string>>({});
  const [quantity, setQuantity] = React.useState(1);
  const [isWishlisted, setIsWishlisted] = React.useState(false);
  const [showShareMenu, setShowShareMenu] = React.useState(false);
  const [addingToCart, setAddingToCart] = React.useState(false);

  const handleAddToCart = async (buyNow = false) => {
    if (activeStock === 0) {
      toast.error("This product is out of stock");
      return;
    }
    const variantId = selectedVariant["variant"] || product.variants?.[0]?._id;
    try {
      setAddingToCart(true);
      await cartService.addToCart(
        product._id,
        variantId,
        quantity
      );
      if (buyNow) {
        toast.success("Redirecting to checkout...");
        router.push("/cart");
      } else {
        toast.success(
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <Check className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-foreground">Added to cart!</p>
              <p className="text-xs text-muted-foreground line-clamp-1">{product.name}</p>
            </div>
          </div>,
          {
            description: `${quantity} item${quantity > 1 ? "s" : ""} in your cart`,
            action: {
              label: "View Cart",
              onClick: () => router.push("/cart"),
            },
          }
        );
      }
    } catch (err: any) {
      const msg = err.message || "Failed to add to cart";
      if (msg.includes("Unauthorized") || msg.includes("401") || msg.includes("login")) {
        toast.error("Please login to add items to cart", {
          description: "You need to be logged in",
          action: {
            label: "Login",
            onClick: () => router.push("/login"),
          },
        });
        setTimeout(() => router.push("/login"), 1500);
      } else {
        toast.error("Could not add to cart", {
          description: msg,
        });
      }
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleWishlist = () => {
    const newState = !isWishlisted;
    setIsWishlisted(newState);
    if (newState) {
      toast.success(
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 fill-red-500 text-red-500" />
          <span>Added to wishlist</span>
        </div>,
        { description: product.name }
      );
    } else {
      toast.info("Removed from wishlist", { description: product.name });
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied!", { description: "Share this product with others" });
    setShowShareMenu(false);
  };

  const selectedVariantData = selectedVariant["variant"]
    ? product.variants?.find((v) => v._id === selectedVariant["variant"])
    : null;
  const activePrice = selectedVariantData?.price || product.price;
  const activeOriginalPrice = selectedVariantData?.compareAtPrice || product.originalPrice;
  const activeStock = selectedVariantData?.stock ?? product.stock;

  const discount = calculateDiscount(activePrice, activeOriginalPrice);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          url: window.location.href,
        });
      } catch {}
    } else {
      setShowShareMenu(!showShareMenu);
    }
  };

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            {product.brand && (
              <span className="text-sm font-medium text-primary uppercase tracking-wide">
                {product.brand.name}
              </span>
            )}
            <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
              {product.name}
              {selectedVariantData?.name ? (
                <span className="text-lg font-semibold text-muted-foreground"> — {selectedVariantData.name}</span>
              ) : ""}
            </h1>
            {product.isVeg !== null && isFoodCategory(product.category) && (
              <div className="flex items-center gap-2 mt-1">
                <VegNonVeg isVeg={product.isVeg} size="md" />
                <span className={cn(
                  "text-xs font-medium",
                  product.isVeg ? "text-green-600" : "text-[#8B4513]"
                )}>
                  {product.isVeg ? "Veg" : "Non-Veg"}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full shrink-0"
              onClick={handleToggleWishlist}
            >
              <Heart
                className={cn(
                  "h-5 w-5 transition-colors",
                  isWishlisted ? "fill-red-500 text-red-500" : "text-muted-foreground"
                )}
              />
            </Button>
            <div className="relative">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full shrink-0"
                onClick={handleShare}
              >
                <Share2 className="h-5 w-5 text-muted-foreground" />
              </Button>
              {showShareMenu && (
                <div className="absolute right-0 top-full z-10 mt-2 w-40 rounded-lg border bg-white shadow-lg">
                  <button
                    onClick={handleCopyLink}
                    className="flex w-full items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm hover:bg-muted"
                  >
                    Copy Link
                  </button>
                  <button
                    onClick={() => {
                      window.open(
                        `https://wa.me/?text=${encodeURIComponent(`${product.name}\n${window.location.href}`)}`,
                        "_blank"
                      );
                      setShowShareMenu(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-b-lg px-4 py-2.5 text-sm hover:bg-muted"
                  >
                    Share on WhatsApp
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Rating value={product.ratings?.average || 0} showCount count={product.ratings?.count || 0} size="lg" />

      <div className="flex items-baseline gap-3">
        <Price amount={activePrice} originalAmount={activeOriginalPrice} size="lg" />
      </div>

      {product.isDeal && product.dealPrice && (
        <Badge variant="warning" className="w-fit text-sm">
          Deal of the Day
        </Badge>
      )}

      <Separator />

      {/* Variant Selection */}
      {product.variants && product.variants.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Select Variant</p>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((variant) => {
              const isSelected = selectedVariant["variant"] === variant._id;
              return (
                <button
                  key={variant._id}
                  onClick={() =>
                    setSelectedVariant((prev) => ({ ...prev, variant: variant._id }))
                  }
                  className={cn(
                    "rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all",
                    isSelected
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-muted-foreground/50"
                  )}
                >
                  {variant.name}
                  {variant.price && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      ₹{Number(variant.price).toLocaleString("en-IN")}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">Quantity</p>
        <QuantitySelector
          value={quantity}
          onChange={setQuantity}
          max={Math.min(activeStock, 10)}
        />
      </div>

      <div className="flex items-center gap-2">
        {activeStock > 0 ? (
          <>
            <Check className="h-4 w-4 text-emerald-600" />
            <span className="text-sm text-emerald-600 font-medium">In Stock</span>
            {activeStock <= 5 && (
              <Badge variant="outline" className="text-[10px] border-orange-300 text-orange-600 px-1.5 py-0">
                Only few left
              </Badge>
            )}
          </>
        ) : (
          <span className="text-sm text-red-500 font-medium">Out of Stock</span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:flex sm:gap-3">
        <Button
          size="lg"
          className="h-12 w-full bg-indigo-600 font-semibold text-white shadow-sm hover:bg-indigo-700 sm:flex-1"
          disabled={activeStock === 0 || addingToCart}
          onClick={() => handleAddToCart(false)}
        >
          {addingToCart ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <ShoppingCart className="mr-2 h-5 w-5" />
          )}
          {addingToCart ? "Adding..." : "Add to Cart"}
        </Button>
        <Button
          size="lg"
          className="h-12 w-full bg-gradient-to-r from-amber-500 to-orange-500 font-semibold text-white shadow-sm hover:from-amber-600 hover:to-orange-600 sm:flex-1"
          disabled={activeStock === 0 || addingToCart}
          onClick={() => handleAddToCart(true)}
        >
          <Zap className="mr-2 h-5 w-5" />
          Buy Now
        </Button>
      </div>
    </div>
  );
}

export { ProductInfo };
