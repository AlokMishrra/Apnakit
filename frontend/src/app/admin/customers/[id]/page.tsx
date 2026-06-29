"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShoppingBag,
  DollarSign,
  Package,
  Activity,
  Clock,
  CheckCircle2,
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
  SHIPPED: { label: "Shipped", variant: "secondary" },
  DELIVERED: { label: "Delivered", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
  RETURNED: { label: "Returned", variant: "outline" },
  REFUNDED: { label: "Refunded", variant: "outline" },
};

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const usersRes = await adminService.getCustomers({ page: 1, limit: 200 });
      const list = usersRes?.data?.data || usersRes?.data?.users || usersRes?.users || usersRes?.data || [];
      const found = (Array.isArray(list) ? list : []).find(
        (u: any) => (u._id || u.id) === id
      );
      setCustomer(found || null);
      try {
        const ordersRes = await adminService.getAllOrders({ userId: id, limit: 50 });
        const ol = ordersRes?.data?.data || ordersRes?.data?.orders || ordersRes?.orders || ordersRes?.data || [];
        setOrders(Array.isArray(ol) ? ol : []);
      } catch {
        setOrders([]);
      }
    } catch (err) {
      toast.error(getSafeErrorMessage(err, "Failed to load customer"));
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

  if (!customer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/customers">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Customer Not Found</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <UserX className="mb-4 h-16 w-16 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Customer not found</p>
            <Link href="/admin/customers">
              <Button className="mt-4">Back to Customers</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const firstName = customer.firstName || customer.name?.split(" ")[0] || "";
  const lastName = customer.lastName || customer.name?.split(" ").slice(1).join(" ") || "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || customer.email || "Customer";
  const isActive = customer.isActive !== false;
  const ordersCount = orders.length;
  const totalSpent = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const lastOrder = orders[0];
  const addresses = Array.isArray(customer.addresses) ? customer.addresses : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/customers">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
          <p className="text-sm text-gray-500">
            Customer since {formatDate(customer.createdAt, "MMM yyyy")}
          </p>
        </div>
        <Badge variant={isActive ? "success" : "destructive"} className="ml-auto">
          {isActive ? "Active" : "Blocked"}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <ShoppingBag className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Orders</p>
                    <p className="text-xl font-bold text-gray-900">{ordersCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Spent</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(totalSpent)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                    <Package className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Avg. Order</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(ordersCount > 0 ? totalSpent / ordersCount : 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                    <Calendar className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Order</p>
                    <p className="text-sm font-bold text-gray-900">
                      {lastOrder ? formatDate(lastOrder.createdAt) : "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order History</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No orders yet</div>
              ) : (
                <div className="space-y-3">
                  {orders.slice(0, 10).map((order: any) => {
                    const orderId = order.id || order._id;
                    const orderNumber = order.orderNumber || `ORD-${(orderId || "").toString().slice(-6)}`;
                    const status = (order.status || order.orderStatus || "PENDING").toString().toUpperCase();
                    const statusInfo = orderStatusConfig[status] || orderStatusConfig.PENDING;
                    return (
                      <Link
                        key={orderId}
                        href={`/admin/orders/${orderId}`}
                        className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-medium text-gray-900">{orderNumber}</p>
                            <p className="text-sm text-gray-500">
                              {formatDate(order.createdAt, "MMM dd, yyyy")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(order.total || 0)}
                          </span>
                        </div>
                      </Link>
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
              <CardTitle className="text-lg">Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center text-center">
                <UserAvatar name={fullName} size="xl" />
                <h3 className="mt-3 text-lg font-semibold text-gray-900">{fullName}</h3>
                <p className="text-sm text-gray-500">{customer.email}</p>
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{customer.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{customer.phone || "—"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">
                    Joined {formatDate(customer.createdAt, "MMM dd, yyyy")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {addresses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5" />
                  Addresses
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {addresses.map((address: any, idx: number) => (
                  <div
                    key={address.id || idx}
                    className={`rounded-lg border p-4 ${
                      address.isDefault ? "border-blue-200 bg-blue-50/50" : "border-gray-100"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {address.type || (address.isDefault ? "Default" : "Address")}
                      </span>
                      {address.isDefault && (
                        <Badge variant="default" className="text-xs">Default</Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 space-y-0.5">
                      <p>{address.line1 || address.street}</p>
                      {address.line2 && <p>{address.line2}</p>}
                      <p>
                        {address.city}, {address.state} - {address.pincode}
                      </p>
                    </div>
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
