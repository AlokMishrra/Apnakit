"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const customerData = [
  { month: "Jan", customers: 1200, newCustomers: 320 },
  { month: "Feb", customers: 1380, newCustomers: 280 },
  { month: "Mar", customers: 1520, newCustomers: 340 },
  { month: "Apr", customers: 1710, newCustomers: 390 },
  { month: "May", customers: 1890, newCustomers: 420 },
  { month: "Jun", customers: 2050, newCustomers: 380 },
  { month: "Jul", customers: 2240, newCustomers: 450 },
  { month: "Aug", customers: 2410, newCustomers: 410 },
  { month: "Sep", customers: 2580, newCustomers: 430 },
  { month: "Oct", customers: 2790, newCustomers: 480 },
  { month: "Nov", customers: 3010, newCustomers: 520 },
  { month: "Dec", customers: 3250, newCustomers: 560 },
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
            {entry.name === "customers" ? "Total" : "New"}:{" "}
            {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function CustomerGrowthChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Customer Growth</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={customerData}
              margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
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
              <Area
                type="monotone"
                dataKey="customers"
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCustomers)"
              />
              <Area
                type="monotone"
                dataKey="newCustomers"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorNew)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
