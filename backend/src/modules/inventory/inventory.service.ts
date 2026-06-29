import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../config/database.config';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { AdjustStockDto, AdjustmentType } from './dto/adjust-stock.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';
import {
  getPaginationParams,
  paginatedResponse,
} from '../../common/helpers/pagination.helper';
import { Prisma } from '@prisma/client';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    warehouseId?: string;
    search?: string;
  }) {
    const { page, limit, skip } = getPaginationParams(query);

    const where: Prisma.InventoryWhereInput = {};

    if (query.warehouseId) {
      where.warehouseId = query.warehouseId;
    }

    if (query.search) {
      where.OR = [
        {
          product: {
            name: { contains: query.search, mode: 'insensitive' },
          },
        },
        {
          product: {
            sku: { contains: query.search, mode: 'insensitive' },
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.inventory.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              sku: true,
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
          variant: {
            select: { id: true, name: true, sku: true },
          },
          warehouse: {
            select: { id: true, name: true, code: true },
          },
        },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.inventory.count({ where }),
    ]);

    return paginatedResponse(items, total, page, limit);
  }

  async findByProduct(productId: string) {
    const items = await this.prisma.inventory.findMany({
      where: { productId },
      include: {
        product: {
          select: { id: true, name: true, slug: true, sku: true },
        },
        variant: {
          select: { id: true, name: true, sku: true },
        },
        warehouse: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalReserved = items.reduce((sum, item) => sum + item.reserved, 0);

    return {
      items,
      summary: {
        totalQuantity,
        totalReserved,
        availableQuantity: totalQuantity - totalReserved,
        warehouseCount: items.length,
      },
    };
  }

  async updateStock(id: string, dto: UpdateInventoryDto) {
    const inventory = await this.prisma.inventory.findUnique({
      where: { id },
      include: { product: true, warehouse: true },
    });

    if (!inventory) {
      throw new NotFoundException('Inventory record not found');
    }

    const updated = await this.prisma.inventory.update({
      where: { id },
      data: {
        quantity: dto.quantity,
        ...(dto.reason && {
          adjustmentHistory: {
            create: {
              type: 'MANUAL',
              quantity: dto.quantity - inventory.quantity,
              reason: dto.reason,
            },
          },
        }),
      },
      include: {
        product: { select: { id: true, name: true } },
        warehouse: { select: { id: true, name: true } },
      },
    });

    this.logger.log(
      `Inventory updated for ${inventory.product.name} at ${inventory.warehouse.name}: ${inventory.quantity} -> ${dto.quantity}`,
    );

    return updated;
  }

  async adjustStock(dto: AdjustStockDto) {
    const where: Prisma.InventoryWhereInput = {
      productId: dto.productId,
      warehouseId: dto.warehouseId,
      ...(dto.variantId && { variantId: dto.variantId }),
    };

    let inventory = await this.prisma.inventory.findFirst({ where });

    if (!inventory) {
      if (dto.type === AdjustmentType.SET) {
        inventory = await this.prisma.inventory.create({
          data: {
            productId: dto.productId,
            variantId: dto.variantId || null,
            warehouseId: dto.warehouseId,
            quantity: dto.quantity,
            reserved: 0,
          },
        });
      } else {
        throw new NotFoundException('Inventory record not found');
      }
    } else {
      let newQuantity: number;

      switch (dto.type) {
        case AdjustmentType.ADD:
          newQuantity = inventory.quantity + dto.quantity;
          break;
        case AdjustmentType.SUBTRACT:
          newQuantity = inventory.quantity - dto.quantity;
          if (newQuantity < 0) {
            throw new BadRequestException(
              `Insufficient stock. Current: ${inventory.quantity}, Requested: ${dto.quantity}`,
            );
          }
          break;
        case AdjustmentType.SET:
          newQuantity = dto.quantity;
          break;
      }

      inventory = await this.prisma.inventory.update({
        where: { id: inventory.id },
        data: {
          quantity: newQuantity,
          adjustmentHistory: {
            create: {
              type: dto.type,
              quantity: dto.quantity,
              reason: dto.reason,
              notes: dto.notes,
            },
          },
        },
      });
    }

    this.logger.log(
      `Stock adjusted: ${dto.type} ${dto.quantity} for product ${dto.productId} at warehouse ${dto.warehouseId}`,
    );

    return inventory;
  }

  async transferStock(dto: TransferStockDto) {
    if (dto.fromWarehouseId === dto.toWarehouseId) {
      throw new BadRequestException('Source and destination warehouses must be different');
    }

    const [fromWarehouse, toWarehouse] = await Promise.all([
      this.prisma.warehouse.findUnique({ where: { id: dto.fromWarehouseId } }),
      this.prisma.warehouse.findUnique({ where: { id: dto.toWarehouseId } }),
    ]);

    if (!fromWarehouse) {
      throw new NotFoundException('Source warehouse not found');
    }
    if (!toWarehouse) {
      throw new NotFoundException('Destination warehouse not found');
    }

    const sourceWhere: Prisma.InventoryWhereInput = {
      productId: dto.productId,
      warehouseId: dto.fromWarehouseId,
      ...(dto.variantId && { variantId: dto.variantId }),
    };

    const sourceInventory = await this.prisma.inventory.findFirst({
      where: sourceWhere,
    });

    if (!sourceInventory) {
      throw new NotFoundException('Source inventory record not found');
    }

    if (sourceInventory.quantity - sourceInventory.reserved < dto.quantity) {
      throw new BadRequestException(
        `Insufficient available stock at ${fromWarehouse.name}. Available: ${sourceInventory.quantity - sourceInventory.reserved}, Requested: ${dto.quantity}`,
      );
    }

    const destWhere: Prisma.InventoryWhereInput = {
      productId: dto.productId,
      warehouseId: dto.toWarehouseId,
      ...(dto.variantId && { variantId: dto.variantId }),
    };

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedSource = await tx.inventory.update({
        where: { id: sourceInventory.id },
        data: {
          quantity: { decrement: dto.quantity },
          adjustmentHistory: {
            create: {
              type: 'TRANSFER_OUT',
              quantity: dto.quantity,
              reason: `Transfer to ${toWarehouse.name}`,
              notes: dto.notes,
            },
          },
        },
      });

      let destInventory = await tx.inventory.findFirst({ where: destWhere });

      if (destInventory) {
        destInventory = await tx.inventory.update({
          where: { id: destInventory.id },
          data: {
            quantity: { increment: dto.quantity },
            adjustmentHistory: {
              create: {
                type: 'TRANSFER_IN',
                quantity: dto.quantity,
                reason: `Transfer from ${fromWarehouse.name}`,
                notes: dto.notes,
              },
            },
          },
        });
      } else {
        destInventory = await tx.inventory.create({
          data: {
            productId: dto.productId,
            variantId: dto.variantId || null,
            warehouseId: dto.toWarehouseId,
            quantity: dto.quantity,
            reserved: 0,
          },
        });
      }

      return { source: updatedSource, destination: destInventory };
    });

    this.logger.log(
      `Stock transferred: ${dto.quantity} units of product ${dto.productId} from ${fromWarehouse.name} to ${toWarehouse.name}`,
    );

    return result;
  }

  async checkAvailability(
    productId: string,
    variantId: string | null,
    quantity: number,
    warehouseId?: string,
  ): Promise<{ available: boolean; totalAvailable: number }> {
    const where: Prisma.InventoryWhereInput = {
      productId,
      ...(variantId && { variantId }),
      ...(warehouseId && { warehouseId }),
    };

    const items = await this.prisma.inventory.findMany({ where });
    const totalAvailable = items.reduce(
      (sum, item) => sum + item.quantity - item.reserved,
      0,
    );

    return {
      available: totalAvailable >= quantity,
      totalAvailable,
    };
  }

  async reserveStock(
    productId: string,
    variantId: string | null,
    quantity: number,
    orderId: string,
    warehouseId?: string,
  ) {
    const where: Prisma.InventoryWhereInput = {
      productId,
      ...(variantId && { variantId }),
    };

    const items = await this.prisma.inventory.findMany({
      where,
      orderBy: warehouseId
        ? [{ warehouseId: warehouseId }, { quantity: 'desc' }]
        : [{ quantity: 'desc' }],
    });

    const totalAvailable = items.reduce(
      (sum, item) => sum + item.quantity - item.reserved,
      0,
    );

    if (totalAvailable < quantity) {
      throw new BadRequestException(
        `Insufficient stock for product ${productId}. Available: ${totalAvailable}, Requested: ${quantity}`,
      );
    }

    let remaining = quantity;
    const reserved: string[] = [];

    for (const item of items) {
      if (remaining <= 0) break;

      const available = item.quantity - item.reserved;
      const toReserve = Math.min(available, remaining);

      if (toReserve > 0) {
        await this.prisma.inventory.update({
          where: { id: item.id },
          data: {
            reserved: { increment: toReserve },
            adjustmentHistory: {
              create: {
                type: 'RESERVE',
                quantity: toReserve,
                reason: `Reserved for order ${orderId}`,
              },
            },
          },
        });

        remaining -= toReserve;
        reserved.push(item.id);
      }
    }

    this.logger.log(`Reserved ${quantity} units for order ${orderId}`);
    return { reserved, quantity };
  }

  async releaseStock(
    productId: string,
    variantId: string | null,
    quantity: number,
    orderId: string,
  ) {
    const where: Prisma.InventoryWhereInput = {
      productId,
      ...(variantId && { variantId }),
      reserved: { gt: 0 },
    };

    const items = await this.prisma.inventory.findMany({ where });

    let remaining = quantity;

    for (const item of items) {
      if (remaining <= 0) break;

      const toRelease = Math.min(item.reserved, remaining);

      if (toRelease > 0) {
        await this.prisma.inventory.update({
          where: { id: item.id },
          data: {
            reserved: { decrement: toRelease },
            adjustmentHistory: {
              create: {
                type: 'RELEASE',
                quantity: toRelease,
                reason: `Released for order ${orderId}`,
              },
            },
          },
        });

        remaining -= toRelease;
      }
    }

    this.logger.log(`Released ${quantity} units for order ${orderId}`);
    return { released: quantity };
  }

  async deductStock(
    productId: string,
    variantId: string | null,
    quantity: number,
    orderId: string,
  ) {
    const where: Prisma.InventoryWhereInput = {
      productId,
      ...(variantId && { variantId }),
    };

    const items = await this.prisma.inventory.findMany({ where });

    let remaining = quantity;

    for (const item of items) {
      if (remaining <= 0) break;

      const toDeduct = Math.min(item.quantity - item.reserved, remaining);

      if (toDeduct > 0) {
        await this.prisma.inventory.update({
          where: { id: item.id },
          data: {
            quantity: { decrement: toDeduct },
            reserved: { decrement: Math.min(item.reserved, toDeduct) },
            adjustmentHistory: {
              create: {
                type: 'DEDUCT',
                quantity: toDeduct,
                reason: `Deducted for delivered order ${orderId}`,
              },
            },
          },
        });

        remaining -= toDeduct;
      }
    }

    this.logger.log(`Deducted ${quantity} units for order ${orderId}`);
    return { deducted: quantity };
  }

  async restoreStock(
    productId: string,
    variantId: string | null,
    quantity: number,
    orderId: string,
    warehouseId?: string,
  ) {
    const where: Prisma.InventoryWhereInput = {
      productId,
      ...(variantId && { variantId }),
      ...(warehouseId && { warehouseId }),
    };

    const inventory = await this.prisma.inventory.findFirst({ where });

    if (!inventory) {
      throw new NotFoundException('Inventory record not found');
    }

    const updated = await this.prisma.inventory.update({
      where: { id: inventory.id },
      data: {
        quantity: { increment: quantity },
        adjustmentHistory: {
          create: {
            type: 'RESTORE',
            quantity,
            reason: `Restored from returned order ${orderId}`,
          },
        },
      },
    });

    this.logger.log(`Restored ${quantity} units for order ${orderId}`);
    return updated;
  }

  async getLowStockItems(threshold?: number) {
    const lowStockThreshold = threshold || 10;

    const items = await this.prisma.inventory.findMany({
      where: {
        quantity: { lte: lowStockThreshold },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            sku: true,
            images: { where: { isPrimary: true }, take: 1 },
          },
        },
        variant: {
          select: { id: true, name: true, sku: true },
        },
        warehouse: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { quantity: 'asc' },
    });

    const outOfStock = items.filter((item) => item.quantity === 0);
    const lowStock = items.filter((item) => item.quantity > 0);

    return {
      summary: {
        totalLowStock: items.length,
        outOfStock: outOfStock.length,
        lowStock: lowStock.length,
      },
      outOfStock,
      lowStock,
    };
  }

  async getStockAdjustmentHistory(
    productId: string,
    query: { page?: number; limit?: number },
  ) {
    const { page, limit, skip } = getPaginationParams(query);

    const where = { productId };

    const [items, total] = await Promise.all([
      this.prisma.stockAdjustment.findMany({
        where,
        include: {
          inventory: {
            include: {
              warehouse: { select: { id: true, name: true } },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.stockAdjustment.count({ where }),
    ]);

    return paginatedResponse(items, total, page, limit);
  }
}
