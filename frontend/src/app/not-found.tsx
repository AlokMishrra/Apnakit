"use client";

import Link from "next/link";
import { Home, Search, ArrowLeft, PackageX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        {/* Illustration */}
        <div className="relative mb-8">
          <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-full bg-muted/50">
            <PackageX className="h-20 w-20 text-muted-foreground/30" />
          </div>
          <div className="absolute -right-2 -top-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <span className="text-3xl font-bold text-primary">404</span>
          </div>
        </div>

        {/* Text */}
        <h1 className="mb-3 text-4xl font-bold">Page Not Found</h1>
        <p className="mb-8 text-lg text-muted-foreground">
          Oops! The page you&apos;re looking for doesn&apos;t exist or has been
          moved. Let&apos;s get you back on track.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go to Homepage
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/search">
              <Search className="mr-2 h-4 w-4" />
              Search Products
            </Link>
          </Button>
        </div>

        {/* Back Link */}
        <button
          onClick={() => window.history.back()}
          className="mt-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Go back to previous page
        </button>
      </div>
    </div>
  );
}
