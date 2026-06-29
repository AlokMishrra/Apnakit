"use client";

import { useState, useEffect } from "react";
import {
  IndianRupee,
  ShoppingCart,
  Users,
  Package,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { StatsCard } from "@/components/admin/stats-card";
import { RevenueChart } from "@/components/admin/charts/revenue-chart";
import { OrdersChart } from "@/components/admin/charts/orders-chart";
import { CategoryChart } from "@/components/admin/charts/category-chart";
import { CustomerGrowthChart } from "@/components/admin/charts/customer-growth-chart";
import { RecentOrdersTable } from "@/components/admin/recent-orders-table";
import { TopSellingProducts } from "@/components/admin/top-selling-products";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";

const dateRanges = ["Today", "7 days", "30 days", "90 days", "Custom"] as const;
type DateRange = (typeof dateRanges)[number];

export default function AdminDashboard() {
  const [activeRange, setActiveRange] = useState<DateRange>("30 days");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await adminService.getDashboardStats();
        setStats(res?.data?.data || res?.data || null);
      } catch {
        toast.error("Failed to load dashboard stats");
        setStats(null);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back! Here&apos;s what&apos;s happening with your store.
          </p>
        </div>

        <div className="flex flex-wrap gap-1 rounded-lg bg-gray-100 p-1">
          {dateRanges.map((range) => (
            <button
              key={range}
              onClick={() => setActiveRange(range)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                activeRange === range
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Revenue"
              value={formatCurrency(stats?.totalRevenue ?? 3215000)}
              change={stats?.revenueChange ?? 12.5}
              icon={IndianRupee}
              iconColor="text-emerald-600"
              iconBg="bg-emerald-100"
            />
            <StatsCard
              title="Total Orders"
              value={String(stats?.totalOrders ?? 1248)}
              change={stats?.ordersChange ?? 8.2}
              icon={ShoppingCart}
              iconColor="text-blue-600"
              iconBg="bg-blue-100"
            />
            <StatsCard
              title="Total Customers"
              value={String(stats?.totalCustomers ?? 3250)}
              change={stats?.customersChange ?? 15.3}
              icon={Users}
              iconColor="text-purple-600"
              iconBg="bg-purple-100"
            />
            <StatsCard
              title="Total Products"
              value={String(stats?.totalProducts ?? 486)}
              change={stats?.productsChange ?? -2.1}
              icon={Package}
              iconColor="text-amber-600"
              iconBg="bg-amber-100"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <RevenueChart data={stats?.revenueData} />
            <OrdersChart data={stats?.ordersData} />
          </div>

          <RecentOrdersTable data={stats?.recentOrders} />

          <div className="grid gap-6 lg:grid-cols-2">
            <TopSellingProducts data={stats?.topProducts} />
            <CategoryChart data={stats?.categoryData} />
          </div>

          <CustomerGrowthChart data={stats?.customerData} />
        </>
      )}
    </div>
  );
}
