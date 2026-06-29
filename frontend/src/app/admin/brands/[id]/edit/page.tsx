"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Save, ArrowLeft, Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { slugify } from "@/lib/utils";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";

export default function EditBrandPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    website: "",
    metaTitle: "",
    metaDescription: "",
  });

  const [logo, setLogo] = useState<{ file: File | null; preview: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const brandRes = await adminService.getBrandById(id);
        const brand = brandRes?.data || brandRes;
        setForm({
          name: brand.name || "",
          slug: brand.slug || "",
          description: brand.description || "",
          website: brand.website || "",
          metaTitle: brand.metaTitle || "",
          metaDescription: brand.metaDescription || "",
        });
        if (brand.logo) {
          setLogo({ file: null, preview: brand.logo });
        }
      } catch {
        toast.error("Failed to load brand");
        router.push("/admin/brands");
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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogo({
        file,
        preview: URL.createObjectURL(file),
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        description: form.description,
        website: form.website,
        metaTitle: form.metaTitle,
        metaDescription: form.metaDescription,
      };
      await adminService.updateBrand(id, payload);
      toast.success("Brand updated");
      router.push("/admin/brands");
    } catch {
      toast.error("Failed to update brand");
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
            <Link href="/admin/brands" className="hover:text-primary">
              Brands
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">Edit</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Edit Brand
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/brands")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Brands
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
                label="Brand Name"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Enter brand name"
              />
              <Input
                label="Slug"
                value={form.slug}
                onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                placeholder="brand-slug"
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
                  placeholder="Enter brand description"
                />
              </div>
              <Input
                label="Website"
                type="url"
                value={form.website}
                onChange={(e) =>
                  setForm((p) => ({ ...p, website: e.target.value }))
                }
                placeholder="https://example.com"
              />
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
              <CardTitle className="text-base">Brand Logo</CardTitle>
            </CardHeader>
            <CardContent>
              {logo ? (
                <div className="relative">
                  <div className="aspect-square overflow-hidden rounded-lg border bg-background p-4">
                    <img
                      src={logo.preview}
                      alt="Brand Logo"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute right-2 top-2 h-8 w-8"
                    onClick={() => setLogo(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 transition-colors hover:border-primary/50 hover:bg-muted/50">
                  <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="mb-1 text-sm font-medium">
                    Upload brand logo
                  </p>
                  <p className="mb-3 text-xs text-muted-foreground">
                    PNG, SVG up to 2MB
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <label>
                      Browse
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                    </label>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border bg-background p-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-lg bg-muted">
                    {logo ? (
                      <img
                        src={logo.preview}
                        alt="Preview"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xl font-bold text-muted-foreground">
                        {form.name ? form.name.charAt(0) : "B"}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">
                      {form.name || "Brand Name"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      /{form.slug || "brand-slug"}
                    </p>
                    {form.website && (
                      <p className="mt-1 text-xs text-primary">
                        {form.website}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
