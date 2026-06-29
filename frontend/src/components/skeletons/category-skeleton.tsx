"use client";

import { Skeleton } from "@/components/ui/skeleton";

function FilterSidebarSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-9 w-full" />
        </div>
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((__, j) => (
                <Skeleton key={j} variant="circular" className="h-3.5 w-3.5" />
              ))}
            </div>
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="rounded-xl border bg-white p-3 shadow-sm">
      <Skeleton variant="rounded" className="aspect-square w-full" />
      <div className="mt-3 space-y-2">
        <Skeleton className="h-3 w-3/4" />
        <div className="flex items-baseline gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
        <div className="flex items-center gap-1">
          <Skeleton variant="circular" className="h-3 w-3" />
          <Skeleton className="h-3 w-6" />
        </div>
      </div>
    </div>
  );
}

export function CategoryPageSkeleton() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Breadcrumb */}
        <div className="mb-4 flex items-center gap-1 sm:mb-6">
          <Skeleton className="h-4 w-10" />
          <Skeleton variant="circular" className="h-3 w-3" />
          <Skeleton className="h-4 w-24" />
        </div>
        {/* Title */}
        <Skeleton className="mb-4 h-8 w-48 sm:mb-8" />
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="hidden w-60 flex-shrink-0 lg:block">
            <FilterSidebarSkeleton />
          </div>
          {/* Products */}
          <div className="flex-1">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-20 sm:hidden" />
                <Skeleton variant="rounded" className="hidden h-8 w-8 lg:block" />
                <Skeleton variant="rounded" className="hidden h-8 w-8 lg:block" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="hidden h-4 w-24 sm:block" />
                <Skeleton className="h-9 w-32" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
