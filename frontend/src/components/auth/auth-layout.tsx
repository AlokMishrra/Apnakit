"use client";

import * as React from "react";
import { Logo } from "@/components/brand/logo";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden flex-1 items-center justify-center bg-primary lg:flex">
        <div className="max-w-md px-8 text-center text-primary-foreground">
          <div className="mb-8 inline-block">
            <Logo className="h-12" />
          </div>
          <div className="mt-8 space-y-4">
            <h2 className="text-2xl font-semibold">
              Your One-Stop Shopping Destination
            </h2>
            <p className="text-primary-foreground/80">
              Discover amazing deals on thousands of products. Shop electronics,
              fashion, home essentials and more.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-3 gap-4 text-sm">
            <div className="rounded-lg bg-primary-foreground/10 p-4">
              <div className="text-2xl font-bold">10K+</div>
              <div className="text-primary-foreground/70">Products</div>
            </div>
            <div className="rounded-lg bg-primary-foreground/10 p-4">
              <div className="text-2xl font-bold">50K+</div>
              <div className="text-primary-foreground/70">Customers</div>
            </div>
            <div className="rounded-lg bg-primary-foreground/10 p-4">
              <div className="text-2xl font-bold">4.8</div>
              <div className="text-primary-foreground/70">Rating</div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
