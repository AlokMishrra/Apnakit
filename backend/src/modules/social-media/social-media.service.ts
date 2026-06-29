import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/database.config';
import { UpdateSocialMediaDto } from './dto/update-social-media.dto';

@Injectable()
export class SocialMediaService {
  private readonly logger = new Logger(SocialMediaService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async getOrCreate() {
    let config = await this.prisma.socialMediaConfig.findFirst();
    if (!config) {
      config = await this.prisma.socialMediaConfig.create({ data: {} });
    }
    return config;
  }

  async getPublic() {
    const config = await this.prisma.socialMediaConfig.findFirst({
      where: { isActive: true },
    });
    if (!config) return null;
    const { id, isActive, createdAt, updatedAt, ...links } = config;
    return links;
  }

  async getAdmin() {
    return this.getOrCreate();
  }

  async update(dto: UpdateSocialMediaDto) {
    const current = await this.getOrCreate();
    const data: any = { ...dto };
    Object.keys(data).forEach((k) => {
      if (data[k] === '') data[k] = null;
    });
    const updated = await this.prisma.socialMediaConfig.update({
      where: { id: current.id },
      data,
    });
    this.logger.log(`Social media config updated (id=${updated.id})`);
    return updated;
  }
}
