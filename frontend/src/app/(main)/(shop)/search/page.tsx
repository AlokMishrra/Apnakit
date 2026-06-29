"use client";

import * as React from "react";
import { SearchResults } from "@/components/search/search-results";

export default function SearchPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <React.Suspense
          fallback={
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          }
        >
          <SearchResults />
        </React.Suspense>
      </div>
    </main>
  );
}
