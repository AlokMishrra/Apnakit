import { IsOptional, IsString, IsEmail, Matches, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number format' })
  phone?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @ApiPropertyOptional({ example: 'login', enum: ['login', 'register', 'reset'] })
  @IsOptional()
  @IsString()
  @IsIn(['login', 'register', 'reset'], { message: 'Intent must be login, register, or reset' })
  intent?: string;
}
