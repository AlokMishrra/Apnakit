import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class TrackReferralDto {
  @IsString()
  @MinLength(4)
  @MaxLength(64)
  code: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  productSlug?: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  sessionId: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  landingUrl?: string;
}
