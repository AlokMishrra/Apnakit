import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyPaymentDto {
  @ApiProperty({ description: 'Razorpay order ID' })
  @IsString()
  razorpayOrderId: string;

  @ApiProperty({ description: 'Razorpay payment ID' })
  @IsString()
  razorpayPaymentId: string;

  @ApiProperty({ description: 'Payment signature from Razorpay' })
  @IsString()
  razorpaySignature: string;
}
