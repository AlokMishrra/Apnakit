"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  ChevronUp,
  ChevronDown,
  Download,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";
import type { Brand } from "@/types";

export default function BrandsPage() {
  const [brands, setBrands] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"name" | "productCount">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setLoading(true);
        const res = await adminService.getBrands();
        const rawBrands = res?.data?.data || res?.data || [];
        setBrands(rawBrands.map((b: any) => ({
          ...b,
          productCount: b.productCount ?? b._count?.products ?? 0,
        })));
      } catch {
        toast.error("Failed to load brands");
      } finally {
        setLoading(false);
      }
    };
    fetchBrands();
  }, []);

  const filteredBrands = useMemo(() => {
    let result = [...brands];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.slug.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") cmp = a.name.localeCompare(b.name);
      else cmp = a.productCount - b.productCount;
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return result;
  }, [brands, search, sortField, sortDirection]);

  const handleSort = (field: "name" | "productCount") => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      try {
        const brandId = (deleteTarget as any)._id || deleteTarget.id;
        await adminService.deleteBrand(brandId);
        setBrands((prev) => prev.filter((b) => ((b as any)._id || b.id) !== brandId));
        toast.success("Brand deleted");
      } catch {
        toast.error("Failed to delete brand");
      } finally {
        setDeleteDialogOpen(false);
        setDeleteTarget(null);
      }
    }
  };

  const SortIcon = ({ field }: { field: "name" | "productCount" }) => {
    if (sortField !== field)
      return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="ml-1 h-3.5 w-3.5" />
    ) : (
      <ChevronDown className="ml-1 h-3.5 w-3.5" />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Brands</h1>
          <p className="text-muted-foreground">
            Manage product brands and manufacturers
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/brands/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Brand
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{brands.length}</p>
              <p className="text-sm text-muted-foreground">Total Brands</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
              <Eye className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {brands.filter((b) => b.isActive).length}
              </p>
              <p className="text-sm text-muted-foreground">Active Brands</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
              <Package className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {brands.reduce((acc, b) => acc + b.productCount, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total Products</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col gap-4 border-b p-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search brands..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : filteredBrands.length === 0 ? (
            <EmptyState
              icon={<Package className="h-12 w-12 text-muted-foreground" />}
              title="No brands found"
              description="Try adjusting your search or create a new brand"
              action={
                <Button asChild>
                  <Link href="/admin/brands/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Brand
                  </Link>
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-sm font-medium text-muted-foreground">
                    <th className="w-16 px-4 py-3">Logo</th>
                    <th className="px-4 py-3">
                      <button
                        className="flex items-center"
                        onClick={() => handleSort("name")}
                      >
                        Name <SortIcon field="name" />
                      </button>
                    </th>
                    <th className="px-4 py-3">Slug</th>
                    <th className="px-4 py-3">
                      <button
                        className="flex items-center"
                        onClick={() => handleSort("productCount")}
                      >
                        Products <SortIcon field="productCount" />
                      </button>
                    </th>
                    <th className="px-4 py-3">Status</th>
                    <th className="w-16 px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBrands.map((brand) => (
                    <tr
                      key={(brand as any)._id || brand.id}
                      className="border-b transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <div className="relative h-10 w-10 overflow-hidden rounded-lg border bg-muted">
                          {brand.logo ? (
                            <Image
                              src={brand.logo}
                              alt={brand.name}
                              fill
                              className="object-contain p-1"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs font-medium text-muted-foreground">
                              {brand.name.charAt(0)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{brand.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-muted-foreground">
                          /{brand.slug}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">{brand.productCount}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={brand.isActive ? "success" : "secondary"}>
                          {brand.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/brands/${(brand as any)._id || brand.id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setDeleteTarget(brand);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Brand</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
