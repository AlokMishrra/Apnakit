import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../config/database.config';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { subDays, subMonths, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(query: AnalyticsQueryDto) {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const sixtyDaysAgo = subDays(now, 60);

    const [
      totalRevenue,
      previousRevenue,
      totalOrders,
      previousOrders,
      totalCustomers,
      previousCustomers,
      totalProducts,
      recentOrders,
      topProducts,
      revenueByDay,
      ordersByStatus,
      topCategories,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          paymentStatus: 'PAID',
        },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.order.aggregate({
        where: {
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
          paymentStatus: 'PAID',
        },
        _sum: { total: true },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      }),
      this.prisma.user.count({
        where: {
          role: 'CUSTOMER',
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      this.prisma.user.count({
        where: {
          role: 'CUSTOMER',
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        },
      }),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.order.findMany({
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
            createdAt: { gte: thirtyDaysAgo },
            paymentStatus: 'PAID',
          },
        },
        _sum: { quantity: true, total: true },
        _count: true,
        orderBy: { _sum: { total: 'desc' } },
        take: 10,
      }),
      this.getOrderRevenueByDay(thirtyDaysAgo, now),
      this.prisma.order.groupBy({
        by: ['status'],
        where: { createdAt: { gte: thirtyDaysAgo } },
        _count: true,
      }),
      this.getTopCategories(thirtyDaysAgo),
    ]);

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
      topCategories,
    };
  }

  async getSellerAnalytics(sellerId: string, query: AnalyticsQueryDto) {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);

    const seller = await this.prisma.seller.findUnique({
      where: { id: sellerId },
      include: { dashboard: true },
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
          createdAt: { gte: thirtyDaysAgo },
          paymentStatus: 'PAID',
        },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.order.count({
        where: { sellerId, createdAt: { gte: thirtyDaysAgo } },
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
            createdAt: { gte: thirtyDaysAgo },
            paymentStatus: 'PAID',
          },
        },
        _sum: { quantity: true, total: true },
        _count: true,
        orderBy: { _sum: { total: 'desc' } },
        take: 10,
      }),
      this.getOrderRevenueByDay(thirtyDaysAgo, now, sellerId),
      this.prisma.order.groupBy({
        by: ['status'],
        where: { sellerId, createdAt: { gte: thirtyDaysAgo } },
        _count: true,
      }),
    ]);

    return {
      dashboard: seller.dashboard,
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

    return Object.entries(revenueByDay).map(([date, revenue]) => ({
      date,
      revenue,
    }));
  }

  private async getTopCategories(startDate: Date) {
    const items = await this.prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: { gte: startDate },
          paymentStatus: 'PAID',
        },
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
      .slice(0, 5);
  }
}
