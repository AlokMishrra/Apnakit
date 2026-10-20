import { PrismaClient, BannerPosition } from '@prisma/client';
import { BANNER_IMAGES } from './seed-images';

interface BannerSeed {
  title: string;
  subtitle: string;
  image: string;
  link: string;
  position: BannerPosition;
  sortOrder: number;
}

const HERO_BANNERS: BannerSeed[] = [
  {
    title: 'Fresh Groceries, Delivered Fast',
    subtitle: 'Fruits, vegetables, dairy and staples from stores near you',
    image: BANNER_IMAGES['Fresh Groceries, Delivered Fast'],
    link: '/category/grocery',
    position: BannerPosition.HERO,
    sortOrder: 1,
  },
  {
    title: 'Snacks & Drinks Deals',
    subtitle: 'Chips, chocolates, cold drinks and more from ₹20',
    image: BANNER_IMAGES['Snacks & Drinks Deals'],
    link: '/category/snacks-beverages',
    position: BannerPosition.HERO,
    sortOrder: 2,
  },
  {
    title: 'Beauty & Personal Care',
    subtitle: 'Shampoo, skincare and hygiene from brands you trust',
    image: BANNER_IMAGES['Beauty & Personal Care'],
    link: '/category/beauty-skincare',
    position: BannerPosition.HERO,
    sortOrder: 3,
  },
  {
    title: 'Instant Food & Frozen Treats',
    subtitle: 'Momos, pizza, fries and ice cream ready in minutes',
    image: BANNER_IMAGES['Instant Food & Frozen Treats'],
    link: '/category/instant-food',
    position: BannerPosition.HERO,
    sortOrder: 4,
  },
];

const PROMOTIONAL_BANNERS: BannerSeed[] = [
  {
    title: 'Free Delivery',
    subtitle: 'On orders above ₹999',
    image: BANNER_IMAGES['Free Delivery'],
    link: '/help',
    position: BannerPosition.PROMOTIONAL,
    sortOrder: 1,
  },
  {
    title: 'Bank Offers',
    subtitle: 'Extra 10% off with HDFC cards',
    image: BANNER_IMAGES['Bank Offers'],
    link: '/coupons',
    position: BannerPosition.PROMOTIONAL,
    sortOrder: 2,
  },
  {
    title: 'Refer & Earn',
    subtitle: 'Get ₹200 for every friend you refer',
    image: BANNER_IMAGES['Refer & Earn'],
    link: '/account',
    position: BannerPosition.PROMOTIONAL,
    sortOrder: 3,
  },
  {
    title: 'Sell on ApnaKit',
    subtitle: 'Start your online business today',
    image: BANNER_IMAGES['Sell on ApnaKit'],
    link: '/seller/register',
    position: BannerPosition.PROMOTIONAL,
    sortOrder: 4,
  },
];

export async function seedBanners(prisma: PrismaClient) {
  console.log('Seeding banners...');

  for (const banner of HERO_BANNERS) {
    const existing = await prisma.banner.findFirst({
      where: { title: banner.title, position: banner.position },
    });

    if (!existing) {
      await prisma.banner.create({
        data: { ...banner, image: BANNER_IMAGES[banner.title] ?? banner.image },
      });
      console.log(`  ├─ Hero: ${banner.title}`);
    }
  }

  for (const banner of PROMOTIONAL_BANNERS) {
    const existing = await prisma.banner.findFirst({
      where: { title: banner.title, position: banner.position },
    });

    if (!existing) {
      await prisma.banner.create({
        data: { ...banner, image: BANNER_IMAGES[banner.title] ?? banner.image },
      });
      console.log(`  ├─ Promo: ${banner.title}`);
    }
  }

  console.log('Banners seeded successfully.');
}
