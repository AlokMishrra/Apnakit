"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  X,
  ChevronRight,
  ChevronDown,
  User,
  Package,
  Heart,
  MapPin,
  Settings,
  HelpCircle,
  LogOut,
  Home,
  Grid3X3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/ui/avatar";
import { CATEGORIES, STORE_NAME } from "@/constants";
import type { User as UserType } from "@/types";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  user?: UserType | null;
}

function Sidebar({ open, onClose, user }: SidebarProps) {
  const pathname = usePathname();
  const [expandedCategory, setExpandedCategory] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  React.useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  const accountLinks = [
    { label: "My Account", href: "/account", icon: User },
    { label: "Orders", href: "/account/orders", icon: Package },
    { label: "Wishlist", href: "/account/wishlist", icon: Heart },
    { label: "Addresses", href: "/account/addresses", icon: MapPin },
    { label: "Help Center", href: "/help", icon: HelpCircle },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/50 transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-80 flex-col bg-white shadow-xl transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          {user ? (
            <div className="flex items-center gap-3">
              <UserAvatar name={user.name} src={user.avatar} size="md" />
              <div>
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
          ) : (
            <Link href="/" className="text-lg font-bold text-primary">
              {STORE_NAME}
            </Link>
          )}
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1">
          {/* Quick Links */}
          <div className="p-4">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              <Home className="h-5 w-5 text-muted-foreground" />
              Home
            </Link>
          </div>

          <Separator />

          {/* Categories */}
          <div className="p-4">
            <h3 className="mb-3 flex items-center gap-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Grid3X3 className="h-4 w-4" />
              Categories
            </h3>
            <div className="space-y-0.5">
              {CATEGORIES.map((cat) => {
                const isExpanded = expandedCategory === cat.slug;
                return (
                  <div key={cat.slug}>
                    <div className="flex items-center">
                      <Link
                        href={`/category/${cat.slug}`}
                        className={cn(
                          "flex-1 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted",
                          pathname === `/category/${cat.slug}` && "bg-primary/10 font-medium text-primary"
                        )}
                      >
                        {cat.name}
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setExpandedCategory(isExpanded ? null : cat.slug)}
                      >
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 text-muted-foreground transition-transform",
                            isExpanded && "rotate-180"
                          )}
                        />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Account Links */}
          {user && (
            <>
              <div className="p-4">
                <h3 className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  My Account
                </h3>
                <div className="space-y-0.5">
                  {accountLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted",
                          pathname === link.href && "bg-primary/10 font-medium text-primary"
                        )}
                      >
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
              <Separator />
            </>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t p-4">
          {user ? (
            <Button variant="outline" className="w-full justify-start gap-2 text-destructive hover:text-destructive">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button asChild className="flex-1">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/register">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export { Sidebar };
