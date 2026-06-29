"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  RotateCcw,
  Plus,
  Loader2,
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  Search,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, getImageUrl } from "@/lib/utils";
import { orderService } from "@/services/order.service";
import { getSafeErrorMessage, isAuthError } from "@/lib/safe-error";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: "Pending", color: "bg-amber-100 text-amber-700", icon: Clock },
  APPROVED: { label: "Approved", color: "bg-blue-100 text-blue-700", icon: CheckCircle2 },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-700", icon: XCircle },
  PICKED_UP: { label: "Picked Up", color: "bg-indigo-100 text-indigo-700", icon: Truck },
  REFUNDED: { label: "Refunded", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  COMPLETED: { label: "Completed", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
};

function ReturnSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReturnsPage() {
  const router = useRouter();
  const [returns, setReturns] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    orderId: "",
    reason: "",
    description: "",
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [ordersRes] = await Promise.all([
        orderService.getMyOrders({ limit: 50 }),
      ]);
      const ordersData = ordersRes?.data?.data || ordersRes?.data || ordersRes;
      const ordersList = Array.isArray(ordersData) ? ordersData : (ordersData?.orders || []);
      setOrders(ordersList.filter((o: any) => o.status === "DELIVERED" || o.status === "delivered"));
      setReturns([]); // Returns will be loaded when API endpoint is available
    } catch (err: any) {
      if (isAuthError(err)) {
        toast.error("Please login");
        router.push("/login");
        return;
      }
      toast.error("Failed to load data", { description: getSafeErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmitReturn = async () => {
    if (!formData.orderId || !formData.reason) {
      toast.error("Please select an order and reason");
      return;
    }
    try {
      setSubmitting(true);
      await orderService.requestReturn(formData.orderId, {
        reason: formData.reason,
        description: formData.description,
      });
      toast.success("Return request submitted!", {
        description: "We'll process your return shortly",
      });
      setFormData({ orderId: "", reason: "", description: "" });
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      toast.error("Failed to submit return", { description: getSafeErrorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReturns = returns.filter((r) =>
    !searchTerm || r.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Returns & Refunds</h1>
          <p className="text-sm text-muted-foreground">Manage your return requests</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          New Return
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Request a Return</h3>
            <div>
              <label className="text-sm font-medium text-foreground">Select Order *</label>
              <select
                value={formData.orderId}
                onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Choose a delivered order</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber || `#${o.id.slice(-8)}`} - {formatCurrency(o.total)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Reason *</label>
              <select
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Select reason</option>
                <option value="DEFECTIVE">Defective / Damaged</option>
                <option value="WRONG_ITEM">Wrong item received</option>
                <option value="NOT_AS_DESCRIBED">Not as described</option>
                <option value="CHANGED_MIND">Changed my mind</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Additional Details</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Provide more details about your return..."
                className="mt-1 flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmitReturn} disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700">
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                Submit Return Request
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search returns..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <ReturnSkeleton key={i} />)}
        </div>
      ) : filteredReturns.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <RotateCcw className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold text-foreground">No return requests</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              You haven't requested any returns yet
            </p>
            <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700" onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Return Request
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredReturns.map((ret) => {
            const id = ret.id || ret._id;
            const status = (ret.status || "PENDING").toUpperCase();
            const sc = statusConfig[status] || statusConfig.PENDING;
            const StatusIcon = sc.icon;
            return (
              <Card key={id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground">{ret.reason}</h3>
                        <Badge className={sc.color}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {sc.label}
                        </Badge>
                      </div>
                      {ret.description && (
                        <p className="mt-1 text-sm text-muted-foreground">{ret.description}</p>
                      )}
                      <p className="mt-2 text-xs text-muted-foreground">
                        Order: {ret.orderNumber || ret.orderId} · {formatDate(ret.createdAt, "MMM dd, yyyy")}
                      </p>
                    </div>
                    {ret.refundAmount && (
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">{formatCurrency(ret.refundAmount)}</p>
                        <p className="text-xs text-muted-foreground">Refund</p>
                      </div>
                    )}
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
