import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface TopProduct {
  id: string;
  name: string;
  image?: string | null;
  sold: number;
  revenue: number;
}

export function TopSellingProducts({ data }: { data?: TopProduct[] }) {
  const products = data || [];

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
        {products.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-gray-400">
            No product data yet
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product, index) => (
              <div
                key={product.id}
                className="flex items-center gap-4 rounded-lg p-2 transition-colors hover:bg-gray-50"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500">
                  {index + 1}
                </span>
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-xs text-gray-400">
                      IMG
                    </div>
                  )}
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
        )}
      </CardContent>
    </Card>
  );
}
