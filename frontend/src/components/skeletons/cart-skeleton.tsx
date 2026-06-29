"use client";

import { Skeleton } from "@/components/ui/skeleton";

function CartItemSkeleton() {
  return (
    <div className="rounded-lg border bg-white p-4 sm:p-6">
      <div className="flex gap-4">
        <Skeleton variant="rounded" className="h-24 w-24 flex-shrink-0 sm:h-32 sm:w-32" />
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton variant="circular" className="h-8 w-8 flex-shrink-0" />
          </div>
          <div className="mt-auto flex items-end justify-between pt-3">
            <div className="space-y-1">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton variant="rounded" className="h-8 w-8" />
              <Skeleton className="h-4 w-8" />
              <Skeleton variant="rounded" className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartSummarySkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white p-4 space-y-3">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-16" />
        </div>
      </div>
      <div className="rounded-lg border bg-white p-4 space-y-3">
        <Skeleton className="h-5 w-36" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
        <Skeleton className="h-px w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-11 w-full rounded-md" />
      </div>
    </div>
  );
}

export function CartPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="mb-6 h-16 w-full rounded-lg" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <CartItemSkeleton key={i} />
            ))}
          </div>
          <div className="lg:col-span-1">
            <CartSummarySkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}
