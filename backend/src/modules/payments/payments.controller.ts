import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, Role } from '../../common/guards/roles.guard';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-order')
  @ApiOperation({ summary: 'Create Razorpay payment order' })
  createOrder(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.createRazorpayOrder(dto);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify payment and update status' })
  verifyPayment(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: VerifyPaymentDto,
  ) {
    return this.paymentsService.verifyPayment(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment status' })
  getPaymentStatus(@Param('id') id: string) {
    return this.paymentsService.getPaymentStatus(id);
  }

  @Post('refund')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Initiate refund (Admin)' })
  initiateRefund(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: RefundPaymentDto,
  ) {
    return this.paymentsService.initiateRefund(dto);
  }
}
