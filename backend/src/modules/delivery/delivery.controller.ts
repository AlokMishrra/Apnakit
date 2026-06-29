import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';
import { AssignDeliveryDto } from './dto/assign-delivery.dto';
import { CreateDeliveryPartnerDto } from './dto/create-delivery.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, Role } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';

@ApiTags('Delivery')
@Controller('delivery')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new delivery partner (Admin)' })
  create(@Body() dto: CreateDeliveryPartnerDto) {
    return this.deliveryService.create(dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all delivery partners (Admin)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.deliveryService.findAll({ page, limit, search });
  }

  @Get('assignments')
  @UseGuards(RolesGuard)
  @Roles(Role.DELIVERY, Role.ADMIN)
  @ApiOperation({ summary: 'Get assigned orders for delivery partner' })
  async getAssignedOrders(
    @CurrentUser() user: CurrentUserData,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    const partnerId = await this.deliveryService.resolvePartnerId(user.id);
    return this.deliveryService.getAssignedOrders(partnerId, {
      page,
      limit,
      status,
    });
  }

  @Patch('assignments/:id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.DELIVERY, Role.ADMIN)
  @ApiOperation({ summary: 'Update delivery status' })
  async updateDeliveryStatus(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: UpdateDeliveryStatusDto,
  ) {
    const partnerId = await this.deliveryService.resolvePartnerId(user.id);
    return this.deliveryService.updateDeliveryStatus(id, partnerId, dto);
  }

  @Patch('availability')
  @UseGuards(RolesGuard)
  @Roles(Role.DELIVERY, Role.ADMIN)
  @ApiOperation({ summary: 'Toggle delivery partner availability' })
  async toggleAvailability(
    @CurrentUser() user: CurrentUserData,
    @Body('isAvailable') isAvailable: boolean,
  ) {
    const partnerId = await this.deliveryService.resolvePartnerId(user.id);
    return this.deliveryService.toggleAvailability(partnerId, { isAvailable });
  }

  @Get('earnings')
  @UseGuards(RolesGuard)
  @Roles(Role.DELIVERY, Role.ADMIN)
  @ApiOperation({ summary: 'Get delivery partner earnings' })
  @ApiQuery({ name: 'period', required: false, enum: ['today', 'week', 'month', 'year'] })
  async getEarnings(
    @CurrentUser() user: CurrentUserData,
    @Query('period') period?: 'today' | 'week' | 'month' | 'year',
  ) {
    const partnerId = await this.deliveryService.resolvePartnerId(user.id);
    return this.deliveryService.getEarnings(partnerId, { period });
  }

  @Get('route')
  @UseGuards(RolesGuard)
  @Roles(Role.DELIVERY, Role.ADMIN)
  @ApiOperation({ summary: 'Get optimized delivery route' })
  async getRoute(@CurrentUser() user: CurrentUserData) {
    const partnerId = await this.deliveryService.resolvePartnerId(user.id);
    return this.deliveryService.calculateRoute(partnerId);
  }

  @Post('assign')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Auto-assign delivery partner to order (Admin)' })
  assignDeliveryPartner(@Body() dto: AssignDeliveryDto) {
    return this.deliveryService.assignDeliveryPartner(dto);
  }

  @Patch('location')
  @UseGuards(RolesGuard)
  @Roles(Role.DELIVERY, Role.ADMIN)
  @ApiOperation({ summary: 'Update delivery partner location' })
  async updateLocation(
    @CurrentUser() user: CurrentUserData,
    @Body() data: { latitude: string; longitude: string },
  ) {
    const partnerId = await this.deliveryService.resolvePartnerId(user.id);
    return this.deliveryService.updateLocation(partnerId, data);
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(Role.DELIVERY, Role.ADMIN)
  @ApiOperation({ summary: 'Get delivery partner stats' })
  async getPartnerStats(@CurrentUser() user: CurrentUserData) {
    const partnerId = await this.deliveryService.resolvePartnerId(user.id);
    return this.deliveryService.getPartnerStats(partnerId);
  }
}
