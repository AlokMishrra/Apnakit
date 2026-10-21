import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CouponType } from '@prisma/client';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Max, Min, MinLength, MaxLength } from 'class-validator';

export class CreatePartnerDto {
  @ApiProperty({ description: 'User id, phone or email of the person who becomes the partner' })
  @IsString()
  userId: string;

  @ApiPropertyOptional({ description: 'Custom code (e.g. APN-CDFG). Generated if omitted.' })
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  code?: string;

  @ApiPropertyOptional({ enum: CouponType, default: CouponType.PERCENTAGE })
  @IsOptional()
  @IsEnum(CouponType)
  customerDiscountType?: CouponType;

  @ApiPropertyOptional({ description: 'Customer discount (percent or rupees)', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  customerDiscountValue?: number;

  @ApiPropertyOptional({ description: 'Partner commission percent of net merchandise value', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
