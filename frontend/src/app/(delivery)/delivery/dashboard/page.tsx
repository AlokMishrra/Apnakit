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
  Plus,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deliveryService } from "@/services/delivery.service";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; variant: "default" | "warning" | "success" | "destructive" | "secondary" }> = {
  ASSIGNED: { label: "Assigned", variant: "default" },
  PICKED_UP: { label: "Picked Up", variant: "warning" },
  IN_TRANSIT: { label: "In Transit", variant: "default" },
  DELIVERED: { label: "Delivered", variant: "success" },
  FAILED: { label: "Failed", variant: "destructive" },
  AVAILABLE: { label: "Available", variant: "secondary" },
};

export default function DeliveryDashboard() {
  const [isOnline, setIsOnline] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [assignedOrders, setAssignedOrders] = useState<any[]>([]);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, assignedRes, availableRes] = await Promise.all([
          deliveryService.getStats(),
          deliveryService.getAssignments({ limit: 10 }),
          deliveryService.getAvailableOrders({ limit: 10 }),
        ]);
        setStats(statsRes?.data || statsRes);
        const assigned = Array.isArray(assignedRes?.data) ? assignedRes.data : (assignedRes?.data?.data || []);
        setAssignedOrders(assigned);
        const available = Array.isArray(availableRes?.data) ? availableRes.data : (availableRes?.data?.data || []);
        setAvailableOrders(available);
        if (statsRes?.data?.isAvailable !== undefined) {
          setIsOnline(statsRes.data.isAvailable);
        } else if (statsRes?.isAvailable !== undefined) {
          setIsOnline(statsRes.isAvailable);
        }
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

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await deliveryService.acceptOrder(orderId);
      toast.success("Order accepted!");
      const availableRes = await deliveryService.getAvailableOrders({ limit: 10 });
      const available = Array.isArray(availableRes?.data) ? availableRes.data : (availableRes?.data?.data || []);
      setAvailableOrders(available);
      const assignedRes = await deliveryService.getAssignments({ limit: 10 });
      const assigned = Array.isArray(assignedRes?.data) ? assignedRes.data : (assignedRes?.data?.data || []);
      setAssignedOrders(assigned);
    } catch (err: any) {
      toast.error("Failed to accept order");
    }
  };

  const allOrders = [...assignedOrders, ...availableOrders];
  const todayStats = stats
    ? [
        { label: "Assigned", value: stats.assigned ?? 0, icon: Package, color: "text-blue-600", bg: "bg-blue-100" },
        { label: "Picked Up", value: stats.pickedUp ?? 0, icon: Truck, color: "text-amber-600", bg: "bg-amber-100" },
        { label: "Delivered", value: stats.delivered ?? 0, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-100" },
        { label: "Available", value: availableOrders.length, icon: Clock, color: "text-orange-600", bg: "bg-orange-100" },
        { label: "Today ₹", value: formatCurrency(stats.todayEarnings ?? 0), icon: IndianRupee, color: "text-purple-600", bg: "bg-purple-100" },
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
      {/* Online/Offline toggle */}
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
                {isOnline ? "Ready to receive new orders" : "Go online to start receiving orders"}
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleOnline}
            role="switch"
            aria-checked={isOnline}
            className={cn(
              "relative inline-flex h-10 w-[72px] flex-shrink-0 cursor-pointer items-center rounded-full transition-colors shadow-inner",
              isOnline ? "bg-emerald-500" : "bg-gray-300"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-8 w-8 rounded-full bg-white shadow-lg ring-0 transition-transform",
                isOnline ? "translate-x-[34px]" : "translate-x-[2px]"
              )}
            />
          </button>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {todayStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("rounded-lg p-2", stat.bg)}>
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Available Orders (unassigned) */}
      {availableOrders.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Plus className="h-4 w-4 text-amber-600" />
                Available Orders ({availableOrders.length})
              </h2>
            </div>
            <div className="space-y-3">
              {availableOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between rounded-lg border bg-white p-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                      {(order.orderNumber || order.id || "").slice(-2)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{order.customer}</p>
                      <p className="text-xs text-gray-500 truncate">{order.address}</p>
                      <p className="text-xs text-gray-400">
                        {order.itemCount || order.items?.length || 0} items • {formatCurrency(order.total)}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="ml-3 bg-emerald-600 hover:bg-emerald-700 shrink-0"
                    onClick={() => handleAcceptOrder(order.orderId || order.id)}
                  >
                    Accept
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Assigned Orders */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">My Orders</h2>
            <Link href="/delivery/orders" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {assignedOrders.length === 0 && (
              <p className="text-center text-sm text-gray-500 py-4">No orders assigned yet</p>
            )}
            {assignedOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      order.status === "DELIVERED"
                        ? "bg-emerald-100 text-emerald-700"
                        : order.status === "PICKED_UP"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-blue-100 text-blue-700"
                    )}
                  >
                    {(order.orderNumber || order.id || "").slice(-2)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">{order.customer}</p>
                      <Badge variant={statusConfig[order.status]?.variant || "default"}>
                        {statusConfig[order.status]?.label || order.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{order.address}</p>
                    <p className="text-xs text-gray-400">
                      {order.itemCount || order.items?.length || 0} items • {formatCurrency(order.total)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  {order.status !== "DELIVERED" && (
                    <Link href={`/delivery/orders/${order.id}`}>
                      <Button size="sm" variant="outline" className="h-8">
                        <CircleDot className="mr-1 h-3 w-3" />
                        Action
                      </Button>
                    </Link>
                  )}
                  {order.status === "DELIVERED" && (
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
                <p className="font-medium text-gray-900">My Orders</p>
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
