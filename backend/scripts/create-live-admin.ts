import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

async function main() {
  const prisma = new PrismaClient();
  const email = process.env.ADMIN_EMAIL ?? 'admin@apnakit.in';
  const password = process.env.ADMIN_PASSWORD ?? randomBytes(9).toString('base64url') + 'A1!';

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: Role.ADMIN,
      isVerified: true,
      isActive: true,
    },
    create: {
      email,
      phone: '9000000001',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'ApnaKit',
      role: Role.ADMIN,
      isVerified: true,
      isActive: true,
    },
  });
  console.log(JSON.stringify({ email, password, id: user.id }));
  await prisma.$disconnect();
}

main().catch((e) => { console.error('failed:', e.message); process.exit(1); });
