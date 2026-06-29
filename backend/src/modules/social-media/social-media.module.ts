import { Module } from '@nestjs/common';
import { SocialMediaService } from './social-media.service';
import { SocialMediaController, AdminSocialMediaController } from './social-media.controller';

@Module({
  controllers: [SocialMediaController, AdminSocialMediaController],
  providers: [SocialMediaService],
  exports: [SocialMediaService],
})
export class SocialMediaModule {}
