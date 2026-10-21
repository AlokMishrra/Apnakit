import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma, PartnerCommissionStatus } from '@prisma/client';
import { PrismaService } from '../../config/database.config';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { isValidPartnerCode, normalizePartnerCode } from './partner-math';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

@Injectable()
export class PartnersService {
  constructor(private readonly prisma: PrismaService) {}

  private randomCode(): string {
    let suffix = '';
    for (let i = 0; i < 5; i++) {
      suffix += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    }
    return `APN-${suffix}`;
  }

  private async assertCodeFree(code: string, exceptPartnerId?: string) {
    const existing = await this.prisma.partner.findUnique({ where: { code } });
    if (existing && existing.id !== exceptPartnerId) {
      throw new ConflictException(`Referral code ${code} is already in use`);
    }
  }

  // ─── Admin ──────────────────────────────────────────────────────────────

  async create(dto: CreatePartnerDto) {
    // Accepts a user id, phone or email so the admin does not need raw ids.
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ id: dto.userId }, { phone: dto.userId }, { email: dto.userId }] },
    });
    if (!user) throw new NotFoundException('User not found');
    dto = { ...dto, userId: user.id };

    const already = await this.prisma.partner.findUnique({ where: { userId: dto.userId } });
    if (already) throw new ConflictException('This user is already a partner');

    let code: string;
    if (dto.code) {
      code = normalizePartnerCode(dto.code);
      if (!isValidPartnerCode(code)) {
        throw new BadRequestException('Code must be 4-20 characters: A-Z, 0-9 and dashes');
      }
      await this.assertCodeFree(code);
    } else {
      do {
        code = this.randomCode();
      } while (await this.prisma.partner.findUnique({ where: { code } }));
    }

    return this.prisma.partner.create({
      data: {
        userId: dto.userId,
        code,
        customerDiscountType: dto.customerDiscountType ?? 'PERCENTAGE',
        customerDiscountValue: dto.customerDiscountValue ?? 0,
        commissionRate: dto.commissionRate ?? 0,
        isActive: dto.isActive ?? true,
      },
      include: { user: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } } },
    });
  }

  async update(id: string, dto: UpdatePartnerDto) {
    const partner = await this.prisma.partner.findUnique({ where: { id } });
    if (!partner) throw new NotFoundException('Partner not found');

    const data: Prisma.PartnerUpdateInput = {};
    if (dto.code !== undefined) {
      const code = normalizePartnerCode(dto.code);
      if (!isValidPartnerCode(code)) {
        throw new BadRequestException('Code must be 4-20 characters: A-Z, 0-9 and dashes');
      }
      await this.assertCodeFree(code, id);
      data.code = code;
    }
    if (dto.customerDiscountType !== undefined) data.customerDiscountType = dto.customerDiscountType;
    if (dto.customerDiscountValue !== undefined) data.customerDiscountValue = dto.customerDiscountValue;
    if (dto.commissionRate !== undefined) data.commissionRate = dto.commissionRate;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return this.prisma.partner.update({ where: { id }, data });
  }

  /** All partners with their referred-customer count and commission totals. */
  async findAll() {
    const partners = await this.prisma.partner.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
        _count: { select: { customers: true } },
      },
    });

    const totals = await this.prisma.partnerCommission.groupBy({
      by: ['partnerId', 'status'],
      _sum: { commissionAmount: true },
      _count: { _all: true },
    });

    return partners.map((p) => {
      const rows = totals.filter((t) => t.partnerId === p.id);
      const sum = (status: PartnerCommissionStatus) =>
        Number(rows.find((r) => r.status === status)?._sum.commissionAmount ?? 0);
      return {
        ...p,
        customerCount: p._count.customers,
        earnings: {
          pending: sum('PENDING'),
          confirmed: sum('CONFIRMED'),
          paid: sum('PAID'),
          cancelled: sum('CANCELLED'),
        },
      };
    });
  }

  /** Pays out every CONFIRMED commission for a partner in one go. */
  async payoutAll(partnerId: string) {
    const partner = await this.prisma.partner.findUnique({ where: { id: partnerId } });
    if (!partner) throw new NotFoundException('Partner not found');
    const due = await this.prisma.partnerCommission.aggregate({
      where: { partnerId, status: 'CONFIRMED' },
      _sum: { commissionAmount: true },
      _count: { _all: true },
    });
    await this.prisma.partnerCommission.updateMany({
      where: { partnerId, status: 'CONFIRMED' },
      data: { status: 'PAID' },
    });
    return {
      paidCount: due._count._all,
      paidAmount: Number(due._sum.commissionAmount ?? 0),
    };
  }

  /** Marks a delivered-order commission as paid out. */
  async markCommissionPaid(commissionId: string) {
    const commission = await this.prisma.partnerCommission.findUnique({ where: { id: commissionId } });
    if (!commission) throw new NotFoundException('Commission not found');
    if (commission.status !== 'CONFIRMED') {
      throw new BadRequestException(`Only CONFIRMED commissions can be paid (current: ${commission.status})`);
    }
    return this.prisma.partnerCommission.update({
      where: { id: commissionId },
      data: { status: 'PAID' },
    });
  }

  // ─── Public / customer ──────────────────────────────────────────────────

  /** Checks a code for the checkout UI. Never reveals partner identity. */
  async validateCode(rawCode: string) {
    const code = normalizePartnerCode(rawCode);
    const partner = await this.prisma.partner.findUnique({ where: { code } });
    if (!partner || !partner.isActive) {
      return { valid: false, code, message: 'This referral code is not valid' };
    }
    return {
      valid: true,
      code: partner.code,
      customerDiscountType: partner.customerDiscountType,
      customerDiscountValue: Number(partner.customerDiscountValue),
    };
  }

  // ─── Partner's own dashboard ────────────────────────────────────────────

  async getMine(userId: string) {
    const partner = await this.prisma.partner.findUnique({ where: { userId } });
    if (!partner) return { isPartner: false };

    const [customerCount, totals, commissions] = await Promise.all([
      this.prisma.user.count({ where: { referredByPartnerId: partner.id } }),
      this.prisma.partnerCommission.groupBy({
        by: ['status'],
        where: { partnerId: partner.id },
        _sum: { commissionAmount: true },
      }),
      this.prisma.partnerCommission.findMany({
        where: { partnerId: partner.id },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          order: {
            select: {
              orderNumber: true,
              status: true,
              createdAt: true,
              user: { select: { firstName: true } },
            },
          },
        },
      }),
    ]);

    const sum = (status: PartnerCommissionStatus) =>
      Number(totals.find((t) => t.status === status)?._sum.commissionAmount ?? 0);

    return {
      isPartner: true,
      isActive: partner.isActive,
      code: partner.code,
      customerDiscountType: partner.customerDiscountType,
      customerDiscountValue: Number(partner.customerDiscountValue),
      commissionRate: Number(partner.commissionRate),
      customerCount,
      earnings: {
        pending: sum('PENDING'),
        confirmed: sum('CONFIRMED'),
        paid: sum('PAID'),
        cancelled: sum('CANCELLED'),
      },
      commissions: commissions.map((c) => ({
        id: c.id,
        orderNumber: c.order.orderNumber,
        orderStatus: c.order.status,
        customerName: maskName(c.order.user?.firstName),
        orderAmount: Number(c.orderAmount),
        commissionRate: Number(c.commissionRate),
        commissionAmount: Number(c.commissionAmount),
        status: c.status,
        createdAt: c.createdAt,
      })),
    };
  }
}

function maskName(first?: string | null): string {
  if (!first) return 'Customer';
  return `${first.charAt(0).toUpperCase()}${'*'.repeat(Math.max(first.length - 1, 2))}`;
}

