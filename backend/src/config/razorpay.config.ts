import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Razorpay = require('razorpay');

export const RAZORPAY_CLIENT = 'RAZORPAY_CLIENT';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: RAZORPAY_CLIENT,
      useFactory: (configService: ConfigService) => {
        const keyId = configService.get<string>('RAZORPAY_KEY_ID');
        const keySecret = configService.get<string>('RAZORPAY_KEY_SECRET');

        if (!keyId || !keySecret) {
          console.warn('Razorpay credentials not configured. Using mock.');
          return null;
        }

        try {
          const razorpay = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
          });
          return razorpay;
        } catch (err) {
          console.warn('Failed to init Razorpay:', err.message);
          return null;
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [RAZORPAY_CLIENT],
})
export class RazorpayModule {}
