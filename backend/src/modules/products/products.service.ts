import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../config/database.config';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { UpdateVariantsDto } from './dto/update-variants.dto';
import {
  getPaginationParams,
  paginatedResponse,
  PaginatedResult,
} from '../../common/helpers/pagination.helper';
import { generateSlug } from '../../common/helpers/slug.helper';
import { Prisma, ProductStatus } from '@prisma/client';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  private readonly productInclude = {
    brand: true,
    category: true,
    seller: {
      include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
    },
    variants: {
      where: { isActive: true },
      orderBy: { createdAt: 'asc' as const },
    },
    images: {
      orderBy: [{ isPrimary: 'desc' as const }, { sortOrder: 'asc' as const }],
    },
    specifications: {
      orderBy: { sortOrder: 'asc' as const },
    },
    faqs: {
      orderBy: { sortOrder: 'asc' as const },
    },
    reviews: {
      where: { isApproved: true },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' as const },
      take: 10,
    },
  };

  async getAdminStats(userId: string, role: string) {
    const where: Prisma.ProductWhereInput = {};
    if (role === 'SELLER') {
      where.sellerId = userId;
    }

    const [total, active, productsWithVariants] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.count({ where: { ...where, isActive: true } }),
      this.prisma.product.findMany({
        where,
        select: {
          id: true,
          variants: {
            where: { isActive: true },
            select: { stock: true },
          },
        },
      }),
    ]);

    let lowStock = 0;
    let outOfStock = 0;

    for (const product of productsWithVariants) {
      const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
      if (totalStock === 0) outOfStock++;
      else if (totalStock <= 10) lowStock++;
    }

    return { total, active, lowStock, outOfStock };
  }

  async findAll(query: FilterProductDto): Promise<PaginatedResult<any>> {
    const { page, limit, skip } = getPaginationParams({
      page: query.page,
      limit: query.limit,
    });

    const where: Prisma.ProductWhereInput = {
      isActive: true,
    };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { sku: { contains: query.search, mode: 'insensitive' } },
        { tags: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.category) {
      where.OR = [
        { category: { slug: query.category } },
        { category: { parent: { slug: query.category } } },
        { categoryId: query.category },
      ];
    }

    if (query.brand) {
      where.brand = {
        OR: [
          { id: query.brand },
          { slug: query.brand },
        ],
      };
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.variants = {
        some: {
          isActive: true,
          ...(query.minPrice !== undefined && { price: { gte: query.minPrice } }),
          ...(query.maxPrice !== undefined && { price: { lte: query.maxPrice } }),
        },
      };
    }

    if (query.rating) {
      where.reviews = {
        some: {
          isApproved: true,
          rating: { gte: query.rating },
        },
      };
    }

    if (query.availability !== undefined) {
      if (query.availability) {
        where.variants = {
          ...where.variants as any,
          some: {
            ...(where.variants as any)?.some,
            stock: { gt: 0 },
          },
        };
      }
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput = this.buildOrderBy(
      query.sortBy,
      query.sortOrder,
    );

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          brand: true,
          category: true,
          variants: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              price: true,
              compareAtPrice: true,
              stock: true,
              attributes: true,
            },
            orderBy: { createdAt: 'asc' },
          },
          images: {
            take: 1,
            orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
          },
          reviews: {
            where: { isApproved: true },
            select: { rating: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    const enriched = products.map((product) => {
      const ratings = product.reviews.map((r) => r.rating);
      const avgRating = ratings.length
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;
      const { reviews, ...rest } = product;
      return {
        ...rest,
        averageRating: Math.round(avgRating * 10) / 10,
        reviewCount: ratings.length,
        minPrice: product.variants.length
          ? Math.min(...product.variants.map((v) => Number(v.price)))
          : null,
        maxPrice: product.variants.length
          ? Math.max(...product.variants.map((v) => Number(v.price)))
          : null,
        totalStock: product.variants.reduce((sum, v) => sum + v.stock, 0),
      };
    });

    return paginatedResponse(enriched, total, page, limit);
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: this.productInclude,
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    const ratings = product.reviews.map((r) => r.rating);
    const avgRating = ratings.length
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0;

    const ratingDistribution = [1, 2, 3, 4, 5].reduce((acc, star) => {
      acc[star] = ratings.filter((r) => r === star).length;
      return acc;
    }, {} as Record<number, number>);

    return {
      ...product,
      averageRating: Math.round(avgRating * 10) / 10,
      reviewCount: ratings.length,
      ratingDistribution,
      minPrice: product.variants.length
        ? Math.min(...product.variants.map((v) => Number(v.price)))
        : null,
      maxPrice: product.variants.length
        ? Math.max(...product.variants.map((v) => Number(v.price)))
        : null,
      totalStock: product.variants.reduce((sum, v) => sum + v.stock, 0),
    };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: this.productInclude,
    });

    if (!product) {
      throw new NotFoundException(`Product with slug "${slug}" not found`);
    }

    const ratings = product.reviews.map((r) => r.rating);
    const avgRating = ratings.length
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0;

    const ratingDistribution = [1, 2, 3, 4, 5].reduce((acc, star) => {
      acc[star] = ratings.filter((r) => r === star).length;
      return acc;
    }, {} as Record<number, number>);

    return {
      ...product,
      averageRating: Math.round(avgRating * 10) / 10,
      reviewCount: ratings.length,
      ratingDistribution,
      minPrice: product.variants.length
        ? Math.min(...product.variants.map((v) => Number(v.price)))
        : null,
      maxPrice: product.variants.length
        ? Math.max(...product.variants.map((v) => Number(v.price)))
        : null,
      totalStock: product.variants.reduce((sum, v) => sum + v.stock, 0),
    };
  }

  async findRelated(id: string, limit = 8) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { categoryId: true, brandId: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    const where: Prisma.ProductWhereInput = {
      id: { not: id },
      isActive: true,
      ...(product.categoryId && { categoryId: product.categoryId }),
    };

    const related = await this.prisma.product.findMany({
      where,
      include: {
        brand: true,
        category: true,
        variants: {
          where: { isActive: true },
          select: { price: true, compareAtPrice: true, stock: true },
        },
        images: {
          take: 1,
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
        },
        reviews: {
          where: { isApproved: true },
          select: { rating: true },
        },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return this.enrichProducts(related);
  }

  async findSimilar(id: string, limit = 8) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { categoryId: true, brandId: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    const where: Prisma.ProductWhereInput = {
      id: { not: id },
      isActive: true,
      ...(product.categoryId && { categoryId: product.categoryId }),
      ...(product.brandId && { brandId: product.brandId }),
    };

    const similar = await this.prisma.product.findMany({
      where,
      include: {
        brand: true,
        category: true,
        variants: {
          where: { isActive: true },
          select: { price: true, compareAtPrice: true, stock: true },
        },
        images: {
          take: 1,
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
        },
        reviews: {
          where: { isApproved: true },
          select: { rating: true },
        },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return this.enrichProducts(similar);
  }

  async findFeatured(limit = 12) {
    const products = await this.prisma.product.findMany({
      where: { isFeatured: true, isActive: true },
      include: {
        brand: true,
        category: true,
        variants: {
          where: { isActive: true },
          select: { price: true, compareAtPrice: true, stock: true },
        },
        images: {
          take: 1,
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
        },
        reviews: {
          where: { isApproved: true },
          select: { rating: true },
        },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return this.enrichProducts(products);
  }

  async findTrending(limit = 12) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trendingProducts = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        createdAt: { gte: thirtyDaysAgo },
        order: {
          status: { notIn: ['CANCELLED', 'RETURNED'] },
        },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    if (trendingProducts.length === 0) {
      return this.findFeatured(limit);
    }

    const productIds = trendingProducts.map((p) => p.productId);

    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: {
        brand: true,
        category: true,
        variants: {
          where: { isActive: true },
          select: { price: true, compareAtPrice: true, stock: true },
        },
        images: {
          take: 1,
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
        },
        reviews: {
          where: { isApproved: true },
          select: { rating: true },
        },
      },
    });

    const ordered = productIds
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean);

    return this.enrichProducts(ordered as any[]);
  }

  async findBestsellers(limit = 12) {
    const bestsellers = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          status: { notIn: ['CANCELLED', 'RETURNED'] },
        },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    if (bestsellers.length === 0) {
      return this.findFeatured(limit);
    }

    const productIds = bestsellers.map((p) => p.productId);

    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: {
        brand: true,
        category: true,
        variants: {
          where: { isActive: true },
          select: { price: true, compareAtPrice: true, stock: true },
        },
        images: {
          take: 1,
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
        },
        reviews: {
          where: { isApproved: true },
          select: { rating: true },
        },
      },
    });

    const ordered = productIds
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean);

    return this.enrichProducts(ordered as any[]);
  }

  async create(dto: CreateProductDto, userId: string) {
    const slug = await this.generateUniqueSlug(dto.name);

    let sellerId: string;
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (seller) {
      sellerId = seller.id;
    } else {
      const adminUser = await this.prisma.user.findUnique({ where: { id: userId } });
      if (adminUser?.role === 'ADMIN') {
        let defaultSeller = await this.prisma.seller.findFirst();
        if (!defaultSeller) {
          defaultSeller = await this.prisma.seller.create({
            data: {
              userId,
              businessName: 'ApnaKit Store',
              businessType: 'INDIVIDUAL',
              isVerified: true,
              isActive: true,
            },
          });
        }
        sellerId = defaultSeller.id;
      } else {
        throw new BadRequestException('No seller profile found for this user.');
      }
    }

    if (dto.sku) {
      const existingSku = await this.prisma.product.findUnique({
        where: { sku: dto.sku },
      });
      if (existingSku) {
        throw new BadRequestException(`Product with SKU "${dto.sku}" already exists`);
      }
    }

    if (dto.variants) {
      const skus = dto.variants.map((v) => v.sku);
      const uniqueSkus = new Set(skus);
      if (uniqueSkus.size !== skus.length) {
        throw new BadRequestException('Variant SKUs must be unique');
      }
    }

    const variantsToCreate = dto.variants && dto.variants.length > 0
      ? dto.variants.map((v, i) => ({
          name: v.name,
          sku: v.sku || `VAR-${Date.now()}-${i}`,
          price: v.price,
          compareAtPrice: v.compareAtPrice,
          costPrice: v.costPrice,
          stock: v.stock,
          weight: v.weight,
          attributes: v.attributes ?? Prisma.JsonNull,
          barcode: v.barcode,
          isActive: v.isActive ?? true,
        }))
      : [{
          name: 'Default',
          sku: dto.sku || `VAR-${Date.now()}-0`,
          price: dto.price || 0,
          stock: dto.stock || 0,
          isActive: true,
        }];

    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        shortDescription: dto.shortDescription,
        sku: dto.sku || `SKU-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        barcode: dto.barcode,
        isFeatured: dto.isFeatured ?? false,
        isActive: dto.isActive ?? true,
        metaTitle: dto.metaTitle,
        metaDescription: dto.metaDescription,
        tags: dto.tags,
        sellerId,
        categoryId: dto.categoryId,
        brandId: dto.brandId,
        variants: {
          create: variantsToCreate,
        },
        ...(dto.images && {
          images: {
            create: dto.images.map((img, index) => ({
              url: img.url,
              alt: img.alt,
              sortOrder: img.sortOrder ?? index,
              isPrimary: img.isPrimary ?? false,
              variantId: img.variantId,
            })),
          },
        }),
        ...(dto.specifications && {
          specifications: {
            create: dto.specifications.map((spec) => ({
              groupId: spec.groupId,
              name: spec.name,
              value: spec.value,
              sortOrder: spec.sortOrder ?? 0,
            })),
          },
        }),
        ...(dto.faqs && {
          faqs: {
            create: dto.faqs.map((faq) => ({
              question: faq.question,
              answer: faq.answer,
              sortOrder: faq.sortOrder ?? 0,
            })),
          },
        }),
      },
      include: {
        brand: true,
        category: true,
        variants: true,
        images: true,
        specifications: true,
        faqs: true,
      },
    });

    this.logger.log(`Product created: ${product.id} - ${product.name}`);
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    if (dto.sku && dto.sku !== existing.sku) {
      const skuExists = await this.prisma.product.findUnique({
        where: { sku: dto.sku },
      });
      if (skuExists) {
        throw new BadRequestException(`Product with SKU "${dto.sku}" already exists`);
      }
    }

    let slug = existing.slug;
    if (dto.name && dto.name !== existing.name) {
      slug = await this.generateUniqueSlug(dto.name, id);
    }

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (slug !== existing.slug) updateData.slug = slug;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.shortDescription !== undefined) updateData.shortDescription = dto.shortDescription;
    if (dto.sku !== undefined) updateData.sku = dto.sku;
    if (dto.barcode !== undefined) updateData.barcode = dto.barcode;
    if (dto.isFeatured !== undefined) updateData.isFeatured = dto.isFeatured;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.metaTitle !== undefined) updateData.metaTitle = dto.metaTitle;
    if (dto.metaDescription !== undefined) updateData.metaDescription = dto.metaDescription;
    if (dto.tags !== undefined) updateData.tags = dto.tags;
    if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId || null;
    if (dto.brandId !== undefined) updateData.brandId = dto.brandId || null;

    const product = await this.prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        brand: true,
        category: true,
        variants: true,
        images: true,
        specifications: true,
        faqs: true,
      },
    });

    if (dto.variants && dto.variants.length > 0) {
      const existingVariants = await this.prisma.productVariant.findMany({
        where: { productId: id },
      });

      for (let index = 0; index < dto.variants.length; index++) {
        const v = dto.variants[index];
        const matched = existingVariants.find((ev) => ev.sku === v.sku);
        if (matched) {
          await this.prisma.productVariant.update({
            where: { id: matched.id },
            data: {
              name: v.name,
              price: v.price,
              stock: v.stock,
              compareAtPrice: v.compareAtPrice,
              costPrice: v.costPrice,
              weight: v.weight,
              attributes: v.attributes as any,
            },
          });
        } else {
          await this.prisma.productVariant.create({
            data: {
              productId: id,
              name: v.name,
              sku: v.sku,
              price: v.price,
              stock: v.stock,
              compareAtPrice: v.compareAtPrice,
              costPrice: v.costPrice,
              weight: v.weight,
              attributes: v.attributes as any,
            },
          });
        }
      }
    }

    this.logger.log(`Product updated: ${product.id}`);
    return product;
  }

  async remove(id: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    this.logger.log(`Product soft-deleted: ${id}`);
    return { message: 'Product deleted successfully' };
  }

  async hardRemove(id: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    await this.prisma.product.delete({ where: { id } });
    this.logger.log(`Product hard-deleted: ${id}`);
    return { message: 'Product permanently deleted' };
  }

  async uploadImages(productId: string, files: Express.Multer.File[]) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID "${productId}" not found`);
    }

    const imageRecords = await Promise.all(
      files.map(async (file, index) => {
        const result = await this.uploadService.uploadImage(file, 'products');
        return this.prisma.productImage.create({
          data: {
            productId,
            url: result.url,
            alt: file.originalname,
            sortOrder: index,
            isPrimary: index === 0,
          },
        });
      }),
    );

    this.logger.log(`Uploaded ${imageRecords.length} images for product ${productId}`);
    return imageRecords;
  }

  async addImagesByUrls(productId: string, urls: string[], alt?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID "${productId}" not found`);
    }

    if (!urls || urls.length === 0) {
      throw new BadRequestException('At least one image URL is required');
    }

    const existingCount = await this.prisma.productImage.count({
      where: { productId },
    });

    const imageRecords = await Promise.all(
      urls.map((url, index) =>
        this.prisma.productImage.create({
          data: {
            productId,
            url: url.trim(),
            alt: alt || `Product image ${existingCount + index + 1}`,
            sortOrder: existingCount + index,
            isPrimary: existingCount === 0 && index === 0,
          },
        }),
      ),
    );

    this.logger.log(`Added ${imageRecords.length} image URLs for product ${productId}`);
    return imageRecords;
  }

  async deleteImage(productId: string, imageId: string) {
    const image = await this.prisma.productImage.findFirst({
      where: { id: imageId, productId },
    });
    if (!image) {
      throw new NotFoundException(`Image not found for this product`);
    }
    await this.prisma.productImage.delete({ where: { id: imageId } });
    return { message: 'Image deleted successfully' };
  }

  async deleteImages(productId: string, imageIds: string[]) {
    await this.prisma.productImage.deleteMany({
      where: { id: { in: imageIds }, productId },
    });
    return { message: `${imageIds.length} image(s) deleted` };
  }

  async setPrimaryImage(productId: string, imageId: string) {
    const image = await this.prisma.productImage.findFirst({
      where: { id: imageId, productId },
    });
    if (!image) {
      throw new NotFoundException(`Image not found for this product`);
    }
    await this.prisma.productImage.updateMany({
      where: { productId },
      data: { isPrimary: false },
    });
    await this.prisma.productImage.update({
      where: { id: imageId },
      data: { isPrimary: true },
    });
    return { message: 'Primary image set successfully' };
  }

  async updateVariants(productId: string, dto: UpdateVariantsDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { variants: true },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID "${productId}" not found`);
    }

    const results = await Promise.all(
      dto.variants.map(async (variant) => {
        if (variant.id) {
          const existingVariant = product.variants.find((v) => v.id === variant.id);
          if (!existingVariant) {
            throw new BadRequestException(`Variant "${variant.id}" not found for this product`);
          }

          if (variant.sku !== existingVariant.sku) {
            const skuExists = await this.prisma.productVariant.findUnique({
              where: { sku: variant.sku },
            });
            if (skuExists) {
              throw new BadRequestException(`Variant SKU "${variant.sku}" already exists`);
            }
          }

          return this.prisma.productVariant.update({
            where: { id: variant.id },
            data: {
              name: variant.name,
              sku: variant.sku,
              price: variant.price,
              compareAtPrice: variant.compareAtPrice,
              costPrice: variant.costPrice,
              stock: variant.stock,
              weight: variant.weight,
              attributes: variant.attributes ?? undefined,
              barcode: variant.barcode,
              isActive: variant.isActive,
            },
          });
        }

        const skuExists = await this.prisma.productVariant.findUnique({
          where: { sku: variant.sku },
        });
        if (skuExists) {
          throw new BadRequestException(`Variant SKU "${variant.sku}" already exists`);
        }

        return this.prisma.productVariant.create({
          data: {
            productId,
            name: variant.name,
            sku: variant.sku,
            price: variant.price,
            compareAtPrice: variant.compareAtPrice,
            costPrice: variant.costPrice,
            stock: variant.stock,
            weight: variant.weight,
            attributes: variant.attributes ?? Prisma.JsonNull,
            barcode: variant.barcode,
            isActive: variant.isActive ?? true,
          },
        });
      }),
    );

    this.logger.log(`Updated ${results.length} variants for product ${productId}`);
    return results;
  }

  private buildOrderBy(
    sortBy?: string,
    sortOrder?: string,
  ): Prisma.ProductOrderByWithRelationInput {
    const order = sortOrder === 'asc' ? 'asc' : 'desc';

    switch (sortBy) {
      case 'name':
        return { name: order as Prisma.SortOrder };
      case 'price':
        return { variants: { _count: order as Prisma.SortOrder } };
      case 'rating':
        return { reviews: { _count: order as Prisma.SortOrder } };
      case 'popularity':
        return { orderItems: { _count: order as Prisma.SortOrder } };
      case 'createdAt':
      default:
        return { createdAt: order as Prisma.SortOrder };
    }
  }

  private enrichProducts(products: any[]) {
    return products.map((product) => {
      const ratings = product.reviews?.map((r: any) => r.rating) || [];
      const avgRating = ratings.length
        ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
        : 0;
      const { reviews, ...rest } = product;
      return {
        ...rest,
        averageRating: Math.round(avgRating * 10) / 10,
        reviewCount: ratings.length,
        minPrice: product.variants?.length
          ? Math.min(...product.variants.map((v: any) => Number(v.price || v.compareAtPrice || 0)))
          : null,
        maxPrice: product.variants?.length
          ? Math.max(...product.variants.map((v: any) => Number(v.price || 0)))
          : null,
        totalStock: product.variants?.reduce((sum: number, v: any) => sum + (v.stock || 0), 0) ?? 0,
      };
    });
  }

  private async generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
    let slug = generateSlug(name);
    let counter = 0;

    while (true) {
      const existing = await this.prisma.product.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (!existing || (excludeId && existing.id === excludeId)) {
        return slug;
      }

      counter++;
      slug = `${generateSlug(name)}-${counter}`;
    }
  }

  private mockS3Upload(file: Express.Multer.File): string {
    const bucket = process.env.S3_BUCKET || 'ecommerce-uploads';
    const region = process.env.S3_REGION || 'ap-south-1';
    const key = `products/${Date.now()}-${file.originalname}`;
    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  }
}
