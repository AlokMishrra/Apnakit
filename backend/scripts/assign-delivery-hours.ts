/**
 * Gives every active product a delivery time so the Quick / Shop All split is
 * driven by a rule instead of only by admin pins:
 *   deliveryHours <= 24 -> Quick
 *   deliveryHours >  24 -> Shop All
 *
 * Products already pinned to Quick by an admin get the fast slots, the rest
 * get standard slots. Admins can still change any product afterwards.
 */
import { PrismaClient, HomeSectionKey } from '@prisma/client';

const prisma = new PrismaClient();
const QUICK_LIMIT = 24;

async function main() {
  const quickSection = await prisma.homeSection.findUnique({ where: { key: HomeSectionKey.QUICK } });
  const pinned = quickSection
    ? await prisma.homeSectionItem.findMany({
        where: { sectionId: quickSection.id, isActive: true },
        select: { productId: true },
        orderBy: { sortOrder: 'asc' },
      })
    : [];

  const pinnedIds = new Set(pinned.map((p) => p.productId));
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, deliveryHours: true },
    orderBy: { createdAt: 'asc' },
  });

  let quickCount = 0;
  let shopCount = 0;
  let changed = 0;

  for (const [index, product] of products.entries()) {
    const isQuick = pinnedIds.has(product.id) || index < QUICK_LIMIT;
    // 12-24h for the fast slots, 48-96h for the standard ones.
    const hours = isQuick ? 12 + (index % 3) * 6 : 48 + (index % 4) * 16;
    if (product.deliveryHours !== hours) {
      await prisma.product.update({ where: { id: product.id }, data: { deliveryHours: hours } });
      changed++;
    }
    if (hours <= 24) quickCount++;
    else shopCount++;
  }

  console.log(`quick=${quickCount} shopAll=${shopCount} updated=${changed}`);
}

main().catch((e) => { console.error('failed:', e); process.exit(1); }).finally(() => prisma.$disconnect());
