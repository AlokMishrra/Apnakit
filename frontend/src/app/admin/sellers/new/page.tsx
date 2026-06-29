"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Save, ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  let pass = "";
  for (let i = 0; i < 12; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
  return pass;
}

export default function NewSellerPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    businessName: "",
    businessType: "INDIVIDUAL",
    gstNumber: "",
    panNumber: "",
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    commission: "10",
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
    if (!form.businessName || !form.email || !form.firstName || !form.password) {
      toast.error("Please fill all required fields including password");
      return;
    }
    setSaving(true);
    try {
      await adminService.createSeller({
        businessName: form.businessName,
        businessType: form.businessType,
        gstNumber: form.gstNumber || undefined,
        panNumber: form.panNumber || undefined,
        commission: Number(form.commission),
        user: {
          email: form.email,
          phone: form.phone || undefined,
          firstName: form.firstName,
          lastName: form.lastName || undefined,
          password: form.password,
        },
      });
      toast.success("Seller created successfully");
      router.push("/admin/sellers");
    } catch {
      toast.error("Failed to create seller");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/dashboard" className="hover:text-foreground">Dashboard</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/admin/sellers" className="hover:text-foreground">Sellers</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">Add Seller</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Add New Seller</h1>
          <p className="text-sm text-muted-foreground">Create a new seller account</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/sellers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sellers
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Business Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Business Name *</label>
                <Input
                  value={form.businessName}
                  onChange={(e) => setForm((p) => ({ ...p, businessName: e.target.value }))}
                  placeholder="Enter business name"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Business Type</label>
                <Select
                  value={form.businessType}
                  onValueChange={(v) => setForm((p) => ({ ...p, businessType: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                    <SelectItem value="SOLE_PROPRIETORSHIP">Sole Proprietorship</SelectItem>
                    <SelectItem value="PARTNERSHIP">Partnership</SelectItem>
                    <SelectItem value="PRIVATE_LIMITED">Private Limited</SelectItem>
                    <SelectItem value="PUBLIC_LIMITED">Public Limited</SelectItem>
                    <SelectItem value="LLP">LLP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">GST Number</label>
                  <Input
                    value={form.gstNumber}
                    onChange={(e) => setForm((p) => ({ ...p, gstNumber: e.target.value }))}
                    placeholder="GST Number"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">PAN Number</label>
                  <Input
                    value={form.panNumber}
                    onChange={(e) => setForm((p) => ({ ...p, panNumber: e.target.value }))}
                    placeholder="PAN Number"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Commission Rate (%)</label>
                <Input
                  type="number"
                  value={form.commission}
                  onChange={(e) => setForm((p) => ({ ...p, commission: e.target.value }))}
                  min="0"
                  max="50"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account Owner</CardTitle>
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
                  placeholder="seller@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+91 98765 43210"
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
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/sellers">Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Create Seller
          </Button>
        </div>
      </form>
    </div>
  );
}
