"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OrderStatusData {
  status: string;
  count: number;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  CONFIRMED: "#3b82f6",
  PROCESSING: "#6366f1",
  SHIPPED: "#8b5cf6",
  DELIVERED: "#10b981",
  CANCELLED: "#ef4444",
  RETURNED: "#f97316",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; payload: OrderStatusData }>;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
        <p className="mb-2 text-sm font-medium text-gray-900">
          {STATUS_LABELS[payload[0].payload.status] || payload[0].payload.status}
        </p>
        <p className="text-sm text-gray-600">Orders: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export function OrdersChart({ data }: { data?: OrderStatusData[] }) {
  const chartData = (data || []).map((d) => ({
    ...d,
    label: STATUS_LABELS[d.status] || d.status,
    fill: STATUS_COLORS[d.status] || "#6366f1",
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Orders by Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          {chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              No order data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="count"
                  radius={[6, 6, 0, 0]}
                  barSize={40}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
