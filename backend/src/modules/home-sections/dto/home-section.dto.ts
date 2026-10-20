import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  ArrayMinSize,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HomeSectionKey } from '@prisma/client';

export class UpsertHomeSectionItemDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * Replaces the whole ordered product list for a section in one call. The admin
 * UI edits a list, so sending the complete set avoids order/partial-state bugs
 * that incremental add/remove endpoints invite.
 */
export class ReplaceHomeSectionItemsDto {
  @ApiProperty({ type: [UpsertHomeSectionItemDto] })
  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => UpsertHomeSectionItemDto)
  items: UpsertHomeSectionItemDto[];
}

export class UpdateHomeSectionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class AddHomeSectionItemDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

/** Replaces the whole ordered category list for a section. */
export class ReplaceHomeSectionCategoriesDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(0)
  @IsString({ each: true })
  categoryIds: string[];
}

export class AddHomeSectionCategoryDto {
  @ApiProperty()
  @IsString()
  categoryId: string;
}

export type { HomeSectionKey };
