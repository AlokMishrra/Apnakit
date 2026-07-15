"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Save, ArrowLeft, Upload, X, ImageIcon, Loader2 } from "lucide-react";
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
import { slugify, cn } from "@/lib/utils";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [parentCategories, setParentCategories] = useState<any[]>([]);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    parentId: "",
    metaTitle: "",
    metaDescription: "",
    isComingSoon: false,
    codEnabled: true,
  });

  const [image, setImage] = useState<{ file: File | null; preview: string } | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imageMode, setImageMode] = useState<"upload" | "url">("upload");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoryRes, parentsRes] = await Promise.all([
          adminService.getCategoryById(id),
          adminService.getCategories(),
        ]);
        const category = categoryRes?.data || categoryRes;
        setForm({
          name: category.name || "",
          slug: category.slug || "",
          description: category.description || "",
          parentId: category.parentId || "",
          metaTitle: category.metaTitle || "",
          metaDescription: category.metaDescription || "",
          isComingSoon: category.isComingSoon || false,
          codEnabled: category.codEnabled !== false,
        });
        if (category.image) {
          setImage({ file: null, preview: category.image });
          setImageUrl(category.image);
        }
        setParentCategories(parentsRes?.data?.data || parentsRes?.data || []);
      } catch {
        toast.error("Failed to load category");
        router.push("/admin/categories");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, router]);

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: slugify(name),
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage({
        file,
        preview: URL.createObjectURL(file),
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let finalImageUrl = imageUrl;
      if (image?.file) {
        setUploading(true);
        try {
          const res = await adminService.uploadImage(image.file);
          finalImageUrl = res?.data?.url || res?.url || imageUrl;
        } catch {
          toast.error("Image upload failed");
          setUploading(false);
          setSaving(false);
          return;
        }
        setUploading(false);
      }
      const payload = {
        name: form.name,
        slug: form.slug,
        description: form.description,
        parentId: form.parentId === "none" ? undefined : form.parentId || undefined,
        metaTitle: form.metaTitle,
        metaDescription: form.metaDescription,
        isComingSoon: form.isComingSoon,
        codEnabled: form.codEnabled,
        image: finalImageUrl,
      };
      await adminService.updateCategory(id, payload);
      toast.success("Category updated");
      router.push("/admin/categories");
    } catch {
      toast.error("Failed to update category");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/admin/categories" className="hover:text-primary">
              Categories
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">Edit</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Edit Category
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/categories")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Categories
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Category Name"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Enter category name"
              />
              <Input
                label="Slug"
                value={form.slug}
                onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                placeholder="category-slug"
              />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Description
                </label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder="Enter category description"
                />
              </div>

              <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">Coming Soon</p>
                  <p className="text-xs text-muted-foreground">Mark this category as coming soon - users will see a badge and cannot click into it</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.isComingSoon}
                  onClick={() => setForm((p) => ({ ...p, isComingSoon: !p.isComingSoon }))}
                  className={cn(
                    "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors",
                    form.isComingSoon ? "bg-emerald-600" : "bg-gray-300"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
                      form.isComingSoon ? "translate-x-[22px]" : "translate-x-[2px]"
                    )}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">COD Enabled</p>
                  <p className="text-xs text-muted-foreground">Allow Cash on Delivery for products in this category</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.codEnabled}
                  onClick={() => setForm((p) => ({ ...p, codEnabled: !p.codEnabled }))}
                  className={cn(
                    "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors",
                    form.codEnabled ? "bg-emerald-600" : "bg-gray-300"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
                      form.codEnabled ? "translate-x-[22px]" : "translate-x-[2px]"
                    )}
                  />
                </button>
              </div>

              <Select
                value={form.parentId}
                onValueChange={(v) => setForm((p) => ({ ...p, parentId: v }))}
              >
                <SelectTrigger label="Parent Category">
                  <SelectValue placeholder="None (Top Level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Top Level)</SelectItem>
                  {parentCategories
                    .filter((cat) => cat.id !== id)
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={form.metaDescription}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, metaDescription: e.target.value }))
                  }
                  placeholder="Brief description for search results"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Category Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant={imageMode === "upload" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setImageMode("upload")}
                >
                  Upload
                </Button>
                <Button
                  variant={imageMode === "url" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setImageMode("url")}
                >
                  Image URL
                </Button>
              </div>

              {imageMode === "url" ? (
                <div className="space-y-2">
                  <Input
                    label="Image URL"
                    placeholder="https://example.com/image.png"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                  {imageUrl && (
                    <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                      <img
                        src={imageUrl}
                        alt="Category"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/images/placeholder.svg";
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {image ? (
                    <div className="relative">
                      <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                        <img
                          src={image.preview}
                          alt="Category"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute right-2 top-2 h-8 w-8"
                        onClick={() => setImage(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 transition-colors hover:border-primary/50 hover:bg-muted/50">
                      <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
                      <p className="mb-1 text-sm font-medium">
                        Upload category image
                      </p>
                      <p className="mb-3 text-xs text-muted-foreground">
                        PNG, JPG up to 2MB
                      </p>
                      <Button variant="outline" size="sm" asChild>
                        <label>
                          Browse
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                          />
                        </label>
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border bg-background">
                <div className="aspect-video bg-muted">
                  {image ? (
                    <img
                      src={image.preview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium">
                    {form.name || "Category Name"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    /{form.slug || "category-slug"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
