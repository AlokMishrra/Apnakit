"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Eye,
  Navigation,
  Phone,
  Package,
  Filter,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deliveryService } from "@/services/delivery.service";
import { toast } from "sonner";

const statusFilters = ["All", "Assigned", "Picked Up", "In Transit", "Delivered"] as const;
type StatusFilter = (typeof statusFilters)[number];

const filterMap: Record<StatusFilter, string | null> = {
  All: null,
  Assigned: "assigned",
  "Picked Up": "picked_up",
  "In Transit": "in_transit",
  Delivered: "delivered",
};

const statusConfig: Record<string, { label: string; variant: "default" | "warning" | "success" | "destructive" | "secondary" }> = {
  assigned: { label: "Assigned", variant: "default" },
  picked_up: { label: "Picked Up", variant: "warning" },
  in_transit: { label: "In Transit", variant: "default" },
  delivered: { label: "Delivered", variant: "success" },
  failed: { label: "Failed", variant: "destructive" },
};

export default function OrdersPage() {
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("All");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await deliveryService.getAssignments(
          filterMap[activeFilter] ? { status: filterMap[activeFilter] } : undefined
        );
        const items = Array.isArray(res?.data) ? res.data : (res?.data?.data || []);
        setOrders(items);
      } catch (err: any) {
        toast.error("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };
    setLoading(true);
    fetchOrders();
  }, [activeFilter]);

  const filteredOrders =
    filterMap[activeFilter] === null
      ? orders
      : orders.filter((o) => o.status === filterMap[activeFilter]);

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
        {statusFilters.map((filter) => (
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
            {filter !== "All" && (
              <span className="ml-1">
                ({orders.filter((o) => o.status === filterMap[filter]).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm text-gray-500">No orders found</p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Header */}
                <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">
                      {order.id}
                    </span>
                    <Badge variant={statusConfig[order.status]?.variant || "default"}>
                      {statusConfig[order.status]?.label || order.status}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-500">{order.assignedAt}</span>
                </div>

                {/* Body */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900">
                        {order.customer}
                      </p>
                      <p className="mt-0.5 text-sm text-gray-500 truncate">
                        {order.address}
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                        <span>{order.items.length} item(s)</span>
                        <span>•</span>
                        <span>{order.distance}</span>
                        <span>•</span>
                        <span className="font-medium text-gray-700">
                          {formatCurrency(order.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={`/delivery/orders/${order.id}`}>
                      <Button size="sm" variant="outline" className="h-8">
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        View Details
                      </Button>
                    </Link>
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
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() =>
                        window.open(`tel:${order.phone}`, "_self")
                      }
                    >
                      <Phone className="mr-1 h-3.5 w-3.5" />
                      Call
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
