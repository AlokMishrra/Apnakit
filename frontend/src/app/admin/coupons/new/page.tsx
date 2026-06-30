"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, RefreshCw, Tag, Calendar, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";

export default function NewCouponPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    code: "",
    description: "",
    type: "percentage",
    value: "",
    minOrder: "",
    maxDiscount: "",
    usageLimit: "",
    startDate: "",
    endDate: "",
    isActive: true,
    applicableCategories: [] as string[],
  });

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "NISHU";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm((prev) => ({ ...prev, code }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await adminService.createCoupon({
        code: form.code,
        description: form.description,
        type: form.type.toUpperCase(),
        value: Number(form.value),
        minimumOrder: Number(form.minOrder) || 0,
        maximumDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        startsAt: form.startDate,
        expiresAt: form.endDate,
        isActive: form.isActive,
        applicableCategories: form.applicableCategories,
      });
      toast.success("Coupon created successfully");
      router.push("/admin/coupons");
    } catch (error) {
      toast.error("Failed to create coupon");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/coupons">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Coupon</h1>
          <p className="text-sm text-gray-500">
            Create a new discount coupon for your customers
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Tag className="h-5 w-5" />
                  Coupon Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    label="Coupon Code"
                    placeholder="e.g., SUMMER20"
                    value={form.code}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        code: e.target.value.toUpperCase(),
                      }))
                    }
                    className="flex-1 font-mono"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateCode}
                    className="mt-6 gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Generate
                  </Button>
                </div>
                <Input
                  label="Description"
                  placeholder="e.g., 20% off on first order"
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  required
                />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Coupon Type
                  </label>
                  <Select
                    value={form.type}
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage Off</SelectItem>
                      <SelectItem value="fixed">Fixed Amount Off</SelectItem>
                      <SelectItem value="bog">Buy X Get Y</SelectItem>
                      <SelectItem value="free_shipping">Free Shipping</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.type === "percentage" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Discount Percentage (%)"
                      type="number"
                      placeholder="e.g., 20"
                      value={form.value}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, value: e.target.value }))
                      }
                      min="1"
                      max="100"
                      required
                    />
                    <Input
                      label="Maximum Discount (₹)"
                      type="number"
                      placeholder="e.g., 500"
                      value={form.maxDiscount}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          maxDiscount: e.target.value,
                        }))
                      }
                    />
                  </div>
                )}
                {form.type === "fixed" && (
                  <Input
                    label="Discount Amount (₹)"
                    type="number"
                    placeholder="e.g., 200"
                    value={form.value}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, value: e.target.value }))
                    }
                    min="1"
                    required
                  />
                )}
                {form.type === "bog" && (
                  <Input
                    label="Free Items Count"
                    type="number"
                    placeholder="e.g., 1"
                    value={form.value}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, value: e.target.value }))
                    }
                    min="1"
                    required
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Info className="h-5 w-5" />
                  Conditions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Minimum Order Amount (₹)"
                    type="number"
                    placeholder="e.g., 500"
                    value={form.minOrder}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, minOrder: e.target.value }))
                    }
                  />
                  <Input
                    label="Usage Limit"
                    type="number"
                    placeholder="Leave empty for unlimited"
                    value={form.usageLimit}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        usageLimit: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Start Date"
                    type="date"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, startDate: e.target.value }))
                    }
                    required
                  />
                  <Input
                    label="End Date"
                    type="date"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, endDate: e.target.value }))
                    }
                    required
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-6 text-center">
                  <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Tag className="h-6 w-6 text-primary" />
                  </div>
                  <p className="font-mono text-xl font-bold text-gray-900">
                    {form.code || "CODE"}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {form.description || "Coupon description"}
                  </p>
                  <div className="mt-3">
                    <Badge variant="default">
                      {form.type === "percentage"
                        ? `${form.value || 0}% OFF`
                        : form.type === "fixed"
                        ? `₹${form.value || 0} OFF`
                        : form.type === "free_shipping"
                        ? "FREE SHIPPING"
                        : `BUY 2 GET ${form.value || 1}`}
                    </Badge>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  {form.minOrder && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Min. Order</span>
                      <span className="font-medium">₹{form.minOrder}</span>
                    </div>
                  )}
                  {form.maxDiscount && form.type === "percentage" && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Max Discount</span>
                      <span className="font-medium">₹{form.maxDiscount}</span>
                    </div>
                  )}
                  {form.usageLimit && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Usage Limit</span>
                      <span className="font-medium">{form.usageLimit}</span>
                    </div>
                  )}
                  {form.startDate && form.endDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Valid Until</span>
                      <span className="font-medium">{form.endDate}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Button type="submit" className="w-full gap-2" loading={isSubmitting}>
                    <Save className="h-4 w-4" />
                    Create Coupon
                  </Button>
                   <Link href="/admin/coupons" className="block">
                    <Button type="button" variant="outline" className="w-full">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
