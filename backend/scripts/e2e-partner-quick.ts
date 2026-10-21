/**
 * End-to-end test for: partner referral codes, customer discount, partner
 * commission lifecycle, partner dashboard, coupons, and the Quick / Shop All split.
 *
 * Drives the real HTTP API. Creates its own users/partners/coupons with an
 * "e2e" prefix and restores every setting it touches.
 *
 *   BASE_URL=http://localhost:4000/api/v1 \
 *   DATABASE_URL=... JWT_SECRET=... \
 *   npx ts-node scripts/e2e-partner-quick.ts
 */
import { PrismaClient, Role, CouponType } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

const BASE = process.env.BASE_URL ?? 'http://localhost:4000/api/v1';
const JWT_SECRET = process.env.JWT_SECRET ?? 'super-secret-jwt-key';
const prisma = new PrismaClient();

let passed = 0;
let failed = 0;
const failures: string[] = [];

function check(name: string, ok: boolean, detail?: unknown) {
  if (ok) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    failures.push(name);
    console.log(`  FAIL  ${name}${detail !== undefined ? ` -> ${JSON.stringify(detail)}` : ''}`);
  }
}

const rand = (n = 4) => randomBytes(n).toString('hex').slice(0, n);
const round2 = (n: number) => Math.round(n * 100) / 100;

async function api(method: string, path: string, token?: string, body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  // The API wraps payloads as { statusCode, message, data }.
  const data = json && typeof json === 'object' && 'data' in json ? json.data : json;
  const message = json && typeof json === 'object' ? json.message : undefined;
  return { status: res.status, data, message, raw: json };
}

async function makeUser(label: string, role: Role = Role.CUSTOMER) {
  const user = await prisma.user.create({
    data: {
      email: `e2e-${label}-${rand(6)}@test.local`,
      password: 'not-used',
      firstName: `E2e${label}`,
      lastName: 'Test',
      role,
      isVerified: true,
    },
  });
  const sessionId = `e2e-sess-${rand(10)}`;
  await prisma.session.create({
    data: {
      id: sessionId,
      userId: user.id,
      token: `e2e-tok-${rand(12)}`,
      refreshToken: `e2e-ref-${rand(12)}`,
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
    },
  });
  const token = jwt.sign(
    { sub: user.id, email: user.email, role: user.role, sessionId },
    JWT_SECRET,
    { expiresIn: '1h' },
  );
  return { user, token };
}

async function main() {
  console.log(`Target: ${BASE}\n`);

  // ── Snapshot settings we will change ────────────────────────────────────
  const storeRow = await prisma.systemSettings.findUnique({ where: { key: 'store' } });
  const originalStore = storeRow?.value ?? null;
  await prisma.systemSettings.upsert({
    where: { key: 'store' },
    update: {
      value: {
        ...((originalStore as object) ?? {}),
        storeOpen: true,
        openTime: '00:00',
        closeTime: '23:59',
        storeOpenDays: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      },
    },
    create: {
      key: 'store',
      value: {
        storeOpen: true,
        openTime: '00:00',
        closeTime: '23:59',
        storeOpenDays: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      },
    },
  });

  const products = await prisma.product.findMany({
    where: { isActive: true, variants: { some: { isActive: true, stock: { gt: 20 } } } },
    include: { variants: { where: { isActive: true, stock: { gt: 20 } }, take: 1 } },
    take: 6,
    orderBy: { createdAt: 'asc' },
  });
  if (products.length < 3) throw new Error('Need at least 3 in-stock products in the database');
  const [prodA, prodB, prodC] = products;

  const createdUserIds: string[] = [];
  const createdCouponIds: string[] = [];
  const touchedProducts = [prodA.id, prodB.id];
  const pinnedSnapshot: Array<{ id: string; sectionId: string; productId: string; sortOrder: number; isActive: boolean }> = [];
  const originalDelivery = new Map(products.map((p) => [p.id, p.deliveryHours]));

  try {
    // ── Users ─────────────────────────────────────────────────────────────
    const admin = await makeUser('admin', Role.ADMIN);
    const partnerU = await makeUser('partner');
    const partner2U = await makeUser('partner2');
    const custA = await makeUser('custA');
    const custB = await makeUser('custB');
    createdUserIds.push(admin.user.id, partnerU.user.id, partner2U.user.id, custA.user.id, custB.user.id);

    const addrA = await prisma.address.create({
      data: { userId: custA.user.id, name: 'E2E A', phone: '9999999999', addressLine1: '1 Test St', city: 'Test', state: 'DL', pincode: '110001' },
    });
    const addrB = await prisma.address.create({
      data: { userId: custB.user.id, name: 'E2E B', phone: '9999999998', addressLine1: '2 Test St', city: 'Test', state: 'DL', pincode: '110001' },
    });

    // ── 1. Partner creation (admin) ───────────────────────────────────────
    console.log('\n1. Partner creation');
    const codeSuffix = rand(4).toUpperCase();
    const partnerCode = `APN-${codeSuffix}`;
    const code2 = `APN-${rand(4).toUpperCase()}`;

    const createPartner = await api('POST', '/partners', admin.token, {
      userId: partnerU.user.id,
      code: partnerCode.toLowerCase(), // exercise normalisation
      customerDiscountType: 'PERCENTAGE',
      customerDiscountValue: 10,
      commissionRate: 5,
    });
    check('admin creates partner (201/200)', createPartner.status < 300, createPartner);
    check('code is normalised to uppercase', createPartner.data?.code === partnerCode, createPartner.data?.code);
    const partnerId: string = createPartner.data?.id;

    const dupe = await api('POST', '/partners', admin.token, { userId: partner2U.user.id, code: partnerCode });
    check('duplicate code rejected (409)', dupe.status === 409, dupe.status);

    const dupeUser = await api('POST', '/partners', admin.token, { userId: partnerU.user.id, code: `APN-${rand(4).toUpperCase()}` });
    check('same user cannot become partner twice (409)', dupeUser.status === 409, dupeUser.status);

    const badCode = await api('POST', '/partners', admin.token, { userId: partner2U.user.id, code: 'a b' });
    check('invalid code format rejected (400)', badCode.status === 400, badCode.status);

    const p2 = await api('POST', '/partners', admin.token, { userId: partner2U.user.id, code: code2 });
    check('second partner created with own code', p2.status < 300 && p2.data?.code === code2, p2);
    const partner2Id: string = p2.data?.id;

    const notAdmin = await api('POST', '/partners', custA.token, { userId: custB.user.id, code: `APN-${rand(4).toUpperCase()}` });
    check('customer cannot create partner (403)', notAdmin.status === 403, notAdmin.status);

    // ── 2. Code validation (public) ──────────────────────────────────────
    console.log('\n2. Code validation');
    const v1 = await api('POST', '/partners/validate', undefined, { code: partnerCode.toLowerCase() });
    check('valid code validates', v1.data?.valid === true, v1.data);
    check('validation exposes discount, not partner identity', v1.data?.customerDiscountValue === 10 && !('userId' in (v1.data ?? {})), v1.data);
    const v2 = await api('POST', '/partners/validate', undefined, { code: 'NOPE-0000' });
    check('unknown code invalid', v2.data?.valid === false, v2.data);

    // ── 3. Customer applies code, discount preview ────────────────────────
    console.log('\n3. Customer applies partner code to cart');
    const priceA = Number(prodA.variants[0].price);
    const add1 = await api('POST', '/cart/items', custA.token, { productId: prodA.id, variantId: prodA.variants[0].id, quantity: 2 });
    check('custA adds item to cart', add1.status < 300, add1);

    const apply = await api('POST', '/cart/partner-code', custA.token, { code: partnerCode.toLowerCase() });
    check('custA applies partner code', apply.status < 300, apply);
    const expectedSubtotal = round2(priceA * 2);
    const expectedDisc = round2(expectedSubtotal * 0.1);
    check(
      'preview discount = 10% of subtotal',
      Math.abs((apply.data?.partner?.estimatedDiscount ?? -1) - expectedDisc) < 0.01,
      { got: apply.data?.partner?.estimatedDiscount, expected: expectedDisc },
    );

    // Self-referral block
    await api('POST', '/cart/items', partnerU.token, { productId: prodB.id, variantId: prodB.variants[0].id, quantity: 1 });
    const selfUse = await api('POST', '/cart/partner-code', partnerU.token, { code: partnerCode });
    check('partner cannot use own code (400)', selfUse.status === 400, selfUse.status);

    // Unknown code on cart
    await api('POST', '/cart/items', custB.token, { productId: prodC.id, variantId: prodC.variants[0].id, quantity: 1 });
    const badApply = await api('POST', '/cart/partner-code', custB.token, { code: 'NOPE-0000' });
    check('unknown code rejected on cart (404)', badApply.status === 404, badApply.status);

    // ── 4. Order placement with partner discount + commission ─────────────
    console.log('\n4. Order placement');
    const order1 = await api('POST', '/orders', custA.token, { addressId: addrA.id, paymentMethod: 'COD' });
    check('order 1 placed', order1.status < 300 && !!order1.data?.id, order1);
    const order1Id: string = order1.data?.id;

    const o1 = await prisma.order.findUnique({ where: { id: order1Id }, include: { partnerCommission: true } });
    check('order records partner code', o1?.partnerCode === partnerCode, o1?.partnerCode);
    check('order discount includes 10% partner discount', Math.abs(Number(o1?.partnerDiscount) - expectedDisc) < 0.01, {
      got: Number(o1?.partnerDiscount),
      expected: expectedDisc,
    });
    const net1 = round2(expectedSubtotal - expectedDisc);
    const comm1 = round2(net1 * 0.05);
    check('commission row created for order 1', !!o1?.partnerCommission, null);
    check('commission = 5% of net merchandise', Math.abs(Number(o1?.partnerCommission?.commissionAmount) - comm1) < 0.01, {
      got: Number(o1?.partnerCommission?.commissionAmount),
      expected: comm1,
    });
    check('commission starts PENDING', o1?.partnerCommission?.status === 'PENDING', o1?.partnerCommission?.status);
    check('commission points at the right partner', o1?.partnerCommission?.partnerId === partnerId, null);
    const custARow = await prisma.user.findUnique({ where: { id: custA.user.id } });
    check('customer is attributed to partner', custARow?.referredByPartnerId === partnerId, custARow?.referredByPartnerId);

    // Second order by same customer WITHOUT code -> no discount, commission still earned
    await api('POST', '/cart/items', custA.token, { productId: prodC.id, variantId: prodC.variants[0].id, quantity: 1 });
    const order2 = await api('POST', '/orders', custA.token, { addressId: addrA.id, paymentMethod: 'COD' });
    check('order 2 placed without code', order2.status < 300, order2);
    const order2Id: string = order2.data?.id;
    const o2 = await prisma.order.findUnique({ where: { id: order2Id }, include: { partnerCommission: true } });
    check('order 2 has no partner discount', Number(o2?.partnerDiscount) === 0 && !o2?.partnerCode, { d: o2?.partnerDiscount, c: o2?.partnerCode });
    check('order 2 still earns partner commission (attribution)', o2?.partnerCommission?.partnerId === partnerId, null);

    // Attribution is locked: another partner's code is refused
    const lockTry = await api('POST', '/cart/partner-code', custA.token, { code: code2 });
    check('customer cannot switch to another partner (400)', lockTry.status === 400, lockTry.status);

    // ── 5. Commission lifecycle ──────────────────────────────────────────
    console.log('\n5. Commission lifecycle');
    await new Promise((r) => setTimeout(r, 1200)); // let COD auto-confirm finish
    const flow = ['PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    let stepOk = true;
    for (const status of flow) {
      const r = await api('PATCH', `/orders/${order1Id}/status`, admin.token, { status });
      if (r.status >= 300) {
        stepOk = false;
        console.log(`    step ${status} -> ${r.status} ${r.message}`);
        break;
      }
    }
    check('order 1 moved to DELIVERED', stepOk);
    const c1 = await prisma.partnerCommission.findUnique({ where: { orderId: order1Id } });
    check('commission CONFIRMED on delivery', c1?.status === 'CONFIRMED', c1?.status);

    const cancel2 = await api('POST', `/orders/${order2Id}/cancel`, custA.token);
    check('customer cancels order 2', cancel2.status < 300, cancel2);
    const c2 = await prisma.partnerCommission.findUnique({ where: { orderId: order2Id } });
    check('commission CANCELLED when order cancelled', c2?.status === 'CANCELLED', c2?.status);

    // ── 6. Partner dashboard ─────────────────────────────────────────────
    console.log('\n6. Partner dashboard');
    const mine = await api('GET', '/partners/me', partnerU.token);
    check('partner sees isPartner=true', mine.data?.isPartner === true, mine.data?.isPartner);
    check('partner sees own code', mine.data?.code === partnerCode, mine.data?.code);
    check('partner sees customer count = 1', mine.data?.customerCount === 1, mine.data?.customerCount);
    check('confirmed earnings equal order 1 commission', Math.abs((mine.data?.earnings?.confirmed ?? -1) - comm1) < 0.01, mine.data?.earnings);
    check('cancelled earnings equal order 2 commission', Math.abs((mine.data?.earnings?.cancelled ?? -1) - Number(c2?.commissionAmount)) < 0.01, mine.data?.earnings);
    check('commission table has 2 rows', mine.data?.commissions?.length === 2, mine.data?.commissions?.length);
    const row = mine.data?.commissions?.find((c: any) => c.orderNumber === o1?.orderNumber);
    check('table row shows order amount & status', row?.status === 'CONFIRMED' && Math.abs(row?.orderAmount - net1) < 0.01, row);
    check('customer name is masked', typeof row?.customerName === 'string' && row.customerName.startsWith('E') && row.customerName.includes('*'), row?.customerName);

    const notPartner = await api('GET', '/partners/me', custB.token);
    check('non-partner gets isPartner=false', notPartner.data?.isPartner === false, notPartner.data);

    // ── 7. Admin payout ──────────────────────────────────────────────────
    console.log('\n7. Admin payout');
    const payCancelled = await api('POST', `/partners/commissions/${c2?.id}/pay`, admin.token);
    check('cannot pay a CANCELLED commission (400)', payCancelled.status === 400, payCancelled.status);
    const pay = await api('POST', `/partners/commissions/${c1?.id}/pay`, admin.token);
    check('admin marks CONFIRMED commission PAID', pay.status < 300 && pay.data?.status === 'PAID', pay);
    const mine2 = await api('GET', '/partners/me', partnerU.token);
    check('paid total reflects payout', Math.abs((mine2.data?.earnings?.paid ?? -1) - comm1) < 0.01, mine2.data?.earnings);

    const list = await api('GET', '/partners', admin.token);
    const listed = Array.isArray(list.data) ? list.data.find((p: any) => p.id === partnerId) : null;
    check('admin list shows partner with customerCount', listed?.customerCount === 1, listed?.customerCount);

    // ── 8. Quick vs Shop All split ───────────────────────────────────────
    console.log('\n8. Quick / Shop All');
    // Unpin the probe products so only delivery hours decide their tab.
    const pinnedRows = await prisma.homeSectionItem.findMany({
      where: { productId: { in: [prodA.id, prodB.id] }, section: { key: 'QUICK' } },
    });
    pinnedSnapshot.push(...pinnedRows);
    await prisma.homeSectionItem.deleteMany({ where: { id: { in: pinnedRows.map((r) => r.id) } } });
    await prisma.product.update({ where: { id: prodA.id }, data: { deliveryHours: 12 } });
    await prisma.product.update({ where: { id: prodB.id }, data: { deliveryHours: 48 } });

    const quick = await api('GET', '/home-sections/QUICK?limit=500');
    const shop = await api('GET', '/home-sections/SHOP_ALL?limit=500');
    const quickIds = new Set((quick.data?.items ?? []).map((i: any) => i.productId));
    const shopIds = new Set((shop.data?.items ?? []).map((i: any) => i.productId));
    check('product delivered in 12h is in Quick', quickIds.has(prodA.id));
    check('product delivered in 48h is NOT in Quick', !quickIds.has(prodB.id));
    check('product delivered in 48h is in Shop All', shopIds.has(prodB.id));
    check('product delivered in 12h is NOT in Shop All', !shopIds.has(prodA.id));
    const overlap = [...quickIds].filter((id) => shopIds.has(id));
    check('no product appears in both tabs', overlap.length === 0, overlap.length);

    const activeCount = await prisma.product.count({ where: { isActive: true } });
    const summary = await api('GET', '/home-sections');
    const total = (summary.data ?? []).reduce((s: number, x: any) => s + (x.itemCount ?? 0), 0);
    check('every active product is in exactly one tab', total === activeCount, { total, activeCount });

    // ── 9. Coupons ───────────────────────────────────────────────────────
    console.log('\n9. Coupons');
    const couponCode = `E2E${rand(5).toUpperCase()}`;
    const coupon = await api('POST', '/coupons', admin.token, {
      code: couponCode,
      type: 'PERCENTAGE',
      value: 10,
      usageLimit: 100,
      startsAt: new Date(Date.now() - 86400000).toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
      isActive: true,
    });
    check('admin creates coupon', coupon.status < 300, coupon);
    if (coupon.data?.id) createdCouponIds.push(coupon.data.id);

    const cv = await api('POST', '/coupons/validate', custB.token, { code: couponCode, cartTotal: 999 });
    check('coupon validates for a logged-in customer', cv.status < 300 && (cv.data?.valid ?? true) !== false, cv.data);

    await api('POST', '/cart/items', custB.token, { productId: prodB.id, variantId: prodB.variants[0].id, quantity: 1 });
    const useCoupon = await api('POST', '/cart/coupon', custB.token, { code: couponCode });
    check('custB applies coupon to cart', useCoupon.status < 300, useCoupon);
    const orderB = await api('POST', '/orders', custB.token, { addressId: addrB.id, paymentMethod: 'COD' });
    check('custB places order with coupon', orderB.status < 300, orderB);
    const ob = await prisma.order.findUnique({ where: { id: orderB.data?.id } });
    check('coupon discount applied to order', Number(ob?.discount) > 0, Number(ob?.discount));

    await api('POST', '/cart/items', custB.token, { productId: prodC.id, variantId: prodC.variants[0].id, quantity: 1 });
    const reuse = await api('POST', '/cart/coupon', custB.token, { code: couponCode });
    check('same customer cannot reuse coupon (400)', reuse.status === 400, reuse.status);
    await api('DELETE', '/cart', custB.token); // clear cart (may 404 if route absent)

    const expired = await api('POST', '/coupons', admin.token, {
      code: `E2EX${rand(4).toUpperCase()}`,
      type: 'FIXED',
      value: 50,
      startsAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      expiresAt: new Date(Date.now() - 86400000).toISOString(),
      isActive: true,
    });
    if (expired.data?.id) createdCouponIds.push(expired.data.id);
    if (expired.data?.code) {
      await api('POST', '/cart/items', custB.token, { productId: prodA.id, variantId: prodA.variants[0].id, quantity: 1 });
      const ex = await api('POST', '/cart/coupon', custB.token, { code: expired.data.code });
      check('expired coupon rejected (400)', ex.status === 400, ex.status);
    }
  } finally {
    // ── Cleanup ──────────────────────────────────────────────────────────
    console.log('\nCleanup');
    if (pinnedSnapshot.length) {
      await prisma.homeSectionItem.createMany({ data: pinnedSnapshot, skipDuplicates: true });
    }
    for (const id of touchedProducts) {
      await prisma.product.update({ where: { id }, data: { deliveryHours: originalDelivery.get(id) ?? null } });
    }
    await prisma.coupon.deleteMany({ where: { id: { in: createdCouponIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await prisma.partner.deleteMany({ where: { code: { startsWith: 'APN-' }, user: { email: { endsWith: '@test.local' } } } }).catch(() => {});
    if (originalStore) {
      await prisma.systemSettings.update({ where: { key: 'store' }, data: { value: originalStore as any } });
    } else {
      await prisma.systemSettings.deleteMany({ where: { key: 'store' } });
    }
    await prisma.$disconnect();
  }

  console.log(`\nResult: ${passed} passed, ${failed} failed`);
  if (failed) {
    console.log('Failed:\n - ' + failures.join('\n - '));
    process.exit(1);
  }
}

main().catch(async (e) => {
  console.error('Test run crashed:', e);
  await prisma.$disconnect();
  process.exit(1);
});
