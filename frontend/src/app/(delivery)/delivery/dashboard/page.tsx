"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  CheckCircle2,
  Clock,
  Truck,
  IndianRupee,
  MapPin,
  ArrowRight,
  CircleDot,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deliveryService } from "@/services/delivery.service";
import { toast } from "sonner";

const statusConfig = {
  assigned: { label: "Assigned", variant: "default" as const },
  picked_up: { label: "Picked Up", variant: "warning" as const },
  in_transit: { label: "In Transit", variant: "default" as const },
  delivered: { label: "Delivered", variant: "success" as const },
  failed: { label: "Failed", variant: "destructive" as const },
};

export default function DeliveryDashboard() {
  const [isOnline, setIsOnline] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [todayOrders, setTodayOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          deliveryService.getStats(),
          deliveryService.getAssignments({ today: true }),
        ]);
        setStats(statsRes?.data || statsRes);
        const orders = Array.isArray(ordersRes?.data) ? ordersRes.data : (ordersRes?.data?.data || []);
        setTodayOrders(orders);
      } catch (err: any) {
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleToggleOnline = async () => {
    const newStatus = !isOnline;
    try {
      await deliveryService.updateAvailability(newStatus);
      setIsOnline(newStatus);
      toast.success(`You are now ${newStatus ? "online" : "offline"}`);
    } catch (err: any) {
      toast.error("Failed to update availability");
    }
  };

  const todayStats = stats
    ? [
        { label: "Assigned", value: stats.assigned ?? stats.assignedCount ?? 0, icon: Package, color: "text-blue-600", bg: "bg-blue-100" },
        { label: "Picked Up", value: stats.pickedUp ?? stats.pickedUpCount ?? 0, icon: Truck, color: "text-amber-600", bg: "bg-amber-100" },
        { label: "Delivered", value: stats.delivered ?? stats.deliveredCount ?? 0, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-100" },
        { label: "Pending", value: stats.pending ?? stats.pendingCount ?? 0, icon: Clock, color: "text-orange-600", bg: "bg-orange-100" },
        { label: "Earnings", value: formatCurrency(stats.earnings ?? stats.todayEarnings ?? 0), icon: IndianRupee, color: "text-purple-600", bg: "bg-purple-100" },
      ]
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="mt-3 text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Online/Offline big toggle */}
      <Card className="overflow-hidden">
        <div
          className={cn(
            "flex items-center justify-between p-4 transition-colors",
            isOnline ? "bg-emerald-50" : "bg-gray-100"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "h-3 w-3 rounded-full",
                isOnline ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
              )}
            />
            <div>
              <p className="font-semibold text-gray-900">
                {isOnline ? "You are Online" : "You are Offline"}
              </p>
              <p className="text-sm text-gray-500">
                {isOnline
                  ? "Ready to receive new orders"
                  : "Go online to start receiving orders"}
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleOnline}
            className={cn(
              "relative h-12 w-20 rounded-full transition-colors shadow-inner",
              isOnline ? "bg-emerald-500" : "bg-gray-300"
            )}
          >
            <span
              className={cn(
                "absolute top-1 h-10 w-10 rounded-full bg-white shadow-md transition-transform",
                isOnline ? "translate-x-9" : "translate-x-1"
              )}
            />
          </button>
        </div>
      </Card>

      {/* Today's Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {todayStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("rounded-lg p-2", stat.bg)}>
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Map placeholder */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Live Route Map</h2>
            <Link
              href="/delivery/route"
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              View Full Route
            </Link>
          </div>
          <div className="flex h-48 items-center justify-center rounded-lg bg-gray-100 border-2 border-dashed border-gray-300">
            <div className="text-center">
              <MapPin className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">
                Map view - {todayOrders.filter((o) => o.status !== "delivered").length} stops remaining
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Orders */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Today&apos;s Orders</h2>
            <Link
              href="/delivery/orders"
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {todayOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      order.status === "delivered"
                        ? "bg-emerald-100 text-emerald-700"
                        : order.status === "picked_up"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-blue-100 text-blue-700"
                    )}
                  >
                    {order.id.slice(-2)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {order.customer}
                      </p>
                      <Badge variant={statusConfig[order.status as keyof typeof statusConfig].variant}>
                        {statusConfig[order.status as keyof typeof statusConfig].label}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {order.address}
                    </p>
                    <p className="text-xs text-gray-400">
                      {order.items} items • {formatCurrency(order.amount)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  {order.status !== "delivered" && (
                    <Link href={`/delivery/orders/${order.id}`}>
                      <Button size="sm" variant="outline" className="h-8">
                        <CircleDot className="mr-1 h-3 w-3" />
                        Action
                      </Button>
                    </Link>
                  )}
                  {order.status === "delivered" && (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/delivery/orders">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-emerald-100 p-2">
                <Truck className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">View Orders</p>
                <p className="text-xs text-gray-500">Manage deliveries</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-gray-400" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/delivery/earnings">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-purple-100 p-2">
                <IndianRupee className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Earnings</p>
                <p className="text-xs text-gray-500">View payments</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-gray-400" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
