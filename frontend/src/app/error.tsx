"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-8 flex h-40 w-40 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-20 w-20 text-destructive/40" />
        </div>
        <h1 className="mb-3 text-3xl font-bold">Something went wrong</h1>
        <p className="mb-8 text-muted-foreground">
          This page could not be loaded. Try again, or go back to the store.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={reset}>
            <RotateCcw className="mr-2 h-4 w-4" /> Try again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" /> Go to home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
