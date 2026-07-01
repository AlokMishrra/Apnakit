import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Order ID to create payment for' })
  @IsString()
  orderId: string;

  @ApiProperty({ description: 'Payment amount', example: 999.99, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;
}
