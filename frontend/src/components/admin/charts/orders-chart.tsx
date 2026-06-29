"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ordersData = [
  { day: "Mon", orders: 45, returns: 3 },
  { day: "Tue", orders: 52, returns: 5 },
  { day: "Wed", orders: 49, returns: 2 },
  { day: "Thu", orders: 63, returns: 4 },
  { day: "Fri", orders: 58, returns: 6 },
  { day: "Sat", orders: 72, returns: 3 },
  { day: "Sun", orders: 68, returns: 4 },
];

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
        <p className="mb-2 text-sm font-medium text-gray-900">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm text-gray-600">
            {entry.name === "orders" ? "Orders" : "Returns"}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function OrdersChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Orders (Last 7 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={ordersData}
              margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="day"
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
                dataKey="orders"
                fill="#6366f1"
                radius={[6, 6, 0, 0]}
                barSize={28}
              />
              <Bar
                dataKey="returns"
                fill="#f87171"
                radius={[6, 6, 0, 0]}
                barSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
