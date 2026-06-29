import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Order {
  id: string;
  customer: string;
  items: number;
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  date: string;
}

const recentOrders: Order[] = [
  {
    id: "ORD-7X2K9M",
    customer: "Priya Sharma",
    items: 3,
    total: 2499,
    status: "delivered",
    date: "2026-06-20T10:30:00Z",
  },
  {
    id: "ORD-8Y3L0N",
    customer: "Rahul Verma",
    items: 1,
    total: 15999,
    status: "shipped",
    date: "2026-06-20T09:15:00Z",
  },
  {
    id: "ORD-9Z4M1P",
    customer: "Anita Patel",
    items: 5,
    total: 4599,
    status: "processing",
    date: "2026-06-19T16:45:00Z",
  },
  {
    id: "ORD-0A5N2Q",
    customer: "Vikram Singh",
    items: 2,
    total: 8999,
    status: "pending",
    date: "2026-06-19T14:20:00Z",
  },
  {
    id: "ORD-1B6O3R",
    customer: "Neha Gupta",
    items: 4,
    total: 3299,
    status: "cancelled",
    date: "2026-06-19T11:00:00Z",
  },
  {
    id: "ORD-2C7P4S",
    customer: "Amit Kumar",
    items: 1,
    total: 24999,
    status: "delivered",
    date: "2026-06-18T15:30:00Z",
  },
  {
    id: "ORD-3D8Q5T",
    customer: "Sunita Reddy",
    items: 2,
    total: 1899,
    status: "shipped",
    date: "2026-06-18T13:00:00Z",
  },
];

const statusStyles: Record<Order["status"], string> = {
  pending:
    "bg-amber-100 text-amber-700 hover:bg-amber-100 hover:text-amber-700",
  processing:
    "bg-blue-100 text-blue-700 hover:bg-blue-100 hover:text-blue-700",
  shipped:
    "bg-purple-100 text-purple-700 hover:bg-purple-100 hover:text-purple-700",
  delivered:
    "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-700",
  cancelled: "bg-red-100 text-red-700 hover:bg-red-100 hover:text-red-700",
};

export function RecentOrdersTable() {
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
              {recentOrders.map((order) => (
                <tr
                  key={order.id}
                  className="transition-colors hover:bg-gray-50/50"
                >
                  <td className="py-3.5 text-sm font-medium text-gray-900">
                    {order.id}
                  </td>
                  <td className="py-3.5 text-sm text-gray-600">
                    {order.customer}
                  </td>
                  <td className="py-3.5 text-sm text-gray-600">
                    {order.items} {order.items === 1 ? "item" : "items"}
                  </td>
                  <td className="py-3.5 text-sm font-medium text-gray-900">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="py-3.5">
                    <Badge
                      variant="outline"
                      className={statusStyles[order.status]}
                    >
                      {order.status.charAt(0).toUpperCase() +
                        order.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="py-3.5 text-sm text-gray-500">
                    {formatDate(order.date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
