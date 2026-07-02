"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Truck,
  ArrowRight,
  ShoppingBag,
  ClipboardList,
  Copy,
  Check,
  Loader2,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, getImageUrl } from "@/lib/utils";
import { toast } from "sonner";

function ConfettiPiece({ delay, left }: { delay: number; left: number }) {
  const colors = ["#6366f1", "#818cf8", "#a78bfa", "#c4b5fd", "#34d399", "#fbbf24", "#f472b6"];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const rotation = Math.random() * 360;
  const size = Math.random() * 8 + 4;

  return (
    <div
      className="pointer-events-none fixed top-0 z-50"
      style={{
        left: `${left}%`,
        animation: `confetti-fall 3s ease-in ${delay}s forwards`,
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          transform: `rotate(${rotation}deg)`,
        }}
      />
    </div>
  );
}

function OrderSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [confettiPieces] = useState(() =>
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      delay: Math.random() * 2,
      left: Math.random() * 100,
    }))
  );

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        });
        if (!mounted) return;
        if (res.ok) {
          const raw = await res.json();
          console.log("Order details response:", JSON.stringify(raw, null, 2));
          const data = raw.data?.data || raw.data || raw;
          setOrder(data);
        } else {
          toast.error("Failed to load order details");
        }
      } catch {
        toast.error("Network error loading order");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [orderId]);

  const handleCopyOrder = () => {
    if (!order?.orderNumber) return;
    navigator.clipboard.writeText(order.orderNumber);
    setCopied(true);
    toast.success("Order number copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <Skeleton className="mx-auto mb-4 h-20 w-20 rounded-full" />
          <Skeleton className="mx-auto h-8 w-64" />
          <Skeleton className="mx-auto mt-2 h-4 w-48" />
        </div>
        <Skeleton className="mb-6 h-24 w-full rounded-lg" />
        <Skeleton className="mb-6 h-48 w-full rounded-lg" />
        <Skeleton className="mb-6 h-32 w-full rounded-lg" />
      </div>
    );
  }

  const orderItems = order?.items || [];
  const orderNumber = order?.orderNumber || order?.id || "N/A";
  const total = order?.total || 0;
  const estimatedDelivery = (() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 20);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  })();
  const address = order?.shippingAddress;

  return (
    <>
      <style jsx global>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes scale-check { 0% { transform: scale(0); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
        .animate-scale-check { animation: scale-check 0.5s ease-out forwards; }
        @keyframes fade-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-up { animation: fade-up 0.5s ease-out forwards; }
        .animate-fade-up-delay-1 { animation-delay: 0.1s; opacity: 0; }
        .animate-fade-up-delay-2 { animation-delay: 0.2s; opacity: 0; }
        .animate-fade-up-delay-3 { animation-delay: 0.3s; opacity: 0; }
        .animate-fade-up-delay-4 { animation-delay: 0.4s; opacity: 0; }
      `}</style>

      {confettiPieces.map((piece) => (
        <ConfettiPiece key={piece.id} delay={piece.delay} left={piece.left} />
      ))}

      <div className="min-h-screen bg-gray-50/50">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 animate-scale-check">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold text-foreground animate-fade-up">
              Order Placed Successfully!
            </h1>
            <p className="mt-2 text-muted-foreground animate-fade-up animate-fade-up-delay-1">
              Thank you for shopping with ApnaKit
            </p>
          </div>

          <Card className="mb-6 animate-fade-up animate-fade-up-delay-1">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">Order Number</p>
              <div className="mt-1 flex items-center justify-center gap-2">
                <span className="text-xl font-bold text-indigo-600">{orderNumber}</span>
                <button
                  onClick={handleCopyOrder}
                  className="rounded-md p-1 hover:bg-gray-100 transition-colors"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                A confirmation has been sent to your registered email
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6 animate-fade-up animate-fade-up-delay-2">
            <CardContent className="p-6">
              <h3 className="mb-4 text-base font-semibold text-foreground">Order Details</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-lg bg-indigo-50 p-4">
                  <Truck className="h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Delivery in</p>
                    <p className="text-sm font-semibold text-indigo-600">{estimatedDelivery}</p>
                  </div>
                </div>

                {orderItems.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-foreground">Items Ordered ({orderItems.length})</p>
                    <div className="space-y-2">
                      {orderItems.map((item: any, idx: number) => {
                        const product = item.product || item;
                        const image = product.images?.[0]?.url || product.images?.[0];
                        const name = product.name || "Product";
                        const qty = item.quantity || 1;
                        const price = Number(item.price || product.minPrice || 0);
                        return (
                          <div key={idx} className="flex items-center justify-between gap-3 text-sm">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {image && (
                                <img
                                  src={getImageUrl(image)}
                                  alt={name}
                                  className="h-8 w-8 flex-shrink-0 rounded object-cover"
                                  onError={(e) => { (e.target as HTMLImageElement).src = "/images/placeholder.svg"; }}
                                />
                              )}
                              <span className="text-muted-foreground truncate">
                                {name} {qty > 1 ? `x ${qty}` : ""}
                                {item.variant?.name && (
                                  <span className="ml-1 text-xs">({item.variant.name})</span>
                                )}
                              </span>
                            </div>
                            <span className="text-foreground font-medium whitespace-nowrap">
                              {formatCurrency(price * qty)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-foreground">Total Paid</span>
                    <span className="text-base font-bold text-indigo-600">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {address && (
            <Card className="mb-6 animate-fade-up animate-fade-up-delay-3">
              <CardContent className="p-6">
                <h3 className="mb-2 text-base font-semibold text-foreground">Delivery Address</h3>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-sm font-medium text-foreground">{address.fullName || address.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {address.street || address.addressLine1}
                    {address.addressLine2 ? `, ${address.addressLine2}` : ""}, {address.city}, {address.state} - {address.pincode}
                  </p>
                  {address.phone && (
                    <p className="text-sm text-muted-foreground">Phone: {address.phone}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col gap-3 sm:flex-row animate-fade-up animate-fade-up-delay-4">
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full" size="lg">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Continue Shopping
              </Button>
            </Link>
            <Link href="/account/orders" className="flex-1">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700" size="lg">
                <ClipboardList className="mr-2 h-4 w-4" />
                View Orders
              </Button>
            </Link>
          </div>

          <div className="mt-8 text-center text-sm text-muted-foreground animate-fade-up animate-fade-up-delay-4">
            <p>
              Need help?{" "}
              <Link href="/account/support" className="font-medium text-indigo-600 hover:text-indigo-700">
                Contact Support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}
