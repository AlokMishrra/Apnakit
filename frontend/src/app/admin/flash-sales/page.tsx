"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Calendar,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, getImageUrl } from "@/lib/utils";
import { flashSaleService } from "@/services/flash-sale.service";
import { toast } from "sonner";
import { getSafeErrorMessage } from "@/lib/safe-error";

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "scheduled", label: "Scheduled" },
  { value: "expired", label: "Expired" },
  { value: "inactive", label: "Inactive" },
];

function getSaleStatus(sale: any): "active" | "scheduled" | "expired" | "inactive" {
  if (!sale.isActive) return "inactive";
  const now = new Date();
  const start = new Date(sale.startsAt);
  const end = new Date(sale.expiresAt);
  if (now < start) return "scheduled";
  if (now > end) return "expired";
  return "active";
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  active: { label: "Active", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  scheduled: { label: "Scheduled", color: "bg-blue-100 text-blue-700", icon: Clock },
  expired: { label: "Expired", color: "bg-gray-100 text-gray-700", icon: AlertCircle },
  inactive: { label: "Inactive", color: "bg-red-100 text-red-700", icon: XCircle },
};

function FlashSaleRowSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function FlashSalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      const res = await flashSaleService.getAllAdmin();
      const data = res?.data || res;
      const list = Array.isArray(data) ? data : [];
      setSales(list);
    } catch (err) {
      toast.error("Failed to load flash sales", { description: getSafeErrorMessage(err) });
      setSales([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const filteredSales = useMemo(() => {
    let result = [...sales];
    if (statusFilter !== "all") {
      result = result.filter((s) => getSaleStatus(s) === statusFilter);
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (s) =>
          (s.title || "").toLowerCase().includes(q) ||
          (s.product?.name || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [sales, statusFilter, searchTerm]);

  const stats = useMemo(() => {
    const active = sales.filter((s) => getSaleStatus(s) === "active").length;
    const scheduled = sales.filter((s) => getSaleStatus(s) === "scheduled").length;
    const expired = sales.filter((s) => getSaleStatus(s) === "expired").length;
    const totalRevenue = sales
      .filter((s) => getSaleStatus(s) === "active" || getSaleStatus(s) === "expired")
      .reduce((sum, s) => sum + (Number(s.salePrice) || 0) * (Number(s.soldCount) || 0), 0);
    return { active, scheduled, expired, totalRevenue };
  }, [sales]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete flash sale "${title}"? This cannot be undone.`)) return;
    try {
      await flashSaleService.remove(id);
      setSales((prev) => prev.filter((s) => s.id !== id));
      toast.success("Flash sale deleted");
    } catch (err) {
      toast.error("Failed to delete", { description: getSafeErrorMessage(err) });
    }
  };

  const toggleActive = async (id: string) => {
    const sale = sales.find((s) => s.id === id);
    if (!sale) return;
    try {
      await flashSaleService.update(id, { isActive: !sale.isActive });
      setSales((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
      );
      toast.success(sale.isActive ? "Flash sale deactivated" : "Flash sale activated");
    } catch (err) {
      toast.error("Failed to update", { description: getSafeErrorMessage(err) });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Flash Sales</h1>
          <p className="text-sm text-muted-foreground">
            Manage limited-time deals shown on the homepage
          </p>
        </div>
        <Link href="/admin/flash-sales/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Flash Sale
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                <Zap className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Now</p>
                <p className="text-xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="text-xl font-bold">{stats.scheduled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                <AlertCircle className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expired</p>
                <p className="text-xl font-bold">{stats.expired}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100">
                <Package className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Sold</p>
                <p className="text-xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search flash sales..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          <FlashSaleRowSkeleton />
          <FlashSaleRowSkeleton />
          <FlashSaleRowSkeleton />
        </div>
      ) : filteredSales.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Zap className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
            <h3 className="mb-1 text-base font-semibold text-foreground">No flash sales found</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {searchTerm || statusFilter !== "all"
                ? "Try changing your filters"
                : "Create your first flash sale to display on the homepage"}
            </p>
            <Link href="/admin/flash-sales/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Flash Sale
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSales.map((sale) => {
            const status = getSaleStatus(sale);
            const sc = statusConfig[status];
            const StatusIcon = sc.icon;
            const product = sale.product || {};
            const image = getImageUrl(product.image);
            return (
              <Card key={sale.id} className="transition-all hover:shadow-sm">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {image ? (
                        <img
                          src={image}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl text-gray-300">
                          📦
                        </div>
                      )}
                      {sale.discount > 0 && (
                        <Badge variant="destructive" className="absolute -right-1 -top-1 px-1.5 py-0 text-[10px]">
                          -{sale.discount}%
                        </Badge>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-foreground">
                          {sale.title || product.name || "Flash Sale"}
                        </h3>
                        <Badge className={sc.color}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {sc.label}
                        </Badge>
                      </div>
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {product.name && sale.title !== product.name ? product.name : product.brand || ""}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(sale.startsAt, "MMM dd, hh:mm a")} →{" "}
                          {formatDate(sale.expiresAt, "MMM dd, hh:mm a")}
                        </span>
                        <span>
                          {sale.soldCount}/{sale.totalStock} sold
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-base font-bold text-foreground">
                          {formatCurrency(sale.salePrice)}
                        </p>
                        {sale.originalPrice > sale.salePrice && (
                          <p className="text-xs text-muted-foreground line-through">
                            {formatCurrency(sale.originalPrice)}
                          </p>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/admin/flash-sales/${sale.id}/edit`}
                              className="flex items-center gap-2"
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => toggleActive(sale.id)}
                            className="flex items-center gap-2"
                          >
                            {sale.isActive ? (
                              <>
                                <XCircle className="h-4 w-4 text-amber-500" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(sale.id, sale.title || product.name)}
                            className="flex items-center gap-2 text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
