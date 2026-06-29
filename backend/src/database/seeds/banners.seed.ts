import { PrismaClient, BannerPosition } from '@prisma/client';

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
    title: 'Mega Electronics Sale',
    subtitle: 'Up to 70% off on smartphones, laptops & more',
    image: 'https://placehold.co/1920x600?text=Mega+Electronics+Sale',
    link: '/category/electronics',
    position: BannerPosition.HERO,
    sortOrder: 1,
  },
  {
    title: 'Fashion Weekend Special',
    subtitle: 'Buy 2 Get 1 Free on all fashion brands',
    image: 'https://placehold.co/1920x600?text=Fashion+Weekend+Special',
    link: '/category/fashion',
    position: BannerPosition.HERO,
    sortOrder: 2,
  },
  {
    title: 'Home & Kitchen Essentials',
    subtitle: 'Starting from ₹299 only',
    image: 'https://placehold.co/1920x600?text=Home+%26+Kitchen+Essentials',
    link: '/category/home-kitchen',
    position: BannerPosition.HERO,
    sortOrder: 3,
  },
  {
    title: 'New Arrivals - Beauty',
    subtitle: 'Discover the latest beauty products',
    image: 'https://placehold.co/1920x600?text=New+Beauty+Products',
    link: '/category/beauty',
    position: BannerPosition.HERO,
    sortOrder: 4,
  },
];

const PROMOTIONAL_BANNERS: BannerSeed[] = [
  {
    title: 'Free Delivery',
    subtitle: 'On orders above ₹999',
    image: 'https://placehold.co/600x300?text=Free+Delivery',
    link: '/help',
    position: BannerPosition.PROMOTIONAL,
    sortOrder: 1,
  },
  {
    title: 'Bank Offers',
    subtitle: 'Extra 10% off with HDFC cards',
    image: 'https://placehold.co/600x300?text=Bank+Offers',
    link: '/coupons',
    position: BannerPosition.PROMOTIONAL,
    sortOrder: 2,
  },
  {
    title: 'Refer & Earn',
    subtitle: 'Get ₹200 for every friend you refer',
    image: 'https://placehold.co/600x300?text=Refer+%26+Earn',
    link: '/account',
    position: BannerPosition.PROMOTIONAL,
    sortOrder: 3,
  },
  {
    title: 'Sell on ApnaKit',
    subtitle: 'Start your online business today',
    image: 'https://placehold.co/600x300?text=Sell+on+ApnaKit',
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
      await prisma.banner.create({ data: banner });
      console.log(`  ├─ Hero: ${banner.title}`);
    }
  }

  for (const banner of PROMOTIONAL_BANNERS) {
    const existing = await prisma.banner.findFirst({
      where: { title: banner.title, position: banner.position },
    });

    if (!existing) {
      await prisma.banner.create({ data: banner });
      console.log(`  ├─ Promo: ${banner.title}`);
    }
  }

  console.log('Banners seeded successfully.');
}
