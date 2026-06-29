"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Grid3X3,
  ShoppingCart,
  User,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

interface MobileNavProps {
  cartCount?: number;
  className?: string;
}

function MobileNav({ cartCount = 0, className }: MobileNavProps) {
  const pathname = usePathname();

  const navItems: MobileNavItem[] = [
    { label: "Home", href: "/", icon: <Home className="h-5 w-5" /> },
    { label: "Categories", href: "/category", icon: <Grid3X3 className="h-5 w-5" /> },
    { label: "Search", href: "/search", icon: <Search className="h-5 w-5" /> },
    { label: "Cart", href: "/cart", icon: <ShoppingCart className="h-5 w-5" />, badge: cartCount },
    { label: "Account", href: "/account", icon: <User className="h-5 w-5" /> },
  ];

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t bg-white shadow-lg safe-area-bottom md:hidden",
        className
      )}
    >
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 text-xs transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                {item.icon}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export { MobileNav };
