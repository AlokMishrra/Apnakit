import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { SettingsModule } from '../settings/settings.module';
import { ReferralsModule } from '../referrals/referrals.module';

@Module({
  imports: [SettingsModule, ReferralsModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
