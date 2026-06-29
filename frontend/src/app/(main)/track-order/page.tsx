"use client";

import { useState } from "react";
import {
  Package,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  CircleDot,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface OrderStatus {
  status: string;
  location: string;
  time: string;
  completed: boolean;
}

const mockOrderData = {
  orderNumber: "ORD-2024-7X9K",
  status: "SHIPPED",
  estimatedDelivery: "Dec 28, 2024",
  product: {
    name: "Samsung Galaxy S24 Ultra - Titanium Black",
    image: "https://placehold.co/100x100?text=Product",
    quantity: 1,
    price: 129999,
  },
  tracking: [
    {
      status: "Order Placed",
      location: "Online",
      time: "Dec 24, 2024 - 10:30 AM",
      completed: true,
    },
    {
      status: "Order Confirmed",
      location: "Mumbai Warehouse",
      time: "Dec 24, 2024 - 11:45 AM",
      completed: true,
    },
    {
      status: "Shipped",
      location: "Mumbai Distribution Center",
      time: "Dec 25, 2024 - 09:15 AM",
      completed: true,
    },
    {
      status: "In Transit",
      location: "Delhi Hub",
      time: "Dec 26, 2024 - 02:30 PM",
      completed: false,
    },
    {
      status: "Out for Delivery",
      location: "Local Delivery Station",
      time: "Estimated: Dec 28, 2024",
      completed: false,
    },
    {
      status: "Delivered",
      location: "Your Address",
      time: "Estimated: Dec 28, 2024",
      completed: false,
    },
  ] as OrderStatus[],
};

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [orderData, setOrderData] = useState<typeof mockOrderData | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;

    setIsSearching(true);
    await new Promise((r) => setTimeout(r, 1200));
    setOrderData(mockOrderData);
    setIsSearching(false);
  };

  const getStatusIcon = (status: string, completed: boolean) => {
    if (completed) return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    switch (status) {
      case "Shipped":
        return <Truck className="h-5 w-5 text-primary" />;
      case "In Transit":
        return <Truck className="h-5 w-5 text-orange-500" />;
      case "Out for Delivery":
        return <MapPin className="h-5 w-5 text-blue-500" />;
      case "Delivered":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="mb-10 text-center">
        <Badge className="mb-3">Order Tracking</Badge>
        <h1 className="text-4xl font-bold mb-3">Track Your Order</h1>
        <p className="text-lg text-muted-foreground">
          Enter your order number to get real-time updates
        </p>
      </div>

      {/* Search Form */}
      <div className="mx-auto mb-10 max-w-xl">
        <form onSubmit={handleTrack} className="flex gap-2">
          <div className="relative flex-1">
            <Package className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Enter order number (e.g., ORD-2024-7X9K)"
              className="pl-10 h-12"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
            />
          </div>
          <Button type="submit" size="lg" disabled={isSearching}>
            {isSearching ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Track
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Order Details */}
      {orderData && (
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Order Info */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Order {orderData.orderNumber}</h2>
                <p className="text-sm text-muted-foreground">
                  Estimated delivery: {orderData.estimatedDelivery}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    orderData.status === "DELIVERED"
                      ? "bg-green-500"
                      : "bg-primary"
                  }
                >
                  {orderData.status}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    navigator.clipboard.writeText(orderData.orderNumber)
                  }
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Product */}
            <div className="mt-6 flex items-center gap-4 rounded-lg bg-muted/50 p-4">
              <div className="flex h-16 w-16 items-center justify-center rounded bg-muted">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{orderData.product.name}</p>
                <p className="text-sm text-muted-foreground">
                  Qty: {orderData.product.quantity}
                </p>
              </div>
              <p className="font-semibold">
                ₹{orderData.product.price.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          {/* Tracking Timeline */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="mb-6 text-lg font-bold">Tracking Updates</h3>
            <div className="relative">
              {orderData.tracking.map((step, idx) => (
                <div
                  key={idx}
                  className="relative flex gap-4 pb-8 last:pb-0"
                >
                  {/* Line */}
                  {idx < orderData.tracking.length - 1 && (
                    <div
                      className={`absolute left-[9px] top-8 h-full w-0.5 ${
                        step.completed ? "bg-green-500" : "bg-muted"
                      }`}
                    />
                  )}
                  {/* Icon */}
                  <div className="relative z-10 mt-0.5">
                    {getStatusIcon(step.status, step.completed)}
                  </div>
                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className={`font-medium ${
                          step.completed
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {step.status}
                      </p>
                      {!step.completed && idx > 0 && (
                        <CircleDot className="h-3 w-3 text-orange-400" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {step.location}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Need Help */}
          <div className="rounded-xl bg-muted/50 p-6 text-center">
            <p className="text-muted-foreground mb-3">
              Have questions about your order?
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" asChild>
                <a href="/contact">Contact Support</a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="/help">Visit Help Center</a>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
