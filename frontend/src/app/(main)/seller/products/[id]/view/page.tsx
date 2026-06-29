"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/services/api";
import { toast } from "sonner";
import { ChevronRight, ArrowLeft, Loader2, Package, Edit } from "lucide-react";
import { formatCurrency, getImageUrl } from "@/lib/utils";

export default function ViewProductPage() {
  const params = useParams();
  const productId = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/products/${productId}`);
      const raw = res?.data?.data || res?.data || res;
      setProduct(raw?.data || raw);
    } catch {
      toast.error("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Product not found</p>
        <Button asChild className="mt-4">
          <Link href="/seller/products">Back to Products</Link>
        </Button>
      </div>
    );
  }

  const variant = product.variants?.[0];
  const primaryImage = product.images?.find((img: any) => img.isPrimary) || product.images?.[0];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/seller/dashboard" className="hover:text-foreground">Dashboard</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/seller/products" className="hover:text-foreground">Products</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">{product.name}</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <p className="text-sm text-muted-foreground">Product details</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/seller/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/seller/products/${productId}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Product Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{product.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">SKU</p>
                <p className="font-medium">{variant?.sku || product.sku || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-medium">{product.category?.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Brand</p>
                <p className="font-medium">{product.brand?.name || "N/A"}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Short Description</p>
              <p className="font-medium">{product.shortDescription || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="font-medium whitespace-pre-wrap">{product.description || "N/A"}</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pricing & Stock</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Price</span>
                <span className="text-xl font-bold">{formatCurrency(variant?.price || 0)}</span>
              </div>
              {variant?.compareAtPrice > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Compare Price</span>
                  <span className="text-sm line-through text-muted-foreground">
                    {formatCurrency(variant.compareAtPrice)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Stock</span>
                <Badge variant={variant?.stock > 0 ? "default" : "destructive"}>
                  {variant?.stock > 0 ? `${variant.stock} units` : "Out of Stock"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={product.isActive ? "default" : "secondary"}>
                  {product.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {primaryImage && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Product Image</CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={getImageUrl(primaryImage)}
                  alt={primaryImage.alt || product.name}
                  className="w-full h-48 object-cover rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/images/placeholder.svg";
                  }}
                />
              </CardContent>
            </Card>
          )}

          {product.specifications?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Specifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {product.specifications.map((spec: any) => (
                  <div key={spec.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{spec.name}</span>
                    <span className="font-medium">{spec.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
