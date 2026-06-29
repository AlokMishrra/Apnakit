"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const topProducts = [
  {
    rank: 1,
    name: "Sony WH-1000XM5",
    category: "Electronics",
    revenue: 1245000,
    units: 89,
    trend: 12.5,
  },
  {
    rank: 2,
    name: "Samsung Galaxy S24 Ultra",
    category: "Smartphones",
    revenue: 987000,
    units: 45,
    trend: 8.3,
  },
  {
    rank: 3,
    name: "Nike Air Max 270",
    category: "Footwear",
    revenue: 756000,
    units: 234,
    trend: -2.1,
  },
  {
    rank: 4,
    name: "Apple MacBook Air M3",
    category: "Laptops",
    revenue: 698000,
    units: 12,
    trend: 15.7,
  },
  {
    rank: 5,
    name: "Levi's 511 Slim Fit Jeans",
    category: "Fashion",
    revenue: 534000,
    units: 567,
    trend: 5.2,
  },
  {
    rank: 6,
    name: "Kindle Paperwhite",
    category: "Electronics",
    revenue: 423000,
    units: 78,
    trend: 3.8,
  },
  {
    rank: 7,
    name: "Prestige Pressure Cooker",
    category: "Kitchen",
    revenue: 389000,
    units: 312,
    trend: -1.4,
  },
  {
    rank: 8,
    name: "Boat Rockerz 450",
    category: "Electronics",
    revenue: 345000,
    units: 456,
    trend: 7.9,
  },
];

const formatCurrency = (value: number) => {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
  return `₹${value}`;
};

const maxRevenue = Math.max(...topProducts.map((p) => p.revenue));

export function TopProducts() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Top Products by Revenue</CardTitle>
          <Badge variant="secondary" className="text-xs">
            This Month
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topProducts.map((product) => (
            <div key={product.rank} className="group">
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-xs font-bold text-violet-600">
                    {product.rank}
                  </span>
                  <div>
                    <p className="text-sm font-medium leading-none group-hover:text-violet-600 transition-colors">
                      {product.name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{product.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(product.revenue)}</p>
                  <p className="text-xs text-muted-foreground">{product.units} units</p>
                </div>
              </div>
              <div className="ml-10 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all duration-500"
                  style={{ width: `${(product.revenue / maxRevenue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
