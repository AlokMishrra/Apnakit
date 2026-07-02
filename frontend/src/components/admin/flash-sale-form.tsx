"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Zap,
  Loader2,
  Calendar,
  DollarSign,
  Package,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, getImageUrl } from "@/lib/utils";
import { productService } from "@/services/product.service";
import { toast } from "sonner";
import { getSafeErrorMessage } from "@/lib/safe-error";

export interface FlashSaleFormData {
  productIds: string[];
  variantIds: string[];
  title: string;
  salePrice: number;
  originalPrice: number;
  totalStock: number;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
}

interface FlashSaleFormProps {
  initial?: Partial<FlashSaleFormData>;
  onSubmit: (data: FlashSaleFormData) => Promise<void>;
  loading?: boolean;
  submitLabel: string;
  backHref: string;
  pageTitle: string;
  pageDescription: string;
}

const toInputDate = (d: string | Date | null | undefined): string => {
  if (!d) return "";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 16);
  } catch {
    return "";
  }
};

export function FlashSaleForm({
  initial,
  onSubmit,
  loading = false,
  submitLabel,
  backHref,
  pageTitle,
  pageDescription,
}: FlashSaleFormProps) {
  const [form, setForm] = useState<FlashSaleFormData>({
    productIds: initial?.productIds || [],
    variantIds: initial?.variantIds || [],
    title: initial?.title || "",
    salePrice: initial?.salePrice || 0,
    originalPrice: initial?.originalPrice || 0,
    totalStock: initial?.totalStock || 100,
    startsAt: initial?.startsAt || toInputDate(new Date()),
    expiresAt: initial?.expiresAt || toInputDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    isActive: initial?.isActive ?? true,
  });

  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        const res = await productService.getProducts({ limit: 200 });
        const data = res?.data || res;
        const list = Array.isArray(data) ? data : (data?.data || []);
        setProducts(list);
        if (initial?.productIds && initial.productIds.length > 0) {
          const selected = list.filter((x: any) => initial.productIds.includes(x.id || x._id));
          if (selected.length > 0) {
            const prices = selected.map((p: any) => p.variants?.[0]?.price || p.price || 0);
            const minPrice = Math.min(...prices);
            const maxComparePrice = Math.max(...prices);
            setForm((prev) => ({
              ...prev,
              originalPrice: maxComparePrice || minPrice,
              salePrice: minPrice,
            }));
          }
        }
      } catch (err) {
        toast.error("Failed to load products", { description: getSafeErrorMessage(err) });
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [initial?.productIds]);

  const filteredProducts = products.filter((p) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      (p.name || "").toLowerCase().includes(q) ||
      (p.sku || "").toLowerCase().includes(q)
    );
  });

  const handleProductToggle = (productId: string) => {
    const p = products.find((x: any) => x.id === productId);
    const currentIds = form.productIds;
    const isSelected = currentIds.includes(productId);

    let newProductIds: string[];
    if (isSelected) {
      newProductIds = currentIds.filter((id) => id !== productId);
    } else {
      newProductIds = [...currentIds, productId];
    }

    const selectedProducts = products.filter((x: any) => newProductIds.includes(x.id));
    if (selectedProducts.length > 0) {
      const prices = selectedProducts.map((sp: any) => sp.variants?.[0]?.price || sp.price || 0);
      const minPrice = Math.min(...prices);
      setForm((prev) => ({
        ...prev,
        productIds: newProductIds,
        title: prev.title || selectedProducts[0]?.name + (selectedProducts.length > 1 ? ` +${selectedProducts.length - 1} more` : ''),
      }));
    } else {
      setForm((prev) => ({ ...prev, productIds: newProductIds }));
    }
  };

  const discount = form.originalPrice > 0
    ? Math.round(((form.originalPrice - form.salePrice) / form.originalPrice) * 100)
    : 0;

  const selectedProducts = products.filter((p: any) => form.productIds.includes(p.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.productIds.length === 0) {
      toast.error("Please select at least one product");
      return;
    }
    if (form.salePrice <= 0) {
      toast.error("Sale price must be greater than 0");
      return;
    }
    if (form.originalPrice <= 0) {
      toast.error("Original price must be greater than 0");
      return;
    }
    if (form.salePrice >= form.originalPrice) {
      toast.error("Sale price must be less than original price");
      return;
    }
    if (form.totalStock <= 0) {
      toast.error("Stock must be greater than 0");
      return;
    }
    if (!form.startsAt || !form.expiresAt) {
      toast.error("Please select start and end date/time");
      return;
    }
    if (new Date(form.expiresAt) <= new Date(form.startsAt)) {
      toast.error("End date must be after start date");
      return;
    }
    await onSubmit(form as any);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={backHref}>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{pageTitle}</h1>
          <p className="text-sm text-muted-foreground">{pageDescription}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-5 w-5" />
                  Select Products *
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Search products by name or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {loadingProducts ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto rounded-md border">
                    {filteredProducts.length === 0 ? (
                      <p className="p-4 text-center text-sm text-muted-foreground">
                        No products found
                      </p>
                    ) : (
                      filteredProducts.slice(0, 50).map((p: any) => {
                        const isSelected = form.productIds.includes(p.id);
                        const firstVariant = p.variants?.[0];
                        const price = firstVariant ? Number(firstVariant.price) : 0;
                        const comparePrice = firstVariant ? Number(firstVariant.compareAtPrice || firstVariant.price) : 0;
                        const img = getImageUrl(p.images?.[0]?.url || p.images?.[0]);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleProductToggle(p.id)}
                            className={`flex w-full items-center gap-3 border-b p-3 text-left last:border-b-0 transition-colors ${
                              isSelected ? "bg-indigo-50" : "hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                              {img ? (
                                <img src={img} alt={p.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full items-center justify-center text-gray-300">📦</div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-1 text-sm font-medium">{p.name}</p>
                              <p className="text-xs text-muted-foreground">SKU: {p.sku}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">{formatCurrency(price)}</p>
                              {comparePrice > price && (
                                <p className="text-xs text-muted-foreground line-through">
                                  {formatCurrency(comparePrice)}
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
                {form.productIds.length > 0 && (
                  <div className="rounded-md border border-indigo-200 bg-indigo-50 p-3 text-sm">
                    <span className="font-medium text-indigo-900">Selected: </span>
                    <span className="text-indigo-700">
                      {selectedProducts.map((p: any) => p.name).join(', ')}
                      {selectedProducts.length > 3 && ` +${selectedProducts.length - 3} more`}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-5 w-5" />
                  Pricing & Stock
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Title (optional)</label>
                  <Input
                    placeholder="e.g., Mega Flash Sale"
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Leave empty to use the product name
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Original Price (₹) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={String(form.originalPrice)}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, originalPrice: Number(e.target.value) || 0 }))
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Sale Price (₹) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={String(form.salePrice)}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, salePrice: Number(e.target.value) || 0 }))
                      }
                    />
                    {discount > 0 && (
                      <p className="mt-1 text-xs font-medium text-emerald-600">
                        {discount}% discount
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Total Stock *</label>
                  <Input
                    type="number"
                    min="1"
                    value={String(form.totalStock)}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, totalStock: Number(e.target.value) || 0 }))
                    }
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Limited quantity available for this flash sale
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5" />
                  Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Start Date/Time *</label>
                    <Input
                      type="datetime-local"
                      value={form.startsAt}
                      onChange={(e) => setForm((prev) => ({ ...prev, startsAt: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">End Date/Time *</label>
                    <Input
                      type="datetime-local"
                      value={form.expiresAt}
                      onChange={(e) => setForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-lg border bg-white">
                  <div className="relative bg-gray-50 p-4">
                    {selectedProducts.length > 0 ? (
                      <div className="flex flex-wrap gap-2 justify-center">
                        {selectedProducts.slice(0, 4).map((p: any) => {
                          const img = getImageUrl(p.images?.[0]?.url || p.images?.[0]);
                          return img ? (
                            <img
                              key={p.id}
                              src={img}
                              alt={p.name}
                              className="h-16 w-16 object-contain rounded"
                            />
                          ) : (
                            <div key={p.id} className="flex h-16 w-16 items-center justify-center rounded bg-gray-200 text-xl text-gray-400">
                              📦
                            </div>
                          );
                        })}
                        {selectedProducts.length > 4 && (
                          <div className="flex h-16 w-16 items-center justify-center rounded bg-gray-200 text-sm font-medium text-gray-500">
                            +{selectedProducts.length - 4}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mx-auto flex h-32 w-32 items-center justify-center text-4xl text-gray-300">
                        📦
                      </div>
                    )}
                    {discount > 0 && (
                      <Badge variant="destructive" className="absolute left-2 top-2">
                        -{discount}%
                      </Badge>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 text-sm font-medium">
                      {form.title || (selectedProducts.length > 0 ? `${selectedProducts[0]?.name}${selectedProducts.length > 1 ? ` +${selectedProducts.length - 1} more` : ''}` : "Flash Sale")}
                    </p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-base font-bold">
                        {formatCurrency(form.salePrice)}
                      </span>
                      {form.originalPrice > form.salePrice && (
                        <span className="text-xs text-muted-foreground line-through">
                          {formatCurrency(form.originalPrice)}
                        </span>
                      )}
                    </div>
                    {form.totalStock > 0 && (
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-red-500 transition-all"
                          style={{ width: "0%" }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Active</label>
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      form.isActive ? "bg-primary" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        form.isActive ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
                <div className="rounded-md bg-amber-50 p-3 text-xs text-amber-800">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                    <p>
                      Flash sales are visible on the homepage only when active (within the
                      start/end window) and <code>isActive</code> is enabled.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Button type="submit" className="w-full gap-2" disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {submitLabel}
                  </Button>
                  <Link href={backHref} className="block">
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
