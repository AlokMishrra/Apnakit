import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../config/database.config';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { generateSlug } from '../../common/helpers/slug.helper';

@Injectable()
export class BrandsService {
  private readonly logger = new Logger(BrandsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.brand.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true } },
      },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with id "${id}" not found`);
    }

    return brand;
  }

  async findBySlug(slug: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { slug },
      include: {
        products: {
          where: { isActive: true },
          include: {
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
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { products: true } },
      },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with slug "${slug}" not found`);
    }

    const enrichedProducts = brand.products.map((product) => {
      const ratings = product.reviews.map((r) => r.rating);
      const avgRating = ratings.length
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;
      const { reviews, ...rest } = product;
      return {
        ...rest,
        averageRating: Math.round(avgRating * 10) / 10,
        reviewCount: ratings.length,
      };
    });

    return {
      ...brand,
      products: enrichedProducts,
    };
  }

  async findOne(id: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true } },
      },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID "${id}" not found`);
    }

    return brand;
  }

  async create(dto: CreateBrandDto) {
    const slug = dto.slug || generateSlug(dto.name);

    const existingSlug = await this.prisma.brand.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      throw new ConflictException(`Brand with slug "${slug}" already exists`);
    }

    const brand = await this.prisma.brand.create({
      data: {
        name: dto.name,
        slug,
        logo: dto.logo,
        description: dto.description,
        website: dto.website,
        isActive: dto.isActive ?? true,
        metaTitle: dto.metaTitle,
        metaDescription: dto.metaDescription,
      },
      include: {
        _count: { select: { products: true } },
      },
    });

    this.logger.log(`Brand created: ${brand.id} - ${brand.name}`);
    return brand;
  }

  async update(id: string, dto: UpdateBrandDto) {
    const existing = await this.prisma.brand.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Brand with ID "${id}" not found`);
    }

    if (dto.slug && dto.slug !== existing.slug) {
      const slugExists = await this.prisma.brand.findUnique({
        where: { slug: dto.slug },
      });
      if (slugExists) {
        throw new ConflictException(`Brand with slug "${dto.slug}" already exists`);
      }
    }

    let slug = existing.slug;
    if (dto.name && dto.name !== existing.name && !dto.slug) {
      slug = generateSlug(dto.name);
      const slugExists = await this.prisma.brand.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (slugExists && slugExists.id !== id) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    const brand = await this.prisma.brand.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug || slug,
        logo: dto.logo,
        description: dto.description,
        website: dto.website,
        isActive: dto.isActive,
        metaTitle: dto.metaTitle,
        metaDescription: dto.metaDescription,
      },
      include: {
        _count: { select: { products: true } },
      },
    });

    this.logger.log(`Brand updated: ${brand.id}`);
    return brand;
  }

  async remove(id: string) {
    const existing = await this.prisma.brand.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true } },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Brand with ID "${id}" not found`);
    }

    if (existing._count.products > 0) {
      throw new ConflictException(
        `Cannot delete brand with ${existing._count.products} products. Reassign products first.`,
      );
    }

    await this.prisma.brand.delete({ where: { id } });
    this.logger.log(`Brand deleted: ${id}`);
    return { message: 'Brand deleted successfully' };
  }
}
