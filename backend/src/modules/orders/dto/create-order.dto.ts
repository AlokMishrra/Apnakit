import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

export class CreateOrderDto {
  @ApiProperty({ description: 'Shipping address ID' })
  @IsString()
  addressId: string;

  @ApiProperty({ enum: PaymentMethod, description: 'Payment method' })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ description: 'Billing address ID (defaults to shipping)' })
  @IsOptional()
  @IsString()
  billingAddressId?: string;

  @ApiPropertyOptional({ description: 'Order notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Visitor session id from a partner link (for referral attribution)' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  referralSessionId?: string;
}
