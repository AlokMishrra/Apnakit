import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  image: string;
  sold: number;
  revenue: number;
}

const topProducts: Product[] = [
  {
    id: "1",
    name: "iPhone 15 Pro Max 256GB",
    image: "/products/iphone-15.jpg",
    sold: 234,
    revenue: 35076666,
  },
  {
    id: "2",
    name: "Samsung Galaxy S24 Ultra",
    image: "/products/galaxy-s24.jpg",
    sold: 189,
    revenue: 18881100,
  },
  {
    id: "3",
    name: "Sony WH-1000XM5 Headphones",
    image: "/products/sony-headphones.jpg",
    sold: 156,
    revenue: 4678440,
  },
  {
    id: "4",
    name: "MacBook Air M3 15-inch",
    image: "/products/macbook-air.jpg",
    sold: 98,
    revenue: 15670200,
  },
  {
    id: "5",
    name: "Nike Air Max 270 React",
    image: "/products/nike-shoes.jpg",
    sold: 278,
    revenue: 3613400,
  },
];

export function TopSellingProducts() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">
          Top Selling Products
        </CardTitle>
        <a
          href="/admin/products"
          className="text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
        >
          View All
        </a>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topProducts.map((product, index) => (
            <div
              key={product.id}
              className="flex items-center gap-4 rounded-lg p-2 transition-colors hover:bg-gray-50"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500">
                {index + 1}
              </span>
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-xs text-gray-400">
                  IMG
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {product.name}
                </p>
                <p className="text-xs text-gray-500">
                  {product.sold} units sold
                </p>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {formatCurrency(product.revenue)}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
