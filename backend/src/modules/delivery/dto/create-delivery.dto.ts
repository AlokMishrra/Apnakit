import { IsString, IsEmail, IsOptional, IsBoolean, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDeliveryPartnerDto {
  @ApiProperty({ example: 'Amit' })
  @IsString()
  @MinLength(2)
  firstName: string;

  @ApiPropertyOptional({ example: 'Verma' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: 'delivery@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+91 98765 43210' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: 'MOTORCYCLE' })
  @IsOptional()
  @IsString()
  vehicleType?: string;

  @ApiPropertyOptional({ example: 'DL-1234567890' })
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiPropertyOptional({ example: 'MH-01-AB-1234' })
  @IsOptional()
  @IsString()
  vehicleNumber?: string;
}
