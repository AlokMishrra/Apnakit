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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DeliveryZonesService } from './delivery-zones.service';
import { CreateDeliveryZoneDto } from './dto/create-delivery-zone.dto';
import { UpdateDeliveryZoneDto } from './dto/update-delivery-zone.dto';
import { QueryDeliveryZonesDto } from './dto/query-delivery-zones.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, Role } from '../../common/guards/roles.guard';
import { Roles, Public } from '../../common/decorators/roles.decorator';

@ApiTags('delivery-zones')
@Controller('delivery-zones')
export class DeliveryZonesController {
  constructor(private readonly service: DeliveryZonesService) {}

  // Public serviceability check
  @Public()
  @Get('check/:pincode')
  @ApiOperation({ summary: 'Check if a pincode is serviceable (public)' })
  check(@Param('pincode') pincode: string) {
    return this.service.checkPincode(pincode);
  }

  // Public: list all unique cities (with optional ?search= filter)
  @Public()
  @Get('cities')
  @ApiOperation({ summary: 'List all serviceable cities (optionally filtered by ?search=)' })
  cities(@Query('search') search?: string) {
    return this.service.getCities(search);
  }

  // Public list (read-only)
  @Public()
  @Get()
  @ApiOperation({ summary: 'List delivery zones (public, paginated)' })
  findAll(@Query() query: QueryDeliveryZonesDto) {
    return this.service.findAll(query);
  }

  // Admin endpoints
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create a delivery zone (Admin)' })
  create(@Body() dto: CreateDeliveryZoneDto) {
    return this.service.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Update a delivery zone (Admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateDeliveryZoneDto) {
    return this.service.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a delivery zone (Admin)' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @Post('bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk activate/deactivate/delete delivery zones (Admin)' })
  bulk(@Body() body: { action: 'activate' | 'deactivate' | 'delete'; ids: string[] }) {
    return this.service.bulkAction(body.action, body.ids || []);
  }
}
