"use client";

import { useEffect, useRef, useState } from "react";
import {
  Save,
  Loader2,
  Smartphone,
  Apple,
  Monitor,
  Upload,
  Star,
  Download,
  X,
  ExternalLink,
  Image as ImageIcon,
  Sparkles,
  ChevronRight,
  Eye,
  EyeOff,
  AlertCircle,
  Copy,
  Check,
  Zap,
  Shield,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { getSafeErrorMessage } from "@/lib/safe-error";
import { appBannerService, type AppBannerConfig } from "@/services/app-banner.service";
import apiClient from "@/lib/api-client";
import { cn } from "@/lib/utils";

function formatBytes(n: number | null | undefined): string {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

const COLOR_PRESETS = [
  { bg: "#FACC15", fg: "#7C3AED", label: "Yellow / Purple" },
  { bg: "#7C3AED", fg: "#FFFFFF", label: "Purple / White" },
  { bg: "#10B981", fg: "#FFFFFF", label: "Emerald" },
  { bg: "#3B82F6", fg: "#FFFFFF", label: "Blue" },
  { bg: "#F43F5E", fg: "#FFFFFF", label: "Rose" },
  { bg: "#0F172A", fg: "#FACC15", label: "Dark / Yellow" },
  { bg: "#FFFFFF", fg: "#7C3AED", label: "White / Purple" },
];

export default function AdminAppBannerPage() {
  const [config, setConfig] = useState<AppBannerConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [uploadingApk, setUploadingApk] = useState(false);
  const [uploadingIpa, setUploadingIpa] = useState(false);
  const [copied, setCopied] = useState(false);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const apkInputRef = useRef<HTMLInputElement>(null);
  const ipaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const data = await appBannerService.getAdmin();
      setConfig(data);
    } catch (err) {
      toast.error("Failed to load app banner config", {
        description: getSafeErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    try {
      setSaving(true);
      const updated = await appBannerService.update({
        isActive: config.isActive,
        title: config.title,
        rating: config.rating,
        downloadCount: config.downloadCount,
        iconType: config.iconType,
        iconImage: config.iconImage,
        iconBgColor: config.iconBgColor,
        iconFgColor: config.iconFgColor,
        buttonText: config.buttonText,
        buttonStyle: config.buttonStyle,
        buttonColor: config.buttonColor,
        playStoreUrl: config.playStoreUrl,
        appStoreUrl: config.appStoreUrl,
        apkFileUrl: config.apkFileUrl,
        apkFileName: config.apkFileName,
        apkFileSize: config.apkFileSize,
        ipaFileUrl: config.ipaFileUrl,
        ipaFileName: config.ipaFileName,
        ipaFileSize: config.ipaFileSize,
        windowsAppUrl: config.windowsAppUrl,
        macAppUrl: config.macAppUrl,
        dismissDays: config.dismissDays,
        showDownloadSection: config.showDownloadSection,
        showGooglePlay: config.showGooglePlay,
        showAppStore: config.showAppStore,
        popupEnabled: config.popupEnabled,
        popupFrequency: config.popupFrequency,
        popupTitle: config.popupTitle,
        popupSubtitle: config.popupSubtitle,
      });
      setConfig(updated);
      try {
        localStorage.setItem("apnakit:app-banner-config", JSON.stringify(updated));
        localStorage.setItem("apnakit:app-banner-config-ts", String(Date.now()));
      } catch {
        // ignore
      }
      toast.success("App banner saved", {
        description: "Changes are live on the customer site.",
      });
    } catch (err) {
      toast.error("Save failed", { description: getSafeErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  const uploadFile = async (
    file: File,
    endpoint: string,
    field: "iconImage" | "apkFileUrl" | "ipaFileUrl"
  ) => {
    const form = new FormData();
    form.append("file", file);
    const res = await apiClient.post(endpoint, form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 300000, // 5min for big APKs
    });
    const data = res.data?.data || res.data;
    const url = data?.url;
    if (!url) throw new Error("Upload did not return a URL");
    setConfig((c) =>
      c
        ? {
            ...c,
            [field]: url,
            ...(field === "apkFileUrl" && { apkFileName: file.name, apkFileSize: file.size }),
            ...(field === "ipaFileUrl" && { ipaFileName: file.name, ipaFileSize: file.size }),
          }
        : c
    );
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setUploadingIcon(true);
      await uploadFile(f, "/upload/app-icon", "iconImage");
      toast.success("App icon uploaded");
    } catch (err) {
      toast.error("Icon upload failed", { description: getSafeErrorMessage(err) });
    } finally {
      setUploadingIcon(false);
      if (iconInputRef.current) iconInputRef.current.value = "";
    }
  };

  const handleApkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setUploadingApk(true);
      await uploadFile(f, "/upload/apk", "apkFileUrl");
      toast.success("APK uploaded", { description: `Direct download link saved.` });
    } catch (err) {
      toast.error("APK upload failed", { description: getSafeErrorMessage(err) });
    } finally {
      setUploadingApk(false);
      if (apkInputRef.current) apkInputRef.current.value = "";
    }
  };

  const handleIpaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setUploadingIpa(true);
      await uploadFile(f, "/upload/ipa", "ipaFileUrl");
      toast.success("IPA uploaded", { description: `Direct download link saved.` });
    } catch (err) {
      toast.error("IPA upload failed", { description: getSafeErrorMessage(err) });
    } finally {
      setUploadingIpa(false);
      if (ipaInputRef.current) ipaInputRef.current.value = "";
    }
  };

  const removeFile = (field: "iconImage" | "apkFileUrl" | "ipaFileUrl") => {
    setConfig((c) =>
      c
        ? {
            ...c,
            [field]: null,
            ...(field === "apkFileUrl" && { apkFileName: null, apkFileSize: null }),
            ...(field === "ipaFileUrl" && { ipaFileName: null, ipaFileSize: null }),
          }
        : c
    );
  };

  const copyLink = (url: string | null) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success("Link copied");
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-destructive">
        Failed to load app banner config.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">App Download Banner</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The Housing.com-style bar shown above the site header. Push the app to every visitor.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
            <Label htmlFor="active-toggle" className="text-sm font-medium">
              {config.isActive ? "Live" : "Hidden"}
            </Label>
            <Switch
              id="active-toggle"
              checked={config.isActive}
              onCheckedChange={(v) => setConfig({ ...config, isActive: v })}
            />
            {config.isActive ? (
              <Eye className="h-4 w-4 text-emerald-600" />
            ) : (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: editor */}
        <div className="space-y-6 lg:col-span-2">
          <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="style">Style</TabsTrigger>
              <TabsTrigger value="downloads">Downloads</TabsTrigger>
              <TabsTrigger value="popup">Popup</TabsTrigger>
              <TabsTrigger value="behavior">Behavior</TabsTrigger>
            </TabsList>

            {/* Content tab */}
            <TabsContent value="content" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Banner text</CardTitle>
                  <CardDescription>What the customer sees.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={config.title}
                      onChange={(e) => setConfig({ ...config, title: e.target.value })}
                      placeholder="ApnaKit is better on the app"
                      className="mt-1.5"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="rating">Rating</Label>
                      <Input
                        id="rating"
                        value={config.rating || ""}
                        onChange={(e) => setConfig({ ...config, rating: e.target.value })}
                        placeholder="4.6"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="downloads">Download count</Label>
                      <Input
                        id="downloads"
                        value={config.downloadCount || ""}
                        onChange={(e) =>
                          setConfig({ ...config, downloadCount: e.target.value })
                        }
                        placeholder="10L+"
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>App icon</CardTitle>
                  <CardDescription>
                    Square icon shown in the yellow box. Upload a PNG / SVG / WebP, or pick a
                    color combo to use the default sparkle glyph.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg"
                      style={{
                        backgroundColor: config.iconBgColor,
                        color: config.iconFgColor,
                      }}
                    >
                      {config.iconImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={config.iconImage}
                          alt="App icon"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Sparkles className="h-8 w-8" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          ref={iconInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          onChange={handleIconUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => iconInputRef.current?.click()}
                          disabled={uploadingIcon}
                          className="gap-2"
                        >
                          {uploadingIcon ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Upload className="h-3.5 w-3.5" />
                          )}
                          Upload icon
                        </Button>
                        {config.iconImage && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile("iconImage")}
                            className="gap-1 text-destructive"
                          >
                            <X className="h-3.5 w-3.5" />
                            Remove
                          </Button>
                        )}
                        <span className="text-xs text-muted-foreground">PNG / SVG, max 2MB</span>
                      </div>
                      <div>
                        <Label htmlFor="icon-url" className="text-xs">
                          or paste image URL
                        </Label>
                        <Input
                          id="icon-url"
                          value={config.iconImage || ""}
                          onChange={(e) => setConfig({ ...config, iconImage: e.target.value })}
                          placeholder="https://..."
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Call-to-action button</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="btn-text">Button text</Label>
                    <Input
                      id="btn-text"
                      value={config.buttonText}
                      onChange={(e) => setConfig({ ...config, buttonText: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Style tab */}
            <TabsContent value="style" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Icon colors</CardTitle>
                  <CardDescription>Pick a color combo or set custom values.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs">Color presets</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {COLOR_PRESETS.map((p) => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() =>
                            setConfig({
                              ...config,
                              iconBgColor: p.bg,
                              iconFgColor: p.fg,
                            })
                          }
                          className={cn(
                            "flex h-9 items-center gap-1.5 rounded-full border-2 px-3 text-xs font-medium transition-all",
                            config.iconBgColor === p.bg && config.iconFgColor === p.fg
                              ? "border-indigo-500 ring-2 ring-indigo-200"
                              : "border-border hover:border-indigo-300"
                          )}
                          style={{ backgroundColor: p.bg, color: p.fg }}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bg-color">Background</Label>
                      <div className="mt-1.5 flex items-center gap-2">
                        <input
                          id="bg-color"
                          type="color"
                          value={config.iconBgColor}
                          onChange={(e) =>
                            setConfig({ ...config, iconBgColor: e.target.value })
                          }
                          className="h-9 w-12 cursor-pointer rounded border border-border"
                        />
                        <Input
                          value={config.iconBgColor}
                          onChange={(e) =>
                            setConfig({ ...config, iconBgColor: e.target.value })
                          }
                          className="font-mono text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="fg-color">Foreground</Label>
                      <div className="mt-1.5 flex items-center gap-2">
                        <input
                          id="fg-color"
                          type="color"
                          value={config.iconFgColor}
                          onChange={(e) =>
                            setConfig({ ...config, iconFgColor: e.target.value })
                          }
                          className="h-9 w-12 cursor-pointer rounded border border-border"
                        />
                        <Input
                          value={config.iconFgColor}
                          onChange={(e) =>
                            setConfig({ ...config, iconFgColor: e.target.value })
                          }
                          className="font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Button style</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { v: "outline", label: "Outline", preview: "border-2 bg-transparent" },
                        { v: "solid", label: "Solid", preview: "text-white" },
                        { v: "gradient", label: "Gradient", preview: "text-white" },
                      ] as const
                    ).map((s) => (
                      <button
                        key={s.v}
                        type="button"
                        onClick={() => setConfig({ ...config, buttonStyle: s.v })}
                        className={cn(
                          "rounded-lg border-2 p-3 text-sm font-medium transition-all",
                          config.buttonStyle === s.v
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-border hover:border-indigo-300"
                        )}
                      >
                        <div
                          className={cn(
                            "mb-1.5 rounded-md py-1.5",
                            s.preview,
                            s.v === "outline" && `border-2`,
                            s.v === "solid" && `bg-[${config.buttonColor}]`,
                            s.v === "gradient" &&
                              "bg-gradient-to-r from-indigo-600 to-purple-600"
                          )}
                          style={
                            s.v === "outline"
                              ? {
                                  borderColor: config.buttonColor,
                                  color: config.buttonColor,
                                }
                              : s.v === "solid"
                                ? { backgroundColor: config.buttonColor }
                                : undefined
                          }
                        >
                          {config.buttonText}
                        </div>
                        <span className="text-xs text-muted-foreground">{s.label}</span>
                      </button>
                    ))}
                  </div>
                  {config.buttonStyle !== "gradient" && (
                    <div>
                      <Label htmlFor="btn-color">Button color</Label>
                      <div className="mt-1.5 flex items-center gap-2">
                        <input
                          id="btn-color"
                          type="color"
                          value={config.buttonColor}
                          onChange={(e) =>
                            setConfig({ ...config, buttonColor: e.target.value })
                          }
                          className="h-9 w-12 cursor-pointer rounded border border-border"
                        />
                        <Input
                          value={config.buttonColor}
                          onChange={(e) =>
                            setConfig({ ...config, buttonColor: e.target.value })
                          }
                          className="font-mono text-xs"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Downloads tab */}
            <TabsContent value="downloads" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Android — Google Play</CardTitle>
                  <CardDescription>Link to your Play Store listing.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-emerald-600" />
                    <Input
                      value={config.playStoreUrl || ""}
                      onChange={(e) =>
                        setConfig({ ...config, playStoreUrl: e.target.value })
                      }
                      placeholder="https://play.google.com/store/apps/details?id=com.apnakit"
                    />
                    {config.playStoreUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(config.playStoreUrl!, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Android — Direct APK</CardTitle>
                  <CardDescription>
                    Upload your .apk or .aab file. Customers can install it directly without Play
                    Store.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {config.apkFileUrl ? (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
                          <Download className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {config.apkFileName || "APK file"}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {formatBytes(config.apkFileSize)} • {config.apkFileUrl}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => copyLink(config.apkFileUrl)}
                              className="gap-1.5"
                            >
                              {copied ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                              Copy link
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(config.apkFileUrl!, "_blank")}
                              className="gap-1.5"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Open
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeFile("apkFileUrl")}
                              className="gap-1.5 text-destructive"
                            >
                              <X className="h-3 w-3" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <input
                        ref={apkInputRef}
                        type="file"
                        accept=".apk,.aab,application/vnd.android.package-archive"
                        onChange={handleApkUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => apkInputRef.current?.click()}
                        disabled={uploadingApk}
                        className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center transition-colors hover:border-indigo-400 hover:bg-indigo-50/50 disabled:opacity-60"
                      >
                        {uploadingApk ? (
                          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                        ) : (
                          <Upload className="h-8 w-8 text-muted-foreground" />
                        )}
                        <p className="text-sm font-medium text-foreground">
                          {uploadingApk ? "Uploading APK…" : "Click to upload APK / AAB"}
                        </p>
                        <p className="text-xs text-muted-foreground">.apk or .aab, up to 200MB</p>
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>iOS — App Store</CardTitle>
                  <CardDescription>Link to your App Store listing.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Apple className="h-4 w-4 text-gray-900" />
                    <Input
                      value={config.appStoreUrl || ""}
                      onChange={(e) => setConfig({ ...config, appStoreUrl: e.target.value })}
                      placeholder="https://apps.apple.com/in/app/apnakit/id..."
                    />
                    {config.appStoreUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(config.appStoreUrl!, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>iOS — Direct IPA</CardTitle>
                  <CardDescription>
                    Upload your .ipa file for direct download (e.g. for TestFlight sideload).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {config.ipaFileUrl ? (
                    <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
                          <Download className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {config.ipaFileName || "IPA file"}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {formatBytes(config.ipaFileSize)} • {config.ipaFileUrl}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => copyLink(config.ipaFileUrl)}
                              className="gap-1.5"
                            >
                              <Copy className="h-3 w-3" />
                              Copy link
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(config.ipaFileUrl!, "_blank")}
                              className="gap-1.5"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Open
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeFile("ipaFileUrl")}
                              className="gap-1.5 text-destructive"
                            >
                              <X className="h-3 w-3" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <input
                        ref={ipaInputRef}
                        type="file"
                        accept=".ipa,.pkg"
                        onChange={handleIpaUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => ipaInputRef.current?.click()}
                        disabled={uploadingIpa}
                        className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center transition-colors hover:border-indigo-400 hover:bg-indigo-50/50 disabled:opacity-60"
                      >
                        {uploadingIpa ? (
                          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                        ) : (
                          <Upload className="h-8 w-8 text-muted-foreground" />
                        )}
                        <p className="text-sm font-medium text-foreground">
                          {uploadingIpa ? "Uploading IPA…" : "Click to upload IPA"}
                        </p>
                        <p className="text-xs text-muted-foreground">.ipa or .pkg, up to 300MB</p>
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Desktop apps (optional)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="win-url">Windows</Label>
                    <Input
                      id="win-url"
                      value={config.windowsAppUrl || ""}
                      onChange={(e) =>
                        setConfig({ ...config, windowsAppUrl: e.target.value })
                      }
                      placeholder="https://apps.microsoft.com/..."
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mac-url">macOS</Label>
                    <Input
                      id="mac-url"
                      value={config.macAppUrl || ""}
                      onChange={(e) => setConfig({ ...config, macAppUrl: e.target.value })}
                      placeholder="https://apps.apple.com/..."
                      className="mt-1.5"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Popup tab */}
            <TabsContent value="popup" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-indigo-600" />
                    Fullscreen Download Popup
                  </CardTitle>
                  <CardDescription>
                    A premium fullscreen popup that appears when visitors open the site. Encourages them to download the app.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50/50 p-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Enable Popup</p>
                      <p className="text-xs text-muted-foreground">
                        Show the fullscreen popup to visitors
                      </p>
                    </div>
                    <Switch
                      checked={config.popupEnabled}
                      onCheckedChange={(v) => setConfig({ ...config, popupEnabled: v })}
                    />
                  </div>

                  {config.popupEnabled && (
                    <>
                      <div>
                        <Label htmlFor="popup-frequency">Show Frequency</Label>
                        <select
                          id="popup-frequency"
                          value={config.popupFrequency || "once_per_device"}
                          onChange={(e) => setConfig({ ...config, popupFrequency: e.target.value })}
                          className="mt-1.5 flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="every_visit">Every visit (shows on every page load)</option>
                          <option value="once_per_day">Once per day (shows once every 24 hours)</option>
                          <option value="once_per_device">Once per device (shows only for new visitors)</option>
                        </select>
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          {config.popupFrequency === "every_visit"
                            ? "Popup will show every time the visitor opens the site."
                            : config.popupFrequency === "once_per_day"
                              ? "Popup will show once, then hide for 24 hours after dismissal."
                              : "Popup will show once per device. Uses browser storage to remember."}
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="popup-title">Popup Title</Label>
                        <Input
                          id="popup-title"
                          value={config.popupTitle || ""}
                          onChange={(e) => setConfig({ ...config, popupTitle: e.target.value })}
                          placeholder="Get the ApnaKit App"
                          className="mt-1.5"
                        />
                      </div>

                      <div>
                        <Label htmlFor="popup-subtitle">Popup Subtitle</Label>
                        <Input
                          id="popup-subtitle"
                          value={config.popupSubtitle || ""}
                          onChange={(e) => setConfig({ ...config, popupSubtitle: e.target.value })}
                          placeholder="Shop faster, get exclusive deals & track orders in real-time"
                          className="mt-1.5"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {config.popupEnabled && (
                <Card>
                  <CardHeader>
                    <CardTitle>Popup Preview</CardTitle>
                    <CardDescription>How the popup looks to visitors.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-black/60 p-6">
                      <div className="mx-auto max-w-[280px] overflow-hidden rounded-2xl bg-white shadow-xl">
                        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 px-4 pt-6 pb-14 text-center">
                          <div
                            className="mx-auto mb-3 flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-white/20"
                            style={{
                              backgroundColor: config.iconBgColor || "#FACC15",
                              color: config.iconFgColor || "#7C3AED",
                            }}
                          >
                            {config.iconImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={config.iconImage} alt="icon" className="h-full w-full object-cover" />
                            ) : (
                              <Sparkles className="h-7 w-7" />
                            )}
                          </div>
                          <h3 className="text-base font-bold text-white">
                            {config.popupTitle || "Get the ApnaKit App"}
                          </h3>
                          <p className="mt-1 text-[11px] text-white/70">
                            {config.popupSubtitle || "Shop faster, get exclusive deals"}
                          </p>
                        </div>
                        <div className="relative -mt-8 space-y-2 px-4 pb-4">
                          <div className="flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-xs font-bold text-white shadow-md">
                            <Download className="h-3.5 w-3.5" />
                            {config.buttonText || "Download App"}
                          </div>
                          <div className="flex h-9 items-center justify-center gap-1 rounded-xl border border-gray-200 bg-gray-50 text-[11px] font-medium text-gray-500">
                            Continue on Website
                            <ChevronRight className="h-3 w-3" />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 border-t border-gray-100 px-4 py-3">
                          {[
                            { icon: Zap, label: "Fast Delivery", color: "text-amber-500 bg-amber-50" },
                            { icon: Shield, label: "Secure Pay", color: "text-emerald-500 bg-emerald-50" },
                            { icon: ShoppingBag, label: "Best Deals", color: "text-indigo-500 bg-indigo-50" },
                          ].map(({ icon: I, label, color }) => (
                            <div key={label} className="flex flex-col items-center gap-1">
                              <div className={cn("flex h-6 w-6 items-center justify-center rounded-md", color)}>
                                <I className="h-3 w-3" />
                              </div>
                              <span className="text-[9px] font-medium text-gray-500">{label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Behavior tab */}
            <TabsContent value="behavior" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Show / hide globally</CardTitle>
                  <CardDescription>
                    Turn the entire banner off across the site without deleting your settings.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={config.isActive}
                      onCheckedChange={(v) => setConfig({ ...config, isActive: v })}
                    />
                    <div>
                      <p className="text-sm font-medium">
                        {config.isActive ? "Currently live on the site" : "Currently hidden"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {config.isActive
                          ? "Visitors see the banner above the header on every page load."
                          : "Visitors will not see the banner."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Footer "Download App" section</CardTitle>
                  <CardDescription>
                    Control the Download App buttons shown in the site footer.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="text-sm font-medium">Show Download App section</p>
                      <p className="text-xs text-muted-foreground">
                        Toggle the entire Download App block in the footer
                      </p>
                    </div>
                    <Switch
                      checked={config.showDownloadSection}
                      onCheckedChange={(v) => setConfig({ ...config, showDownloadSection: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="text-sm font-medium">Show Google Play button</p>
                      <p className="text-xs text-muted-foreground">
                        Show or hide the Google Play download button
                      </p>
                    </div>
                    <Switch
                      checked={config.showGooglePlay}
                      onCheckedChange={(v) => setConfig({ ...config, showGooglePlay: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="text-sm font-medium">Show App Store button</p>
                      <p className="text-xs text-muted-foreground">
                        Show or hide the App Store download button
                      </p>
                    </div>
                    <Switch
                      checked={config.showAppStore}
                      onCheckedChange={(v) => setConfig({ ...config, showAppStore: v })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>How the banner behaves</CardTitle>
                  <CardDescription>
                    Customer-facing behavior is locked in for maximum visibility.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                      <span>Shows on every page load while the banner is active.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                      <span>
                        If the customer closes the banner, it comes back on the next page load.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                      <span>
                        The header sticks just below the banner so the layout never jumps.
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: live preview */}
        <div className="space-y-4">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Live preview
              </CardTitle>
              <CardDescription>What customers see right now.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="overflow-hidden rounded-lg border border-border bg-white">
                {/* Banner preview */}
                <div className="border-b border-gray-200 bg-white px-3 py-2">
                  <div className="flex items-center gap-2.5">
                    <button className="flex h-6 w-6 items-center justify-center rounded-full text-gray-400">
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <div
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg"
                      style={{
                        backgroundColor: config.iconBgColor,
                        color: config.iconFgColor,
                      }}
                    >
                      {config.iconImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={config.iconImage}
                          alt="icon"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {config.title}
                      </p>
                      {(config.rating || config.downloadCount) && (
                        <p className="flex items-center gap-1 truncate text-[10px] text-muted-foreground">
                          {config.rating && (
                            <span className="inline-flex items-center gap-0.5 font-medium text-amber-500">
                              <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                              {config.rating}
                            </span>
                          )}
                          {config.rating && config.downloadCount && (
                            <span className="text-muted-foreground/60">|</span>
                          )}
                          {config.downloadCount && (
                            <span>{config.downloadCount} Downloads</span>
                          )}
                        </p>
                      )}
                    </div>
                    <div
                      className={cn(
                        "rounded-md px-3 py-1 text-[11px] font-semibold",
                        config.buttonStyle === "outline" && "border-2 bg-transparent",
                        config.buttonStyle === "gradient" &&
                          "bg-gradient-to-r from-indigo-600 to-purple-600 text-white",
                        config.buttonStyle === "solid" && "text-white"
                      )}
                      style={
                        config.buttonStyle === "outline"
                          ? { borderColor: config.buttonColor, color: config.buttonColor }
                          : config.buttonStyle === "solid"
                            ? { backgroundColor: config.buttonColor }
                            : undefined
                      }
                    >
                      {config.buttonText}
                    </div>
                  </div>
                </div>
                {/* Mock header below */}
                <div className="bg-gray-50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo.png" alt="ApnaKit" className="h-5 w-auto" />
                    <div className="h-4 flex-1 rounded bg-white" />
                    <div className="h-4 w-12 rounded bg-white" />
                  </div>
                </div>
                {/* Mock page */}
                <div className="space-y-1.5 p-3">
                  <div className="h-2 w-3/4 rounded bg-muted" />
                  <div className="h-2 w-1/2 rounded bg-muted" />
                  <div className="mt-2 grid grid-cols-3 gap-1.5">
                    <div className="aspect-square rounded bg-muted" />
                    <div className="aspect-square rounded bg-muted" />
                    <div className="aspect-square rounded bg-muted" />
                  </div>
                </div>
              </div>

              {config.isActive ? (
                <Badge className="w-full justify-center bg-emerald-100 text-emerald-700">
                  <Eye className="mr-1.5 h-3 w-3" /> Visible on site
                </Badge>
              ) : (
                <Badge variant="secondary" className="w-full justify-center">
                  <EyeOff className="mr-1.5 h-3 w-3" /> Hidden
                </Badge>
              )}

              <Separator />

              <div className="space-y-1.5 text-xs">
                <p className="font-semibold text-foreground">Files configured:</p>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  {config.playStoreUrl ? (
                    <Check className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <X className="h-3 w-3 text-muted-foreground/50" />
                  )}
                  Google Play URL
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  {config.apkFileUrl ? (
                    <Check className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <X className="h-3 w-3 text-muted-foreground/50" />
                  )}
                  Direct APK
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  {config.appStoreUrl ? (
                    <Check className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <X className="h-3 w-3 text-muted-foreground/50" />
                  )}
                  App Store URL
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  {config.ipaFileUrl ? (
                    <Check className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <X className="h-3 w-3 text-muted-foreground/50" />
                  )}
                  Direct IPA
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  {config.windowsAppUrl ? (
                    <Check className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <X className="h-3 w-3 text-muted-foreground/50" />
                  )}
                  Windows app
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  {config.macAppUrl ? (
                    <Check className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <X className="h-3 w-3 text-muted-foreground/50" />
                  )}
                  macOS app
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
