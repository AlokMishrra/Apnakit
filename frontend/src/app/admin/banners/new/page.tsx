"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Image as ImageIcon,
  Link as LinkIcon,
  Calendar,
  Loader2,
  ExternalLink,
  Video,
} from "lucide-react";
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
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";
import { getSafeErrorMessage } from "@/lib/safe-error";
import { BannerImageUpload } from "@/components/admin/banner-image-upload";

const POSITION_OPTIONS = [
  { value: "HERO", label: "Hero Banner" },
  { value: "CATEGORY", label: "Category Banner" },
  { value: "PROMOTIONAL", label: "Promotional Banner" },
  { value: "FOOTER", label: "Footer Banner" },
];

const POSITION_GRADIENTS: Record<string, string> = {
  HERO: "from-indigo-600 to-purple-600",
  CATEGORY: "from-emerald-600 to-teal-600",
  PROMOTIONAL: "from-amber-500 to-orange-500",
  FOOTER: "from-slate-700 to-slate-900",
};

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50">
      <div className="min-w-0 flex-1">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

export default function NewBannerPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    image: "",
    mediaType: "IMAGE" as "IMAGE" | "VIDEO",
    loopVideo: false,
    showTitle: true,
    showSubtitle: true,
    showButton: true,
    link: "",
    position: "HERO",
    startsAt: "",
    expiresAt: "",
    sortOrder: 0,
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!form.image.trim()) {
      toast.error(form.mediaType === "VIDEO" ? "Video URL is required" : "Image URL is required");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: any = {
        title: form.title.trim(),
        subtitle: form.subtitle?.trim() || undefined,
        image: form.image.trim(),
        mediaType: form.mediaType,
        loopVideo: form.mediaType === "VIDEO" ? form.loopVideo : undefined,
        showTitle: form.showTitle,
        showSubtitle: form.showSubtitle,
        showButton: form.showButton,
        link: form.link?.trim() || undefined,
        position: form.position,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      };
      if (form.startsAt) payload.startsAt = new Date(form.startsAt).toISOString();
      if (form.expiresAt) payload.expiresAt = new Date(form.expiresAt).toISOString();
      await adminService.createBanner(payload);
      toast.success("Banner created successfully");
      router.push("/admin/banners");
    } catch (err) {
      toast.error("Failed to create banner", { description: getSafeErrorMessage(err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const gradient = POSITION_GRADIENTS[form.position] || POSITION_GRADIENTS.HERO;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/banners">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Banner</h1>
          <p className="text-sm text-gray-500">Add a new banner to your store</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Banner Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Title *</label>
                  <Input
                    placeholder="e.g., Summer Sale"
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Subtitle</label>
                  <Input
                    placeholder="e.g., Up to 60% off on fashion"
                    value={form.subtitle}
                    onChange={(e) => setForm((prev) => ({ ...prev, subtitle: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Link URL</label>
                  <Input
                    placeholder="e.g., /category/fashion or https://..."
                    value={form.link}
                    onChange={(e) => setForm((prev) => ({ ...prev, link: e.target.value }))}
                    icon={<LinkIcon className="h-4 w-4" />}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Sort Order</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={String(form.sortOrder)}
                    onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: Number(e.target.value) || 0 }))}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Lower numbers display first</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  {form.mediaType === "VIDEO" ? (
                    <Video className="h-5 w-5" />
                  ) : (
                    <ImageIcon className="h-5 w-5" />
                  )}
                  Banner {form.mediaType === "VIDEO" ? "Video" : "Image"} *
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BannerImageUpload
                  value={form.image}
                  mediaType={form.mediaType}
                  onChange={(url) => setForm((prev) => ({ ...prev, image: url }))}
                  onMediaTypeChange={(t) => setForm((prev) => ({ ...prev, mediaType: t }))}
                />
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
                    <label className="mb-1.5 block text-sm font-medium">Start Date</label>
                    <Input
                      type="date"
                      value={form.startsAt}
                      onChange={(e) => setForm((prev) => ({ ...prev, startsAt: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">End Date</label>
                    <Input
                      type="date"
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
              <CardContent className="space-y-4">
                <div
                  className={`relative aspect-video overflow-hidden rounded-lg bg-gradient-to-r ${gradient}`}
                >
                  {form.image ? (
                    form.mediaType === "VIDEO" ? (
                      <video
                        src={form.image}
                        muted
                        playsInline
                        loop
                        autoPlay
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <img
                        src={form.image}
                        alt="Banner preview"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h3 className="font-semibold">{form.title || "Banner Title"}</h3>
                    <p className="text-sm text-white/80">{form.subtitle || "Banner subtitle"}</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Position</span>
                    <Badge variant="secondary">{form.position}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Sort Order</span>
                    <span className="text-gray-900">{form.sortOrder}</span>
                  </div>
                  {form.link && (
                    <div className="flex items-center gap-1">
                      <ExternalLink className="h-3 w-3 text-gray-500" />
                      <span className="truncate text-primary">{form.link}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Position</label>
                  <Select
                    value={form.position}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, position: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POSITION_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Active Status</label>
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
                {form.mediaType === "VIDEO" && (
                  <div className="flex items-start justify-between gap-3 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3">
                    <div className="min-w-0 flex-1">
                      <label className="text-sm font-medium">Loop video in hero</label>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        When enabled, the video plays in a loop and the hero will not advance to the next banner.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, loopVideo: !prev.loopVideo }))}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                        form.loopVideo ? "bg-primary" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          form.loopVideo ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                )}

                <div className="rounded-lg border bg-white p-3">
                  <p className="mb-2 text-sm font-medium text-foreground">Display overlay</p>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Choose which text and button overlay to show on this banner.
                  </p>
                  <div className="space-y-2">
                    <ToggleRow
                      label="Show title"
                      description="Display the main heading"
                      checked={form.showTitle}
                      onChange={(v) => setForm((p) => ({ ...p, showTitle: v }))}
                    />
                    <ToggleRow
                      label="Show subtitle"
                      description="Display the subtext"
                      checked={form.showSubtitle}
                      onChange={(v) => setForm((p) => ({ ...p, showSubtitle: v }))}
                    />
                    <ToggleRow
                      label="Show button"
                      description="Display the Shop Now call-to-action"
                      checked={form.showButton}
                      onChange={(v) => setForm((p) => ({ ...p, showButton: v }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Create Banner
                  </Button>
                  <Link href="/admin/banners" className="block">
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
