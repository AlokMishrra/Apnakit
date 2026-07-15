import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderFilterDto } from './dto/order-filter.dto';
import { RequestReturnDto } from './dto/request-return.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, Role } from '../../common/guards/roles.guard';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create order from cart' })
  create(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List user orders with pagination and filters' })
  findAll(
    @CurrentUser() user: CurrentUserData,
    @Query() query: OrderFilterDto,
  ) {
    return this.ordersService.findAll(user.id, query);
  }

  @Get('track/:orderNumber')
  @ApiOperation({ summary: 'Track order by order number' })
  track(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.track(orderNumber);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all orders (Admin)' })
  findAllAdmin(@Query() query: OrderFilterDto) {
    return this.ordersService.findAllAdmin(query);
  }

  @Get('seller/all')
  @UseGuards(RolesGuard)
  @Roles(Role.SELLER)
  @ApiOperation({ summary: 'Get seller orders (Seller)' })
  findSellerOrders(
    @CurrentUser() user: CurrentUserData,
    @Query() query: OrderFilterDto,
  ) {
    return this.ordersService.findSellerOrders(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details with items' })
  findOne(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return this.ordersService.findOne(id, user.id);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SELLER)
  @ApiOperation({ summary: 'Update order status (Admin/Seller)' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel order' })
  cancel(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return this.ordersService.cancel(id, user.id);
  }

  @Post(':id/return')
  @ApiOperation({ summary: 'Request return' })
  requestReturn(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: RequestReturnDto,
  ) {
    return this.ordersService.requestReturn(id, user.id, dto);
  }

  @Delete('admin/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete order (Admin)' })
  deleteOrder(@Param('id') id: string) {
    return this.ordersService.deleteOrder(id);
  }
}
