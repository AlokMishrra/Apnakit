import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';

@ApiTags('Wallet')
@Controller('wallet')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @ApiOperation({ summary: 'Get wallet details' })
  getWallet(@CurrentUser() user: CurrentUserData) {
    return this.walletService.getWallet(user.id);
  }

  @Post('add')
  @ApiOperation({ summary: 'Add funds to wallet' })
  addFunds(
    @CurrentUser() user: CurrentUserData,
    @Body() body: { amount: number; description?: string; reference?: string },
  ) {
    return this.walletService.addFunds(
      user.id,
      body.amount,
      body.description,
      body.reference,
    );
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get wallet transactions' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTransactions(
    @CurrentUser() user: CurrentUserData,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.walletService.getTransactions(user.id, page, limit);
  }
}
