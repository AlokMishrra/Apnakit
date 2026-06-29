"use client";

import * as React from "react";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useCategories } from "@/hooks/use-categories";
import { getImageUrl } from "@/lib/utils";

export default function CategoryPage() {
  const { data, isLoading } = useCategories();
  const categories = data ? (Array.isArray(data) ? data : (data as any)?.data || []) : [];

  if (isLoading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Categories" },
          ]}
          className="mb-6"
        />

        <h1 className="mb-8 text-3xl font-bold text-gray-900">All Categories</h1>

        {categories.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No categories found.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {categories.map((category: any) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="group flex flex-col items-center rounded-lg border bg-card p-6 text-center transition-all hover:shadow-md"
              >
                {category.image ? (
                  <div className="mb-4 h-24 w-24 overflow-hidden rounded-full bg-muted">
                    <img
                      src={getImageUrl(category.image)}
                      alt={category.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-3xl font-bold text-primary">
                    {category.name.charAt(0)}
                  </div>
                )}
                <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {category.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
