import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../config/database.config';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderFilterDto } from './dto/order-filter.dto';
import { RequestReturnDto } from './dto/request-return.dto';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private readonly CANCELLABLE_STATUSES: OrderStatus[] = [
    OrderStatus.PENDING,
    OrderStatus.CONFIRMED,
  ];

  private readonly RETURNABLE_STATUSES: OrderStatus[] = [
    OrderStatus.DELIVERED,
  ];

  private readonly STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
    [OrderStatus.PROCESSING]: [OrderStatus.PACKED, OrderStatus.CANCELLED],
    [OrderStatus.PACKED]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
    [OrderStatus.SHIPPED]: [OrderStatus.OUT_FOR_DELIVERY],
    [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
    [OrderStatus.DELIVERED]: [OrderStatus.RETURNED, OrderStatus.REFUNDED],
    [OrderStatus.CANCELLED]: [],
    [OrderStatus.RETURNED]: [OrderStatus.REFUNDED],
    [OrderStatus.REFUNDED]: [],
  };

  async create(userId: string, dto: CreateOrderDto) {
    const cart = await this.prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        coupon: true,
      },
    });

    if (!cart || !cart.items.length) {
      throw new BadRequestException('Cart is empty');
    }

    const address = await this.prisma.address.findFirst({
      where: { id: dto.addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    for (const item of cart.items) {
      if (item.variant) {
        if (item.variant.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for ${item.product.name} (${item.variant.name})`,
          );
        }
      }
    }

    const orderNumber = this.generateOrderNumber();

    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0,
    );

    let discount = 0;
    if (cart.coupon) {
      if (cart.coupon.type === 'PERCENTAGE') {
        discount = (subtotal * Number(cart.coupon.value)) / 100;
        if (cart.coupon.maximumDiscount) {
          discount = Math.min(discount, Number(cart.coupon.maximumDiscount));
        }
      } else if (cart.coupon.type === 'FIXED') {
        discount = Math.min(Number(cart.coupon.value), subtotal);
      }
    }

    const taxableAmount = subtotal - discount;
    const taxRate = 0.18;
    const tax = taxableAmount * taxRate;
    const shippingCost = subtotal >= 500 ? 0 : 49;
    const total = taxableAmount + tax + shippingCost;

    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          sellerId: cart.items[0]?.product.sellerId || null,
          status: OrderStatus.PENDING,
          subtotal,
          discount,
          tax,
          shippingCost,
          total,
          paymentMethod: dto.paymentMethod,
          paymentStatus: PaymentStatus.PENDING,
          shippingAddressId: dto.addressId,
          billingAddressId: dto.billingAddressId || dto.addressId,
          notes: dto.notes,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.price,
              total: new Prisma.Decimal(Number(item.price) * item.quantity),
            })),
          },
        },
        include: {
          items: {
            include: {
              product: {
                include: { images: { where: { isPrimary: true }, take: 1 } },
              },
              variant: true,
            },
          },
          shippingAddress: true,
        },
      });

      for (const item of cart.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      if (cart.couponId) {
        await tx.coupon.update({
          where: { id: cart.couponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId: newOrder.id,
          status: OrderStatus.PENDING,
          notes: 'Order created',
        },
      });

      await tx.cart.delete({ where: { id: cart.id } });

      return newOrder;
    });

    try {
      await this.notificationsService.create(
        userId,
        'Order Placed Successfully! 🎉',
        `Your order #${order.orderNumber} has been placed and is being processed.`,
        'ORDER_PLACED',
        { link: `/account/orders/${order.id}`, orderId: order.id, orderNumber: order.orderNumber },
      );
    } catch (e) {
      this.logger.warn('Failed to create order notification', e as any);
    }

    return order;
  }

  async findAll(userId: string, query: OrderFilterDto) {

    const where: Prisma.OrderWhereInput = { userId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { orderNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                include: { images: { where: { isPrimary: true }, take: 1 } },
              },
              variant: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
                brand: true,
                category: true,
              },
            },
            variant: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
        payments: true,
        shippingAddress: true,
        billingAddress: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { statusHistory: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const allowedTransitions = this.STATUS_TRANSITIONS[order.status];
    if (!allowedTransitions.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${dto.status}`,
      );
    }

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: {
          status: dto.status,
          paymentStatus:
            dto.status === OrderStatus.DELIVERED
              ? PaymentStatus.PAID
              : dto.status === OrderStatus.CANCELLED
                ? PaymentStatus.FAILED
                : undefined,
        },
        include: {
          items: true,
          statusHistory: { orderBy: { createdAt: 'desc' } },
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status: dto.status,
          notes: dto.notes || `Status updated to ${dto.status}`,
        },
      });

      return updated;
    });

    try {
      const typeMap: Record<string, { title: string; type: string }> = {
        CONFIRMED: { title: 'Order Confirmed ✅', type: 'ORDER_STATUS' },
        PROCESSING: { title: 'Order Being Prepared 📦', type: 'ORDER_STATUS' },
        SHIPPED: { title: 'Order Shipped 🚚', type: 'ORDER_STATUS' },
        DELIVERED: { title: 'Order Delivered! 🎉', type: 'ORDER_DELIVERED' },
        CANCELLED: { title: 'Order Cancelled ❌', type: 'ORDER_STATUS' },
      };
      const cfg = typeMap[dto.status];
      if (cfg) {
        await this.notificationsService.create(
          order.userId,
          cfg.title,
          `Your order #${order.orderNumber} is now ${dto.status.toLowerCase()}.${dto.notes ? ' Note: ' + dto.notes : ''}`,
          cfg.type,
          { link: `/account/orders/${order.id}`, orderId: order.id },
        );
      }
    } catch (e) {
      this.logger.warn('Failed to create status notification', e as any);
    }

    return updatedOrder;
  }

  async cancel(id: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!this.CANCELLABLE_STATUSES.includes(order.status)) {
      throw new BadRequestException(
        `Order cannot be cancelled in ${order.status} status`,
      );
    }

    const cancelledOrder = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.CANCELLED,
          paymentStatus: PaymentStatus.FAILED,
        },
      });

      for (const item of order.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status: OrderStatus.CANCELLED,
          notes: 'Order cancelled by customer',
        },
      });

      return updated;
    });

    return cancelledOrder;
  }

  async requestReturn(id: string, userId: string, dto: RequestReturnDto) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!this.RETURNABLE_STATUSES.includes(order.status)) {
      throw new BadRequestException(
        `Order cannot be returned in ${order.status} status`,
      );
    }

    const returnOrder = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: { status: OrderStatus.RETURNED },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status: OrderStatus.RETURNED,
          notes: `Return requested: ${dto.reason}${dto.details ? ` - ${dto.details}` : ''}`,
        },
      });

      return updated;
    });

    return returnOrder;
  }

  async track(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: {
        statusHistory: {
          orderBy: { createdAt: 'asc' },
        },
        items: {
          include: {
            product: {
              include: { images: { where: { isPrimary: true }, take: 1 } },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return {
      orderNumber: order.orderNumber,
      status: order.status,
      estimatedDelivery: this.getEstimatedDelivery(order.createdAt),
      timeline: order.statusHistory.map((h) => ({
        status: h.status,
        notes: h.notes,
        timestamp: h.createdAt,
      })),
      items: order.items,
    };
  }

  async findAllAdmin(query: OrderFilterDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { orderNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: true,
          user: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findSellerOrders(sellerId: string, query: OrderFilterDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = { sellerId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { orderNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                include: { images: { where: { isPrimary: true }, take: 1 } },
              },
            },
          },
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        skip,
        take: limit,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  private getEstimatedDelivery(createdAt: Date): Date {
    const delivery = new Date(createdAt);
    delivery.setDate(delivery.getDate() + 7);
    return delivery;
  }
}
