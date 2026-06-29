import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SellersService } from './sellers.service';
import { CreateSellerDto } from './dto/create-seller.dto';
import { UpdateSellerDto } from './dto/update-seller.dto';
import { VerifySellerDto } from './dto/verify-seller.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, Role } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';

@ApiTags('Sellers')
@Controller('sellers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new seller (Admin)' })
  @ApiBearerAuth()
  create(@Body() dto: CreateSellerDto) {
    return this.sellersService.create(dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all sellers (Admin)' })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('isVerified') isVerified?: boolean,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.sellersService.findAll({
      page,
      limit,
      search,
      isVerified,
      isActive,
    });
  }

  @Get('dashboard')
  @UseGuards(RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  @ApiOperation({ summary: 'Get own dashboard stats (Seller/Admin)' })
  getMyDashboard(@CurrentUser() user: CurrentUserData) {
    return this.sellersService.getDashboardStats(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get seller details' })
  findOne(@Param('id') id: string) {
    return this.sellersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  @ApiOperation({ summary: 'Update seller profile' })
  update(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: UpdateSellerDto,
  ) {
    return this.sellersService.update(id, dto);
  }

  @Patch(':id/verify')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Verify/unverify seller (Admin)' })
  verifySeller(
    @Param('id') id: string,
    @Body() dto: VerifySellerDto,
  ) {
    return this.sellersService.verifySeller(id, dto);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Activate/deactivate seller (Admin)' })
  updateStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.sellersService.updateStatus(id, isActive);
  }

  @Get(':id/dashboard')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get seller dashboard stats (Admin)' })
  getDashboard(@Param('id') id: string) {
    return this.sellersService.getDashboardStats(id);
  }

  @Patch(':id/commission')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update seller commission rate (Admin)' })
  updateCommission(
    @Param('id') id: string,
    @Body('commissionRate') commissionRate: number,
  ) {
    return this.sellersService.updateCommission(id, commissionRate);
  }
}
