import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsString, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CategoryOrderItem {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  sortOrder: number;
}

export class ReorderCategoriesDto {
  @ApiProperty({ type: [CategoryOrderItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryOrderItem)
  orders: CategoryOrderItem[];
}
