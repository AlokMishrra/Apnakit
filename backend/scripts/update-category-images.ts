import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const U = (id: string) => `https://images.unsplash.com/${id}?w=400&h=400&fit=crop&auto=format&q=80`;
const MAP: Record<string, string> = {
  'big-savings-combo': U('photo-1607082348824-0a96f2a4b9da'),
  'combo-savings': U('photo-1607082348824-0a96f2a4b9da'),
  groceries: U('photo-1578916171728-46686eac8d58'),
  'cold-drinks': U('photo-1622483767028-3f66f32aef97'),
};
async function main() {
  for (const [slug, image] of Object.entries(MAP)) {
    await prisma.category.updateMany({ where: { slug }, data: { image } });
    console.log('  set', slug);
  }
  const rows = await prisma.category.findMany({ select: { slug: true, image: true }, orderBy: { slug: 'asc' } });
  const seen = new Map<string, number>();
  for (const r of rows) seen.set(r.image, (seen.get(r.image) ?? 0) + 1);
  console.log('  distinct images:', seen.size, 'of', rows.length, 'categories');
  console.log('  duplicated:', [...seen.entries()].filter(([, n]) => n > 1).map(([i, n]) => `${n}x ${i.slice(40, 80)}`));
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
