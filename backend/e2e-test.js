const API = 'http://localhost:3000/api/v1';
let passed = 0, failed = 0;
const results = [];
function log(test, status, detail = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${status}] ${test}${detail ? ' — ' + detail : ''}`);
  results.push({ test, status, detail });
  if (status === 'PASS') passed++; else if (status === 'FAIL') failed++;
}
async function req(method, path, { body, token, isForm } = {}) {
  const headers = { 'Content-Type': isForm ? 'multipart/form-data' : 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(API + path, { method, headers, body: body ? (isForm ? body : JSON.stringify(body)) : undefined });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, ok: res.ok, data };
}
function getData(res) { if (!res.ok) return null; return res.data?.data ?? res.data ?? null; }
function genEmail(p) { return `${p}-${Date.now()}-${Math.floor(Math.random()*1000)}@test.com`; }
async function loginAs(email, password) {
  const res = await req('POST', '/auth/login', { body: { email, password } });
  if (!res.ok) return null;
  return res.data?.data?.accessToken ?? res.data?.accessToken;
}

async function main() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  NishuMart E2E Test Suite                  ║');
  console.log('╚════════════════════════════════════════════╝\n');

  // 1. AUTH
  const productsRes = await req('GET', '/products?limit=5');
  const products = getData(productsRes);
  log('GET /products (public)', productsRes.ok && Array.isArray(products) ? 'PASS' : 'FAIL', `${products?.length ?? 0} products`);

  const adminToken = await loginAs('admin@nishumart.com', 'admin123');
  log('POST /auth/login (admin)', adminToken ? 'PASS' : 'FAIL');
  const sellerToken = await loginAs('seller1@nishumart.com', 'seller123');
  log('POST /auth/login (seller)', sellerToken ? 'PASS' : 'FAIL');
  const customerToken = await loginAs('customer1@nishumart.com', 'customer123');
  log('POST /auth/login (customer)', customerToken ? 'PASS' : 'FAIL');
  const deliveryToken = await loginAs('delivery@nishumart.com', 'delivery123');
  log('POST /auth/login (delivery)', deliveryToken ? 'PASS' : 'FAIL');

  const meRes = await req('GET', '/auth/me', { token: customerToken });
  log('GET /auth/me', meRes.ok ? 'PASS' : 'FAIL');

  // 2. CUSTOMER
  const cartRes = await req('GET', '/cart', { token: customerToken });
  log('GET /cart (customer)', cartRes.ok ? 'PASS' : 'FAIL');

  if (products && products.length > 0) {
    const addRes = await req('POST', '/cart/items', { token: customerToken, body: { productId: products[0].id, variantId: products[0].variants?.[0]?.id, quantity: 1 } });
    log('POST /cart/items (add product)', addRes.ok ? 'PASS' : 'FAIL');
  }

  const cart2Res = await req('GET', '/cart', { token: customerToken });
  const cart2 = getData(cart2Res);
  log('GET /cart (with items)', cart2Res.ok && (cart2?.items?.length ?? 0) > 0 ? 'PASS' : 'FAIL', `${cart2?.items?.length ?? 0} items`);

  if (cart2?.items?.[0]) {
    const updateRes = await req('PATCH', `/cart/items/${cart2.items[0].id}`, { token: customerToken, body: { quantity: 2 } });
    log('PATCH /cart/items/:id (update qty)', updateRes.ok ? 'PASS' : 'FAIL');
  }

  const myOrdersRes = await req('GET', '/orders', { token: customerToken });
  log('GET /orders (customer history)', myOrdersRes.ok ? 'PASS' : 'FAIL');

  // Place order
  let orderId = null, orderNumber = null;
  const addrRes = await req('POST', '/users/addresses', { token: customerToken, body: { name: 'Test Customer', phone: '+919999999999', addressLine1: '123 Test St', city: 'Delhi', state: 'Delhi', pincode: '110001', country: 'India', isDefault: true } });
  const address = getData(addrRes);
  const addressId = address?.id || address?.[0]?.id;
  if (addressId && cart2?.items?.[0]) {
    const placeRes = await req('POST', '/orders', { token: customerToken, body: { addressId, paymentMethod: 'COD' } });
    if (placeRes.ok) {
      const order = getData(placeRes);
      orderId = order?.id;
      orderNumber = order?.orderNumber;
      log('POST /orders (place order)', 'PASS', `#${orderNumber}`);
    } else {
      log('POST /orders (place order)', 'FAIL', JSON.stringify(placeRes.data?.message));
    }
  }

  if (orderId) {
    const ordRes = await req('GET', `/orders/${orderId}`, { token: customerToken });
    log('GET /orders/:id', ordRes.ok ? 'PASS' : 'FAIL');
    const trackRes = await req('GET', `/orders/track/${orderNumber}`, { token: customerToken });
    log('GET /orders/track/:orderNumber', trackRes.ok ? 'PASS' : 'FAIL');
  }

  if (products && products[0]) {
    const wishRes = await req('POST', `/wishlist/${products[0].id}`, { token: customerToken });
    log('POST /wishlist/:productId', wishRes.ok ? 'PASS' : 'FAIL');
  }
  const wishGet = await req('GET', '/wishlist', { token: customerToken });
  log('GET /wishlist', wishGet.ok ? 'PASS' : 'FAIL');

  const notifRes = await req('GET', '/notifications', { token: customerToken });
  log('GET /notifications (customer)', notifRes.ok ? 'PASS' : 'FAIL');

  // 3. ADMIN
  const unique = Date.now();
  const catRes = await req('POST', '/categories', { token: adminToken, body: { name: `Test Cat ${unique}`, slug: `test-cat-${unique}` } });
  const newCategoryId = getData(catRes)?.id;
  log('POST /categories (create)', catRes.ok && newCategoryId ? 'PASS' : 'FAIL');

  if (newCategoryId) {
    const updRes = await req('PATCH', `/categories/${newCategoryId}`, { token: adminToken, body: { description: 'Updated' } });
    log('PATCH /categories/:id (update)', updRes.ok ? 'PASS' : 'FAIL');
  }

  const brandRes = await req('POST', '/brands', { token: adminToken, body: { name: `Test Brand ${unique}`, slug: `test-brand-${unique}` } });
  const newBrandId = getData(brandRes)?.id;
  log('POST /brands (create)', brandRes.ok && newBrandId ? 'PASS' : 'FAIL');

  const bannerRes = await req('POST', '/banners', { token: adminToken, body: { title: `Test Banner ${unique}`, image: 'https://placehold.co/1200x400/6366f1/ffffff?text=Test', link: '/', position: 'HERO', isActive: true } });
  const newBannerId = getData(bannerRes)?.id;
  log('POST /banners (create with image URL)', bannerRes.ok && newBannerId ? 'PASS' : 'FAIL');

  if (newBannerId) {
    const updBannerRes = await req('PATCH', `/banners/${newBannerId}`, { token: adminToken, body: { title: 'Updated' } });
    log('PATCH /banners/:id (update)', updBannerRes.ok ? 'PASS' : 'FAIL');
  }

  const couponRes = await req('POST', '/coupons', { token: adminToken, body: { code: `TEST${unique}`.substring(0,20), type: 'PERCENTAGE', value: 15, minimumOrder: 500, maximumDiscount: 200, usageLimit: 100, startsAt: new Date().toISOString(), expiresAt: new Date(Date.now()+30*86400000).toISOString(), isActive: true } });
  const newCouponId = getData(couponRes)?.id;
  log('POST /coupons (create)', couponRes.ok && newCouponId ? 'PASS' : 'FAIL');

  if (newCouponId) {
    const couponGetRes = await req('GET', `/coupons/${newCouponId}`, { token: adminToken });
    log('GET /coupons/:id', couponGetRes.ok ? 'PASS' : 'FAIL');
  }

  const productRes = await req('POST', '/products', { token: adminToken, body: { name: `Test Product ${unique}`, slug: `test-product-${unique}`, description: 'Test', shortDescription: 'Test', sku: `TEST-${unique}`, categoryId: newCategoryId, brandId: newBrandId, isFeatured: true, tags: 'test' } });
  const newProductId = getData(productRes)?.id;
  log('POST /products (create)', productRes.ok && newProductId ? 'PASS' : 'FAIL');

  const sellerEmail = genEmail('seller');
  const sellerRes = await req('POST', '/sellers', { token: adminToken, body: { businessName: `Test Business ${unique}`, businessType: 'INDIVIDUAL', commission: 10, user: { email: sellerEmail, phone: `98${Math.floor(Math.random()*100000000)}`, password: 'Seller@123', firstName: 'Test', lastName: 'Seller' } } });
  log('POST /sellers (create seller)', sellerRes.ok ? 'PASS' : 'FAIL', sellerEmail);

  const deliveryEmail = genEmail('delivery');
  const deliveryRes = await req('POST', '/delivery', { token: adminToken, body: { firstName: 'Test', lastName: 'Delivery', phone: `97${Math.floor(Math.random()*100000000)}`, vehicleType: 'BIKE', vehicleNumber: `DL${unique}AB1234`.substring(0,13), licenseNumber: `LIC${unique}`.substring(0,20), password: 'Delivery@123', email: deliveryEmail } });
  log('POST /delivery (create delivery person)', deliveryRes.ok ? 'PASS' : 'FAIL', deliveryEmail);

  // 4. SELLER
  const dashRes = await req('GET', '/sellers/dashboard', { token: sellerToken });
  log('GET /sellers/dashboard', dashRes.ok ? 'PASS' : 'FAIL');

  // 5. DELIVERY
  const assignRes = await req('GET', '/delivery/assignments', { token: deliveryToken });
  log('GET /delivery/assignments', assignRes.ok ? 'PASS' : 'FAIL');

  // 6. NOTIFICATIONS
  for (const [name, token] of [['customer', customerToken], ['admin', adminToken], ['seller', sellerToken], ['delivery', deliveryToken]]) {
    if (!token) continue;
    const res = await req('GET', '/notifications?limit=10', { token });
    log(`GET /notifications (${name})`, res.ok ? 'PASS' : 'FAIL');
  }

  // 7. SUPPORT
  const supRes = await req('POST', '/support/tickets', { token: customerToken, body: { subject: `Test ${unique}`, description: 'Test ticket', priority: 'MEDIUM' } });
  const ticketId = getData(supRes)?.id;
  log('POST /support/tickets (create)', supRes.ok && ticketId ? 'PASS' : 'FAIL');

  if (ticketId) {
    const myTicketsRes = await req('GET', '/support/tickets', { token: customerToken });
    log('GET /support/tickets (my tickets)', myTicketsRes.ok ? 'PASS' : 'FAIL');
  }

  // 8. MISC
  const validateRes = await req('POST', '/coupons/validate', { token: customerToken, body: { code: 'WELCOME10', cartTotal: 1000 } });
  log('POST /coupons/validate', validateRes.ok ? 'PASS' : 'FAIL');

  // Summary
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║  RESULTS                                    ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(`  ✅ PASSED: ${passed}`);
  console.log(`  ❌ FAILED: ${failed}`);
  console.log(`  📊 TOTAL:  ${passed + failed}`);
  console.log(`  🎯 SCORE:  ${Math.round((passed / (passed + failed)) * 100)}%`);
  if (failed > 0) {
    console.log('\n  ❌ FAILED:');
    results.filter(r => r.status === 'FAIL').forEach(r => console.log(`     - ${r.test}${r.detail ? ' (' + r.detail + ')' : ''}`));
  }
}

main();
