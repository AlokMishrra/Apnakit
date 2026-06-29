"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/services/api";
import {
  Smartphone,
  Laptop,
  Headphones,
  Camera,
  Home,
  Sofa,
  UtensilsCrossed,
  Shirt,
  Watch,
  Gamepad2,
  BookOpen,
  Baby,
  ShoppingBag,
  Dumbbell,
  Car,
  Dog,
  Flower2,
  Palette,
  Stethoscope,
  Wrench,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  _count?: { products?: number };
}

interface CategoryConfig {
  slug: string;
  icon: ReactNode;
  bg: string;
  color: string;
}

const categoryConfig: CategoryConfig[] = [
  { slug: "electronics", icon: <Smartphone className="h-6 w-6" />, bg: "bg-indigo-100", color: "text-indigo-600" },
  { slug: "fashion", icon: <Shirt className="h-6 w-6" />, bg: "bg-pink-100", color: "text-pink-600" },
  { slug: "home-decor", icon: <Home className="h-6 w-6" />, bg: "bg-emerald-100", color: "text-emerald-600" },
  { slug: "beauty", icon: <Flower2 className="h-6 w-6" />, bg: "bg-rose-100", color: "text-rose-600" },
  { slug: "books", icon: <BookOpen className="h-6 w-6" />, bg: "bg-amber-100", color: "text-amber-600" },
  { slug: "sports", icon: <Dumbbell className="h-6 w-6" />, bg: "bg-cyan-100", color: "text-cyan-600" },
  { slug: "grocery", icon: <ShoppingBag className="h-6 w-6" />, bg: "bg-lime-100", color: "text-lime-600" },
  { slug: "toys", icon: <Gamepad2 className="h-6 w-6" />, bg: "bg-purple-100", color: "text-purple-600" },
  { slug: "laptops", icon: <Laptop className="h-6 w-6" />, bg: "bg-blue-100", color: "text-blue-600" },
  { slug: "headphones", icon: <Headphones className="h-6 w-6" />, bg: "bg-violet-100", color: "text-violet-600" },
  { slug: "cameras", icon: <Camera className="h-6 w-6" />, bg: "bg-orange-100", color: "text-orange-600" },
  { slug: "furniture", icon: <Sofa className="h-6 w-6" />, bg: "bg-teal-100", color: "text-teal-600" },
  { slug: "kitchen", icon: <UtensilsCrossed className="h-6 w-6" />, bg: "bg-red-100", color: "text-red-600" },
  { slug: "watches", icon: <Watch className="h-6 w-6" />, bg: "bg-sky-100", color: "text-sky-600" },
  { slug: "gaming", icon: <Gamepad2 className="h-6 w-6" />, bg: "bg-fuchsia-100", color: "text-fuchsia-600" },
  { slug: "kids", icon: <Baby className="h-6 w-6" />, bg: "bg-yellow-100", color: "text-yellow-600" },
  { slug: "automotive", icon: <Car className="h-6 w-6" />, bg: "bg-slate-100", color: "text-slate-600" },
  { slug: "pets", icon: <Dog className="h-6 w-6" />, bg: "bg-stone-100", color: "text-stone-600" },
  { slug: "health", icon: <Stethoscope className="h-6 w-6" />, bg: "bg-green-100", color: "text-green-600" },
  { slug: "art", icon: <Palette className="h-6 w-6" />, bg: "bg-amber-100", color: "text-amber-600" },
  { slug: "tools", icon: <Wrench className="h-6 w-6" />, bg: "bg-zinc-100", color: "text-zinc-600" },
];

const defaultConfig: CategoryConfig = {
  slug: "",
  icon: <ShoppingBag className="h-6 w-6" />,
  bg: "bg-gray-100",
  color: "text-gray-600",
};

function getConfigForCategory(slug: string): CategoryConfig {
  return categoryConfig.find((c) => c.slug === slug) || { ...defaultConfig, slug };
}

const fallbackCategories: Category[] = [
  { id: "1", name: "Electronics", slug: "electronics" },
  { id: "2", name: "Fashion", slug: "fashion" },
  { id: "3", name: "Home & Kitchen", slug: "home-decor" },
  { id: "4", name: "Beauty", slug: "beauty" },
  { id: "5", name: "Books", slug: "books" },
  { id: "6", name: "Sports", slug: "sports" },
  { id: "7", name: "Grocery", slug: "grocery" },
  { id: "8", name: "Toys", slug: "toys" },
  { id: "9", name: "Laptops", slug: "laptops" },
  { id: "10", name: "Headphones", slug: "headphones" },
  { id: "11", name: "Cameras", slug: "cameras" },
  { id: "12", name: "Furniture", slug: "furniture" },
  { id: "13", name: "Kitchen", slug: "kitchen" },
  { id: "14", name: "Watches", slug: "watches" },
  { id: "15", name: "Gaming", slug: "gaming" },
  { id: "16", name: "Kids", slug: "kids" },
];

export function CategoryGrid() {
  const [categories, setCategories] = useState<Category[]>(fallbackCategories);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/categories");
        const data = res?.data?.data;
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
        }
      } catch {
        // keep fallback
      }
    };
    fetchCategories();
  }, []);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
    }
    return () => {
      if (el) el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [categories]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = direction === "left" ? -200 : 200;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <section className="py-4 sm:py-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Shop by Category</h2>
        <Link
          href="/category"
          className="text-xs sm:text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          View All
        </Link>
      </div>

      <div className="relative">
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 shadow-md rounded-full p-1 hidden sm:flex"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 shadow-md rounded-full p-1 hidden sm:flex"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto no-scrollbar sm:grid sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 sm:gap-4 pb-1"
          style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
        >
          {categories.map((category) => {
            const config = getConfigForCategory(category.slug);
            return (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="group flex flex-col items-center gap-2.5 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 min-w-[90px] sm:min-w-0 flex-shrink-0 scroll-snap-align-start"
              >
                <div
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-full transition-transform group-hover:scale-110",
                    config.bg,
                    config.color
                  )}
                >
                  {config.icon}
                </div>
                <span className="text-center text-xs font-medium text-gray-700 group-hover:text-indigo-600 leading-tight whitespace-nowrap">
                  {category.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
