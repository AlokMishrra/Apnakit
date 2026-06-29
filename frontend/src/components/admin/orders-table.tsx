"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Eye,
  Clock,
  CheckCircle2,
  Package,
  Truck,
  XCircle,
  RotateCcw,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  CONFIRMED: "bg-blue-100 text-blue-800 border-blue-200",
  PROCESSING: "bg-indigo-100 text-indigo-800 border-indigo-200",
  SHIPPED: "bg-purple-100 text-purple-800 border-purple-200",
  DELIVERED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
  RETURNED: "bg-gray-100 text-gray-800 border-gray-200",
  FAILED: "bg-red-100 text-red-800 border-red-200",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
  FAILED: "Failed",
};

interface OrdersTableProps {
  orders: any[];
}

export function OrdersTable({ orders }: OrdersTableProps) {
  if (!orders || orders.length === 0) {
    return (
      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="flex h-32 items-center justify-center text-sm text-gray-500">
          No orders found
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50/50">
              <th className="px-4 py-3 text-left font-medium text-gray-600">Order #</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Customer</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Items</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Total</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Payment</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((order: any) => {
              const id = order.id || order._id;
              const status = order.status || "PENDING";
              const paymentStatus = order.paymentStatus || "PENDING";
              const customerName = order.customerName ||
                (order.user ? `${order.user.firstName || ""} ${order.user.lastName || ""}`.trim() : "Unknown");
              const customerEmail = order.customerEmail || order.user?.email || "";
              const itemsCount = order.itemsCount || order.items?.length || 0;
              const total = Number(order.total || 0);
              const style = statusStyles[status] || "bg-gray-100 text-gray-800";
              const label = statusLabels[status] || status;

              return (
                <tr key={id} className="transition-colors hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {order.orderNumber || `#${id?.slice(-6)}`}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{customerName}</p>
                      <p className="text-xs text-gray-500">{customerEmail}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {itemsCount} {itemsCount === 1 ? "item" : "items"}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {formatCurrency(total)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={paymentStatus === "COMPLETED" || paymentStatus === "paid" ? "success" : paymentStatus === "FAILED" || paymentStatus === "failed" ? "destructive" : "secondary"}>
                      {paymentStatus}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={style}>{label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {formatDate(order.createdAt)}
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
                          <Link
                            href={`/admin/orders/${id}`}
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
