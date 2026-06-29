import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AppBannerService } from './app-banner.service';
import { UpdateAppBannerConfigDto } from './dto/update-app-banner-config.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, Role } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('App Banner')
@Controller('app-banner')
export class AppBannerController {
  constructor(private readonly appBannerService: AppBannerService) {}

  @Get()
  @ApiOperation({ summary: 'Get active app banner config (public)' })
  async getPublic() {
    const config = await this.appBannerService.getPublic();
    return { config };
  }
}

@ApiTags('Admin - App Banner')
@Controller('admin/app-banner')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class AdminAppBannerController {
  constructor(private readonly appBannerService: AppBannerService) {}

  @Get()
  @ApiOperation({ summary: 'Get app banner config (admin)' })
  async getAdmin() {
    const config = await this.appBannerService.getAdmin();
    return { config };
  }

  @Put()
  @ApiOperation({ summary: 'Update app banner config (admin)' })
  async update(@Body() dto: UpdateAppBannerConfigDto) {
    const config = await this.appBannerService.update(dto);
    return { config };
  }
}
