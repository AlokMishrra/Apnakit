"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  CreditCard,
  Package,
  User,
  Clock,
  MessageSquare,
  Image as ImageIcon,
  Loader2,
  PackageX,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { formatCurrency, formatDate, getImageUrl } from "@/lib/utils";

const statusConfig: Record<string, { label: string; variant: "warning" | "success" | "destructive" | "default" | "secondary" }> = {
  RETURNED: { label: "Pending Review", variant: "warning" },
  REFUNDED: { label: "Refund Completed", variant: "default" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  CANCELLED: { label: "Cancelled", variant: "secondary" },
};

export default function ReturnDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await adminService.getOrderById(id);
      const found = res?.data?.data || res?.data || res;
      setOrder(found || null);
    } catch (err) {
      toast.error(getSafeErrorMessage(err, "Failed to load return"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const updateStatus = async (status: string) => {
    if (!id) return;
    try {
      setActionLoading(true);
      await adminService.updateOrderStatus(id, status);
      toast.success(`Return status updated to ${status}`);
      setApproveDialogOpen(false);
      setRejectDialogOpen(false);
      setRefundDialogOpen(false);
      setRejectReason("");
      await fetchOrder();
    } catch (err) {
      toast.error(getSafeErrorMessage(err, "Failed to update status"));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/returns">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Return Not Found</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <PackageX className="mb-4 h-16 w-16 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Return not found</p>
            <Link href="/admin/returns">
              <Button className="mt-4">Back to Returns</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = (order.status || "").toUpperCase();
  const statusInfo = statusConfig[status] || statusConfig.RETURNED;
  const customer = order.user || {};
  const customerName = customer.firstName
    ? `${customer.firstName} ${customer.lastName || ""}`.trim()
    : customer.name || "Customer";
  const items = Array.isArray(order.items) ? order.items : [];
  const firstItem = items[0] || {};
  const productName = firstItem.product?.name || firstItem.name || "Product";
  const productImage = firstItem.product?.images?.[0]?.url || firstItem.product?.images?.[0] || firstItem.image;
  const productSku = firstItem.product?.sku || firstItem.sku || "—";
  const productPrice = Number(firstItem.price || order.total || 0);
  const productQty = firstItem.quantity || 1;
  const shippingAddress = order.shippingAddress || order.address || {};
  const fullAddress = [
    shippingAddress.street || shippingAddress.line1 || shippingAddress.addressLine1,
    shippingAddress.addressLine2,
    shippingAddress.line2,
  ]
    .filter(Boolean)
    .concat([
      [shippingAddress.city, shippingAddress.state, shippingAddress.pincode].filter(Boolean).join(", "),
    ])
    .filter(Boolean)
    .join(" • ") || "—";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/returns"
            className="flex h-9 w-9 items-center justify-center rounded-lg border bg-white shadow-sm transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{order.orderNumber || `ORD-${(id || "").toString().slice(-6)}`}</h1>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Return request created on {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
        {status === "RETURNED" && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => setRejectDialogOpen(true)}
              disabled={actionLoading}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => setApproveDialogOpen(true)}
              disabled={actionLoading}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve Return
            </Button>
          </div>
        )}
        {status === "DELIVERED" && (
          <Button onClick={() => setRefundDialogOpen(true)} disabled={actionLoading}>
            <CreditCard className="mr-2 h-4 w-4" />
            Process Refund
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Package className="h-4 w-4 text-violet-600" />
                Product Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                {productImage ? (
                  <img
                    src={getImageUrl(productImage)}
                    alt={productName}
                    className="h-24 w-24 rounded-lg object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/images/placeholder.svg"; }}
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-muted text-2xl">📦</div>
                )}
                <div className="flex-1">
                  <h3 className="font-medium">{productName}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">SKU: {productSku}</p>
                  {firstItem.variant?.name && (
                    <p className="text-sm text-muted-foreground">Variant: {firstItem.variant.name}</p>
                  )}
                  <div className="mt-2 flex items-center gap-4">
                    <span className="text-lg font-bold">{formatCurrency(productPrice)}</span>
                    <span className="text-sm text-muted-foreground">Qty: {productQty}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <MessageSquare className="h-4 w-4 text-violet-600" />
                Return Reason
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reason</p>
                <Badge variant="warning" className="mt-1">
                  {order.returnReason || "Not specified"}
                </Badge>
              </div>
              {order.returnDescription && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="mt-1 text-sm leading-relaxed">{order.returnDescription}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {Array.isArray(order.returnImages) && order.returnImages.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <ImageIcon className="h-4 w-4 text-violet-600" />
                  Uploaded Images
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {order.returnImages.map((img: any, i: number) => (
                    <div key={i} className="relative overflow-hidden rounded-lg border">
                      <img
                        src={getImageUrl(typeof img === "string" ? img : img?.url)}
                        alt={`Return image ${i + 1}`}
                        className="aspect-square w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Clock className="h-4 w-4 text-violet-600" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Array.isArray(order.statusHistory) && order.statusHistory.length > 0 ? (
                <div className="relative space-y-6">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                  {order.statusHistory.map((event: any, i: number) => (
                    <div key={i} className="relative flex gap-4">
                      <div
                        className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                          i === 0 ? "border-violet-600 bg-violet-50" : "border-border bg-white"
                        }`}
                      >
                        <div className={`h-2 w-2 rounded-full ${i === 0 ? "bg-violet-600" : "bg-muted-foreground"}`} />
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{event.status || event.label}</p>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(event.createdAt || event.date, "MMM dd, yyyy HH:mm")}
                          </span>
                        </div>
                        {event.notes && (
                          <p className="mt-0.5 text-sm text-muted-foreground">{event.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-sm text-muted-foreground">No timeline yet</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <User className="h-4 w-4 text-violet-600" />
                Order Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-600">
                  {customerName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{customerName}</p>
                  <p className="text-xs text-muted-foreground">{customer.email || "—"}</p>
                </div>
              </div>

              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Order Number</span>
                  <span className="font-medium">{order.orderNumber || `ORD-${(id || "").toString().slice(-6)}`}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Order Date</span>
                  <span className="font-medium">{formatDate(order.createdAt, "MMM dd, yyyy")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="font-medium">{order.paymentMethod || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Order Total</span>
                  <span className="font-bold">{formatCurrency(order.total || 0)}</span>
                </div>
              </div>

              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Shipping Address</p>
                <p className="text-sm">{fullAddress}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Refund Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Product Amount</span>
                <span>{formatCurrency(productPrice * productQty)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping Charge</span>
                <span>{formatCurrency(0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(order.tax || 0)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="font-medium">Total Refund</span>
                  <span className="text-lg font-bold text-violet-600">
                    {formatCurrency(order.total || productPrice * productQty)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Return</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this return request? A return shipping label will
              be generated for the customer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => updateStatus("DELIVERED")}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Approve Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Return</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this return request. The customer will be
              notified via email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rejection Reason *</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter detailed reason for rejection..."
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => updateStatus("CANCELLED")}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reject Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Confirm the refund amount and method. The customer will receive the refund within
              5-7 business days.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Refund Amount</span>
                <span className="text-lg font-bold">{formatCurrency(order.total || 0)}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-muted-foreground">Refund Method</span>
                <span className="font-medium">Original Payment Method</span>
              </div>
            </div>
            <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              This action cannot be undone. The refund will be processed to the customer&apos;s
              original payment method.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              onClick={() => updateStatus("REFUNDED")}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <CreditCard className="mr-2 h-4 w-4" />
              Confirm Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
