import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BannerPosition, BannerMediaType } from '@prisma/client';

export class CreateBannerDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiProperty()
  @IsString()
  image: string;

  @ApiPropertyOptional({ enum: BannerMediaType, default: BannerMediaType.IMAGE })
  @IsOptional()
  @IsEnum(BannerMediaType)
  mediaType?: BannerMediaType;

  @ApiPropertyOptional({ default: false, description: 'If true and banner is a video, it loops in the hero without advancing to next slide' })
  @IsOptional()
  @IsBoolean()
  loopVideo?: boolean;

  @ApiPropertyOptional({ default: true, description: 'Show the title text overlay on the banner' })
  @IsOptional()
  @IsBoolean()
  showTitle?: boolean;

  @ApiPropertyOptional({ default: true, description: 'Show the subtitle text overlay on the banner' })
  @IsOptional()
  @IsBoolean()
  showSubtitle?: boolean;

  @ApiPropertyOptional({ default: true, description: 'Show the Shop Now call-to-action button' })
  @IsOptional()
  @IsBoolean()
  showButton?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  link?: string;

  @ApiPropertyOptional({ enum: BannerPosition, default: BannerPosition.HERO })
  @IsOptional()
  @IsEnum(BannerPosition)
  position?: BannerPosition;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
