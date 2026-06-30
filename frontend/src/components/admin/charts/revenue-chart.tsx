"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface RevenueDataPoint {
  date: string;
  revenue: number;
}

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
            Revenue: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function RevenueChart({ data }: { data?: RevenueDataPoint[] }) {
  const chartData = (data || []).map((d) => ({
    ...d,
    label: (() => {
      try {
        const date = new Date(d.date + "T00:00:00");
        return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      } catch {
        return d.date;
      }
    })(),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Revenue Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          {chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              No revenue data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
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
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ fill: "#6366f1", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
