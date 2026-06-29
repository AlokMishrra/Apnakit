import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RequestReturnDto {
  @ApiProperty({ description: 'Reason for return' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Additional details about the return' })
  @IsOptional()
  @IsString()
  details?: string;

  @ApiPropertyOptional({ description: 'Order item IDs to return', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  itemIds?: string[];
}
