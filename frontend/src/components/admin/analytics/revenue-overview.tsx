"use client";

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const revenueData = [
  { month: "Jan", revenue: 4200000, lastYear: 3800000, orders: 1820 },
  { month: "Feb", revenue: 3900000, lastYear: 3500000, orders: 1654 },
  { month: "Mar", revenue: 5100000, lastYear: 4200000, orders: 2103 },
  { month: "Apr", revenue: 4700000, lastYear: 3900000, orders: 1945 },
  { month: "May", revenue: 5800000, lastYear: 4600000, orders: 2387 },
  { month: "Jun", revenue: 6200000, lastYear: 5100000, orders: 2543 },
  { month: "Jul", revenue: 5900000, lastYear: 4800000, orders: 2421 },
  { month: "Aug", revenue: 6800000, lastYear: 5400000, orders: 2789 },
  { month: "Sep", revenue: 7200000, lastYear: 5900000, orders: 2956 },
  { month: "Oct", revenue: 8100000, lastYear: 6200000, orders: 3234 },
  { month: "Nov", revenue: 9500000, lastYear: 7800000, orders: 3812 },
  { month: "Dec", revenue: 10200000, lastYear: 8500000, orders: 4123 },
];

const formatCurrency = (value: number) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
  return `₹${value}`;
};

interface RevenueOverviewProps {
  dateRange?: string;
}

export function RevenueOverview({ dateRange = "30days" }: RevenueOverviewProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="lastYearGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#94a3b8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={formatCurrency}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), ""]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="This Year"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  fill="url(#revenueGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="lastYear"
                  name="Last Year"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="url(#lastYearGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Daily Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={[
                  { day: "Mon", revenue: 342000 },
                  { day: "Tue", revenue: 287000 },
                  { day: "Wed", revenue: 415000 },
                  { day: "Thu", revenue: 378000 },
                  { day: "Fri", revenue: 523000 },
                  { day: "Sat", revenue: 612000 },
                  { day: "Sun", revenue: 489000 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={formatCurrency}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#7c3aed"
                  strokeWidth={3}
                  dot={{ fill: "#7c3aed", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
