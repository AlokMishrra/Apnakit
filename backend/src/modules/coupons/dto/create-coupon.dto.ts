import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsInt,
  IsBoolean,
  IsDateString,
  IsArray,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CouponType } from '@prisma/client';

export class CreateCouponDto {
  @ApiProperty({ example: 'SAVE10', description: 'Unique coupon code' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: 'Coupon description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: CouponType, description: 'Coupon type' })
  @IsEnum(CouponType)
  type: CouponType;

  @ApiProperty({ description: 'Coupon value (percentage or fixed amount)', example: 10 })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiPropertyOptional({ description: 'Minimum order amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumOrder?: number;

  @ApiPropertyOptional({ description: 'Maximum discount amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maximumDiscount?: number;

  @ApiPropertyOptional({ description: 'Total usage limit' })
  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @ApiProperty({ description: 'Coupon start date', example: '2024-01-01T00:00:00Z' })
  @IsDateString()
  startsAt: string;

  @ApiProperty({ description: 'Coupon expiry date', example: '2024-12-31T23:59:59Z' })
  @IsDateString()
  expiresAt: string;

  @ApiPropertyOptional({ default: true, description: 'Whether coupon is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Applicable category IDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableCategories?: string[];

  @ApiPropertyOptional({ description: 'Applicable brand IDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableBrands?: string[];
}
