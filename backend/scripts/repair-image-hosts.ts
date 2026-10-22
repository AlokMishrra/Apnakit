/**
 * Repairs storefront images that no longer load.
 *
 * Some catalogue images point at hosts that block hotlinking (pngtree answers
 * 403 for a browser request) or at files that have been removed (dead S3
 * links answer 404). Those categories and products get real photography
 * instead, from the Unsplash CDN, which the storefront is allowed to use.
 *
 * Run it after an import:  npx ts-node scripts/repair-image-hosts.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const U = (id: string, w = 600, h = 600): string =>
  `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=crop&auto=format&q=80`;

/** Hosts that block hotlinking or serve no image at all. */
const BLOCKED_HOSTS = [
  'png.pngtree.com',
  'png.clipartbest.com',
  'thumbs.dreamstime.com',
  'frugivore-bucket.s3.amazonaws.com',
  'frugivore.s3.amazonaws.com',
];

/** A photo per category slug, used when the original image is unusable. */
const CATEGORY_PHOTOS: Record<string, string> = {
  'big-savings-combo': U('photo-1607082348824-0a96f2a4b9da', 400, 400),
  'combo-savings': U('photo-1607082348824-0a96f2a4b9da', 400, 400),
  'fast-food-junk-food': U('photo-1562967916-eb82221dfb92', 400, 400),
  'beauty-skincare': U('photo-1620916566398-39f1143ab7be', 400, 400),
  electronic: U('photo-1498049794561-7780e7231661', 400, 400),
  'medical-healthcare': U('photo-1584308666744-24d5c474f2ae', 400, 400),
  gifts: U('photo-1549465220-1a8b9238cd48', 400, 400),
  'dairy-products': U('photo-1628088062854-d1870b4553da', 400, 400),
  groceries: U('photo-1578916171728-46686eac8d58', 400, 400),
  'snacks-beverages': U('photo-1621447504864-d8686e12698c', 400, 400),
  'instant-food': U('photo-1562967914-608f82629710', 400, 400),
  'cleanliness': U('photo-1583947215259-38e31be8751f', 400, 400),
  'personal-care': U('photo-1596462502278-27bfdc403348', 400, 400),
  'home-kitchen': U('photo-1556909212-d5b604d0c90d', 400, 400),
  clothing: U('photo-1441986300917-64674bd600d8', 400, 400),
  footwear: U('photo-1542291026-7eec264c27ff', 400, 400),
  jewellery: U('photo-1515562141207-7a88fb7ce338', 400, 400),
  stationery: U('photo-1456324504439-367cee3b3c32', 400, 400),
  toys: U('photo-1594787318286-3d835c1d207f', 400, 400),
  'sports-fitness': U('photo-1517649763962-0c623066013b', 400, 400),
  books: U('photo-1512820790803-83ca734da794', 400, 400),
  'packaged-foods': U('photo-1604719312566-8912e9227c6a', 400, 400),
  beverages: U('photo-1544145945-f90425340c7e', 400, 400),
  'cold-drinks': U('photo-1622483767028-3f66f32aef97', 400, 400),
  'fruits-vegetables': U('photo-1619566636858-adf3ef46400b', 400, 400),
  'baby-care': U('photo-1515488042361-ee00e0ddd4e4', 400, 400),
  'kitchen-appliances': U('photo-1556911220-bff31c812dba', 400, 400),
  'mobile-phones': U('photo-1511707171634-5f897ff02aa9', 400, 400),
  laptops: U('photo-1496181133206-80ce9b88a853', 400, 400),
  'tv-refrigerator': U('photo-1593359677879-a4bb92f829d1', 400, 400),
  'washing-machine': U('photo-1626806787461-102c1bfaaea1', 400, 400),
  'air-conditioners': U('photo-1631545806609-95427f1c3b95', 400, 400),
  headphones: U('photo-1546435770-a3e426bf472b', 400, 400),
  'home-decoration': U('photo-1616486338812-3dadae4b4ace', 400, 400),
  'lighting': U('photo-1513506003901-1e6a229e2d15', 400, 400),
  furniture: U('photo-1555041469-a586c61ea9bc', 400, 400),
  utensils: U('photo-1584990347449-a2d4c2c9ac8f', 400, 400),
  'womens-clothing': U('photo-1483985988355-763728e1935b', 400, 400),
  'mens-clothing': U('photo-1490578474895-699cd4e2cf59', 400, 400),
};

/** Fallback photo for a product whose image host is unusable. */
const PRODUCT_FALLBACK = U('photo-1604719312566-8912e9227c6a', 600, 600);

const isBlocked = (url?: string | null) => {
  if (!url) return true;
  return BLOCKED_HOSTS.some((h) => url.includes(h));
};

async function main() {
  let categoriesFixed = 0;
  let imagesFixed = 0;

  const categories = await prisma.category.findMany({ select: { id: true, slug: true, name: true, image: true } });
  for (const c of categories) {
    if (!isBlocked(c.image)) continue;
    const photo = CATEGORY_PHOTOS[c.slug] ?? CATEGORY_PHOTOS[c.slug.replace(/-/g, ' ')] ?? PRODUCT_FALLBACK;
    await prisma.category.update({ where: { id: c.id }, data: { image: photo } });
    categoriesFixed++;
  }

  const images = await prisma.productImage.findMany({ select: { id: true, url: true } });
  for (const img of images) {
    if (!isBlocked(img.url)) continue;
    await prisma.productImage.update({ where: { id: img.id }, data: { url: PRODUCT_FALLBACK } });
    imagesFixed++;
  }

  // A product whose only image was unusable would render with no picture, so
  // make sure every product still has at least one.
  const orphans = await prisma.product.findMany({
    where: { images: { none: {} } },
    select: { id: true },
  });
  for (const p of orphans) {
    await prisma.productImage.create({ data: { productId: p.id, url: PRODUCT_FALLBACK, alt: 'Product image', sortOrder: 0, isPrimary: true } });
    imagesFixed++;
  }

  console.log(`categories fixed: ${categoriesFixed}, product images fixed: ${imagesFixed}, products with no image: ${orphans.length}`);
}

main()
  .catch((e) => {
    console.error('failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
