"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ImageGallery } from "@/components/ui/image-gallery";
import { Separator } from "@/components/ui/separator";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { Button } from "@/components/ui/button";
import { ProductInfo } from "@/components/product/product-info";
import { ProductTabs } from "@/components/product/product-tabs";
import { ReviewSection } from "@/components/product/review-section";
import { RelatedProducts } from "@/components/product/related-products";
import { useProductBySlug, useRelatedProducts } from "@/hooks/use-products";
import type { Product, Review, Specification } from "@/types";

function mapBackendProduct(raw: any): Product {
  const images = (raw.images || []).map((img: any) => img.url || img);
  const firstVariant = raw.variants?.[0];
  const price = firstVariant ? Number(firstVariant.price) : raw.minPrice || 0;
  const originalPrice = firstVariant
    ? Number(firstVariant.compareAtPrice || firstVariant.price)
    : raw.maxPrice || price;
  const totalStock = raw.totalStock ?? raw.variants?.reduce((s: number, v: any) => s + (v.stock || 0), 0) ?? 0;

  const specifications: Specification[] = [];
  if (raw.specifications && Array.isArray(raw.specifications)) {
    raw.specifications.forEach((s: any) => {
      specifications.push({ key: s.key || s.name || "", value: s.value || "" });
    });
  } else if (raw.specifications && typeof raw.specifications === "object") {
    Object.entries(raw.specifications).forEach(([key, value]) => {
      specifications.push({ key, value: String(value) });
    });
  }

  const mappedVariants = (raw.variants || []).map((v: any) => ({
    _id: v.id,
    name: v.name || "",
    sku: v.sku || "",
    price: Number(v.price),
    compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : undefined,
    stock: v.stock || 0,
    attributes: v.attributes || {},
    image: v.image,
  }));

  return {
    _id: raw.id,
    name: raw.name || "",
    slug: raw.slug || "",
    description: raw.description || "",
    shortDescription: raw.shortDescription,
    price,
    originalPrice,
    sku: raw.sku || "",
    stock: totalStock,
    images: images.map((url: string, i: number) => ({
      url,
      alt: raw.name || "",
      isPrimary: i === 0,
    })),
    category: raw.category
      ? { _id: raw.category.id, name: raw.category.name, slug: raw.category.slug, productCount: 0, isActive: true, createdAt: "", updatedAt: "" }
      : { _id: "", name: "", slug: "", productCount: 0, isActive: true, createdAt: "", updatedAt: "" },
    brand: raw.brand
      ? { _id: raw.brand.id, name: raw.brand.name, slug: raw.brand.slug, productCount: 0, isActive: true }
      : { _id: "", name: "", slug: "", productCount: 0, isActive: true },
    variants: mappedVariants,
    tags: raw.tags ? raw.tags.split(",") : [],
    specifications,
    ratings: {
      average: raw.averageRating || 0,
      count: raw.reviewCount || 0,
    },
    isActive: raw.isActive ?? true,
    isFeatured: raw.isFeatured ?? false,
    isTrending: false,
    isBestSeller: false,
    createdAt: raw.createdAt || "",
    updatedAt: raw.updatedAt || "",
  };
}

function mapBackendReview(raw: any): Review {
  return {
    _id: raw.id,
    user: {
      _id: raw.user?.id || "",
      name: raw.user?.name || raw.user?.firstName || "Anonymous",
      email: raw.user?.email || "",
      role: "user",
      isVerified: true,
      addresses: [],
      createdAt: "",
      updatedAt: "",
    },
    product: "",
    rating: raw.rating || 0,
    title: raw.title || "",
    comment: raw.comment || raw.review || "",
    images: raw.images || [],
    isVerifiedPurchase: raw.isVerifiedPurchase ?? false,
    helpfulCount: raw.helpfulCount || raw.helpful || 0,
    isHelpful: false,
    createdAt: raw.createdAt || "",
    updatedAt: raw.updatedAt || "",
  };
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { data: rawProduct, isLoading, error } = useProductBySlug(slug || "");
  const [isStickyBarVisible, setIsStickyBarVisible] = React.useState(false);

  const product = rawProduct ? mapBackendProduct(rawProduct as any) : null;

  const { data: relatedData } = useRelatedProducts(
    (rawProduct as any)?.id || ""
  );
  const relatedProducts = relatedData
    ? (Array.isArray(relatedData) ? relatedData : []).map(mapBackendProduct)
    : [];

  const reviews: Review[] = React.useMemo(() => {
    if (!(rawProduct as any)?.reviews) return [];
    return (rawProduct as any).reviews.map(mapBackendReview);
  }, [rawProduct]);

  const specifications: Record<string, string> = React.useMemo(() => {
    if (!product) return {};
    const spec: Record<string, string> = {};
    product.specifications.forEach((s) => {
      spec[s.key] = s.value;
    });
    return spec;
  }, [product]);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsStickyBarVisible(window.scrollY > 600);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 py-4">
            <div className="h-3 w-8 animate-shimmer rounded bg-muted" />
            <div className="h-3 w-3 animate-shimmer rounded-full bg-muted" />
            <div className="h-3 w-16 animate-shimmer rounded bg-muted" />
            <div className="h-3 w-3 animate-shimmer rounded-full bg-muted" />
            <div className="h-3 w-32 animate-shimmer rounded bg-muted" />
          </div>
          <div className="grid gap-8 pb-12 lg:grid-cols-[1fr_1fr]">
            <div>
              <div className="aspect-square w-full animate-shimmer rounded-xl bg-muted" />
              <div className="mt-4 flex gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 w-16 animate-shimmer rounded-lg bg-muted" />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-4 w-20 animate-shimmer rounded bg-muted" />
              <div className="h-8 w-3/4 animate-shimmer rounded bg-muted" />
              <div className="h-6 w-32 animate-shimmer rounded bg-muted" />
              <div className="h-10 w-40 animate-shimmer rounded bg-muted" />
              <div className="h-px w-full animate-shimmer bg-muted" />
              <div className="h-4 w-24 animate-shimmer rounded bg-muted" />
              <div className="flex gap-2">
                <div className="h-10 w-24 animate-shimmer rounded-lg bg-muted" />
                <div className="h-10 w-24 animate-shimmer rounded-lg bg-muted" />
              </div>
              <div className="flex gap-3">
                <div className="h-12 flex-1 animate-shimmer rounded-md bg-muted" />
                <div className="h-12 flex-1 animate-shimmer rounded-md bg-muted" />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-6">
            {error ? "Something went wrong loading this product." : "The product you're looking for doesn't exist."}
          </p>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </main>
    );
  }

  const imageUrls = product.images.map((img) => img.url);
  const averageRating = (rawProduct as any)?.averageRating || product.ratings.average;
  const totalReviews = (rawProduct as any)?.reviewCount || product.ratings.count;

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: product.category.name, href: `/category/${product.category.slug}` },
            { label: product.name },
          ]}
          className="py-4"
        />

        <div className="grid gap-8 pb-12 lg:grid-cols-[1fr_1fr]">
          <div className="lg:sticky lg:top-20 lg:self-start">
            <ImageGallery images={imageUrls} alt={product.name} />
          </div>
          <ProductInfo product={product} />
        </div>

        <Separator />

        <div className="py-8">
          <ProductTabs
            description={product.description}
            specifications={specifications}
            faqs={(rawProduct as any)?.faqs || []}
            reviews={reviews}
            averageRating={averageRating}
            totalReviews={totalReviews}
          />
        </div>

        <Separator />

        <div className="py-8">
          <ReviewSection
            reviews={reviews}
            averageRating={averageRating}
            totalReviews={totalReviews}
          />
        </div>

        {relatedProducts.length > 0 && (
          <>
            <Separator />
            <div className="py-8">
              <RelatedProducts products={relatedProducts} title="Related Products" />
            </div>
          </>
        )}
      </div>

      {isStickyBarVisible && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white shadow-lg lg:hidden animate-slide-up">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">
                ₹{product.price.toLocaleString("en-IN")}
              </p>
              {product.originalPrice > product.price && (
                <p className="text-xs text-muted-foreground line-through">
                  ₹{product.originalPrice.toLocaleString("en-IN")}
                </p>
              )}
            </div>
            <div className="flex-1">
              <AddToCartButton product={product} size="md" />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
