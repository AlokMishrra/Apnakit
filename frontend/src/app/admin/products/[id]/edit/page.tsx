"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { slugify } from "@/lib/utils";
import { adminService } from "@/services/admin.service";
import api from "@/services/api";
import { toast } from "sonner";

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
  stock: string;
  attributes: { key: string; value: string }[];
}

interface Spec {
  key: string;
  value: string;
  group: string;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  const [product, setProduct] = useState<any>(null);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    shortDescription: "",
    categoryId: "",
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
  });

  const [variants, setVariants] = useState<Variant[]>([]);
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [images, setImages] = useState<{ file: File | null; preview: string; isPrimary: boolean; url?: string }[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const [prodRes, catRes, brandRes] = await Promise.all([
          api.get(`/products/${productId}`),
          adminService.getCategoriesFlat(),
          adminService.getBrands(),
        ]);
        const raw = prodRes?.data?.data || prodRes?.data || prodRes;
        const found = raw?.data || raw;
        setProduct(found || null);
        setCategories(catRes?.data?.data || catRes?.data || []);
        setBrands(brandRes?.data?.data || brandRes?.data || []);

        if (found) {
          const variant = found.variants?.[0];
          setForm({
            name: found.name || "",
            slug: found.slug || "",
            description: found.description || "",
            shortDescription: found.shortDescription || "",
            categoryId: found.categoryId || found.category?.id || "",
            brandId: found.brandId || found.brand?.id || "",
            sku: variant?.sku || found.sku || "",
            barcode: found.barcode || "",
            price: variant?.price?.toString() || "",
            comparePrice: variant?.compareAtPrice?.toString() || "",
            tags: found.tags ? found.tags.split(",").filter(Boolean) : [],
            tagInput: "",
            metaTitle: found.metaTitle || found.name || "",
            metaDescription: found.metaDescription || found.description || "",
            seoTags: found.tags ? found.tags.split(",").filter(Boolean) : [],
            seoTagInput: "",
          });

          setVariants(
            (found.variants || []).map((v: any) => ({
              name: v.name || "",
              sku: v.sku || "",
              price: v.price?.toString() || "",
              comparePrice: v.compareAtPrice?.toString() || "",
              stock: v.stock?.toString() || "",
              attributes: v.attributes ? Object.entries(v.attributes).map(([key, value]) => ({
                key,
                value: value as string,
              })) : [],
            }))
          );

          setSpecs(
            (found.specifications || []).map((s: any) => ({
              key: s.name || "",
              value: s.value || "",
              group: s.groupId || "General",
            }))
          );

          setImages(
            (found.images || []).map((img: any) => ({
              file: null,
              preview: img.url || img,
              isPrimary: img.isPrimary || false,
            }))
          );
        }
      } catch {
        toast.error("Failed to load product");
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [productId]);

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
      { name: "", sku: "", price: "", comparePrice: "", stock: "", attributes: [] },
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
      return;
    }
    setSaving(true);
    try {
      const existingVariants = product?.variants || [];
      const payload: any = {
        name: form.name,
        description: form.description || undefined,
        shortDescription: form.shortDescription || undefined,
        categoryId: form.categoryId || undefined,
        brandId: form.brandId || undefined,
        sku: form.sku || undefined,
        barcode: form.barcode || undefined,
        isFeatured: status === "published",
        metaTitle: form.metaTitle || undefined,
        metaDescription: form.metaDescription || undefined,
        tags: Array.isArray(form.tags) && form.tags.length > 0 ? form.tags.join(",") : undefined,
        variants: variants.filter(v => v.price).map((v, i) => ({
          ...(existingVariants[i] ? { id: existingVariants[i].id } : {}),
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
      await adminService.updateProduct(productId, payload);
      const newFileImages = images.filter((img) => img.file !== null);
      const newUrlImages = images.filter((img) => img.url && !img.file);
      if (newFileImages.length > 0) {
        const formData = new FormData();
        newFileImages.forEach((img) => {
          if (img.file) {
            formData.append('files', img.file);
          }
        });
        await adminService.uploadProductImages(productId, formData);
      }
      if (newUrlImages.length > 0) {
        const urls = newUrlImages.map((img) => img.url!);
        await adminService.addProductImagesByUrls(productId, urls);
      }
      toast.success("Product updated");
      router.push("/admin/products");
    } catch {
      toast.error("Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-semibold">Product not found</h2>
        <Button asChild className="mt-4">
          <Link href="/admin/products">Back to Products</Link>
        </Button>
      </div>
    );
  }

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
                <SelectTrigger label="Category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
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
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                      label="Compare Price (₹)"
                      type="number"
                      value={variant.comparePrice}
                      onChange={(e) =>
                        updateVariant(index, "comparePrice", e.target.value)
                      }
                      placeholder="0.00"
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
            <span className="text-foreground">Edit</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Edit Product
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleSave("draft")} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
          <Button onClick={() => handleSave("published")} disabled={saving}>
            <Eye className="mr-2 h-4 w-4" />
            Update & Publish
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
                <Badge variant={product.isActive ? "success" : "secondary"}>
                  {product.isActive ? "Published" : "Draft"}
                </Badge>
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
