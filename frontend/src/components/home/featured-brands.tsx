"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/lib/utils";

interface Brand {
  id: string;
  name: string;
  logo: string;
  slug: string;
}

const brands: Brand[] = [
  {
    id: "1",
    name: "Apple",
    slug: "apple",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/800px-Apple_logo_black.svg.png",
  },
  {
    id: "2",
    name: "Samsung",
    slug: "samsung",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/800px-Samsung_Logo.svg.png",
  },
  {
    id: "3",
    name: "Sony",
    slug: "sony",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Sony_logo_%282020-%29.svg/800px-Sony_logo_%282020-%29.svg.png",
  },
  {
    id: "4",
    name: "Nike",
    slug: "nike",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/800px-Logo_NIKE.svg.png",
  },
  {
    id: "5",
    name: "LG",
    slug: "lg",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/LG_logo_%282015%29.svg/800px-LG_logo_%282015%29.svg.png",
  },
  {
    id: "6",
    name: "boAt",
    slug: "boat",
    logo: "https://boatest.com/wp-content/uploads/2023/04/boat-logo.png",
  },
  {
    id: "7",
    name: "Canon",
    slug: "canon",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Canon_logo_2024.svg/800px-Canon_logo_2024.svg.png",
  },
  {
    id: "8",
    name: "OnePlus",
    slug: "oneplus",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/OnePlus_logo.svg/800px-OnePlus_logo.svg.png",
  },
  {
    id: "9",
    name: "JBL",
    slug: "jbl",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/JBL_logo.svg/800px-JBL_logo.svg.png",
  },
  {
    id: "10",
    name: "Dyson",
    slug: "dyson",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Dyson_logo.svg/800px-Dyson_logo.svg.png",
  },
  {
    id: "11",
    name: "Puma",
    slug: "puma",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Puma_logo.svg/800px-Puma_logo.svg.png",
  },
  {
    id: "12",
    name: "Adidas",
    slug: "adidas",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Adidas_Logo.svg/800px-Adidas_Logo.svg.png",
  },
];

export function FeaturedBrands() {
  const scrollRef = useState<HTMLDivElement | null>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef[0]) return;
    const amount = 300;
    scrollRef[0].scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="bg-gray-50 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Featured Brands</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => scroll("left")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => scroll("right")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div
          ref={(el) => {
            scrollRef[1] = el;
          }}
          className="scrollbar-hide flex gap-6 overflow-x-auto pb-4"
        >
          {brands.map((brand) => (
            <a
              key={brand.id}
              href={`/brand/${brand.slug}`}
              className="flex min-w-[160px] flex-col items-center justify-center gap-3 rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
            >
              <div className="flex h-16 w-32 items-center justify-center">
                <img
                  src={getImageUrl(brand.logo)}
                  alt={brand.name}
                  className="max-h-full max-w-full object-contain grayscale transition-all hover:grayscale-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/images/placeholder.svg";
                  }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700">{brand.name}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
