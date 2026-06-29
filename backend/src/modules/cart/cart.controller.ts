import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { ApplyCouponDto } from './dto/apply-coupon.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentUserData } from '../../common/decorators/current-user.decorator';

@ApiTags('Cart')
@Controller('cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get user cart' })
  getCart(@CurrentUser() user: CurrentUserData) {
    return this.cartService.getCart(user.id);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add item to cart' })
  addItem(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: AddCartItemDto,
  ) {
    return this.cartService.addItem(user.id, dto);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update cart item quantity' })
  updateItem(
    @CurrentUser() user: CurrentUserData,
    @Param('id') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(user.id, itemId, dto);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Remove item from cart' })
  removeItem(
    @CurrentUser() user: CurrentUserData,
    @Param('id') itemId: string,
  ) {
    return this.cartService.removeItem(user.id, itemId);
  }

  @Post('coupon')
  @ApiOperation({ summary: 'Apply coupon to cart' })
  applyCoupon(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: ApplyCouponDto,
  ) {
    return this.cartService.applyCoupon(user.id, dto);
  }

  @Delete('coupon')
  @ApiOperation({ summary: 'Remove coupon from cart' })
  removeCoupon(@CurrentUser() user: CurrentUserData) {
    return this.cartService.removeCoupon(user.id);
  }

  @Post('save-later/:itemId')
  @ApiOperation({ summary: 'Save cart item for later' })
  saveForLater(
    @CurrentUser() user: CurrentUserData,
    @Param('itemId') itemId: string,
  ) {
    return this.cartService.saveForLater(user.id, itemId);
  }

  @Post('move-to-cart/:itemId')
  @ApiOperation({ summary: 'Move saved item to cart' })
  moveToCart(
    @CurrentUser() user: CurrentUserData,
    @Param('itemId') itemId: string,
  ) {
    return this.cartService.moveToCart(user.id, itemId);
  }
}
