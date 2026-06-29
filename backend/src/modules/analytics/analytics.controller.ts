import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, Role } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get admin dashboard analytics' })
  getDashboard(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getDashboard(query);
  }

  @Get('seller/:sellerId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SELLER)
  @ApiOperation({ summary: 'Get seller analytics' })
  getSellerAnalytics(
    @Param('sellerId') sellerId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getSellerAnalytics(sellerId, query);
  }
}
