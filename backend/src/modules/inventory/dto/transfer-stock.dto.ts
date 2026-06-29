import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransferStockDto {
  @ApiProperty({ description: 'Product ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiPropertyOptional({ description: 'Variant ID' })
  @IsOptional()
  @IsString()
  variantId?: string;

  @ApiProperty({ description: 'Source warehouse ID' })
  @IsString()
  @IsNotEmpty()
  fromWarehouseId: string;

  @ApiProperty({ description: 'Destination warehouse ID' })
  @IsString()
  @IsNotEmpty()
  toWarehouseId: string;

  @ApiProperty({ description: 'Quantity to transfer' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Transfer notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
