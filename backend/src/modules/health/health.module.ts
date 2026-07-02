import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { EmailService } from '../notifications/email.service';

@Module({
  controllers: [HealthController],
  providers: [EmailService],
})
export class HealthModule {}
