"use client";

import { useState, useEffect, use } from "react";
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
  Plus,
  X,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";
import { getSafeErrorMessage } from "@/lib/safe-error";

interface CityItem {
  name: string;
  isActive: boolean;
}

export default function EditDeliveryZonePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    pincode: "",
    city: "",
    state: "",
    country: "India",
    isActive: true,
    codEnabled: true,
    prepaidOnly: false,
    minOrderFreeDelivery: "" as string | number,
    deliveryTimeUnit: "days" as "minutes" | "hours" | "days",
    estimatedDays: 3,
    estimatedHours: "" as string | number,
    estimatedMinutes: "" as string | number,
    notes: "",
  });
  const [cities, setCities] = useState<CityItem[]>([]);
  const [newCityName, setNewCityName] = useState("");

  useEffect(() => {
    const fetchZone = async () => {
      try {
        const res = await adminService.getDeliveryZone(id);
        const zone = res?.data || res;
        setForm({
          pincode: zone.pincode || "",
          city: zone.city || "",
          state: zone.state || "",
          country: zone.country || "India",
          isActive: zone.isActive ?? true,
          codEnabled: zone.codEnabled ?? true,
          prepaidOnly: zone.prepaidOnly ?? false,
          minOrderFreeDelivery: zone.minOrderFreeDelivery ?? "",
          deliveryTimeUnit: (zone.deliveryTimeUnit as any) || "days",
          estimatedDays: zone.estimatedDays ?? 3,
          estimatedHours: zone.estimatedHours ?? "",
          estimatedMinutes: zone.estimatedMinutes ?? "",
          notes: zone.notes || "",
        });
        if (zone.cities && Array.isArray(zone.cities)) {
          setCities(zone.cities);
        }
      } catch (err: any) {
        toast.error("Failed to load delivery zone");
        router.push("/admin/delivery-zones");
      } finally {
        setLoading(false);
      }
    };
    fetchZone();
  }, [id, router]);

  const addCity = () => {
    const name = newCityName.trim();
    if (!name) return;
    if (cities.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      toast.error("City already added");
      return;
    }
    setCities((prev) => [...prev, { name, isActive: true }]);
    setNewCityName("");
  };

  const removeCity = (index: number) => {
    setCities((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleCity = (index: number) => {
    setCities((prev) =>
      prev.map((c, i) => (i === index ? { ...c, isActive: !c.isActive } : c))
    );
  };

  const getDeliveryEstimate = (): string => {
    switch (form.deliveryTimeUnit) {
      case "minutes":
        return `${form.estimatedMinutes || 30} min`;
      case "hours":
        return `${form.estimatedHours || 2} hr`;
      case "days":
      default:
        return `${form.estimatedDays || 3} day(s)`;
    }
  };

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
        deliveryTimeUnit: form.deliveryTimeUnit,
        notes: form.notes.trim() || undefined,
      };
      if (form.deliveryTimeUnit === "days") {
        payload.estimatedDays = Number(form.estimatedDays) || 3;
      } else if (form.deliveryTimeUnit === "hours") {
        payload.estimatedHours = Number(form.estimatedHours) || 2;
      } else {
        payload.estimatedMinutes = Number(form.estimatedMinutes) || 30;
      }
      if (form.minOrderFreeDelivery !== "" && form.minOrderFreeDelivery !== undefined) {
        payload.minOrderFreeDelivery = Number(form.minOrderFreeDelivery);
      }
      if (cities.length > 0) {
        payload.cities = cities;
      }
      await adminService.updateDeliveryZone(id, payload);
      toast.success("Delivery zone updated");
      router.push("/admin/delivery-zones");
    } catch (err: any) {
      const msg = err?.response?.data?.message || getSafeErrorMessage(err);
      if (msg.toLowerCase().includes("already exists")) {
        toast.error("This pincode already exists in delivery zones");
      } else {
        toast.error("Failed to update zone", { description: msg });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/delivery-zones">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Delivery Zone</h1>
          <p className="text-sm text-muted-foreground">
            Update delivery zone settings for pincode {form.pincode}
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

                {/* Multiple Cities */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Additional Cities (optional)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={newCityName}
                      onChange={(e) => setNewCityName(e.target.value)}
                      placeholder="Enter city name"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCity();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" size="icon" onClick={addCity}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {cities.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {cities.map((city, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-md border px-3 py-1.5"
                        >
                          <span className="text-sm">{city.name}</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleCity(idx)}
                              className={`rounded p-0.5 ${
                                city.isActive ? "text-green-600" : "text-gray-400"
                              }`}
                              title={city.isActive ? "Active" : "Inactive"}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeCity(idx)}
                              className="rounded p-0.5 text-red-500 hover:text-red-700"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Add other cities that share this pincode. Toggle to enable/disable each.
                  </p>
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
                {/* Delivery Time Unit */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    <Truck className="mr-1 inline h-4 w-4" />
                    Estimated Delivery Time
                  </label>
                  <div className="flex gap-2 mb-3">
                    {[
                      { value: "minutes", label: "Minutes" },
                      { value: "hours", label: "Hours" },
                      { value: "days", label: "Days" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setForm((p) => ({ ...p, deliveryTimeUnit: opt.value as any }))
                        }
                        className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                          form.deliveryTimeUnit === opt.value
                            ? "border-blue-600 bg-blue-50 text-blue-700"
                            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {form.deliveryTimeUnit === "minutes" && (
                    <Input
                      type="number"
                      min={1}
                      max={1440}
                      value={String(form.estimatedMinutes)}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          estimatedMinutes: e.target.value,
                        }))
                      }
                      placeholder="e.g., 30"
                      className="w-32"
                    />
                  )}
                  {form.deliveryTimeUnit === "hours" && (
                    <Input
                      type="number"
                      min={1}
                      max={168}
                      value={String(form.estimatedHours)}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          estimatedHours: e.target.value,
                        }))
                      }
                      placeholder="e.g., 2"
                      className="w-32"
                    />
                  )}
                  {form.deliveryTimeUnit === "days" && (
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      value={String(form.estimatedDays)}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          estimatedDays: Number(e.target.value) || 3,
                        }))
                      }
                      className="w-32"
                    />
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Estimated delivery: <strong>{getDeliveryEstimate()}</strong>
                  </p>
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
                  Save Changes
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
