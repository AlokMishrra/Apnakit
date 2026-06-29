import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../config/database.config';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { BannerPosition } from '@prisma/client';

@Injectable()
export class BannersService {
  private readonly logger = new Logger(BannersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(position?: BannerPosition) {
    const where: any = { isActive: true };
    if (position) {
      where.position = position;
    }

    const banners = await this.prisma.banner.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return banners;
  }

  async findAllAdmin() {
    return this.prisma.banner.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) {
      throw new NotFoundException('Banner not found');
    }
    return banner;
  }

  async create(dto: CreateBannerDto) {
    const banner = await this.prisma.banner.create({ data: dto });
    this.logger.log(`Banner created: ${banner.id}`);
    return banner;
  }

  async update(id: string, dto: UpdateBannerDto) {
    await this.findOne(id);
    const banner = await this.prisma.banner.update({
      where: { id },
      data: dto,
    });
    this.logger.log(`Banner updated: ${id}`);
    return banner;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.banner.delete({ where: { id } });
    this.logger.log(`Banner deleted: ${id}`);
    return { message: 'Banner deleted successfully' };
  }
}
