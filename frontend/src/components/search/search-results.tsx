"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  X,
  Clock,
  ArrowRight,
  PackageOpen,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/ui/product-card";
import api from "@/services/api";
import type { Product } from "@/types";

const RECENT_SEARCHES_KEY = "apnakit:recent-searches";

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
  } catch {
    return [];
  }
}

interface SearchResultsProps {
  className?: string;
}

function SearchBar({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [value, setValue] = React.useState(initialQuery);

  React.useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    try {
      const searches = getRecentSearches().filter((s) => s !== q);
      searches.unshift(q);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches.slice(0, 8)));
    } catch {}
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const onClear = () => {
    setValue("");
    router.push("/search");
  };

  return (
    <form
      onSubmit={onSubmit}
      className="flex w-full items-center gap-2 rounded-xl border border-border bg-white p-2 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10"
    >
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          name="q"
          autoComplete="off"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search for products, brands and categories..."
          className="h-11 w-full border-0 pl-10 pr-10 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 sm:text-base"
        />
        {value && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <Button type="submit" size="lg" className="h-11 px-5 sm:px-7" disabled={!value.trim()}>
        <Search className="mr-2 h-4 w-4 sm:hidden" />
        <span className="hidden sm:inline">Search</span>
        <span className="sm:hidden">Go</span>
      </Button>
    </form>
  );
}

function SearchResults({ className }: SearchResultsProps) {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") || "";
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [total, setTotal] = React.useState(0);
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);

  React.useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  React.useEffect(() => {
    if (!urlQuery) {
      setProducts([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    api
      .get(`/search?q=${encodeURIComponent(urlQuery)}&limit=20`)
      .then((res: any) => {
        const payload = res?.data?.data ?? res?.data ?? res;
        const products = payload?.products || [];
        const transformed = products.map((p: any) => ({
          ...p,
          _id: p.id,
          price: p.variants?.[0]?.price ?? p.minPrice ?? 0,
          originalPrice: p.variants?.[0]?.compareAtPrice,
          stock: p.totalStock ?? p.variants?.reduce((s: number, v: any) => s + (v.stock || 0), 0) ?? 0,
          images: p.images || [],
          rating: p.averageRating || 0,
          numReviews: p.reviewCount || 0,
        }));
        setProducts(Array.isArray(transformed) ? transformed : []);
        setTotal(payload?.pagination?.total || products.length || 0);
      })
      .catch(() => {
        setProducts([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [urlQuery]);

  return (
    <div className={cn("space-y-6", className)}>
      <SearchBar initialQuery={urlQuery} />

      {urlQuery ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Results for <span className="font-medium text-foreground">&quot;{urlQuery}&quot;</span>
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{total}</span> products found
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-lg border bg-white p-4">
                  <div className="mb-3 aspect-square rounded-lg bg-muted" />
                  <div className="space-y-2">
                    <div className="h-3 w-16 rounded bg-muted" />
                    <div className="h-4 w-full rounded bg-muted" />
                    <div className="h-4 w-3/4 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <PackageOpen className="mb-4 h-16 w-16 text-muted-foreground/50" />
              <h3 className="text-lg font-bold text-foreground">No results found</h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                We couldn&apos;t find any products matching &quot;{urlQuery}&quot;. Try a different keyword.
              </p>
              {recentSearches.length > 0 && (
                <div className="mt-6">
                  <p className="mb-3 text-sm font-medium text-muted-foreground">Recent Searches</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {recentSearches.slice(0, 6).map((term) => (
                      <a
                        key={term}
                        href={`/search?q=${encodeURIComponent(term)}`}
                        className="flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors hover:bg-primary/10 hover:text-primary"
                      >
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        {term}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="mb-4 h-16 w-16 text-muted-foreground/50" />
          <h3 className="text-lg font-bold text-foreground">Search for products</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Find the best deals on electronics, fashion, home essentials, and more.
          </p>
          {recentSearches.length > 0 && (
            <div className="mt-6 w-full max-w-2xl">
              <p className="mb-3 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
                <Clock className="h-4 w-4" /> Recent Searches
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {recentSearches.map((term) => (
                  <a
                    key={term}
                    href={`/search?q=${encodeURIComponent(term)}`}
                    className="flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    {term}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { SearchResults };
