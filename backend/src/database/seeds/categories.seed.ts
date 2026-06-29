import { PrismaClient } from '@prisma/client';

interface CategorySeed {
  name: string;
  slug: string;
  description: string;
  image: string;
  sortOrder: number;
  metaTitle: string;
  metaDescription: string;
  children?: CategorySeed[];
}

const CATEGORIES: CategorySeed[] = [
  {
    name: 'Electronics',
    slug: 'electronics',
    description: 'Latest gadgets, smartphones, laptops, and electronic accessories',
    image: 'https://placehold.co/400x400?text=Electronics',
    sortOrder: 1,
    metaTitle: 'Electronics - ApnaKit',
    metaDescription: 'Shop the latest electronics at best prices',
    children: [
      { name: 'Smartphones', slug: 'smartphones', description: 'Latest smartphones from top brands', image: 'https://placehold.co/400x400?text=Smartphones', sortOrder: 1, metaTitle: 'Smartphones', metaDescription: 'Buy smartphones online' },
      { name: 'Laptops', slug: 'laptops', description: 'Laptops for work, gaming, and everyday use', image: 'https://placehold.co/400x400?text=Laptops', sortOrder: 2, metaTitle: 'Laptops', metaDescription: 'Buy laptops online' },
      { name: 'Tablets', slug: 'tablets', description: 'Tablets for entertainment and productivity', image: 'https://placehold.co/400x400?text=Tablets', sortOrder: 3, metaTitle: 'Tablets', metaDescription: 'Buy tablets online' },
      { name: 'Accessories', slug: 'accessories', description: 'Phone cases, chargers, cables, and more', image: 'https://placehold.co/400x400?text=Accessories', sortOrder: 4, metaTitle: 'Accessories', metaDescription: 'Buy electronic accessories' },
      { name: 'Audio', slug: 'audio', description: 'Headphones, speakers, and audio equipment', image: 'https://placehold.co/400x400?text=Audio', sortOrder: 5, metaTitle: 'Audio', metaDescription: 'Buy audio equipment' },
      { name: 'Cameras', slug: 'cameras', description: 'Digital cameras, DSLRs, and action cameras', image: 'https://placehold.co/400x400?text=Cameras', sortOrder: 6, metaTitle: 'Cameras', metaDescription: 'Buy cameras online' },
    ],
  },
  {
    name: 'Fashion',
    slug: 'fashion',
    description: 'Trendy clothing, footwear, and fashion accessories',
    image: 'https://placehold.co/400x400?text=Fashion',
    sortOrder: 2,
    metaTitle: 'Fashion - ApnaKit',
    metaDescription: 'Shop the latest fashion trends',
    children: [
      { name: "Men's Clothing", slug: 'mens-clothing', description: 'Shirts, t-shirts, trousers, and more', image: 'https://placehold.co/400x400?text=Mens+Clothing', sortOrder: 1, metaTitle: "Men's Clothing", metaDescription: "Shop men's clothing" },
      { name: "Women's Clothing", slug: 'womens-clothing', description: 'Dresses, tops, kurtas, and more', image: 'https://placehold.co/400x400?text=Womens+Clothing', sortOrder: 2, metaTitle: "Women's Clothing", metaDescription: "Shop women's clothing" },
      { name: 'Kids', slug: 'kids-clothing', description: 'Clothing for kids of all ages', image: 'https://placehold.co/400x400?text=Kids+Clothing', sortOrder: 3, metaTitle: 'Kids Clothing', metaDescription: 'Shop kids clothing' },
      { name: 'Footwear', slug: 'footwear', description: 'Shoes, sandals, and sneakers', image: 'https://placehold.co/400x400?text=Footwear', sortOrder: 4, metaTitle: 'Footwear', metaDescription: 'Buy footwear online' },
      { name: 'Accessories', slug: 'fashion-accessories', description: 'Bags, watches, sunglasses, and more', image: 'https://placehold.co/400x400?text=Fashion+Accessories', sortOrder: 5, metaTitle: 'Fashion Accessories', metaDescription: 'Buy fashion accessories' },
    ],
  },
  {
    name: 'Home & Kitchen',
    slug: 'home-kitchen',
    description: 'Furniture, appliances, kitchen essentials, and home decor',
    image: 'https://placehold.co/400x400?text=Home+%26+Kitchen',
    sortOrder: 3,
    metaTitle: 'Home & Kitchen - ApnaKit',
    metaDescription: 'Shop home and kitchen essentials',
    children: [
      { name: 'Furniture', slug: 'furniture', description: 'Sofas, beds, tables, and chairs', image: 'https://placehold.co/400x400?text=Furniture', sortOrder: 1, metaTitle: 'Furniture', metaDescription: 'Buy furniture online' },
      { name: 'Kitchen', slug: 'kitchen', description: 'Cookware, appliances, and kitchen tools', image: 'https://placehold.co/400x400?text=Kitchen', sortOrder: 2, metaTitle: 'Kitchen', metaDescription: 'Buy kitchen essentials' },
      { name: 'Home Decor', slug: 'home-decor', description: 'Wall art, vases, and decorative items', image: 'https://placehold.co/400x400?text=Home+Decor', sortOrder: 3, metaTitle: 'Home Decor', metaDescription: 'Buy home decor items' },
      { name: 'Bedding', slug: 'bedding', description: 'Bed sheets, pillows, and comforters', image: 'https://placehold.co/400x400?text=Bedding', sortOrder: 4, metaTitle: 'Bedding', metaDescription: 'Buy bedding online' },
      { name: 'Lighting', slug: 'lighting', description: 'Ceiling lights, lamps, and LED lights', image: 'https://placehold.co/400x400?text=Lighting', sortOrder: 5, metaTitle: 'Lighting', metaDescription: 'Buy lighting solutions' },
    ],
  },
  {
    name: 'Beauty',
    slug: 'beauty',
    description: 'Skincare, makeup, haircare, and personal care products',
    image: 'https://placehold.co/400x400?text=Beauty',
    sortOrder: 4,
    metaTitle: 'Beauty - ApnaKit',
    metaDescription: 'Shop beauty and personal care products',
    children: [
      { name: 'Skincare', slug: 'skincare', description: 'Face wash, moisturizers, and sunscreens', image: 'https://placehold.co/400x400?text=Skincare', sortOrder: 1, metaTitle: 'Skincare', metaDescription: 'Buy skincare products' },
      { name: 'Makeup', slug: 'makeup', description: 'Foundation, lipstick, and eye makeup', image: 'https://placehold.co/400x400?text=Makeup', sortOrder: 2, metaTitle: 'Makeup', metaDescription: 'Buy makeup products' },
      { name: 'Haircare', slug: 'haircare', description: 'Shampoo, conditioner, and hair oils', image: 'https://placehold.co/400x400?text=Haircare', sortOrder: 3, metaTitle: 'Haircare', metaDescription: 'Buy haircare products' },
      { name: 'Personal Care', slug: 'personal-care', description: 'Deodorants, body wash, and oral care', image: 'https://placehold.co/400x400?text=Personal+Care', sortOrder: 4, metaTitle: 'Personal Care', metaDescription: 'Buy personal care products' },
    ],
  },
  {
    name: 'Books',
    slug: 'books',
    description: 'Fiction, non-fiction, academic, and children\'s books',
    image: 'https://placehold.co/400x400?text=Books',
    sortOrder: 5,
    metaTitle: 'Books - ApnaKit',
    metaDescription: 'Shop books across all genres',
    children: [
      { name: 'Fiction', slug: 'fiction', description: 'Novels, short stories, and literary fiction', image: 'https://placehold.co/400x400?text=Fiction', sortOrder: 1, metaTitle: 'Fiction Books', metaDescription: 'Buy fiction books' },
      { name: 'Non-Fiction', slug: 'non-fiction', description: 'Biography, self-help, and business books', image: 'https://placehold.co/400x400?text=Non+Fiction', sortOrder: 2, metaTitle: 'Non-Fiction Books', metaDescription: 'Buy non-fiction books' },
      { name: 'Academic', slug: 'academic', description: 'Textbooks, reference books, and exam prep', image: 'https://placehold.co/400x400?text=Academic', sortOrder: 3, metaTitle: 'Academic Books', metaDescription: 'Buy academic books' },
      { name: 'Children\'s', slug: 'childrens-books', description: 'Storybooks, activity books, and comics', image: 'https://placehold.co/400x400?text=Childrens+Books', sortOrder: 4, metaTitle: 'Children\'s Books', metaDescription: 'Buy children\'s books' },
    ],
  },
  {
    name: 'Sports',
    slug: 'sports',
    description: 'Fitness equipment, outdoor gear, and sports accessories',
    image: 'https://placehold.co/400x400?text=Sports',
    sortOrder: 6,
    metaTitle: 'Sports - ApnaKit',
    metaDescription: 'Shop sports and fitness equipment',
    children: [
      { name: 'Fitness', slug: 'fitness', description: 'Gym equipment, yoga mats, and weights', image: 'https://placehold.co/400x400?text=Fitness', sortOrder: 1, metaTitle: 'Fitness Equipment', metaDescription: 'Buy fitness equipment' },
      { name: 'Outdoor', slug: 'outdoor', description: 'Camping, hiking, and trekking gear', image: 'https://placehold.co/400x400?text=Outdoor', sortOrder: 2, metaTitle: 'Outdoor Gear', metaDescription: 'Buy outdoor gear' },
      { name: 'Cricket', slug: 'cricket', description: 'Bats, balls, kits, and protective gear', image: 'https://placehold.co/400x400?text=Cricket', sortOrder: 3, metaTitle: 'Cricket Equipment', metaDescription: 'Buy cricket equipment' },
      { name: 'Football', slug: 'football', description: 'Footballs, boots, and training gear', image: 'https://placehold.co/400x400?text=Football', sortOrder: 4, metaTitle: 'Football Equipment', metaDescription: 'Buy football equipment' },
    ],
  },
  {
    name: 'Grocery',
    slug: 'grocery',
    description: 'Fresh fruits, vegetables, dairy, and everyday essentials',
    image: 'https://placehold.co/400x400?text=Grocery',
    sortOrder: 7,
    metaTitle: 'Grocery - ApnaKit',
    metaDescription: 'Shop fresh groceries online',
    children: [
      { name: 'Fruits', slug: 'fruits', description: 'Fresh and seasonal fruits', image: 'https://placehold.co/400x400?text=Fruits', sortOrder: 1, metaTitle: 'Fresh Fruits', metaDescription: 'Buy fresh fruits' },
      { name: 'Vegetables', slug: 'vegetables', description: 'Fresh and organic vegetables', image: 'https://placehold.co/400x400?text=Vegetables', sortOrder: 2, metaTitle: 'Fresh Vegetables', metaDescription: 'Buy fresh vegetables' },
      { name: 'Dairy', slug: 'dairy', description: 'Milk, cheese, yogurt, and butter', image: 'https://placehold.co/400x400?text=Dairy', sortOrder: 3, metaTitle: 'Dairy Products', metaDescription: 'Buy dairy products' },
      { name: 'Snacks', slug: 'snacks', description: 'Chips, biscuits, namkeen, and more', image: 'https://placehold.co/400x400?text=Snacks', sortOrder: 4, metaTitle: 'Snacks', metaDescription: 'Buy snacks online' },
      { name: 'Beverages', slug: 'beverages', description: 'Tea, coffee, juices, and soft drinks', image: 'https://placehold.co/400x400?text=Beverages', sortOrder: 5, metaTitle: 'Beverages', metaDescription: 'Buy beverages online' },
    ],
  },
  {
    name: 'Toys',
    slug: 'toys',
    description: 'Board games, puzzles, action figures, and educational toys',
    image: 'https://placehold.co/400x400?text=Toys',
    sortOrder: 8,
    metaTitle: 'Toys - ApnaKit',
    metaDescription: 'Shop toys and games for kids',
    children: [
      { name: 'Board Games', slug: 'board-games', description: 'Classic and modern board games', image: 'https://placehold.co/400x400?text=Board+Games', sortOrder: 1, metaTitle: 'Board Games', metaDescription: 'Buy board games' },
      { name: 'Puzzles', slug: 'puzzles', description: 'Jigsaw puzzles and brain teasers', image: 'https://placehold.co/400x400?text=Puzzles', sortOrder: 2, metaTitle: 'Puzzles', metaDescription: 'Buy puzzles' },
      { name: 'Action Figures', slug: 'action-figures', description: 'Superheroes, vehicles, and collectibles', image: 'https://placehold.co/400x400?text=Action+Figures', sortOrder: 3, metaTitle: 'Action Figures', metaDescription: 'Buy action figures' },
      { name: 'Educational', slug: 'educational-toys', description: 'STEM toys, learning kits, and more', image: 'https://placehold.co/400x400?text=Educational+Toys', sortOrder: 4, metaTitle: 'Educational Toys', metaDescription: 'Buy educational toys' },
    ],
  },
];

async function createCategoryTree(
  prisma: PrismaClient,
  categories: CategorySeed[],
  parentId: string | null = null,
) {
  for (const category of categories) {
    const created = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        image: category.image,
        sortOrder: category.sortOrder,
        metaTitle: category.metaTitle,
        metaDescription: category.metaDescription,
        parentId,
      },
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: category.image,
        sortOrder: category.sortOrder,
        metaTitle: category.metaTitle,
        metaDescription: category.metaDescription,
        parentId,
        isActive: true,
      },
    });

    console.log(`  ${parentId ? '  └─' : '├─'} ${category.name}`);

    if (category.children) {
      await createCategoryTree(prisma, category.children, created.id);
    }
  }
}

export async function seedCategories(prisma: PrismaClient) {
  console.log('Seeding categories...');
  await createCategoryTree(prisma, CATEGORIES);
  console.log('Categories seeded successfully.');
}
