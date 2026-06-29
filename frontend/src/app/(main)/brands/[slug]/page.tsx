import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Store, Filter, ChevronDown } from "lucide-react";
import { ProductCard } from "@/components/ui/product-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface BrandPageProps {
  params: Promise<{ slug: string }>;
}

const BRANDS: Record<
  string,
  {
    name: string;
    slug: string;
    description: string;
    logo: string;
    productCount: number;
    website: string;
  }
> = {
  samsung: {
    name: "Samsung",
    slug: "samsung",
    description:
      "Samsung Electronics is a global leader in technology, committed to creating a better future through innovative products and services.",
    logo: "https://placehold.co/200x200?text=Samsung",
    productCount: 45,
    website: "https://www.samsung.com",
  },
  apple: {
    name: "Apple",
    slug: "apple",
    description:
      "Apple Inc. is known for its innovative technology products including iPhone, iPad, Mac, and Apple Watch.",
    logo: "https://placehold.co/200x200?text=Apple",
    productCount: 32,
    website: "https://www.apple.com",
  },
  nike: {
    name: "Nike",
    slug: "nike",
    description:
      "Nike is a global leader in athletic footwear, apparel, and equipment. Just Do It.",
    logo: "https://placehold.co/200x200?text=Nike",
    productCount: 55,
    website: "https://www.nike.com",
  },
  sony: {
    name: "Sony",
    slug: "sony",
    description:
      "Sony Corporation is a leading manufacturer of electronics, gaming, and entertainment products.",
    logo: "https://placehold.co/200x200?text=Sony",
    productCount: 38,
    website: "https://www.sony.com",
  },
  adidas: {
    name: "Adidas",
    slug: "adidas",
    description:
      "Adidas is a multinational corporation that designs and manufactures shoes, clothing, and accessories.",
    logo: "https://placehold.co/200x200?text=Adidas",
    productCount: 48,
    website: "https://www.adidas.com",
  },
};

async function getBrand(slug: string) {
  return BRANDS[slug] || null;
}

function getBrandProducts(slug: string) {
  return [] as any[];
}

async function BrandContent({ slug }: { slug: string }) {
  const brand = await getBrand(slug);

  if (!brand) {
    notFound();
  }

  const products = getBrandProducts(slug);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="mb-8 rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-muted">
            <Store className="h-12 w-12 text-muted-foreground" />
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold">{brand.name}</h1>
            <p className="mt-1 text-muted-foreground max-w-2xl">
              {brand.description}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3 justify-center sm:justify-start">
              <Badge variant="secondary">{brand.productCount} Products</Badge>
              <a
                href={brand.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                Visit Official Website
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
        <Button variant="outline" size="sm">
          Sort by: Popularity
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm">
          Price: Low to High
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>

      {products.length === 0 && (
        <div className="py-20 text-center">
          <Store className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No products found</h2>
          <p className="text-muted-foreground">
            No products available for this brand yet.
          </p>
        </div>
      )}
    </div>
  );
}

export default async function BrandDetailPage({ params }: BrandPageProps) {
  const { slug } = await params;
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-muted animate-pulse" />}
    >
      <BrandContent slug={slug} />
    </Suspense>
  );
}
