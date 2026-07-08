"use client";

import { Skeleton } from "@/components/ui/skeleton";

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
    <div className="flex gap-0">
      {/* Sidebar */}
      <div className="w-28 sm:w-36 lg:w-48 flex-shrink-0 border-r bg-white">
        <div className="sticky top-0 h-[calc(100vh-80px)] overflow-y-auto p-2 sm:p-3">
          <Skeleton className="mb-3 h-3 w-20" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 sm:gap-3 rounded-lg px-1.5 sm:px-2 py-2 sm:py-2.5">
              <Skeleton className="h-9 w-9 sm:h-12 sm:w-12 flex-shrink-0 rounded-lg" />
              <Skeleton className="h-3 w-16 sm:w-20" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
