import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../config/database.config';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly prisma: PrismaService) {}

  async search(query: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const searchTerm = query.trim();

    if (!searchTerm) {
      return { products: [], categories: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { tags: { contains: searchTerm, mode: 'insensitive' } },
            { sku: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          variants: {
            where: { isActive: true },
            orderBy: { price: 'asc' },
            take: 1,
          },
          brand: { select: { id: true, name: true, slug: true } },
          category: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.product.count({
        where: {
          isActive: true,
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { tags: { contains: searchTerm, mode: 'insensitive' } },
            { sku: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
      }),
    ]);

    const categories = await this.prisma.category.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      take: 5,
    });

    await this.logSearchQuery(searchTerm, total, null);

    return {
      products,
      categories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSuggestions(query: string) {
    const searchTerm = query.trim();
    if (!searchTerm) return { suggestions: [] };

    const [products, categories] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          isActive: true,
          name: { contains: searchTerm, mode: 'insensitive' },
        },
        select: { id: true, name: true, slug: true },
        take: 5,
      }),
      this.prisma.category.findMany({
        where: {
          isActive: true,
          name: { contains: searchTerm, mode: 'insensitive' },
        },
        select: { id: true, name: true, slug: true },
        take: 3,
      }),
    ]);

    return {
      suggestions: [
        ...categories.map((c) => ({ type: 'category', ...c })),
        ...products.map((p) => ({ type: 'product', ...p })),
      ],
    };
  }

  async getPopularSearches() {
    const popular = await this.prisma.searchQuery.groupBy({
      by: ['query'],
      _count: { query: true },
      orderBy: { _count: { query: 'desc' } },
      take: 10,
    });

    return {
      popular: popular.map((item) => ({
        query: item.query,
        count: item._count.query,
      })),
    };
  }

  private async logSearchQuery(query: string, resultsCount: number, userId: string | null) {
    try {
      await this.prisma.searchQuery.create({
        data: {
          userId,
          query,
          resultsCount,
        },
      });
    } catch (error) {
      this.logger.error('Failed to log search query', error);
    }
  }
}
