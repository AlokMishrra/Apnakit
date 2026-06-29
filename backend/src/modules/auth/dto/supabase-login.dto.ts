import { IsString, IsOptional, IsEmail, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class SupabaseLoginDto {
  // Required: the Supabase access token issued by signInWithIdToken /
  // verifyOtp / signInWithOAuth. We accept any string value; the service
  // calls Supabase's /auth/v1/user to validate it before doing anything.
  @ApiProperty({ description: 'Supabase access token' })
  @IsString()
  supabaseAccessToken: string;

  @ApiPropertyOptional({ description: 'Supabase refresh token (optional)' })
  @IsOptional()
  supabaseRefreshToken?: string;

  @ApiPropertyOptional({ description: 'Supabase user UUID' })
  @IsOptional()
  supabaseUserId?: string;

  // Email is OPTIONAL — phone-only Supabase users won't have one. Use
  // @ValidateIf so the @IsEmail() check only runs when the value is a
  // non-empty string (not null / not undefined).
  @ApiPropertyOptional({ description: 'User email (optional for phone-only Supabase users)' })
  @IsOptional()
  @ValidateIf((o: SupabaseLoginDto) => typeof o.email === 'string' && o.email.length > 0)
  @IsEmail()
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  email?: string;

  @ApiPropertyOptional({ description: 'User phone in E.164 format' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Full name from Supabase user_metadata' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ description: 'Avatar URL from Supabase user_metadata' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
