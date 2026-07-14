import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/database.config';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderFilterDto } from './dto/order-filter.dto';
import { RequestReturnDto } from './dto/request-return.dto';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { SettingsService } from '../settings/settings.service';
import { EmailService } from '../notifications/email.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly settingsService: SettingsService,
    private readonly emailService: EmailService,
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
    const settings = await this.settingsService.getSettings();
    const gstRate = (settings.tax.gstRate ?? 18) / 100;
    const tax = settings.tax.gstEnabled ? taxableAmount * gstRate : 0;
    const freeThreshold = settings.delivery.freeDeliveryThreshold ?? 999;
    const deliveryCharge = settings.delivery.deliveryCharge ?? 99;
    const shippingCost = settings.delivery.enableFreeDelivery && subtotal >= freeThreshold ? 0 : deliveryCharge;
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
                select: { id: true, name: true, slug: true }
              },
              variant: {
                select: { id: true, name: true, sku: true }
              },
            },
          },
          shippingAddress: true,
          user: { select: { firstName: true, lastName: true, email: true, phone: true } },
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

        await tx.couponUsage.create({
          data: {
            userId: userId,
            couponId: cart.couponId,
            orderId: newOrder.id,
          },
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
        'Order Placed Successfully!',
        `Your order #${order.orderNumber} has been placed and is being processed.`,
        'ORDER_PLACED',
        { link: `/account/orders/${order.id}`, orderId: order.id, orderNumber: order.orderNumber },
      );
    } catch (e) {
      this.logger.warn('Failed to create order notification', e as any);
    }

    // Send email to admin - fire and forget with timeout
    this.sendOrderEmailAsync(order).catch(() => {});

    // COD auto-confirm - only if payment method is COD
    if (dto.paymentMethod === 'COD') {
      setTimeout(async () => {
        try {
          await this.updateStatus(order.id, { status: OrderStatus.CONFIRMED, notes: 'COD order confirmed' });
          this.logger.log(`COD order ${order.id} auto-confirmed`);
        } catch (e: any) {
          this.logger.warn(`Failed to auto-confirm COD order ${order.id}: ${e.message}`);
        }
      }, 100);
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

    if (dto.status === OrderStatus.CONFIRMED) {
      try {
        await this.autoAssignDelivery(id);
      } catch (e) {
        this.logger.warn('Auto-assign delivery failed', e as any);
      }
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

  private async sendOrderEmailAsync(order: any): Promise<void> {
    try {
      const customerName = `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || 'N/A';
      const customerEmail = order.user.email || 'N/A';
      const customerPhone = order.user.phone || 'N/A';
      const paymentMethodDisplay = order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentMethod;
      const address = order.shippingAddress;

      this.logger.log(`[ORDER EMAIL] Sending email for order ${order.orderNumber}`);
      const result = await this.emailService.sendOrderNotification('apnakit.official@gmail.com', {
        orderNumber: order.orderNumber,
        customerName,
        customerEmail,
        customerPhone,
        items: order.items.map((item: any) => ({
          name: `${item.product?.name || 'Item'}${item.variant ? ` (${item.variant.name})` : ''}`,
          quantity: item.quantity,
          price: Number(item.price),
        })),
        subtotal: Number(order.subtotal),
        discount: Number(order.discount),
        tax: Number(order.tax),
        shippingCost: Number(order.shippingCost),
        total: Number(order.total),
        paymentMethod: paymentMethodDisplay,
        shippingAddress: {
          name: address?.name || customerName,
          phone: address?.phone || customerPhone,
          addressLine1: address?.addressLine1 || '',
          addressLine2: address?.addressLine2,
          city: address?.city || '',
          state: address?.state || '',
          pincode: address?.pincode || '',
        },
      });
      this.logger.log(`[ORDER EMAIL] Result for ${order.orderNumber}: ${JSON.stringify(result)}`);
    } catch (e: any) {
      this.logger.error(`[ORDER EMAIL] Failed for ${order.orderNumber}: ${e.message}`);
    }
  }

  private getEstimatedDelivery(createdAt: Date): Date {
    const delivery = new Date(createdAt);
    delivery.setDate(delivery.getDate() + 7);
    return delivery;
  }

  private async autoAssignDelivery(orderId: string) {
    const existing = await this.prisma.deliveryAssignment.findFirst({
      where: { orderId },
    });
    if (existing) return;

    const availablePartners = await this.prisma.deliveryPartner.findMany({
      where: { isAvailable: true },
      include: {
        assignments: {
          where: { status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'] as any[] } },
        },
      },
    });

    if (availablePartners.length === 0) {
      this.logger.log(`No available delivery partners for order ${orderId}`);
      return;
    }

    const sorted = availablePartners.sort(
      (a, b) => a.assignments.length - b.assignments.length,
    );
    const bestPartner = sorted[0];

    await this.prisma.$transaction(async (tx) => {
      await tx.deliveryAssignment.create({
        data: {
          orderId,
          deliveryPartnerId: bestPartner.id,
          status: 'ASSIGNED' as any,
        },
      });
    });

    this.logger.log(
      `Auto-assigned delivery partner ${bestPartner.id} to order ${orderId}`,
    );
  }
}
