import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../config/database.config';
import { DeliveryStatus } from './dto/update-delivery-status.dto';
import { AssignDeliveryDto } from './dto/assign-delivery.dto';
import { CreateDeliveryPartnerDto } from './dto/create-delivery.dto';
import {
  getPaginationParams,
  paginatedResponse,
} from '../../common/helpers/pagination.helper';
import { Prisma, OrderStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const PRISMA_DELIVERY_STATUS_MAP: Record<string, OrderStatus> = {
  ASSIGNED: OrderStatus.CONFIRMED,
  PICKED_UP: OrderStatus.SHIPPED,
  IN_TRANSIT: OrderStatus.SHIPPED,
  DELIVERED: OrderStatus.DELIVERED,
  FAILED: OrderStatus.CANCELLED,
};

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDeliveryPartnerDto) {
    if (dto.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existingEmail) {
        throw new ConflictException('Email already registered');
      }
    }

    if (dto.phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (existingPhone) {
        throw new ConflictException('Phone number already registered');
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName || '',
        role: 'DELIVERY',
        isVerified: true,
        isActive: true,
      },
    });

    const partner = await this.prisma.deliveryPartner.create({
      data: {
        userId: user.id,
        vehicleType: dto.vehicleType || 'MOTORCYCLE',
        licenseNumber: dto.licenseNumber,
        vehicleNumber: dto.vehicleNumber,
        isAvailable: true,
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

    this.logger.log(`Delivery partner created: ${partner.id} for user: ${user.id}`);
    return partner;
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    isAvailable?: boolean;
  }) {
    const { page, limit, skip } = getPaginationParams(query);

    const where: Prisma.DeliveryPartnerWhereInput = {};

    if (query.isAvailable !== undefined) {
      where.isAvailable = query.isAvailable;
    }

    if (query.search) {
      where.OR = [
        { user: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { user: { email: { contains: query.search, mode: 'insensitive' } } },
        { user: { phone: { contains: query.search } } },
        { vehicleNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [partners, total] = await Promise.all([
      this.prisma.deliveryPartner.findMany({
        where,
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
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.deliveryPartner.count({ where }),
    ]);

    return paginatedResponse(partners, total, page, limit);
  }

  async resolvePartnerId(userId: string): Promise<string> {
    let partner = await this.prisma.deliveryPartner.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!partner) {
      partner = await this.prisma.deliveryPartner.create({
        data: { userId },
        select: { id: true },
      });
    }

    return partner.id;
  }

  async getAssignedOrders(
    partnerId: string,
    query: { page?: number; limit?: number; status?: string },
  ) {
    const { page, limit, skip } = getPaginationParams(query);

    const where: Prisma.DeliveryAssignmentWhereInput = {
      deliveryPartnerId: partnerId,
    };

    if (query.status) {
      where.status = query.status as any;
    }

    const [assignments, total] = await Promise.all([
      this.prisma.deliveryAssignment.findMany({
        where,
        include: {
          order: {
            include: {
              items: {
                include: {
                  product: {
                    select: { id: true, name: true, images: { where: { isPrimary: true }, take: 1 } },
                  },
                },
              },
              shippingAddress: true,
              user: {
                select: { id: true, firstName: true, lastName: true, phone: true },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.deliveryAssignment.count({ where }),
    ]);

    return paginatedResponse(assignments, total, page, limit);
  }

  async updateDeliveryStatus(
    id: string,
    partnerId: string,
    dto: { status: DeliveryStatus; notes?: string; latitude?: string; longitude?: string },
  ) {
    const assignment = await this.prisma.deliveryAssignment.findFirst({
      where: {
        id,
        deliveryPartnerId: partnerId,
      },
      include: { order: true },
    });

    if (!assignment) {
      throw new NotFoundException('Delivery assignment not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedAssignment = await tx.deliveryAssignment.update({
        where: { id },
        data: {
          status: dto.status as any,
          ...(dto.latitude &&
            dto.longitude && {
              currentLat: dto.latitude,
              currentLng: dto.longitude,
            }),
          ...(dto.status === DeliveryStatus.DELIVERED && {
            deliveredAt: new Date(),
          }),
          ...(dto.status === DeliveryStatus.PICKED_UP && {
            pickedUpAt: new Date(),
          }),
        },
      });

      const orderStatus = PRISMA_DELIVERY_STATUS_MAP[dto.status];
      if (orderStatus) {
        await tx.order.update({
          where: { id: assignment.orderId },
          data: {
            status: orderStatus,
            ...(dto.status === DeliveryStatus.DELIVERED && {
              paymentStatus: 'PAID',
            }),
          },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: assignment.orderId,
            status: orderStatus,
            notes: dto.notes || `Delivery status updated to ${dto.status}`,
          },
        });
      }

      return updatedAssignment;
    });

    this.logger.log(
      `Delivery status updated: ${assignment.order.orderNumber} -> ${dto.status}`,
    );

    return updated;
  }

  async toggleAvailability(
    partnerId: string,
    data: { isAvailable: boolean },
  ) {
    const partner = await this.prisma.deliveryPartner.findUnique({
      where: { id: partnerId },
    });

    if (!partner) {
      throw new NotFoundException('Delivery partner not found');
    }

    const updated = await this.prisma.deliveryPartner.update({
      where: { id: partnerId },
      data: { isAvailable: data.isAvailable },
    });

    this.logger.log(
      `Partner ${partnerId} availability set to ${data.isAvailable}`,
    );

    return updated;
  }

  async getEarnings(
    partnerId: string,
    query: { period?: 'today' | 'week' | 'month' | 'year' },
  ) {
    const now = new Date();
    let startDate: Date;

    switch (query.period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
    }

    const deliveries = await this.prisma.deliveryAssignment.findMany({
      where: {
        deliveryPartnerId: partnerId,
        status: 'DELIVERED' as any,
        deliveredAt: { gte: startDate },
      },
      include: {
        order: {
          select: { id: true, orderNumber: true, total: true },
        },
      },
      orderBy: { deliveredAt: 'desc' },
    });

    const totalEarnings = deliveries.reduce(
      (sum, d) => sum + Number(d.order?.total || 0) * 0.05,
      0,
    );

    const earningsByDay = deliveries.reduce((acc, d) => {
      const date = d.deliveredAt?.toISOString().split('T')[0] || 'unknown';
      const earning = Number(d.order?.total || 0) * 0.05;
      acc[date] = (acc[date] || 0) + earning;
      return acc;
    }, {} as Record<string, number>);

    return {
      summary: {
        totalDeliveries: deliveries.length,
        totalEarnings,
        averageEarning:
          deliveries.length > 0 ? totalEarnings / deliveries.length : 0,
        period: query.period || 'last30days',
      },
      earningsByDay,
      deliveries,
    };
  }

  async calculateRoute(partnerId: string) {
    const assignments = await this.prisma.deliveryAssignment.findMany({
      where: {
        deliveryPartnerId: partnerId,
        status: {
          in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'] as any[],
        },
      },
      include: {
        order: {
          include: {
            shippingAddress: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (assignments.length === 0) {
      return {
        route: [],
        message: 'No active deliveries to route',
      };
    }

    const route = assignments.map((assignment, index) => ({
      stopNumber: index + 1,
      orderId: assignment.orderId,
      orderNumber: assignment.order.orderNumber,
      address: assignment.order.shippingAddress,
      status: assignment.status,
    }));

    return {
      totalStops: route.length,
      estimatedTime: route.length * 15,
      route,
    };
  }

  async updateLocation(
    partnerId: string,
    data: { latitude: string; longitude: string },
  ) {
    const partner = await this.prisma.deliveryPartner.findUnique({
      where: { id: partnerId },
    });

    if (!partner) {
      throw new NotFoundException('Delivery partner not found');
    }

    const updated = await this.prisma.deliveryPartner.update({
      where: { id: partnerId },
      data: {
        currentLat: data.latitude,
        currentLng: data.longitude,
      },
    });

    const activeAssignment = await this.prisma.deliveryAssignment.findFirst({
      where: {
        deliveryPartnerId: partnerId,
        status: {
          in: ['PICKED_UP', 'IN_TRANSIT'] as any[],
        },
      },
    });

    if (activeAssignment) {
      await this.prisma.deliveryAssignment.update({
        where: { id: activeAssignment.id },
        data: {
          currentLat: data.latitude,
          currentLng: data.longitude,
        },
      });
    }

    return updated;
  }

  async assignDeliveryPartner(dto: AssignDeliveryDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        shippingAddress: true,
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.CONFIRMED && order.status !== OrderStatus.PROCESSING) {
      throw new BadRequestException(
        `Order must be CONFIRMED or PROCESSING to assign delivery. Current: ${order.status}`,
      );
    }

    const existingAssignment = await this.prisma.deliveryAssignment.findFirst({
      where: { orderId: dto.orderId },
    });

    if (existingAssignment) {
      throw new ConflictException('Delivery partner already assigned to this order');
    }

    let partnerId: string | undefined = dto.deliveryPartnerId;

    if (!partnerId) {
      const found = await this.findBestPartner();
      partnerId = found ?? undefined;
    }

    if (!partnerId) {
      throw new BadRequestException('No available delivery partners found');
    }

    const assignment = await this.prisma.$transaction(async (tx) => {
      const newAssignment = await tx.deliveryAssignment.create({
        data: {
          orderId: dto.orderId,
          deliveryPartnerId: partnerId,
          status: 'ASSIGNED' as any,
        },
        include: {
          order: {
            select: { id: true, orderNumber: true, total: true },
          },
          deliveryPartner: {
            select: {
              id: true,
              user: { select: { firstName: true, lastName: true, phone: true } },
            },
          },
        },
      });

      await tx.order.update({
        where: { id: dto.orderId },
        data: { status: OrderStatus.CONFIRMED },
      });

      return newAssignment;
    });

    this.logger.log(
      `Delivery partner ${partnerId} assigned to order ${order.orderNumber}`,
    );

    return assignment;
  }

  private async findBestPartner(): Promise<string | null> {
    const availablePartners = await this.prisma.deliveryPartner.findMany({
      where: {
        isAvailable: true,
      },
      include: {
        assignments: {
          where: {
            status: {
              in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'] as any[],
            },
          },
        },
      },
    });

    if (availablePartners.length === 0) {
      return null;
    }

    const partnerLoads = availablePartners.map((partner) => ({
      id: partner.id,
      activeCount: partner.assignments.length,
    }));

    partnerLoads.sort((a, b) => a.activeCount - b.activeCount);

    return partnerLoads[0].id;
  }

  async getPartnerStats(partnerId: string) {
    const partner = await this.prisma.deliveryPartner.findUnique({
      where: { id: partnerId },
      include: {
        user: {
          select: { firstName: true, lastName: true, phone: true },
        },
      },
    });

    if (!partner) {
      throw new NotFoundException('Delivery partner not found');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalDeliveries, todayDeliveries, activeDeliveries] =
      await Promise.all([
        this.prisma.deliveryAssignment.count({
          where: {
            deliveryPartnerId: partnerId,
            status: 'DELIVERED' as any,
          },
        }),
        this.prisma.deliveryAssignment.count({
          where: {
            deliveryPartnerId: partnerId,
            status: 'DELIVERED' as any,
            deliveredAt: { gte: today },
          },
        }),
        this.prisma.deliveryAssignment.count({
          where: {
            deliveryPartnerId: partnerId,
            status: {
              in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'] as any[],
            },
          },
        }),
      ]);

    return {
      partner: {
        id: partner.id,
        name: `${partner.user.firstName} ${partner.user.lastName}`,
        isAvailable: partner.isAvailable,
        rating: partner.rating,
      },
      stats: {
        totalDeliveries,
        todayDeliveries,
        activeDeliveries,
        averageRating: partner.rating || 0,
      },
    };
  }
}
