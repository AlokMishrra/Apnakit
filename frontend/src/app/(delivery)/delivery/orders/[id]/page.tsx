"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  Navigation,
  CheckCircle2,
  XCircle,
  Truck,
  Clock,
  MapPin,
  MessageSquare,
  Package,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { deliveryService } from "@/services/delivery.service";
import { toast } from "sonner";

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<any>(null);
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [showFailedDialog, setShowFailedDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await deliveryService.getAssignments();
        const items = Array.isArray(res?.data) ? res.data : (res?.data?.data || []);
        const found = items.find((o: any) => o.id === orderId || o._id === orderId || o.orderId === orderId);
        setOrder(found || null);
        setStatus(found?.status || "assigned");
      } catch (err: any) {
        toast.error("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  const handleMarkPickedUp = async () => {
    try {
      await deliveryService.updateAssignmentStatus(orderId, { status: "picked-up" });
      setStatus("picked_up");
      toast.success("Order marked as picked up");
    } catch (err: any) {
      toast.error("Failed to update status");
    }
  };

  const handleMarkDelivered = async () => {
    try {
      await deliveryService.updateAssignmentStatus(orderId, { status: "delivered" });
      setStatus("delivered");
      toast.success("Order marked as delivered");
    } catch (err: any) {
      toast.error("Failed to update status");
    }
  };

  const handleMarkFailed = async () => {
    try {
      await deliveryService.updateAssignmentStatus(orderId, { status: "failed" });
      setStatus("failed");
      setShowFailedDialog(false);
      toast.success("Order marked as failed");
    } catch (err: any) {
      toast.error("Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="mt-3 text-sm text-gray-500">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <Link
          href="/delivery/orders"
          className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-gray-300" />
            <p className="mt-4 text-sm text-gray-500">Order not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 lg:pb-4">
      {/* Back button */}
      <Link
        href="/delivery/orders"
        className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Orders
      </Link>

      {/* Order header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">{orderId}</h1>
              <p className="text-sm text-gray-500">
                Assigned at {order.assignedAt} • Est. {order.estimatedDelivery}
              </p>
            </div>
            <Badge
              variant={
                status === "delivered"
                  ? "success"
                  : status === "picked_up"
                  ? "warning"
                  : status === "failed"
                  ? "destructive"
                  : "default"
              }
              className="text-sm"
            >
              {status === "assigned"
                ? "Assigned"
                : status === "picked_up"
                ? "Picked Up"
                : status === "in_transit"
                ? "In Transit"
                : status === "delivered"
                ? "Delivered"
                : "Failed"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Customer info */}
      <Card>
        <CardContent className="p-4">
          <h2 className="mb-3 font-semibold text-gray-900">Customer Details</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <span className="text-sm font-bold text-blue-700">
                  {order.customer
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{order.customer}</p>
                <p className="text-sm text-gray-500">{order.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-gray-50 p-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              <p className="text-sm text-gray-700">{order.address}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => window.open(`tel:${order.phone}`, "_self")}
              >
                <Phone className="mr-1 h-4 w-4" />
                Call Customer
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`,
                    "_blank"
                  )
                }
              >
                <Navigation className="mr-1 h-4 w-4" />
                Navigate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order items */}
      <Card>
        <CardContent className="p-4">
          <h2 className="mb-3 font-semibold text-gray-900">Order Items</h2>
          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                    <Package className="h-6 w-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">Qty: {item.qty}</p>
                  </div>
                </div>
                <p className="font-medium text-gray-900">
                  {formatCurrency(item.price * item.qty)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t pt-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Item Total</span>
              <span className="font-medium">{formatCurrency(order.total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Delivery Fee</span>
              <span className="font-medium text-emerald-600">
                +{formatCurrency(order.deliveryFee)}
              </span>
            </div>
            <div className="mt-2 flex justify-between border-t pt-2">
              <span className="font-semibold text-gray-900">You Earn</span>
              <span className="font-bold text-emerald-600">
                {formatCurrency(order.deliveryFee)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery notes */}
      <Card>
        <CardContent className="p-4">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
            <MessageSquare className="h-4 w-4" />
            Delivery Notes
          </h2>
          <Textarea
            placeholder="Add notes about this delivery (optional)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Status timeline */}
      <Card>
        <CardContent className="p-4">
          <h2 className="mb-3 font-semibold text-gray-900">Order Timeline</h2>
          <div className="space-y-0">
            {order.timeline.map((event, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full",
                      idx === 0 ? "bg-emerald-100" : "bg-gray-100"
                    )}
                  >
                    <event.icon
                      className={cn(
                        "h-4 w-4",
                        idx === 0 ? "text-emerald-600" : "text-gray-400"
                      )}
                    />
                  </div>
                  {idx < order.timeline.length - 1 && (
                    <div className="h-8 w-0.5 bg-gray-200" />
                  )}
                </div>
                <div className="pb-4">
                  <p className="text-sm font-medium text-gray-900">
                    {event.event}
                  </p>
                  <p className="text-xs text-gray-500">{event.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Failed dialog */}
      {showFailedDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-900">
                Mark as Failed?
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Are you sure you want to mark this delivery as failed? This
                action cannot be undone.
              </p>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowFailedDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleMarkFailed}
                >
                  Mark Failed
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bottom action bar */}
      {status !== "delivered" && status !== "failed" && (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-white p-4 lg:static lg:border-0 lg:bg-transparent lg:p-0">
          <div className="flex gap-2">
            {status === "assigned" && (
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                size="lg"
                onClick={handleMarkPickedUp}
              >
                <Truck className="mr-2 h-4 w-4" />
                Mark Picked Up
              </Button>
            )}
            {status === "picked_up" && (
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                size="lg"
                onClick={handleMarkDelivered}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Mark Delivered
              </Button>
            )}
            <Button
              variant="destructive"
              size="lg"
              onClick={() => setShowFailedDialog(true)}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Failed
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
