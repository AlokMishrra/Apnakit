"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Store,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Star,
  Package,
  DollarSign,
  TrendingUp,
  Users,
  ShieldCheck,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/avatar";
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

interface Seller {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  avatar: string | null;
  productsCount: number;
  ordersCount: number;
  revenue: number;
  rating: number;
  status: "pending" | "verified" | "rejected" | "suspended";
  joinedDate: string;
  commission: number;
}

const statusConfig: Record<
  Seller["status"],
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning"; icon: React.ReactNode }
> = {
  pending: {
    label: "Pending",
    variant: "warning",
    icon: <ShieldAlert className="h-3 w-3" />,
  },
  verified: {
    label: "Verified",
    variant: "success",
    icon: <ShieldCheck className="h-3 w-3" />,
  },
  rejected: {
    label: "Rejected",
    variant: "destructive",
    icon: <XCircle className="h-3 w-3" />,
  },
  suspended: {
    label: "Suspended",
    variant: "secondary",
    icon: <XCircle className="h-3 w-3" />,
  },
};

export default function SellersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const res = await adminService.getSellers({ page: 1, limit: 100 });
      const data = res?.data?.data || res?.data || [];
      setSellers(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load sellers");
    } finally {
      setLoading(false);
    }
  };

  const filteredSellers = useMemo(() => {
    let result = [...sellers];

    if (statusFilter !== "all") {
      result = result.filter((s: any) => {
        const status = s.status || (s.isVerified ? "verified" : s.isActive === false ? "suspended" : "pending");
        return status === statusFilter;
      });
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s: any) =>
          (s.businessName || s.shopName || "").toLowerCase().includes(query) ||
          (s.ownerName || s.name || "").toLowerCase().includes(query) ||
          (s.email || "").toLowerCase().includes(query)
      );
    }

    return result;
  }, [statusFilter, searchQuery, sellers]);

  const totalPages = Math.ceil(filteredSellers.length / itemsPerPage);
  const paginatedSellers = filteredSellers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const stats = {
    total: sellers.length,
    verified: sellers.filter((s: any) => s.isVerified || s.status === "verified").length,
    pending: sellers.filter((s: any) => !s.isVerified && s.status !== "rejected" && s.status !== "suspended").length,
    totalRevenue: sellers.reduce((sum: number, s: any) => sum + (s.revenue || s.totalSales || 0), 0),
  };

  const updateStatus = async (id: string, action: "verify" | "activate" | "deactivate") => {
    try {
      if (action === "verify") {
        await adminService.verifySeller(id, { isVerified: true });
      } else if (action === "activate") {
        await adminService.updateSellerStatus(id, { isActive: true });
      } else {
        await adminService.updateSellerStatus(id, { isActive: false });
      }
      toast.success("Seller updated");
      fetchSellers();
    } catch {
      toast.error("Failed to update seller");
    }
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sellers</h1>
        <p className="text-sm text-gray-500">
          Manage marketplace sellers and their accounts
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Store className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Sellers</p>
                <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Verified</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.verified}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <ShieldAlert className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.pending}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <DollarSign className="h-5 w-5 text-purple-600" />
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
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by business name, owner..."
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
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-sm text-gray-500">
          {filteredSellers.length} sellers found
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50/50">
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Seller
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Products
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Orders
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Revenue
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Rating
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Commission
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
              {paginatedSellers.map((seller: any) => {
                const id = seller._id || seller.id;
                const bizName = seller.businessName || seller.shopName || 'Store';
                const ownerName = seller.ownerName || seller.name || 'Owner';
                const sellerStatus = seller.status || (seller.isVerified ? "verified" : seller.isActive === false ? "suspended" : "pending");
                const statusInfo = statusConfig[sellerStatus as keyof typeof statusConfig] || statusConfig.pending;
                return (
                  <tr
                    key={id}
                    className="transition-colors hover:bg-gray-50/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={ownerName} size="sm" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {bizName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {ownerName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Package className="h-3.5 w-3.5" />
                        {seller.productsCount || seller._count?.products || 0}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {seller.ordersCount || seller._count?.orders || 0}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {formatCurrency(seller.revenue || seller.totalSales || 0)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-gray-600">{seller.rating || 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {seller.commission || 5}%
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={statusInfo.variant}
                        className="flex w-fit items-center gap-1"
                      >
                        {statusInfo.icon}
                        {statusInfo.label}
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
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/admin/sellers/${id}`}
                              className="flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          {sellerStatus === "pending" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  updateStatus(id, "verify")
                                }
                                className="flex items-center gap-2 text-emerald-600"
                              >
                                <CheckCircle className="h-4 w-4" />
                                Verify Seller
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  updateStatus(id, "deactivate")
                                }
                                className="flex items-center gap-2 text-red-600"
                              >
                                <XCircle className="h-4 w-4" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                          {sellerStatus === "verified" && (
                            <DropdownMenuItem
                              onClick={() =>
                                updateStatus(id, "deactivate")
                              }
                              className="flex items-center gap-2 text-red-600"
                            >
                              <XCircle className="h-4 w-4" />
                              Suspend
                            </DropdownMenuItem>
                          )}
                          {sellerStatus === "suspended" && (
                            <DropdownMenuItem
                              onClick={() =>
                                updateStatus(id, "activate")
                              }
                              className="flex items-center gap-2 text-emerald-600"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Reinstate
                            </DropdownMenuItem>
                          )}
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
