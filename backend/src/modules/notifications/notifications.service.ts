import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../config/database.config';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, page: number | string = 1, limit: number | string = 20) {
    const pageNum = Number(page) || 1;
    const limitNum = Math.min(Number(limit) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      this.prisma.notification.count({
        where: { userId },
      }),
      this.prisma.notification.count({
        where: { userId, status: 'PENDING' },
      }),
    ]);

    return {
      notifications,
      unreadCount,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { status: 'SENT' },
    });

    return updated;
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, status: 'PENDING' },
      data: { status: 'SENT' },
    });

    this.logger.log(`All notifications marked as read for user ${userId}`);

    return {
      message: 'All notifications marked as read',
      count: result.count,
    };
  }

  async create(userId: string, title: string, message: string, type: string, metadata?: any) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type: type as any,
        metadata,
      },
    });

    this.logger.log(`Notification created: ${notification.id}`);
    return notification;
  }
}
