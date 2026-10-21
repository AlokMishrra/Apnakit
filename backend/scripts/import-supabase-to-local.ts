/**
 * Import the real Supabase catalogue (products + categories) into a local PG
 * so the Render backend can reach it via a serveo tunnel. Bypasses the
 * Supabase pooler auth issue.
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'node:fs';

const prisma = new PrismaClient();

interface SupabaseProduct {
  id: string;
  external_id: string;
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

interface SupabaseCategory {
  id: string;
  external_id: string;
  slug: string;
  name: string;
  image_url: string | null;
  is_active: boolean;
  display_order: number | null;
}

const T = (url: string | null | undefined, fallback: string = '/'): string =>
  url && url.length > 0 ? url : fallback;

async function main() {
  const products: SupabaseProduct[] = JSON.parse(
    fs.readFileSync('/tmp/dbdata/products.json', 'utf8'),
  );
  const categories: SupabaseCategory[] = JSON.parse(
    fs.readFileSync('/tmp/dbdata/categories.json', 'utf8'),
  );

  console.log(`importing ${categories.length} categories, ${products.length} products`);

  // Map Supabase categories to Prisma
  const catMap = new Map<string, string>(); // supabase id -> prisma id
  for (const c of categories) {
    const slug = c.slug
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `cat-${c.id.slice(0, 6)}`;
    const row = await prisma.category.upsert({
      where: { slug },
      update: { name: c.name, image: c.image_url },
      create: {
        slug,
        name: c.name,
        image: c.image_url,
        isActive: c.is_active,
        sortOrder: c.display_order ?? 0,
      },
    });
    catMap.set(c.id, row.id);
  }
  console.log(`  ${catMap.size} categories upserted`);

  // Brands — Supabase stores brand as a string. Create one brand per unique value.
  const brandMap = new Map<string, string>();
  for (const p of products) {
    if (!p.brand) continue;
    const key = p.brand.trim().toLowerCase();
    if (brandMap.has(key)) continue;
    const slug = key.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `brand-${key.slice(0, 6)}`;
    const row = await prisma.brand.upsert({
      where: { slug },
      update: { name: p.brand },
      create: { slug, name: p.brand, isActive: true },
    });
    brandMap.set(key, row.id);
  }
  console.log(`  ${brandMap.size} brands upserted`);

  // Products
  let productCount = 0;
  for (const p of products) {
    const slug = p.slug
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `p-${p.id.slice(0, 6)}`;
    const sku = `SKU-${slug.slice(0, 30).toUpperCase().replace(/-/g, '')}-${p.id.slice(0, 4).toUpperCase()}`;
    const price = Number(p.selling_price ?? 0);
    const mrp = Number(p.mrp ?? 0);
    const compareAt = mrp > price ? mrp : null;
    const stock = p.is_in_stock ? Number(p.stock_quantity ?? 0) : 0;
    const catId = p.category_id ? catMap.get(p.category_id) ?? null : null;
    const brandId = p.brand ? brandMap.get(p.brand.trim().toLowerCase()) ?? null : null;

    const product = await prisma.product.upsert({
      where: { slug },
      update: {
        name: p.name,
        description: p.description ?? null,
        shortDescription: p.short_description ?? null,
        isActive: p.is_active,
        isFeatured: p.is_featured ?? false,
        brandId,
        categoryId: catId,
      },
      create: {
        slug,
        sku,
        name: p.name,
        description: p.description ?? null,
        shortDescription: p.short_description ?? null,
        isActive: p.is_active,
        isFeatured: p.is_featured ?? false,
        brandId,
        categoryId: catId,
      },
    });

    // Variant
    const variantName = 'Default';
    const existingVariant = await prisma.productVariant.findFirst({
      where: { productId: product.id, name: variantName },
    });
    if (existingVariant) {
      await prisma.productVariant.update({
        where: { id: existingVariant.id },
        data: { price, compareAtPrice: compareAt, stock, isActive: p.is_active },
      });
    } else {
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          name: variantName,
          sku: `${sku}-DEF`,
          price,
          compareAtPrice: compareAt,
          stock,
          isActive: p.is_active,
          attributes: {},
        },
      });
    }

    // Images
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    const gallery = Array.isArray(p.gallery_urls) ? p.gallery_urls : [];
    const allImages = Array.from(new Set([...gallery, p.image_url].filter(Boolean))) as string[];
    if (allImages.length > 0) {
      await prisma.productImage.createMany({
        data: allImages.map((url, i) => ({
          productId: product.id,
          url: T(url as string, '/'),
          alt: p.name,
          sortOrder: i,
          isPrimary: i === 0,
        })),
      });
    }

    productCount++;
  }
  console.log(`  ${productCount} products upserted`);
  console.log('done');
}

main()
  .catch((e) => {
    console.error('failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
