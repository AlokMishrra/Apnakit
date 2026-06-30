import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../config/database.config';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { ApplyCouponDto } from './dto/apply-coupon.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: string) {
    const cart = await this.prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { where: { isPrimary: true }, take: 1 },
                brand: true,
                category: true,
              },
            },
            variant: true,
          },
        },
        coupon: true,
      },
    });

    if (!cart) {
      return this.createEmptyCart(userId);
    }

    return this.calculateCartTotals(cart);
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId, isActive: true },
      include: { variants: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found or inactive');
    }

    if (dto.variantId) {
      const variant = product.variants.find(
        (v) => v.id === dto.variantId && v.isActive,
      );
      if (!variant) {
        throw new NotFoundException('Product variant not found or inactive');
      }
      if (variant.stock < dto.quantity) {
        throw new BadRequestException('Insufficient stock for this variant');
      }
    }

    const cart = await this.getOrCreateCart(userId);
    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: dto.productId,
        variantId: dto.variantId || null,
      },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + dto.quantity;
      if (dto.variantId) {
        const variant = product.variants.find((v) => v.id === dto.variantId);
        if (variant && newQuantity > variant.stock) {
          throw new BadRequestException(
            `Only ${variant.stock} items available in stock`,
          );
        }
      }
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      const price = dto.variantId
        ? product.variants.find((v) => v.id === dto.variantId)?.price
        : product.variants[0]?.price;

      if (!price) {
        throw new BadRequestException('Product has no pricing information');
      }

      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          variantId: dto.variantId || null,
          quantity: dto.quantity,
          price,
        },
      });
    }

    return this.getCart(userId);
  }

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const cart = await this.getOrCreateCart(userId);
    const cartItem = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      include: { variant: true },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    if (cartItem.variant && dto.quantity > cartItem.variant.stock) {
      throw new BadRequestException(
        `Only ${cartItem.variant.stock} items available in stock`,
      );
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
    });

    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.getOrCreateCart(userId);
    const cartItem = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.delete({ where: { id: itemId } });

    return this.getCart(userId);
  }

  async applyCoupon(userId: string, dto: ApplyCouponDto) {
    const cart = await this.getOrCreateCart(userId);

    if (!cart.items.length) {
      throw new BadRequestException('Cannot apply coupon to empty cart');
    }

    const coupon = await this.prisma.coupon.findUnique({
      where: { code: dto.code.toUpperCase() },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    if (!coupon.isActive) {
      throw new BadRequestException('Coupon is not active');
    }

    const now = new Date();
    if (now < coupon.startsAt || now > coupon.expiresAt) {
      throw new BadRequestException('Coupon has expired or is not yet valid');
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('Coupon usage limit reached');
    }

    const cartTotal = cart.items.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0,
    );

    if (coupon.minimumOrder && cartTotal < Number(coupon.minimumOrder)) {
      throw new BadRequestException(
        `Minimum order amount of ₹${coupon.minimumOrder} required for this coupon`,
      );
    }

    if (coupon.applicableCategories && Array.isArray(coupon.applicableCategories) && coupon.applicableCategories.length > 0) {
      const productIds = cart.items.map((item) => item.productId);
      const products = await this.prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { categoryId: true },
      });

      const categoryIds = products
        .map((p) => p.categoryId)
        .filter(Boolean);
      const applicableCategories = coupon.applicableCategories as string[];
      const hasApplicableProduct = categoryIds.some((id) =>
        applicableCategories.includes(id),
      );

      if (!hasApplicableProduct) {
        throw new BadRequestException(
          'Coupon is not applicable to items in your cart',
        );
      }
    }

    if (coupon.applicableBrands && Array.isArray(coupon.applicableBrands) && coupon.applicableBrands.length > 0) {
      const productIds = cart.items.map((item) => item.productId);
      const products = await this.prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { brandId: true },
      });

      const brandIds = products.map((p) => p.brandId).filter(Boolean);
      const applicableBrands = coupon.applicableBrands as string[];
      const hasApplicableProduct = brandIds.some((id) =>
        applicableBrands.includes(id),
      );

      if (!hasApplicableProduct) {
        throw new BadRequestException(
          'Coupon is not applicable to items in your cart',
        );
      }
    }

    await this.prisma.cart.update({
      where: { id: cart.id },
      data: { couponId: coupon.id },
    });

    return this.getCart(userId);
  }

  async removeCoupon(userId: string) {
    const cart = await this.getOrCreateCart(userId);

    await this.prisma.cart.update({
      where: { id: cart.id },
      data: { couponId: null },
    });

    return this.getCart(userId);
  }

  async saveForLater(userId: string, itemId: string) {
    const cart = await this.getOrCreateCart(userId);
    const cartItem = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      include: { product: true, variant: true },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.delete({ where: { id: itemId } });

    return {
      message: 'Item saved for later',
      cart: await this.getCart(userId),
    };
  }

  async moveToCart(userId: string, itemId: string) {
    return this.getCart(userId);
  }

  private async createEmptyCart(userId: string) {
    const cart = await this.prisma.cart.create({
      data: { userId, total: 0, discount: 0, tax: 0 },
      include: {
        items: true,
        coupon: true,
      },
    });

    return {
      ...cart,
      subtotal: 0,
      discount: 0,
      tax: 0,
      total: 0,
      itemCount: 0,
    };
  }

  private async getOrCreateCart(userId: string) {
    let cart = await this.prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        coupon: true,
      },
    });

    if (!cart) {
      const created = await this.prisma.cart.create({
        data: { userId, total: 0, discount: 0, tax: 0 },
      });
      cart = { ...created, items: [], coupon: null } as any;
    }

    return cart;
  }

  private async calculateCartTotals(cart: any) {
    const subtotal = cart.items.reduce(
      (sum: number, item: any) => sum + Number(item.price) * item.quantity,
      0,
    );

    let discount = 0;
    if (cart.coupon) {
      const coupon = cart.coupon;
      if (coupon.type === 'PERCENTAGE') {
        discount = (subtotal * Number(coupon.value)) / 100;
        if (coupon.maximumDiscount) {
          discount = Math.min(discount, Number(coupon.maximumDiscount));
        }
      } else if (coupon.type === 'FIXED') {
        discount = Math.min(Number(coupon.value), subtotal);
      }
    }

    const taxableAmount = subtotal - discount;
    const taxRate = 0.18;
    const tax = taxableAmount * taxRate;
    const total = taxableAmount + tax;

    await this.prisma.cart.update({
      where: { id: cart.id },
      data: {
        total,
        discount,
        tax,
      },
    });

    return {
      id: cart.id,
      userId: cart.userId,
      items: cart.items,
      coupon: cart.coupon,
      subtotal,
      discount,
      tax,
      total,
      itemCount: cart.items.reduce(
        (sum: number, item: any) => sum + item.quantity,
        0,
      ),
    };
  }
}
