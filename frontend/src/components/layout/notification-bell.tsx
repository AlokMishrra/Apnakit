"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Package,
  Tag,
  Headphones,
  Truck,
  CheckCircle2,
  ShoppingBag,
  Gift,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { notificationService } from "@/services/notification.service";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  status: string;
  metadata?: any;
  createdAt: string;
}

const typeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; link: string }> = {
  ORDER_PLACED: { icon: <ShoppingBag className="h-4 w-4" />, color: "text-blue-600", bg: "bg-blue-50", link: "/account/orders" },
  ORDER_STATUS: { icon: <Truck className="h-4 w-4" />, color: "text-purple-600", bg: "bg-purple-50", link: "/account/orders" },
  ORDER_DELIVERED: { icon: <CheckCircle2 className="h-4 w-4" />, color: "text-emerald-600", bg: "bg-emerald-50", link: "/account/orders" },
  OFFER: { icon: <Tag className="h-4 w-4" />, color: "text-rose-600", bg: "bg-rose-50", link: "/" },
  COUPON: { icon: <Gift className="h-4 w-4" />, color: "text-amber-600", bg: "bg-amber-50", link: "/" },
  SUPPORT: { icon: <Headphones className="h-4 w-4" />, color: "text-cyan-600", bg: "bg-cyan-50", link: "/account/support" },
  PRODUCT: { icon: <Package className="h-4 w-4" />, color: "text-indigo-600", bg: "bg-indigo-50", link: "/" },
  DEFAULT: { icon: <Bell className="h-4 w-4" />, color: "text-gray-600", bg: "bg-gray-50", link: "/account" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function NotificationBell() {
  const router = useRouter();
  const { user, isLoading } = useCurrentUser();
  const [open, setOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Only fetch when we have BOTH a user AND a valid access token.
  // This avoids 401 spam when Redux has a stale user but the token
  // has been cleared (e.g. after logout) or expired.
  const hasValidToken = React.useCallback(() => {
    if (typeof window === "undefined") return false;
    const t = window.localStorage.getItem("accessToken");
    return !!t && t.length > 0;
  }, []);

  const fetchNotifications = React.useCallback(async () => {
    if (!user || !hasValidToken()) return;
    try {
      setLoading(true);
      const res = await notificationService.getNotifications({ limit: 20 });
      const data = res?.data?.data || res?.data || res;
      const list = Array.isArray(data) ? data : data?.notifications || data?.items || [];
      setNotifications(list);
      setUnreadCount(list.filter((n: Notification) => n.status === "PENDING").length);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user, hasValidToken]);

  React.useEffect(() => {
    if (user && !isLoading && hasValidToken()) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user, isLoading, hasValidToken, fetchNotifications]);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleNotificationClick = async (n: Notification) => {
    if (n.status === "PENDING") {
      try {
        await notificationService.markAsRead(n.id);
        setNotifications((prev) =>
          prev.map((item) => (item.id === n.id ? { ...item, status: "SENT" } : item))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {}
    }
    const config = typeConfig[n.type] || typeConfig.DEFAULT;
    const link = n.metadata?.link || config.link;
    setOpen(false);
    if (link) router.push(link);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, status: "SENT" })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 z-40 bg-black/30 sm:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-x-3 top-16 z-50 max-h-[calc(100vh-5rem)] overflow-hidden rounded-xl border bg-white shadow-xl animate-in fade-in slide-in-from-top-2 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 sm:max-h-[480px]">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-xs text-muted-foreground">{unreadCount} new</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-indigo-600 hover:text-indigo-700"
                  onClick={handleMarkAllRead}
                >
                  <Check className="mr-1 h-3 w-3" />
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton variant="circular" className="h-9 w-9 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-2 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="mb-3 rounded-full bg-gray-100 p-3">
                  <Bell className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-foreground">No notifications yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  We'll notify you about offers, orders, and updates
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((n) => {
                  const config = typeConfig[n.type] || typeConfig.DEFAULT;
                  const isUnread = n.status === "PENDING";
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={cn(
                        "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50",
                        isUnread && "bg-indigo-50/40"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full",
                          config.bg
                        )}
                      >
                        <span className={config.color}>{config.icon}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              "text-sm line-clamp-1",
                              isUnread ? "font-semibold text-foreground" : "font-medium text-foreground"
                            )}
                          >
                            {n.title}
                          </p>
                          {isUnread && (
                            <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-indigo-600" />
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                          {n.message}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {timeAgo(n.createdAt)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t px-4 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-indigo-600 hover:text-indigo-700"
              onClick={() => {
                setOpen(false);
                router.push("/account/notifications");
              }}
            >
              View all notifications
            </Button>
          </div>
          </div>
        </>
      )}
    </div>
  );
}
