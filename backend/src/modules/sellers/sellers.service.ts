import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../config/database.config';
import { UpdateSellerDto } from './dto/update-seller.dto';
import { VerifySellerDto } from './dto/verify-seller.dto';
import { CreateSellerDto } from './dto/create-seller.dto';
import {
  getPaginationParams,
  paginatedResponse,
} from '../../common/helpers/pagination.helper';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SellersService {
  private readonly logger = new Logger(SellersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    isVerified?: boolean;
    isActive?: boolean;
  }) {
    const { page, limit, skip } = getPaginationParams(query);

    const where: Prisma.SellerWhereInput = {};

    if (query.isVerified !== undefined) {
      where.isVerified = query.isVerified;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.search) {
      where.OR = [
        { businessName: { contains: query.search, mode: 'insensitive' } },
        { user: { email: { contains: query.search, mode: 'insensitive' } } },
        { user: { phone: { contains: query.search } } },
      ];
    }

    const [sellers, total] = await Promise.all([
      this.prisma.seller.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              products: true,
              orders: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.seller.count({ where }),
    ]);

    return paginatedResponse(sellers, total, page, limit);
  }

  async create(dto: CreateSellerDto) {
    if (dto.user.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: dto.user.email },
      });
      if (existingEmail) {
        throw new ConflictException('Email already registered');
      }
    }

    if (dto.user.phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone: dto.user.phone },
      });
      if (existingPhone) {
        throw new ConflictException('Phone number already registered');
      }
    }

    const hashedPassword = await bcrypt.hash(dto.user.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.user.email,
        phone: dto.user.phone,
        password: hashedPassword,
        firstName: dto.user.firstName,
        lastName: dto.user.lastName || '',
        role: 'SELLER',
        isVerified: true,
        isActive: true,
      },
    });

    const seller = await this.prisma.seller.create({
      data: {
        userId: user.id,
        businessName: dto.businessName,
        businessType: (dto.businessType as any) || 'INDIVIDUAL',
        gstNumber: dto.gstNumber,
        panNumber: dto.panNumber,
        commission: dto.commission ?? 0,
        isVerified: true,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    this.logger.log(`Seller created: ${seller.id} for user: ${user.id}`);
    return seller;
  }

  async findOne(id: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        products: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: { where: { isPrimary: true }, take: 1 },
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            products: true,
            orders: true,
          },
        },
      },
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    return seller;
  }

  async verifySeller(id: string, dto: VerifySellerDto) {
    const seller = await this.prisma.seller.findUnique({ where: { id } });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    const updated = await this.prisma.seller.update({
      where: { id },
      data: {
        isVerified: dto.isVerified,
      },
    });

    this.logger.log(
      `Seller ${id} verification status: ${dto.isVerified ? 'verified' : 'unverified'}`,
    );

    return updated;
  }

  async updateStatus(id: string, isActive: boolean) {
    const seller = await this.prisma.seller.findUnique({ where: { id } });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    if (!isActive && seller.isActive) {
      const hasActiveProducts = await this.prisma.product.count({
        where: {
          sellerId: id,
          isActive: true,
        },
      });

      if (hasActiveProducts > 0) {
        throw new BadRequestException(
          'Cannot deactivate seller with active products. Deactivate products first.',
        );
      }
    }

    const updated = await this.prisma.seller.update({
      where: { id },
      data: {
        isActive,
      },
    });

    this.logger.log(`Seller ${id} status: ${isActive ? 'activated' : 'deactivated'}`);

    return updated;
  }

  async getDashboardStats(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (user?.role === 'ADMIN') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [totalSellers, activeSellers, verifiedSellers, monthSellers] = await Promise.all([
        this.prisma.seller.count(),
        this.prisma.seller.count({ where: { isActive: true } }),
        this.prisma.seller.count({ where: { isVerified: true } }),
        this.prisma.seller.count({ where: { createdAt: { gte: startOfMonth } } }),
      ]);

      return {
        stats: {
          totalSellers,
          activeSellers,
          verifiedSellers,
          monthSellers,
        },
      };
    }

    let seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) {
      seller = await this.prisma.seller.findUnique({ where: { id: userId } });
    }

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    const sellerId = seller.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalProducts,
      activeProducts,
      totalOrders,
      monthOrders,
      todayOrders,
      totalRevenue,
      monthRevenue,
      pendingOrders,
      totalReviews,
      avgRating,
    ] = await Promise.all([
      this.prisma.product.count({ where: { sellerId } }),
      this.prisma.product.count({ where: { sellerId, isActive: true } }),
      this.prisma.order.count({ where: { sellerId } }),
      this.prisma.order.count({
        where: {
          sellerId,
          createdAt: { gte: startOfMonth },
        },
      }),
      this.prisma.order.count({
        where: {
          sellerId,
          createdAt: { gte: startOfDay },
        },
      }),
      this.prisma.order.aggregate({
        where: { sellerId, status: 'DELIVERED' },
        _sum: { total: true },
      }),
      this.prisma.order.aggregate({
        where: {
          sellerId,
          status: 'DELIVERED',
          createdAt: { gte: startOfMonth },
        },
        _sum: { total: true },
      }),
      this.prisma.order.count({
        where: {
          sellerId,
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      }),
      this.prisma.review.count({
        where: {
          product: { sellerId },
          isApproved: true,
        },
      }),
      this.prisma.review.aggregate({
        where: {
          product: { sellerId },
          isApproved: true,
        },
        _avg: { rating: true },
      }),
    ]);

    return {
      seller: {
        id: seller.id,
        businessName: seller.businessName,
        isVerified: seller.isVerified,
        commission: seller.commission,
      },
      stats: {
        totalProducts,
        activeProducts,
        totalOrders,
        monthOrders,
        todayOrders,
        totalRevenue: Number(totalRevenue._sum.total || 0),
        monthRevenue: Number(monthRevenue._sum.total || 0),
        pendingOrders,
        totalReviews,
        averageRating: Number(avgRating._avg.rating || 0),
      },
    };
  }

  async updateCommission(id: string, commissionRate: number) {
    if (commissionRate < 0 || commissionRate > 100) {
      throw new BadRequestException('Commission rate must be between 0 and 100');
    }

    const seller = await this.prisma.seller.findUnique({ where: { id } });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    const updated = await this.prisma.seller.update({
      where: { id },
      data: { commission: commissionRate },
    });

    this.logger.log(
      `Seller ${id} commission rate updated: ${seller.commission}% -> ${commissionRate}%`,
    );

    return updated;
  }

  async update(id: string, dto: UpdateSellerDto) {
    const seller = await this.prisma.seller.findUnique({ where: { id } });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    const updated = await this.prisma.seller.update({
      where: { id },
      data: {
        ...dto,
        commission: dto.commissionRate
          ? Number(dto.commissionRate)
          : undefined,
      },
    });

    this.logger.log(`Seller ${id} updated`);

    return updated;
  }
}
