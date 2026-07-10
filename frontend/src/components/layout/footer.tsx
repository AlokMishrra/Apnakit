"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  Mail,
  MapPin,
  Smartphone,
  Send,
  MessageCircle,
  Globe,
} from "lucide-react";
import { STORE_NAME, FOOTER_LINKS, CATEGORIES } from "@/constants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { socialMediaService, type SocialMediaLinks } from "@/services/social-media.service";
import { appBannerService, type AppBannerConfig } from "@/services/app-banner.service";

const socialIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  youtube: Youtube,
  linkedin: Linkedin,
  telegram: Send,
  whatsapp: MessageCircle,
  pinterest: Globe,
};

const socialLabels: Record<string, string> = {
  facebook: "Facebook",
  twitter: "Twitter",
  instagram: "Instagram",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  pinterest: "Pinterest",
};

function Footer() {
  const [socialLinks, setSocialLinks] = useState<SocialMediaLinks | null>(null);
  const [appConfig, setAppConfig] = useState<AppBannerConfig | null>(null);
  const [apiCategories, setApiCategories] = useState<any[]>([]);

  useEffect(() => {
    socialMediaService
      .getPublic()
      .then(setSocialLinks)
      .catch(() => {});
    appBannerService
      .getPublic()
      .then(setAppConfig)
      .catch(() => {});
    const fetchCategories = async () => {
      try {
        const res = await import("@/services/api").then((m) => m.default.get("/categories"));
        const data = res?.data?.data;
        if (Array.isArray(data) && data.length > 0) {
          setApiCategories(data.slice(0, 6));
        }
      } catch {
        // fallback to static CATEGORIES
      }
    };
    fetchCategories();
  }, []);

  const categories = apiCategories.length > 0
    ? apiCategories.map((c: any) => ({ name: c.name, slug: c.slug }))
    : CATEGORIES.slice(0, 6);

  const activeLinks = socialLinks
    ? (Object.entries(socialLinks) as [string, string | null][]).filter(([, url]) => url)
    : [];

  return (
    <footer className="border-t bg-gray-50">
      {/* Newsletter */}
      <div className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-8 text-center sm:flex-row sm:text-left">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Subscribe to our newsletter</h3>
            <p className="text-sm text-muted-foreground">
              Get the latest deals, new arrivals, and exclusive offers.
            </p>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <Input
              placeholder="Enter your email"
              type="email"
              className="w-full sm:w-64"
            />
            <Button>Subscribe</Button>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* About */}
          <div className="col-span-2 lg:col-span-1">
            <h4 className="mb-4 text-lg font-bold text-foreground">{STORE_NAME}</h4>
            <p className="mb-4 text-sm text-muted-foreground">
              ApnaKit is one of the fastest instant delivery platforms, making everyday shopping
              easier with quick doorstep delivery of groceries and daily essentials. We offer quality
              products at competitive prices, often lower than local market rates, along with exclusive
              discounts and daily deals. Founded in 2026 by Anshu Saini and Nishu Saini, ApnaKit is
              committed to delivering convenience, affordability, and trust to every customer.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Near Baal Vidhya Mandir School, Chhutmalpur, Saharanpur 247662</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>support@apnakit.in</span>
              </div>
            </div>
            {activeLinks.length > 0 && (
              <div className="mt-4 flex gap-3">
                {activeLinks.map(([key, url]) => {
                  const Icon = socialIcons[key];
                  if (!Icon || !url) return null;
                  return (
                    <Link
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                      aria-label={socialLabels[key] || key}
                    >
                      <Icon className="h-4 w-4" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Categories */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
              Categories
            </h4>
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/category/${cat.slug}`}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
              About
            </h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.about.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Policy */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
              Customer Policy
            </h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.customerPolicy.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Download App */}
            {appConfig?.showDownloadSection && (
              <div className="mt-6">
                <h5 className="mb-2 text-sm font-semibold">Download App</h5>
                <div className="flex gap-2">
                  {appConfig.showGooglePlay && (
                    <a
                      href={appConfig.playStoreUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-md border bg-black px-2 py-1 text-white transition-opacity hover:opacity-80"
                    >
                      <Smartphone className="h-4 w-4" />
                      <div className="text-[10px] leading-tight">
                        <div className="opacity-70">GET IT ON</div>
                        <div className="font-semibold">Google Play</div>
                      </div>
                    </a>
                  )}
                  {appConfig.showAppStore && (
                    <a
                      href={appConfig.appStoreUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-md border bg-black px-2 py-1 text-white transition-opacity hover:opacity-80"
                    >
                      <Smartphone className="h-4 w-4" />
                      <div className="text-[10px] leading-tight">
                        <div className="opacity-70">GET IT ON</div>
                        <div className="font-semibold">App Store</div>
                      </div>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-4 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {STORE_NAME}. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">We accept:</span>
            <div className="flex items-center gap-1">
              {["Visa", "Mastercard", "UPI", "RuPay"].map((method) => (
                <div
                  key={method}
                  className="rounded border bg-muted px-2 py-0.5 text-[10px] font-medium"
                >
                  {method}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export { Footer };
