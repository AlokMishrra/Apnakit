import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SocialMediaService } from './social-media.service';
import { UpdateSocialMediaDto } from './dto/update-social-media.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, Role } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Social Media')
@Controller('social-media')
export class SocialMediaController {
  constructor(private readonly socialMediaService: SocialMediaService) {}

  @Get()
  @ApiOperation({ summary: 'Get active social media links (public)' })
  async getPublic() {
    const links = await this.socialMediaService.getPublic();
    return { links };
  }
}

@ApiTags('Admin - Social Media')
@Controller('admin/social-media')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class AdminSocialMediaController {
  constructor(private readonly socialMediaService: SocialMediaService) {}

  @Get()
  @ApiOperation({ summary: 'Get social media config (admin)' })
  async getAdmin() {
    const config = await this.socialMediaService.getAdmin();
    return { config };
  }

  @Put()
  @ApiOperation({ summary: 'Update social media config (admin)' })
  async update(@Body() dto: UpdateSocialMediaDto) {
    const config = await this.socialMediaService.update(dto);
    return { config };
  }
}
