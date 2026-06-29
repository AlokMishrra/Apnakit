import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../config/database.config';

@Injectable()
export class WishlistService {
  private readonly logger = new Logger(WishlistService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getWishlist(userId: string) {
    const wishlist = await this.prisma.wishlist.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            images: { where: { isPrimary: true }, take: 1 },
            brand: true,
            category: true,
            variants: {
              where: { isActive: true },
              orderBy: { price: 'asc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      items: wishlist,
      count: wishlist.length,
    };
  }

  async addToWishlist(userId: string, productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId, isActive: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found or inactive');
    }

    const existing = await this.prisma.wishlist.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (existing) {
      throw new ConflictException('Product already in wishlist');
    }

    const wishlistItem = await this.prisma.wishlist.create({
      data: { userId, productId },
      include: {
        product: {
          include: {
            images: { where: { isPrimary: true }, take: 1 },
            brand: true,
            category: true,
          },
        },
      },
    });

    return wishlistItem;
  }

  async removeFromWishlist(userId: string, productId: string) {
    const wishlistItem = await this.prisma.wishlist.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (!wishlistItem) {
      throw new NotFoundException('Product not found in wishlist');
    }

    await this.prisma.wishlist.delete({
      where: { userId_productId: { userId, productId } },
    });

    return { message: 'Product removed from wishlist' };
  }
}
