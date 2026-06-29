import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';

@ApiTags('Wishlist')
@Controller('wishlist')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @ApiOperation({ summary: 'Get user wishlist' })
  getWishlist(@CurrentUser() user: CurrentUserData) {
    return this.wishlistService.getWishlist(user.id);
  }

  @Post(':productId')
  @ApiOperation({ summary: 'Add product to wishlist' })
  addToWishlist(
    @CurrentUser() user: CurrentUserData,
    @Param('productId') productId: string,
  ) {
    return this.wishlistService.addToWishlist(user.id, productId);
  }

  @Delete(':productId')
  @ApiOperation({ summary: 'Remove product from wishlist' })
  removeFromWishlist(
    @CurrentUser() user: CurrentUserData,
    @Param('productId') productId: string,
  ) {
    return this.wishlistService.removeFromWishlist(user.id, productId);
  }
}
