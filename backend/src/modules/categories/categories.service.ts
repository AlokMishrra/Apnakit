import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../config/database.config';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { generateSlug } from '../../common/helpers/slug.helper';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const categories = await this.prisma.category.findMany({
      where: { parentId: null, isActive: true },
      include: {
        children: {
          where: { isActive: true },
          include: {
            children: {
              where: { isActive: true },
              include: {
                children: {
                  where: { isActive: true },
                  orderBy: { sortOrder: 'asc' },
                },
                _count: { select: { products: true } },
              },
              orderBy: { sortOrder: 'asc' },
            },
            _count: { select: { products: true } },
          },
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { products: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return categories;
  }

  async findAllFlat() {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
        _count: { select: { products: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return categories;
  }

  async findBySlug(slugOrId: string) {
    // Try by ID first (CUIDs start with 'c'), then by slug
    let category;
    if (slugOrId.startsWith('c')) {
      category = await this.prisma.category.findUnique({
        where: { id: slugOrId },
        include: {
          parent: {
            select: { id: true, name: true, slug: true },
          },
          children: {
            where: { isActive: true },
            include: {
              children: {
                where: { isActive: true },
                include: {
                  _count: { select: { products: true } },
                },
                orderBy: { sortOrder: 'asc' },
              },
              _count: { select: { products: true } },
            },
            orderBy: { sortOrder: 'asc' },
          },
          _count: { select: { products: true } },
        },
      });
    }
    if (!category) {
      category = await this.prisma.category.findUnique({
        where: { slug: slugOrId },
        include: {
          parent: {
            select: { id: true, name: true, slug: true },
          },
          children: {
            where: { isActive: true },
            include: {
              children: {
                where: { isActive: true },
                include: {
                  _count: { select: { products: true } },
                },
                orderBy: { sortOrder: 'asc' },
              },
              _count: { select: { products: true } },
            },
            orderBy: { sortOrder: 'asc' },
          },
          _count: { select: { products: true } },
        },
      });
    }

    if (!category) {
      throw new NotFoundException(`Category "${slugOrId}" not found`);
    }

    return category;
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
        children: {
          where: { isActive: true },
          include: {
            _count: { select: { products: true } },
          },
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    return category;
  }

  async create(dto: CreateCategoryDto) {
    const slug = dto.slug || generateSlug(dto.name);

    const existingSlug = await this.prisma.category.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      throw new ConflictException(`Category with slug "${slug}" already exists`);
    }

    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException(`Parent category with ID "${dto.parentId}" not found`);
      }
    }

    const category = await this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        image: dto.image,
        parentId: dto.parentId,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
        isComingSoon: dto.isComingSoon ?? false,
        metaTitle: dto.metaTitle,
        metaDescription: dto.metaDescription,
      },
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
        _count: { select: { products: true } },
      },
    });

    this.logger.log(`Category created: ${category.id} - ${category.name}`);
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    if (dto.slug && dto.slug !== existing.slug) {
      const slugExists = await this.prisma.category.findUnique({
        where: { slug: dto.slug },
      });
      if (slugExists) {
        throw new ConflictException(`Category with slug "${dto.slug}" already exists`);
      }
    }

    if (dto.parentId && dto.parentId === id) {
      throw new ConflictException('Category cannot be its own parent');
    }

    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException(`Parent category with ID "${dto.parentId}" not found`);
      }
    }

    let slug = existing.slug;
    if (dto.name && dto.name !== existing.name && !dto.slug) {
      slug = generateSlug(dto.name);
      const slugExists = await this.prisma.category.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (slugExists && slugExists.id !== id) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    const category = await this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug || slug,
        description: dto.description,
        image: dto.image,
        parentId: dto.parentId,
        isActive: dto.isActive,
        sortOrder: dto.sortOrder,
        isComingSoon: dto.isComingSoon,
        metaTitle: dto.metaTitle,
        metaDescription: dto.metaDescription,
      },
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
        _count: { select: { products: true } },
      },
    });

    this.logger.log(`Category updated: ${category.id}`);
    return category;
  }

  async remove(id: string) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
      include: {
        children: { select: { id: true } },
        _count: { select: { products: true } },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    if (existing.children.length > 0) {
      throw new ConflictException(
        'Cannot delete category with subcategories. Remove subcategories first.',
      );
    }

    if (existing._count.products > 0) {
      throw new ConflictException(
        `Cannot delete category with ${existing._count.products} products. Reassign products first.`,
      );
    }

    await this.prisma.category.delete({ where: { id } });
    this.logger.log(`Category deleted: ${id}`);
    return { message: 'Category deleted successfully' };
  }

  async getTree() {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { products: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return this.buildTree(categories, null);
  }

  async reorder(orders: { id: string; sortOrder: number }[]) {
    if (!Array.isArray(orders) || orders.length === 0) {
      return { updated: 0 };
    }
    const updates = await this.prisma.$transaction(
      orders.map((entry) =>
        this.prisma.category.update({
          where: { id: entry.id },
          data: { sortOrder: entry.sortOrder },
          select: { id: true, sortOrder: true },
        }),
      ),
    );
    this.logger.log(`Reordered ${updates.length} categories`);
    return { updated: updates.length };
  }

  private buildTree(categories: any[], parentId: string | null): any[] {
    return categories
      .filter((cat) => cat.parentId === parentId)
      .map((cat) => ({
        ...cat,
        children: this.buildTree(categories, cat.id),
      }));
  }
}
