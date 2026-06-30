"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Eye,
  Navigation,
  Phone,
  Package,
  Filter,
  Plus,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deliveryService } from "@/services/delivery.service";
import { toast } from "sonner";

const statusFilters = ["All", "Available", "Assigned", "Picked Up", "In Transit", "Delivered"] as const;
type StatusFilter = (typeof statusFilters)[number];

const filterMap: Record<StatusFilter, string | null> = {
  All: null,
  Available: "AVAILABLE",
  Assigned: "ASSIGNED",
  "Picked Up": "PICKED_UP",
  "In Transit": "IN_TRANSIT",
  Delivered: "DELIVERED",
};

const statusConfig: Record<string, { label: string; variant: "default" | "warning" | "success" | "destructive" | "secondary" }> = {
  ASSIGNED: { label: "Assigned", variant: "default" },
  PICKED_UP: { label: "Picked Up", variant: "warning" },
  IN_TRANSIT: { label: "In Transit", variant: "default" },
  DELIVERED: { label: "Delivered", variant: "success" },
  FAILED: { label: "Failed", variant: "destructive" },
  AVAILABLE: { label: "Available", variant: "secondary" },
};

export default function OrdersPage() {
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("All");
  const [assignedOrders, setAssignedOrders] = useState<any[]>([]);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const [assignedRes, availableRes] = await Promise.all([
          deliveryService.getAssignments(
            filterMap[activeFilter] && filterMap[activeFilter] !== "AVAILABLE"
              ? { status: filterMap[activeFilter] }
              : undefined
          ),
          deliveryService.getAvailableOrders({ limit: 50 }),
        ]);
        const assigned = Array.isArray(assignedRes?.data) ? assignedRes.data : (assignedRes?.data?.data || []);
        setAssignedOrders(assigned);
        const available = Array.isArray(availableRes?.data) ? availableRes.data : (availableRes?.data?.data || []);
        setAvailableOrders(available);
      } catch (err: any) {
        toast.error("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };
    setLoading(true);
    fetchOrders();
  }, [activeFilter]);

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await deliveryService.acceptOrder(orderId);
      toast.success("Order accepted!");
      setAvailableOrders((prev) => prev.filter((o) => (o.orderId || o.id) !== orderId));
      const assignedRes = await deliveryService.getAssignments({ limit: 50 });
      const assigned = Array.isArray(assignedRes?.data) ? assignedRes.data : (assignedRes?.data?.data || []);
      setAssignedOrders(assigned);
    } catch (err: any) {
      toast.error("Failed to accept order");
    }
  };

  let displayOrders: any[] = [];
  if (activeFilter === "All") {
    displayOrders = [...availableOrders, ...assignedOrders];
  } else if (activeFilter === "Available") {
    displayOrders = availableOrders;
  } else {
    displayOrders = assignedOrders.filter(
      (o) => o.status === filterMap[activeFilter]
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="mt-3 text-sm text-gray-500">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Filter className="h-4 w-4 shrink-0 text-gray-400" />
        {statusFilters.map((filter) => {
          const filterVal = filterMap[filter];
          let count = 0;
          if (filter === "All") count = availableOrders.length + assignedOrders.length;
          else if (filter === "Available") count = availableOrders.length;
          else count = assignedOrders.filter((o) => o.status === filterVal).length;
          return (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                activeFilter === filter
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {filter}
              <span className="ml-1">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {displayOrders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm text-gray-500">No orders found</p>
            </CardContent>
          </Card>
        ) : (
          displayOrders.map((order) => {
            const isAvailable = order.status === "AVAILABLE";
            return (
              <Card key={order.id} className={cn("overflow-hidden", isAvailable && "border-amber-200 bg-amber-50/30")}>
                <CardContent className="p-0">
                  <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">
                        {order.orderNumber || order.id?.slice(-8)}
                      </span>
                      <Badge variant={statusConfig[order.status]?.variant || "default"}>
                        {statusConfig[order.status]?.label || order.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500">
                      {order.assignedAt
                        ? new Date(order.assignedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                        : order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                        : ""}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900">{order.customer}</p>
                        <p className="mt-0.5 text-sm text-gray-500 truncate">{order.address}</p>
                        <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                          <span>{order.itemCount || order.items?.length || 0} item(s)</span>
                          <span>•</span>
                          <span className="font-medium text-gray-700">{formatCurrency(order.total)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {isAvailable ? (
                        <Button
                          size="sm"
                          className="h-8 bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => handleAcceptOrder(order.orderId || order.id)}
                        >
                          <Plus className="mr-1 h-3.5 w-3.5" />
                          Accept Order
                        </Button>
                      ) : (
                        <Link href={`/delivery/orders/${order.id}`}>
                          <Button size="sm" variant="outline" className="h-8">
                            <Eye className="mr-1 h-3.5 w-3.5" />
                            View Details
                          </Button>
                        </Link>
                      )}
                      {order.address && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() =>
                            window.open(
                              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`,
                              "_blank"
                            )
                          }
                        >
                          <Navigation className="mr-1 h-3.5 w-3.5" />
                          Navigate
                        </Button>
                      )}
                      {order.phone && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => window.open(`tel:${order.phone}`, "_self")}
                        >
                          <Phone className="mr-1 h-3.5 w-3.5" />
                          Call
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
