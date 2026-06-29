"use client";

import { useEffect, useState } from "react";
import {
  Save,
  Loader2,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  Globe,
  Send,
  MessageCircle,
  Share2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getSafeErrorMessage } from "@/lib/safe-error";
import { socialMediaService, type SocialMediaConfig } from "@/services/social-media.service";
import { cn } from "@/lib/utils";

const SOCIAL_FIELDS = [
  { key: "facebook" as const, label: "Facebook", icon: Facebook, placeholder: "https://facebook.com/yourpage", color: "text-blue-600" },
  { key: "twitter" as const, label: "Twitter / X", icon: Twitter, placeholder: "https://twitter.com/yourhandle", color: "text-sky-500" },
  { key: "instagram" as const, label: "Instagram", icon: Instagram, placeholder: "https://instagram.com/yourprofile", color: "text-pink-500" },
  { key: "youtube" as const, label: "YouTube", icon: Youtube, placeholder: "https://youtube.com/@yourchannel", color: "text-red-600" },
  { key: "linkedin" as const, label: "LinkedIn", icon: Linkedin, placeholder: "https://linkedin.com/company/yours", color: "text-blue-700" },
  { key: "telegram" as const, label: "Telegram", icon: Send, placeholder: "https://t.me/yourchannel", color: "text-blue-500" },
  { key: "whatsapp" as const, label: "WhatsApp", icon: MessageCircle, placeholder: "https://wa.me/919458244341", color: "text-green-600" },
  { key: "pinterest" as const, label: "Pinterest", icon: Globe, placeholder: "https://pinterest.com/yourprofile", color: "text-red-500" },
];

export default function AdminSocialMediaPage() {
  const [config, setConfig] = useState<SocialMediaConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const data = await socialMediaService.getAdmin();
      setConfig(data);
      setForm({
        facebook: data.facebook || "",
        twitter: data.twitter || "",
        instagram: data.instagram || "",
        youtube: data.youtube || "",
        linkedin: data.linkedin || "",
        pinterest: data.pinterest || "",
        telegram: data.telegram || "",
        whatsapp: data.whatsapp || "",
      });
    } catch (err) {
      toast.error("Failed to load social media config", {
        description: getSafeErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (checked: boolean) => {
    if (!config) return;
    try {
      const updated = await socialMediaService.update({ isActive: checked });
      setConfig(updated);
      toast.success(checked ? "Social media links enabled" : "Social media links disabled");
    } catch (err) {
      toast.error("Failed to toggle", { description: getSafeErrorMessage(err) });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload: Record<string, string | null> = {};
      Object.keys(form).forEach((k) => {
        payload[k] = form[k] || null;
      });
      const updated = await socialMediaService.update(payload);
      setConfig(updated);
      toast.success("Social media links updated");
    } catch (err) {
      toast.error("Failed to save", { description: getSafeErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  const filledCount = Object.values(form).filter((v) => v.trim()).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Social Media Links</h1>
          <p className="text-sm text-muted-foreground">
            Manage social media links shown in the footer
          </p>
        </div>
        <div className="flex items-center gap-3">
          {config && (
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Visible</Label>
              <Switch
                checked={config.isActive}
                onCheckedChange={handleToggle}
              />
            </div>
          )}
          <Badge variant={config?.isActive ? "default" : "secondary"}>
            {config?.isActive ? (
              <><Eye className="mr-1 h-3 w-3" /> Active</>
            ) : (
              <><EyeOff className="mr-1 h-3 w-3" /> Hidden</>
            )}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Social Media URLs
          </CardTitle>
          <CardDescription>
            Enter the full URL for each platform. Leave blank to hide that icon. {filledCount}/{SOCIAL_FIELDS.length} configured.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {SOCIAL_FIELDS.map((field) => {
            const Icon = field.icon;
            const hasValue = !!form[field.key];
            return (
              <div key={field.key} className="flex items-center gap-3">
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted", field.color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <Label className="text-sm font-medium">{field.label}</Label>
                  <Input
                    placeholder={field.placeholder}
                    value={form[field.key] || ""}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    className="mt-1"
                  />
                </div>
                {hasValue && (
                  <Badge variant="outline" className="shrink-0 text-green-600 border-green-200 bg-green-50">
                    Active
                  </Badge>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
