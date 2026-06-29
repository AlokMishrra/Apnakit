"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { sellerService } from "@/services/seller.service";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  ShoppingCart,
  Package,
  Star,
  Clock,
  ArrowUpRight,
  AlertTriangle,
  Plus,
  Eye,
  Truck,
  CheckCircle,
} from "lucide-react";

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  processing: "bg-amber-100 text-amber-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function SellerDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await sellerService.getDashboard();
      setDashboardData(data);
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
      setDashboardData({ stats: {}, salesChart: [], recentOrders: [], lowStockProducts: [], performanceMetrics: {} });
    } finally {
      setLoading(false);
    }
  };

  const sellerStats = dashboardData?.stats || {};
  const salesChartData = dashboardData?.salesChart || [];
  const recentOrders = dashboardData?.recentOrders || [];
  const lowStockProducts = dashboardData?.lowStockProducts || [];
  const performanceMetrics = dashboardData?.performanceMetrics || {};

  const stats = [
    {
      label: "Total Sales",
      value: formatCurrency(sellerStats.totalSales || 0),
      change: "+12.5%",
      trend: "up" as const,
      icon: IndianRupee,
      color: "bg-emerald-500",
    },
    {
      label: "Total Orders",
      value: (sellerStats.totalOrders || 0).toLocaleString(),
      change: "+8.2%",
      trend: "up" as const,
      icon: ShoppingCart,
      color: "bg-blue-500",
    },
    {
      label: "Pending Orders",
      value: (sellerStats.pendingOrders || 0).toString(),
      change: "-5.1%",
      trend: "down" as const,
      icon: Clock,
      color: "bg-amber-500",
    },
    {
      label: "Active Products",
      value: (sellerStats.activeProducts || 0).toString(),
      change: "+3",
      trend: "up" as const,
      icon: Package,
      color: "bg-purple-500",
    },
    {
      label: "Avg. Rating",
      value: (sellerStats.averageRating || 0).toString(),
      change: "+0.2",
      trend: "up" as const,
      icon: Star,
      color: "bg-yellow-500",
    },
  ];

  const maxSales = salesChartData.length > 0 ? Math.max(...salesChartData.map((d: any) => d.sales)) : 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s your store overview.
          </p>
        </div>
        <Link href="/seller/products/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {stat.trend === "up" ? (
                      <TrendingUp className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        stat.trend === "up" ? "text-emerald-500" : "text-red-500"
                      }`}
                    >
                      {stat.change}
                    </span>
                    <span className="text-xs text-muted-foreground">vs last month</span>
                  </div>
                </div>
                <div className={`${stat.color} p-2 rounded-lg text-white`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Sales Overview (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-48">
              {salesChartData.map((data: any, index: number) => (
                <div
                  key={index}
                  className="flex-1 bg-primary/20 hover:bg-primary/40 transition-colors rounded-t relative group"
                  style={{ height: `${(data.sales / maxSales) * 100}%` }}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                      {formatCurrency(data.sales)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{salesChartData[0]?.date || ""}</span>
              <span>{salesChartData[salesChartData.length - 1]?.date || ""}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/seller/orders?tab=new">
              <Button variant="outline" className="w-full justify-start">
                <Clock className="h-4 w-4 mr-2" />
                View Pending Orders
                <Badge variant="destructive" className="ml-auto">
                  {sellerStats.pendingOrders || 0}
                </Badge>
              </Button>
            </Link>
            <Link href="/seller/products?stock=low">
              <Button variant="outline" className="w-full justify-start">
                <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                Low Stock Alert
                <Badge variant="warning" className="ml-auto">
                  {sellerStats.lowStockProducts || 0}
                </Badge>
              </Button>
            </Link>
            <Link href="/seller/products/new">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Add New Product
              </Button>
            </Link>
            <Link href="/seller/analytics">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Orders</CardTitle>
            <Link href="/seller/orders" className="text-sm text-primary hover:underline">
              View All
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.slice(0, 5).map((order: any) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{order.id}</p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                          statusColors[order.status]
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {order.customer} - {(order.items || []).length} item(s)
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-sm font-medium">{formatCurrency(order.total || 0)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(order.date || new Date(), "MMM dd, HH:mm")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(performanceMetrics).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                  <span className="text-sm font-medium">{String(value ?? "")}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Low Stock Alert</CardTitle>
          <Link href="/seller/products?stock=low" className="text-sm text-primary hover:underline">
            View All
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {lowStockProducts.map((product: any) => (
              <div
                key={product.sku}
                className="border rounded-lg p-4 space-y-2"
              >
                <p className="text-sm font-medium truncate">{product.name}</p>
                <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-semibold ${
                      product.stock === 0 ? "text-red-500" : "text-amber-500"
                    }`}
                  >
                    {product.stock === 0 ? "Out of Stock" : `${product.stock} units`}
                  </span>
                  <Button variant="outline" size="sm">
                    Restock
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
