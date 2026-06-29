import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../config/database.config';
import { CreateTicketDto, UpdateTicketDto, CreateTicketMessageDto } from './dto/support.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findByUser(userId: string) {
    return this.prisma.supportTicket.findMany({
      where: { userId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(opts: { status?: string; priority?: string; page?: number; limit?: number } = {}) {
    const page = Number(opts.page) || 1;
    const limit = Number(opts.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (opts.status) where.status = opts.status;
    if (opts.priority) where.priority = opts.priority;

    const [tickets, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          assignee: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { messages: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return {
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string, isAdmin = false) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignee: { select: { id: true, firstName: true, lastName: true } },
        messages: {
          include: {
            sender: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (!isAdmin && ticket.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return ticket;
  }

  async create(userId: string, dto: CreateTicketDto) {
    const ticket = await this.prisma.supportTicket.create({
      data: {
        userId,
        subject: dto.subject,
        description: dto.description,
        priority: dto.priority || 'MEDIUM',
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    this.logger.log(`Ticket created: ${ticket.id}`);

    try {
      await this.notificationsService.create(
        userId,
        'Support Ticket Created 🎧',
        `Your ticket "${ticket.subject}" has been created. We'll get back to you soon.`,
        'SUPPORT',
        { link: `/account/support`, ticketId: ticket.id },
      );
    } catch (e) {
      this.logger.warn('Failed to create support notification', e as any);
    }

    return ticket;
  }

  async update(id: string, dto: UpdateTicketDto) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id },
      data: dto,
    });

    this.logger.log(`Ticket updated: ${id}`);

    if (dto.status) {
      const statusTitle = dto.status === 'RESOLVED' ? 'Ticket Resolved ✅' : `Ticket ${dto.status}`;
      try {
        await this.notificationsService.create(
          ticket.userId,
          statusTitle,
          `Your ticket "${ticket.subject}" is now ${dto.status.toLowerCase()}.`,
          'SUPPORT',
          { link: `/account/support`, ticketId: ticket.id },
        );
      } catch (e) {
        this.logger.warn('Failed to create support update notification', e as any);
      }
    }

    return updated;
  }

  async getMessages(ticketId: string, userId: string, isAdmin = false) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (!isAdmin && ticket.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const messages = await this.prisma.ticketMessage.findMany({
      where: { ticketId },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return messages;
  }

  async addMessage(ticketId: string, userId: string, dto: CreateTicketMessageDto) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.userId !== userId && ticket.assignedTo !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const message = await this.prisma.ticketMessage.create({
      data: {
        ticketId,
        senderId: userId,
        message: dto.message,
        attachments: dto.attachments || [],
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
    });

    this.logger.log(`Message added to ticket: ${ticketId}`);

    if (ticket.assignedTo === userId && ticket.userId !== userId) {
      try {
        await this.notificationsService.create(
          ticket.userId,
          'New Reply on Your Ticket 💬',
          `Support team replied to your ticket "${ticket.subject}".`,
          'SUPPORT',
          { link: `/account/support`, ticketId: ticket.id },
        );
      } catch (e) {
        this.logger.warn('Failed to create support reply notification', e as any);
      }
    }

    return message;
  }
}
