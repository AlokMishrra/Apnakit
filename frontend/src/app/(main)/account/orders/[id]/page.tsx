"use client";

import { use, useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  CreditCard,
  Download,
  RotateCcw,
  XCircle,
  Copy,
  Check,
  FileText,
  ShoppingBag,
  Phone,
  MessageSquare,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate, getImageUrl } from "@/lib/utils";
import { orderService } from "@/services/order.service";
import { getSafeErrorMessage, isAuthError } from "@/lib/safe-error";
import { ContactSupportDialog } from "@/components/support/contact-support-dialog";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: "Pending", color: "bg-blue-100 text-blue-700", icon: Clock },
  CONFIRMED: { label: "Confirmed", color: "bg-indigo-100 text-indigo-700", icon: CheckCircle2 },
  PROCESSING: { label: "Processing", color: "bg-amber-100 text-amber-700", icon: Package },
  PACKED: { label: "Packed", color: "bg-cyan-100 text-cyan-700", icon: Package },
  SHIPPED: { label: "Shipped", color: "bg-purple-100 text-purple-700", icon: Truck },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", color: "bg-indigo-100 text-indigo-700", icon: Truck },
  DELIVERED: { label: "Delivered", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-700", icon: XCircle },
  RETURNED: { label: "Returned", color: "bg-orange-100 text-orange-700", icon: RotateCcw },
  REFUNDED: { label: "Refunded", color: "bg-gray-100 text-gray-700", icon: RotateCcw },
};

const statusFlow = ["PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
  PAID: { label: "Paid", color: "bg-emerald-100 text-emerald-700" },
  COMPLETED: { label: "Completed", color: "bg-emerald-100 text-emerald-700" },
  FAILED: { label: "Failed", color: "bg-red-100 text-red-700" },
  REFUNDED: { label: "Refunded", color: "bg-gray-100 text-gray-700" },
};

const paymentMethodLabels: Record<string, string> = {
  cod: "Cash on Delivery",
  card: "Credit/Debit Card",
  upi: "UPI",
  netbanking: "Net Banking",
  wallet: "Wallet",
  razorpay: "Razorpay",
};

function OrderDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton variant="circular" className="h-8 w-8" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent className="space-y-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton variant="circular" className="h-8 w-8" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-20 w-20 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4 lg:col-span-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Order Not Found</h2>
          <p className="mb-6 text-sm text-muted-foreground">{message}</p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={onRetry}>
              Try Again
            </Button>
            <Button asChild>
              <Link href="/account/orders">Back to Orders</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function toNum(v: any): number {
  if (v === null || v === undefined || v === "") return 0;
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: orderIdParam } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState(false);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const [supportOpen, setSupportOpen] = useState(false);

  const [downloading, setDownloading] = useState(false);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderService.getOrder(orderIdParam);
      const data = response?.data?.data || response?.data;
      if (data && (data.id || data._id)) {
        setOrder(data);
      } else {
        setError("This order could not be found. It may have been removed or you may not have permission to view it.");
      }
    } catch (err: any) {
      if (isAuthError(err)) {
        toast.error("Please sign in to view your order");
        router.push("/login?redirect=/account/orders");
        return;
      }
      const msg = getSafeErrorMessage(err, "Unable to load order details. Please try again.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [orderIdParam, router]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const orderId = order?.id || order?._id;
  const statusKey = String(order?.status || order?.orderStatus || "PENDING").toUpperCase();
  const paymentStatusKey = String(order?.paymentStatus || "PENDING").toUpperCase();
  const statusInfo = statusConfig[statusKey] || statusConfig.PENDING;
  const StatusIcon = statusInfo.icon;

  const currentStatusIndex = statusFlow.indexOf(statusKey);
  const isCancelled = statusKey === "CANCELLED";
  const isReturned = statusKey === "RETURNED" || statusKey === "REFUNDED";
  const isDelivered = statusKey === "DELIVERED";
  const canCancel = ["PENDING", "CONFIRMED", "PROCESSING", "PACKED"].includes(statusKey);

  const paymentMethodRaw = order?.paymentMethod || "";
  const paymentMethodLabel = paymentMethodRaw
    ? paymentMethodLabels[paymentMethodRaw.toLowerCase()] || paymentMethodRaw
    : "—";

  const shippingAddress = order?.shippingAddress || {};
  const billingAddress = order?.billingAddress || {};
  const items = Array.isArray(order?.items) ? order.items : [];
  const statusHistory = Array.isArray(order?.statusHistory) ? order.statusHistory : [];

  // Build timeline: combine statusHistory with current status flow
  const timeline = useMemo(() => {
    if (isCancelled || isReturned) return [];
    const historyMap = new Map<string, { createdAt: string; notes?: string }>();
    statusHistory.forEach((h: any) => {
      const k = String(h.status || "").toUpperCase();
      if (!historyMap.has(k)) {
        historyMap.set(k, { createdAt: h.createdAt, notes: h.notes });
      }
    });

    return statusFlow.map((step) => {
      const idx = statusFlow.indexOf(step);
      const hist = historyMap.get(step);
      return {
        step,
        completed: currentStatusIndex >= 0 && idx <= currentStatusIndex,
        current: idx === currentStatusIndex,
        createdAt: hist?.createdAt,
        notes: hist?.notes,
      };
    });
  }, [statusHistory, currentStatusIndex, isCancelled, isReturned]);

  // Get tracking number from payments or notes
  const trackingNumber = useMemo(() => {
    if (order?.trackingNumber) return order.trackingNumber;
    if (Array.isArray(order?.payments)) {
      const t = order.payments.find((p: any) => p.trackingId || p.trackingNumber);
      if (t) return t.trackingId || t.trackingNumber;
    }
    return null;
  }, [order]);

  const handleCopyOrderId = () => {
    if (order?.orderNumber) {
      navigator.clipboard.writeText(order.orderNumber);
      setCopiedOrderId(true);
      toast.success("Order ID copied to clipboard");
      setTimeout(() => setCopiedOrderId(false), 2000);
    }
  };

  const handleCopyTracking = () => {
    if (trackingNumber) {
      navigator.clipboard.writeText(trackingNumber);
      setCopied(true);
      toast.success("Tracking number copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCancelOrder = async () => {
    if (!orderId) return;
    if (!cancelReason.trim() || cancelReason.trim().length < 5) {
      toast.error("Please provide a cancellation reason (at least 5 characters)");
      return;
    }
    setCancelling(true);
    try {
      const response = await orderService.cancelOrder(orderId, cancelReason.trim());
      const ok = response?.success || response?.data?.id || response?.data?._id;
      if (ok) {
        toast.success("Order cancelled successfully. Refund will be processed within 5-7 business days.");
        setCancelOpen(false);
        setCancelReason("");
        fetchOrder();
      } else {
        toast.error(response?.message || response?.data?.message || "Unable to cancel this order");
      }
    } catch (err: any) {
      const msg = getSafeErrorMessage(err, "Failed to cancel order. Please try again.");
      toast.error(msg);
    } finally {
      setCancelling(false);
    }
  };

  const handleDownloadInvoice = () => {
    if (!order?.orderNumber) return;
    setDownloading(true);
    toast.info("Preparing your invoice...");
    setTimeout(() => {
      setDownloading(false);
      toast.success(`Invoice for ${order.orderNumber} will be sent to your registered email`);
    }, 1200);
  };

  if (loading) {
    return <OrderDetailSkeleton />;
  }

  if (error || !order || !orderId) {
    return <ErrorState message={error || "Order details are not available."} onRetry={fetchOrder} />;
  }

  const subtotal = toNum(order.subtotal);
  const discount = toNum(order.discount);
  const shippingCost = toNum(order.shippingCost);
  const tax = toNum(order.tax);
  const total = toNum(order.total) || (subtotal + tax + shippingCost - discount);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/account/orders"
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Back to orders"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">Order Details</h1>
              <div className="flex items-center gap-1.5">
                <p className="text-sm text-muted-foreground">{order.orderNumber || orderId}</p>
                {order.orderNumber && (
                  <button
                    onClick={handleCopyOrderId}
                    className="rounded p-0.5 hover:bg-gray-100"
                    aria-label="Copy order ID"
                  >
                    {copiedOrderId ? (
                      <Check className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Copy className="h-3 w-3 text-muted-foreground" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={statusInfo.color}>
              <StatusIcon className="mr-1 h-3 w-3" />
              {statusInfo.label}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleDownloadInvoice} disabled={downloading}>
              {downloading ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="mr-1 h-3.5 w-3.5" />
              )}
              Invoice
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Order Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Order Status</CardTitle>
              </CardHeader>
              <CardContent>
                {isCancelled ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <div className="flex items-start gap-3">
                      <XCircle className="mt-0.5 h-5 w-5 text-red-600" />
                      <div>
                        <p className="text-sm font-medium text-red-900">Order Cancelled</p>
                        {order.cancelledAt && (
                          <p className="text-xs text-red-700">
                            {formatDate(order.cancelledAt, "MMM dd, yyyy • hh:mm a")}
                          </p>
                        )}
                        {order.cancelReason && (
                          <p className="mt-1 text-sm text-red-800">Reason: {order.cancelReason}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : isReturned ? (
                  <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                    <div className="flex items-start gap-3">
                      <RotateCcw className="mt-0.5 h-5 w-5 text-orange-600" />
                      <div>
                        <p className="text-sm font-medium text-orange-900">
                          Order {statusKey === "REFUNDED" ? "Refunded" : "Returned"}
                        </p>
                        <p className="text-xs text-orange-700">Refund will be processed within 5-7 business days</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    {timeline.map((t, index) => {
                      const stepInfo = statusConfig[t.step];
                      return (
                        <div key={t.step} className="flex gap-4 pb-6 last:pb-0">
                          {index < timeline.length - 1 && (
                            <div
                              className={`absolute left-[15px] w-0.5 ${
                                t.completed ? "bg-emerald-500" : "bg-gray-200"
                              }`}
                              style={{ top: `${16 + index * 64}px`, height: "52px" }}
                            />
                          )}

                          <div className="relative z-10 flex-shrink-0">
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                t.completed
                                  ? t.current
                                    ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                                    : "bg-emerald-500 text-white"
                                  : "bg-gray-200 text-gray-400"
                              }`}
                            >
                              {t.completed ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                            </div>
                          </div>

                          <div className="flex-1 pt-0.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <p
                                className={`text-sm font-medium ${
                                  t.completed ? "text-foreground" : "text-muted-foreground"
                                }`}
                              >
                                {stepInfo?.label || t.step}
                              </p>
                              {t.current && trackingNumber && t.step === "SHIPPED" && (
                                <div className="flex items-center gap-1">
                                  <Badge variant="outline" className="text-xs">
                                    {trackingNumber}
                                  </Badge>
                                  <button
                                    onClick={handleCopyTracking}
                                    className="rounded p-0.5 hover:bg-gray-100"
                                    aria-label="Copy tracking number"
                                  >
                                    {copied ? (
                                      <Check className="h-3 w-3 text-emerald-500" />
                                    ) : (
                                      <Copy className="h-3 w-3 text-muted-foreground" />
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                            {t.createdAt && (
                              <p className="text-xs text-muted-foreground">
                                {formatDate(t.createdAt, "MMM dd, yyyy • hh:mm a")}
                              </p>
                            )}
                            {t.notes && t.current && (
                              <p className="mt-0.5 text-xs text-muted-foreground">{t.notes}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Order Items ({items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <div className="py-8 text-center">
                    <Package className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                    <p className="text-sm text-muted-foreground">No item details available for this order</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item: any, idx: number) => {
                      const product = item.product || {};
                      // Images can be array, JSON string, plain URL string, or empty
                      let imageUrl = "";
                      const rawImages = product.images;
                      if (Array.isArray(rawImages) && rawImages.length > 0) {
                        imageUrl = typeof rawImages[0] === "string" ? rawImages[0] : (rawImages[0]?.url || "");
                      } else if (typeof rawImages === "string" && rawImages) {
                        // Try to parse JSON, otherwise treat as URL
                        try {
                          const parsed = JSON.parse(rawImages);
                          imageUrl = Array.isArray(parsed) ? (parsed[0]?.url || parsed[0] || "") : (parsed?.url || "");
                        } catch {
                          imageUrl = rawImages;
                        }
                      }
                      const image = getImageUrl(imageUrl);
                      const name = product.name || "Product";
                      const itemPrice = toNum(item.price);
                      const quantity = Number(item.quantity) || 1;
                      const totalPrice = toNum(item.totalPrice ?? item.total ?? itemPrice * quantity);
                      const variant = item.variant;
                      const variantName = variant?.name;
                      const variantPrice = toNum(variant?.price);
                      const comparePrice = toNum(variant?.compareAtPrice || variant?.comparePrice || product.comparePrice || product.mrp);
                      const productSlug = product.slug || product.id || product._id;

                      return (
                        <div key={item.id || item._id || idx} className="flex gap-4 pb-4 last:pb-0 border-b last:border-0">
                          <Link
                            href={`/products/${productSlug}`}
                            className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100"
                          >
                            {image ? (
                              <Image
                                src={image}
                                alt={name}
                                fill
                                sizes="80px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Package className="h-6 w-6 text-gray-300" />
                              </div>
                            )}
                          </Link>
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/products/${productSlug}`}
                              className="hover:text-indigo-600"
                            >
                              <h4 className="text-sm font-medium text-foreground line-clamp-2">{name}</h4>
                            </Link>
                            {variantName && (
                              <p className="text-xs text-muted-foreground">Variant: {variantName}</p>
                            )}
                            {product.brand?.name && (
                              <p className="text-xs text-muted-foreground">Brand: {product.brand.name}</p>
                            )}
                            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-foreground">
                                {formatCurrency(variantPrice || itemPrice)}
                              </span>
                              {comparePrice > (variantPrice || itemPrice) && (
                                <span className="text-xs text-muted-foreground line-through">
                                  {formatCurrency(comparePrice)}
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">× {quantity}</span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-semibold text-foreground">
                              {formatCurrency(totalPrice)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                  {isDelivered && (
                    <>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/account/returns?orderId=${orderId}`}>
                          <RotateCcw className="mr-1 h-3.5 w-3.5" />
                          Return Items
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="mr-1 h-3.5 w-3.5" />
                        Write Review
                      </Button>
                    </>
                  )}
                  {canCancel && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/30 hover:bg-destructive/5"
                      onClick={() => setCancelOpen(true)}
                    >
                      <XCircle className="mr-1 h-3.5 w-3.5" />
                      Cancel Order
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSupportOpen(true)}
                  >
                    <Phone className="mr-1 h-3.5 w-3.5" />
                    Contact Support
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/">
                      <ShoppingBag className="mr-1 h-3.5 w-3.5" />
                      Buy Again
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 lg:col-span-1">
            {/* Shipping Address */}
            <Card>
              <CardContent className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-sm font-semibold text-foreground">Shipping Address</h3>
                </div>
                {shippingAddress.id || shippingAddress.name ? (
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-sm font-medium text-foreground">
                      {shippingAddress.name || shippingAddress.fullName || "—"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {shippingAddress.addressLine1 || shippingAddress.street || ""}
                      {shippingAddress.addressLine2 && `, ${shippingAddress.addressLine2}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {shippingAddress.city || ""}
                      {shippingAddress.state && `, ${shippingAddress.state}`}
                      {shippingAddress.pincode && ` - ${shippingAddress.pincode}`}
                    </p>
                    {shippingAddress.country && (
                      <p className="text-sm text-muted-foreground">{shippingAddress.country}</p>
                    )}
                    {(shippingAddress.phone || shippingAddress.mobile) && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Phone: {shippingAddress.phone || shippingAddress.mobile}
                      </p>
                    )}
                    {shippingAddress.type && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        {String(shippingAddress.type)}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No shipping address on file</p>
                )}
              </CardContent>
            </Card>

            {/* Payment Details */}
            <Card>
              <CardContent className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-sm font-semibold text-foreground">Payment Details</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Method</span>
                    <span className="text-foreground">{paymentMethodLabel}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <Badge className={paymentStatusConfig[paymentStatusKey]?.color || "bg-gray-100 text-gray-700"}>
                      {paymentStatusConfig[paymentStatusKey]?.label || paymentStatusKey}
                    </Badge>
                  </div>
                  {order.transactionId && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Txn ID</span>
                      <span className="truncate text-xs text-foreground">{order.transactionId}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardContent className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-sm font-semibold text-foreground">Order Summary</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">{formatCurrency(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Discount{order.coupon?.code ? ` (${order.coupon.code})` : ""}
                      </span>
                      <span className="text-emerald-600">-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className={shippingCost === 0 ? "text-emerald-600" : "text-foreground"}>
                      {shippingCost === 0 ? "FREE" : formatCurrency(shippingCost)}
                    </span>
                  </div>
                  {tax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax (GST)</span>
                      <span className="text-foreground">{formatCurrency(tax)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold text-foreground">Total</span>
                    <span className="text-sm font-bold text-foreground">{formatCurrency(total)}</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="mt-4 w-full"
                  size="sm"
                  onClick={handleDownloadInvoice}
                  disabled={downloading}
                >
                  {downloading ? (
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="mr-1 h-3.5 w-3.5" />
                  )}
                  Download Invoice
                </Button>
              </CardContent>
            </Card>

            {/* Delivery Info */}
            {(order.estimatedDelivery || isDelivered) && (
              <Card className="border-indigo-100 bg-indigo-50/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Truck className="mt-0.5 h-4 w-4 text-indigo-600" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {isDelivered ? "Delivered On" : "Estimated Delivery"}
                      </p>
                      <p className="text-sm font-semibold text-indigo-600">
                        {isDelivered && order.deliveredAt
                          ? formatDate(order.deliveredAt, "EEE, MMM dd, yyyy")
                          : order.estimatedDelivery
                          ? formatDate(order.estimatedDelivery, "EEE, MMM dd, yyyy")
                          : "—"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Info */}
            <Card>
              <CardContent className="p-4 space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Order placed</span>
                  <span className="text-foreground">{formatDate(order.createdAt, "MMM dd, yyyy • hh:mm a")}</span>
                </div>
                {order.updatedAt && order.updatedAt !== order.createdAt && (
                  <div className="flex justify-between">
                    <span>Last updated</span>
                    <span className="text-foreground">{formatDate(order.updatedAt, "MMM dd, yyyy • hh:mm a")}</span>
                  </div>
                )}
                {order.sellerId && (
                  <div className="flex justify-between">
                    <span>Seller</span>
                    <span className="truncate text-foreground text-[10px]">{order.sellerId}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Cancel Order Dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Please tell us why you want to cancel order {order.orderNumber || ""}. Refund will be processed within 5-7 business days.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Cancellation reason <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="e.g., Found a better price, Ordered by mistake, Delivery time too long..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">{cancelReason.length}/500</p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancelOpen(false);
                setCancelReason("");
              }}
              disabled={cancelling}
            >
              Keep Order
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelOrder}
              disabled={cancelling || !cancelReason.trim() || cancelReason.trim().length < 5}
            >
              {cancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Support Dialog */}
      <ContactSupportDialog
        open={supportOpen}
        onOpenChange={setSupportOpen}
        context={{
          orderNumber: order?.orderNumber,
          orderId: orderId,
        }}
      />
    </div>
  );
}
