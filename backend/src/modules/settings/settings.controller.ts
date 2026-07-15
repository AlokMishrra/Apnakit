import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all store settings' })
  async getSettings() {
    return this.settingsService.getSettings();
  }

  @Get('store-status')
  @ApiOperation({ summary: 'Get current store open/close status (public)' })
  async getStoreStatus() {
    return this.settingsService.getStoreStatus();
  }

  @Get('delivery')
  @ApiOperation({ summary: 'Get delivery settings' })
  async getDeliverySettings() {
    return this.settingsService.getDeliverySettings();
  }

  @Get('tax')
  @ApiOperation({ summary: 'Get tax/GST settings' })
  async getTaxSettings() {
    return this.settingsService.getTaxSettings();
  }

  @Put('delivery')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update delivery settings (admin only)' })
  async updateDeliverySettings(@Body() body: any) {
    return this.settingsService.updateDeliverySettings(body);
  }

  @Put('tax')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update tax/GST settings (admin only)' })
  async updateTaxSettings(@Body() body: any) {
    return this.settingsService.updateTaxSettings(body);
  }

  @Put('store')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update store settings (admin only)' })
  async updateStoreSettings(@Body() body: any) {
    return this.settingsService.updateStoreSettings(body);
  }

  @Get('payment')
  @ApiOperation({ summary: 'Get payment settings' })
  async getPaymentSettings() {
    return this.settingsService.getPaymentSettings();
  }

  @Put('payment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update payment settings (admin only)' })
  async updatePaymentSettings(@Body() body: any) {
    return this.settingsService.updatePaymentSettings(body);
  }
}
