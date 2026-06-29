import { Module } from '@nestjs/common';
import { AppBannerService } from './app-banner.service';
import { AppBannerController, AdminAppBannerController } from './app-banner.controller';

@Module({
  controllers: [AppBannerController, AdminAppBannerController],
  providers: [AppBannerService],
  exports: [AppBannerService],
})
export class AppBannerModule {}
