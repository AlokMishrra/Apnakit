"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Package,
  Tag,
  Headphones,
  Truck,
  CheckCircle2,
  ShoppingBag,
  Gift,
  Check,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { notificationService } from "@/services/notification.service";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const typeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  ORDER_PLACED: { icon: <ShoppingBag className="h-5 w-5" />, color: "text-blue-600", bg: "bg-blue-100", label: "Order" },
  ORDER_STATUS: { icon: <Truck className="h-5 w-5" />, color: "text-purple-600", bg: "bg-purple-100", label: "Order Update" },
  ORDER_DELIVERED: { icon: <CheckCircle2 className="h-5 w-5" />, color: "text-emerald-600", bg: "bg-emerald-100", label: "Delivered" },
  OFFER: { icon: <Tag className="h-5 w-5" />, color: "text-rose-600", bg: "bg-rose-100", label: "Offer" },
  COUPON: { icon: <Gift className="h-5 w-5" />, color: "text-amber-600", bg: "bg-amber-100", label: "Coupon" },
  SUPPORT: { icon: <Headphones className="h-5 w-5" />, color: "text-cyan-600", bg: "bg-cyan-100", label: "Support" },
  PRODUCT: { icon: <Package className="h-5 w-5" />, color: "text-indigo-600", bg: "bg-indigo-100", label: "Product" },
  DEFAULT: { icon: <Bell className="h-5 w-5" />, color: "text-gray-600", bg: "bg-gray-100", label: "Update" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useCurrentUser();
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<"all" | "unread">("all");

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const fetchNotifications = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await notificationService.getNotifications({ limit: 50 });
      const data = res?.data?.data || res?.data || res;
      const list = Array.isArray(data) ? data : data?.notifications || data?.items || [];
      setNotifications(list);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (user) fetchNotifications();
  }, [user, fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: "SENT" } : n))
      );
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, status: "SENT" })));
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  const handleClick = (n: any) => {
    if (n.status === "PENDING") handleMarkAsRead(n.id);
    const config = typeConfig[n.type] || typeConfig.DEFAULT;
    const link = n.metadata?.link || config.link || "/account";
    router.push(link);
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  const filtered = filter === "unread"
    ? notifications.filter((n) => n.status === "PENDING")
    : notifications;
  const unreadCount = notifications.filter((n) => n.status === "PENDING").length;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              href="/account"
              className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Account
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              <Check className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>

        <div className="mb-4 flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All ({notifications.length})
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("unread")}
          >
            Unread ({unreadCount})
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Skeleton variant="circular" className="h-10 w-10 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="mb-4 inline-flex rounded-full bg-gray-100 p-4">
                <Bell className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {filter === "unread" ? "No unread notifications" : "No notifications yet"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {filter === "unread"
                  ? "You're all caught up!"
                  : "We'll notify you about offers, orders, and important updates"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((n) => {
              const config = typeConfig[n.type] || typeConfig.DEFAULT;
              const isUnread = n.status === "PENDING";
              return (
                <Card
                  key={n.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    isUnread && "border-indigo-200 bg-indigo-50/30"
                  )}
                  onClick={() => handleClick(n)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full",
                          config.bg
                        )}
                      >
                        <span className={config.color}>{config.icon}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <p
                              className={cn(
                                "text-sm",
                                isUnread ? "font-semibold text-foreground" : "font-medium text-foreground"
                              )}
                            >
                              {n.title}
                            </p>
                            {isUnread && (
                              <Badge variant="default" className="h-4 px-1.5 text-[10px]">
                                New
                              </Badge>
                            )}
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            {config.label}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {n.message}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {timeAgo(n.createdAt)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
