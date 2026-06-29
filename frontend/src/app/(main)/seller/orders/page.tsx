"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { sellerService } from "@/services/seller.service";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import {
  Search,
  MoreHorizontal,
  Eye,
  Printer,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Filter,
  Loader2,
} from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-blue-100 text-blue-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-amber-100 text-amber-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusIcons: Record<string, typeof Clock> = {
  pending: Clock,
  confirmed: Clock,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
};

export default function SellerOrdersPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await sellerService.getOrders({ page: 1, limit: 100 });
      const data = res?.data?.data || res?.data || [];
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, status: string) => {
    try {
      await sellerService.updateOrderStatus(orderId, status);
      toast.success("Order status updated");
      fetchOrders();
    } catch {
      toast.error("Failed to update order status");
    }
  };

  const filteredOrders = orders.filter((order: any) => {
    const orderStatus = order.orderStatus || order.status || "pending";
    const matchesTab = activeTab === "all" || orderStatus === activeTab;
    const orderNum = order.orderNumber || order.id || "";
    const customerName = order.user?.name || order.customerName || order.customer || "";
    const matchesSearch =
      orderNum.toLowerCase().includes(search.toLowerCase()) ||
      customerName.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const statusTabs = [
    { value: "all", label: "All", count: orders.length },
    { value: "pending", label: "Pending", count: orders.filter((o: any) => (o.orderStatus || o.status) === "pending").length },
    { value: "processing", label: "Processing", count: orders.filter((o: any) => (o.orderStatus || o.status) === "processing").length },
    { value: "shipped", label: "Shipped", count: orders.filter((o: any) => (o.orderStatus || o.status) === "shipped").length },
    { value: "delivered", label: "Delivered", count: orders.filter((o: any) => (o.orderStatus || o.status) === "delivered").length },
    { value: "cancelled", label: "Cancelled", count: orders.filter((o: any) => (o.orderStatus || o.status) === "cancelled").length },
  ];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-muted-foreground">Manage and fulfill your orders</p>
        </div>
        <Button variant="outline">
          <Printer className="h-4 w-4 mr-2" />
          Print Invoices
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 border-b">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order ID or customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Order ID
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Customer
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">
                    Items
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Total
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">
                    Date
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order: any) => {
                  const orderId = order._id || order.id;
                  const orderNum = order.orderNumber || orderId;
                  const orderStatus = order.orderStatus || order.status || "pending";
                  const customerName = order.user?.name || order.customerName || order.customer || "Customer";
                  const StatusIcon = statusIcons[orderStatus] || Clock;
                  return (
                    <tr key={orderId} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <p className="text-sm font-medium">{orderNum}</p>
                      </td>
                      <td className="py-3 px-4 text-sm">{customerName}</td>
                      <td className="py-3 px-4 text-sm hidden md:table-cell">
                        {(order.items || []).length} item(s)
                      </td>
                      <td className="py-3 px-4 text-sm font-medium">
                        {formatCurrency(order.total || 0)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full capitalize ${
                            statusColors[orderStatus] || ""
                          }`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {orderStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground hidden sm:table-cell">
                        {formatDate(order.createdAt || order.date, "MMM dd, yyyy")}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedOrder(order);
                                setDetailOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {orderStatus === "pending" && (
                              <DropdownMenuItem onClick={() => handleStatusUpdate(orderId, "processing")}>
                                <Package className="h-4 w-4 mr-2" />
                                Mark Processing
                              </DropdownMenuItem>
                            )}
                            {orderStatus === "processing" && (
                              <DropdownMenuItem onClick={() => handleStatusUpdate(orderId, "shipped")}>
                                <Truck className="h-4 w-4 mr-2" />
                                Mark Shipped
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleStatusUpdate(orderId, "cancelled")}>
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel Order
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-muted-foreground">No orders found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.orderNumber || selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedOrder.user?.name || selectedOrder.customerName || "Customer"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {formatDate(selectedOrder.createdAt || selectedOrder.date, "MMM dd, yyyy HH:mm")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment</p>
                  <p className="font-medium">{selectedOrder.paymentMethod || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <span
                    className={`text-xs px-2 py-1 rounded-full capitalize ${
                      statusColors[selectedOrder.orderStatus || selectedOrder.status] || ""
                    }`}
                  >
                    {selectedOrder.orderStatus || selectedOrder.status}
                  </span>
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-3">Items</p>
                {(selectedOrder.items || []).map((item: any, i: number) => (
                  <div key={i} className="flex justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm">{item.product?.name || item.name || "Product"}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium">{formatCurrency(item.price * item.quantity || item.totalPrice || 0)}</p>
                  </div>
                ))}
                <div className="flex justify-between pt-3 font-medium">
                  <span>Total</span>
                  <span>{formatCurrency(selectedOrder.total || 0)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
