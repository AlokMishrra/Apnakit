"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Save, ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  let pass = "";
  for (let i = 0; i < 12; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
  return pass;
}

export default function NewDeliveryPersonPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    vehicleType: "MOTORCYCLE",
    licenseNumber: "",
    vehicleNumber: "",
    password: "",
  });

  const handleGeneratePassword = () => {
    const pw = generatePassword();
    setForm((p) => ({ ...p, password: pw }));
    setShowPassword(true);
    toast.success("Password generated");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.email || !form.phone || !form.password) {
      toast.error("Please fill all required fields including password");
      return;
    }
    setSaving(true);
    try {
      await adminService.createDeliveryPartner({
        firstName: form.firstName,
        lastName: form.lastName || undefined,
        email: form.email,
        phone: form.phone,
        password: form.password,
        vehicleType: form.vehicleType,
        licenseNumber: form.licenseNumber || undefined,
        vehicleNumber: form.vehicleNumber || undefined,
      });
      toast.success("Delivery person created successfully");
      router.push("/admin/dashboard");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to create delivery person";
      toast.error("Failed to create delivery person", { description: Array.isArray(msg) ? msg[0] : msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/dashboard" className="hover:text-foreground">Dashboard</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">Add Delivery Person</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Add Delivery Person</h1>
          <p className="text-sm text-muted-foreground">Create a new delivery partner account</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">First Name *</label>
                  <Input
                    value={form.firstName}
                    onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                    placeholder="First name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Last Name</label>
                  <Input
                    value={form.lastName}
                    onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                    placeholder="Last name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email *</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="delivery@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone *</label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+91 98765 43210"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password *</label>
                <div className="flex gap-2">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    placeholder="Enter or generate password"
                    className="flex-1"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGeneratePassword}
                    title="Generate password"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vehicle Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Vehicle Type</label>
                <select
                  value={form.vehicleType}
                  onChange={(e) => setForm((p) => ({ ...p, vehicleType: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="MOTORCYCLE">Motorcycle</option>
                  <option value="SCOOTER">Scooter</option>
                  <option value="BICYCLE">Bicycle</option>
                  <option value="CAR">Car</option>
                  <option value="VAN">Van</option>
                  <option value="TRUCK">Truck</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">License Number</label>
                <Input
                  value={form.licenseNumber}
                  onChange={(e) => setForm((p) => ({ ...p, licenseNumber: e.target.value }))}
                  placeholder="DL-1234567890"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Vehicle Number</label>
                <Input
                  value={form.vehicleNumber}
                  onChange={(e) => setForm((p) => ({ ...p, vehicleNumber: e.target.value }))}
                  placeholder="MH-01-AB-1234"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/dashboard">Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Create Delivery Person
          </Button>
        </div>
      </form>
    </div>
  );
}
