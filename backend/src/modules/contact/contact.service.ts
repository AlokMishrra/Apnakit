import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/database.config';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateContactMessageDto) {
    const msg = await this.prisma.contactMessage.create({ data: dto });
    this.logger.log(`Contact message created: ${msg.id} from ${dto.email}`);
    return msg;
  }

  async findAll(params?: { status?: string; page?: number; limit?: number }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (params?.status) where.status = params.status;

    const [messages, total] = await Promise.all([
      this.prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.contactMessage.count({ where }),
    ]);

    return { messages, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.contactMessage.update({
      where: { id },
      data: { status },
    });
  }

  async delete(id: string) {
    return this.prisma.contactMessage.delete({ where: { id } });
  }
}
