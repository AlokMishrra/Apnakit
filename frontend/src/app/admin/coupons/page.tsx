"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Tag,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  CheckCircle,
  XCircle,
  Percent,
  DollarSign,
  Gift,
  Truck,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { Pagination } from "@/components/ui/pagination";
import { formatCurrency, formatDate } from "@/lib/utils";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";

interface Coupon {
  id: string;
  code: string;
  description: string;
  type: "percentage" | "fixed" | "bog" | "free_shipping";
  value: number;
  minOrder: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  applicableCategories: string[];
}

const typeConfig: Record<
  Coupon["type"],
  { label: string; icon: React.ReactNode; color: string }
> = {
  percentage: {
    label: "Percentage",
    icon: <Percent className="h-4 w-4" />,
    color: "bg-blue-100 text-blue-600",
  },
  fixed: {
    label: "Fixed Amount",
    icon: <DollarSign className="h-4 w-4" />,
    color: "bg-emerald-100 text-emerald-600",
  },
  bog: {
    label: "Buy X Get Y",
    icon: <Gift className="h-4 w-4" />,
    color: "bg-purple-100 text-purple-600",
  },
  free_shipping: {
    label: "Free Shipping",
    icon: <Truck className="h-4 w-4" />,
    color: "bg-amber-100 text-amber-600",
  },
};

export default function CouponsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const data = await adminService.getCoupons({ page: 1, limit: 100 });
      const list = data?.data?.coupons || data?.data?.data || data?.coupons || (Array.isArray(data?.data) ? data.data : []) || (Array.isArray(data) ? data : []);
      setCoupons(Array.isArray(list) ? list : []);
    } catch (error) {
      toast.error("Failed to load coupons");
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCoupons = useMemo(() => {
    let result = [...coupons];

    if (statusFilter !== "all") {
      result = result.filter((c: any) =>
        statusFilter === "active" ? c.isActive : !c.isActive
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c: any) =>
          c.code.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query)
      );
    }

    return result;
  }, [statusFilter, searchQuery, coupons]);

  const totalPages = Math.ceil(filteredCoupons.length / itemsPerPage);
  const paginatedCoupons = filteredCoupons.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const stats = {
    total: coupons.length,
    active: coupons.filter((c: any) => c.isActive).length,
    inactive: coupons.filter((c: any) => !c.isActive).length,
    totalUsage: coupons.reduce((sum: number, c: any) => sum + (c.usedCount || 0), 0),
  };

  const toggleActive = async (id: string) => {
    try {
      const coupon = coupons.find((c: any) => c.id === id);
      await adminService.updateCoupon(id, { isActive: !coupon?.isActive });
      setCoupons((prev) =>
        prev.map((c: any) => (c.id === id ? { ...c, isActive: !c.isActive } : c))
      );
      toast.success("Coupon updated");
    } catch (error) {
      toast.error("Failed to update coupon");
    }
  };

  const deleteCoupon = async (id: string) => {
    try {
      await adminService.deleteCoupon(id);
      setCoupons((prev) => prev.filter((c: any) => c.id !== id));
      toast.success("Coupon deleted");
    } catch (error) {
      toast.error("Failed to delete coupon");
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
          <p className="text-sm text-gray-500">
            Create and manage discount coupons
          </p>
        </div>
        <Link href="/admin/coupons/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Coupon
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Tag className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Coupons</p>
                <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Inactive</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.inactive}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <Gift className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Usage</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.totalUsage.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by code or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-sm text-gray-500">
          {filteredCoupons.length} coupons found
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50/50">
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Code
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Type
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Value
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Min Order
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Usage
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Validity
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedCoupons.map((coupon) => {
                const typeInfo = typeConfig[coupon.type?.toLowerCase()];
                const usagePercent = coupon.usageLimit
                  ? Math.round((coupon.usedCount / coupon.usageLimit) * 100)
                  : null;

                return (
                  <tr
                    key={coupon.id}
                    className="transition-colors hover:bg-gray-50/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-gray-100 px-2 py-1 font-mono text-sm font-semibold text-gray-900">
                          {coupon.code}
                        </code>
                        <button
                          onClick={() => copyCode(coupon.code)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Copy code"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {coupon.description}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${typeInfo.color}`}
                      >
                        {typeInfo.icon}
                        {typeInfo.label}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {coupon.type === "percentage"
                        ? `${coupon.value}%`
                        : coupon.type === "fixed"
                        ? formatCurrency(coupon.value)
                        : coupon.type === "free_shipping"
                        ? "Free"
                        : `Buy 2 Get ${coupon.value}`}
                      {coupon.maxDiscount && (
                        <span className="block text-xs text-gray-500">
                          Max: {formatCurrency(coupon.maxDiscount)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {coupon.minOrder > 0
                        ? formatCurrency(coupon.minOrder)
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {coupon.usedCount}
                            {coupon.usageLimit && (
                              <span className="text-gray-400">
                                /{coupon.usageLimit}
                              </span>
                            )}
                          </span>
                        </div>
                        {usagePercent !== null && (
                          <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className={`h-full rounded-full ${
                                usagePercent >= 100
                                  ? "bg-red-500"
                                  : usagePercent >= 80
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{ width: `${Math.min(usagePercent, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      <p>{formatDate(coupon.startDate, "MMM dd, yyyy")}</p>
                      <p>to {formatDate(coupon.endDate, "MMM dd, yyyy")}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={coupon.isActive ? "success" : "secondary"}>
                        {coupon.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild className="flex items-center gap-2">
                          <Link href={`/admin/coupons/${coupon.id}/edit`}>
                            <Edit className="h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => toggleActive(coupon.id)}
                          className="flex items-center gap-2"
                        >
                          {coupon.isActive ? (
                            <>
                              <XCircle className="h-4 w-4 text-amber-500" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 text-emerald-500" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => deleteCoupon(coupon.id)}
                          className="flex items-center gap-2 text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </div>

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
