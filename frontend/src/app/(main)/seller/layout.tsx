"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { logout } from "@/store/slices/authSlice";
import { clearAuthCookies } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  Bell,
  Menu,
  X,
  Store,
  LogOut,
  User,
  ChevronDown,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { useEffect } from "react";
import { sellerService } from "@/services/seller.service";

const sidebarItems = [
  { label: "Dashboard", href: "/seller/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/seller/products", icon: Package },
  { label: "Orders", href: "/seller/orders", icon: ShoppingCart },
  { label: "Analytics", href: "/seller/analytics", icon: BarChart3 },
  { label: "Settings", href: "/seller/settings", icon: Settings },
];

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sellerProfile, setSellerProfile] = useState<any>({ businessName: "My Store", name: "Seller", pendingOrders: 0 });
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    sellerService.getDashboard().then((data) => {
      if (data?.seller) {
        setSellerProfile({
          businessName: data.seller.businessName || "My Store",
          name: data.seller.name || "Seller",
          pendingOrders: data.stats?.pendingOrders || 0,
        });
      }
    }).catch(() => {});
  }, []);

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api/v1"}/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
      // ignore
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    clearAuthCookies();
    dispatch(logout());
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-2 px-6 py-5 border-b">
          <Logo className="h-7" />
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
            Seller
          </span>
        </div>

        <nav className="px-3 py-4 space-y-1">
          {sidebarItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
                {item.label === "Orders" && sellerProfile.pendingOrders > 0 && (
                  <Badge variant="destructive" className="ml-auto text-xs">
                    {sellerProfile.pendingOrders}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
          <div className="flex items-center gap-3">
            <UserAvatar
              name={sellerProfile.businessName}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {sellerProfile.businessName}
              </p>
              <p className="text-xs text-gray-500">Active Seller</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white border-b h-16 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900 hidden sm:block">
              {sidebarItems.find((item) => pathname.startsWith(item.href))?.label ||
                "Seller Panel"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="px-3 py-2 border-b">
                  <h3 className="font-semibold">Notifications</h3>
                </div>
                {notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={cn(
                      "flex flex-col items-start gap-1 py-3 px-3 cursor-pointer",
                      !notification.read && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-start gap-2 w-full">
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full mt-1.5 shrink-0",
                          !notification.read ? "bg-primary" : "bg-transparent"
                        )}
                      />
                      <div className="flex-1">
                        <p className="text-sm">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-center text-primary text-sm font-medium cursor-pointer">
                  View all notifications
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <UserAvatar
                    name={sellerProfile.businessName}
                    size="sm"
                  />
                  <span className="hidden sm:inline text-sm font-medium">
                    {sellerProfile.name}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <User className="h-4 w-4 mr-2" />
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Sales Report
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive cursor-pointer" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
