"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sellerService } from "@/services/seller.service";
import api from "@/services/api";
import { toast } from "sonner";
import { ChevronRight, Save, ArrowLeft, Loader2, Upload, X } from "lucide-react";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [variantId, setVariantId] = useState<string>("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    shortDescription: "",
    category: "",
    brand: "",
    price: "",
    stock: "",
    sku: "",
  });
  const [images, setImages] = useState<{ file: File | null; preview: string; isPrimary: boolean }[]>([]);

  useEffect(() => {
    fetchData();
  }, [productId]);

  const fetchData = async () => {
    try {
      const [catData, productRes] = await Promise.all([
        sellerService.getCategories(),
        api.get(`/products/${productId}`),
      ]);
      setCategories(Array.isArray(catData) ? catData : []);
      const raw = productRes?.data?.data || productRes?.data || productRes;
      const p = raw?.data || raw;
      if (p) {
        const variant = p.variants?.[0];
        if (variant) setVariantId(variant.id);
        setForm({
          name: p.name || "",
          description: p.description || "",
          shortDescription: p.shortDescription || "",
          category: p.categoryId || p.category?.id || "",
          brand: p.brandId || p.brand?.id || "",
          price: variant?.price?.toString() || "",
          stock: variant?.stock?.toString() || "",
          sku: variant?.sku || p.sku || "",
        });
        if (p.images && p.images.length > 0) {
          setImages(
            p.images.map((img: any) => ({
              file: null,
              preview: img.url || img,
              isPrimary: img.isPrimary || false,
            }))
          );
        }
      }
    } catch {
      toast.error("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newImages = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      isPrimary: images.length === 0,
    }));
    setImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const removed = prev[index];
      if (removed.preview.startsWith("blob:")) {
        URL.revokeObjectURL(removed.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      toast.error("Product name is required");
      return;
    }
    setSaving(true);
    try {
      await sellerService.updateProduct(productId, {
        name: form.name,
        description: form.description,
        shortDescription: form.shortDescription,
        categoryId: form.category || undefined,
        brandId: form.brand || undefined,
        variants: [
          {
            ...(variantId ? { id: variantId } : {}),
            name: "Default",
            price: parseFloat(form.price) || 0,
            stock: parseInt(form.stock) || 0,
            sku: form.sku || `SKU-${Date.now()}`,
          },
        ],
      });
      const newImages = images.filter((img) => img.file !== null);
      if (newImages.length > 0) {
        const formData = new FormData();
        newImages.forEach((img) => {
          if (img.file) {
            formData.append('files', img.file);
          }
        });
        await sellerService.uploadProductImages(productId, formData);
      }
      toast.success("Product updated successfully");
      router.push("/seller/products");
    } catch {
      toast.error("Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/seller/dashboard" className="hover:text-foreground">Dashboard</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/seller/products" className="hover:text-foreground">Products</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">Edit Product</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Edit Product</h1>
          <p className="text-sm text-muted-foreground">Update product details</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/seller/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Product Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Product Name *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Enter product name"
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.id} label={cat.name} />
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Brand</label>
                <Input
                  value={form.brand}
                  onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))}
                  placeholder="Enter brand"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Short Description</label>
              <Input
                value={form.shortDescription}
                onChange={(e) => setForm((p) => ({ ...p, shortDescription: e.target.value }))}
                placeholder="Brief description"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Description</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Detailed product description"
                className="min-h-[120px]"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Pricing & Inventory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Price (₹)</label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                  placeholder="0.00"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Stock</label>
                <Input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">SKU</label>
                <Input
                  value={form.sku}
                  onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
                  placeholder="SKU-001"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Product Images</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer relative">
              <input
                type="file"
                multiple
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleImageUpload}
              />
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium">Click to upload images</p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG up to 5MB each. First image is the cover.
              </p>
            </div>
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img.preview}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/placeholder.svg";
                      }}
                    />
                    {img.isPrimary && (
                      <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/seller/products">Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Update Product
          </Button>
        </div>
      </form>
    </div>
  );
}
