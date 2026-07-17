"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  Save,
  Eye,
  ArrowLeft,
  Upload,
  X,
  Plus,
  GripVertical,
  ImageIcon,
  FileText,
  Tag,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { slugify, cn } from "@/lib/utils";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";
import { VegNonVeg } from "@/components/ui/veg-non-veg";

const steps = [
  { id: "basic", label: "Basic Info", icon: FileText },
  { id: "variants", label: "Variants", icon: Layers },
  { id: "images", label: "Images", icon: ImageIcon },
  { id: "specifications", label: "Specifications", icon: Tag },
  { id: "seo", label: "SEO", icon: Tag },
];

interface Variant {
  name: string;
  sku: string;
  price: string;
  comparePrice: string;
  discountPercent: string;
  stock: string;
  attributes: { key: string; value: string }[];
}

interface Spec {
  key: string;
  value: string;
  group: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          adminService.getCategoriesFlat(),
          adminService.getBrands(),
        ]);
        setCategories(catRes?.data?.data || catRes?.data || []);
        setBrands(brandRes?.data?.data || brandRes?.data || []);
      } catch {
        toast.error("Failed to load categories/brands");
      }
    };
    loadDropdowns();
  }, []);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    shortDescription: "",
    categoryId: "",
    additionalCategoryIds: [] as string[],
    brandId: "",
    sku: "",
    barcode: "",
    price: "",
    comparePrice: "",
    tags: [] as string[],
    tagInput: "",
    metaTitle: "",
    metaDescription: "",
    seoTags: [] as string[],
    seoTagInput: "",
    isVeg: true,
  });

  const [variants, setVariants] = useState<Variant[]>([
      { name: "", sku: "", price: "", comparePrice: "", discountPercent: "", stock: "", attributes: [] },
  ]);

  const [specs, setSpecs] = useState<Spec[]>([
    { key: "", value: "", group: "General" },
  ]);

  const [images, setImages] = useState<{ file: File | null; preview: string; isPrimary: boolean; url?: string }[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: slugify(name),
    }));
  };

  const addTag = () => {
    if (form.tagInput.trim() && !form.tags.includes(form.tagInput.trim())) {
      setForm((prev) => ({
        ...prev,
        tags: [...prev.tags, prev.tagInput.trim()],
        tagInput: "",
      }));
    }
  };

  const removeTag = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
    { name: "", sku: "", price: "", comparePrice: "", discountPercent: "", stock: "", attributes: [] },
    ]);
  };

  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof Variant, value: string | { key: string; value: string }[]) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  const addSpec = () => {
    setSpecs((prev) => [...prev, { key: "", value: "", group: "General" }]);
  };

  const removeSpec = (index: number) => {
    setSpecs((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSpec = (index: number, field: keyof Spec, value: string) => {
    setSpecs((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
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
      const newImages = prev.filter((_, i) => i !== index);
      if (removed.isPrimary && newImages.length > 0) {
        newImages[0].isPrimary = true;
      }
      return newImages;
    });
  };

  const setPrimaryImage = (index: number) => {
    setImages((prev) =>
      prev.map((img, i) => ({ ...img, isPrimary: i === index }))
    );
  };

  const addImageByUrl = () => {
    const url = imageUrlInput.trim();
    if (!url) return;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      toast.error("Please enter a valid URL starting with http:// or https://");
      return;
    }
    setImages((prev) => [
      ...prev,
      { file: null, preview: url, isPrimary: prev.length === 0, url },
    ]);
    setImageUrlInput("");
  };

  const handleSave = async (status: "draft" | "published") => {
    if (!form.name.trim()) {
      toast.error("Product name is required");
      setSaving(false);
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        name: form.name,
        description: form.description || undefined,
        shortDescription: form.shortDescription || undefined,
        categoryId: form.categoryId || undefined,
        additionalCategoryIds: form.additionalCategoryIds.length > 0 ? form.additionalCategoryIds : undefined,
        brandId: form.brandId || undefined,
        sku: form.sku || `SKU-${Date.now()}`,
        barcode: form.barcode || undefined,
        isFeatured: status === "published",
        isVeg: form.isVeg,
        metaTitle: form.metaTitle || undefined,
        metaDescription: form.metaDescription || undefined,
        tags: Array.isArray(form.tags) && form.tags.length > 0 ? form.tags.join(",") : undefined,
        price: variants.length > 0 && variants[0].price ? Number(variants[0].price) : undefined,
        stock: variants.length > 0 && variants[0].stock ? Number(variants[0].stock) : undefined,
        variants: variants.filter(v => v.price).map((v) => ({
          name: v.name || "Default",
          sku: v.sku || `VAR-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          price: Number(v.price) || 0,
          compareAtPrice: v.comparePrice ? Number(v.comparePrice) : undefined,
          stock: Number(v.stock) || 0,
          attributes: v.attributes.length > 0 ? Object.fromEntries(v.attributes.filter(a => a.key).map((a) => [a.key, a.value])) : undefined,
        })),
        specifications: specs
          .filter((s) => s.key && s.value)
          .map((s) => ({ name: s.key, value: s.value, groupId: s.group || undefined })),
      };
      const res = await adminService.createProduct(payload);
      const productId = res?.data?.id || res?.id;
      if (productId && images.length > 0) {
        const fileImages = images.filter((img) => img.file);
        const urlImages = images.filter((img) => img.url && !img.file);

        if (fileImages.length > 0) {
          const formData = new FormData();
          fileImages.forEach((img) => {
            if (img.file) {
              formData.append('files', img.file);
            }
          });
          await adminService.uploadProductImages(productId, formData);
        }

        if (urlImages.length > 0) {
          const urls = urlImages.map((img) => img.url!);
          await adminService.addProductImagesByUrls(productId, urls);
        }
      }
      toast.success("Product created");
      router.push("/admin/products");
    } catch {
      toast.error("Failed to create product");
    } finally {
      setSaving(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Input
                label="Product Name"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Enter product name"
              />
              <Input
                label="Slug"
                value={form.slug}
                onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                placeholder="product-slug"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Description
              </label>
              <textarea
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Enter product description"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Select
                value={form.categoryId}
                onValueChange={(v) => setForm((p) => ({ ...p, categoryId: v }))}
              >
                <SelectTrigger label="Primary Category">
                  <SelectValue placeholder="Select primary category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat._id || cat.id} value={cat._id || cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={form.brandId}
                onValueChange={(v) => setForm((p) => ({ ...p, brandId: v }))}
              >
                <SelectTrigger label="Brand">
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand._id || brand.id} value={brand._id || brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Additional Categories (multi-select) */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Additional Categories & Subcategories
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  (product will also appear in these categories)
                </span>
              </label>
              <div className="rounded-lg border bg-white p-3">
                {form.additionalCategoryIds.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {form.additionalCategoryIds.map((id) => {
                      const cat = categories.find((c: any) => (c._id || c.id) === id);
                      if (!cat) return null;
                      return (
                        <Badge key={id} variant="secondary" className="gap-1 pr-1">
                          {cat.name}
                          <button
                            type="button"
                            onClick={() => {
                              setForm((p) => ({
                                ...p,
                                additionalCategoryIds: p.additionalCategoryIds.filter((x) => x !== id),
                              }));
                            }}
                            className="ml-1 rounded hover:bg-muted"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
                <div className="grid max-h-48 grid-cols-1 gap-1.5 overflow-y-auto sm:grid-cols-2 md:grid-cols-3">
                  {categories
                    .filter((c: any) => (c._id || c.id) !== form.categoryId)
                    .map((cat: any) => {
                      const id = cat._id || cat.id;
                      const isSelected = form.additionalCategoryIds.includes(id);
                      const isParent = !cat.parentId;
                      const isChild = !!cat.parentId;
                      return (
                        <label
                          key={id}
                          className={cn(
                            "flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm transition-colors",
                            isSelected
                              ? "border-primary bg-primary/10 text-primary"
                              : "hover:bg-muted"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              setForm((p) => ({
                                ...p,
                                additionalCategoryIds: e.target.checked
                                  ? [...p.additionalCategoryIds, id]
                                  : p.additionalCategoryIds.filter((x) => x !== id),
                              }));
                            }}
                            className="h-3.5 w-3.5 rounded border-gray-300"
                          />
                          <span className="flex-1 truncate">
                            {isChild && cat.parent && (
                              <span className="text-muted-foreground">{cat.parent.name} › </span>
                            )}
                            {isParent && <span className="font-medium">📁 </span>}
                            {cat.name}
                          </span>
                        </label>
                      );
                    })}
                </div>
                {form.additionalCategoryIds.length === 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    No additional categories selected. Tick the boxes above to add the product to more categories.
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <Input
                label="SKU"
                value={form.sku}
                onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
                placeholder="PROD-001"
              />
              <Input
                label="Barcode"
                value={form.barcode}
                onChange={(e) =>
                  setForm((p) => ({ ...p, barcode: e.target.value }))
                }
                placeholder="1234567890123"
              />
              <Input
                label="Price (₹)"
                type="number"
                value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Tags
              </label>
              <div className="flex gap-2">
                <Input
                  value={form.tagInput}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, tagInput: e.target.value }))
                  }
                  placeholder="Add a tag"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Add
                </Button>
              </div>
              {form.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {form.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button onClick={() => removeTag(tag)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Food Type
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, isVeg: true }))}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all",
                    form.isVeg
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-border hover:border-muted-foreground/50"
                  )}
                >
                  <VegNonVeg isVeg={true} size="sm" />
                  Veg
                </button>
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, isVeg: false }))}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all",
                    !form.isVeg
                      ? "border-[#8B4513] bg-orange-50 text-[#8B4513]"
                      : "border-border hover:border-muted-foreground/50"
                  )}
                >
                  <VegNonVeg isVeg={false} size="sm" />
                  Non-Veg
                </button>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            {variants.map((variant, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Variant {index + 1}</span>
                    </div>
                    {variants.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeVariant(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Input
                      label="Variant Name"
                      value={variant.name}
                      onChange={(e) =>
                        updateVariant(index, "name", e.target.value)
                      }
                      placeholder="e.g., Red / Large"
                    />
                    <Input
                      label="SKU"
                      value={variant.sku}
                      onChange={(e) =>
                        updateVariant(index, "sku", e.target.value)
                      }
                      placeholder="VAR-001"
                    />
                    <Input
                      label="Price (₹)"
                      type="number"
                      value={variant.price}
                      onChange={(e) =>
                        updateVariant(index, "price", e.target.value)
                      }
                      placeholder="0.00"
                    />
                    <Input
                      label="Discount %"
                      type="number"
                      min="0"
                      max="90"
                      value={variant.discountPercent}
                      onChange={(e) => {
                        const pct = e.target.value;
                        updateVariant(index, "discountPercent", pct);
                        if (pct && variant.price) {
                          const price = Number(variant.price);
                          const compare = Math.round(price / (1 - Number(pct) / 100));
                          updateVariant(index, "comparePrice", compare.toString());
                        } else if (!pct) {
                          updateVariant(index, "comparePrice", "");
                        }
                      }}
                      placeholder="e.g., 10"
                    />
                    <Input
                      label="Compare Price (₹)"
                      type="number"
                      value={variant.comparePrice}
                      onChange={(e) =>
                        updateVariant(index, "comparePrice", e.target.value)
                      }
                      placeholder="Auto-filled from discount"
                    />
                    <Input
                      label="Stock"
                      type="number"
                      value={variant.stock}
                      onChange={(e) =>
                        updateVariant(index, "stock", e.target.value)
                      }
                      placeholder="0"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" onClick={addVariant} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Variant
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-12 transition-colors hover:border-primary/50 hover:bg-muted/50"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                  const newImages = Array.from(files).map((file) => ({
                    file,
                    preview: URL.createObjectURL(file),
                    isPrimary: images.length === 0,
                  }));
                  setImages((prev) => [...prev, ...newImages]);
                }
              }}
            >
              <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
              <p className="mb-1 text-sm font-medium">
                Drag & drop images here
              </p>
              <p className="mb-4 text-xs text-muted-foreground">
                PNG, JPG, WEBP up to 5MB each
              </p>
              <Button variant="outline" asChild>
                <label>
                  Browse Files
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              </Button>
            </div>

            <div className="flex items-end gap-3 rounded-lg border bg-muted/30 p-4">
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Or add image by URL
                </label>
                <Input
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addImageByUrl();
                    }
                  }}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={addImageByUrl}
                disabled={!imageUrlInput.trim()}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add URL
              </Button>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {images.map((image, index) => (
                  <div
                    key={index}
                    className={`group relative overflow-hidden rounded-lg border-2 transition-colors ${
                      image.isPrimary
                        ? "border-primary"
                        : "border-transparent hover:border-muted"
                    }`}
                  >
                    <div className="aspect-square bg-muted">
                      <img
                        src={image.preview}
                        alt={`Upload ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setPrimaryImage(index)}
                        disabled={image.isPrimary}
                      >
                        {image.isPrimary ? "Primary" : "Set Primary"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {image.isPrimary && (
                      <Badge className="absolute left-2 top-2" variant="default">
                        Primary
                      </Badge>
                    )}
                    {image.url && (
                      <Badge className="absolute right-2 top-2" variant="secondary">
                        URL
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            {specs.map((spec, index) => (
              <div key={index} className="flex items-end gap-4">
                <Input
                  label={index === 0 ? "Group" : undefined}
                  value={spec.group}
                  onChange={(e) => updateSpec(index, "group", e.target.value)}
                  placeholder="Group name"
                  className="max-w-[200px]"
                />
                <Input
                  label={index === 0 ? "Key" : undefined}
                  value={spec.key}
                  onChange={(e) => updateSpec(index, "key", e.target.value)}
                  placeholder="Specification name"
                />
                <Input
                  label={index === 0 ? "Value" : undefined}
                  value={spec.value}
                  onChange={(e) => updateSpec(index, "value", e.target.value)}
                  placeholder="Specification value"
                  className="flex-1"
                />
                {specs.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mb-0.5 h-10 w-10 text-destructive"
                    onClick={() => removeSpec(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" onClick={addSpec}>
              <Plus className="mr-2 h-4 w-4" />
              Add Specification
            </Button>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <Input
              label="Meta Title"
              value={form.metaTitle}
              onChange={(e) =>
                setForm((p) => ({ ...p, metaTitle: e.target.value }))
              }
              placeholder="Page title for search engines"
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Meta Description
              </label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={form.metaDescription}
                onChange={(e) =>
                  setForm((p) => ({ ...p, metaDescription: e.target.value }))
                }
                placeholder="Brief description for search results"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                SEO Tags
              </label>
              <div className="flex gap-2">
                <Input
                  value={form.seoTagInput}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, seoTagInput: e.target.value }))
                  }
                  placeholder="Add SEO tag"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (
                        form.seoTagInput.trim() &&
                        !form.seoTags.includes(form.seoTagInput.trim())
                      ) {
                        setForm((p) => ({
                          ...p,
                          seoTags: [...p.seoTags, p.seoTagInput.trim()],
                          seoTagInput: "",
                        }));
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (
                      form.seoTagInput.trim() &&
                      !form.seoTags.includes(form.seoTagInput.trim())
                    ) {
                      setForm((p) => ({
                        ...p,
                        seoTags: [...p.seoTags, p.seoTagInput.trim()],
                        seoTagInput: "",
                      }));
                    }
                  }}
                >
                  Add
                </Button>
              </div>
              {form.seoTags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {form.seoTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        onClick={() =>
                          setForm((p) => ({
                            ...p,
                            seoTags: p.seoTags.filter((t) => t !== tag),
                          }))
                        }
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-sm">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium text-primary">
                  {form.metaTitle || "Product Title"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  www.apnakit.in/products/{form.slug || "product-slug"}
                </p>
                <p className="mt-2 text-sm">
                  {form.metaDescription || "Product description will appear here..."}
                </p>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/admin/products" className="hover:text-primary">
              Products
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">Add New</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Add New Product
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleSave("draft")} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            Save as Draft
          </Button>
          <Button onClick={() => handleSave("published")} disabled={saving}>
            <Eye className="mr-2 h-4 w-4" />
            Publish
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="flex items-center gap-1 overflow-x-auto rounded-lg border bg-muted/50 p-1">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(index)}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    currentStep === index
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{step.label}</span>
                </button>
              );
            })}
          </div>

          <Card>
            <CardContent className="p-6">{renderStepContent()}</CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <Button
              onClick={() =>
                setCurrentStep((s) => Math.min(steps.length - 1, s + 1))
              }
              disabled={currentStep === steps.length - 1}
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Product Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                {images.length > 0 ? (
                  <img
                    src={images.find((i) => i.isPrimary)?.preview || images[0].preview}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-medium">
                  {form.name || "Product Name"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {form.sku || "SKU"}
                </p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold">
                  ₹{form.price || "0"}
                </span>
                {form.comparePrice && (
                  <span className="text-sm text-muted-foreground line-through">
                    ₹{form.comparePrice}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Publish Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Status</span>
                <Badge variant="secondary">Draft</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Visibility</span>
                <Badge variant="success">Public</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
