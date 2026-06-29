import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../config/database.config';

@Injectable()
export class LoyaltyService {
  private readonly logger = new Logger(LoyaltyService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getPoints(userId: string) {
    const points = await this.prisma.loyaltyPoint.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const totalEarned = points
      .filter((p) => p.type === 'EARNED')
      .reduce((sum, p) => sum + p.points, 0);

    const totalRedeemed = points
      .filter((p) => p.type === 'REDEEMED')
      .reduce((sum, p) => sum + p.points, 0);

    const totalExpired = points
      .filter((p) => p.type === 'EXPIRED')
      .reduce((sum, p) => sum + p.points, 0);

    return {
      totalEarned,
      totalRedeemed,
      totalExpired,
      availablePoints: totalEarned - totalRedeemed - totalExpired,
    };
  }

  async getHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [points, total] = await Promise.all([
      this.prisma.loyaltyPoint.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.loyaltyPoint.count({
        where: { userId },
      }),
    ]);

    return {
      points,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async redeem(userId: string, points: number, reference?: string) {
    if (points <= 0) {
      throw new BadRequestException('Points must be greater than 0');
    }

    const currentPoints = await this.getPoints(userId);
    if (currentPoints.availablePoints < points) {
      throw new BadRequestException('Insufficient loyalty points');
    }

    const redeemed = await this.prisma.loyaltyPoint.create({
      data: {
        userId,
        points,
        type: 'REDEEMED',
        reference: reference || 'Manual redemption',
        description: `Redeemed ${points} loyalty points`,
      },
    });

    this.logger.log(`Points redeemed: ${points} for user ${userId}`);

    return {
      redeemed,
      remainingPoints: currentPoints.availablePoints - points,
    };
  }

  async addPoints(userId: string, points: number, type: 'EARNED' | 'EXPIRED', reference?: string, description?: string) {
    const loyaltyPoint = await this.prisma.loyaltyPoint.create({
      data: {
        userId,
        points,
        type,
        reference,
        description,
        expiresAt: type === 'EARNED' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null,
      },
    });

    this.logger.log(`Points ${type.toLowerCase()}: ${points} for user ${userId}`);
    return loyaltyPoint;
  }
}
