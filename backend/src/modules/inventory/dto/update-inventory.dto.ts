import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateInventoryDto {
  @ApiProperty({ description: 'New stock quantity' })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({ description: 'Reason for update' })
  @IsOptional()
  @IsString()
  reason?: string;
}
