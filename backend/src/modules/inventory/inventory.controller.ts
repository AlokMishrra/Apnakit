import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, Role } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';

@ApiTags('Inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SELLER)
  @ApiOperation({ summary: 'List all inventory (Admin/Seller)' })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('warehouseId') warehouseId?: string,
    @Query('search') search?: string,
  ) {
    return this.inventoryService.findAll({ page, limit, warehouseId, search });
  }

  @Get('low-stock')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SELLER)
  @ApiOperation({ summary: 'Get low stock alerts (Admin/Seller)' })
  @ApiQuery({ name: 'threshold', required: false, type: Number })
  getLowStockItems(@Query('threshold') threshold?: number) {
    return this.inventoryService.getLowStockItems(threshold);
  }

  @Get(':productId')
  @ApiOperation({ summary: 'Get product inventory across warehouses' })
  findByProduct(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.inventoryService.findByProduct(productId);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SELLER)
  @ApiOperation({ summary: 'Update stock quantity (Admin/Seller)' })
  updateStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInventoryDto,
  ) {
    return this.inventoryService.updateStock(id, dto);
  }

  @Post('adjust')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SELLER)
  @ApiOperation({ summary: 'Adjust stock (Admin/Seller)' })
  adjustStock(@Body() dto: AdjustStockDto) {
    return this.inventoryService.adjustStock(dto);
  }

  @Post('transfer')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SELLER)
  @ApiOperation({ summary: 'Transfer stock between warehouses (Admin/Seller)' })
  transferStock(@Body() dto: TransferStockDto) {
    return this.inventoryService.transferStock(dto);
  }

  @Get(':productId/history')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SELLER)
  @ApiOperation({ summary: 'Get stock adjustment history (Admin/Seller)' })
  getHistory(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.inventoryService.getStockAdjustmentHistory(productId, {
      page,
      limit,
    });
  }
}
