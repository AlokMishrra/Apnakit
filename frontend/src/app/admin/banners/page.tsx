"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  ExternalLink,
  Calendar,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";
import { getSafeErrorMessage } from "@/lib/safe-error";

const positionConfig: Record<string, { label: string; color: string }> = {
  HERO: { label: "Hero", color: "bg-blue-100 text-blue-600" },
  CATEGORY: { label: "Category", color: "bg-emerald-100 text-emerald-600" },
  PROMOTIONAL: { label: "Promotional", color: "bg-purple-100 text-purple-600" },
  FOOTER: { label: "Footer", color: "bg-amber-100 text-amber-600" },
};

export default function BannersPage() {
  const [positionFilter, setPositionFilter] = useState("all");
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const data = await adminService.getBanners();
      const list = data?.data?.data || data?.data || (Array.isArray(data) ? data : []);
      setBanners(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error("Failed to load banners", { description: getSafeErrorMessage(err) });
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredBanners = useMemo(() => {
    if (positionFilter === "all") return banners;
    return banners.filter((b: any) => String(b.position || "").toUpperCase() === positionFilter);
  }, [banners, positionFilter]);

  const groupedBanners = useMemo(() => {
    return filteredBanners.reduce((acc: any, banner: any) => {
      const pos = String(banner.position || "OTHER").toUpperCase();
      if (!acc[pos]) acc[pos] = [];
      acc[pos].push(banner);
      return acc;
    }, {} as Record<string, any[]>);
  }, [filteredBanners]);

  const toggleActive = async (id: string) => {
    const banner = banners.find((b: any) => b.id === id);
    if (!banner) return;
    try {
      await adminService.updateBanner(id, { isActive: !banner.isActive });
      setBanners((prev) =>
        prev.map((b: any) => (b.id === id ? { ...b, isActive: !b.isActive } : b))
      );
      toast.success(banner.isActive ? "Banner deactivated" : "Banner activated");
    } catch (err) {
      toast.error("Failed to update banner", { description: getSafeErrorMessage(err) });
    }
  };

  const deleteBanner = async (id: string) => {
    if (!confirm("Delete this banner? This cannot be undone.")) return;
    try {
      await adminService.deleteBanner(id);
      setBanners((prev) => prev.filter((b: any) => b.id !== id));
      toast.success("Banner deleted");
    } catch (err) {
      toast.error("Failed to delete banner", { description: getSafeErrorMessage(err) });
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banners</h1>
          <p className="text-sm text-gray-500">Manage homepage and promotional banners</p>
        </div>
        <Link href="/admin/banners/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Banner
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(positionConfig).map(([key, config]) => {
          const count = banners.filter((b) => String(b.position || "").toUpperCase() === key).length;
          const activeCount = banners.filter(
            (b) => String(b.position || "").toUpperCase() === key && b.isActive
          ).length;
          return (
            <Card
              key={key}
              className={`cursor-pointer transition-all ${
                positionFilter === key ? "ring-2 ring-primary" : "hover:shadow-md"
              }`}
              onClick={() => setPositionFilter(positionFilter === key ? "all" : key)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.color}`}>
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{config.label}</p>
                    <p className="text-lg font-bold text-gray-900">
                      {count}
                      <span className="ml-1 text-sm font-normal text-gray-400">
                        ({activeCount} active)
                      </span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {banners.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
            <h3 className="mb-1 text-base font-semibold text-foreground">No banners yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Create your first banner to display on the homepage
            </p>
            <Link href="/admin/banners/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Banner
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedBanners).map(([position, list]) => {
            const config = positionConfig[position] || {
              label: position,
              color: "bg-gray-100 text-gray-600",
            };
            return (
              <div key={position} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {config.label} Banners
                  </h2>
                  <Badge variant="secondary">{list.length}</Badge>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((banner) => (
                    <Card
                      key={banner.id}
                      className={`overflow-hidden transition-all ${
                        !banner.isActive ? "opacity-60" : ""
                      }`}
                    >
                      <div className="relative aspect-video bg-gray-100">
                        <img
                          src={banner.image || "https://placehold.co/600x300?text=No+Image"}
                          alt={banner.title}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://placehold.co/600x300?text=No+Image";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                          <h3 className="line-clamp-1 font-semibold">{banner.title}</h3>
                          {banner.subtitle && (
                            <p className="line-clamp-1 text-sm text-white/80">{banner.subtitle}</p>
                          )}
                        </div>
                        <div className="absolute right-2 top-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8 bg-white/90"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/admin/banners/${banner.id}/edit`}
                                  className="flex items-center gap-2"
                                >
                                  <Edit className="h-4 w-4" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => toggleActive(banner.id)}
                                className="flex items-center gap-2"
                              >
                                {banner.isActive ? (
                                  <>
                                    <EyeOff className="h-4 w-4 text-amber-500" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-4 w-4 text-emerald-500" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              {banner.link && (
                                <DropdownMenuItem asChild>
                                  <a
                                    href={banner.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    View Link
                                  </a>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => deleteBanner(banner.id)}
                                className="flex items-center gap-2 text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="absolute left-2 top-2">
                          <Badge variant={banner.isActive ? "success" : "secondary"}>
                            {banner.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          {(banner.startsAt || banner.expiresAt) && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {banner.startsAt ? formatDate(banner.startsAt, "MMM dd") : "—"} -{" "}
                              {banner.expiresAt
                                ? formatDate(banner.expiresAt, "MMM dd, yyyy")
                                : "—"}
                            </div>
                          )}
                          <span>Order: {banner.sortOrder ?? 0}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
