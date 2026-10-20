import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../config/database.config';
import { Prisma, HomeSectionKey } from '@prisma/client';
import {
  ReplaceHomeSectionItemsDto,
  UpdateHomeSectionDto,
  AddHomeSectionItemDto,
  ReplaceHomeSectionCategoriesDto,
  AddHomeSectionCategoryDto,
} from './dto/home-section.dto';

/** Every product field the storefront card needs, resolved once per query. */
const PRODUCT_INCLUDE = {
  brand: { select: { id: true, name: true, slug: true } },
  category: { select: { id: true, name: true, slug: true } },
  images: {
    where: { isPrimary: true },
    take: 1,
    orderBy: { sortOrder: 'asc' },
  },
  variants: {
    where: { isActive: true },
    orderBy: { price: 'asc' as const },
    take: 1,
  },
} satisfies Prisma.ProductInclude;

const SECTION_INCLUDE = {
  items: {
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }],
    include: { product: { include: PRODUCT_INCLUDE } },
  },
  categories: {
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }],
    include: { category: { select: { id: true, name: true, slug: true, image: true } } },
  },
} satisfies Prisma.HomeSectionInclude;

@Injectable()
export class HomeSectionsService {
  private readonly logger = new Logger(HomeSectionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Both sections, including item counts. Public — the home page needs the
   * toggle labels and whether each side has anything to show before the user
   * taps, so an empty section can be disabled.
   */
  async findAll() {
    const sections = await this.prisma.homeSection.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { items: true } } },
    });

    return sections.map((section) => ({
      key: section.key,
      title: section.title,
      subtitle: section.subtitle,
      isActive: section.isActive,
      sortOrder: section.sortOrder,
      itemCount: section._count.items,
    }));
  }

  /** One section with its full, ordered product list. */
  async findByKey(key: HomeSectionKey) {
    const section = await this.prisma.homeSection.findUnique({
      where: { key },
      include: SECTION_INCLUDE,
    });

    if (!section) {
      throw new NotFoundException(`Home section "${key}" is not configured`);
    }

    return {
      key: section.key,
      title: section.title,
      subtitle: section.subtitle,
      isActive: section.isActive,
      sortOrder: section.sortOrder,
      categories: this.formatCategories(section.categories),
      items: section.items.map((item) => this.formatItem(item)),
    };
  }

  /**
   * Active sections with products, for rendering the selected tab. `limit`
   * keeps the payload small — the Quick view is a short rail on mobile.
   */
  async findActiveSection(key: HomeSectionKey, limit?: number) {
    const section = await this.prisma.homeSection.findUnique({
      where: { key },
      include: {
        items: {
          where: { isActive: true },
          orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }],
          take: limit && limit > 0 ? limit : undefined,
          include: { product: { include: PRODUCT_INCLUDE } },
        },
        categories: {
          where: { isActive: true },
          orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }],
          include: { category: { select: { id: true, name: true, slug: true, image: true } } },
        },
      },
    });

    if (!section || !section.isActive) return null;

    return {
      key: section.key,
      title: section.title,
      subtitle: section.subtitle,
      categories: this.formatCategories(section.categories),
      items: section.items.map((item) => this.formatItem(item)),
    };
  }

  /** Admin view: every item including inactive ones, with ids for editing. */
  async findAdminSection(key: HomeSectionKey) {
    const section = await this.prisma.homeSection.findUnique({
      where: { key },
      include: {
        items: {
          orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }],
          include: { product: { include: PRODUCT_INCLUDE } },
        },
        categories: {
          orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }],
          include: { category: { select: { id: true, name: true, slug: true, image: true } } },
        },
      },
    });

    if (!section) {
      throw new NotFoundException(`Home section "${key}" is not configured`);
    }

    return {
      key: section.key,
      title: section.title,
      subtitle: section.subtitle,
      isActive: section.isActive,
      sortOrder: section.sortOrder,
      categories: this.formatCategories(section.categories),
      items: section.items.map((item) => ({
        ...this.formatItem(item),
        isActive: item.isActive,
        sortOrder: item.sortOrder,
      })),
    };
  }

  async updateSection(key: HomeSectionKey, dto: UpdateHomeSectionDto) {
    const existing = await this.prisma.homeSection.findUnique({ where: { key } });
    if (!existing) {
      throw new NotFoundException(`Home section "${key}" is not configured`);
    }

    return this.prisma.homeSection.update({ where: { key }, data: dto });
  }

  async addItem(key: HomeSectionKey, dto: AddHomeSectionItemDto) {
    const section = await this.prisma.homeSection.findUnique({ where: { key } });
    if (!section) {
      throw new NotFoundException(`Home section "${key}" is not configured`);
    }

    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      select: { id: true },
    });
    if (!product) {
      throw new BadRequestException('Product not found');
    }

    const duplicate = await this.prisma.homeSectionItem.findUnique({
      where: { sectionId_productId: { sectionId: section.id, productId: dto.productId } },
    });
    if (duplicate) {
      throw new BadRequestException('That product is already in this section');
    }

    // Append to the end when no explicit position was given.
    const sortOrder =
      dto.sortOrder ??
      (await this.prisma.homeSectionItem.count({ where: { sectionId: section.id } }));

    const item = await this.prisma.homeSectionItem.create({
      data: {
        sectionId: section.id,
        productId: dto.productId,
        sortOrder,
      },
      include: { product: { include: PRODUCT_INCLUDE } },
    });

    this.logger.log(`Added product ${dto.productId} to section ${key}`);
    return this.formatItem(item);
  }

  async removeItem(key: HomeSectionKey, productId: string) {
    const section = await this.prisma.homeSection.findUnique({ where: { key } });
    if (!section) {
      throw new NotFoundException(`Home section "${key}" is not configured`);
    }

    const result = await this.prisma.homeSectionItem.deleteMany({
      where: { sectionId: section.id, productId },
    });

    if (result.count === 0) {
      throw new NotFoundException('That product is not in this section');
    }

    return { message: 'Product removed from section' };
  }

  /**
   * Replaces the entire ordered list. Products missing from `items` are
   * removed, so the stored order always matches what the admin sent.
   */
  async replaceItems(key: HomeSectionKey, dto: ReplaceHomeSectionItemsDto) {
    const section = await this.prisma.homeSection.findUnique({ where: { key } });
    if (!section) {
      throw new NotFoundException(`Home section "${key}" is not configured`);
    }

    const seen = new Set<string>();
    for (const item of dto.items) {
      if (seen.has(item.productId)) {
        throw new BadRequestException(
          `Product ${item.productId} appears more than once in the list`,
        );
      }
      seen.add(item.productId);
    }

    const products = await this.prisma.product.findMany({
      where: { id: { in: dto.items.map((i) => i.productId) } },
      select: { id: true },
    });
    if (products.length !== seen.size) {
      const found = new Set(products.map((p) => p.id));
      const missing = [...seen].filter((id) => !found.has(id));
      throw new BadRequestException(`Unknown product id(s): ${missing.join(', ')}`);
    }

    await this.prisma.$transaction([
      this.prisma.homeSectionItem.deleteMany({ where: { sectionId: section.id } }),
      ...dto.items.map((item, index) =>
        this.prisma.homeSectionItem.create({
          data: {
            sectionId: section.id,
            productId: item.productId,
            // Trust the stored sortOrder when given, otherwise the array order.
            sortOrder: item.sortOrder ?? index,
            isActive: item.isActive ?? true,
          },
        }),
      ),
    ]);

    this.logger.log(`Replaced ${dto.items.length} item(s) in section ${key}`);
    return this.findAdminSection(key);
  }

  private formatCategories(
    rows: { sortOrder: number; category: { id: string; name: string; slug: string; image: string | null } }[],
  ) {
    return rows.map((row) => ({
      id: row.category.id,
      categoryId: row.category.id,
      name: row.category.name,
      slug: row.category.slug,
      image: row.category.image ?? '',
      sortOrder: row.sortOrder,
    }));
  }

  private async requireSection(key: HomeSectionKey) {
    const section = await this.prisma.homeSection.findUnique({ where: { key } });
    if (!section) {
      throw new NotFoundException(`Home section "${key}" is not configured`);
    }
    return section;
  }

  async addCategory(key: HomeSectionKey, dto: AddHomeSectionCategoryDto) {
    const section = await this.requireSection(key);

    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
      select: { id: true },
    });
    if (!category) {
      throw new BadRequestException('Category not found');
    }

    const duplicate = await this.prisma.homeSectionCategory.findUnique({
      where: {
        sectionId_categoryId: { sectionId: section.id, categoryId: dto.categoryId },
      },
    });
    if (duplicate) {
      throw new BadRequestException('That category is already in this section');
    }

    const sortOrder = await this.prisma.homeSectionCategory.count({
      where: { sectionId: section.id },
    });

    const row = await this.prisma.homeSectionCategory.create({
      data: { sectionId: section.id, categoryId: dto.categoryId, sortOrder },
      include: { category: { select: { id: true, name: true, slug: true, image: true } } },
    });

    this.logger.log(`Pinned category ${dto.categoryId} to section ${key}`);
    return this.formatCategories([row])[0];
  }

  async removeCategory(key: HomeSectionKey, categoryId: string) {
    const section = await this.requireSection(key);
    const result = await this.prisma.homeSectionCategory.deleteMany({
      where: { sectionId: section.id, categoryId },
    });
    if (result.count === 0) {
      throw new NotFoundException('That category is not pinned to this section');
    }
    return { message: 'Category removed from section' };
  }

  async replaceCategories(key: HomeSectionKey, dto: ReplaceHomeSectionCategoriesDto) {
    const section = await this.requireSection(key);

    const uniqueIds = [...new Set(dto.categoryIds)];
    const categories = await this.prisma.category.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true },
    });
    if (categories.length !== uniqueIds.length) {
      const found = new Set(categories.map((c) => c.id));
      const missing = uniqueIds.filter((id) => !found.has(id));
      throw new BadRequestException(`Unknown category id(s): ${missing.join(', ')}`);
    }

    await this.prisma.$transaction([
      this.prisma.homeSectionCategory.deleteMany({ where: { sectionId: section.id } }),
      ...uniqueIds.map((categoryId, index) =>
        this.prisma.homeSectionCategory.create({
          data: { sectionId: section.id, categoryId, sortOrder: index },
        }),
      ),
    ]);

    this.logger.log(`Replaced ${uniqueIds.length} pinned categor(y/ies) in section ${key}`);
    return this.findAdminSection(key);
  }

  private formatItem(item: {
    productId?: string;
    sortOrder?: number;
    product: {
      id: string;
      name: string;
      slug: string;
      shortDescription: string | null;
      isActive: boolean;
      images: { url: string; alt: string | null }[];
      brand: { id: string; name: string; slug: string } | null;
      category: { id: string; name: string; slug: string } | null;
      variants: { id: string; name: string; price: unknown; compareAtPrice: unknown }[];
    };
  }) {
    const { product } = item;
    const variant = product.variants[0] ?? null;
    const price = variant ? Number(variant.price) : 0;
    const compareAtPrice = variant?.compareAtPrice ? Number(variant.compareAtPrice) : null;

    return {
      id: item.productId ?? product.id,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      shortDescription: product.shortDescription,
      image: product.images[0]?.url ?? '',
      alt: product.images[0]?.alt ?? product.name,
      brand: product.brand?.name ?? null,
      brandSlug: product.brand?.slug ?? null,
      categoryId: product.category?.id ?? null,
      categoryName: product.category?.name ?? null,
      categorySlug: product.category?.slug ?? null,
      price,
      compareAtPrice,
      discount:
        compareAtPrice && compareAtPrice > price
          ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
          : 0,
      variantId: variant?.id ?? null,
      variantName: variant?.name ?? null,
      sortOrder: item.sortOrder,
      isProductActive: product.isActive,
    };
  }
}
