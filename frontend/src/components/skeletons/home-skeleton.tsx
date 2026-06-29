"use client";

import { Skeleton } from "@/components/ui/skeleton";

function HeroSkeleton() {
  return (
    <div className="relative h-[200px] w-full overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 sm:h-[320px] md:h-[400px]">
      <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-12">
        <Skeleton className="h-6 w-48 bg-white/30" />
        <Skeleton className="mt-3 h-10 w-64 bg-white/30 sm:h-12 sm:w-80" />
        <Skeleton className="mt-2 h-4 w-40 bg-white/30" />
        <Skeleton className="mt-5 h-10 w-32 rounded-md bg-white/30" />
      </div>
    </div>
  );
}

function CategoryGridSkeleton() {
  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-shrink-0 flex-col items-center gap-2">
            <Skeleton variant="circular" className="h-16 w-16 sm:h-20 sm:w-20" />
            <Skeleton className="h-3 w-16" />
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
        <Skeleton className="h-4 w-1/2" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  );
}

function ProductSectionSkeleton({ title, count = 4 }: { title?: string; count?: number }) {
  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: count }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function HomePageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <HeroSkeleton />
        <CategoryGridSkeleton />
        <ProductSectionSkeleton count={4} />
        <ProductSectionSkeleton count={4} />
      </div>
    </div>
  );
}
