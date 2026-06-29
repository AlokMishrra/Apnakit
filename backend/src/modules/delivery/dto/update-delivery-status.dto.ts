import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DeliveryStatus {
  ASSIGNED = 'ASSIGNED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  RETURNED = 'RETURNED',
}

export class UpdateDeliveryStatusDto {
  @ApiProperty({ enum: DeliveryStatus, description: 'New delivery status' })
  @IsEnum(DeliveryStatus)
  status: DeliveryStatus;

  @ApiPropertyOptional({ description: 'Status change notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Current latitude' })
  @IsOptional()
  @IsString()
  latitude?: string;

  @ApiPropertyOptional({ description: 'Current longitude' })
  @IsOptional()
  @IsString()
  longitude?: string;

  @ApiPropertyOptional({ description: 'Proof of delivery (image URL)' })
  @IsOptional()
  @IsString()
  proofOfDelivery?: string;

  @ApiPropertyOptional({ description: 'Receiver name at delivery' })
  @IsOptional()
  @IsString()
  receiverName?: string;
}
