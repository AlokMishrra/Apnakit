"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { sellerService } from "@/services/seller.service";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import {
  TrendingUp,
  IndianRupee,
  ShoppingCart,
  Star,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react";

export default function SellerAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await sellerService.getAnalytics();
      const data = res?.data?.data || res?.data || res;
      if (data && data.stats) {
        data.stats = {
          totalSales: data.stats.totalRevenue,
          monthlySales: data.stats.monthRevenue,
          totalOrders: data.stats.totalOrders,
          averageRating: data.stats.averageRating,
          totalReviews: data.stats.totalReviews,
          ...data.stats,
        };
      }
      setAnalytics(data);
    } catch {
      toast.error("Failed to load analytics");
      setAnalytics({ stats: {}, salesChart: [], topProducts: [], orderDistribution: [], demographics: [], ratingData: [] });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stats = analytics?.stats || analytics || {};
  const salesChart = analytics?.salesChart || [];
  const topProducts = analytics?.topProducts || [];
  const orderDistribution = analytics?.orderDistribution || [];
  const demographics = analytics?.demographics || [];
  const ratingData = analytics?.ratingData || [];

  const maxSales = salesChart.length > 0 ? Math.max(...salesChart.map((d: any) => d.sales || 0)) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Track your store performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Last 30 Days
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalSales || 0)}</p>
              </div>
              <div className="bg-emerald-500 p-2 rounded-lg text-white">
                <IndianRupee className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
              <span className="text-xs text-emerald-500 font-medium">+12.5%</span>
              <span className="text-xs text-muted-foreground">vs last month</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.monthlySales || 0)}</p>
              </div>
              <div className="bg-blue-500 p-2 rounded-lg text-white">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
              <span className="text-xs text-emerald-500 font-medium">+8.2%</span>
              <span className="text-xs text-muted-foreground">vs last month</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{(stats.totalOrders || 0).toLocaleString()}</p>
              </div>
              <div className="bg-purple-500 p-2 rounded-lg text-white">
                <ShoppingCart className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
              <span className="text-xs text-emerald-500 font-medium">+5.7%</span>
              <span className="text-xs text-muted-foreground">vs last month</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Rating</p>
                <p className="text-2xl font-bold">{(stats.averageRating || 0).toFixed(1)}</p>
              </div>
              <div className="bg-yellow-500 p-2 rounded-lg text-white">
                <Star className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-muted-foreground">
                Based on {(stats.totalReviews || 0).toLocaleString()} reviews
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-48">
              {salesChart.map((data, index) => (
                <div
                  key={index}
                  className="flex-1 bg-primary/20 hover:bg-primary/40 transition-colors rounded-t relative group"
                  style={{ height: `${((data.sales || 0) / maxSales) * 100}%` }}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                      {formatCurrency(data.sales || 0)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{salesChart[0]?.date || ''}</span>
              <span>{salesChart[salesChart.length - 1]?.date || ''}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {orderDistribution.map((item) => (
              <div key={item.status} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{item.status}</span>
                  <span className="text-sm font-medium">{item.count || 0}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${((item.count || 0) / (stats.totalOrders || 1)) * 100}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center gap-4">
                  <span className="text-lg font-bold text-muted-foreground w-6">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(product.sales || 0).toLocaleString()} units sold
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(product.revenue || 0)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rating Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ratingData.map((item) => (
              <div key={item.stars} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-12">
                  <span className="text-sm">{item.stars}</span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                </div>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <div className="w-20 text-right">
                  <span className="text-sm text-muted-foreground">{item.count || 0}</span>
                  <span className="text-xs text-muted-foreground ml-1">
                    ({item.percentage || 0}%)
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Customer Demographics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {demographics.map((item) => (
              <div key={item.state} className="border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{item.state}</p>
                  <Badge variant="secondary">{item.percentage || 0}%</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {(item.orders || 0).toLocaleString()} orders
                </p>
                <div className="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${(item.percentage || 0) * 5}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
