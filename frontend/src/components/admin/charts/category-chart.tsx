"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface CategoryData {
  name: string;
  revenue: number;
  orders: number;
}

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ec4899", "#8b5cf6", "#06b6d4"];

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
        <p className="text-sm font-medium text-gray-900">{payload[0].name}</p>
        <p className="text-sm text-gray-600">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

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
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null;

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function CategoryChart({ data }: { data?: CategoryData[] }) {
  const chartData = (data || []).map((d, i) => ({
    name: d.name,
    value: d.revenue,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Sales by Category
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          {chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              No category data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={130}
                  innerRadius={60}
                  dataKey="value"
                  strokeWidth={2}
                  stroke="#ffffff"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-sm text-gray-600">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
