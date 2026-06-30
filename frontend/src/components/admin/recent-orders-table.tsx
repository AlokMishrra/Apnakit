import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

interface OrderItem {
  id: string;
  orderNumber?: string;
  status: string;
  total: number;
  createdAt: string;
  user?: { firstName?: string; lastName?: string; email?: string };
  items?: Array<{ quantity: number; product?: { name?: string } }>;
}

const statusStyles: Record<string, string> = {
  PENDING:
    "bg-amber-100 text-amber-700 hover:bg-amber-100 hover:text-amber-700",
  CONFIRMED:
    "bg-blue-100 text-blue-700 hover:bg-blue-100 hover:text-blue-700",
  PROCESSING:
    "bg-blue-100 text-blue-700 hover:bg-blue-100 hover:text-blue-700",
  SHIPPED:
    "bg-purple-100 text-purple-700 hover:bg-purple-100 hover:text-purple-700",
  DELIVERED:
    "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700 hover:bg-red-100 hover:text-red-700",
  RETURNED: "bg-orange-100 text-orange-700 hover:bg-orange-100 hover:text-orange-700",
};

function formatStatus(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function RecentOrdersTable({ data }: { data?: OrderItem[] }) {
  const orders = data || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
        <a
          href="/admin/orders"
          className="text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
        >
          View All
        </a>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          {orders.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-gray-400">
              No orders yet
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Order ID
                  </th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Customer
                  </th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Items
                  </th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Total
                  </th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order) => {
                  const customerName = order.user
                    ? [order.user.firstName, order.user.lastName].filter(Boolean).join(" ") || order.user.email
                    : "Unknown";
                  const itemCount = order.items?.length || 0;
                  return (
                    <tr
                      key={order.id}
                      className="transition-colors hover:bg-gray-50/50"
                    >
                      <td className="py-3.5 text-sm font-medium text-gray-900">
                        {order.orderNumber || order.id.slice(0, 8)}
                      </td>
                      <td className="py-3.5 text-sm text-gray-600">
                        {customerName}
                      </td>
                      <td className="py-3.5 text-sm text-gray-600">
                        {itemCount} {itemCount === 1 ? "item" : "items"}
                      </td>
                      <td className="py-3.5 text-sm font-medium text-gray-900">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="py-3.5">
                        <Badge
                          variant="outline"
                          className={statusStyles[order.status] || ""}
                        >
                          {formatStatus(order.status)}
                        </Badge>
                      </td>
                      <td className="py-3.5 text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
