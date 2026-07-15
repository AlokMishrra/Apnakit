"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  Heart,
  MapPin,
  Wallet,
  RotateCcw,
  HeadphonesIcon,
  ShoppingBag,
  ChevronRight,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  User,
  Settings,
  Bell,
  Loader2,
  LogOut,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency, formatDate, getImageUrl } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useDispatch } from "react-redux";
import { logout } from "@/store/slices/authSlice";
import { clearAuthCookies } from "@/lib/utils";
import { toast } from "sonner";
import { getSafeErrorMessage, isAuthError } from "@/lib/safe-error";
import {
  orderService,
  walletService,
  supportService,
  userService,
  wishlistService,
} from "@/services";

const quickLinks = [
  { label: "My Orders", icon: Package, href: "/account/orders", key: "orders" },
  { label: "Wishlist", icon: Heart, href: "/account/wishlist", key: "wishlist" },
  { label: "Addresses", icon: MapPin, href: "/account/addresses", key: "addresses" },
  { label: "Wallet", icon: Wallet, href: "/account/wallet", key: "wallet" },
  { label: "Returns", icon: RotateCcw, href: "/account/returns", key: "returns" },
  { label: "Support", icon: HeadphonesIcon, href: "/account/support", key: "support" },
];

const sidebarLinks = [
  { label: "Profile", icon: User, href: "/account" },
  { label: "Orders", icon: Package, href: "/account/orders" },
  { label: "Wishlist", icon: Heart, href: "/account/wishlist" },
  { label: "Addresses", icon: MapPin, href: "/account/addresses" },
  { label: "Wallet", icon: Wallet, href: "/account/wallet" },
  { label: "Returns", icon: RotateCcw, href: "/account/returns" },
  { label: "Support", icon: HeadphonesIcon, href: "/account/support" },
  { label: "Notifications", icon: Bell, href: "/account/notifications" },
  { label: "Settings", icon: Settings, href: "/account/settings" },
];

const orderStatusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: "Pending", color: "bg-blue-100 text-blue-700", icon: Clock },
  CONFIRMED: { label: "Confirmed", color: "bg-indigo-100 text-indigo-700", icon: CheckCircle2 },
  PROCESSING: { label: "Processing", color: "bg-amber-100 text-amber-700", icon: Package },
  PACKED: { label: "Packed", color: "bg-cyan-100 text-cyan-700", icon: Package },
  SHIPPED: { label: "Shipped", color: "bg-purple-100 text-purple-700", icon: Truck },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", color: "bg-indigo-100 text-indigo-700", icon: Truck },
  DELIVERED: { label: "Delivered", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-700", icon: XCircle },
  RETURNED: { label: "Returned", color: "bg-orange-100 text-orange-700", icon: RotateCcw },
};

function AccountSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <Skeleton className="h-32 w-full rounded-xl sm:h-36" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isLoading: authLoading } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    orders: 0,
    wishlist: 0,
    addresses: 0,
    walletBalance: 0,
    openTickets: 0,
    pendingReturns: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Safe wrappers so a sync throw (e.g. "X is not a function") doesn't kill allSettled
    const safeGet = (fn: () => any, fallback: any): Promise<any> => {
      try {
        const result = fn();
        return Promise.resolve(result).catch(() => fallback);
      } catch {
        return Promise.resolve(fallback);
      }
    };

    // Fetch all data in parallel — each call is isolated so one failure doesn't break the rest
    const [ordersRes, wishlistRes, addressesRes, walletRes, ticketsRes] = await Promise.allSettled([
      safeGet(() => orderService.getOrders({ limit: 5 }), { success: false, data: { orders: [] } }),
      safeGet(() => wishlistService.getWishlist(), { success: false, data: { items: [], count: 0 } }),
      safeGet(() => userService.getAddresses(), { success: false, data: [] }),
      safeGet(() => walletService.getWallet(), { success: false, data: { balance: 0 } }),
      safeGet(() => supportService.getTickets({ limit: 50 }), { success: false, data: [] }),
    ]);

    // Helper: unwrap axios response body (handles {success,data}, {data:...}, or raw)
    const unwrap = (res: any): any => {
      if (!res) return res;
      // res is the value from a settled promise (the return value of the service fn)
      // orderService returns response.data = {statusCode, message, data, timestamp}
      if (res?.data && (res.data.orders || res.data.items || res.data.balance !== undefined || res.data.tickets)) {
        return res.data; // backend wrapped data
      }
      if (res?.data && Array.isArray(res.data)) {
        return res.data; // backend returned array directly
      }
      return res;
    };

    // Parse orders — backend returns {orders, meta}
    let ordersList: any[] = [];
    if (ordersRes.status === "fulfilled") {
      const data = unwrap(ordersRes.value);
      const orders = data?.orders || data?.data?.orders || (Array.isArray(data) ? data : []);
      ordersList = Array.isArray(orders) ? orders : [];
    }
    setRecentOrders(ordersList.slice(0, 3));

    // Parse wishlist — backend returns {items: [...], count}
    let wishlistCount = 0;
    if (wishlistRes.status === "fulfilled") {
      const data = unwrap(wishlistRes.value);
      wishlistCount = Number(data?.count ?? data?.items?.length ?? (Array.isArray(data) ? data.length : 0));
    }

    // Parse addresses — backend returns array, but be defensive
    let addressCount = 0;
    if (addressesRes.status === "fulfilled") {
      const data = unwrap(addressesRes.value);
      if (Array.isArray(data)) addressCount = data.length;
      else if (data?.addresses) addressCount = data.addresses.length;
      else if (data && typeof data === "object" && data.id) addressCount = 1; // single object fallback
    }

    // Parse wallet balance
    let walletBalance = 0;
    if (walletRes.status === "fulfilled") {
      const data = unwrap(walletRes.value);
      walletBalance = Number(data?.balance ?? 0);
    }

    // Parse open tickets
    let openTickets = 0;
    let pendingReturns = 0;
    if (ticketsRes.status === "fulfilled") {
      const data = unwrap(ticketsRes.value);
      const arr = Array.isArray(data) ? data : (data?.tickets || data?.data || []);
      openTickets = arr.filter((t: any) => {
        const s = String(t.status || "").toUpperCase();
        return s === "OPEN" || s === "IN_PROGRESS" || s === "PENDING" || s === "WAITING";
      }).length;
    }

    setStats({
      orders: ordersList.length,
      wishlist: wishlistCount,
      addresses: addressCount,
      walletBalance,
      openTickets,
      pendingReturns,
    });
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      fetchDashboardData();
    }
  }, [user, authLoading, router, fetchDashboardData]);

  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const performLogout = async () => {
    setLoggingOut(true);
    try {
      // Optionally call backend logout endpoint (invalidates session)
      try {
        const token = localStorage.getItem("accessToken");
        if (token) {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      } catch {
        // ignore — local logout still proceeds
      }
    } finally {
      // Always clear local state
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      clearAuthCookies();
      dispatch(logout());
      setLogoutDialogOpen(false);
      setLoggingOut(false);
      toast.success("Logged out successfully");
      router.push("/login");
    }
  };

  const handleLogout = () => setLogoutDialogOpen(true);

  if (authLoading || !user) {
    return <AccountSkeleton />;
  }

  const displayName = user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User";
  const displayEmail = user.email || "";
  const displayPhone = user.phone || "";
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="flex gap-4 lg:gap-6">
          {/* Sidebar - Desktop */}
          <div className="hidden w-60 flex-shrink-0 lg:block">
            <Card className="sticky top-24">
              <CardContent className="p-4">
                <div className="mb-4 flex flex-col items-center text-center">
                  {user.avatar ? (
                    <img src={user.avatar} alt={displayName} className="h-16 w-16 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-xl font-semibold text-indigo-600">
                      {userInitial}
                    </div>
                  )}
                  <h2 className="mt-3 text-base font-semibold text-foreground line-clamp-1">
                    {displayName}
                  </h2>
                  <p className="text-xs text-muted-foreground line-clamp-1">{displayEmail}</p>
                </div>
                <Separator className="mb-4" />
                <nav className="space-y-1">
                  {sidebarLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                        link.href === "/account"
                          ? "bg-indigo-50 text-indigo-600 font-medium"
                          : "text-muted-foreground hover:bg-gray-50 hover:text-foreground"
                      }`}
                    >
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  ))}
                </nav>
                <Separator className="my-4" />
                <Link
                  href="/delete-my-account"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Account
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="min-w-0 flex-1">
            {loading ? (
              <AccountSkeleton />
            ) : (
              <>
                {/* Profile Card */}
                <Card className="mb-4 sm:mb-6">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      {user.avatar ? (
                        <img src={user.avatar} alt={displayName} className="h-16 w-16 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-2xl font-semibold text-indigo-600 sm:h-20 sm:w-20">
                          {userInitial}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h1 className="text-lg font-bold text-foreground sm:text-xl">
                          Hello, {displayName}!
                        </h1>
                        <p className="truncate text-sm text-muted-foreground">{displayEmail}</p>
                        {displayPhone && (
                          <p className="text-sm text-muted-foreground">{displayPhone}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 sm:text-right">
                        {(user?.role === "admin" || user?.role === "ADMIN" || user?.role === "delivery" || user?.role === "DELIVERY" || user?.role === "seller" || user?.role === "SELLER") ? (
                          <Link
                            href={
                              (user?.role === "admin" || user?.role === "ADMIN") ? "/admin/dashboard" :
                              (user?.role === "delivery" || user?.role === "DELIVERY") ? "/delivery/dashboard" :
                              "/seller/dashboard"
                            }
                            className="flex-shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                          >
                            Go to {(user?.role === "admin" || user?.role === "ADMIN") ? "Admin" : (user?.role === "delivery" || user?.role === "DELIVERY") ? "Delivery" : "Seller"} Panel
                          </Link>
                        ) : (
                          <div
                            className="flex-shrink-0 cursor-not-allowed rounded-lg bg-indigo-50 p-4 text-center opacity-70"
                            title="Wallet feature coming soon"
                          >
                            <p className="text-xs text-muted-foreground">Wallet</p>
                            <p className="text-sm font-semibold text-indigo-600">
                              Coming Soon
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Links Grid */}
                <div className="mb-4 grid grid-cols-2 gap-2 sm:mb-6 sm:grid-cols-3 sm:gap-3">
                  {quickLinks.map((link) => (
                    link.key === "wallet" ? (
                      <div
                        key={link.label}
                        className="cursor-not-allowed opacity-70"
                        title="Wallet feature coming soon"
                      >
                        <Card className="h-full">
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50 sm:h-10 sm:w-10">
                                <link.icon className="h-4 w-4 text-indigo-600 sm:h-5 sm:w-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-foreground">
                                  {link.label}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Coming Soon
                                </p>
                              </div>
                              <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <Link key={link.label} href={link.href}>
                        <Card className="h-full transition-all hover:shadow-md hover:border-indigo-200">
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50 sm:h-10 sm:w-10">
                                <link.icon className="h-4 w-4 text-indigo-600 sm:h-5 sm:w-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-foreground">
                                  {link.label}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {link.key === "orders" && `${stats.orders} ${stats.orders === 1 ? "order" : "orders"}`}
                                  {link.key === "wishlist" && `${stats.wishlist} ${stats.wishlist === 1 ? "item" : "items"}`}
                                  {link.key === "addresses" && `${stats.addresses} saved`}
                                  {link.key === "returns" && `${stats.pendingReturns} pending`}
                                  {link.key === "support" && `${stats.openTickets} open`}
                                </p>
                              </div>
                              <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    )
                  ))}
                </div>

                {/* Portal Access - based on role */}
                {(user?.role === "admin" || user?.role === "ADMIN") && (
                  <Card className="mb-4 sm:mb-6 border-violet-200 bg-violet-50/50">
                    <CardContent className="p-4">
                      <Link href="/admin/dashboard" className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">
                          <Settings className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-foreground">Admin Panel</p>
                          <p className="text-xs text-muted-foreground">Manage store, orders, products & more</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-violet-600" />
                      </Link>
                    </CardContent>
                  </Card>
                )}
                {(user?.role === "delivery" || user?.role === "DELIVERY" || user?.role === "admin" || user?.role === "ADMIN") && (
                  <Card className="mb-4 sm:mb-6 border-indigo-200 bg-indigo-50/50">
                    <CardContent className="p-4">
                      <Link href="/delivery/dashboard" className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                          <Truck className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-foreground">Delivery Panel</p>
                          <p className="text-xs text-muted-foreground">View delivery assignments, earnings & routes</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-indigo-600" />
                      </Link>
                    </CardContent>
                  </Card>
                )}
                {(user?.role === "seller" || user?.role === "SELLER") && (
                  <Card className="mb-4 sm:mb-6 border-emerald-200 bg-emerald-50/50">
                    <CardContent className="p-4">
                      <Link href="/seller/dashboard" className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                          <ShoppingBag className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-foreground">Seller Panel</p>
                          <p className="text-xs text-muted-foreground">Manage your products, orders & earnings</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-emerald-600" />
                      </Link>
                    </CardContent>
                  </Card>
                )}

                {/* Logout button — visible on all screen sizes */}
                <Card className="mt-4 sm:mt-6">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">Signed in as {displayName}</h3>
                        <p className="text-xs text-muted-foreground">{displayEmail}</p>
                      </div>
                      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                        <Button
                          variant="outline"
                          asChild
                          className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                        >
                          <Link href="/delete-my-account">
                            <Trash2 className="h-4 w-4" />
                            Delete Account
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleLogout}
                          className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign out
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Orders */}
                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-base font-semibold text-foreground sm:text-lg">
                        Recent Orders
                      </h2>
                      <Link
                        href="/account/orders"
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        View All
                      </Link>
                    </div>

                    {recentOrders.length === 0 ? (
                      <div className="py-8 text-center">
                        <ShoppingBag className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                        <p className="mb-3 text-sm text-muted-foreground">No orders yet</p>
                        <Link href="/">
                          <button className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">
                            Start Shopping
                          </button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-3 sm:space-y-4">
                        {recentOrders.map((order) => {
                          const orderId = order.id || order._id;
                          const rawItems = order.items;
                          const orderItems = Array.isArray(rawItems) ? rawItems : [];
                          const status = (order.status || order.orderStatus || "PENDING").toUpperCase();
                          const sc = orderStatusConfig[status] || orderStatusConfig.PENDING;
                          const StatusIcon = sc.icon;
                          const total = Number(order.total || 0);
                          const orderDate = order.createdAt || order.orderDate;
                          const orderNum = order.orderNumber || `#${String(orderId).slice(-8)}`;
                          const itemCount = orderItems.reduce(
                            (s: number, i: any) => s + (Number(i?.quantity) || 0),
                            0
                          ) || (order.itemCount || 0);
                          return (
                            <Link key={orderId} href={`/account/orders/${orderId}`}>
                              <div className="rounded-lg border p-3 transition-all hover:shadow-sm hover:border-indigo-200 sm:p-4">
                                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 sm:mb-3">
                                  <div>
                                    <p className="text-sm font-medium text-foreground">{orderNum}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatDate(orderDate, "MMM dd, yyyy")}
                                    </p>
                                  </div>
                                  <Badge className={sc.color}>
                                    <StatusIcon className="mr-1 h-3 w-3" />
                                    {sc.label}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3">
                                  <div className="flex flex-shrink-0 -space-x-2">
                                    {orderItems.length > 0 ? (
                                      orderItems.slice(0, 3).map((item: any, idx: number) => {
                                        const product = item.product || item;
                                        const rawImg = product.images;
                                        let imgUrl = "";
                                        if (Array.isArray(rawImg) && rawImg.length > 0) {
                                          imgUrl = typeof rawImg[0] === "string" ? rawImg[0] : (rawImg[0]?.url || "");
                                        } else if (typeof rawImg === "string" && rawImg) {
                                          try {
                                            const parsed = JSON.parse(rawImg);
                                            imgUrl = Array.isArray(parsed) ? (parsed[0]?.url || "") : "";
                                          } catch { /* ignore */ }
                                        }
                                        const name = product.name || "Product";
                                        return (
                                          <div
                                            key={idx}
                                            className="relative h-8 w-8 overflow-hidden rounded-lg border-2 border-white bg-gray-100 sm:h-10 sm:w-10"
                                          >
                                            {imgUrl ? (
                                              <img
                                                src={getImageUrl(imgUrl)}
                                                alt={name}
                                                className="h-full w-full object-cover"
                                                onError={(e) => { (e.target as HTMLImageElement).src = "/images/placeholder.svg"; }}
                                              />
                                            ) : (
                                              <div className="flex h-full w-full items-center justify-center bg-indigo-50 text-indigo-400 text-[10px] font-semibold">
                                                {name.charAt(0).toUpperCase()}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })
                                    ) : (
                                      <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-white bg-indigo-50 text-indigo-500 sm:h-10 sm:w-10">
                                        <Package className="h-4 w-4" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs text-muted-foreground sm:text-sm">
                                      {orderItems.length > 0
                                        ? orderItems.map((i: any) => i.product?.name || i.name || "Product").join(", ")
                                        : itemCount > 0
                                        ? `${itemCount} item${itemCount === 1 ? "" : "s"}`
                                        : "Tap to view order details"}
                                    </p>
                                  </div>
                                  <span className="flex-shrink-0 text-sm font-semibold text-foreground">
                                    {formatCurrency(total)}
                                  </span>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <LogOut className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-center">Sign out of your account?</DialogTitle>
            <DialogDescription className="text-center">
              You&apos;ll need to sign in again with your email or phone number to access your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button
              variant="outline"
              onClick={() => setLogoutDialogOpen(false)}
              disabled={loggingOut}
              className="sm:min-w-[120px]"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={performLogout}
              disabled={loggingOut}
              className="sm:min-w-[120px]"
            >
              {loggingOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing out...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Yes, sign out
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
