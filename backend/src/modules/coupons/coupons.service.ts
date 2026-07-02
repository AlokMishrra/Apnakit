import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../config/database.config';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { Prisma, CouponType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CouponsService {
  private readonly logger = new Logger(CouponsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async validate(dto: ValidateCouponDto) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: dto.code.toUpperCase() },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    if (!coupon.isActive) {
      throw new BadRequestException('Coupon is not active');
    }

    const now = new Date();
    if (now < coupon.startsAt) {
      throw new BadRequestException('Coupon is not yet valid');
    }

    if (now > coupon.expiresAt) {
      throw new BadRequestException('Coupon has expired');
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('Coupon usage limit reached');
    }

    if (dto.userId) {
      const existingUsage = await this.prisma.couponUsage.findUnique({
        where: {
          couponId_userId: {
            couponId: coupon.id,
            userId: dto.userId,
          },
        },
      });
      if (existingUsage) {
        throw new BadRequestException('You have already used this coupon');
      }
    }

    if (coupon.minimumOrder && dto.cartTotal < Number(coupon.minimumOrder)) {
      throw new BadRequestException(
        `Minimum order amount of ₹${coupon.minimumOrder} required`,
      );
    }

    if (coupon.applicableCategories && dto.categoryIds?.length) {
      const applicableCategories = coupon.applicableCategories as string[];
      const hasApplicable = dto.categoryIds.some((id) =>
        applicableCategories.includes(id),
      );
      if (!hasApplicable) {
        throw new BadRequestException(
          'Coupon is not applicable to items in your cart',
        );
      }
    }

    if (coupon.applicableBrands && dto.brandIds?.length) {
      const applicableBrands = coupon.applicableBrands as string[];
      const hasApplicable = dto.brandIds.some((id) =>
        applicableBrands.includes(id),
      );
      if (!hasApplicable) {
        throw new BadRequestException(
          'Coupon is not applicable to items in your cart',
        );
      }
    }

    let discount = 0;
    if (coupon.type === CouponType.PERCENTAGE) {
      discount = (dto.cartTotal * Number(coupon.value)) / 100;
      if (coupon.maximumDiscount) {
        discount = Math.min(discount, Number(coupon.maximumDiscount));
      }
    } else if (coupon.type === CouponType.FIXED) {
      discount = Math.min(Number(coupon.value), dto.cartTotal);
    } else if (coupon.type === CouponType.FREE_SHIPPING) {
      discount = 49;
    }

    return {
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discount,
      description: coupon.description,
      minimumOrder: coupon.minimumOrder,
      maximumDiscount: coupon.maximumDiscount,
    };
  }

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [coupons, total] = await Promise.all([
      this.prisma.coupon.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.coupon.count(),
    ]);

    return {
      coupons,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return coupon;
  }

  async create(dto: CreateCouponDto) {
    const existing = await this.prisma.coupon.findUnique({
      where: { code: dto.code.toUpperCase() },
    });

    if (existing) {
      throw new ConflictException('Coupon code already exists');
    }

    if (new Date(dto.expiresAt) <= new Date(dto.startsAt)) {
      throw new BadRequestException('Expiry date must be after start date');
    }

    const coupon = await this.prisma.coupon.create({
      data: {
        code: dto.code.toUpperCase(),
        description: dto.description,
        type: dto.type,
        value: dto.value,
        minimumOrder: dto.minimumOrder,
        maximumDiscount: dto.maximumDiscount,
        usageLimit: dto.usageLimit,
        startsAt: new Date(dto.startsAt),
        expiresAt: new Date(dto.expiresAt),
        isActive: dto.isActive ?? true,
        applicableCategories: dto.applicableCategories || Prisma.JsonNull,
        applicableBrands: dto.applicableBrands || Prisma.JsonNull,
      },
    });

    // Notify all active users about new coupon
    try {
      const users = await this.prisma.user.findMany({
        where: { isActive: true, role: 'CUSTOMER' },
        select: { id: true },
        take: 1000,
      });
      const discountText = coupon.type === 'PERCENTAGE'
        ? `${coupon.value}% off`
        : `₹${coupon.value} off`;
      for (const user of users) {
        await this.notificationsService.create(
          user.id,
          'New Coupon Available! 🎟️',
          `Use code ${coupon.code} to get ${discountText} on your next order.`,
          'COUPON',
          { link: '/', couponId: coupon.id, code: coupon.code },
        );
      }
      this.logger.log(`Notified ${users.length} users about new coupon ${coupon.code}`);
    } catch (e) {
      this.logger.warn('Failed to notify users about new coupon', e as any);
    }

    return coupon;
  }

  async update(id: string, dto: Partial<CreateCouponDto>) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    if (dto.code && dto.code.toUpperCase() !== coupon.code) {
      const existing = await this.prisma.coupon.findUnique({
        where: { code: dto.code.toUpperCase() },
      });
      if (existing) {
        throw new ConflictException('Coupon code already exists');
      }
    }

    const updated = await this.prisma.coupon.update({
      where: { id },
      data: {
        ...(dto.code && { code: dto.code.toUpperCase() }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.type && { type: dto.type }),
        ...(dto.value !== undefined && { value: dto.value }),
        ...(dto.minimumOrder !== undefined && { minimumOrder: dto.minimumOrder }),
        ...(dto.maximumDiscount !== undefined && {
          maximumDiscount: dto.maximumDiscount,
        }),
        ...(dto.usageLimit !== undefined && { usageLimit: dto.usageLimit }),
        ...(dto.startsAt && { startsAt: new Date(dto.startsAt) }),
        ...(dto.expiresAt && { expiresAt: new Date(dto.expiresAt) }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.applicableCategories && {
          applicableCategories: dto.applicableCategories,
        }),
        ...(dto.applicableBrands && {
          applicableBrands: dto.applicableBrands,
        }),
      },
    });

    return updated;
  }

  async remove(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    await this.prisma.coupon.delete({ where: { id } });

    return { message: 'Coupon deleted successfully' };
  }
}
