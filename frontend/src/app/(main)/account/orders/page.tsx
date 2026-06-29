"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  Eye,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  MapPin,
  CreditCard,
  Loader2,
  PackageX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, getImageUrl } from "@/lib/utils";
import { orderService } from "@/services/order.service";
import { getSafeErrorMessage, isAuthError } from "@/lib/safe-error";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: "Pending", color: "bg-blue-100 text-blue-700", icon: Clock },
  CONFIRMED: { label: "Confirmed", color: "bg-indigo-100 text-indigo-700", icon: CheckCircle2 },
  PROCESSING: { label: "Processing", color: "bg-amber-100 text-amber-700", icon: Package },
  PACKED: { label: "Packed", color: "bg-cyan-100 text-cyan-700", icon: Package },
  SHIPPED: { label: "Shipped", color: "bg-purple-100 text-purple-700", icon: Truck },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", color: "bg-indigo-100 text-indigo-700", icon: Truck },
  DELIVERED: { label: "Delivered", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-700", icon: XCircle },
  RETURNED: { label: "Returned", color: "bg-orange-100 text-orange-700", icon: RotateCcw },
  REFUNDED: { label: "Refunded", color: "bg-gray-100 text-gray-700", icon: RotateCcw },
};

const filterTabs = [
  { value: "all", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "RETURNED", label: "Returned" },
];

function OrderCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-16 w-16 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await orderService.getOrders({ limit: 50 });
      const data = res?.data?.data || res?.data || res;
      const list = Array.isArray(data) ? data : (data?.orders || []);
      setOrders(list);
    } catch (err: any) {
      if (isAuthError(err)) {
        toast.error("Please login to view orders");
        router.push("/login");
        return;
      }
      toast.error("Failed to load orders", { description: getSafeErrorMessage(err) });
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    if (activeTab === "all") return orders;
    return orders.filter((o) => o.status === activeTab);
  }, [orders, activeTab]);

  const toggleExpand = useCallback((orderId: string) => {
    setExpandedOrder((prev) => (prev === orderId ? null : orderId));
  }, []);

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    try {
      setCancellingId(orderId);
      await orderService.cancelOrder(orderId);
      toast.success("Order cancelled", { description: "Your order has been cancelled" });
      fetchOrders();
    } catch (err: any) {
      toast.error("Failed to cancel order", { description: getSafeErrorMessage(err) });
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="mb-6 text-2xl font-bold text-foreground">My Orders</h1>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <OrderCardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-2xl font-bold text-foreground">My Orders</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 w-full justify-start overflow-x-auto">
            {filterTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="px-4">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab}>
            {filteredOrders.length === 0 ? (
              <Card>
                <CardContent className="py-16">
                  <div className="flex flex-col items-center justify-center text-center">
                    <ShoppingBag className="mb-4 h-12 w-12 text-muted-foreground/50" />
                    <h3 className="text-lg font-semibold text-foreground">No orders found</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {activeTab === "all" ? "Start shopping to see your orders here" : `No ${activeTab.toLowerCase()} orders`}
                    </p>
                    <Link href="/">
                      <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700">Start Shopping</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const orderId = order.id || order._id;
                  const status = (order.status || "PENDING").toUpperCase();
                  const sc = statusConfig[status] || statusConfig.PENDING;
                  const StatusIcon = sc.icon;
                  const orderItems = Array.isArray(order.items) ? order.items : [];
                  const total = Number(order.total || 0);
                  const orderDate = order.createdAt || order.orderDate;
                  const isExpanded = expandedOrder === orderId;
                  const isCancellable = ["PENDING", "CONFIRMED"].includes(status);
                  return (
                    <Card key={orderId} className="overflow-hidden">
                      <CardContent className="p-0">
                        {/* Order Header */}
                        <div
                          className="flex cursor-pointer items-center justify-between p-4 hover:bg-gray-50 sm:p-6"
                          onClick={() => toggleExpand(orderId)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-medium text-foreground">
                                {order.orderNumber || `#${orderId.slice(-8)}`}
                              </p>
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${sc.color}`}>
                                {sc.label}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatDate(orderDate, "MMM dd, yyyy 'at' hh:mm a")} · {orderItems.length} item{orderItems.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-base font-semibold text-foreground">{formatCurrency(total)}</p>
                            <p className="text-xs text-muted-foreground">{order.paymentMethod || "—"}</p>
                          </div>
                        </div>

                        {/* Items Preview */}
                        {orderItems.length > 0 && (
                          <div className="border-t bg-gray-50/50 px-4 py-3 sm:px-6">
                            <div className="flex items-center gap-2 overflow-x-auto">
                              {orderItems.slice(0, 4).map((item: any, idx: number) => {
                                const product = item.product || item;
                                const image = product.images?.[0]?.url || product.images?.[0] || item.image;
                                const name = product.name || "Product";
                                return (
                                  <div key={idx} className="flex-shrink-0">
                                    {image ? (
                                      <img
                                        src={getImageUrl(image)}
                                        alt={name}
                                        className="h-12 w-12 rounded-lg object-cover"
                                        onError={(e) => { (e.target as HTMLImageElement).src = "/images/placeholder.svg"; }}
                                      />
                                    ) : (
                                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-200 text-lg">📦</div>
                                    )}
                                  </div>
                                );
                              })}
                              {orderItems.length > 4 && (
                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gray-200 text-xs font-medium text-gray-600">
                                  +{orderItems.length - 4}
                                </div>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="ml-auto"
                                onClick={(e) => { e.stopPropagation(); toggleExpand(orderId); }}
                              >
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                <span className="ml-1 hidden sm:inline">{isExpanded ? "Hide" : "View"} Details</span>
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="border-t bg-white p-4 sm:p-6">
                            <div className="space-y-3">
                              {orderItems.map((item: any, idx: number) => {
                                const product = item.product || item;
                                const image = product.images?.[0]?.url || product.images?.[0] || item.image;
                                const name = product.name || "Product";
                                const qty = item.quantity || 1;
                                const price = Number(item.price || product.minPrice || 0);
                                return (
                                  <div key={idx} className="flex gap-3 rounded-lg border p-3">
                                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                      {image ? (
                                        <img
                                          src={getImageUrl(image)}
                                          alt={name}
                                          className="h-full w-full object-cover"
                                          onError={(e) => { (e.target as HTMLImageElement).src = "/images/placeholder.svg"; }}
                                        />
                                      ) : (
                                        <div className="flex h-full items-center justify-center text-xl">📦</div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <Link href={`/product/${product.slug || ""}`} className="text-sm font-medium text-foreground hover:text-indigo-600 line-clamp-1">
                                        {name}
                                      </Link>
                                      {item.variant?.name && (
                                        <p className="text-xs text-muted-foreground">{item.variant.name}</p>
                                      )}
                                      <div className="mt-1 flex items-center justify-between">
                                        <p className="text-xs text-muted-foreground">Qty: {qty}</p>
                                        <p className="text-sm font-semibold text-foreground">{formatCurrency(price * qty)}</p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <Separator className="my-4" />

                            <div className="space-y-2 text-sm">
                              {order.shippingAddress && (
                                <div className="flex items-start gap-2">
                                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium text-foreground">
                                      {order.shippingAddress.fullName || order.shippingAddress.name}
                                    </p>
                                    <p className="text-muted-foreground">
                                      {order.shippingAddress.street || order.shippingAddress.addressLine1}
                                      {order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ""}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                                    </p>
                                    {order.shippingAddress.phone && (
                                      <p className="text-muted-foreground">Phone: {order.shippingAddress.phone}</p>
                                    )}
                                  </div>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">{order.paymentMethod || "—"}</span>
                              </div>
                            </div>

                            <Separator className="my-4" />

                            <div className="flex flex-wrap gap-2">
                              <Link href={`/account/orders/${orderId}`} className="flex-1 sm:flex-none">
                                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                                  <Eye className="mr-1 h-4 w-4" />
                                  View Details
                                </Button>
                              </Link>
                              {isCancellable && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600"
                                  onClick={() => handleCancelOrder(orderId)}
                                  disabled={cancellingId === orderId}
                                >
                                  {cancellingId === orderId ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <XCircle className="mr-1 h-4 w-4" />}
                                  Cancel Order
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
