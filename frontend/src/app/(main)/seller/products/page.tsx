"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { sellerService } from "@/services/seller.service";
import { formatCurrency, getImageUrl } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Upload,
  Filter,
  Package,
  AlertTriangle,
} from "lucide-react";

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  low_stock: "bg-amber-100 text-amber-800",
  out_of_stock: "bg-red-100 text-red-800",
  draft: "bg-gray-100 text-gray-800",
};

const statusLabels: Record<string, string> = {
  active: "Active",
  low_stock: "Low Stock",
  out_of_stock: "Out of Stock",
  draft: "Draft",
};

export default function SellerProductsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [sellerProducts, setSellerProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [search, statusFilter, stockFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {};
      if (search) params.search = search;
      if (statusFilter !== "all") params.status = statusFilter;
      if (stockFilter !== "all") params.stock = stockFilter;
      const data = await sellerService.getProducts(params);
      const list = Array.isArray(data) ? data : (data?.products || data?.data?.products || data?.data || []);
      const normalized = Array.isArray(list) ? list.map((p: any) => ({
        ...p,
        id: p.id || p._id,
        price: p.price ?? p.variants?.[0]?.price ?? 0,
        stock: p.stock ?? p.variants?.[0]?.stock ?? 0,
        sku: p.sku ?? p.variants?.[0]?.sku ?? '',
        totalStock: p.totalStock ?? p.variants?.reduce((s: number, v: any) => s + (v.stock || 0), 0) ?? 0,
        status: p.isActive ? 'active' : 'inactive',
      })) : [];
      setSellerProducts(normalized);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Failed to load products");
      setSellerProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await sellerService.deleteProduct(id);
      toast.success("Product deleted successfully");
      fetchProducts();
    } catch (error) {
      console.error("Failed to delete product:", error);
      toast.error("Failed to delete product");
    }
  };

  const filteredProducts = sellerProducts;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage your product inventory</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
          </Button>
          <Link href="/seller/products/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500 p-2 rounded-lg text-white">
                <Package className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-xl font-bold">
                  {sellerProducts.filter((p) => p.status === "active").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500 p-2 rounded-lg text-white">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-xl font-bold">
                  {sellerProducts.filter((p) => p.status === "low_stock").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-500 p-2 rounded-lg text-white">
                <Package className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Out of Stock</p>
                <p className="text-xl font-bold">
                  {sellerProducts.filter((p) => p.status === "out_of_stock").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-lg text-white">
                <Package className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold">{sellerProducts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" label="All Status" />
                <SelectItem value="active" label="Active" />
                <SelectItem value="low_stock" label="Low Stock" />
                <SelectItem value="out_of_stock" label="Out of Stock" />
                <SelectItem value="draft" label="Draft" />
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Stock Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" label="All Stock" />
                <SelectItem value="in" label="In Stock" />
                <SelectItem value="low" label="Low Stock" />
                <SelectItem value="out" label="Out of Stock" />
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Product
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">
                    SKU
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Price
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">
                    Stock
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">
                    Sales
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="text-muted-foreground mt-2">Loading products...</p>
                    </td>
                  </tr>
                ) : filteredProducts.map((product: any) => (
                  <tr key={product.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {product.images?.[0] ? (
                            <img
                              src={getImageUrl(product.images[0])}
                              alt={product.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                              }}
                            />
                          ) : null}
                          <Package className={`h-5 w-5 text-gray-400 ${product.images?.[0] ? "hidden" : ""}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium line-clamp-1">{product.name}</p>
                          <p className="text-xs text-muted-foreground md:hidden">{product.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm hidden md:table-cell">{product.sku}</td>
                    <td className="py-3 px-4 text-sm font-medium">
                      {formatCurrency(product.price || 0)}
                    </td>
                    <td className="py-3 px-4 text-sm hidden sm:table-cell">
                      <span
                        className={
                          (product.stock || 0) === 0
                            ? "text-red-500 font-medium"
                            : (product.stock || 0) <= 10
                            ? "text-amber-500 font-medium"
                            : ""
                        }
                      >
                        {product.stock || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          statusColors[product.status]
                        }`}
                      >
                        {statusLabels[product.status]}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm hidden lg:table-cell">
                      {(product.sales || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/seller/products/${product.id}/view`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/seller/products/${product.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(product.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-muted-foreground">No products found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
