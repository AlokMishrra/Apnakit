import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../config/database.config';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { RAZORPAY_CLIENT } from '../../config/razorpay.config';
import { PaymentStatus, RefundStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Inject(RAZORPAY_CLIENT) private readonly razorpay: any,
  ) {}

  async createRazorpayOrder(dto: CreatePaymentDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Order is already paid');
    }

    try {
      const razorpayOrder = await this.razorpay.orders.create({
        amount: Math.round(dto.amount * 100),
        currency: 'INR',
        receipt: order.orderNumber,
        notes: {
          orderId: order.id,
          orderNumber: order.orderNumber,
        },
      });

      const payment = await this.prisma.payment.create({
        data: {
          orderId: dto.orderId,
          method: order.paymentMethod,
          razorpayOrderId: razorpayOrder.id,
          amount: dto.amount,
          status: PaymentStatus.PENDING,
          metadata: {
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
          },
        },
      });

      return {
        paymentId: payment.id,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: this.configService.get('RAZORPAY_KEY_ID'),
      };
    } catch (error) {
      this.logger.error('Failed to create Razorpay order', error);
      throw new BadRequestException('Failed to create payment order');
    }
  }

  async verifyPayment(dto: VerifyPaymentDto) {
    const payment = await this.prisma.payment.findFirst({
      where: { razorpayOrderId: dto.razorpayOrderId },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }

    const razorpaySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');

    const body = `${dto.razorpayOrderId}|${dto.razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', razorpaySecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== dto.razorpaySignature) {
      this.logger.warn('Payment signature verification failed');
      throw new BadRequestException('Payment verification failed');
    }

    const updatedPayment = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { id: payment.id },
        data: {
          razorpayPaymentId: dto.razorpayPaymentId,
          transactionId: dto.razorpayPaymentId,
          status: PaymentStatus.PAID,
          metadata: {
            ...((payment.metadata as object) || {}),
            razorpayPaymentId: dto.razorpayPaymentId,
            razorpaySignature: dto.razorpaySignature,
            verifiedAt: new Date().toISOString(),
          },
        },
      });

      await tx.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: PaymentStatus.PAID },
      });

      return updated;
    });

    return {
      paymentId: updatedPayment.id,
      status: updatedPayment.status,
      orderId: payment.orderId,
      amount: updatedPayment.amount,
    };
  }

  async getPaymentStatus(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async initiateRefund(dto: RefundPaymentDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: dto.paymentId },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.PAID) {
      throw new BadRequestException('Can only refund paid payments');
    }

    if (dto.amount > Number(payment.amount)) {
      throw new BadRequestException('Refund amount cannot exceed payment amount');
    }

    if (!payment.razorpayPaymentId) {
      throw new BadRequestException('No Razorpay payment ID found');
    }

    try {
      const refund = await this.razorpay.payments.refund(payment.razorpayPaymentId, {
        amount: Math.round(dto.amount * 100),
        notes: {
          reason: dto.reason || 'Refund requested',
          orderId: payment.orderId,
        },
      });

      const updatedPayment = await this.prisma.$transaction(async (tx) => {
        const refundRecord = await tx.refund.create({
          data: {
            paymentId: dto.paymentId,
            amount: dto.amount,
            reason: dto.reason,
            status: RefundStatus.PROCESSING,
            transactionId: refund.id,
          },
        });

        await tx.payment.update({
          where: { id: dto.paymentId },
          data: { status: PaymentStatus.REFUNDED },
        });

        await tx.order.update({
          where: { id: payment.orderId },
          data: { paymentStatus: PaymentStatus.REFUNDED },
        });

        return refundRecord;
      });

      return {
        refundId: updatedPayment.id,
        amount: updatedPayment.amount,
        status: updatedPayment.status,
        razorpayRefundId: refund.id,
      };
    } catch (error) {
      this.logger.error('Failed to initiate refund', error);
      throw new BadRequestException('Failed to initiate refund');
    }
  }
}
