import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignDeliveryDto {
  @ApiProperty({ description: 'Order ID to assign' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiPropertyOptional({ description: 'Specific delivery partner ID (auto-assigned if omitted)' })
  @IsOptional()
  @IsString()
  deliveryPartnerId?: string;
}
