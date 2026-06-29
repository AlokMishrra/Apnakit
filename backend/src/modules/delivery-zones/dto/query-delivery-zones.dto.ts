import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsBoolean, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class QueryDeliveryZonesDto {
  @ApiProperty({ required: false, description: 'Filter by city name' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ required: false, description: 'Filter by state' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ required: false, description: 'Filter by 6-digit pincode' })
  @IsOptional()
  @IsString()
  pincode?: string;

  @ApiProperty({ required: false, description: 'Filter active only' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 50;

  @ApiProperty({ required: false, description: 'Search by city/state/pincode' })
  @IsOptional()
  @IsString()
  search?: string;
}
