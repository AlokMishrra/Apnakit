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
  { day: "Mon", orders: 142, cancelled: 8 },
  { day: "Tue", orders: 118, cancelled: 5 },
  { day: "Wed", orders: 176, cancelled: 12 },
  { day: "Thu", orders: 158, cancelled: 7 },
  { day: "Fri", orders: 213, cancelled: 15 },
  { day: "Sat", orders: 267, cancelled: 18 },
  { day: "Sun", orders: 198, cancelled: 11 },
];

const hourlyData = [
  { hour: "6AM", orders: 12 },
  { hour: "8AM", orders: 34 },
  { hour: "10AM", orders: 67 },
  { hour: "12PM", orders: 89 },
  { hour: "2PM", orders: 78 },
  { hour: "4PM", orders: 95 },
  { hour: "6PM", orders: 112 },
  { hour: "8PM", orders: 134 },
  { hour: "10PM", orders: 87 },
  { hour: "12AM", orders: 23 },
];

export function OrderOverview() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Orders by Day</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  }}
                />
                <Bar
                  dataKey="orders"
                  name="Total Orders"
                  fill="#7c3aed"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="cancelled"
                  name="Cancelled"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Peak Hours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  }}
                />
                <Bar
                  dataKey="orders"
                  name="Orders"
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
