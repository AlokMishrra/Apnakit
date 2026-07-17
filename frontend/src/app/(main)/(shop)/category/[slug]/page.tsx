"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  SlidersHorizontal,
  X,
  Star,
  ChevronRight,
  AlertCircle,
  PackageOpen,
  RefreshCw,
  Home,
} from "lucide-react";
import { cn, getImageUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import api from "@/services/api";
import { CategoryPageSkeleton } from "@/components/skeletons/category-skeleton";
import type { Product as ProductType } from "@/types";

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price?: number;
  originalPrice?: number;
  minPrice?: number;
  maxPrice?: number;
  images: any[];
  rating?: number;
  averageRating?: number;
  numReviews?: number;
  reviewCount?: number;
  countInStock?: number;
  totalStock?: number;
  brand?: { name: string; slug?: string };
  category?: { name: string; slug: string };
  variants?: any[];
  createdAt?: string;
}

interface SubCategory {
  id: string;
  name: string;
  slug: string;
  image?: string;
  _count?: { products: number };
}

interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
  isComingSoon?: boolean;
  children?: SubCategory[];
}

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "newest", label: "Newest First" },
  { value: "rating", label: "Rating" },
];

function formatCategoryName(slug: string) {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function CategoryPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "";

  const [products, setProducts] = React.useState<Product[]>([]);
  const [category, setCategory] = React.useState<CategoryInfo | null>(null);
  const [parentCategory, setParentCategory] = React.useState<CategoryInfo | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [sortBy, setSortBy] = React.useState("relevance");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = React.useState(false);
  const [minPrice, setMinPrice] = React.useState("0");
  const [maxPrice, setMaxPrice] = React.useState("60000");
  const [ratingFilter, setRatingFilter] = React.useState<number | null>(null);
  const [totalPages, setTotalPages] = React.useState(1);
  const itemsPerPage = 12;
  const productsTopRef = React.useRef<HTMLDivElement>(null);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (productsTopRef.current) {
      const top = productsTopRef.current.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  const fetchData = React.useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      let catInfo: CategoryInfo | null = null;
      let parent: CategoryInfo | null = null;
      try {
        const catRes = await api.get(`/categories/${slug}`);
        const catData = catRes?.data?.data || catRes?.data;
        if (catData && catData.id) {
          catInfo = catData;
          if (catData.parentId) {
            try {
              const parentRes = await api.get(`/categories/${catData.parent.slug || ""}`);
              const parentData = parentRes?.data?.data || parentRes?.data;
              if (parentData && parentData.id) parent = parentData;
            } catch {}
          }
        }
      } catch {}
      setCategory(catInfo);
      setParentCategory(parent);

      const res = await api.get("/products", {
        params: { category: slug, limit: 100 },
      });
      const body = res?.data;
      let arr: Product[] = [];
      if (Array.isArray(body?.data)) arr = body.data;
      else if (Array.isArray(body)) arr = body;
      setProducts(arr);
      setTotalPages(Math.max(1, Math.ceil(arr.length / itemsPerPage)));
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to load category";
      setError(msg);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const displayName = category?.name || formatCategoryName(slug);
  const subCategories = category?.children || [];
  const activeSlug = slug;

  const filteredProducts = React.useMemo(() => {
    let result = [...products];
    if (ratingFilter !== null) {
      result = result.filter(
        (p) => (p.rating || p.averageRating || 0) >= ratingFilter
      );
    }
    result = result.filter((p) => {
      const price = p.minPrice || p.price || 0;
      return (
        price >= parseInt(minPrice || "0") &&
        price <= parseInt(maxPrice || "60000")
      );
    });
    switch (sortBy) {
      case "price-low":
        result.sort(
          (a, b) => (a.minPrice || a.price || 0) - (b.minPrice || b.price || 0)
        );
        break;
      case "price-high":
        result.sort(
          (a, b) => (b.minPrice || b.price || 0) - (a.minPrice || a.price || 0)
        );
        break;
      case "rating":
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        );
        break;
    }
    result.sort((a, b) => {
      const aStock = a.countInStock ?? a.totalStock ?? (a.variants || []).reduce((s: number, v: any) => s + (v.stock || 0), 0) ?? 0;
      const bStock = b.countInStock ?? b.totalStock ?? (b.variants || []).reduce((s: number, v: any) => s + (v.stock || 0), 0) ?? 0;
      const aInStock = aStock > 0;
      const bInStock = bStock > 0;
      if (aInStock && !bInStock) return -1;
      if (!aInStock && bInStock) return 1;
      return 0;
    });
    return result;
  }, [products, sortBy, ratingFilter, minPrice, maxPrice]);

  const paginatedProducts = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const clearAllFilters = () => {
    setRatingFilter(null);
    setMinPrice("0");
    setMaxPrice("60000");
    handlePageChange(1);
  };

  const FilterSidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={cn("space-y-6", mobile ? "p-4" : "")}>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Price Range</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <span className="text-muted-foreground">to</span>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={() => handlePageChange(1)}>
          Apply
        </Button>
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Customer Rating</h3>
        {[4, 3, 2, 1].map((rating) => (
          <button
            key={rating}
            onClick={() => setRatingFilter(ratingFilter === rating ? null : rating)}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
              ratingFilter === rating ? "bg-primary/10 text-primary" : "hover:bg-muted"
            )}
          >
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-3.5 w-3.5",
                    i < rating
                      ? "fill-amber-400 text-amber-400"
                      : "fill-muted text-muted-foreground"
                  )}
                />
              ))}
            </div>
            <span>& up</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4 flex-wrap">
          <Link href="/" className="hover:text-foreground inline-flex items-center gap-1">
            <Home className="h-3.5 w-3.5" /> Home
          </Link>
          {parentCategory && (
            <>
              <ChevronRight className="h-3 w-3" />
              <Link href={`/category/${parentCategory.slug}`} className="hover:text-foreground">
                {parentCategory.name}
              </Link>
            </>
          )}
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">{displayName}</span>
        </nav>

        {category?.isComingSoon && (
          <div className="mb-6 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 p-6 text-center">
            <p className="text-lg font-bold text-emerald-700">Coming Soon</p>
            <p className="mt-1 text-sm text-emerald-600">This category is coming soon. Stay tuned!</p>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="mb-6 flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8 text-center">
            <AlertCircle className="mb-3 h-12 w-12 text-red-500" />
            <h3 className="text-lg font-semibold text-red-900">Failed to load category</h3>
            <p className="mt-1 text-sm text-red-700 max-w-md">{error}. Please try again.</p>
            <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={fetchData}>
              <RefreshCw className="h-4 w-4" /> Try again
            </Button>
          </div>
        )}

        {loading ? (
          <CategoryPageSkeleton />
        ) : !error && filteredProducts.length === 0 && subCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <PackageOpen className="mb-4 h-16 w-16 text-muted-foreground/50" />
            <h3 className="text-lg font-bold text-foreground">
              No products found in {displayName}
            </h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              We couldn&apos;t find any products in this category right now. Check back later or
              explore other categories.
            </p>
            <div className="mt-6 flex gap-3">
              <Button asChild>
                <Link href="/">Browse all products</Link>
              </Button>
              {parentCategory && (
                <Button variant="outline" asChild>
                  <Link href={`/category/${parentCategory.slug}`}>
                    Back to {parentCategory.name}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        ) : !error ? (
          <div className="flex gap-0">
            {/* Left Sidebar - Subcategories */}
            {subCategories.length > 0 && (
              <div className="w-20 sm:w-24 lg:w-28 flex-shrink-0 border-r bg-white">
                <div className="sticky top-0 h-[calc(100vh-80px)] overflow-y-auto">
                  <div className="p-2 sm:p-3">
                    <h2 className="mb-2 px-1 sm:px-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {displayName}
                    </h2>
                    <div className="space-y-0.5">
                      {subCategories.map((sub) => {
                        const isActive = sub.slug === activeSlug;
                        return (
                        <Link
                          key={sub.id}
                          href={`/category/${sub.slug}`}
                          className={cn(
                            "group flex flex-col items-center gap-1 rounded-md p-1 transition-colors",
                            isActive
                              ? "bg-indigo-50 border border-indigo-600"
                              : "hover:bg-gray-50"
                          )}
                        >
                          <div className={cn(
                            "h-14 w-14 sm:h-16 sm:w-16 overflow-hidden rounded-lg",
                            isActive ? "ring-1 ring-indigo-600" : "bg-gray-100"
                          )}>
                            {sub.image ? (
                              <img
                                src={sub.image}
                                alt={sub.name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/images/placeholder.svg";
                                }}
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-sm text-muted-foreground/40">
                                📂
                              </div>
                            )}
                          </div>
                          <span className={cn(
                            "text-[9px] sm:text-[10px] font-medium text-center line-clamp-2 w-full leading-tight",
                            isActive
                              ? "text-indigo-700"
                              : "text-foreground group-hover:text-indigo-600"
                          )}>
                            {sub.name}
                          </span>
                        </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Toolbar */}
              <div className="bg-white border-b px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="lg:hidden">
                        <SlidersHorizontal className="mr-2 h-4 w-4" />
                        Filters
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left">
                      <SheetHeader>
                        <SheetTitle>Filters</SheetTitle>
                      </SheetHeader>
                      <FilterSidebar mobile />
                    </SheetContent>
                  </Sheet>
                  <span className="text-sm text-muted-foreground">
                    {filteredProducts.length} products
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Active Filters */}
              {(ratingFilter !== null ||
                parseInt(minPrice) > 0 ||
                parseInt(maxPrice) < 60000) && (
                <div className="bg-white border-b px-4 py-2 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  {ratingFilter !== null && (
                    <Badge variant="secondary" className="gap-1">
                      {ratingFilter}+ Stars
                      <button onClick={() => setRatingFilter(null)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {(parseInt(minPrice) > 0 || parseInt(maxPrice) < 60000) && (
                    <Badge variant="secondary" className="gap-1">
                      ₹{minPrice} - ₹{maxPrice}
                      <button
                        onClick={() => {
                          setMinPrice("0");
                          setMaxPrice("60000");
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-xs">
                    Clear all
                  </Button>
                </div>
              )}

              {/* Products Grid */}
              <div ref={productsTopRef} className="p-4">
                {filteredProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <PackageOpen className="mb-4 h-16 w-16 text-muted-foreground/50" />
                    <h3 className="text-lg font-bold text-foreground">
                      No products found in {displayName}
                    </h3>
                    <p className="mt-2 max-w-md text-sm text-muted-foreground">
                      We couldn&apos;t find any products in this category right now.
                    </p>
                    <div className="mt-6 flex gap-3">
                      <Button asChild>
                        <Link href="/">Browse all products</Link>
                      </Button>
                      {parentCategory && (
                        <Button variant="outline" asChild>
                          <Link href={`/category/${parentCategory.slug}`}>
                            Back to {parentCategory.name}
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                    {paginatedProducts.map((product) => {
                      const img = product.images?.[0];
                      const price =
                        product.variants?.[0]?.price || product.minPrice || product.price || 0;
                      const originalPrice =
                        product.variants?.[0]?.compareAtPrice ||
                        product.maxPrice ||
                        product.originalPrice;
                      const discount =
                        originalPrice && originalPrice > price
                          ? Math.round(((originalPrice - price) / originalPrice) * 100)
                          : 0;
                      const rating = product.rating || product.averageRating || 0;
                      const productForCart: ProductType = {
                        _id: product.id,
                        name: product.name,
                        slug: product.slug,
                        description: product.description || "",
                        price: Number(price) || 0,
                        originalPrice: Number(originalPrice) || 0,
                        sku: "",
                        stock: product.totalStock ?? product.countInStock ?? 99,
                        images: img
                          ? [{ url: typeof img === "string" ? img : img.url, alt: product.name, isPrimary: true }]
                          : [],
                        category: {
                          _id: "",
                          name: product.category?.name || "",
                          slug: product.category?.slug || "",
                          productCount: 0,
                          isActive: true,
                          createdAt: "",
                          updatedAt: "",
                        },
                        brand: {
                          _id: "",
                          name: product.brand?.name || "",
                          slug: product.brand?.slug || "",
                          productCount: 0,
                          isActive: true,
                        },
                        variants: (product.variants || []).map((v: any) => ({
                          _id: v.id || v._id,
                          name: v.name || "",
                          sku: v.sku || "",
                          price: Number(v.price ?? price),
                          compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : undefined,
                          stock: v.stock ?? product.totalStock ?? 99,
                          attributes: v.attributes || {},
                        })),
                        tags: [],
                        specifications: [],
                        ratings: {
                          average: rating,
                          count: product.numReviews ?? product.reviewCount ?? 0,
                        },
                        isActive: true,
                        isFeatured: false,
                        isVeg: product.isVeg ?? null,
                        isTrending: false,
                        isBestSeller: false,
                        createdAt: product.createdAt || "",
                        updatedAt: product.createdAt || "",
                      } as ProductType;
                      const unit = product.variants?.[0]?.name || (totalStock > 0 ? `${product.variants?.[0]?.stock || 1} pcs` : "1 pc");
                      return (
                        <div
                          key={product.id}
                          className="group flex flex-col rounded-xl border bg-white p-3 shadow-sm transition-all hover:shadow-md"
                        >
                          <Link href={`/product/${product.slug}`} className="block flex-1">
                            <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-50">
                              {img ? (
                                <img
                                  src={getImageUrl(typeof img === "string" ? img : img.url)}
                                  alt={product.name}
                                  className="h-full w-full object-contain p-2 transition-transform group-hover:scale-105"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "/images/placeholder.svg";
                                  }}
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-muted-foreground text-3xl">
                                  📦
                                </div>
                              )}
                              {discount > 0 && (
                                <Badge
                                  variant="destructive"
                                  className="absolute left-0 top-0 rounded-none rounded-br-lg px-2 py-1 text-[10px] font-bold text-white"
                                >
                                  {discount}% OFF
                                </Badge>
                              )}
                            </div>
                            <div className="mt-2 flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-gray-700">
                              <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-400 text-white text-[8px]">⚡</span>
                              <span>18 MINS</span>
                            </div>
                            <h3 className="mt-1.5 text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2 leading-snug group-hover:text-indigo-600">
                              {product.name}
                            </h3>
                            <p className="mt-0.5 text-[10px] sm:text-xs text-gray-500">
                              {unit}
                            </p>
                            <div className="mt-1.5 flex items-baseline gap-1.5">
                              <span className="text-sm sm:text-base font-bold text-gray-900">
                                ₹{Number(price).toLocaleString("en-IN")}
                              </span>
                              {discount > 0 && originalPrice ? (
                                <span className="text-[10px] sm:text-xs text-muted-foreground line-through">
                                  ₹{Number(originalPrice).toLocaleString("en-IN")}
                                </span>
                              ) : null}
                            </div>
                          </Link>
                          <div className="mt-2 pt-1">
                            <AddToCartButton product={productForCart} size="sm" label="ADD" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
