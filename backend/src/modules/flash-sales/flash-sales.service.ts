import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/database.config';
import { CreateFlashSaleDto, UpdateFlashSaleDto } from './dto/flash-sale.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class FlashSalesService {
  private readonly logger = new Logger(FlashSalesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Public listing — only active flash sales within their time window
   * Groups multiple products from the same flash sale (same groupId) together
   */
  async findActive() {
    const now = new Date();
    const sales = await this.prisma.flashSale.findMany({
      where: {
        isActive: true,
        startsAt: { lte: now },
        expiresAt: { gte: now },
      },
      include: {
        product: {
          include: {
            images: { take: 1, orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
            brand: { select: { name: true } },
          },
        },
        variant: true,
      },
      orderBy: { startsAt: 'asc' },
    });

    return this.groupSales(sales);
  }

  /**
   * Admin listing — all flash sales (any status), grouped by groupId
   */
  async findAllAdmin() {
    const sales = await this.prisma.flashSale.findMany({
      include: {
        product: {
          include: {
            images: { take: 1, orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
            brand: { select: { name: true } },
          },
        },
        variant: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return this.groupSales(sales);
  }

  async findOne(id: string) {
    const sale = await this.prisma.flashSale.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            images: { take: 1, orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
            brand: { select: { name: true } },
          },
        },
        variant: true,
      },
    });
    if (!sale) {
      throw new NotFoundException('Flash sale not found');
    }
    // Return grouped format for consistency
    const groupSales = await this.prisma.flashSale.findMany({
      where: { groupId: sale.groupId },
      include: {
        product: {
          include: {
            images: { take: 1, orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
            brand: { select: { name: true } },
          },
        },
        variant: true,
      },
    });
    const grouped = this.groupSales(groupSales);
    return grouped[0] || this.formatSale(sale);
  }

  async create(dto: CreateFlashSaleDto) {
    if (new Date(dto.expiresAt) <= new Date(dto.startsAt)) {
      throw new BadRequestException('expiresAt must be after startsAt');
    }

    const groupId = new Date().toISOString().slice(0, 10) + '-' + Math.random().toString(36).slice(2, 10);

    const productIds = dto.productIds || (dto.productId ? [dto.productId] : []);
    if (productIds.length === 0) {
      throw new BadRequestException('At least one product is required');
    }

    const variantIds = dto.variantIds || (dto.variantId ? [dto.variantId] : []);

    const saleData = productIds.map((pid, index) => {
      const variantId = variantIds[index] || null;
      return {
        groupId,
        productId: pid,
        variantId,
        title: dto.title,
        salePrice: dto.salePrice,
        originalPrice: dto.originalPrice,
        totalStock: dto.totalStock,
        soldCount: 0,
        startsAt: new Date(dto.startsAt),
        expiresAt: new Date(dto.expiresAt),
        isActive: dto.isActive ?? true,
      };
    });

    const results = await this.prisma.flashSale.createMany({
      data: saleData,
    });

    const created = await this.prisma.flashSale.findMany({
      where: { groupId },
      include: {
        product: {
          include: {
            images: { take: 1, orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
            brand: { select: { name: true } },
          },
        },
        variant: true,
      },
    });

    this.logger.log(`Flash sale created: ${results.count} products in group ${groupId}`);
    const grouped = this.groupSales(created);
    return grouped[0];
  }

  async update(id: string, dto: UpdateFlashSaleDto) {
    const existing = await this.prisma.flashSale.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Flash sale not found');
    }

    if (dto.startsAt && dto.expiresAt) {
      if (new Date(dto.expiresAt) <= new Date(dto.startsAt)) {
        throw new BadRequestException('expiresAt must be after startsAt');
      }
    }

    if (dto.salePrice !== undefined || dto.originalPrice !== undefined || dto.totalStock !== undefined) {
      await this.prisma.flashSale.updateMany({
        where: { groupId: existing.groupId },
        data: {
          ...(dto.salePrice !== undefined ? { salePrice: dto.salePrice } : {}),
          ...(dto.originalPrice !== undefined ? { originalPrice: dto.originalPrice } : {}),
          ...(dto.totalStock !== undefined ? { totalStock: dto.totalStock } : {}),
        },
      });
    }

    const updateData: any = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.startsAt) updateData.startsAt = new Date(dto.startsAt);
    if (dto.expiresAt) updateData.expiresAt = new Date(dto.expiresAt);
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    if (Object.keys(updateData).length > 0) {
      await this.prisma.flashSale.updateMany({
        where: { groupId: existing.groupId },
        data: updateData,
      });
    }

    const updated = await this.prisma.flashSale.findMany({
      where: { groupId: existing.groupId },
      include: {
        product: {
          include: {
            images: { take: 1, orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
            brand: { select: { name: true } },
          },
        },
        variant: true,
      },
    });

    this.logger.log(`Flash sale updated: group ${existing.groupId}`);
    const grouped = this.groupSales(updated);
    return grouped[0];
  }

  async remove(id: string) {
    const existing = await this.prisma.flashSale.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Flash sale not found');
    }

    await this.prisma.flashSale.deleteMany({
      where: { groupId: existing.groupId },
    });

    this.logger.log(`Flash sale deleted: group ${existing.groupId}`);
    return { message: 'Flash sale deleted successfully' };
  }

  async incrementSold(id: string, qty: number) {
    const sale = await this.prisma.flashSale.findUnique({ where: { id } });
    if (!sale) throw new NotFoundException('Flash sale not found');
    if (sale.soldCount + qty > sale.totalStock) {
      throw new BadRequestException('Not enough stock for this flash sale');
    }
    return this.prisma.flashSale.update({
      where: { id },
      data: { soldCount: { increment: qty } },
    });
  }

  private groupSales(sales: any[]) {
    const grouped = new Map<string, any[]>();
    for (const sale of sales) {
      const key = sale.groupId;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(sale);
    }

    return Array.from(grouped.values()).map((groupSales) => {
      const first = groupSales[0];
      const products = groupSales.map((s) => this.formatProduct(s));

      const totalStock = groupSales.reduce((sum, s) => sum + s.totalStock, 0);
      const totalSold = groupSales.reduce((sum, s) => sum + s.soldCount, 0);

      return {
        id: first.id,
        groupId: first.groupId,
        title: first.title || products[0]?.name || 'Flash Sale',
        salePrice: Number(first.salePrice),
        originalPrice: Number(first.originalPrice),
        discount: Number(first.originalPrice) > 0
          ? Math.round(((Number(first.originalPrice) - Number(first.salePrice)) / Number(first.originalPrice)) * 100)
          : 0,
        totalStock,
        soldCount: totalSold,
        stockLeft: Math.max(0, totalStock - totalSold),
        soldPercent: totalStock > 0 ? Math.round((totalSold / totalStock) * 100) : 0,
        startsAt: first.startsAt,
        expiresAt: first.expiresAt,
        isActive: first.isActive,
        products,
        createdAt: first.createdAt,
        updatedAt: first.updatedAt,
      };
    });
  }

  private formatSale(sale: any) {
    const product = sale.product || {};
    const productImage = product.images?.[0]?.url || product.images?.[0] || '';
    return {
      id: sale.id,
      groupId: sale.groupId,
      productId: sale.productId,
      variantId: sale.variantId,
      title: sale.title || product.name,
      salePrice: Number(sale.salePrice),
      originalPrice: Number(sale.originalPrice),
      discount: Number(sale.originalPrice) > 0
        ? Math.round(((Number(sale.originalPrice) - Number(sale.salePrice)) / Number(sale.originalPrice)) * 100)
        : 0,
      totalStock: sale.totalStock,
      soldCount: sale.soldCount,
      stockLeft: Math.max(0, sale.totalStock - sale.soldCount),
      soldPercent: sale.totalStock > 0 ? Math.round((sale.soldCount / sale.totalStock) * 100) : 0,
      startsAt: sale.startsAt,
      expiresAt: sale.expiresAt,
      isActive: sale.isActive,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        image: productImage,
        brand: product.brand?.name || null,
        variant: sale.variant
          ? {
              id: sale.variant.id,
              name: sale.variant.name,
              sku: sale.variant.sku,
            }
          : null,
      },
      products: [{
        id: product.id,
        name: product.name,
        slug: product.slug,
        image: productImage,
        brand: product.brand?.name || null,
      }],
      createdAt: sale.createdAt,
      updatedAt: sale.updatedAt,
    };
  }

  private formatProduct(sale: any) {
    const product = sale.product || {};
    const productImage = product.images?.[0]?.url || product.images?.[0] || '';
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      image: productImage,
      brand: product.brand?.name || null,
      variant: sale.variantId ? {
        id: sale.variant?.id,
        name: sale.variant?.name,
        sku: sale.variant?.sku,
      } : null,
      salePrice: Number(sale.salePrice),
      originalPrice: Number(sale.originalPrice),
      stockLeft: Math.max(0, sale.totalStock - sale.soldCount),
    };
  }
}
