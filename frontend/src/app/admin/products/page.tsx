"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Package, TrendingUp, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProductsTable } from "@/components/admin/products-table";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAllProducts({ page, limit: 20, search });
      const raw = res?.data?.data || res?.data || [];
      const data = Array.isArray(raw) ? raw.map((p: any) => {
        const totalStock = p.totalStock ?? p.variants?.reduce((s: number, v: any) => s + (v.stock || 0), 0) ?? p.stock ?? p.variants?.[0]?.stock ?? 0;
        const stockStatus = totalStock === 0 ? "out_of_stock" : totalStock <= 10 ? "low_stock" : "in_stock";
        return {
          ...p,
          id: p.id || p._id,
          price: p.price ?? p.variants?.[0]?.price ?? 0,
          stock: p.stock ?? p.variants?.[0]?.stock ?? 0,
          sku: p.sku ?? p.variants?.[0]?.sku ?? '',
          totalStock,
          stockStatus,
        };
      }) : [];
      setProducts(data);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, search]);

  const stats = {
    total: products.length,
    active: products.filter((p) => p.isActive).length,
    lowStock: products.filter((p) => p.stockStatus === "low_stock").length,
    outOfStock: products.filter((p) => p.stockStatus === "out_of_stock").length,
  };

  const handleDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map((id) => adminService.deleteProduct(id)));
      setProducts((prev) => prev.filter((p) => !ids.includes(p._id || p.id)));
      toast.success("Products deleted");
    } catch {
      toast.error("Failed to delete products");
    }
  };

  const handleStatusChange = async (ids: string[], active: boolean) => {
    try {
      await Promise.all(ids.map((id) => adminService.updateProduct(id, { isActive: active })));
      setProducts((prev) =>
        prev.map((p) => (ids.includes(p._id || p.id) ? { ...p, isActive: active } : p))
      );
      toast.success("Product status updated");
    } catch {
      toast.error("Failed to update product status");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your product inventory across all sellers
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Products</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.lowStock}</p>
              <p className="text-sm text-muted-foreground">Low Stock</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.outOfStock}</p>
              <p className="text-sm text-muted-foreground">Out of Stock</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <ProductsTable
          products={products}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
