import { PrismaClient } from '@prisma/client';

interface BrandSeed {
  name: string;
  slug: string;
  logo: string;
  description: string;
  website: string;
  metaTitle: string;
  metaDescription: string;
}

const BRANDS: BrandSeed[] = [
  {
    name: 'Samsung',
    slug: 'samsung',
    logo: 'https://placehold.co/200x200?text=Samsung',
    description: 'Samsung Electronics - Global leader in technology',
    website: 'https://www.samsung.com',
    metaTitle: 'Samsung Products - ApnaKit',
    metaDescription: 'Shop Samsung smartphones, TVs, and appliances',
  },
  {
    name: 'Apple',
    slug: 'apple',
    logo: 'https://placehold.co/200x200?text=Apple',
    description: 'Apple Inc. - Innovative technology products',
    website: 'https://www.apple.com',
    metaTitle: 'Apple Products - ApnaKit',
    metaDescription: 'Shop Apple iPhones, iPads, and MacBooks',
  },
  {
    name: 'Xiaomi',
    slug: 'xiaomi',
    logo: 'https://placehold.co/200x200?text=Xiaomi',
    description: 'Xiaomi - Technology for everyone',
    website: 'https://www.mi.com',
    metaTitle: 'Xiaomi Products - ApnaKit',
    metaDescription: 'Shop Xiaomi smartphones and smart home devices',
  },
  {
    name: 'OnePlus',
    slug: 'oneplus',
    logo: 'https://placehold.co/200x200?text=OnePlus',
    description: 'OnePlus - Never Settle',
    website: 'https://www.oneplus.com',
    metaTitle: 'OnePlus Products - ApnaKit',
    metaDescription: 'Shop OnePlus smartphones and accessories',
  },
  {
    name: 'Sony',
    slug: 'sony',
    logo: 'https://placehold.co/200x200?text=Sony',
    description: 'Sony Corporation - Creative entertainment',
    website: 'https://www.sony.com',
    metaTitle: 'Sony Products - ApnaKit',
    metaDescription: 'Shop Sony headphones, cameras, and gaming',
  },
  {
    name: 'LG',
    slug: 'lg',
    logo: 'https://placehold.co/200x200?text=LG',
    description: 'LG Electronics - Life\'s Good',
    website: 'https://www.lg.com',
    metaTitle: 'LG Products - ApnaKit',
    metaDescription: 'Shop LG TVs, washing machines, and refrigerators',
  },
  {
    name: 'Nike',
    slug: 'nike',
    logo: 'https://placehold.co/200x200?text=Nike',
    description: 'Nike - Just Do It',
    website: 'https://www.nike.com',
    metaTitle: 'Nike Products - ApnaKit',
    metaDescription: 'Shop Nike shoes, clothing, and accessories',
  },
  {
    name: 'Adidas',
    slug: 'adidas',
    logo: 'https://placehold.co/200x200?text=Adidas',
    description: 'Adidas - Impossible Is Nothing',
    website: 'https://www.adidas.com',
    metaTitle: 'Adidas Products - ApnaKit',
    metaDescription: 'Shop Adidas shoes, clothing, and gear',
  },
  {
    name: 'Puma',
    slug: 'puma',
    logo: 'https://placehold.co/200x200?text=Puma',
    description: 'Puma - Forever Faster',
    website: 'https://www.puma.com',
    metaTitle: 'Puma Products - ApnaKit',
    metaDescription: 'Shop Puma shoes, clothing, and accessories',
  },
  {
    name: 'H&M',
    slug: 'hm',
    logo: 'https://placehold.co/200x200?text=H%26M',
    description: 'H&M - Fashion and quality at the best price',
    website: 'https://www.hm.com',
    metaTitle: 'H&M Products - ApnaKit',
    metaDescription: 'Shop H&M clothing and accessories',
  },
  {
    name: 'Zara',
    slug: 'zara',
    logo: 'https://placehold.co/200x200?text=Zara',
    description: 'Zara - Instant Fashion',
    website: 'https://www.zara.com',
    metaTitle: 'Zara Products - ApnaKit',
    metaDescription: 'Shop Zara clothing and accessories',
  },
  {
    name: "Levi's",
    slug: 'levis',
    logo: 'https://placehold.co/200x200?text=Levis',
    description: 'Levi\'s - Original since 1873',
    website: 'https://www.levi.com',
    metaTitle: "Levi's Products - ApnaKit",
    metaDescription: "Shop Levi's jeans, jackets, and clothing",
  },
  {
    name: 'Prestige',
    slug: 'prestige',
    logo: 'https://placehold.co/200x200?text=Prestige',
    description: 'Prestige - Trusted kitchen brand',
    website: 'https://www.prestige.co.in',
    metaTitle: 'Prestige Products - ApnaKit',
    metaDescription: 'Shop Prestige kitchen appliances and cookware',
  },
  {
    name: 'Philips',
    slug: 'philips',
    logo: 'https://placehold.co/200x200?text=Philips',
    description: 'Philips - Sense and simplicity',
    website: 'https://www.philips.com',
    metaTitle: 'Philips Products - ApnaKit',
    metaDescription: 'Shop Philips electronics and appliances',
  },
  {
    name: 'Bajaj',
    slug: 'bajaj',
    logo: 'https://placehold.co/200x200?text=Bajaj',
    description: 'Bajaj Electricals - Trusted since 1938',
    website: 'https://www.bajajelectricals.com',
    metaTitle: 'Bajaj Products - ApnaKit',
    metaDescription: 'Shop Bajaj fans, lighting, and appliances',
  },
  {
    name: 'Havells',
    slug: 'havells',
    logo: 'https://placehold.co/200x200?text=Havells',
    description: 'Havells - Making lives better',
    website: 'https://www.havells.com',
    metaTitle: 'Havells Products - ApnaKit',
    metaDescription: 'Shop Havells electrical products',
  },
  {
    name: "L'Oréal",
    slug: 'loreal',
    logo: 'https://placehold.co/200x200?text=Loreal',
    description: "L'Oréal Paris - Because you're worth it",
    website: 'https://www.lorealparis.com',
    metaTitle: "L'Oréal Products - ApnaKit",
    metaDescription: "Shop L'Oréal beauty and skincare products",
  },
  {
    name: 'Nivea',
    slug: 'nivea',
    logo: 'https://placehold.co/200x200?text=Nivea',
    description: 'Nivea - Care for your skin',
    website: 'https://www.nivea.com',
    metaTitle: 'Nivea Products - ApnaKit',
    metaDescription: 'Shop Nivea skincare and personal care products',
  },
  {
    name: 'Maybelline',
    slug: 'maybelline',
    logo: 'https://placehold.co/200x200?text=Maybelline',
    description: 'Maybelline New York - Maybe she\'s born with it',
    website: 'https://www.maybelline.com',
    metaTitle: 'Maybelline Products - ApnaKit',
    metaDescription: 'Shop Maybelline makeup products',
  },
  {
    name: 'Penguin',
    slug: 'penguin',
    logo: 'https://placehold.co/200x200?text=Penguin',
    description: 'Penguin Books - Leading publisher',
    website: 'https://www.penguin.co.uk',
    metaTitle: 'Penguin Books - ApnaKit',
    metaDescription: 'Shop Penguin Books',
  },
  {
    name: 'HarperCollins',
    slug: 'harpercollins',
    logo: 'https://placehold.co/200x200?text=HarperCollins',
    description: 'HarperCollins Publishers - One of the world\'s largest publishers',
    website: 'https://www.harpercollins.com',
    metaTitle: 'HarperCollins Books - ApnaKit',
    metaDescription: 'Shop HarperCollins Books',
  },
];

export async function seedBrands(prisma: PrismaClient) {
  console.log('Seeding brands...');

  for (const brand of BRANDS) {
    await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: {
        name: brand.name,
        logo: brand.logo,
        description: brand.description,
        website: brand.website,
        metaTitle: brand.metaTitle,
        metaDescription: brand.metaDescription,
      },
      create: {
        name: brand.name,
        slug: brand.slug,
        logo: brand.logo,
        description: brand.description,
        website: brand.website,
        metaTitle: brand.metaTitle,
        metaDescription: brand.metaDescription,
        isActive: true,
      },
    });
    console.log(`  ├─ ${brand.name}`);
  }

  console.log(`  Total brands seeded: ${BRANDS.length}`);
}
