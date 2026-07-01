"use client";

import { useState, useEffect } from "react";
import {
  Store,
  Truck,
  CreditCard,
  Bell,
  Search,
  Shield,
  Upload,
  Save,
  Globe,
  Key,
  Loader2,
  Percent,
  Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { settingsService, type AllSettings } from "@/services/settings.service";

const tabs = [
  { value: "shipping", label: "Delivery", icon: Truck },
  { value: "tax", label: "GST / Tax", icon: Percent },
];

const DEFAULTS: AllSettings = {
  delivery: { deliveryCharge: 99, freeDeliveryThreshold: 999, enableFreeDelivery: true },
  tax: { gstRate: 18, gstEnabled: true, gstNumber: "", companyName: "ApnaKit" },
  store: { storeName: "ApnaKit", storeEmail: "support@apnakit.in", storePhone: "+91 1800-123-4567", storeDescription: "", currency: "INR" },
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("shipping");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AllSettings>(DEFAULTS);

  useEffect(() => {
    (async () => {
      try {
        const data = await settingsService.getSettings();
        setSettings(data);
      } catch {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
          Manage delivery charges and GST configuration
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="w-full shrink-0 lg:w-64">
            <div className="sticky top-4">
              <TabsList className="flex h-auto w-full flex-col rounded-xl border bg-white p-2 shadow-sm lg:h-auto">
                {tabs.map((tab) => (
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
            <TabsContent value="shipping" className="mt-0 space-y-6">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Delivery Charges</CardTitle>
                  <CardDescription>
                    Configure delivery charges that apply at checkout
                  </CardDescription>
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
                          delivery: {
                            ...prev.delivery,
                            freeDeliveryThreshold: Number(e.target.value),
                          },
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
                            delivery: {
                              ...prev.delivery,
                              enableFreeDelivery: e.target.checked,
                            },
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
                      <li>
                        If free delivery is ON and cart total ≥ ₹{settings.delivery.freeDeliveryThreshold.toLocaleString("en-IN")} → delivery is FREE
                      </li>
                      <li>
                        Otherwise → ₹{settings.delivery.deliveryCharge.toLocaleString("en-IN")} delivery charge applies
                      </li>
                    </ul>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleSaveDelivery} disabled={saving}>
                      {saving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save Delivery Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tax" className="mt-0 space-y-6">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">GST / Tax Configuration</CardTitle>
                  <CardDescription>
                    Configure GST rate applied to all products at checkout
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="text-sm font-medium">Enable GST</p>
                      <p className="text-xs text-muted-foreground">
                        Apply GST tax to product prices at checkout
                      </p>
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
                      <li>
                        GST is calculated as {settings.tax.gstRate}% of the product subtotal
                      </li>
                      <li>
                        Applied to all products unless GST is disabled
                      </li>
                      <li>
                        Displayed as "GST ({settings.tax.gstRate}%)" on the checkout page
                      </li>
                    </ul>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleSaveTax} disabled={saving}>
                      {saving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save GST Settings
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
