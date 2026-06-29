"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Store,
  Mail,
  Phone,
  Calendar,
  Star,
  Package,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Settings,
  ShieldCheck,
  Loader2,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/ui/avatar";
import { formatCurrency, formatDate } from "@/lib/utils";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";
import { getSafeErrorMessage } from "@/lib/safe-error";

const orderStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }> = {
  PENDING: { label: "Pending", variant: "warning" },
  CONFIRMED: { label: "Confirmed", variant: "default" },
  PROCESSING: { label: "Processing", variant: "default" },
  PACKED: { label: "Packed", variant: "secondary" },
  SHIPPED: { label: "Shipped", variant: "secondary" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", variant: "secondary" },
  DELIVERED: { label: "Delivered", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
  RETURNED: { label: "Returned", variant: "outline" },
  REFUNDED: { label: "Refunded", variant: "outline" },
};

function maskAccountNumber(value: any): string {
  const s = String(value || "");
  if (s.length <= 4) return s;
  return "*".repeat(s.length - 4) + s.slice(-4);
}

export default function SellerDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [seller, setSeller] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const sellerRes = await adminService.getSellerById(id);
      const found = sellerRes?.data?.data || sellerRes?.data || sellerRes?.seller || sellerRes;
      setSeller(found || null);
      try {
        const ordersRes = await adminService.getAllOrders({ sellerId: id, limit: 50 });
        const ol = ordersRes?.data?.data || ordersRes?.data?.orders || ordersRes?.orders || ordersRes?.data || [];
        setOrders(Array.isArray(ol) ? ol : []);
      } catch {
        setOrders([]);
      }
      try {
        const productsRes = await adminService.getAllProducts({ sellerId: id, limit: 50 });
        const pl = productsRes?.data?.data || productsRes?.data?.products || productsRes?.products || productsRes?.data || [];
        setProducts(Array.isArray(pl) ? pl : []);
      } catch {
        setProducts([]);
      }
    } catch (err) {
      toast.error(getSafeErrorMessage(err, "Failed to load seller"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/sellers">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Seller Not Found</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <UserX className="mb-4 h-16 w-16 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Seller not found</p>
            <Link href="/admin/sellers">
              <Button className="mt-4">Back to Sellers</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const ownerName = seller.ownerName || seller.name || seller.user?.name || "Owner";
  const businessName = seller.businessName || seller.shopName || "Store";
  const isVerified = !!seller.isVerified;
  const status = isVerified ? "verified" : seller.isActive === false ? "suspended" : "pending";
  const totalProducts = products.length;
  const totalOrders = orders.length;
  const revenue = orders
    .filter((o) => o.paymentStatus === "PAID" || o.status === "DELIVERED")
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const commission = Number(seller.commission) || 5;
  const commissionEarned = (revenue * commission) / 100;
  const pendingPayout = commissionEarned * 0.3;
  const stats = seller.stats || {};
  const businessType = seller.businessType || "Seller";
  const description = seller.description || "No description available";
  const gstNumber = seller.gstNumber || "";
  const panNumber = seller.panNumber || "";
  const address = seller.address || {};
  const bankDetails = seller.bankDetails || {};
  const topProducts = products.slice(0, 5);
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/sellers">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{businessName}</h1>
          <p className="text-sm text-gray-500">
            Seller since {formatDate(seller.createdAt, "MMM yyyy")}
          </p>
        </div>
        <Badge
          variant={status === "verified" ? "success" : status === "pending" ? "warning" : "destructive"}
          className="ml-auto"
        >
          <ShieldCheck className="mr-1 h-3 w-3" />
          {status === "verified" ? "Verified" : status === "pending" ? "Pending" : "Suspended"}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Products</p>
                    <p className="text-xl font-bold text-gray-900">{totalProducts}</p>
                    <p className="text-xs text-emerald-600">
                      {products.filter((p) => p.isActive).length} active
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                    <ShoppingBag className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Orders</p>
                    <p className="text-xl font-bold text-gray-900">{totalOrders.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Revenue</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(revenue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                    <Star className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Rating</p>
                    <p className="text-xl font-bold text-gray-900">
                      {(Number(stats.avgRating) || Number(seller.rating) || 0).toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(Number(stats.totalReviews) || 0).toLocaleString()} reviews
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {topProducts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5" />
                  Top Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topProducts.map((product: any) => (
                    <div
                      key={product.id || product._id}
                      className="flex items-center gap-4 rounded-lg border p-4"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{product.name || "Product"}</h3>
                        <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                          <span>{(product.sold || product.totalSold || 0)} sold</span>
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {(Number(product.rating) || 0).toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(product.revenue || product.totalRevenue || 0)}
                        </p>
                        <p className="text-xs text-gray-500">revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No orders yet</div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order: any) => {
                    const orderId = order.id || order._id;
                    const orderNumber = order.orderNumber || `ORD-${(orderId || "").toString().slice(-6)}`;
                    const customer = order.user?.firstName
                      ? `${order.user.firstName} ${order.user.lastName || ""}`.trim()
                      : order.user?.name || order.customerName || "Customer";
                    const st = (order.status || order.orderStatus || "PENDING").toString().toUpperCase();
                    const statusInfo = orderStatusConfig[st] || orderStatusConfig.PENDING;
                    return (
                      <div
                        key={orderId}
                        className="flex items-center justify-between rounded-lg border p-4"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{orderNumber}</p>
                          <p className="text-sm text-gray-500">
                            {customer} • {formatDate(order.createdAt, "MMM dd, yyyy")}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(order.total || 0)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Store className="h-5 w-5" />
                Business Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center text-center">
                <UserAvatar name={ownerName} size="xl" />
                <h3 className="mt-3 text-lg font-semibold text-gray-900">{businessName}</h3>
                <p className="text-sm text-gray-500">{ownerName}</p>
                <Badge
                  variant={status === "verified" ? "success" : "warning"}
                  className="mt-2"
                >
                  {status === "verified" ? "Verified" : "Pending"}
                </Badge>
              </div>
              <Separator />
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{seller.email || "—"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{seller.phone || "—"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">
                    Joined {formatDate(seller.createdAt, "MMM dd, yyyy")}
                  </span>
                </div>
              </div>
              <Separator />
              <div className="text-sm">
                <p className="mb-2 font-medium text-gray-900">Business Type</p>
                <p className="text-gray-600">{businessType}</p>
              </div>
              <Separator />
              <div className="text-sm">
                <p className="mb-2 font-medium text-gray-900">About</p>
                <p className="text-gray-600">{description}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-5 w-5" />
                Commission Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Commission Rate</span>
                <span className="font-semibold text-gray-900">{commission}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Commission Earned</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(commissionEarned)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Pending Payout</span>
                <span className="font-semibold text-amber-600">
                  {formatCurrency(pendingPayout)}
                </span>
              </div>
            </CardContent>
          </Card>

          {Object.keys(address).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Business Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>{address.line1 || address.street}</p>
                  {address.line2 && <p>{address.line2}</p>}
                  <p>
                    {address.city}, {address.state} - {address.pincode}
                  </p>
                </div>
                {(gstNumber || panNumber) && (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-2 text-sm">
                      {gstNumber && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">GST Number</span>
                          <span className="font-mono text-gray-900">{gstNumber}</span>
                        </div>
                      )}
                      {panNumber && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">PAN Number</span>
                          <span className="font-mono text-gray-900">{panNumber}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {Object.keys(bankDetails).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bank Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {bankDetails.accountName && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Account Name</span>
                    <span className="text-gray-900">{bankDetails.accountName}</span>
                  </div>
                )}
                {bankDetails.accountNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Account Number</span>
                    <span className="font-mono text-gray-900">
                      {maskAccountNumber(bankDetails.accountNumber)}
                    </span>
                  </div>
                )}
                {bankDetails.ifsc && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">IFSC</span>
                    <span className="font-mono text-gray-900">{bankDetails.ifsc}</span>
                  </div>
                )}
                {bankDetails.bankName && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Bank</span>
                    <span className="text-gray-900">{bankDetails.bankName}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
