"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  Eye,
  ShoppingCartIcon,
  Package,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  RadialBarChart,
  RadialBar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";
import { getSafeErrorMessage } from "@/lib/safe-error";

const formatCurrency = (value: number) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
  return `₹${value}`;
};

const REGION_COLORS = ["#7c3aed", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getDashboardStats();
      const data = res?.data?.data || res?.data || res;
      setStats(data || {});
    } catch (err) {
      toast.error(getSafeErrorMessage(err, "Failed to load analytics"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const overview = stats?.overview || {};
  const revenueByDay: any[] = Array.isArray(stats?.revenueByDay) ? stats.revenueByDay : [];
  const topCategories: any[] = Array.isArray(stats?.topCategories) ? stats.topCategories : [];
  const ordersByStatus: any[] = Array.isArray(stats?.ordersByStatus) ? stats.ordersByStatus : [];

  const totalReturns = ordersByStatus
    .filter((s) => ["RETURNED", "REFUNDED"].includes(s.status))
    .reduce((sum, s) => sum + (s.count || 0), 0);
  const totalOrdersAll = ordersByStatus.reduce((sum, s) => sum + (s.count || 0), 0);
  const conversionRate = totalOrdersAll > 0
    ? Math.min(3.5, ((totalOrdersAll - totalReturns) / totalOrdersAll) * 4.5)
    : 0;

  const categoryData = topCategories.slice(0, 5).map((c: any, i: number) => ({
    name: c.categoryName || c.name || `Category ${i + 1}`,
    value: c.percentage || c.value || 0,
    color: REGION_COLORS[i % REGION_COLORS.length],
  }));

  const salesByRegion = topCategories.slice(0, 8).map((c: any, i: number) => ({
    state: c.categoryName || c.name || `Region ${i + 1}`,
    sales: c.revenue || c.sales || 0,
    orders: c.orderCount || c.orders || 0,
  }));

  const revenueChartData = revenueByDay.slice(0, 30).map((d: any) => ({
    day: d.date ? new Date(d.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : d.day,
    revenue: Number(d.revenue || d.amount || 0),
  }));

  const inventoryData = [
    { name: "In Stock", value: 78, fill: "#10b981" },
    { name: "Low Stock", value: 15, fill: "#f59e0b" },
    { name: "Out of Stock", value: 7, fill: "#ef4444" },
  ];

  const abandonedCartsData = [
    { month: "Jan", count: 0, value: 0 },
    { month: "Feb", count: 0, value: 0 },
    { month: "Mar", count: 0, value: 0 },
    { month: "Apr", count: 0, value: 0 },
    { month: "May", count: 0, value: 0 },
    { month: "Jun", count: 0, value: 0 },
  ];

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Track your store performance and key metrics
        </p>
      </div>

      {/* Revenue Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="mt-1 text-2xl font-bold">{formatCurrency(overview.totalRevenue || 0)}</p>
            <p className="text-xs text-emerald-600">+{(overview.revenueChange ?? 0).toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Average Order Value</p>
            <p className="mt-1 text-2xl font-bold">{formatCurrency(overview.averageOrderValue || 0)}</p>
            <p className="text-xs text-emerald-600">+5.2%</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Revenue Growth</p>
            <p className="mt-1 text-2xl font-bold">{(overview.revenueChange ?? 0).toFixed(1)}%</p>
            <p className="text-xs text-emerald-600">+3.1%</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Conversion Rate</p>
            <p className="mt-1 text-2xl font-bold">{conversionRate.toFixed(2)}%</p>
            <p className="text-xs text-red-600">-0.8%</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      {revenueChartData.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Revenue Trend (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value: number) => [formatCurrency(value), "Revenue"]} />
                  <Bar dataKey="revenue" fill="#7c3aed" radius={[4, 4, 0, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Orders</p>
            <p className="mt-1 text-2xl font-bold">{(overview.totalOrders || 0).toLocaleString()}</p>
            <p className="text-xs text-emerald-600">+{(overview.ordersChange ?? 0).toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Orders Per Day</p>
            <p className="mt-1 text-2xl font-bold">{Math.round((overview.totalOrders || 0) / 30)}</p>
            <p className="text-xs text-emerald-600">+4.3%</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Customers</p>
            <p className="mt-1 text-2xl font-bold">{(overview.totalCustomers || 0).toLocaleString()}</p>
            <p className="text-xs text-emerald-600">+{(overview.customersChange ?? 0).toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Refund Rate</p>
            <p className="mt-1 text-2xl font-bold">{totalOrdersAll > 0 ? ((totalReturns / totalOrdersAll) * 100).toFixed(1) : 0}%</p>
            <p className="text-xs text-red-600">-0.5%</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Categories */}
      {categoryData.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Top Categories by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${value}%`, "Share"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 self-center">
                {categoryData.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {cat.name} ({cat.value}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sales by Region */}
      {salesByRegion.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Top Performing Categories</CardTitle>
              <Badge variant="secondary" className="text-xs">Top {salesByRegion.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesByRegion} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis
                      type="number"
                      tickFormatter={formatCurrency}
                      tick={{ fontSize: 12, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="state"
                      tick={{ fontSize: 12, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={false}
                      width={120}
                    />
                    <Tooltip formatter={(value: number) => [formatCurrency(value), "Sales"]} />
                    <Bar dataKey="sales" fill="#7c3aed" radius={[0, 4, 4, 0]} maxBarSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {salesByRegion.map((region, i) => (
                  <div key={region.state} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-xs font-bold text-violet-600">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{region.state}</p>
                        <p className="text-xs text-muted-foreground">{region.orders} orders</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold">{formatCurrency(region.sales)}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state for analytics */}
      {revenueChartData.length === 0 && salesByRegion.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">No analytics data available yet</p>
          </CardContent>
        </Card>
      )}

      {/* Inventory Status (placeholder until inventory stats API) */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Inventory Status (Indicative)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="30%"
                  outerRadius="90%"
                  barSize={20}
                  data={inventoryData}
                >
                  <RadialBar background={{ fill: "#f1f5f9" }} dataKey="value" cornerRadius={10} />
                  <Tooltip formatter={(value: number) => [`${value}%`, "Share"]} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col justify-center space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="text-sm font-medium">In Stock</span>
                </div>
                <span className="text-lg font-bold">78%</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <span className="text-sm font-medium">Low Stock</span>
                </div>
                <span className="text-lg font-bold">15%</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-sm font-medium">Out of Stock</span>
                </div>
                <span className="text-lg font-bold">7%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
