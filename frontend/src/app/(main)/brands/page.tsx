import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { Store } from "lucide-react";

export const metadata: Metadata = {
  title: "All Brands",
  description:
    "Explore top brands across electronics, fashion, home & kitchen. Shop your favorite brands at ApnaKit.",
};

interface Brand {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  productCount: number;
}

const BRANDS: Brand[] = [
  { _id: "1", name: "Samsung", slug: "samsung", productCount: 45 },
  { _id: "2", name: "Apple", slug: "apple", productCount: 32 },
  { _id: "3", name: "Xiaomi", slug: "xiaomi", productCount: 28 },
  { _id: "4", name: "OnePlus", slug: "oneplus", productCount: 15 },
  { _id: "5", name: "Sony", slug: "sony", productCount: 38 },
  { _id: "6", name: "LG", slug: "lg", productCount: 22 },
  { _id: "7", name: "Nike", slug: "nike", productCount: 55 },
  { _id: "8", name: "Adidas", slug: "adidas", productCount: 48 },
  { _id: "9", name: "Puma", slug: "puma", productCount: 35 },
  { _id: "10", name: "H&M", slug: "hm", productCount: 62 },
  { _id: "11", name: "Zara", slug: "zara", productCount: 40 },
  { _id: "12", name: "Levi's", slug: "levis", productCount: 30 },
  { _id: "13", name: "Prestige", slug: "prestige", productCount: 25 },
  { _id: "14", name: "Philips", slug: "philips", productCount: 42 },
  { _id: "15", name: "Bajaj", slug: "bajaj", productCount: 28 },
  { _id: "16", name: "Havells", slug: "havells", productCount: 20 },
  { _id: "17", name: "L'Oréal", slug: "loreal", productCount: 35 },
  { _id: "18", name: "Nivea", slug: "nivea", productCount: 22 },
  { _id: "19", name: "Maybelline", slug: "maybelline", productCount: 18 },
  { _id: "20", name: "Penguin", slug: "penguin", productCount: 120 },
  { _id: "21", name: "HarperCollins", slug: "harpercollins", productCount: 95 },
];

function BrandsContent() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">All Brands</h1>
        <p className="mt-1 text-muted-foreground">
          Browse {BRANDS.length}+ brands across all categories
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {BRANDS.map((brand) => (
          <Link
            key={brand._id}
            href={`/brands/${brand.slug}`}
            className="group flex flex-col items-center rounded-xl border bg-card p-6 text-center shadow-sm transition-all hover:border-primary hover:shadow-md"
          >
            <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-primary/10">
              <Store className="h-8 w-8 text-muted-foreground transition-colors group-hover:text-primary" />
            </div>
            <h3 className="font-semibold transition-colors group-hover:text-primary">
              {brand.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {brand.productCount} products
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function BrandsPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-muted animate-pulse" />}
    >
      <BrandsContent />
    </Suspense>
  );
}
