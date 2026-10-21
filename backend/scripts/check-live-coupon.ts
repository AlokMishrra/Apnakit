import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

const B = process.env.BASE_URL ?? 'https://apnakit-backend.onrender.com/api/v1';
const CODE = `LIVE${Date.now().toString().slice(-6)}`;

async function main() {
  const prisma = new PrismaClient();
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) throw new Error('no admin user');

  const sid = `live-check-${Date.now()}`;
  await prisma.session.create({
    data: { id: sid, userId: admin.id, token: `t${Date.now()}`, refreshToken: `r${Date.now()}`, expiresAt: new Date(Date.now() + 3600000) },
  });
  const token = jwt.sign({ sub: admin.id, email: admin.email, role: admin.role, sessionId: sid }, process.env.JWT_SECRET!, { expiresIn: '1h' });

  const created = await prisma.coupon.create({
    data: {
      code: CODE,
      type: 'PERCENTAGE',
      value: 10,
      startsAt: new Date(Date.now() - 86400000),
      expiresAt: new Date(Date.now() + 86400000 * 30),
      isActive: true,
    },
  });

  const post = async (body: unknown) => {
    const r = await fetch(`${B}/coupons/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    return { status: r.status, body: await r.json() };
  };

  const good = await post({ code: CODE, cartTotal: 999 });
  console.log(`  valid coupon   -> ${good.status} ${JSON.stringify(good.body).slice(0, 200)}`);
  const bad = await post({ code: 'NOPE-0000', cartTotal: 999 });
  console.log(`  unknown coupon -> ${bad.status} ${JSON.stringify(bad.body).slice(0, 140)}`);

  const listed = await fetch(`${B}/coupons`, { headers: { Authorization: `Bearer ${token}` } });
  const listBody = await listed.json();
  const rows = Array.isArray(listBody?.data) ? listBody.data : [];
  console.log(`  admin list     -> ${listed.status}, ${rows.length} coupon(s)`);

  await prisma.coupon.delete({ where: { id: created.id } });
  await prisma.session.delete({ where: { id: sid } });
  await prisma.$disconnect();
  console.log('  cleanup done');
}

main().catch((e) => { console.error('  failed:', e.message); process.exit(1); });
