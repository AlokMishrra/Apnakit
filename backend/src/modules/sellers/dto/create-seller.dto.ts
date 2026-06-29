import { IsString, IsEmail, IsOptional, IsEnum, IsNumber, Min, Max, ValidateNested, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CreateSellerUserDto {
  @ApiProperty({ example: 'seller@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+91 98765 43210' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Rahul' })
  @IsString()
  @MinLength(2)
  firstName: string;

  @ApiPropertyOptional({ example: 'Sharma' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(6)
  password: string;
}

export class CreateSellerDto {
  @ApiProperty({ example: 'Rahul Electronics' })
  @IsString()
  businessName: string;

  @ApiPropertyOptional({ example: 'PRIVATE_LIMITED' })
  @IsOptional()
  @IsString()
  businessType?: string;

  @ApiPropertyOptional({ example: '27AABCU9603R1ZM' })
  @IsOptional()
  @IsString()
  gstNumber?: string;

  @ApiPropertyOptional({ example: 'ABCPM1234M' })
  @IsOptional()
  @IsString()
  panNumber?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commission?: number;

  @ApiProperty({ type: CreateSellerUserDto })
  @ValidateNested()
  @Type(() => CreateSellerUserDto)
  user: CreateSellerUserDto;
}
