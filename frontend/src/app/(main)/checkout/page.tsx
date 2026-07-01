"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Truck,
  ShieldCheck,
  Package,
  Building2,
  Wallet,
  Banknote,
  Smartphone,
  CircleDot,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, getImageUrl } from "@/lib/utils";
import { cartService } from "@/services/cart.service";
import { userService } from "@/services/user.service";
import { AddressForm, type AddressFormData } from "@/components/address/address-form";
import { deliveryZoneService } from "@/services/delivery-zone.service";
import { paymentService } from "@/services/payment.service";
import { useSettings } from "@/hooks/use-settings";
import { loadRazorpayScript } from "@/lib/razorpay";
import { toast } from "sonner";

const steps = [
  { id: 1, label: "Address", icon: MapPin },
  { id: 2, label: "Payment", icon: CreditCard },
  { id: 3, label: "Review", icon: CheckCircle2 },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { settings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [selectedPayment, setSelectedPayment] = useState("COD");
  const [currentStep, setCurrentStep] = useState(1);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  // Form key to reset the AddressForm when reopened
  const [newAddressKey, setNewAddressKey] = useState(0);

  // Fetch cart and addresses on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [cartRes, addrRes] = await Promise.all([
          cartService.getCart(),
          userService.getAddresses().catch(() => null),
        ]);
        if (!mounted) return;
        const cartData =
          (cartRes as any)?.data?.data ||
          (cartRes as any)?.data ||
          {};
        setCart(cartData);
        const addrData =
          (addrRes as any)?.data?.data ||
          (addrRes as any)?.data ||
          [];
        const addrArr = Array.isArray(addrData) ? addrData : [];

        // Verify each address's pincode is serviceable. Unservicable addresses
        // are flagged so the customer is forced to add a serviceable one
        // before they can continue to payment.
        const verified = await Promise.all(
          addrArr.map(async (a: any) => {
            if (!a.pincode) return { ...a, _serviceable: false };
            try {
              const res = await deliveryZoneService.check(a.pincode);
              const payload = (res as any)?.data ?? res;
              return { ...a, _serviceable: !!payload?.serviceable };
            } catch {
              return { ...a, _serviceable: false };
            }
          })
        );
        setAddresses(verified);

        // Pick a serviceable default; if the saved default is unserviceable,
        // auto-select the first serviceable address.
        const serviceableAddrs = verified.filter((a: any) => a._serviceable);
        if (serviceableAddrs.length === 0 && verified.length > 0) {
          toast.warning("Saved addresses are not serviceable", {
            description:
              "None of your saved addresses are in our delivery area yet. Please add a new address with a serviceable pincode.",
          });
        }
        const preferred =
          verified.find((a: any) => a.isDefault && a._serviceable) ||
          serviceableAddrs[0] ||
          verified[0];
        if (preferred) setSelectedAddressId(preferred.id || preferred._id);
      } catch (err: any) {
        if (err.message?.includes("Unauthorized") || err.message?.includes("401")) {
          toast.error("Please login to checkout");
          router.push("/login");
        } else {
          toast.error("Failed to load checkout data", { description: err.message });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [router]);

  // Computed values
  const cartItems = useMemo(() => cart?.items || [], [cart]);
  const subtotal = useMemo(
    () => cartItems.reduce((sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 1), 0),
    [cartItems]
  );
  const totalOriginal = useMemo(
    () => cartItems.reduce(
      (sum: number, item: any) => sum + (item.originalPrice || item.price || 0) * (item.quantity || 1),
      0
    ),
    [cartItems]
  );
  const itemSavings = totalOriginal - subtotal;
  const deliveryThreshold = settings?.delivery?.freeDeliveryThreshold ?? 999;
  const deliveryCharge = settings?.delivery?.deliveryCharge ?? 99;
  const enableFreeDelivery = settings?.delivery?.enableFreeDelivery ?? true;
  const gstRate = (settings?.tax?.gstRate ?? 18) / 100;
  const gstEnabled = settings?.tax?.gstEnabled ?? true;
  const shippingCharge = enableFreeDelivery && subtotal >= deliveryThreshold ? 0 : deliveryCharge;
  const taxAmount = gstEnabled ? Math.round(subtotal * gstRate) : 0;
  const totalAmount = subtotal + shippingCharge + taxAmount;

  const paymentMethods = [
    { id: "COD", label: "Cash on Delivery", icon: Banknote, description: "Pay when you receive", available: settings?.payment?.cod?.enabled ?? true },
    { id: "RAZORPAY", label: "Razorpay", icon: CreditCard, description: "Credit/Debit Card, UPI, Net Banking", available: settings?.payment?.razorpay?.enabled ?? true },
    { id: "UPI", label: "UPI", icon: Smartphone, description: "Google Pay, PhonePe, Paytm", available: settings?.payment?.upi?.enabled ?? false },
    { id: "CARD", label: "Credit/Debit Card", icon: CreditCard, description: "Visa, Mastercard, RuPay", available: settings?.payment?.card?.enabled ?? false },
    { id: "NETBANKING", label: "Net Banking", icon: Building2, description: "All major banks", available: settings?.payment?.netbanking?.enabled ?? false },
    { id: "WALLET", label: "Wallet", icon: Wallet, description: "Paytm, PhonePe, Amazon Pay", available: settings?.payment?.wallet?.enabled ?? false },
  ];

  const selectedAddress = useMemo(
    () => addresses.find((a) => (a.id || a._id) === selectedAddressId),
    [addresses, selectedAddressId]
  );

  const handleSaveNewAddress = async (data: AddressFormData) => {
    try {
      setSavingAddress(true);
      const res = await userService.createAddress({
        ...data,
        isDefault: addresses.length === 0 || data.isDefault,
      });
      const payload = (res as any)?.data?.data || (res as any)?.data;
      if (payload) {
        const newAddr = { ...payload, id: payload.id || payload._id };
        setAddresses((prev) => [...prev, newAddr]);
        setSelectedAddressId(newAddr.id);
        setShowNewAddress(false);
        setNewAddressKey((k) => k + 1);
        toast.success("Address saved!", { description: "New delivery address added" });
      }
    } catch (err: any) {
      toast.error("Failed to save address", { description: err.message });
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await userService.deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => (a.id || a._id) !== id));
      if (selectedAddressId === id) {
        const remaining = addresses.filter((a) => (a.id || a._id) !== id);
        setSelectedAddressId(remaining[0] ? (remaining[0].id || remaining[0]._id) : "");
      }
      toast.success("Address removed");
    } catch (err: any) {
      toast.error("Failed to remove address", { description: err.message });
    }
  };

  const handleNextStep = useCallback(() => {
    if (currentStep === 1 && !selectedAddressId) {
      toast.error("Please select a delivery address");
      return;
    }
    if (currentStep === 1) {
      const sel = addresses.find((a) => (a.id || a._id) === selectedAddressId);
      if (sel && sel._serviceable === false) {
        toast.error("Selected address is not serviceable", {
          description: "Please choose a serviceable address or add a new one.",
        });
        return;
      }
    }
    if (currentStep === 2 && !selectedPayment) {
      toast.error("Please select a payment method");
      return;
    }
    if (currentStep < 3) {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep, selectedAddressId, selectedPayment]);

  const handlePrevStep = useCallback(() => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  }, [currentStep]);

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast.error("Please select a delivery address");
      setCurrentStep(1);
      return;
    }
    const sel = addresses.find((a) => (a.id || a._id) === selectedAddressId);
    if (sel && sel._serviceable === false) {
      toast.error("Selected address is not serviceable", {
        description: "Please choose a serviceable address or add a new one.",
      });
      setCurrentStep(1);
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      router.push("/cart");
      return;
    }

    if (selectedPayment === "RAZORPAY") {
      try {
        setIsPlacingOrder(true);
        toast.info("Preparing payment...", { description: "Please wait" });

        // Step 1: Create order (pending payment)
        const orderRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
          body: JSON.stringify({ addressId: selectedAddressId, paymentMethod: selectedPayment }),
        });
        const orderRaw = await orderRes.json();
        if (!orderRes.ok) {
          toast.error(orderRaw.message || "Failed to create order");
          setIsPlacingOrder(false);
          return;
        }
        const order = orderRaw.data?.data || orderRaw.data || orderRaw;

        // Step 2: Create Razorpay order
        const rzRes = await paymentService.createPaymentOrder(order.id);
        const rzData = rzRes.data?.data || rzRes.data;
        if (!rzData?.razorpayOrderId) {
          toast.error("Failed to create payment order");
          setIsPlacingOrder(false);
          return;
        }

        // Step 3: Load and open Razorpay
        await loadRazorpayScript();

        const rzPayload = {
          key: rzData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: rzData.amount,
          currency: rzData.currency || "INR",
          name: "ApnaKit",
          description: `Order #${order.orderNumber || order.id}`,
          order_id: rzData.razorpayOrderId,
          handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
            try {
              // Step 4: Verify payment
              const verifyRes = await paymentService.verifyPayment({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              if (verifyRes.data?.success || verifyRes.data?.status === "PAID") {
                toast.success("Payment successful! 🎉", { description: `Order #${order.orderNumber || order.id} confirmed` });
                router.push(`/checkout/success?orderId=${order.id}`);
              } else {
                toast.error("Payment verification failed");
              }
            } catch (verifyErr: any) {
              toast.error(verifyErr?.message || "Payment verification failed");
            }
          },
          prefill: {
            name: sel?.name || "",
            email: sel?.email || "",
            contact: sel?.phone || "",
          },
          theme: { color: "#6366f1" },
          modal: {
            ondismiss: () => {
              toast.error("Payment cancelled", { description: "Your order is saved but payment was not completed" });
              setIsPlacingOrder(false);
            },
          },
        };

        const razorpay = new (window as any).Razorpay(rzPayload);
        razorpay.on("payment.failed", (response: { error: { description: string } }) => {
          toast.error("Payment failed", { description: response.error?.description || "Please try again" });
          setIsPlacingOrder(false);
        });
        razorpay.open();
      } catch (err: any) {
        toast.error(err?.message || "Payment failed");
        setIsPlacingOrder(false);
      }
      return;
    }

    // COD flow
    try {
      setIsPlacingOrder(true);
      toast.info("Placing your order...", { description: "Please wait" });
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        body: JSON.stringify({ addressId: selectedAddressId, paymentMethod: selectedPayment }),
      });
      const raw = await res.json();
      if (!res.ok) {
        const msg = raw.message || "Failed to place order";
        toast.error("Order failed", { description: msg });
        setIsPlacingOrder(false);
        return;
      }
      const order = raw.data?.data || raw.data || raw;
      toast.success("Order placed successfully! 🎉", {
        description: `Order #${order.orderNumber || order.id} confirmed`,
        duration: 3000,
      });
      router.push(`/checkout/success?orderId=${order.id}`);
    } catch (err: any) {
      toast.error("Network error", { description: "Could not place order" });
      setIsPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Skeleton className="mb-8 h-16 w-full rounded-lg" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
          <div>
            <Skeleton className="h-80 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[60vh]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="py-16 text-center">
              <Package className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50" />
              <h2 className="text-xl font-semibold text-foreground">Your cart is empty</h2>
              <p className="mt-2 text-sm text-muted-foreground">Add items to cart before checkout</p>
              <Link href="/">
                <Button className="mt-6 bg-indigo-600 hover:bg-indigo-700">Continue Shopping</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                      currentStep > step.id
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : currentStep === step.id
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-gray-200 bg-white text-gray-400"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium ${
                      currentStep >= step.id ? "text-indigo-600" : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`mx-2 mb-6 h-0.5 w-16 sm:w-24 ${
                      currentStep > step.id ? "bg-emerald-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {/* Step 1: Address */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MapPin className="h-5 w-5 text-indigo-600" />
                      Delivery Address
                    </CardTitle>
                    <Link
                      href="/account/addresses"
                      className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
                    >
                      Manage all
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {addresses.length === 0 && !showNewAddress && (
                    <div className="rounded-lg bg-amber-50 p-4 text-center text-sm text-amber-800">
                      No saved addresses. Please add a delivery address below.
                    </div>
                  )}
                  {addresses.map((address) => {
                    const id = address.id || address._id;
                    const isServiceable = address._serviceable !== false;
                    return (
                      <div
                        key={id}
                        className={`relative rounded-lg border-2 p-4 transition-all ${
                          !isServiceable
                            ? "cursor-not-allowed border-amber-200 bg-amber-50/40 opacity-80"
                            : selectedAddressId === id
                            ? "cursor-pointer border-indigo-600 bg-indigo-50/50"
                            : "cursor-pointer border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => isServiceable && setSelectedAddressId(id)}
                      >
                        <div className="flex items-start gap-3">
                          <CircleDot
                            className={`mt-1 h-4 w-4 flex-shrink-0 ${
                              !isServiceable
                                ? "text-amber-400"
                                : selectedAddressId === id
                                ? "text-indigo-600"
                                : "text-gray-300"
                            }`}
                          />
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {address.type || "HOME"}
                              </Badge>
                              {address.isDefault && (
                                <Badge variant="secondary" className="text-xs">Default</Badge>
                              )}
                              {!isServiceable && (
                                <Badge className="bg-amber-100 text-xs text-amber-700">
                                  Not serviceable
                                </Badge>
                              )}
                            </div>
                            <p className="mt-2 text-sm font-medium text-foreground">{address.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {address.addressLine1}
                              {address.addressLine2 ? `, ${address.addressLine2}` : ""}, {address.city}, {address.state} - {address.pincode}
                            </p>
                            <p className="text-sm text-muted-foreground">Phone: {address.phone}</p>
                            {!isServiceable && (
                              <p className="mt-1 text-xs text-amber-700">
                                Pincode {address.pincode} isn't serviceable yet — add a new address below.
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={(e) => { e.stopPropagation(); handleDeleteAddress(id); }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                  <Button
                    variant="outline"
                    className="w-full border-dashed"
                    onClick={() => {
                      if (!showNewAddress) setNewAddressKey((k) => k + 1);
                      setShowNewAddress(!showNewAddress);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Address
                    {showNewAddress ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                  </Button>

                  {showNewAddress && (
                    <Card className="border-dashed">
                      <CardContent className="p-4">
                        <AddressForm
                          key={newAddressKey}
                          submitLabel="Save Address"
                          hideDefault={addresses.length > 0}
                          onSubmit={handleSaveNewAddress}
                          onCancel={() => setShowNewAddress(false)}
                        />
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex justify-end pt-4">
                    <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleNextStep}>
                      Continue to Payment
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Payment */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CreditCard className="h-5 w-5 text-indigo-600" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`rounded-lg border-2 p-4 transition-all ${
                        !method.available
                          ? "cursor-not-allowed border-gray-100 bg-gray-50/50 opacity-60"
                          : selectedPayment === method.id
                            ? "cursor-pointer border-indigo-600 bg-indigo-50/50"
                            : "cursor-pointer border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => method.available && setSelectedPayment(method.id)}
                    >
                      <div className="flex items-center gap-3">
                        {method.available ? (
                          <CircleDot
                            className={`h-4 w-4 flex-shrink-0 ${
                              selectedPayment === method.id ? "text-indigo-600" : "text-gray-300"
                            }`}
                          />
                        ) : (
                          <div className="h-4 w-4 flex-shrink-0 rounded-full border-2 border-gray-300" />
                        )}
                        <method.icon className="h-5 w-5 text-gray-600" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">{method.label}</p>
                            {!method.available && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                                Coming Soon
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{method.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={handlePrevStep}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleNextStep}>
                      Review Order
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                    Review Your Order
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {selectedAddress && (
                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-foreground">Delivery Address</h4>
                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-sm font-medium text-foreground">{selectedAddress.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedAddress.addressLine1}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
                        </p>
                        <Button
                          variant="link"
                          size="sm"
                          className="mt-1 h-auto p-0 text-xs"
                          onClick={() => setCurrentStep(1)}
                        >
                          Change
                        </Button>
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-foreground">Payment Method</h4>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-sm text-foreground">
                        {paymentMethods.find((m) => m.id === selectedPayment)?.label}
                      </p>
                      <Button
                        variant="link"
                        size="sm"
                        className="mt-1 h-auto p-0 text-xs"
                        onClick={() => setCurrentStep(2)}
                      >
                        Change
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-foreground">Order Items ({cartItems.length})</h4>
                    <div className="space-y-3">
                      {cartItems.map((item: any) => {
                        const id = item.id || item._id;
                        const product = item.product || item;
                        const image = product.images?.[0]?.url || product.images?.[0] || item.image;
                        const name = product.name || item.name;
                        return (
                          <div key={id} className="flex gap-3 rounded-lg bg-gray-50 p-3">
                            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-white">
                              {image ? (
                                <img
                                  src={getImageUrl(image)}
                                  alt={name}
                                  className="h-full w-full object-cover"
                                  onError={(e) => { (e.target as HTMLImageElement).src = "/images/placeholder.svg"; }}
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-xl">📦</div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground line-clamp-1">{name}</p>
                              {item.variant?.name && (
                                <p className="text-xs text-muted-foreground">{item.variant.name}</p>
                              )}
                              <div className="mt-1 flex items-center gap-2">
                                <span className="text-sm font-bold text-foreground">
                                  {formatCurrency(item.price || 0)}
                                </span>
                                <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-foreground">
                                {formatCurrency((item.price || 0) * (item.quantity || 1))}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={handlePrevStep}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      className="bg-indigo-600 hover:bg-indigo-700"
                      onClick={handlePlaceOrder}
                      disabled={isPlacingOrder}
                    >
                      {isPlacingOrder ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="mr-2 h-4 w-4" />
                      )}
                      {isPlacingOrder ? "Placing Order..." : `Place Order — ${formatCurrency(totalAmount)}`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <Card>
                <CardContent className="p-4">
                  <h3 className="mb-4 text-base font-semibold text-foreground">Order Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Subtotal ({cartItems.length} items)
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
                      <span className="text-muted-foreground">Delivery</span>
                      {shippingCharge === 0 ? (
                        <span className="font-medium text-emerald-600">FREE</span>
                      ) : (
                        <span className="text-foreground">{formatCurrency(shippingCharge)}</span>
                      )}
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax (GST {settings?.tax?.gstRate ?? 18}%)</span>
                      <span className="text-foreground">{formatCurrency(taxAmount)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-base font-semibold text-foreground">Total</span>
                      <span className="text-base font-bold text-foreground">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>
                    {itemSavings > 0 && (
                      <p className="text-xs font-medium text-emerald-600">
                        You save {formatCurrency(itemSavings)} on this order
                      </p>
                    )}
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
