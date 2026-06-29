"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  IndianRupee,
  Truck,
  MapPin,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";
import { getSafeErrorMessage } from "@/lib/safe-error";

export default function NewDeliveryZonePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    pincode: "",
    city: "",
    state: "",
    country: "India",
    isActive: true,
    codEnabled: true,
    prepaidOnly: false,
    minOrderFreeDelivery: "" as string | number,
    estimatedDays: 3,
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(form.pincode)) {
      toast.error("Pincode must be exactly 6 digits");
      return;
    }
    if (!form.city.trim() || !form.state.trim()) {
      toast.error("City and state are required");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: any = {
        pincode: form.pincode,
        city: form.city.trim(),
        state: form.state.trim(),
        country: form.country.trim() || "India",
        isActive: form.isActive,
        codEnabled: form.codEnabled,
        prepaidOnly: form.prepaidOnly,
        estimatedDays: Number(form.estimatedDays) || 3,
        notes: form.notes.trim() || undefined,
      };
      if (form.minOrderFreeDelivery !== "" && form.minOrderFreeDelivery !== undefined) {
        payload.minOrderFreeDelivery = Number(form.minOrderFreeDelivery);
      }
      await adminService.createDeliveryZone(payload);
      toast.success("Delivery zone created");
      router.push("/admin/delivery-zones");
    } catch (err: any) {
      const msg = err?.response?.data?.message || getSafeErrorMessage(err);
      if (msg.toLowerCase().includes("already exists")) {
        toast.error("This pincode already exists in delivery zones");
      } else {
        toast.error("Failed to create zone", { description: msg });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/delivery-zones">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Delivery Zone</h1>
          <p className="text-sm text-muted-foreground">
            Add a new pincode to the delivery serviceable list
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Pincode <span className="text-red-500">*</span>
                    </label>
                    <Input
                      required
                      maxLength={6}
                      pattern="\d{6}"
                      value={form.pincode}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          pincode: e.target.value.replace(/\D/g, "").slice(0, 6),
                        }))
                      }
                      placeholder="110001"
                      className="font-mono"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      6-digit Indian postal code
                    </p>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Country</label>
                    <Input
                      value={form.country}
                      onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
                      placeholder="India"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      City <span className="text-red-500">*</span>
                    </label>
                    <Input
                      required
                      value={form.city}
                      onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                      placeholder="New Delhi"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      State <span className="text-red-500">*</span>
                    </label>
                    <Input
                      required
                      value={form.state}
                      onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                      placeholder="Delhi"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Notes (optional)
                  </label>
                  <Input
                    value={form.notes}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                    placeholder="e.g., Express delivery only, Remote area surcharge"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Delivery Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    <Truck className="mr-1 inline h-4 w-4" />
                    Estimated delivery (days)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={String(form.estimatedDays)}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, estimatedDays: Number(e.target.value) || 3 }))
                    }
                    className="w-32"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    <IndianRupee className="mr-1 inline h-4 w-4" />
                    Min order for free delivery (₹, optional)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={String(form.minOrderFreeDelivery)}
                    onChange={(e) => setForm((p) => ({ ...p, minOrderFreeDelivery: e.target.value }))}
                    placeholder="e.g., 499"
                    className="w-40"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Orders above this amount get free delivery
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-emerald-50 p-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-emerald-900">
                      Active Zone
                    </p>
                    <p className="text-xs text-emerald-700">
                      Customers in this pincode can place orders
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      form.isActive ? "bg-emerald-500" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        form.isActive ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">COD Enabled</p>
                    <p className="text-xs text-blue-700">
                      Allow cash on delivery for this zone
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, codEnabled: !p.codEnabled }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      form.codEnabled ? "bg-blue-500" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        form.codEnabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-amber-50 p-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-900">Prepaid Only</p>
                    <p className="text-xs text-amber-700">
                      Force online payment only (disable COD)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, prepaidOnly: !p.prepaidOnly }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      form.prepaidOnly ? "bg-amber-500" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        form.prepaidOnly ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
                  <p className="flex items-center gap-1 font-semibold">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Tip
                  </p>
                  <p className="mt-1 text-blue-800">
                    For best coverage, add multiple pincodes per city. The hero
                    location modal will only show pincodes that exist in this list.
                  </p>
                </div>
                <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Zone
                </Button>
                <Link href="/admin/delivery-zones" className="block">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
