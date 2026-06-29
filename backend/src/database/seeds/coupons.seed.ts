import { PrismaClient, CouponType } from '@prisma/client';

interface CouponSeed {
  code: string;
  description: string;
  type: CouponType;
  value: number;
  minimumOrder: number | null;
  maximumDiscount: number | null;
  usageLimit: number | null;
  startsAt: Date;
  expiresAt: Date;
}

const COUPONS: CouponSeed[] = [
  {
    code: 'WELCOME10',
    description: 'Get 10% off on your first order. Minimum order value ₹500.',
    type: CouponType.PERCENTAGE,
    value: 10,
    minimumOrder: 500,
    maximumDiscount: 200,
    usageLimit: 1,
    startsAt: new Date('2024-01-01'),
    expiresAt: new Date('2026-12-31'),
  },
  {
    code: 'FLAT200',
    description: 'Flat ₹200 off on orders above ₹1000.',
    type: CouponType.FIXED,
    value: 200,
    minimumOrder: 1000,
    maximumDiscount: null,
    usageLimit: 5,
    startsAt: new Date('2024-01-01'),
    expiresAt: new Date('2026-12-31'),
  },
  {
    code: 'FREESHIP',
    description: 'Get free shipping on your order. No minimum order value.',
    type: CouponType.FREE_SHIPPING,
    value: 0,
    minimumOrder: null,
    maximumDiscount: null,
    usageLimit: 10,
    startsAt: new Date('2024-01-01'),
    expiresAt: new Date('2026-12-31'),
  },
  {
    code: 'NEWUSER',
    description: '15% off for new users. Maximum discount ₹300.',
    type: CouponType.PERCENTAGE,
    value: 15,
    minimumOrder: 300,
    maximumDiscount: 300,
    usageLimit: 1,
    startsAt: new Date('2024-01-01'),
    expiresAt: new Date('2026-12-31'),
  },
  {
    code: 'SALE50',
    description: '50% off up to ₹500 on orders above ₹2000.',
    type: CouponType.PERCENTAGE,
    value: 50,
    minimumOrder: 2000,
    maximumDiscount: 500,
    usageLimit: 3,
    startsAt: new Date('2024-01-01'),
    expiresAt: new Date('2026-12-31'),
  },
];

export async function seedCoupons(prisma: PrismaClient) {
  console.log('Seeding coupons...');

  for (const coupon of COUPONS) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: {
        description: coupon.description,
        type: coupon.type,
        value: coupon.value,
        minimumOrder: coupon.minimumOrder,
        maximumDiscount: coupon.maximumDiscount,
        usageLimit: coupon.usageLimit,
        startsAt: coupon.startsAt,
        expiresAt: coupon.expiresAt,
      },
      create: {
        ...coupon,
        isActive: true,
      },
    });
    console.log(`  ├─ ${coupon.code}: ${coupon.description}`);
  }

  console.log(`  Total coupons seeded: ${COUPONS.length}`);
}
