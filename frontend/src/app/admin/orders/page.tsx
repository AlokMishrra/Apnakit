"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Download,
  Calendar,
  Filter,
  ShoppingCart,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination } from "@/components/ui/pagination";
import { OrdersTable, Order } from "@/components/admin/orders-table";
import { formatCurrency } from "@/lib/utils";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, pendingOrders: 0, deliveredOrders: 0 });
  const itemsPerPage = 8;

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllOrders({ page: 1, limit: 200 });
      const ordersList = data?.data?.orders || data?.orders || data?.data || data || [];
      setOrders(Array.isArray(ordersList) ? ordersList : []);
      setStats({
        totalOrders: data?.meta?.total || ordersList.length,
        totalRevenue: ordersList.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0),
        pendingOrders: ordersList.filter((o: any) => o.status === "PENDING").length,
        deliveredOrders: ordersList.filter((o: any) => o.status === "DELIVERED").length,
      });
    } catch (error) {
      toast.error("Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (activeTab !== "all") {
      result = result.filter((order: any) => order.status === activeTab.toUpperCase());
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (order: any) =>
          (order.orderNumber || "").toLowerCase().includes(query) ||
          (order.customerName || "").toLowerCase().includes(query) ||
          (order.customerEmail || "").toLowerCase().includes(query)
      );
    }

    if (dateFrom) {
      result = result.filter(
        (order: any) => new Date(order.createdAt) >= new Date(dateFrom)
      );
    }
    if (dateTo) {
      result = result.filter(
        (order: any) => new Date(order.createdAt) <= new Date(dateTo)
      );
    }

    return result;
  }, [activeTab, searchQuery, dateFrom, dateTo, orders]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const statusTabs = [
    { value: "all", label: "All", count: orders.length },
    { value: "pending", label: "Pending", count: orders.filter((o: any) => o.status === "PENDING").length },
    { value: "confirmed", label: "Confirmed", count: orders.filter((o: any) => o.status === "CONFIRMED").length },
    { value: "shipped", label: "Shipped", count: orders.filter((o: any) => o.status === "SHIPPED").length },
    { value: "delivered", label: "Delivered", count: orders.filter((o: any) => o.status === "DELIVERED").length },
    { value: "cancelled", label: "Cancelled", count: orders.filter((o: any) => o.status === "CANCELLED").length },
    { value: "returned", label: "Returned", count: orders.filter((o: any) => o.status === "RETURNED").length },
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500">
            Manage and track all customer orders
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(stats.totalRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.pendingOrders}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Delivered</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.deliveredOrders}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by order #, customer name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-[140px]"
                  placeholder="From"
                />
                <span className="text-gray-400">-</span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-[140px]"
                  placeholder="To"
                />
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {filteredOrders.length} orders found
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto flex-wrap gap-1 bg-gray-100 p-1">
          {statusTabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="gap-1.5 px-3 py-1.5"
            >
              {tab.label}
              <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1 text-xs">
                {tab.count}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <OrdersTable orders={paginatedOrders} />

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
