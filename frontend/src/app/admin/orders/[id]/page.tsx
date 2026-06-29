"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  CreditCard,
  FileText,
  Save,
  Send,
  Circle,
  Loader2,
  PackageX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate, getImageUrl } from "@/lib/utils";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";

const orderStatusConfig: Record<string, { label: string; variant: any }> = {
  PENDING: { label: "Pending", variant: "warning" },
  CONFIRMED: { label: "Confirmed", variant: "default" },
  PROCESSING: { label: "Processing", variant: "default" },
  PACKED: { label: "Packed", variant: "secondary" },
  SHIPPED: { label: "Shipped", variant: "secondary" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", variant: "secondary" },
  DELIVERED: { label: "Delivered", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
  RETURNED: { label: "Returned", variant: "outline" },
  REFUNDED: { label: "Refunded", variant: "outline" },
};

function AdminOrderSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div>
            <Skeleton className="h-7 w-48" />
            <Skeleton className="mt-1 h-4 w-36" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-28" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex gap-4 rounded-lg border p-4">
                  <Skeleton className="h-20 w-20 flex-shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [orderData, setOrderData] = useState<any>(null);
  const [status, setStatus] = useState("");
  const [newNote, setNewNote] = useState("");
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getOrderById(id);
      const order = data?.data?.data || data?.order || data?.data || data;
      if (order && (order.id || order.orderNumber)) {
        setOrderData(order);
        setStatus(order.status || order.orderStatus || "PENDING");
        setNotes(order.notes || order.statusHistory || []);
      } else {
        setError("Order not found");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load order");
      toast.error("Failed to load order", { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!status) {
      toast.error("Please select a status");
      return;
    }
    try {
      setUpdating(true);
      await adminService.updateOrderStatus(id, status);
      setOrderData((prev: any) => prev ? ({ ...prev, status }) : prev);
      toast.success("Order status updated", {
        description: `Status changed to ${orderStatusConfig[status]?.label || status}`,
      });
      setNewNote("");
    } catch (err: any) {
      toast.error("Failed to update status", { description: err.message });
    } finally {
      setUpdating(false);
    }
  };

  const handleAddNote = () => {
    if (!newNote.trim()) {
      toast.error("Please enter a note");
      return;
    }
    setNotes((prev) => [
      ...prev,
      {
        id: String(prev.length + 1),
        text: newNote,
        author: "Admin",
        createdAt: new Date().toISOString(),
      },
    ]);
    setNewNote("");
    toast.success("Note added");
  };

  // Safe accessors with fallbacks
  const orderNumber = orderData?.orderNumber || orderData?.id || "—";
  const orderItems = useMemo(() => {
    const items = orderData?.items || [];
    return Array.isArray(items) ? items : [];
  }, [orderData]);
  const subtotal = Number(orderData?.subtotal || orderItems.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0));
  const shipping = Number(orderData?.shippingCharge || orderData?.shipping || 0);
  const tax = Number(orderData?.tax || orderData?.taxAmount || 0);
  const discount = Number(orderData?.discount || orderData?.discountAmount || 0);
  const total = Number(orderData?.total || (subtotal + shipping + tax - discount));
  const createdAt = orderData?.createdAt || new Date().toISOString();
  const paymentMethod = orderData?.paymentMethod || "—";
  const paymentStatus = orderData?.paymentStatus || "PENDING";
  const customer = orderData?.user || orderData?.customer || {};
  const shippingAddress = orderData?.shippingAddress || orderData?.address || {};
  const statusHistory = orderData?.statusHistory || orderData?.timeline || notes;

  if (loading) return <AdminOrderSkeleton />;

  if (error || !orderData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/orders">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Order Not Found</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <PackageX className="mb-4 h-16 w-16 text-muted-foreground/50" />
            <h2 className="text-xl font-semibold text-foreground">Unable to load order</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              {error || "This order may have been deleted or you don't have access to it."}
            </p>
            <div className="mt-6 flex gap-2">
              <Button variant="outline" onClick={fetchOrder}>Try Again</Button>
              <Link href="/admin/orders">
                <Button className="bg-indigo-600 hover:bg-indigo-700">Back to Orders</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/orders">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{orderNumber}</h1>
            <p className="text-sm text-gray-500">
              Placed on {formatDate(createdAt, "MMM dd, yyyy 'at' hh:mm a")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={orderStatusConfig[status]?.variant || "default"}>
            {orderStatusConfig[status]?.label || status}
          </Badge>
          <Button variant="outline" className="gap-2">
            <Printer className="h-4 w-4" />
            Print Invoice
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Items ({orderItems.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {orderItems.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No items in this order</div>
              ) : (
                <>
                  <div className="space-y-4">
                    {orderItems.map((item: any) => {
                      const itemId = item.id || item._id || item.productId;
                      const product = item.product || item;
                      const name = product.name || item.name || "Product";
                      const image = product.images?.[0]?.url || product.images?.[0] || item.image;
                      const qty = item.quantity || 1;
                      const price = Number(item.price || product.minPrice || 0);
                      return (
                        <div key={itemId} className="flex gap-4 rounded-lg border p-4">
                          <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                            {image ? (
                              <img
                                src={getImageUrl(image)}
                                alt={name}
                                className="h-full w-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).src = "/images/placeholder.svg"; }}
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-2xl">📦</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="truncate font-medium text-gray-900">{name}</h3>
                            {item.variant?.name && (
                              <p className="text-sm text-gray-500">Variant: {item.variant.name}</p>
                            )}
                            <div className="mt-2 flex items-center justify-between">
                              <p className="text-sm text-gray-600">Qty: {qty}</p>
                              <p className="font-semibold text-gray-900">{formatCurrency(price * qty)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="text-gray-900">{formatCurrency(subtotal)}</span>
                    </div>
                    {shipping > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Shipping</span>
                        <span className="text-gray-900">{formatCurrency(shipping)}</span>
                      </div>
                    )}
                    {tax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Tax</span>
                        <span className="text-gray-900">{formatCurrency(tax)}</span>
                      </div>
                    )}
                    {discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Discount</span>
                        <span className="font-medium text-emerald-600">-{formatCurrency(discount)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gray-900">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {statusHistory.length > 0 ? (
                <div className="relative ml-3 space-y-6">
                  <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200" />
                  {statusHistory.map((step: any, index: number) => {
                    const label = typeof step === "string" ? step : (step.status || step.label || "Update");
                    const date = typeof step === "object" ? (step.createdAt || step.date) : null;
                    const completed = step.completed ?? true;
                    return (
                      <div key={index} className="relative flex gap-4">
                        <div
                          className={`absolute left-0 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full ${
                            completed ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {completed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                        </div>
                        <div className="ml-4">
                          <p className={`font-medium ${completed ? "text-gray-900" : "text-gray-400"}`}>{label}</p>
                          {date && <p className="text-xs text-gray-500">{formatDate(date, "MMM dd, yyyy 'at' hh:mm a")}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-4 text-center text-sm text-muted-foreground">No timeline yet</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notes.length === 0 ? (
                  <p className="py-2 text-sm text-muted-foreground">No notes yet</p>
                ) : (
                  notes.map((note: any) => (
                    <div key={note.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{note.author || "Admin"}</span>
                        <span className="text-xs text-gray-400">{formatDate(note.createdAt, "MMM dd, hh:mm a")}</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{note.text}</p>
                    </div>
                  ))
                )}
                <Textarea
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="min-h-[80px]"
                />
                <Button size="sm" onClick={handleAddNote} className="gap-2">
                  <Send className="h-4 w-4" />
                  Add Note
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Update Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={status} onValueChange={setStatus} disabled={updating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(orderStatusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="w-full gap-2" onClick={handleStatusUpdate} disabled={updating}>
                {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {updating ? "Updating..." : "Update Status"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5" />
                Payment Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Method</span>
                <span className="text-gray-900">{paymentMethod}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <Badge
                  variant={
                    paymentStatus === "PAID"
                      ? "success"
                      : paymentStatus === "PENDING"
                      ? "warning"
                      : "destructive"
                  }
                >
                  {paymentStatus}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              {shippingAddress?.fullName || shippingAddress?.name ? (
                <div className="space-y-1 text-sm text-gray-600">
                  <p className="font-medium text-gray-900">
                    {shippingAddress.fullName || shippingAddress.name}
                  </p>
                  <p>{shippingAddress.street || shippingAddress.addressLine1}</p>
                  {shippingAddress.addressLine2 && <p>{shippingAddress.addressLine2}</p>}
                  <p>
                    {shippingAddress.city}, {shippingAddress.state} - {shippingAddress.pincode}
                  </p>
                  {shippingAddress.phone && (
                    <p className="pt-1">Phone: {shippingAddress.phone}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No address on file</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Customer Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Name</span>
                <span className="text-gray-900">{customer.firstName ? `${customer.firstName} ${customer.lastName || ""}`.trim() : customer.name || "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Email</span>
                <span className="text-gray-900">{customer.email || "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Phone</span>
                <span className="text-gray-900">{customer.phone || "—"}</span>
              </div>
              {customer.id && (
                <Link href={`/admin/customers/${customer.id}`}>
                  <Button variant="outline" className="mt-2 w-full">
                    View Customer Profile
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
