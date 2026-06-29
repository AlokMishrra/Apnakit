import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsNumber,
  Min,
  Max,
  Length,
  Matches,
} from 'class-validator';

export class CreateDeliveryZoneDto {
  @ApiProperty({ example: '110001' })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'Pincode must be exactly 6 digits' })
  pincode: string;

  @ApiProperty({ example: 'New Delhi' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'Delhi' })
  @IsString()
  state: string;

  @ApiProperty({ example: 'India', default: 'India', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ default: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ default: true, required: false })
  @IsOptional()
  @IsBoolean()
  codEnabled?: boolean;

  @ApiProperty({ default: false, required: false })
  @IsOptional()
  @IsBoolean()
  prepaidOnly?: boolean;

  @ApiProperty({ example: 499, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderFreeDelivery?: number;

  @ApiProperty({ default: 3, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  estimatedDays?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
