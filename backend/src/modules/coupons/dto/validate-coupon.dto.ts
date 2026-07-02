import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidateCouponDto {
  @ApiProperty({ example: 'SAVE10', description: 'Coupon code to validate' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Cart total amount', example: 999.99 })
  @IsNumber()
  @Min(0)
  cartTotal: number;

  @ApiPropertyOptional({ description: 'User ID for per-user validation', type: String })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Category IDs in cart', type: [String] })
  @IsOptional()
  categoryIds?: string[];

  @ApiPropertyOptional({ description: 'Brand IDs in cart', type: [String] })
  @IsOptional()
  brandIds?: string[];
}
