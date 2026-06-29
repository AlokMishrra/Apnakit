"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  IndianRupee,
  Route,
  User,
  Menu,
  X,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { deliveryService } from "@/services/delivery.service";

const navItems = [
  { href: "/delivery/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/delivery/orders", label: "My Orders", icon: Package },
  { href: "/delivery/earnings", label: "Earnings", icon: IndianRupee },
  { href: "/delivery/route", label: "Route", icon: Route },
  { href: "/delivery/profile", label: "Profile", icon: User },
];

export default function DeliveryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await deliveryService.getProfile();
        setProfile(res?.data || res);
      } catch (err) {
        // silently fail
      }
    };
    fetchProfile();
  }, []);

  const userName = profile?.name || profile?.fullName || "Delivery Partner";
  const initials = userName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const partnerId = profile?.partnerId || profile?.deliveryPartnerId || "";

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-lg transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b px-4">
            <div className="flex items-center gap-2">
              <Truck className="h-6 w-6 text-emerald-600" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="ApnaKit" className="h-7 w-auto" />
            </div>
            <button
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5",
                      isActive ? "text-emerald-600" : "text-gray-400"
                    )}
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Partner info */}
          <div className="border-t p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {userName}
                </p>
                {partnerId && (
                  <p className="truncate text-xs text-gray-500">
                    Partner ID: {partnerId}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 hover:bg-gray-100 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {navItems.find(
                (item) =>
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/")
              )?.label || "Delivery Panel"}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Online/Offline toggle */}
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-sm font-medium",
                  isOnline ? "text-emerald-600" : "text-gray-500"
                )}
              >
                {isOnline ? "Online" : "Offline"}
              </span>
              <button
                onClick={() => setIsOnline(!isOnline)}
                className={cn(
                  "relative h-7 w-12 rounded-full transition-colors",
                  isOnline ? "bg-emerald-500" : "bg-gray-300"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform",
                    isOnline ? "translate-x-5" : "translate-x-0.5"
                  )}
                />
              </button>
            </div>

            {/* Profile */}
            <div className="flex items-center gap-2">
              <div className="hidden h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 sm:flex">
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="border-t bg-white lg:hidden">
          <div className="flex items-center justify-around py-2">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 px-3 py-1 text-xs font-medium",
                    isActive ? "text-emerald-600" : "text-gray-500"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
