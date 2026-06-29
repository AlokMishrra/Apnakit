"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  RotateCcw,
  Download,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";
import { getSafeErrorMessage } from "@/lib/safe-error";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusConfig: Record<string, { label: string; variant: "warning" | "success" | "destructive" | "default" | "secondary"; icon: React.ReactNode }> = {
  RETURNED: { label: "Pending", variant: "warning", icon: <RotateCcw className="h-3 w-3" /> },
  REFUNDED: { label: "Completed", variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
  REJECTED: { label: "Rejected", variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
  CANCELLED: { label: "Cancelled", variant: "secondary", icon: <XCircle className="h-3 w-3" /> },
};

export default function ReturnsPage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedReturnId, setSelectedReturnId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReturns = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getAllOrders({ status: "RETURNED", limit: 100 });
      const list = res?.data?.data || res?.data?.orders || res?.orders || res?.data || [];
      const returnedList = Array.isArray(list) ? list : [];
      const refundedRes = await adminService.getAllOrders({ status: "REFUNDED", limit: 100 }).catch(() => null);
      const refundedList = refundedRes
        ? (refundedRes?.data?.data || refundedRes?.data?.orders || refundedRes?.orders || refundedRes?.data || [])
        : [];
      const combined = [
        ...returnedList.map((o: any) => ({ ...o, _returnStatus: "RETURNED" })),
        ...(Array.isArray(refundedList) ? refundedList.map((o: any) => ({ ...o, _returnStatus: "REFUNDED" })) : []),
      ];
      setOrders(combined);
    } catch (err) {
      toast.error(getSafeErrorMessage(err, "Failed to load returns"));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  const filteredReturns = useMemo(() => {
    return orders.filter((ret: any) => {
      const retStatus = (ret._returnStatus || "").toLowerCase();
      const matchesFilter = activeFilter === "all" || retStatus === activeFilter;
      const id = String(ret.id || ret._id || ret.orderNumber || "").toLowerCase();
      const num = String(ret.orderNumber || "").toLowerCase();
      const customer = String(
        ret.user?.firstName ? `${ret.user.firstName} ${ret.user.lastName || ""}` : ret.user?.name || ret.user?.email || ""
      ).toLowerCase();
      const productName = (ret.items || []).map((i: any) => i.product?.name || i.name || "").join(" ").toLowerCase();
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        id.includes(q) ||
        num.includes(q) ||
        customer.includes(q) ||
        productName.includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [orders, activeFilter, searchQuery]);

  const totalReturns = orders.length;
  const pendingReturns = orders.filter((o) => o._returnStatus === "RETURNED").length;
  const completedReturns = orders.filter((o) => o._returnStatus === "REFUNDED").length;
  const totalRefundAmount = orders
    .filter((o) => o._returnStatus === "REFUNDED")
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const totalOrders = orders.length + 50;
  const returnRate = totalOrders > 0 ? ((totalReturns / totalOrders) * 100).toFixed(1) : "0.0";

  const handleReject = (id: string) => {
    setSelectedReturnId(id);
    setRejectDialogOpen(true);
  };

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(true);
      await adminService.updateOrderStatus(id, "REFUNDED");
      toast.success("Return approved and refunded");
      await fetchReturns();
    } catch (err) {
      toast.error(getSafeErrorMessage(err, "Failed to approve return"));
    } finally {
      setActionLoading(false);
    }
  };

  const confirmReject = async () => {
    if (!selectedReturnId) return;
    try {
      setActionLoading(true);
      await adminService.updateOrderStatus(selectedReturnId, "CANCELLED");
      toast.success("Return rejected");
      setRejectDialogOpen(false);
      setRejectReason("");
      await fetchReturns();
    } catch (err) {
      toast.error(getSafeErrorMessage(err, "Failed to reject return"));
    } finally {
      setActionLoading(false);
    }
  };

  const filters = ["all", "returned", "refunded"];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Returns Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage product returns, refunds, and replacements
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Returns</p>
            <p className="mt-1 text-2xl font-bold">{totalReturns}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending Returns</p>
            <p className="mt-1 text-2xl font-bold">{pendingReturns}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Refunded Amount</p>
            <p className="mt-1 text-2xl font-bold">{formatCurrency(totalRefundAmount)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Return Rate</p>
            <p className="mt-1 text-2xl font-bold">{returnRate}%</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-semibold">All Returns</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search returns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-[200px] pl-9 lg:w-[280px]"
              />
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeFilter === filter
                    ? "bg-violet-600 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                {filter !== "all" && (
                  <span className="ml-1.5 text-xs opacity-70">
                    ({orders.filter((o) => o._returnStatus?.toLowerCase() === filter).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-xs font-medium uppercase text-muted-foreground">
                  <th className="pb-3 pr-4">Order #</th>
                  <th className="pb-3 pr-4">Customer</th>
                  <th className="pb-3 pr-4">Items</th>
                  <th className="pb-3 pr-4">Amount</th>
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredReturns.map((ret: any) => {
                  const id = ret.id || ret._id;
                  const orderNumber = ret.orderNumber || `ORD-${(id || "").toString().slice(-6)}`;
                  const customerName = ret.user?.firstName
                    ? `${ret.user.firstName} ${ret.user.lastName || ""}`.trim()
                    : ret.user?.name || "Customer";
                  const email = ret.user?.email || "";
                  const items = Array.isArray(ret.items) ? ret.items : [];
                  const productNames = items
                    .slice(0, 2)
                    .map((i: any) => i.product?.name || i.name)
                    .filter(Boolean)
                    .join(", ");
                  const totalQty = items.reduce((s: number, i: any) => s + (Number(i.quantity) || 0), 0);
                  const amount = Number(ret.total) || 0;
                  const retStatus = (ret._returnStatus || "RETURNED").toUpperCase();
                  const status = statusConfig[retStatus] || statusConfig.RETURNED;
                  return (
                    <tr key={id} className="group">
                      <td className="py-3 pr-4">
                        <span className="text-sm font-medium text-violet-600">{orderNumber}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <div>
                          <p className="text-sm font-medium">{customerName}</p>
                          <p className="text-xs text-muted-foreground">{email}</p>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="text-sm">{productNames || `${items.length} item(s)`}</p>
                        <p className="text-xs text-muted-foreground">Qty: {totalQty}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-sm font-medium">{formatCurrency(amount)}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-sm text-muted-foreground">
                          {formatDate(ret.createdAt)}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={status.variant} className="gap-1">
                          {status.icon}
                          {status.label}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/admin/orders/${id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {ret._returnStatus === "RETURNED" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-emerald-600 hover:text-emerald-700"
                                onClick={() => handleApprove(id)}
                                disabled={actionLoading}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700"
                                onClick={() => handleReject(id)}
                                disabled={actionLoading}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredReturns.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                No returns found matching your criteria.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Return</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this return request. The customer will be
              notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rejection Reason</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmReject} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reject Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
