import { PrismaClient, HomeSectionKey, BannerPosition } from '@prisma/client';
import { SECTION_BANNERS } from './seed-images';

interface SectionSeed {
  key: HomeSectionKey;
  title: string;
  subtitle: string;
  sortOrder: number;
  /** Slugs from products.seed.ts, ordered as they should appear. */
  productSlugs: string[];
  /** Category slugs pinned as filter chips. */
  categorySlugs?: string[];
}

const SECTIONS: SectionSeed[] = [
  {
    key: HomeSectionKey.QUICK,
    title: 'Quick',
    subtitle: 'Top picks, ready to add in one tap',
    sortOrder: 0,
    productSlugs: [
      'haldirams-classic-salted-chips',
      'amul-high-protein-rose-lassi',
      'mother-dairy-classic-pouch-curd',
      'chili-garlic-noodles',
    ],
    categorySlugs: ['snacks-beverages', 'dairy-products', 'grocery', 'instant-food'],
  },
  {
    key: HomeSectionKey.SHOP_ALL,
    title: 'Shop All',
    subtitle: 'Everything in the store, section by section',
    sortOrder: 1,
    // Left empty on purpose: the storefront falls back to the live catalogue
    // endpoint once the admin curates this list.
    productSlugs: [
      'paneer-cheese-kurkure-momos-8-pcs',
      'chili-garlic-noodles',
      'lays-sizzlin-hot-potato-chips',
      'myfitness-peanut-butter-dark-chocolate',
      'haldirams-takatak',
      'kurkure-sizzling-hot',
      'wellcore-pure-micronised-creatine-monohydrate',
      'sofy-antibacteria-extra-long-290mm-pads',
      'premium-double-spiral-cover-a4-size-1000-pages-set-of-3-notebooks',
      'premium-air-freshener-rose-for-room-and-office',
      'thumsup-cold-drink-can',
      'watermelon-creatine-mb',
    ],
    categorySlugs: [
      'grocery',
      'snacks-beverages',
      'beauty-skincare',
      'medical-healthcare',
      'dairy-products',
      'instant-food',
    ],
  },
];

export async function seedHomeSections(prisma: PrismaClient) {
  console.log('Seeding home sections...');

  const products = await prisma.product.findMany({
    select: { id: true, slug: true },
  });
  const bySlug = new Map(products.map((p) => [p.slug, p.id]));

  for (const section of SECTIONS) {
    const row = await prisma.homeSection.upsert({
      where: { key: section.key },
      update: { title: section.title, subtitle: section.subtitle, sortOrder: section.sortOrder },
      create: {
        key: section.key,
        title: section.title,
        subtitle: section.subtitle,
        sortOrder: section.sortOrder,
      },
    });

    // Items and pinned categories are seeded independently, and only when
    // empty, so a re-run never clobbers what an admin has curated.
    const existingItems = await prisma.homeSectionItem.count({
      where: { sectionId: row.id },
    });

    if (existingItems > 0) {
      console.log(`  ├─ ${section.title}: ${existingItems} item(s), left untouched`);
    } else {
      const items = section.productSlugs
        .map((slug) => bySlug.get(slug))
        .filter((id): id is string => !!id)
        .map((productId, index) => ({ sectionId: row.id, productId, sortOrder: index }));

      if (items.length > 0) {
        await prisma.homeSectionItem.createMany({ data: items });
      }
      console.log(`  ├─ ${section.title}: ${items.length} item(s)`);
    }

    const existingCategories = await prisma.homeSectionCategory.count({
      where: { sectionId: row.id },
    });

    if (existingCategories > 0) {
      console.log(`  │   ${existingCategories} pinned categor(y/ies), left untouched`);
    } else if (section.categorySlugs?.length) {
      const cats = await prisma.category.findMany({
        where: { slug: { in: section.categorySlugs } },
        select: { id: true, slug: true },
      });
      const categoryBySlug = new Map(cats.map((c) => [c.slug, c.id]));
      const catRows = section.categorySlugs
        .map((slug) => categoryBySlug.get(slug))
        .filter((id): id is string => !!id)
        .map((categoryId, index) => ({ sectionId: row.id, categoryId, sortOrder: index }));

      if (catRows.length > 0) {
        await prisma.homeSectionCategory.createMany({ data: catRows });
      }
      console.log(`  │   ${catRows.length} pinned categor(y/ies)`);
    }
  }

  console.log('Home sections seeded successfully.');
}

/**
 * Banners that render directly under the toggle. Like the item lists these are
 * only seeded once — afterwards they belong to the admin dashboard.
 */
export async function seedHomeSectionBanners(prisma: PrismaClient) {
  console.log('Seeding home section banners...');

  let created = 0;

  for (const [key, banners] of Object.entries(SECTION_BANNERS)) {
    const sectionKey = key as HomeSectionKey;

    for (const [index, banner] of banners.entries()) {
      const existing = await prisma.banner.findFirst({
        where: { title: banner.title, homeSectionKey: sectionKey },
      });
      if (existing) continue;

      await prisma.banner.create({
        data: {
          title: banner.title,
          subtitle: banner.subtitle,
          image: banner.image,
          link: banner.link,
          position: BannerPosition.PROMOTIONAL,
          homeSectionKey: sectionKey,
          isActive: true,
          sortOrder: index,
        },
      });
      created++;
    }

    const count = banners.length;
    console.log(`  ├─ ${sectionKey}: ${count} banner(s)`);
  }

  console.log(`Home section banners seeded (${created} created).`);
}
