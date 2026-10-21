/**
 * End-to-end test: partner referral links -> Supabase attribution -> storefront
 * discount -> order -> commission ledger (Supabase) -> status changes -> partner view.
 *
 * Runs against the real Supabase project (service role) and the storefront API.
 * It creates a temporary partner in Supabase Auth and removes every row it
 * created afterwards, including the auth user.
 *
 *   BASE_URL=http://localhost:4000/api/v1 DATABASE_URL=... \
 *   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... JWT_SECRET=... \
 *   npx ts-node scripts/e2e-referral-supabase.ts
 */
import { PrismaClient, Role } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

const BASE = process.env.BASE_URL ?? 'http://localhost:4000/api/v1';
const JWT_SECRET = process.env.JWT_SECRET ?? 'super-secret-jwt-key';
const SB = process.env.SUPABASE_URL!;
const SK = process.env.SUPABASE_SERVICE_KEY!;
if (!SB || !SK) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required');

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
const CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

async function api(method: string, path: string, token?: string, body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch { json = text; }
  const data = json && typeof json === 'object' && 'data' in json ? json.data : json;
  return { status: res.status, data, message: json?.message, raw: json };
}

async function sb(method: string, path: string, body?: unknown, prefer?: string) {
  const res = await fetch(`${SB}${path}`, {
    method,
    headers: {
      apikey: SK,
      Authorization: `Bearer ${SK}`,
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  try { return { status: res.status, data: text ? JSON.parse(text) : null }; }
  catch { return { status: res.status, data: text }; }
}

async function makeStorefrontUser(label: string, role: Role = Role.CUSTOMER, email?: string) {
  const user = await prisma.user.create({
    data: {
      email: email ?? `e2e-${label}-${rand(6)}@test.local`,
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
  const token = jwt.sign({ sub: user.id, email: user.email, role: user.role, sessionId }, JWT_SECRET, { expiresIn: '1h' });
  return { user, token };
}

async function addressFor(userId: string) {
  return prisma.address.create({
    data: { userId, name: 'E2E', phone: '9999999999', addressLine1: '1 Test St', city: 'Test', state: 'DL', pincode: '110001' },
  });
}

async function main() {
  console.log(`Target: ${BASE}\nSupabase: ${SB}\n`);

  // ── Snapshot storefront state we change ──────────────────────────────────
  const storeRow = await prisma.systemSettings.findUnique({ where: { key: 'store' } });
  const originalStore = storeRow?.value ?? null;
  const allDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  await prisma.systemSettings.upsert({
    where: { key: 'store' },
    update: { value: { ...((originalStore as object) ?? {}), storeOpen: true, openTime: '00:00', closeTime: '23:59', storeOpenDays: allDays } },
    create: { key: 'store', value: { storeOpen: true, openTime: '00:00', closeTime: '23:59', storeOpenDays: allDays } },
  });

  const limca = await prisma.product.findUnique({
    where: { slug: 'limca-cold-drink' },
    include: { variants: { where: { isActive: true }, take: 1 } },
  });
  if (!limca?.variants[0]) throw new Error('limca-cold-drink with an active variant is required in the storefront DB');
  // Give the test variant known stock; the original is restored in cleanup.
  const limcaVariantId = limca.variants[0].id;
  const originalStock = limca.variants[0].stock;
  await prisma.productVariant.update({ where: { id: limcaVariantId }, data: { stock: 100 } });

  const createdUserIds: string[] = [];
  let partnerUid: string | null = null;
  let partnerCode = '';
  let partnerEmail = '';
  const sessionS = `e2e-link-${rand(8)}`;

  try {
    // ── Setup: temporary partner in Supabase Auth ─────────────────────────
    console.log('Setup');
    partnerEmail = `e2e-partner-${rand(6)}@test.local`;
    const created = await sb('POST', '/auth/v1/admin/users', {
      email: partnerEmail,
      password: `Pw-${rand(12)}`,
      email_confirm: true,
      user_metadata: { full_name: 'E2E Partner', account_type: 'earning_partner' },
    });
    partnerUid = created.data?.id ?? null;
    check('temporary partner created in Supabase Auth', created.status < 300 && !!partnerUid, created.data);
    if (!partnerUid) throw new Error('could not create partner');

    await sb('POST', '/rest/v1/partner_profiles', { id: partnerUid, user_id: partnerUid }, 'resolution=ignore-duplicates');
    partnerCode = 'APK-' + Array.from(randomBytes(5)).map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
    const codeRes = await sb('POST', '/rest/v1/partner_referral_codes', { partner_id: partnerUid, code: partnerCode });
    check('partner referral code created', codeRes.status < 300, codeRes.data);

    const buyer = await makeStorefrontUser('buyer');
    createdUserIds.push(buyer.user.id);
    const buyerAddr = await addressFor(buyer.user.id);
    const buyer2 = await makeStorefrontUser('buyer2');
    createdUserIds.push(buyer2.user.id);
    const buyer2Addr = await addressFor(buyer2.user.id);
    const selfUser = await makeStorefrontUser('self', Role.CUSTOMER, partnerEmail);
    createdUserIds.push(selfUser.user.id);
    const admin = await makeStorefrontUser('admin', Role.ADMIN);
    createdUserIds.push(admin.user.id);

    // ── 1. Link click -> attribution ─────────────────────────────────────
    console.log('\n1. Partner link click (Supabase attribution)');
    const bogus = await api('POST', '/referrals/track', undefined, { code: 'APK-ZZZZZ', sessionId: sessionS });
    check('unknown code is not attributed', bogus.data?.attributed === false, bogus.data);

    const click = await api('POST', '/referrals/track', undefined, {
      code: partnerCode.toLowerCase(),
      productSlug: 'limca-cold-drink',
      sessionId: sessionS,
      landingUrl: `https://apnakit.vercel.app/product/limca-cold-drink?ref=${partnerCode}`,
    });
    check('valid link click is attributed', click.data?.attributed === true, click.data);
    check('click returns the normalised code', click.data?.referralCode === partnerCode, click.data);

    const attr = await sb('GET', `/rest/v1/referral_attributions?session_id=eq.${sessionS}&select=*`);
    check('attribution row written in Supabase', Array.isArray(attr.data) && attr.data.length === 1, attr.data);
    check('attribution is not yet converted', attr.data?.[0]?.is_converted === false, attr.data?.[0]);

    const pv = await api('GET', `/referrals/preview?sessionId=${sessionS}`);
    check('preview shows referral with 5% customer discount', pv.data?.attributed === true && pv.data?.discountPercent === 5, pv.data);

    // ── 2. Order from the link: discount + commission ────────────────────
    console.log('\n2. Order from the referral link');
    const priceL = Number(limca.variants[0].price);
    await api('POST', '/cart/items', buyer.token, { productId: limca.id, variantId: limca.variants[0].id, quantity: 2 });
    const subtotal = round2(priceL * 2);
    const expectedDisc = round2(subtotal * 0.05);

    const o1 = await api('POST', '/orders', buyer.token, { addressId: buyerAddr.id, paymentMethod: 'COD', referralSessionId: sessionS });
    check('order 1 placed', o1.status < 300 && !!o1.data?.orderNumber, o1.raw);
    const o1Num: string = o1.data?.orderNumber;
    const o1Db = await prisma.order.findUnique({ where: { orderNumber: o1Num } });
    check('order carries partner code', o1Db?.partnerCode === partnerCode, o1Db?.partnerCode);
    check('customer discount = 5% of subtotal', Math.abs(Number(o1Db?.partnerDiscount) - expectedDisc) < 0.01, { got: Number(o1Db?.partnerDiscount), expected: expectedDisc });

    const net1 = round2(subtotal - expectedDisc);
    const comm1 = round2(net1 * 0.10);
    await new Promise((r) => setTimeout(r, 800));
    const c1 = await sb('GET', `/rest/v1/partner_commissions?order_id=eq.${o1Num}&select=*`);
    const c1row = c1.data?.[0];
    check('commission recorded in Supabase partner_commissions', !!c1row, c1.data);
    check('commission status is pending', c1row?.status === 'pending', c1row?.status);
    check('commission order amount = net of discount', Math.abs(Number(c1row?.order_amount) - net1) < 0.01, { got: c1row?.order_amount, expected: net1 });
    check('commission amount = 10% default rate', Math.abs(Number(c1row?.commission_amount) - comm1) < 0.01, { got: c1row?.commission_amount, expected: comm1 });
    check('commission belongs to the partner', c1row?.partner_id === partnerUid, c1row?.partner_id);

    const conv = await sb('GET', `/rest/v1/referral_conversions?order_id=eq.${o1Num}&select=*`);
    check('conversion row written', Array.isArray(conv.data) && conv.data.length === 1, conv.data);
    const attrAfter = await sb('GET', `/rest/v1/referral_attributions?session_id=eq.${sessionS}&select=is_converted`);
    check('attribution marked converted', attrAfter.data?.[0]?.is_converted === true, attrAfter.data);

    // Same session again: attribution consumed -> no second discount
    await api('POST', '/cart/items', buyer.token, { productId: limca.id, variantId: limca.variants[0].id, quantity: 1 });
    const o2 = await api('POST', '/orders', buyer.token, { addressId: buyerAddr.id, paymentMethod: 'COD', referralSessionId: sessionS });
    const o2Db = await prisma.order.findUnique({ where: { orderNumber: o2.data?.orderNumber } });
    check('second order from same session gets no discount', Number(o2Db?.partnerDiscount) === 0 && o2Db?.partnerCode === null, { d: o2Db?.partnerDiscount, c: o2Db?.partnerCode });

    // ── 3. Approval and cancellation follow the order ─────────────────────
    console.log('\n3. Commission follows order status');
    await new Promise((r) => setTimeout(r, 1200));
    let flowOk = true;
    for (const status of ['PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED']) {
      const r = await api('PATCH', `/orders/${o1.data?.id}/status`, admin.token, { status });
      if (r.status >= 300) { flowOk = false; console.log('    step', status, r.status, r.message); break; }
    }
    check('order 1 delivered by admin', flowOk);
    await new Promise((r) => setTimeout(r, 800));
    const c1b = await sb('GET', `/rest/v1/partner_commissions?order_id=eq.${o1Num}&select=status,available_at`);
    check('commission approved on delivery', c1b.data?.[0]?.status === 'approved', c1b.data);

    // Cart-entered code path + customer cancellation
    console.log('\n4. Cart code entry + cancellation reverses commission');
    await api('POST', '/cart/items', buyer2.token, { productId: limca.id, variantId: limca.variants[0].id, quantity: 1 });
    const bad = await api('POST', '/cart/referral-code', buyer2.token, { code: 'APK-QQQQQ' });
    check('invalid code on cart rejected (404)', bad.status === 404, bad.status);
    const applied = await api('POST', '/cart/referral-code', buyer2.token, { code: partnerCode.toLowerCase() });
    check('valid code applied to cart', applied.status < 300 && applied.data?.referral?.referralCode === partnerCode, applied.data);
    const o3 = await api('POST', '/orders', buyer2.token, { addressId: buyer2Addr.id, paymentMethod: 'COD' });
    check('order 3 (cart code) placed', o3.status < 300, o3.raw);
    const o3Db = await prisma.order.findUnique({ where: { orderNumber: o3.data?.orderNumber } });
    check('cart-code order gets 5% discount', Math.abs(Number(o3Db?.partnerDiscount) - round2(priceL * 0.05)) < 0.01, Number(o3Db?.partnerDiscount));
    await new Promise((r) => setTimeout(r, 800));
    const c3 = await sb('GET', `/rest/v1/partner_commissions?order_id=eq.${o3.data?.orderNumber}&select=status`);
    check('order 3 commission pending', c3.data?.[0]?.status === 'pending', c3.data);
    const cancel = await api('POST', `/orders/${o3.data?.id}/cancel`, buyer2.token);
    check('customer cancels order 3', cancel.status < 300, cancel.raw);
    await new Promise((r) => setTimeout(r, 800));
    const c3b = await sb('GET', `/rest/v1/partner_commissions?order_id=eq.${o3.data?.orderNumber}&select=status`);
    // The partner app's own cancel path is broken for a pending commission
    // (it writes an earning_txn_type value that does not exist), so the
    // storefront voids it with the partner app's reject_commission() instead.
    check('commission voided with the order', ['cancelled', 'rejected'].includes(c3b.data?.[0]?.status), c3b.data);

    // ── 5. Self-referral is blocked ──────────────────────────────────────
    console.log('\n5. Self-referral');
    await api('POST', '/cart/items', selfUser.token, { productId: limca.id, variantId: limca.variants[0].id, quantity: 1 });
    const self = await api('POST', '/cart/referral-code', selfUser.token, { code: partnerCode });
    check('partner cannot use own code (400)', self.status === 400, self.raw);

    // ── 6. Partner's view (what the partner app shows) ───────────────────
    console.log('\n6. Partner view in Supabase');
    const mine = await sb('GET', `/rest/v1/partner_commissions?partner_id=eq.${partnerUid}&select=order_id,status,commission_amount&order=created_at.asc`);
    check('partner sees two commission rows', Array.isArray(mine.data) && mine.data.length === 2, mine.data);
    const statuses = (mine.data ?? []).map((r: any) => r.status).sort().join(',');
    check('partner rows: one approved, one voided', /approved/.test(statuses) && /(cancelled|rejected)/.test(statuses), statuses);
    const conversions = await sb('GET', `/rest/v1/referral_conversions?partner_id=eq.${partnerUid}&select=order_id`);
    check('partner sees two conversions', Array.isArray(conversions.data) && conversions.data.length === 2, conversions.data);

    // ── 7. Quick / Shop All still holds ──────────────────────────────────
    console.log('\n7. Quick / Shop All');
    // Any active product works: unpinned products fall to Shop All by the
    // delivery-hours rule, pinned ones are in Quick because of the pin.
    const probe = await prisma.product.findFirst({
      where: { isActive: true, slug: { not: 'limca-cold-drink' } },
      select: { id: true, deliveryHours: true, homeSectionItems: { select: { id: true, section: { select: { key: true } } } } },
    });
    if (probe) {
      await prisma.product.update({ where: { id: probe.id }, data: { deliveryHours: 12 } });
      const q = await api('GET', '/home-sections/QUICK?limit=500');
      const s = await api('GET', '/home-sections/SHOP_ALL?limit=500');
      const qIds = new Set((q.data?.items ?? []).map((i: any) => i.productId));
      const sIds = new Set((s.data?.items ?? []).map((i: any) => i.productId));
      const pinnedQuick = probe.homeSectionItems.some((h) => h.section.key === 'QUICK');
      check('24h product is in Quick', qIds.has(probe.id));
      check('24h product is not in Shop All', !sIds.has(probe.id));
      check('pinned product is in Quick because of the admin pin', pinnedQuick ? qIds.has(probe.id) : true);
      await prisma.product.update({ where: { id: probe.id }, data: { deliveryHours: probe.deliveryHours ?? null } });
    } else {
      console.log('  SKIP  no unpinned product available');
    }
  } catch (e: any) {
    failed++;
    failures.push('crash: ' + e?.message);
    console.log('  CRASH', e?.stack ?? e);
  } finally {
    // ── Cleanup: remove everything the test created in Supabase ───────────
    console.log('\nCleanup');
    if (partnerUid) {
      const del = async (path: string) => {
        const r = await sb('DELETE', path, undefined, 'return=minimal');
        if (r.status >= 300) console.log(`    cleanup ${path} -> ${r.status}`);
      };
      await del(`/rest/v1/referral_conversions?partner_id=eq.${partnerUid}`);
      await del(`/rest/v1/referral_events?partner_id=eq.${partnerUid}`);
      await del(`/rest/v1/partner_commissions?partner_id=eq.${partnerUid}`);
      await del(`/rest/v1/referral_attributions?partner_id=eq.${partnerUid}`);
      await del(`/rest/v1/referral_links?partner_id=eq.${partnerUid}`);
      await del(`/rest/v1/partner_referral_codes?partner_id=eq.${partnerUid}`);
      await del(`/rest/v1/task_completions?partner_id=eq.${partnerUid}`);
      await del(`/rest/v1/points_wallet?partner_id=eq.${partnerUid}`);
      await del(`/rest/v1/notifications?user_id=eq.${partnerUid}`);
      await del(`/rest/v1/partner_profiles?user_id=eq.${partnerUid}`);
      await del(`/rest/v1/profiles?id=eq.${partnerUid}`);
      const au = await sb('DELETE', `/auth/v1/admin/users/${partnerUid}`);
      if (au.status >= 300) console.log(`    auth user delete -> ${au.status}`);
    }
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await prisma.productVariant.update({ where: { id: limcaVariantId }, data: { stock: originalStock } });
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
