"use client";

import { useState, useEffect } from "react";
import {
  Store,
  Truck,
  CreditCard,
  Percent,
  Loader2,
  Save,
  Globe,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { settingsService, type AllSettings } from "@/services/settings.service";

const TABS = [
  { value: "store", label: "Store Info", icon: Store },
  { value: "shipping", label: "Delivery", icon: Truck },
  { value: "tax", label: "GST / Tax", icon: Percent },
  { value: "payment", label: "Payment", icon: CreditCard },
];

const PAYMENT_METHODS = [
  { key: "cod", label: "Cash on Delivery", description: "Pay when you receive your order" },
  { key: "razorpay", label: "Razorpay", description: "UPI, Cards, Net Banking, Wallets" },
  { key: "upi", label: "UPI", description: "Google Pay, PhonePe, Paytm" },
  { key: "card", label: "Credit/Debit Card", description: "Visa, Mastercard, RuPay" },
  { key: "netbanking", label: "Net Banking", description: "All major banks" },
  { key: "wallet", label: "Wallet", description: "Paytm, PhonePe, Amazon Pay" },
];

const DEFAULTS: AllSettings = {
  delivery: { deliveryCharge: 99, freeDeliveryThreshold: 999, enableFreeDelivery: true },
  tax: { gstRate: 18, gstEnabled: true, gstNumber: "", companyName: "ApnaKit" },
  store: { storeName: "ApnaKit", storeEmail: "support@apnakit.in", storePhone: "+91 1800-123-4567", storeDescription: "Your trusted online shopping destination.", currency: "INR" },
  payment: {
    cod: { enabled: true },
    razorpay: { enabled: true },
    upi: { enabled: false },
    card: { enabled: false },
    netbanking: { enabled: false },
    wallet: { enabled: false },
  },
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("store");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AllSettings>(DEFAULTS);

  useEffect(() => {
    (async () => {
      try {
        const data = await settingsService.getSettings();
        setSettings({ ...DEFAULTS, ...data });
      } catch {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSaveStore = async () => {
    setSaving(true);
    try {
      await settingsService.updateStoreSettings(settings.store);
      toast.success("Store info saved");
    } catch {
      toast.error("Failed to save store info");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDelivery = async () => {
    setSaving(true);
    try {
      await settingsService.updateDeliverySettings(settings.delivery);
      toast.success("Delivery settings saved");
    } catch {
      toast.error("Failed to save delivery settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTax = async () => {
    setSaving(true);
    try {
      await settingsService.updateTaxSettings(settings.tax);
      toast.success("GST settings saved");
    } catch {
      toast.error("Failed to save GST settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePayment = async () => {
    setSaving(true);
    try {
      await settingsService.updatePaymentSettings(settings.payment);
      toast.success("Payment settings saved");
    } catch {
      toast.error("Failed to save payment settings");
    } finally {
      setSaving(false);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your store settings and configurations
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="w-full shrink-0 lg:w-64">
            <div className="sticky top-4">
              <TabsList className="flex h-auto w-full flex-col rounded-xl border bg-white p-2 shadow-sm lg:h-auto">
                {TABS.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex w-full items-center justify-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700"
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>

          <div className="flex-1 space-y-6">
            {/* Store Info */}
            <TabsContent value="store" className="mt-0 space-y-6">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Store Information</CardTitle>
                  <CardDescription>Basic information about your store</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <Input
                      label="Store Name"
                      value={settings.store.storeName}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          store: { ...prev.store, storeName: e.target.value },
                        }))
                      }
                    />
                    <Input
                      label="Store Email"
                      type="email"
                      value={settings.store.storeEmail}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          store: { ...prev.store, storeEmail: e.target.value },
                        }))
                      }
                    />
                    <Input
                      label="Phone Number"
                      value={settings.store.storePhone}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          store: { ...prev.store, storePhone: e.target.value },
                        }))
                      }
                    />
                    <Input
                      label="Currency"
                      value={settings.store.currency}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          store: { ...prev.store, currency: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Store Description</label>
                    <textarea
                      value={settings.store.storeDescription}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          store: { ...prev.store, storeDescription: e.target.value },
                        }))
                      }
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleSaveStore} disabled={saving}>
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save Store Info
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Delivery */}
            <TabsContent value="shipping" className="mt-0 space-y-6">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Delivery Charges</CardTitle>
                  <CardDescription>Configure delivery charges that apply at checkout</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <Input
                      label="Delivery Charge (₹)"
                      type="number"
                      value={settings.delivery.deliveryCharge}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          delivery: { ...prev.delivery, deliveryCharge: Number(e.target.value) },
                        }))
                      }
                    />
                    <Input
                      label="Free Delivery Above (₹)"
                      type="number"
                      value={settings.delivery.freeDeliveryThreshold}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          delivery: { ...prev.delivery, freeDeliveryThreshold: Number(e.target.value) },
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="text-sm font-medium">Enable Free Delivery</p>
                      <p className="text-xs text-muted-foreground">
                        Orders above the threshold get free delivery
                      </p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={settings.delivery.enableFreeDelivery}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            delivery: { ...prev.delivery, enableFreeDelivery: e.target.checked },
                          }))
                        }
                        className="peer sr-only"
                      />
                      <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:bg-violet-600 peer-checked:after:translate-x-full peer-checked:after:border-white" />
                    </label>
                  </div>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                    <p className="font-medium">How it works:</p>
                    <ul className="mt-1 list-inside list-disc space-y-0.5">
                      <li>If free delivery is ON and cart ≥ ₹{settings.delivery.freeDeliveryThreshold.toLocaleString("en-IN")} → FREE</li>
                      <li>Otherwise → ₹{settings.delivery.deliveryCharge.toLocaleString("en-IN")} delivery charge</li>
                    </ul>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleSaveDelivery} disabled={saving}>
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save Delivery Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* GST / Tax */}
            <TabsContent value="tax" className="mt-0 space-y-6">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">GST / Tax Configuration</CardTitle>
                  <CardDescription>Configure GST applied to all products at checkout</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="text-sm font-medium">Enable GST</p>
                      <p className="text-xs text-muted-foreground">Apply GST tax to product prices</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={settings.tax.gstEnabled}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            tax: { ...prev.tax, gstEnabled: e.target.checked },
                          }))
                        }
                        className="peer sr-only"
                      />
                      <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:bg-violet-600 peer-checked:after:translate-x-full peer-checked:after:border-white" />
                    </label>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <Input
                      label="GST Rate (%)"
                      type="number"
                      value={settings.tax.gstRate}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          tax: { ...prev.tax, gstRate: Number(e.target.value) },
                        }))
                      }
                    />
                    <Input
                      label="GSTIN (GST Number)"
                      placeholder="22AAAAA0000A1Z5"
                      value={settings.tax.gstNumber}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          tax: { ...prev.tax, gstNumber: e.target.value },
                        }))
                      }
                    />
                    <Input
                      label="Company Name"
                      value={settings.tax.companyName}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          tax: { ...prev.tax, companyName: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
                    <p className="font-medium">How it works:</p>
                    <ul className="mt-1 list-inside list-disc space-y-0.5">
                      <li>GST is calculated as {settings.tax.gstRate}% of the product subtotal</li>
                      <li>Displayed as &quot;GST ({settings.tax.gstRate}%)&quot; on checkout</li>
                    </ul>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleSaveTax} disabled={saving}>
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save GST Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payment */}
            <TabsContent value="payment" className="mt-0 space-y-6">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Payment Methods</CardTitle>
                  <CardDescription>Enable or disable payment methods shown at checkout</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {PAYMENT_METHODS.map((method) => (
                    <div
                      key={method.key}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <p className="text-sm font-medium">{method.label}</p>
                        <p className="text-xs text-muted-foreground">{method.description}</p>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={settings.payment[method.key as keyof typeof settings.payment]?.enabled ?? false}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              payment: {
                                ...prev.payment,
                                [method.key]: { enabled: e.target.checked },
                              },
                            }))
                          }
                          className="peer sr-only"
                        />
                        <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:bg-violet-600 peer-checked:after:translate-x-full peer-checked:after:border-white" />
                      </label>
                    </div>
                  ))}
                  <div className="flex justify-end">
                    <Button onClick={handleSavePayment} disabled={saving}>
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save Payment Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
