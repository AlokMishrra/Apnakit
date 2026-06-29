import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Msg91Service } from './msg91.service';
import { EmailService } from './email.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, Msg91Service, EmailService],
  exports: [NotificationsService, Msg91Service, EmailService],
})
export class NotificationsModule {}
