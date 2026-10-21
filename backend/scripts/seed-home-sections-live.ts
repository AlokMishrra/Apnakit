import { PrismaClient, HomeSectionKey } from '@prisma/client';

const prisma = new PrismaClient();
const QUICK_COUNT = 24;

async function main() {
  const quick = await prisma.homeSection.upsert({
    where: { key: HomeSectionKey.QUICK },
    update: { title: 'Quick', subtitle: 'Delivered within 24 hours', isActive: true, sortOrder: 0 },
    create: { key: HomeSectionKey.QUICK, title: 'Quick', subtitle: 'Delivered within 24 hours', isActive: true, sortOrder: 0 },
  });
  const shop = await prisma.homeSection.upsert({
    where: { key: HomeSectionKey.SHOP_ALL },
    update: { title: 'Shop All', subtitle: 'Delivered after 24 hours', isActive: true, sortOrder: 1 },
    create: { key: HomeSectionKey.SHOP_ALL, title: 'Shop All', subtitle: 'Delivered after 24 hours', isActive: true, sortOrder: 1 },
  });

  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  await prisma.homeSectionItem.deleteMany({ where: { sectionId: { in: [quick.id, shop.id] } } });

  const quickIds = products.slice(0, QUICK_COUNT).map((p) => p.id);
  const shopIds = products.slice(QUICK_COUNT).map((p) => p.id);

  await prisma.homeSectionItem.createMany({
    data: quickIds.map((productId, i) => ({ sectionId: quick.id, productId, sortOrder: i, isActive: true })),
  });
  await prisma.homeSectionItem.createMany({
    data: shopIds.map((productId, i) => ({ sectionId: shop.id, productId, sortOrder: i, isActive: true })),
  });

  console.log(`QUICK=${quickIds.length} SHOP_ALL=${shopIds.length}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
