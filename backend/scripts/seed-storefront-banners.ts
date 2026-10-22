/**
 * Seeds the storefront banners: the hero carousel on the home page and the
 * per-section banners for Quick and Shop All. The images are real
 * photography (Unsplash), so they render without any further setup.
 */
import { PrismaClient, BannerPosition, HomeSectionKey } from '@prisma/client';
import { BANNER_IMAGES, SECTION_BANNERS } from '../src/database/seeds/seed-images';

const prisma = new PrismaClient();

async function main() {
  const hero = [
    { title: 'Fresh Groceries, Delivered Fast', subtitle: 'Fruits, vegetables, dairy and staples from stores near you', link: '/category/grocery', sortOrder: 1 },
    { title: 'Snacks & Drinks Deals', subtitle: 'Chips, chocolates, cold drinks and more from ₹20', link: '/category/snacks-beverages', sortOrder: 2 },
    { title: 'Beauty & Personal Care', subtitle: 'Shampoo, skincare and hygiene from brands you trust', link: '/category/beauty-skincare', sortOrder: 3 },
    { title: 'Instant Food & Frozen Treats', subtitle: 'Momos, pizza, fries and ice cream ready in minutes', link: '/category/instant-food', sortOrder: 4 },
  ];

  for (const b of hero) {
    const image = BANNER_IMAGES[b.title];
    if (!image) continue;
    await prisma.banner.upsert({
      where: { id: `hero-${b.sortOrder}-${b.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` },
      update: { image, title: b.title, subtitle: b.subtitle, link: b.link, isActive: true, position: BannerPosition.HERO },
      create: {
        id: `hero-${b.sortOrder}-${b.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        title: b.title,
        subtitle: b.subtitle,
        image,
        link: b.link,
        position: BannerPosition.HERO,
        isActive: true,
        showTitle: true,
        showSubtitle: true,
        showButton: true,
        sortOrder: b.sortOrder,
      },
    });
  }

  const promotional = [
    { title: 'Free Delivery', subtitle: 'On orders above ₹999', link: '/help', sortOrder: 1 },
    { title: 'Bank Offers', subtitle: 'Extra 10% off with HDFC cards', link: '/help', sortOrder: 2 },
  ];
  for (const b of promotional) {
    const image = BANNER_IMAGES[b.title];
    if (!image) continue;
    const id = `promo-${b.sortOrder}-${b.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    await prisma.banner.upsert({
      where: { id },
      update: { image, title: b.title, subtitle: b.subtitle, link: b.link, isActive: true, position: BannerPosition.PROMOTIONAL },
      create: {
        id,
        title: b.title,
        subtitle: b.subtitle,
        image,
        link: b.link,
        position: BannerPosition.PROMOTIONAL,
        isActive: true,
        showTitle: true,
        showSubtitle: true,
        showButton: true,
        sortOrder: b.sortOrder,
      },
    });
  }

  // One banner per home section, so Quick and Shop All each get one.
  for (const [key, list] of Object.entries(SECTION_BANNERS)) {
    const sectionKey = key as HomeSectionKey;
    for (const [index, b] of list.entries()) {
      const id = `section-${sectionKey}-${index}`;
      await prisma.banner.upsert({
        where: { id },
        update: { image: b.image, title: b.title, subtitle: b.subtitle, link: b.link, isActive: true, homeSectionKey: sectionKey },
        create: {
          id,
          title: b.title,
          subtitle: b.subtitle,
          image: b.image,
          link: b.link,
          position: BannerPosition.CATEGORY,
          homeSectionKey: sectionKey,
          isActive: true,
          showTitle: true,
          showSubtitle: true,
          showButton: true,
          sortOrder: index,
        },
      });
    }
  }

  const counts = await prisma.banner.groupBy({ by: ['position'], _count: { _all: true } });
  console.log('banners:', counts.map((c) => `${c.position}=${c._count._all}`).join(' '));
}

main().catch((e) => { console.error('failed:', e); process.exit(1); }).finally(() => prisma.$disconnect());
