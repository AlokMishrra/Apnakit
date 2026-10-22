import { Suspense } from "react";
import { CategoryGrid } from "@/components/home/category-grid";
import { HeroBanner } from "@/components/home/hero-banner";
import { FlashSale } from "@/components/home/flash-sale";
import { CategoryWiseProducts } from "@/components/home/category-wise-products";
import { HomeSectionSwitch } from "@/components/home/home-section-switch";
import { RecentlyViewed } from "@/components/home/recently-viewed";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "ApnaKit - Your One-Stop Online Shopping Destination",
  description:
    "Discover amazing deals on electronics, fashion, home & kitchen essentials. Shop now with free delivery on orders above ₹999.",
};

function CategorySkeleton() {
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

function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-white p-3 shadow-sm">
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
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="flex flex-col gap-0">
      {/* The hero banner sits above the fold. The Quick / Shop All switch
          lives in the header and in the mobile top bar, and drives the
          section content below. */}
      <div className="mx-auto w-full max-w-7xl px-4 pt-3 sm:px-6 lg:px-8">
        <HeroBanner />
      </div>

      {/* The category grid and the selected section both hang off the
          shared Quick / Shop All selection. */}
      <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 sm:pt-5 lg:px-8">
        <HomeSectionSwitch>
          <Suspense fallback={<CategorySkeleton />}>
            <CategoryGrid />
          </Suspense>
        </HomeSectionSwitch>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<ProductGridSkeleton count={4} />}>
          <FlashSale />
        </Suspense>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 mt-10">
        <Suspense fallback={<ProductGridSkeleton count={4} />}>
          <CategoryWiseProducts />
        </Suspense>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 mt-10">
        <RecentlyViewed />
      </div>
    </main>
  );
}
