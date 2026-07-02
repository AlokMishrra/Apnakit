import { IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AnalyticsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dateRange?: 'Today' | '7 days' | '30 days' | '90 days' | 'Custom';

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  period?: 'day' | 'week' | 'month' | 'year';
}
