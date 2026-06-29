"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X, TrendingUp, Loader2, Search as SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CATEGORIES } from "@/constants";
import { productService } from "@/services/product.service";
import { getImageUrl } from "@/lib/utils";

interface SearchBarProps {
  compact?: boolean;
  className?: string;
  onSearch?: (query: string) => void;
  initialQuery?: string;
}

const POPULAR_SEARCHES = [
  "Wireless Earbuds",
  "Running Shoes",
  "Laptop Stand",
  "Coffee Maker",
  "Yoga Mat",
  "Winter Jacket",
];

interface Suggestion {
  id: string;
  name: string;
  slug: string;
  type: "product" | "category";
  image?: string;
  price?: number;
  brand?: string;
}

function SearchBar({ compact = false, className, onSearch, initialQuery = "" }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState(initialQuery);
  const [isOpen, setIsOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [productResults, setProductResults] = React.useState<Suggestion[]>([]);
  const [categoryResults, setCategoryResults] = React.useState<Suggestion[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced fetch from the suggestions endpoint
  React.useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setProductResults([]);
      setCategoryResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await productService.searchProducts(q, 1, 6);
        const payload = (res as any)?.data ?? res;
        const products: Suggestion[] = (payload?.products || []).map((p: any) => {
          const variant = p.variants?.[0];
          const img = p.images?.[0]?.url;
          return {
            id: p.id,
            name: p.name,
            slug: p.slug,
            type: "product",
            image: img ? getImageUrl(img) : undefined,
            price: variant?.price ? Number(variant.price) : undefined,
            brand: p.brand?.name,
          };
        });
        setProductResults(products);
        const cats: Suggestion[] = (payload?.categories || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          type: "category",
          image: c.image ? getImageUrl(c.image) : undefined,
        }));
        setCategoryResults(cats);
      } catch {
        setProductResults([]);
        setCategoryResults([]);
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setIsOpen(false);
    if (onSearch) {
      onSearch(searchQuery.trim());
    } else {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleClear = () => {
    setQuery("");
    setProductResults([]);
    setCategoryResults([]);
    inputRef.current?.focus();
  };

  const showEmptyState = query.trim().length === 0;
  const showResultsState = query.trim().length >= 2;
  const hasResults = productResults.length > 0 || categoryResults.length > 0;

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <form onSubmit={handleSubmit}>
        <div className="relative flex items-center">
          <Search
            className={cn(
              "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground",
              compact ? "left-3 h-4 w-4" : "left-4 h-5 w-5"
            )}
          />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder="Search for products, brands, and more..."
            className={cn(
              "w-full rounded-full border-2 border-input bg-gray-50 pl-10 text-sm transition-all",
              "hover:border-primary/40",
              "focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:outline-none",
              "focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-100",
              compact ? "h-10 pr-20" : "h-12 pr-24"
            )}
          />
          <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <Button
              type="submit"
              size="sm"
              className={cn(
                "h-9 gap-1.5 rounded-full bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700",
                compact && "h-8 px-3"
              )}
            >
              <SearchIcon className="h-4 w-4" />
              <span>Go</span>
            </Button>
          </div>
        </div>
      </form>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <ScrollArea className="max-h-[70vh]">
            {showEmptyState && (
              <>
                {/* Popular Searches */}
                <div className="px-5 pb-4 pt-5">
                  <p className="mb-3 text-sm font-semibold text-foreground">
                    Popular Searches
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_SEARCHES.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => handleSearch(term)}
                        className="group flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-sm font-medium text-foreground transition-all hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700"
                      >
                        <TrendingUp className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-indigo-600" />
                        <span>{term}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gray-100" />

                {/* Browse Categories */}
                <div className="px-5 pb-5 pt-4">
                  <p className="mb-2 text-sm font-semibold text-foreground">
                    Browse Categories
                  </p>
                  <div className="grid grid-cols-2 gap-x-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.slug}
                        type="button"
                        onClick={() => {
                          router.push(`/category/${cat.slug}`);
                          setIsOpen(false);
                        }}
                        className="group flex items-center justify-between rounded-md px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-gray-50 hover:text-indigo-700"
                      >
                        <span className="truncate">{cat.name}</span>
                        <span className="text-base text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-indigo-600">
                          →
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {showResultsState && (
              <>
                {/* Loading state */}
                {loading && (
                  <div className="flex items-center gap-2 px-5 py-8 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Searching for &quot;{query}&quot;…</span>
                  </div>
                )}

                {/* Results */}
                {!loading && (
                  <>
                    {categoryResults.length > 0 && (
                      <div className="border-b border-gray-100 px-5 py-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Categories
                        </p>
                        <div className="grid grid-cols-2 gap-1">
                          {categoryResults.map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                router.push(`/category/${cat.slug}`);
                                setIsOpen(false);
                              }}
                              className="group flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-gray-50 hover:text-indigo-700"
                            >
                              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded bg-indigo-100 text-xs font-bold text-indigo-600">
                                {cat.name.charAt(0)}
                              </span>
                              <span className="truncate">{cat.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {productResults.length > 0 && (
                      <div className="px-5 py-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Products
                        </p>
                        <ul className="space-y-1">
                          {productResults.map((p) => (
                            <li key={p.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  router.push(`/product/${p.slug}`);
                                  setIsOpen(false);
                                }}
                                className="group flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-gray-50"
                              >
                                <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                                  {p.image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={p.image}
                                      alt={p.name}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <SearchIcon className="h-5 w-5 text-muted-foreground" />
                                  )}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-medium text-foreground group-hover:text-indigo-700">
                                    {p.name}
                                  </span>
                                  <span className="block truncate text-xs text-muted-foreground">
                                    {p.brand ? `${p.brand} · ` : ""}
                                    {p.price
                                      ? `₹${p.price.toLocaleString("en-IN")}`
                                      : "View details"}
                                  </span>
                                </span>
                                <span className="text-base text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-indigo-600">
                                  →
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* View all results */}
                    {hasResults && (
                      <div className="border-t border-gray-100 px-5 py-3">
                        <button
                          type="button"
                          onClick={() => handleSearch(query)}
                          className="flex w-full items-center justify-center gap-2 rounded-md bg-indigo-50 py-2.5 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
                        >
                          View all results for &quot;{query}&quot;
                          <span>→</span>
                        </button>
                      </div>
                    )}

                    {!hasResults && (
                      <div className="px-5 py-10 text-center">
                        <p className="text-sm font-medium text-foreground">
                          No results for &quot;{query}&quot;
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Try a different search term or browse a category.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

export { SearchBar };
