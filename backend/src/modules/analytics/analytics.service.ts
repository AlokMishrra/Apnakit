import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../config/database.config';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { subDays } from 'date-fns';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(query: AnalyticsQueryDto) {
    const now = new Date();
    let startDate: Date;
    let previousStartDate: Date;

    if (query.startDate && query.endDate) {
      startDate = new Date(query.startDate);
      previousStartDate = subDays(startDate, 30);
    } else {
      const range = query.dateRange || '30 days';
      switch (range) {
        case 'Today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          previousStartDate = subDays(startDate, 1);
          break;
        case '7 days':
          startDate = subDays(now, 7);
          previousStartDate = subDays(now, 14);
          break;
        case '90 days':
          startDate = subDays(now, 90);
          previousStartDate = subDays(now, 180);
          break;
        case '30 days':
        default:
          startDate = subDays(now, 30);
          previousStartDate = subDays(now, 60);
          break;
      }
    }

    // Batch 1: simple counts and aggregates (lightweight)
    const [
      totalRevenue,
      previousRevenue,
      totalOrders,
      previousOrders,
      totalCustomers,
      previousCustomers,
      totalProducts,
    ] = await Promise.all([
      this.safe(this.prisma.order.aggregate({
        where: { createdAt: { gte: startDate }, paymentStatus: 'PAID' },
        _sum: { total: true },
        _count: true,
      }), { _sum: { total: null }, _count: 0 }),

      this.safe(this.prisma.order.aggregate({
        where: { createdAt: { gte: previousStartDate, lt: startDate }, paymentStatus: 'PAID' },
        _sum: { total: true },
      }), { _sum: { total: null } }),

      this.safe(this.prisma.order.count({
        where: { createdAt: { gte: startDate } },
      }), 0),

      this.safe(this.prisma.order.count({
        where: { createdAt: { gte: previousStartDate, lt: startDate } },
      }), 0),

      this.safe(this.prisma.user.count({
        where: { role: 'CUSTOMER', createdAt: { gte: startDate } },
      }), 0),

      this.safe(this.prisma.user.count({
        where: { role: 'CUSTOMER', createdAt: { gte: previousStartDate, lt: startDate } },
      }), 0),

      this.safe(this.prisma.product.count({ where: { isActive: true } }), 0),
    ]);

    // Batch 2: heavier queries (findMany with includes)
    const [
      recentOrders,
      topProducts,
      ordersByStatus,
    ] = await Promise.all([
      this.safe(this.prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  images: { take: 1, select: { url: true } },
                },
              },
            },
          },
        },
      }), []),

      this.safe(this.prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: { createdAt: { gte: startDate }, paymentStatus: 'PAID' },
        },
        _sum: { quantity: true, total: true },
        _count: true,
        orderBy: { _sum: { total: 'desc' } },
        take: 10,
      }), []),

      this.safe(this.prisma.order.groupBy({
        by: ['status'],
        where: { createdAt: { gte: startDate } },
        _count: true,
      }), []),
    ]);

    // Batch 3: derived data (revenue by day, top categories, customer growth)
    const [revenueByDay, topCategories, customerGrowth] = await Promise.all([
      this.safe(this.getOrderRevenueByDay(startDate, now), []),
      this.safe(this.getTopCategories(startDate), []),
      this.safe(this.getCustomerGrowth(previousStartDate, now), []),
    ]);

    // Batch 4: resolve product names
    const productIds = topProducts.map((p) => p.productId);
    const products = productIds.length
      ? await this.prisma.product.findMany({
          where: { id: { in: productIds } },
          select: {
            id: true,
            name: true,
            images: { take: 1, select: { url: true } },
          },
        })
      : [];
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Compute changes
    const revenueChange = previousRevenue._sum.total
      ? ((Number(totalRevenue._sum.total) - Number(previousRevenue._sum.total)) /
          Number(previousRevenue._sum.total)) *
        100
      : 0;

    const ordersChange = previousOrders
      ? ((totalOrders - previousOrders) / previousOrders) * 100
      : 0;

    const customersChange = previousCustomers
      ? ((totalCustomers - previousCustomers) / previousCustomers) * 100
      : 0;

    return {
      overview: {
        totalRevenue: Number(totalRevenue._sum.total || 0),
        revenueChange: Math.round(revenueChange * 100) / 100,
        totalOrders,
        ordersChange: Math.round(ordersChange * 100) / 100,
        totalCustomers,
        customersChange: Math.round(customersChange * 100) / 100,
        totalProducts,
        averageOrderValue: totalOrders
          ? Number(totalRevenue._sum.total || 0) / totalOrders
          : 0,
      },
      recentOrders,
      topProducts: topProducts.map((item) => {
        const p = productMap.get(item.productId);
        return {
          id: item.productId,
          name: p?.name || 'Unknown Product',
          image: p?.images?.[0]?.url || null,
          sold: item._sum.quantity,
          revenue: Number(item._sum.total),
          orderCount: item._count,
        };
      }),
      revenueByDay,
      ordersByStatus: ordersByStatus.map((item) => ({
        status: item.status,
        count: item._count,
      })),
      topCategories,
      customerGrowth,
    };
  }

  async getSellerAnalytics(sellerId: string, query: AnalyticsQueryDto) {
    const now = new Date();
    const startDate = subDays(now, 30);

    const seller = await this.prisma.seller.findUnique({
      where: { id: sellerId },
    });

    if (!seller) {
      return null;
    }

    const [
      totalRevenue,
      totalOrders,
      recentOrders,
      topProducts,
      revenueByDay,
      ordersByStatus,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        where: {
          sellerId,
          createdAt: { gte: startDate },
          paymentStatus: 'PAID',
        },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.order.count({
        where: { sellerId, createdAt: { gte: startDate } },
      }),
      this.prisma.order.findMany({
        where: { sellerId },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          items: { include: { product: { select: { name: true } } } },
        },
      }),
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            sellerId,
            createdAt: { gte: startDate },
            paymentStatus: 'PAID',
          },
        },
        _sum: { quantity: true, total: true },
        _count: true,
        orderBy: { _sum: { total: 'desc' } },
        take: 10,
      }),
      this.getOrderRevenueByDay(startDate, now, sellerId),
      this.prisma.order.groupBy({
        by: ['status'],
        where: { sellerId, createdAt: { gte: startDate } },
        _count: true,
      }),
    ]);

    return {
      overview: {
        totalRevenue: Number(totalRevenue._sum.total || 0),
        totalOrders,
        averageOrderValue: totalOrders
          ? Number(totalRevenue._sum.total || 0) / totalOrders
          : 0,
      },
      recentOrders,
      topProducts: topProducts.map((item) => ({
        productId: item.productId,
        totalSold: item._sum.quantity,
        totalRevenue: Number(item._sum.total),
        orderCount: item._count,
      })),
      revenueByDay,
      ordersByStatus: ordersByStatus.map((item) => ({
        status: item.status,
        count: item._count,
      })),
    };
  }

  private async safe<T>(p: Promise<T>, fallback: T): Promise<T> {
    try {
      return await p;
    } catch (err: any) {
      this.logger.warn(`Query failed: ${err?.message}`);
      return fallback;
    }
  }

  private async getOrderRevenueByDay(startDate: Date, endDate: Date, sellerId?: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        paymentStatus: 'PAID',
        ...(sellerId ? { sellerId } : {}),
      },
      select: { createdAt: true, total: true },
    });

    const revenueByDay: Record<string, number> = {};
    orders.forEach((order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      revenueByDay[date] = (revenueByDay[date] || 0) + Number(order.total);
    });

    return Object.entries(revenueByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date, revenue }));
  }

  private async getTopCategories(startDate: Date) {
    const items = await this.prisma.orderItem.findMany({
      where: {
        order: { createdAt: { gte: startDate }, paymentStatus: 'PAID' },
      },
      include: {
        product: {
          include: { category: { select: { id: true, name: true } } },
        },
      },
    });

    const categoryMap: Record<string, { name: string; revenue: number; orders: number }> = {};

    items.forEach((item) => {
      const catId = item.product.categoryId || 'unknown';
      const catName = item.product.category?.name || 'Uncategorized';
      if (!categoryMap[catId]) {
        categoryMap[catId] = { name: catName, revenue: 0, orders: 0 };
      }
      categoryMap[catId].revenue += Number(item.total);
      categoryMap[catId].orders += 1;
    });

    return Object.values(categoryMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }

  private async getCustomerGrowth(startDate: Date, endDate: Date) {
    const customers = await this.prisma.user.findMany({
      where: {
        role: 'CUSTOMER',
        createdAt: { gte: startDate, lte: endDate },
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const allCustomerCount = await this.prisma.user.count({
      where: { role: 'CUSTOMER' },
    });

    const monthlyData: Record<string, { total: number; new: number }> = {};

    for (let i = 5; i >= 0; i--) {
      const d = subDays(endDate, i * 30);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[key] = { total: 0, new: 0 };
    }

    customers.forEach((c) => {
      const d = c.createdAt;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[key]) {
        monthlyData[key] = { total: 0, new: 0 };
      }
      monthlyData[key].new += 1;
    });

    const monthKeys = Object.keys(monthlyData).sort();
    let cumulative = allCustomerCount - customers.length;
    monthKeys.forEach((key) => {
      cumulative += monthlyData[key].new;
      monthlyData[key].total = cumulative;
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return monthKeys.map((key) => {
      const [, month] = key.split('-');
      return {
        month: monthNames[parseInt(month, 10) - 1] || key,
        customers: monthlyData[key].total,
        newCustomers: monthlyData[key].new,
      };
    });
  }
}
