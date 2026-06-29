import { IsString, IsOptional, IsBoolean, IsEnum, MinLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AddressType } from '@prisma/client';

export class CreateAddressDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(1, { message: 'Name is required' })
  name: string;

  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @Matches(/^\d{10,13}$/, { message: 'Invalid phone number' })
  phone: string;

  @ApiProperty({ example: '123 Main Street' })
  @IsString()
  @MinLength(1, { message: 'Address line 1 is required' })
  addressLine1: string;

  @ApiPropertyOptional({ example: 'Apt 4B' })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiProperty({ example: 'Mumbai' })
  @IsString()
  @MinLength(1, { message: 'City is required' })
  city: string;

  @ApiProperty({ example: 'Maharashtra' })
  @IsString()
  @MinLength(1, { message: 'State is required' })
  state: string;

  @ApiProperty({ example: '400001' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Pincode must be exactly 6 digits' })
  pincode: string;

  @ApiPropertyOptional({ example: 'IN' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ enum: AddressType, example: AddressType.HOME })
  @IsOptional()
  @IsEnum(AddressType)
  type?: AddressType;
}
