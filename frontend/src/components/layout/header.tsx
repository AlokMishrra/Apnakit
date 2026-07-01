"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  MapPin,
  HelpCircle,
  Package,
  Tag,
  ChevronDown,
  X,
  LogIn,
  PackageCheck,
  Truck,
  Store,
  Settings,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/layout/notification-bell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "@/store/slices/authSlice";
import { clearAuthCookies } from "@/lib/utils";

import { CATEGORIES } from "@/constants";
import { SearchBar } from "@/components/search/search-bar";
import { LocationSelector } from "@/components/layout/location-selector";
import { LocationModal } from "@/components/layout/location-modal";
import { useLocation } from "@/components/layout/location-context";
import { Logo } from "@/components/brand/logo";
import type { User as UserType } from "@/types";
import type { RootState } from "@/store/store";

interface HeaderProps {
  user?: UserType | null;
  cartCount?: number;
  wishlistCount?: number;
}

function CategoryNav({ pathname }: { pathname: string }) {
  const [apiCategories, setApiCategories] = useState<any[]>([]);

  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await import("@/services/api").then((m) => m.default.get("/categories"));
        const data = res?.data?.data;
        if (Array.isArray(data) && data.length > 0) {
          setApiCategories(data);
        }
      } catch {
        // fallback to static CATEGORIES
      }
    };
    fetchCategories();
  }, []);

  const categories = apiCategories.length > 0
    ? apiCategories.map((c: any) => ({ name: c.name, slug: c.slug, isComingSoon: c.isComingSoon }))
    : CATEGORIES;

  return (
    <nav className="hidden border-b bg-white lg:block">
      <div className="mx-auto flex h-10 max-w-7xl items-center gap-1 px-4 overflow-x-auto scrollbar-none">
        {categories.map((cat: any) => {
          if (cat.isComingSoon) {
            return (
              <span
                key={cat.slug}
                className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-gray-400 cursor-not-allowed relative"
                title="Coming Soon"
              >
                {cat.name}
                <span className="ml-1 inline-block rounded bg-emerald-100 px-1 py-0.5 text-[9px] font-bold text-emerald-700 uppercase leading-none">Soon</span>
              </span>
            );
          }
          return (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className={cn(
                "whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-primary/10 hover:text-primary",
                pathname === `/category/${cat.slug}`
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-gray-700"
              )}
            >
              {cat.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function Header({ user: userProp, cartCount = 0, wishlistCount = 0 }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const reduxUser = useSelector((state: RootState) => state.auth.user);
  const user = userProp ?? reduxUser;

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    clearAuthCookies();
    dispatch(logout());
    router.push("/login");
  };
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [locationModalOpen, setLocationModalOpen] = React.useState(false);
  const { location } = useLocation();

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="sticky top-[var(--app-banner-h,0px)] z-40 w-full transition-[top] duration-200">
      {/* Top Bar */}
      <div className="hidden bg-gray-900 text-gray-100 lg:block">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-between px-4 text-xs">
          <div className="flex items-center gap-4">
            <LocationSelector
              variant="dark"
              onClick={() => setLocationModalOpen(true)}
            />
          </div>
          <div className="flex items-center gap-4">
            <Link href="/help" className="flex items-center gap-1 hover:text-white/80 transition-colors">
              <HelpCircle className="h-3 w-3" />
              <span>Help</span>
            </Link>
            <Link href="/track-order" className="flex items-center gap-1 hover:text-white/80 transition-colors">
              <Package className="h-3 w-3" />
              <span>Track Order</span>
            </Link>
            <Link href="/seller/register" className="flex items-center gap-1 hover:text-white/80 transition-colors">
              <Tag className="h-3 w-3" />
              <span>Sell on ApnaKit</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className={cn(
        "bg-white transition-shadow",
        isScrolled && "shadow-md"
      )}>
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-3 sm:gap-4 sm:px-4">
          {/* Mobile location (compact — just pin + city) */}
          <button
            type="button"
            onClick={() => setLocationModalOpen(true)}
            className="flex min-w-0 max-w-[120px] flex-shrink items-center gap-1 rounded-md px-1.5 py-1 text-left text-foreground transition-colors hover:bg-muted sm:max-w-[160px] lg:hidden"
            aria-label="Change delivery location"
          >
            <MapPin className="h-4 w-4 flex-shrink-0 text-primary" />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-xs font-semibold">
                {location ? location.city : "Set location"}
              </p>
            </div>
            <ChevronDown className="h-3 w-3 flex-shrink-0 opacity-70" />
          </button>

          {/* Logo */}
          <div className="flex flex-shrink-0 items-center">
            <Logo className="h-12 sm:h-14 lg:h-16" />
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden flex-1 md:block lg:max-w-2xl">
            <SearchBar />
          </div>

          {/* Right Actions */}
          <div className="ml-auto flex items-center gap-0.5 sm:gap-2">
            {/* Mobile Search */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => router.push("/search")}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Notifications */}
            <NotificationBell />

            {/* Account */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="hidden gap-2 px-2 sm:flex">
                    <UserAvatar name={user.name} src={user.avatar} size="sm" />
                    <span className="hidden text-sm font-medium lg:inline">{user.name.split(" ")[0]}</span>
                    <ChevronDown className="hidden h-4 w-4 lg:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user.name}</span>
                      <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/account")}>
                    <User className="mr-2 h-4 w-4" />
                    My Account
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/account/orders")}>
                    <PackageCheck className="mr-2 h-4 w-4" />
                    Orders
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/account/wishlist")}>
                    <Heart className="mr-2 h-4 w-4" />
                    Wishlist
                  </DropdownMenuItem>
                  {(user.role === "seller" || user.role === "admin") && (
                    <DropdownMenuItem onClick={() => router.push("/seller/dashboard")}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Seller Dashboard
                    </DropdownMenuItem>
                  )}
                  {(user.role === "delivery" || user.role === "admin") && (
                    <DropdownMenuItem onClick={() => router.push("/delivery/dashboard")}>
                      <Truck className="mr-2 h-4 w-4" />
                      Delivery Panel
                    </DropdownMenuItem>
                  )}
                  {user.role === "admin" && (
                    <DropdownMenuItem onClick={() => router.push("/admin/dashboard")}>
                      <Settings className="mr-2 h-4 w-4" />
                      Admin Panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/account/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                className="hidden gap-2 sm:flex"
                onClick={() => router.push("/login")}
              >
                <User className="h-5 w-5" />
                <span className="hidden text-sm font-medium lg:inline">Account</span>
              </Button>
            )}

            {/* Wishlist */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => router.push("/account/wishlist")}
            >
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </Button>

            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => router.push("/cart")}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Category Navigation - Desktop */}
      <CategoryNav pathname={pathname} />

      <LocationModal
        open={locationModalOpen}
        onOpenChange={setLocationModalOpen}
      />
    </header>
  );
}

export { Header };
