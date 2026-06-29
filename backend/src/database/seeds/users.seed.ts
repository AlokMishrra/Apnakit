import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function seedUsers(prisma: PrismaClient) {
  console.log('Seeding users...');

  const hashedPassword = await bcrypt.hash('admin123', SALT_ROUNDS);
  const sellerPassword = await bcrypt.hash('seller123', SALT_ROUNDS);
  const customerPassword = await bcrypt.hash('customer123', SALT_ROUNDS);
  const deliveryPassword = await bcrypt.hash('delivery123', SALT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@apnakit.in' },
    update: {},
    create: {
      email: 'admin@apnakit.in',
      phone: '9000000001',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'ApnaKit',
      role: Role.ADMIN,
      isVerified: true,
      isActive: true,
    },
  });

  const sellers = await Promise.all([
    prisma.user.upsert({
      where: { email: 'seller1@apnakit.in' },
      update: {},
      create: {
        email: 'seller1@apnakit.in',
        phone: '9000000002',
        password: sellerPassword,
        firstName: 'Rajesh',
        lastName: 'Kumar',
        role: Role.SELLER,
        isVerified: true,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'seller2@apnakit.in' },
      update: {},
      create: {
        email: 'seller2@apnakit.in',
        phone: '9000000003',
        password: sellerPassword,
        firstName: 'Priya',
        lastName: 'Sharma',
        role: Role.SELLER,
        isVerified: true,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'seller3@apnakit.in' },
      update: {},
      create: {
        email: 'seller3@apnakit.in',
        phone: '9000000004',
        password: sellerPassword,
        firstName: 'Amit',
        lastName: 'Patel',
        role: Role.SELLER,
        isVerified: true,
        isActive: true,
      },
    }),
  ]);

  const seller1 = await prisma.seller.upsert({
    where: { userId: sellers[0].id },
    update: {},
    create: {
      userId: sellers[0].id,
      businessName: 'Kumar Electronics',
      businessType: 'PRIVATE_LIMITED',
      gstNumber: '27AABCU9603R1ZM',
      isVerified: true,
      isActive: true,
      commission: 5.0,
    },
  });

  const seller2 = await prisma.seller.upsert({
    where: { userId: sellers[1].id },
    update: {},
    create: {
      userId: sellers[1].id,
      businessName: 'Sharma Fashion Hub',
      businessType: 'PROPRIETORSHIP',
      gstNumber: '06AABCS1234M1ZP',
      isVerified: true,
      isActive: true,
      commission: 8.0,
    },
  });

  const seller3 = await prisma.seller.upsert({
    where: { userId: sellers[2].id },
    update: {},
    create: {
      userId: sellers[2].id,
      businessName: 'Patel Home Essentials',
      businessType: 'PARTNERSHIP',
      gstNumber: '09AABCP5678N1ZQ',
      isVerified: true,
      isActive: true,
      commission: 6.0,
    },
  });

  const customers = await Promise.all([
    prisma.user.upsert({
      where: { email: 'customer1@apnakit.in' },
      update: {},
      create: {
        email: 'customer1@apnakit.in',
        phone: '9100000001',
        password: customerPassword,
        firstName: 'Anjali',
        lastName: 'Mehta',
        role: Role.CUSTOMER,
        isVerified: true,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'customer2@apnakit.in' },
      update: {},
      create: {
        email: 'customer2@apnakit.in',
        phone: '9100000002',
        password: customerPassword,
        firstName: 'Vikram',
        lastName: 'Singh',
        role: Role.CUSTOMER,
        isVerified: true,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'customer3@apnakit.in' },
      update: {},
      create: {
        email: 'customer3@apnakit.in',
        phone: '9100000003',
        password: customerPassword,
        firstName: 'Neha',
        lastName: 'Gupta',
        role: Role.CUSTOMER,
        isVerified: true,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'customer4@apnakit.in' },
      update: {},
      create: {
        email: 'customer4@apnakit.in',
        phone: '9100000004',
        password: customerPassword,
        firstName: 'Rohan',
        lastName: 'Verma',
        role: Role.CUSTOMER,
        isVerified: false,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'customer5@apnakit.in' },
      update: {},
      create: {
        email: 'customer5@apnakit.in',
        phone: '9100000005',
        password: customerPassword,
        firstName: 'Sneha',
        lastName: 'Reddy',
        role: Role.CUSTOMER,
        isVerified: true,
        isActive: true,
      },
    }),
  ]);

  const deliveryUser = await prisma.user.upsert({
    where: { email: 'delivery@apnakit.in' },
    update: {},
    create: {
      email: 'delivery@apnakit.in',
      phone: '9200000001',
      password: deliveryPassword,
      firstName: 'Karan',
      lastName: 'Thakur',
      role: Role.DELIVERY,
      isVerified: true,
      isActive: true,
    },
  });

  const deliveryPartner = await prisma.deliveryPartner.upsert({
    where: { userId: deliveryUser.id },
    update: {},
    create: {
      userId: deliveryUser.id,
      vehicleType: 'Bike',
      vehicleNumber: 'MH-02-AB-1234',
      licenseNumber: 'MH-2023-0012345',
      isAvailable: true,
      rating: 4.8,
      totalDeliveries: 256,
    },
  });

  await prisma.wallet.create({
    data: {
      userId: customers[0].id,
      balance: 500.0,
      transactions: {
        create: {
          amount: 500.0,
          type: 'CREDIT',
          description: 'Welcome bonus',
        },
      },
    },
  });

  console.log(`  Created admin: ${admin.email}`);
  console.log(`  Created sellers: ${sellers.map((s) => s.email).join(', ')}`);
  console.log(`  Created customers: ${customers.map((c) => c.email).join(', ')}`);
  console.log(`  Created delivery partner: ${deliveryUser.email}`);

  return { admin, sellers, seller1, seller2, seller3, customers, deliveryUser, deliveryPartner };
}
