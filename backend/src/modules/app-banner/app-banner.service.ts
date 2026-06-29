import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/database.config';
import { UpdateAppBannerConfigDto } from './dto/update-app-banner-config.dto';

@Injectable()
export class AppBannerService {
  private readonly logger = new Logger(AppBannerService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async getOrCreate() {
    let config = await this.prisma.appBannerConfig.findFirst();
    if (!config) {
      config = await this.prisma.appBannerConfig.create({
        data: {},
      });
    }
    return config;
  }

  async getPublic() {
    const config = await this.prisma.appBannerConfig.findFirst({
      where: { isActive: true },
    });
    if (!config) return null;
    return config;
  }

  async getAdmin() {
    return this.getOrCreate();
  }

  async update(dto: UpdateAppBannerConfigDto) {
    const current = await this.getOrCreate();
    const data: any = { ...dto };
    Object.keys(data).forEach((k) => {
      if (data[k] === '') data[k] = null;
    });
    const updated = await this.prisma.appBannerConfig.update({
      where: { id: current.id },
      data,
    });
    this.logger.log(`App banner config updated (id=${updated.id})`);
    return updated;
  }

  async resetDismissals() {
    // No-op placeholder — dismiss state lives in localStorage on the client.
    return { message: 'Dismissal state is managed client-side' };
  }
}
