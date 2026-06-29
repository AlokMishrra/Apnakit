"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  Search,
  Bell,
  ChevronRight,
  User,
  Settings,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { logout } from "@/store/slices/authSlice";
import { clearAuthCookies } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminHeaderProps {
  onMenuClick: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const breadcrumbMap: Record<string, string> = {
  dashboard: "Dashboard",
  products: "Products",
  categories: "Categories",
  brands: "Brands",
  banners: "Banners",
  coupons: "Coupons",
  orders: "Orders",
  customers: "Customers",
  sellers: "Sellers",
  returns: "Returns",
  analytics: "Analytics",
  settings: "Settings",
  add: "Add New",
  edit: "Edit",
};

export function AdminHeader({
  onMenuClick,
  collapsed,
  onToggleCollapse,
}: AdminHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments
    .filter((s) => s !== "admin")
    .map((s) => breadcrumbMap[s] || s);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1"}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch {
      // ignore — local logout still proceeds
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    clearAuthCookies();
    dispatch(logout());
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-gray-200 bg-white px-4 shadow-sm md:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:flex"
          onClick={onToggleCollapse}
        >
          {collapsed ? (
            <ChevronsRight className="h-5 w-5" />
          ) : (
            <ChevronsLeft className="h-5 w-5" />
          )}
        </Button>

        <nav className="hidden items-center gap-1 text-sm text-gray-500 md:flex">
          <Link
            href="/admin/dashboard"
            className="transition-colors hover:text-gray-900"
          >
            Home
          </Link>
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5" />
              <span
                className={cn(
                  index === breadcrumbs.length - 1
                    ? "font-medium text-gray-900"
                    : "transition-colors hover:text-gray-900"
                )}
              >
                {crumb}
              </span>
            </span>
          ))}
        </nav>
      </div>

      <div className="ml-auto flex items-center gap-2 md:gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="h-10 w-64 rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm transition-colors placeholder:text-gray-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 lg:w-80"
          />
        </div>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-gray-600" />
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            3
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-gray-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500/20 text-sm font-semibold text-primary-600">
                A
              </div>
              <div className="hidden text-left md:block">
                <p className="text-sm font-medium text-gray-900">Alok</p>
                <p className="text-xs text-gray-500">Super Admin</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
