/**
 * Imports the real product catalogue from Supabase into this app's Postgres.
 *
 * Why an import and not a live read: carts, wishlists, orders and inventory all
 * hold foreign keys to `Product`. If the catalogue only ever lived in Supabase
 * those relations would have nothing to point at, so Supabase is treated as the
 * upstream feed and Postgres as the source of truth the app reads from.
 *
 * Re-running is safe: rows are matched on slug and updated in place.
 *
 *   npm run db:import-supabase
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { CATEGORY_IMAGES } from './seed-images';

dotenv.config();

const prisma = new PrismaClient();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_ANON_KEY) are required.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface SupabaseCategory {
  id: string;
  slug: string;
  name: string;
  image_url: string | null;
  is_active: boolean;
  display_order: number | null;
}

interface SupabaseProduct {
  id: string;
  external_id: string | null;
  slug: string;
  name: string;
  description: string | null;
  short_description: string | null;
  image_url: string | null;
  gallery_urls: string[] | null;
  category_id: string | null;
  brand: string | null;
  mrp: number | null;
  selling_price: number | null;
  stock_quantity: number | null;
  is_in_stock: boolean;
  is_active: boolean;
  is_featured: boolean;
  rating: number | null;
  review_count: number | null;
}

/** Collapses whitespace and caps length so it fits a sensible SKU. */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

/**
 * Supabase rows carry their own slug, but they can collide with the demo seed
 * or with each other. Falling back to the Supabase id keeps it unique.
 */
function uniqueSlug(base: string, taken: Set<string>, salt: string): string {
  let slug = slugify(base) || 'item';
  if (taken.has(slug)) {
    slug = `${slug}-${salt}`.slice(0, 100);
  }
  taken.add(slug);
  return slug;
}

function uniqueSku(base: string, taken: Set<string>, salt: string): string {
  let sku = base.toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 40);
  if (!sku || taken.has(sku)) {
    sku = `SKU-${salt.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12)}`;
  }
  taken.add(sku);
  return sku;
}

/**
 * Some upstream hosts return 403 for hotlinking — pngtree.com serves some
 * paths and refuses others, so a single probe per host is not enough. We take
 * a few samples per host and drop the whole host if any of them refuses.
 *
 * Without this the category grid renders broken tiles for several categories.
 */
const SAMPLES_PER_HOST = 4;

/**
 * Hosts that answer a server-side probe but refuse to serve the image to an
 * actual browser, so the card renders broken in production.
 *
 * pngtree.com is the one we hit: Node fetch gets a 200, Chrome gets a 403 on
 * every path. A probe cannot detect this (the failure only happens for real
 * browser requests), so the host is denied outright and the category falls back
 * to the curated image in seed-images.ts.
 */
const BLOCKED_IMAGE_HOSTS = new Set(['png.pngtree.com']);

async function probeHosts(urls: string[]): Promise<Set<string>> {
  const byHost = new Map<string, string[]>();

  for (const url of urls) {
    if (typeof url !== 'string' || !/^https?:\/\//.test(url)) continue;
    try {
      const { hostname } = new URL(url);
      const list = byHost.get(hostname) ?? [];
      if (list.length < SAMPLES_PER_HOST && !list.includes(url)) list.push(url);
      byHost.set(hostname, list);
    } catch {
      /* ignore unparseable */
    }
  }

  const blocked = new Set<string>();

  await Promise.all(
    [...byHost.entries()].map(async ([host, samples]) => {
      const results = await Promise.all(
        samples.map(async (sample) => {
          try {
            // A plain GET, because that is what the browser issues. Some CDNs
            // (pngtree) happily answer range requests but return 403 for a
            // full request — probing with a Range header hides that and lets
            // dead URLs through.
            const res = await fetch(sample, {
              method: 'GET',
              redirect: 'follow',
              signal: AbortSignal.timeout(12_000),
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
                Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                Referer: 'https://apnakit.in/',
                'Sec-Fetch-Dest': 'image',
                'Sec-Fetch-Mode': 'no-cors',
                'Sec-Fetch-Site': 'cross-site',
              },
            });
            // Drain a little so the connection can be reused/closed promptly.
            await res.arrayBuffer().catch(() => undefined);
            return res.ok;
          } catch {
            return false;
          }
        }),
      );

      if (results.some((ok) => !ok)) blocked.add(host);
    }),
  );

  if (blocked.size > 0) {
    console.log(
      `   ⚠ ${blocked.size} unreachable image host(s) skipped:\n     ${[...blocked].join('\n     ')}\n`,
    );
  }

  return blocked;
}

function isUsable(url: string | null | undefined, blocked: Set<string>): url is string {
  if (typeof url !== 'string' || !url) return false;
  try {
    const { hostname } = new URL(url);
    return !blocked.has(hostname) && !BLOCKED_IMAGE_HOSTS.has(hostname);
  } catch {
    return false;
  }
}

async function main() {
  console.log('📦 Importing catalogue from Supabase...\n');
  console.log(`   ${supabaseUrl}`);

  const { data: rawCategories, error: catError } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true });

  if (catError) throw catError;

  const { data: rawProducts, error: prodError } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: true });

  if (prodError) throw prodError;

  const categories = (rawCategories ?? []) as SupabaseCategory[];
  const products = (rawProducts ?? []) as SupabaseProduct[];

  console.log(`   ${categories.length} categories, ${products.length} products\n`);

  // Probe every image host once so we never persist URLs that 403.
  const allImageUrls = [
    ...categories.map((c) => c.image_url),
    ...products.flatMap((p) => [p.image_url, ...(p.gallery_urls ?? [])]),
  ].filter((u): u is string => typeof u === 'string');
  const blockedHosts = await probeHosts(allImageUrls);

  // ── Categories ────────────────────────────────────────────────────────────
  const categoryIds = new Map<string, string>();
  const categorySlugs = new Set<string>();

  for (const category of categories) {
    const slug = slugify(category.slug || category.name) || `category-${category.id.slice(0, 8)}`;
    categorySlugs.add(slug);

    // Prefer the upstream image; fall back to a curated one when the host
    // refuses, so a category tile never renders broken.
    const categoryImage = isUsable(category.image_url, blockedHosts)
      ? category.image_url
      : CATEGORY_IMAGES[slug] ?? null;

    const row = await prisma.category.upsert({
      where: { slug },
      update: {
        name: category.name,
        image: categoryImage,
        isActive: category.is_active,
        sortOrder: category.display_order ?? 0,
      },
      create: {
        name: category.name,
        slug,
        description: null,
        image: categoryImage,
        sortOrder: category.display_order ?? 0,
        isActive: category.is_active,
        parentId: null,
      },
    });

    categoryIds.set(category.id, row.id);
  }
  console.log(`✓ categories synced`);

  // ── Brands ────────────────────────────────────────────────────────────────
  const brandIds = new Map<string, string>();

  for (const product of products) {
    const name = product.brand?.trim();
    if (!name) continue;

    const key = name.toLowerCase();
    if (brandIds.has(key)) continue;

    const slug = slugify(name) || `brand-${key}`;
    const row = await prisma.brand.upsert({
      where: { slug },
      update: { name, isActive: true },
      create: { name, slug, isActive: true },
    });
    brandIds.set(key, row.id);
  }
  console.log(`✓ brands synced (${brandIds.size})`);

  // ── Products ──────────────────────────────────────────────────────────────
  const productSlugs = new Set<string>();
  const skus = new Set<string>();
  let created = 0;
  let updated = 0;

  for (const product of products) {
    const slug = uniqueSlug(
      product.slug || product.name,
      productSlugs,
      product.id.slice(0, 6),
    );
    const sku = uniqueSku(
      `${slug}`,
      skus,
      product.id.slice(0, 8),
    );

    const categoryId = product.category_id ? categoryIds.get(product.category_id) ?? null : null;
    const brandId = product.brand
      ? brandIds.get(product.brand.trim().toLowerCase()) ?? null
      : null;

    const sellingPrice = Number(product.selling_price ?? 0);
    const mrp = Number(product.mrp ?? 0);
    const compareAt = mrp > sellingPrice ? mrp : null;
    const stock = product.is_in_stock ? Number(product.stock_quantity ?? 0) : 0;

    // Gallery first (matches how the storefront orders images), image_url last
    // as a fallback so every product ends up with at least one picture.
    const gallery = Array.isArray(product.gallery_urls) ? product.gallery_urls : [];
    const imageUrls = [
      ...new Set([...gallery, product.image_url].filter(Boolean)),
    ].filter((url): url is string => isUsable(url, blockedHosts));

    const existing = await prisma.product.findUnique({ where: { slug } });

    const record = existing
      ? await prisma.product.update({
          where: { slug },
          data: {
            name: product.name,
            description: product.description ?? null,
            shortDescription: product.short_description ?? null,
            categoryId,
            brandId,
            isFeatured: product.is_featured,
            isActive: product.is_active,
            tags: 'supabase',
          },
        })
      : await prisma.product.create({
          data: {
            name: product.name,
            slug,
            sku,
            description: product.description ?? null,
            shortDescription: product.short_description ?? null,
            categoryId,
            brandId,
            isFeatured: product.is_featured,
            isActive: product.is_active,
            tags: 'supabase',
          },
        });

    if (existing) updated++;
    else created++;

    // Images are replaced wholesale so a re-run never duplicates rows.
    await prisma.productImage.deleteMany({ where: { productId: record.id } });
    if (imageUrls.length > 0) {
      await prisma.productImage.createMany({
        data: imageUrls.map((url, index) => ({
          productId: record.id,
          url,
          alt: product.name,
          sortOrder: index,
          isPrimary: index === 0,
        })),
      });
    }

    // Supabase products are flat (no variants), so model a single default one.
    const variantName = 'Default';
    const existingVariant = await prisma.productVariant.findFirst({
      where: { productId: record.id, name: variantName },
    });

    const variantData = {
      price: sellingPrice,
      compareAtPrice: compareAt,
      stock,
      isActive: product.is_active,
    };

    if (existingVariant) {
      await prisma.productVariant.update({
        where: { id: existingVariant.id },
        data: variantData,
      });
    } else {
      await prisma.productVariant.create({
        data: {
          productId: record.id,
          name: variantName,
          sku: `${sku}-DEF`,
          price: sellingPrice,
          compareAtPrice: compareAt,
          stock,
          isActive: product.is_active,
          attributes: {},
        },
      });
    }
  }

  console.log(`✓ products synced (${created} created, ${updated} updated)`);

  // ── Summary ───────────────────────────────────────────────────────────────
  const [total, active, withImages] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({ where: { images: { some: {} } } }),
  ]);

  console.log(`\n📊 Catalogue now:`);
  console.log(`   ${total} products (${active} active, ${withImages} with images)`);
  console.log(`   ${await prisma.category.count()} categories`);
  console.log(`   ${await prisma.brand.count()} brands`);
  console.log('\n✅ Import complete.');
}

main()
  .catch((error) => {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());