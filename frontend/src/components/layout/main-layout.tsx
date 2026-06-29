"use client";

import * as React from "react";
import { Header } from "./header";
import { Footer } from "./footer";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import type { User } from "@/types";

interface MainLayoutProps {
  children: React.ReactNode;
  user?: User | null;
  cartCount?: number;
  wishlistCount?: number;
  hideFooter?: boolean;
}

function MainLayout({
  children,
  user,
  cartCount = 0,
  wishlistCount = 0,
  hideFooter = false,
}: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        user={user}
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onMenuClick={() => setSidebarOpen(true)}
      />

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
      />

      <main className="flex-1 pb-16 md:pb-0">{children}</main>

      {!hideFooter && <Footer />}

      <BottomNav cartCount={cartCount} />
    </div>
  );
}

export { MainLayout };
