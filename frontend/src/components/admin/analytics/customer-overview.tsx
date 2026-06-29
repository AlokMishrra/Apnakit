"use client";

import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const customerGrowthData = [
  { month: "Jan", newCustomers: 1240, returningCustomers: 3420 },
  { month: "Feb", newCustomers: 1180, returningCustomers: 3580 },
  { month: "Mar", newCustomers: 1560, returningCustomers: 3890 },
  { month: "Apr", newCustomers: 1420, returningCustomers: 4120 },
  { month: "May", newCustomers: 1780, returningCustomers: 4450 },
  { month: "Jun", newCustomers: 1920, returningCustomers: 4780 },
  { month: "Jul", newCustomers: 1850, returningCustomers: 5010 },
  { month: "Aug", newCustomers: 2100, returningCustomers: 5340 },
  { month: "Sep", newCustomers: 2280, returningCustomers: 5670 },
  { month: "Oct", newCustomers: 2450, returningCustomers: 6120 },
  { month: "Nov", newCustomers: 2890, returningCustomers: 6890 },
  { month: "Dec", newCustomers: 3120, returningCustomers: 7450 },
];

const trafficSourcesData = [
  { name: "Organic Search", value: 38, color: "#7c3aed" },
  { name: "Direct", value: 24, color: "#3b82f6" },
  { name: "Social Media", value: 18, color: "#10b981" },
  { name: "Referral", value: 12, color: "#f59e0b" },
  { name: "Email", value: 8, color: "#ef4444" },
];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function CustomerOverview() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Customer Growth</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={customerGrowthData}>
                <defs>
                  <linearGradient id="newCustGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="returningGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
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
                <Legend />
                <Area
                  type="monotone"
                  dataKey="newCustomers"
                  name="New Customers"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#newCustGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="returningCustomers"
                  name="Returning Customers"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#returningGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Traffic Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={trafficSourcesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={110}
                  innerRadius={50}
                  dataKey="value"
                  strokeWidth={2}
                  stroke="#ffffff"
                >
                  {trafficSourcesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value}%`, "Share"]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  }}
                />
                <Legend
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  formatter={(value) => (
                    <span className="text-sm text-muted-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
