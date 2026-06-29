import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LoyaltyService } from './loyalty.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';

@ApiTags('Loyalty')
@Controller('loyalty')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('points')
  @ApiOperation({ summary: 'Get loyalty points balance' })
  getPoints(@CurrentUser() user: CurrentUserData) {
    return this.loyaltyService.getPoints(user.id);
  }

  @Post('redeem')
  @ApiOperation({ summary: 'Redeem loyalty points' })
  redeem(
    @CurrentUser() user: CurrentUserData,
    @Body() body: { points: number; reference?: string },
  ) {
    return this.loyaltyService.redeem(user.id, body.points, body.reference);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get loyalty points history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getHistory(
    @CurrentUser() user: CurrentUserData,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.loyaltyService.getHistory(user.id, page, limit);
  }
}
