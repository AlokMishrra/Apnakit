"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  FolderTree,
  Search,
  Download,
  LayoutGrid,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryTree } from "@/components/admin/category-tree";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"tree" | "list">("tree");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const res = await adminService.getCategories();
        setCategories(res?.data?.data || res?.data || []);
      } catch {
        toast.error("Failed to load categories");
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const totalProducts = categories.reduce(
    (acc, cat) => acc + (cat.productCount || 0),
    0
  );
  const totalCategories = categories.reduce(
    (acc, cat) => acc + 1 + (cat.children?.length || 0),
    0
  );

  const handleDelete = async (id: string) => {
    try {
      await adminService.deleteCategory(id);
      setCategories((prev) => prev.filter((cat) => cat._id !== id));
      toast.success("Category deleted");
    } catch {
      toast.error("Failed to delete category");
    }
  };

  const handleReorder = async (orders: { id: string; sortOrder: number }[]) => {
    try {
      await adminService.reorderCategories(orders);
      // Update local state
      setCategories((prev) => {
        const map = new Map(orders.map((o) => [o.id, o.sortOrder]));
        const sorted = [...prev].sort((a, b) => {
          const aId = a._id || a.id;
          const bId = b._id || b.id;
          return (map.get(aId) ?? 0) - (map.get(bId) ?? 0);
        });
        return sorted;
      });
      toast.success("Category order updated");
    } catch (err: any) {
      toast.error("Failed to reorder categories", {
        description: err?.response?.data?.message || err?.message,
      });
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">
            Organize your products with hierarchical categories
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/categories/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <FolderTree className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalCategories}</p>
              <p className="text-sm text-muted-foreground">Total Categories</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
              <LayoutGrid className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{categories.length}</p>
              <p className="text-sm text-muted-foreground">Parent Categories</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
              <List className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalProducts}</p>
              <p className="text-sm text-muted-foreground">Total Products</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1">
          <Button
            variant={view === "tree" ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setView("tree")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "list" ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setView("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="icon">
          <Download className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <CategoryTree categories={categories} onDelete={handleDelete} onReorder={handleReorder} />
      )}
    </div>
  );
}
