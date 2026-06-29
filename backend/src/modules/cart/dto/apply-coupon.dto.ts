import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApplyCouponDto {
  @ApiProperty({ example: 'SAVE10', description: 'Coupon code' })
  @IsString()
  code: string;
}
