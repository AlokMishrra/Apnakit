import { PrismaClient } from '@prisma/client';
import { seedUsers } from './users.seed';
import { seedCategories } from './categories.seed';
import { seedBrands } from './brands.seed';
import { seedProducts } from './products.seed';
import { seedBanners } from './banners.seed';
import { seedCoupons } from './coupons.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...\n');

  try {
    await seedUsers(prisma);
    console.log('');

    await seedCategories(prisma);
    console.log('');

    await seedBrands(prisma);
    console.log('');

    await seedProducts(prisma);
    console.log('');

    await seedBanners(prisma);
    console.log('');

    await seedCoupons(prisma);
    console.log('');

    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
