"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Trash2,
  Heart,
  Tag,
  Truck,
  ShieldCheck,
  Clock,
  ArrowRight,
  X,
  Plus,
  Minus,
  PackageOpen,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate, getImageUrl } from "@/lib/utils";
import { cartService } from "@/services/cart.service";
import { useCartActions } from "@/hooks/use-cart-actions";
import { toast } from "sonner";
import { CartPageSkeleton } from "@/components/skeletons/cart-skeleton";

const FREE_DELIVERY_THRESHOLD = 999;

export default function CartPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<any>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    type: "fixed" | "percent";
  } | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await cartService.getCart();
      const data = (res as any)?.data?.data || (res as any)?.data || res;
      setCart(data);
    } catch (err: any) {
      if (err.message?.includes("Unauthorized") || err.message?.includes("401")) {
        toast.error("Please login to view your cart");
        router.push("/login");
        return;
      }
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  const cartItems = cart?.items || [];
  const subtotal = cartItems.reduce(
    (sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 1),
    0
  );
  const totalOriginal = cartItems.reduce(
    (sum: number, item: any) => sum + (item.originalPrice || item.price || 0) * (item.quantity || 1),
    0
  );
  const itemSavings = totalOriginal - subtotal;
  const shippingCharge = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : 99;
  const taxRate = 0.18;
  const taxAmount = Math.round(subtotal * taxRate);

  let couponDiscount = 0;
  if (appliedCoupon) {
    couponDiscount =
      appliedCoupon.type === "percent"
        ? Math.round((subtotal * appliedCoupon.discount) / 100)
        : appliedCoupon.discount;
  }

  const totalAmount = subtotal + shippingCharge + taxAmount - couponDiscount;
  const freeDeliveryProgress = Math.min((subtotal / FREE_DELIVERY_THRESHOLD) * 100, 100);
  const amountForFreeDelivery = Math.max(FREE_DELIVERY_THRESHOLD - subtotal, 0);

  // Use the shared cart actions for instant UI updates (Redux), debounced server sync
  const cartActions = useCartActions();

  const handleUpdateQuantity = async (itemId: string, newQuantity: number, product?: any) => {
    if (newQuantity < 1) return;
    try {
      setUpdatingItem(itemId);
      if (product && product._id) {
        // Use the optimistic cart action — UI updates instantly
        cartActions.setQuantity(
          {
            ...product,
            stock:
              (product as any).stock ??
              (product.variants?.[0] as any)?.stock ??
              9999,
          } as any,
          newQuantity
        );
      } else {
        const res = await cartService.updateCartItem(itemId, newQuantity);
        const data = (res as any)?.data?.data || (res as any)?.data || res;
        setCart(data);
      }
    } catch (err: any) {
      toast.error("Could not update quantity", { description: err.message });
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleRemoveItem = async (itemId: string, product?: any) => {
    try {
      setUpdatingItem(itemId);
      if (product && product._id) {
        cartActions.remove({ ...product, stock: 9999 } as any);
      } else {
        const res = await cartService.removeFromCart(itemId);
        const data = (res as any)?.data?.data || (res as any)?.data || res;
        setCart(data);
      }
      toast.success("Item removed from cart", {
        description: "The item has been removed",
      });
    } catch (err: any) {
      toast.error("Could not remove item", { description: err.message });
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }
    try {
      setIsApplyingCoupon(true);
      const res = await cartService.applyCoupon(couponCode.trim().toUpperCase());
      const data = (res as any)?.data?.data || (res as any)?.data || res;
      setCart(data);
      const coupon = data?.coupon || appliedCoupon;
      if (coupon) {
        setAppliedCoupon({
          code: coupon.code || couponCode.trim().toUpperCase(),
          discount: coupon.discountPercent
            ? Number(coupon.discountPercent)
            : coupon.discountAmount
            ? Number(coupon.discountAmount)
            : 10,
          type: coupon.discountType === "FIXED" || coupon.discountType === "fixed" ? "fixed" : "percent",
        });
        toast.success("Coupon applied! 🎉", {
          description: `Code ${coupon.code || couponCode.toUpperCase()} applied to your cart`,
        });
      }
    } catch (err: any) {
      toast.error("Invalid coupon code", { description: err.message });
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      const res = await cartService.removeCoupon();
      const data = (res as any)?.data?.data || (res as any)?.data || res;
      setCart(data);
      setAppliedCoupon(null);
      setCouponCode("");
      toast.success("Coupon removed");
    } catch (err: any) {
      toast.error("Could not remove coupon", { description: err.message });
    }
  };

  if (loading) {
    return <CartPageSkeleton />;
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[60vh]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="mb-8 text-2xl font-bold text-foreground">Shopping Cart</h1>
          <Card>
            <CardContent className="py-16">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="mb-6 rounded-full bg-indigo-50 p-6">
                  <ShoppingCart className="h-16 w-16 text-indigo-300" />
                </div>
                <h2 className="mb-2 text-xl font-semibold text-foreground">Your cart is empty</h2>
                <p className="mb-8 max-w-sm text-muted-foreground">
                  Looks like you haven&apos;t added anything to your cart yet. Explore our products and find something you love.
                </p>
                <Link href="/">
                  <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Start Shopping
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">
            Shopping Cart{" "}
            <span className="text-base font-normal text-muted-foreground">
              ({cartItems.length} {cartItems.length === 1 ? "item" : "items"})
            </span>
          </h1>
          <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-700">
            Continue Shopping
          </Link>
        </div>

        {subtotal < FREE_DELIVERY_THRESHOLD && (
          <Card className="mb-6 border-indigo-100 bg-indigo-50/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-indigo-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Add {formatCurrency(amountForFreeDelivery)} more for{" "}
                    <span className="text-indigo-600">FREE delivery</span>
                  </p>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-indigo-100">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                      style={{ width: `${freeDeliveryProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {cartItems.map((item: any) => {
                const product = item.product || item;
                const variant = item.variant || product.variants?.[0];
                const itemId = item.id || item._id || `${product.id}-${variant?.id}`;
                const price = Number(item.price || variant?.price || product.minPrice || 0);
                const originalPrice = Number(
                  item.originalPrice || variant?.compareAtPrice || product.maxPrice || price
                );
                const image =
                  item.image || product.images?.[0]?.url || product.images?.[0] || "";
                  const name = item.name || product.name || "Product";
                  const brand = item.brand || product.brand?.name || "";
                  // Use the product's real stock (the backend getCart includes the
                  // full product so item.product.stock is the source of truth).
                  // Fall back to the variant's stock if the cart item has one.
                  const productStock = (product as any)?.stock;
                  const variantStock = (variant as any)?.stock;
                  const stock =
                    typeof productStock === "number"
                      ? productStock
                      : typeof variantStock === "number"
                      ? variantStock
                      : 9999;
                const deliveryDate = new Date();
                deliveryDate.setDate(deliveryDate.getDate() + 3);

                return (
                  <Card key={itemId} className="overflow-hidden">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex gap-4">
                        <Link
                          href={`/product/${product.slug || ""}`}
                          className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-32 sm:w-32"
                        >
                          {image ? (
                            <img
                              src={getImageUrl(image)}
                              alt={name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/images/placeholder.svg";
                              }}
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-2xl text-muted-foreground">
                              📦
                            </div>
                          )}
                        </Link>
                        <div className="flex flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              {brand && (
                                <p className="text-xs font-medium text-indigo-600 uppercase">
                                  {brand}
                                </p>
                              )}
                              <Link
                                href={`/product/${product.slug || ""}`}
                                className="mt-0.5 block text-sm font-medium text-foreground line-clamp-2 hover:text-indigo-600 sm:text-base"
                              >
                                {name}
                              </Link>
                              {variant?.name && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Variant: {variant.name}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                               onClick={() => handleRemoveItem(itemId, product)}
                                disabled={updatingItem === itemId}
                            >
                              {updatingItem === itemId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>

                          <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
                            <div>
                              <div className="flex items-baseline gap-2">
                                <span className="text-lg font-bold text-foreground">
                                  {formatCurrency(price)}
                                </span>
                                {originalPrice > price && (
                                  <span className="text-sm text-muted-foreground line-through">
                                    {formatCurrency(originalPrice)}
                                  </span>
                                )}
                              </div>
                              {originalPrice > price && (
                                <p className="mt-0.5 text-xs font-medium text-emerald-600">
                                  You save {formatCurrency((originalPrice - price) * item.quantity)}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                disabled={stock === 0 || updatingItem === itemId || item.quantity <= 1}
                                 onClick={() => handleUpdateQuantity(itemId, item.quantity - 1, product)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center text-sm font-medium">
                                {updatingItem === itemId ? (
                                  <Loader2 className="mx-auto h-3 w-3 animate-spin" />
                                ) : (
                                  item.quantity
                                )}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                disabled={stock === 0 || updatingItem === itemId || item.quantity >= stock}
                                 onClick={() => handleUpdateQuantity(itemId, item.quantity + 1, product)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center gap-2 text-xs">
                            {stock > 0 ? (
                              <Badge variant="success" className="text-xs">In Stock</Badge>
                            ) : (
                              <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                            )}
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              Delivery by {formatDate(deliveryDate.toISOString(), "EEE, MMM dd")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="h-4 w-4 text-indigo-600" />
                    <span className="text-sm font-medium text-foreground">Apply Coupon</span>
                  </div>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between rounded-lg bg-emerald-50 p-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="success" className="text-xs">{appliedCoupon.code}</Badge>
                        <span className="text-sm text-emerald-700">
                          {appliedCoupon.type === "percent"
                            ? `${appliedCoupon.discount}% off`
                            : `${formatCurrency(appliedCoupon.discount)} off`}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={handleRemoveCoupon}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="h-9 text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-4"
                        onClick={handleApplyCoupon}
                        disabled={isApplyingCoupon}
                      >
                        {isApplyingCoupon ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Apply"
                        )}
                      </Button>
                    </div>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Try: WELCOME10, FLAT200, or FREESHIP
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h3 className="mb-4 text-base font-semibold text-foreground">Order Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Price ({cartItems.length} {cartItems.length === 1 ? "item" : "items"})
                      </span>
                      <span className="text-foreground">{formatCurrency(totalOriginal)}</span>
                    </div>
                    {itemSavings > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Discount</span>
                        <span className="font-medium text-emerald-600">-{formatCurrency(itemSavings)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivery Charges</span>
                      {shippingCharge === 0 ? (
                        <span className="font-medium text-emerald-600">FREE</span>
                      ) : (
                        <span className="text-foreground">{formatCurrency(shippingCharge)}</span>
                      )}
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax (GST 18%)</span>
                      <span className="text-foreground">{formatCurrency(taxAmount)}</span>
                    </div>
                    {couponDiscount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Coupon Discount</span>
                        <span className="font-medium text-emerald-600">-{formatCurrency(couponDiscount)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-base font-semibold text-foreground">Total Amount</span>
                      <span className="text-base font-bold text-foreground">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>
                    {itemSavings > 0 && (
                      <p className="text-xs font-medium text-emerald-600">
                        You will save {formatCurrency(itemSavings + couponDiscount)} on this order
                      </p>
                    )}
                  </div>
                  <Link href="/checkout" onClick={() => toast.info("Proceeding to checkout...", { description: "Review your order details" })}>
                    <Button className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700" size="lg">
                      Place Order
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Safe and secure payment</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-indigo-100 bg-indigo-50/30">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Truck className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-600" />
                      <div>
                        <p className="text-xs font-medium text-foreground">Free Delivery</p>
                        <p className="text-xs text-muted-foreground">
                          On orders above {formatCurrency(FREE_DELIVERY_THRESHOLD)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-600" />
                      <div>
                        <p className="text-xs font-medium text-foreground">Secure Payment</p>
                        <p className="text-xs text-muted-foreground">100% secure checkout</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-600" />
                      <div>
                        <p className="text-xs font-medium text-foreground">Easy Returns</p>
                        <p className="text-xs text-muted-foreground">7-day return policy</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
