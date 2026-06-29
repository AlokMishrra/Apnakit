import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../config/database.config';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import {
  getPaginationParams,
  paginatedResponse,
  PaginatedResult,
} from '../../common/helpers/pagination.helper';
import { Prisma } from '@prisma/client';

@Injectable()
export class WarehouseService {
  private readonly logger = new Logger(WarehouseService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateWarehouseDto) {
    if (dto.code) {
      const existing = await this.prisma.warehouse.findFirst({
        where: { code: dto.code },
      });
      if (existing) {
        throw new ConflictException(`Warehouse with code "${dto.code}" already exists`);
      }
    }

    const warehouse = await this.prisma.warehouse.create({
      data: {
        name: dto.name,
        code: dto.code,
        phone: dto.phone,
        email: dto.email,
        capacity: dto.capacity,
        isActive: dto.isActive ?? true,
        address: dto.address
          ? {
              create: {
                street: dto.address.street,
                city: dto.address.city,
                state: dto.address.state,
                pincode: dto.address.pincode,
                country: dto.address.country || 'India',
              },
            }
          : undefined,
      },
      include: {
        address: true,
        _count: {
          select: { inventory: true },
        },
      },
    });

    this.logger.log(`Warehouse created: ${warehouse.id}`);
    return warehouse;
  }

  async findAll(query: { page?: number; limit?: number; search?: string; isActive?: boolean }) {
    const { page, limit, skip } = getPaginationParams(query);

    const where: Prisma.WarehouseWhereInput = {};

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [warehouses, total] = await Promise.all([
      this.prisma.warehouse.findMany({
        where,
        include: {
          address: true,
          _count: {
            select: { inventory: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.warehouse.count({ where }),
    ]);

    return paginatedResponse(warehouses, total, page, limit);
  }

  async findOne(id: string) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
      include: {
        address: true,
        inventory: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
            variant: {
              select: { id: true, name: true, sku: true },
            },
          },
          orderBy: { updatedAt: 'desc' },
        },
        _count: {
          select: { inventory: true },
        },
      },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    return warehouse;
  }

  async getWarehouseInventory(
    id: string,
    query: { page?: number; limit?: number; lowStock?: boolean },
  ) {
    const warehouse = await this.prisma.warehouse.findUnique({ where: { id } });
    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    const { page, limit, skip } = getPaginationParams(query);

    const where: Prisma.InventoryWhereInput = { warehouseId: id };

    if (query.lowStock) {
      where.quantity = { lte: this.prisma.raw('reorderLevel') };
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
        },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.inventory.count({ where }),
    ]);

    return paginatedResponse(items, total, page, limit);
  }

  async update(id: string, dto: UpdateWarehouseDto) {
    const warehouse = await this.prisma.warehouse.findUnique({ where: { id } });
    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    if (dto.code && dto.code !== warehouse.code) {
      const existing = await this.prisma.warehouse.findFirst({
        where: { code: dto.code, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException(`Warehouse with code "${dto.code}" already exists`);
      }
    }

    const { address, ...data } = dto;

    const updated = await this.prisma.warehouse.update({
      where: { id },
      data: {
        ...data,
        ...(address && {
          address: {
            upsert: {
              create: {
                street: address.street,
                city: address.city,
                state: address.state,
                pincode: address.pincode,
                country: address.country || 'India',
              },
              update: {
                ...(address.street && { street: address.street }),
                ...(address.city && { city: address.city }),
                ...(address.state && { state: address.state }),
                ...(address.pincode && { pincode: address.pincode }),
                ...(address.country && { country: address.country }),
              },
            },
          },
        }),
      },
      include: {
        address: true,
        _count: {
          select: { inventory: true },
        },
      },
    });

    this.logger.log(`Warehouse updated: ${id}`);
    return updated;
  }

  async remove(id: string) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
      include: {
        _count: {
          select: { inventory: true },
        },
      },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    if (warehouse._count.inventory > 0) {
      throw new ConflictException(
        'Cannot delete warehouse with existing inventory. Transfer stock first.',
      );
    }

    await this.prisma.warehouse.delete({ where: { id } });
    this.logger.log(`Warehouse deleted: ${id}`);
    return { message: 'Warehouse deleted successfully' };
  }
}
