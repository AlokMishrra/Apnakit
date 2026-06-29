import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/database.config';
import { CreateFlashSaleDto, UpdateFlashSaleDto } from './dto/flash-sale.dto';

@Injectable()
export class FlashSalesService {
  private readonly logger = new Logger(FlashSalesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Public listing — only active flash sales within their time window
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

    return sales.map((s) => this.formatSale(s));
  }

  /**
   * Admin listing — all flash sales (any status)
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
    return sales.map((s) => this.formatSale(s));
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
    return this.formatSale(sale);
  }

  async create(dto: CreateFlashSaleDto) {
    // Validate product exists
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new BadRequestException('Product not found');
    }

    // Validate dates
    if (new Date(dto.expiresAt) <= new Date(dto.startsAt)) {
      throw new BadRequestException('expiresAt must be after startsAt');
    }

    if (dto.variantId) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: dto.variantId },
      });
      if (!variant || variant.productId !== dto.productId) {
        throw new BadRequestException('Variant not found for this product');
      }
    }

    const sale = await this.prisma.flashSale.create({
      data: {
        productId: dto.productId,
        variantId: dto.variantId,
        title: dto.title,
        salePrice: dto.salePrice,
        originalPrice: dto.originalPrice,
        totalStock: dto.totalStock,
        soldCount: 0,
        startsAt: new Date(dto.startsAt),
        expiresAt: new Date(dto.expiresAt),
        isActive: dto.isActive ?? true,
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
    });
    this.logger.log(`Flash sale created: ${sale.id} for product ${dto.productId}`);
    return this.formatSale(sale);
  }

  async update(id: string, dto: UpdateFlashSaleDto) {
    await this.findOne(id);

    if (dto.startsAt && dto.expiresAt) {
      if (new Date(dto.expiresAt) <= new Date(dto.startsAt)) {
        throw new BadRequestException('expiresAt must be after startsAt');
      }
    }

    const updateData: any = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.salePrice !== undefined) updateData.salePrice = dto.salePrice;
    if (dto.originalPrice !== undefined) updateData.originalPrice = dto.originalPrice;
    if (dto.totalStock !== undefined) updateData.totalStock = dto.totalStock;
    if (dto.startsAt) updateData.startsAt = new Date(dto.startsAt);
    if (dto.expiresAt) updateData.expiresAt = new Date(dto.expiresAt);
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    const sale = await this.prisma.flashSale.update({
      where: { id },
      data: updateData,
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
    this.logger.log(`Flash sale updated: ${id}`);
    return this.formatSale(sale);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.flashSale.delete({ where: { id } });
    this.logger.log(`Flash sale deleted: ${id}`);
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

  private formatSale(sale: any) {
    const product = sale.product || {};
    const productImage = product.images?.[0]?.url || product.images?.[0] || '';
    return {
      id: sale.id,
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
      createdAt: sale.createdAt,
      updatedAt: sale.updatedAt,
    };
  }
}
