import { PrismaClient } from '@prisma/client';

interface ProductVariantSeed {
  name: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  attributes: Record<string, string>;
}

interface ProductSeed {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  brandSlug: string;
  categorySlug: string;
  sellerIndex: number;
  sku: string;
  isFeatured: boolean;
  tags: string[];
  specifications: { name: string; value: string; groupId?: string }[];
  variants: ProductVariantSeed[];
  images: string[];
}

const PRODUCTS: ProductSeed[] = [
  {
    name: 'Samsung Galaxy S24 Ultra',
    slug: 'samsung-galaxy-s24-ultra',
    description: 'Samsung Galaxy S24 Ultra with S Pen, 200MP camera, Snapdragon 8 Gen 3 processor, 5000mAh battery, and 6.8-inch Dynamic AMOLED display. Features AI-powered Galaxy AI for intelligent assistance.',
    shortDescription: 'Flagship smartphone with S Pen and 200MP camera',
    brandSlug: 'samsung',
    categorySlug: 'smartphones',
    sellerIndex: 0,
    sku: 'SAM-S24U-001',
    isFeatured: true,
    tags: ['samsung', 'galaxy', 'smartphone', 'flagship'],
    specifications: [
      { name: 'Display', value: '6.8-inch Dynamic AMOLED 2X', groupId: 'Display' },
      { name: 'Resolution', value: '3120 x 1440 pixels', groupId: 'Display' },
      { name: 'Processor', value: 'Snapdragon 8 Gen 3', groupId: 'Performance' },
      { name: 'RAM', value: '12GB', groupId: 'Performance' },
      { name: 'Storage', value: '256GB', groupId: 'Storage' },
      { name: 'Rear Camera', value: '200MP + 12MP + 50MP + 10MP', groupId: 'Camera' },
      { name: 'Front Camera', value: '12MP', groupId: 'Camera' },
      { name: 'Battery', value: '5000mAh', groupId: 'Battery' },
      { name: 'OS', value: 'Android 14, One UI 6.1', groupId: 'Software' },
    ],
    variants: [
      { name: '256GB - Titanium Black', sku: 'SAM-S24U-256-BLK', price: 129999, compareAtPrice: 141999, stock: 25, attributes: { storage: '256GB', color: 'Titanium Black' } },
      { name: '256GB - Titanium Gray', sku: 'SAM-S24U-256-GRY', price: 129999, compareAtPrice: 141999, stock: 20, attributes: { storage: '256GB', color: 'Titanium Gray' } },
      { name: '512GB - Titanium Black', sku: 'SAM-S24U-512-BLK', price: 149999, compareAtPrice: 159999, stock: 15, attributes: { storage: '512GB', color: 'Titanium Black' } },
    ],
    images: [
      'https://placehold.co/600x600?text=Samsung+Galaxy+S24+Ultra+1',
      'https://placehold.co/600x600?text=Samsung+Galaxy+S24+Ultra+2',
      'https://placehold.co/600x600?text=Samsung+Galaxy+S24+Ultra+3',
    ],
  },
  {
    name: 'Apple iPhone 15 Pro Max',
    slug: 'apple-iphone-15-pro-max',
    description: 'iPhone 15 Pro Max with A17 Pro chip, titanium design, 48MP camera system, USB-C, and Action button. The most powerful iPhone ever with pro-level performance.',
    shortDescription: 'Pro-level iPhone with A17 Pro chip and titanium design',
    brandSlug: 'apple',
    categorySlug: 'smartphones',
    sellerIndex: 0,
    sku: 'APL-IP15PM-001',
    isFeatured: true,
    tags: ['apple', 'iphone', 'smartphone', 'flagship'],
    specifications: [
      { name: 'Display', value: '6.7-inch Super Retina XDR', groupId: 'Display' },
      { name: 'Chip', value: 'A17 Pro', groupId: 'Performance' },
      { name: 'RAM', value: '8GB', groupId: 'Performance' },
      { name: 'Storage', value: '256GB', groupId: 'Storage' },
      { name: 'Rear Camera', value: '48MP + 12MP + 12MP', groupId: 'Camera' },
      { name: 'Front Camera', value: '12MP TrueDepth', groupId: 'Camera' },
      { name: 'Battery', value: '4422mAh', groupId: 'Battery' },
    ],
    variants: [
      { name: '256GB - Natural Titanium', sku: 'APL-IP15PM-256-NT', price: 159900, compareAtPrice: 179900, stock: 20, attributes: { storage: '256GB', color: 'Natural Titanium' } },
      { name: '256GB - Blue Titanium', sku: 'APL-IP15PM-256-BT', price: 159900, compareAtPrice: 179900, stock: 18, attributes: { storage: '256GB', color: 'Blue Titanium' } },
      { name: '512GB - Natural Titanium', sku: 'APL-IP15PM-512-NT', price: 179900, compareAtPrice: 199900, stock: 10, attributes: { storage: '512GB', color: 'Natural Titanium' } },
    ],
    images: [
      'https://placehold.co/600x600?text=iPhone+15+Pro+Max+1',
      'https://placehold.co/600x600?text=iPhone+15+Pro+Max+2',
    ],
  },
  {
    name: 'Sony WH-1000XM5 Headphones',
    slug: 'sony-wh-1000xm5-headphones',
    description: 'Industry-leading noise cancellation with Auto NC Optimizer. Crystal clear hands-free calling with 4 beamforming microphones. Up to 30 hours of battery life with quick charging.',
    shortDescription: 'Premium wireless headphones with best-in-class ANC',
    brandSlug: 'sony',
    categorySlug: 'audio',
    sellerIndex: 0,
    sku: 'SNY-WH1000-001',
    isFeatured: true,
    tags: ['sony', 'headphones', 'noise-cancelling', 'wireless'],
    specifications: [
      { name: 'Driver Size', value: '30mm', groupId: 'Audio' },
      { name: 'Frequency Response', value: '4Hz - 40,000Hz', groupId: 'Audio' },
      { name: 'Bluetooth', value: '5.2', groupId: 'Connectivity' },
      { name: 'Battery Life', value: 'Up to 30 hours', groupId: 'Battery' },
      { name: 'Weight', value: '250g', groupId: 'Design' },
    ],
    variants: [
      { name: 'Black', sku: 'SNY-WH1000-BLK', price: 24990, compareAtPrice: 34990, stock: 30, attributes: { color: 'Black' } },
      { name: 'Silver', sku: 'SNY-WH1000-SLV', price: 24990, compareAtPrice: 34990, stock: 25, attributes: { color: 'Silver' } },
    ],
    images: [
      'https://placehold.co/600x600?text=Sony+WH-1000XM5+1',
      'https://placehold.co/600x600?text=Sony+WH-1000XM5+2',
    ],
  },
  {
    name: 'Nike Air Max 270',
    slug: 'nike-air-max-270',
    description: 'The Nike Air Max 270 features the largest Max Air unit yet for unmatched comfort. A sleek design with breathable mesh upper and durable rubber outsole.',
    shortDescription: 'Iconic lifestyle sneakers with Max Air cushioning',
    brandSlug: 'nike',
    categorySlug: 'footwear',
    sellerIndex: 1,
    sku: 'NIK-AM270-001',
    isFeatured: true,
    tags: ['nike', 'sneakers', 'air-max', 'casual'],
    specifications: [
      { name: 'Upper', value: 'Mesh and synthetic', groupId: 'Material' },
      { name: 'Sole', value: 'Rubber with Air unit', groupId: 'Material' },
      { name: 'Closure', value: 'Lace-up', groupId: 'Design' },
      { name: 'Weight', value: '340g', groupId: 'Design' },
    ],
    variants: [
      { name: 'UK 7 - Black/White', sku: 'NIK-AM270-7-BW', price: 12995, compareAtPrice: 14995, stock: 15, attributes: { size: 'UK 7', color: 'Black/White' } },
      { name: 'UK 8 - Black/White', sku: 'NIK-AM270-8-BW', price: 12995, compareAtPrice: 14995, stock: 20, attributes: { size: 'UK 8', color: 'Black/White' } },
      { name: 'UK 9 - White/Red', sku: 'NIK-AM270-9-WR', price: 12995, compareAtPrice: 14995, stock: 18, attributes: { size: 'UK 9', color: 'White/Red' } },
    ],
    images: [
      'https://placehold.co/600x600?text=Nike+Air+Max+270+1',
      'https://placehold.co/600x600?text=Nike+Air+Max+270+2',
    ],
  },
  {
    name: 'Samsung 55" Crystal 4K UHD Smart TV',
    slug: 'samsung-55-crystal-4k-uhd-tv',
    description: 'Experience stunning picture quality with Crystal 4K UHD. PurColor technology delivers a wide range of colors. Crystal Processor 4K upscales content to 4K resolution.',
    shortDescription: '55-inch Crystal 4K UHD Smart TV with PurColor',
    brandSlug: 'samsung',
    categorySlug: 'electronics',
    sellerIndex: 0,
    sku: 'SAM-TV55-001',
    isFeatured: true,
    tags: ['samsung', 'tv', '4k', 'smart-tv'],
    specifications: [
      { name: 'Screen Size', value: '55 inches', groupId: 'Display' },
      { name: 'Resolution', value: '3840 x 2160 (4K UHD)', groupId: 'Display' },
      { name: 'HDR', value: 'HDR10+', groupId: 'Display' },
      { name: 'Smart TV', value: 'Tizen OS', groupId: 'Smart Features' },
      { name: 'Ports', value: '3x HDMI, 2x USB', groupId: 'Connectivity' },
    ],
    variants: [
      { name: '55 Inch', sku: 'SAM-TV55-55', price: 42990, compareAtPrice: 55990, stock: 10, attributes: { size: '55 Inch' } },
    ],
    images: [
      'https://placehold.co/600x600?text=Samsung+55+TV+1',
      'https://placehold.co/600x600?text=Samsung+55+TV+2',
    ],
  },
  {
    name: 'Prestige Iris 750W Mixer Grinder',
    slug: 'prestige-iris-750w-mixer-grinder',
    description: 'Powerful 750W motor for efficient grinding. Comes with 3 stainless steel jars. Superior grinding performance for wet and dry ingredients.',
    shortDescription: '750W mixer grinder with 3 SS jars',
    brandSlug: 'prestige',
    categorySlug: 'kitchen',
    sellerIndex: 2,
    sku: 'PRS-MG750-001',
    isFeatured: false,
    tags: ['prestige', 'mixer-grinder', 'kitchen-appliance'],
    specifications: [
      { name: 'Power', value: '750W', groupId: 'Performance' },
      { name: 'Jars', value: '3 Stainless Steel Jars', groupId: 'Design' },
      { name: 'Speed', value: '3 Speed + Pulse', groupId: 'Performance' },
      { name: 'Warranty', value: '2 Years', groupId: 'Warranty' },
    ],
    variants: [
      { name: 'White & Blue', sku: 'PRS-MG750-WB', price: 2795, compareAtPrice: 3495, stock: 40, attributes: { color: 'White & Blue' } },
    ],
    images: [
      'https://placehold.co/600x600?text=Prestige+Mixer+Grinder+1',
    ],
  },
  {
    name: 'Levi\'s 511 Slim Fit Jeans',
    slug: 'levis-511-slim-fit-jeans',
    description: 'Classic slim fit jeans sitting below the waist with a slim leg. Made from stretch denim for comfort. Timeless style for everyday wear.',
    shortDescription: 'Slim fit jeans with stretch denim comfort',
    brandSlug: 'levis',
    categorySlug: 'mens-clothing',
    sellerIndex: 1,
    sku: 'LVS-511-001',
    isFeatured: false,
    tags: ['levis', 'jeans', 'mens-fashion', 'slim-fit'],
    specifications: [
      { name: 'Fit', value: 'Slim Fit', groupId: 'Design' },
      { name: 'Rise', value: 'Mid Rise', groupId: 'Design' },
      { name: 'Material', value: '99% Cotton, 1% Elastane', groupId: 'Material' },
      { name: 'Closure', value: 'Button Fly', groupId: 'Design' },
    ],
    variants: [
      { name: 'W30 L32 - Dark Indigo', sku: 'LVS-511-3032-DI', price: 3999, compareAtPrice: 4999, stock: 25, attributes: { waist: 'W30', length: 'L32', color: 'Dark Indigo' } },
      { name: 'W32 L32 - Dark Indigo', sku: 'LVS-511-3232-DI', price: 3999, compareAtPrice: 4999, stock: 30, attributes: { waist: 'W32', length: 'L32', color: 'Dark Indigo' } },
      { name: 'W34 L32 - Black', sku: 'LVS-511-3432-BK', price: 3999, compareAtPrice: 4999, stock: 20, attributes: { waist: 'W34', length: 'L32', color: 'Black' } },
    ],
    images: [
      'https://placehold.co/600x600?text=Levis+511+Jeans+1',
      'https://placehold.co/600x600?text=Levis+511+Jeans+2',
    ],
  },
  {
    name: 'Xiaomi Redmi Note 13 Pro',
    slug: 'xiaomi-redmi-note-13-pro',
    description: 'Redmi Note 13 Pro features a 200MP OIS camera, 6.67-inch 120Hz AMOLED display, Snapdragon 7s Gen 2 processor, and 5100mAh battery with 67W fast charging.',
    shortDescription: '200MP camera smartphone with 120Hz AMOLED display',
    brandSlug: 'xiaomi',
    categorySlug: 'smartphones',
    sellerIndex: 0,
    sku: 'XMI-RN13P-001',
    isFeatured: true,
    tags: ['xiaomi', 'redmi', 'smartphone', 'budget'],
    specifications: [
      { name: 'Display', value: '6.67-inch 120Hz AMOLED', groupId: 'Display' },
      { name: 'Processor', value: 'Snapdragon 7s Gen 2', groupId: 'Performance' },
      { name: 'RAM', value: '8GB', groupId: 'Performance' },
      { name: 'Storage', value: '128GB', groupId: 'Storage' },
      { name: 'Rear Camera', value: '200MP + 8MP + 2MP', groupId: 'Camera' },
      { name: 'Battery', value: '5100mAh', groupId: 'Battery' },
    ],
    variants: [
      { name: '128GB - Graphite Black', sku: 'XMI-RN13P-128-GB', price: 17999, compareAtPrice: 20999, stock: 50, attributes: { storage: '128GB', color: 'Graphite Black' } },
      { name: '256GB - Glacier White', sku: 'XMI-RN13P-256-GW', price: 19999, compareAtPrice: 22999, stock: 35, attributes: { storage: '256GB', color: 'Glacier White' } },
    ],
    images: [
      'https://placehold.co/600x600?text=Redmi+Note+13+Pro+1',
      'https://placehold.co/600x600?text=Redmi+Note+13+Pro+2',
    ],
  },
  {
    name: 'L\'Oréal Paris Revitalift Cream',
    slug: 'loreal-paris-revitalift-cream',
    description: 'Anti-aging face cream with Pro-Retinol and Centella Asiatica. Reduces wrinkles and firms skin. Suitable for all skin types. Dermatologically tested.',
    shortDescription: 'Anti-aging cream with Pro-Retinol',
    brandSlug: 'loreal',
    categorySlug: 'skincare',
    sellerIndex: 1,
    sku: 'LOR-REV-001',
    isFeatured: false,
    tags: ['loreal', 'skincare', 'anti-aging', 'face-cream'],
    specifications: [
      { name: 'Volume', value: '50ml', groupId: 'Product Info' },
      { name: 'Skin Type', value: 'All Skin Types', groupId: 'Product Info' },
      { name: 'Key Ingredient', value: 'Pro-Retinol + Centella Asiatica', groupId: 'Ingredients' },
      { name: 'SPF', value: 'SPF 20', groupId: 'Protection' },
    ],
    variants: [
      { name: '50ml', sku: 'LOR-REV-50', price: 899, compareAtPrice: 1199, stock: 60, attributes: { volume: '50ml' } },
    ],
    images: [
      'https://placehold.co/600x600?text=Loreal+Revitalift+Cream+1',
    ],
  },
  {
    name: 'Adidas Ultraboost 23',
    slug: 'adidas-ultraboost-23',
    description: 'Running shoes with responsive BOOST midsole and Continental rubber outsole. Primeknit+ upper adapts to your foot. Designed for long-distance comfort.',
    shortDescription: 'Performance running shoes with BOOST cushioning',
    brandSlug: 'adidas',
    categorySlug: 'footwear',
    sellerIndex: 1,
    sku: 'ADI-UB23-001',
    isFeatured: true,
    tags: ['adidas', 'running', 'shoes', 'ultraboost'],
    specifications: [
      { name: 'Upper', value: 'Primeknit+', groupId: 'Material' },
      { name: 'Midsole', value: 'BOOST', groupId: 'Material' },
      { name: 'Outsole', value: 'Continental Rubber', groupId: 'Material' },
      { name: 'Drop', value: '10mm', groupId: 'Design' },
    ],
    variants: [
      { name: 'UK 8 - Core Black', sku: 'ADI-UB23-8-CB', price: 16999, compareAtPrice: 19999, stock: 15, attributes: { size: 'UK 8', color: 'Core Black' } },
      { name: 'UK 9 - Cloud White', sku: 'ADI-UB23-9-CW', price: 16999, compareAtPrice: 19999, stock: 12, attributes: { size: 'UK 9', color: 'Cloud White' } },
    ],
    images: [
      'https://placehold.co/600x600?text=Adidas+Ultraboost+23+1',
      'https://placehold.co/600x600?text=Adidas+Ultraboost+23+2',
    ],
  },
  {
    name: 'Philips Air Fryer HD9200',
    slug: 'philips-air-fryer-hd9200',
    description: 'Rapid Air Technology for healthy frying with up to 90% less fat. 4.1L capacity serves 2-3 portions. Digital touch screen with 7 preset cooking modes.',
    shortDescription: '4.1L air fryer with Rapid Air Technology',
    brandSlug: 'philips',
    categorySlug: 'kitchen',
    sellerIndex: 2,
    sku: 'PHI-AF9200-001',
    isFeatured: false,
    tags: ['philips', 'air-fryer', 'kitchen-appliance', 'healthy-cooking'],
    specifications: [
      { name: 'Capacity', value: '4.1L', groupId: 'Capacity' },
      { name: 'Power', value: '1400W', groupId: 'Performance' },
      { name: 'Preset Modes', value: '7', groupId: 'Features' },
      { name: 'Temperature Range', value: '80°C - 200°C', groupId: 'Performance' },
    ],
    variants: [
      { name: 'Black', sku: 'PHI-AF9200-BLK', price: 9995, compareAtPrice: 12995, stock: 20, attributes: { color: 'Black' } },
    ],
    images: [
      'https://placehold.co/600x600?text=Philips+Air+Fryer+1',
    ],
  },
  {
    name: 'Penguin Think and Grow Rich',
    slug: 'penguin-think-and-grow-rich',
    description: 'Napoleon Hill\'s classic masterpiece. One of the most influential books on success and wealth creation. A must-read for anyone seeking personal growth.',
    shortDescription: 'Classic self-help book on success and wealth',
    brandSlug: 'penguin',
    categorySlug: 'non-fiction',
    sellerIndex: 1,
    sku: 'PNG-TGR-001',
    isFeatured: false,
    tags: ['books', 'self-help', 'business', 'classic'],
    specifications: [
      { name: 'Author', value: 'Napoleon Hill', groupId: 'Product Info' },
      { name: 'Pages', value: '320', groupId: 'Product Info' },
      { name: 'Language', value: 'English', groupId: 'Product Info' },
      { name: 'Format', value: 'Paperback', groupId: 'Product Info' },
    ],
    variants: [
      { name: 'Paperback', sku: 'PNG-TGR-PB', price: 199, compareAtPrice: 299, stock: 100, attributes: { format: 'Paperback' } },
    ],
    images: [
      'https://placehold.co/600x600?text=Think+and+Grow+Rich+1',
    ],
  },
  {
    name: 'Havells Skylight 15W LED Panel',
    slug: 'havells-skylight-15w-led-panel',
    description: 'Slim and elegant LED panel light with uniform illumination. Energy-efficient with 50,000 hours lifespan. Suitable for homes and offices.',
    shortDescription: '15W slim LED panel with uniform illumination',
    brandSlug: 'havells',
    categorySlug: 'lighting',
    sellerIndex: 2,
    sku: 'HVL-SKL15-001',
    isFeatured: false,
    tags: ['havells', 'led', 'panel-light', 'home-lighting'],
    specifications: [
      { name: 'Wattage', value: '15W', groupId: 'Performance' },
      { name: 'Lumens', value: '1500lm', groupId: 'Performance' },
      { name: 'Color Temperature', value: '6500K (Cool Day Light)', groupId: 'Performance' },
      { name: 'Lifespan', value: '50,000 hours', groupId: 'Performance' },
    ],
    variants: [
      { name: 'White', sku: 'HVL-SKL15-WHT', price: 599, compareAtPrice: 899, stock: 80, attributes: { color: 'White' } },
    ],
    images: [
      'https://placehold.co/600x600?text=Havells+LED+Panel+1',
    ],
  },
  {
    name: 'Nivea Soft Moisturizing Cream',
    slug: 'nivea-soft-moisturizing-cream',
    description: 'Light moisturizing cream with Vitamin E and Jojoba Oil. Provides long-lasting moisture for soft and smooth skin. Suitable for face, hands, and body.',
    shortDescription: 'Light moisturizing cream with Vitamin E',
    brandSlug: 'nivea',
    categorySlug: 'skincare',
    sellerIndex: 1,
    sku: 'NIV-SFT-001',
    isFeatured: false,
    tags: ['nivea', 'moisturizer', 'skincare', 'face-cream'],
    specifications: [
      { name: 'Volume', value: '200ml', groupId: 'Product Info' },
      { name: 'Skin Type', value: 'All Skin Types', groupId: 'Product Info' },
      { name: 'Key Ingredient', value: 'Vitamin E + Jojoba Oil', groupId: 'Ingredients' },
    ],
    variants: [
      { name: '200ml', sku: 'NIV-SFT-200', price: 299, compareAtPrice: 399, stock: 100, attributes: { volume: '200ml' } },
    ],
    images: [
      'https://placehold.co/600x600?text=Nivea+Soft+Cream+1',
    ],
  },
  {
    name: 'Puma RS-X Reinvention',
    slug: 'puma-rs-x-reinvention',
    description: 'Bold and chunky sneakers with RS foam technology for superior cushioning. Mesh and synthetic upper with TPU overlays. EVA midsole for lightweight comfort.',
    shortDescription: 'Chunky sneakers with RS foam cushioning',
    brandSlug: 'puma',
    categorySlug: 'footwear',
    sellerIndex: 1,
    sku: 'PUM-RSX-001',
    isFeatured: false,
    tags: ['puma', 'sneakers', 'casual', 'chunky'],
    specifications: [
      { name: 'Upper', value: 'Mesh and Synthetic', groupId: 'Material' },
      { name: 'Midsole', value: 'RS Foam + EVA', groupId: 'Material' },
      { name: 'Outsole', value: 'Rubber', groupId: 'Material' },
    ],
    variants: [
      { name: 'UK 8 - Peacoat/White', sku: 'PUM-RSX-8-PW', price: 8999, compareAtPrice: 10999, stock: 20, attributes: { size: 'UK 8', color: 'Peacoat/White' } },
      { name: 'UK 9 - Quiet Shade', sku: 'PUM-RSX-9-QS', price: 8999, compareAtPrice: 10999, stock: 15, attributes: { size: 'UK 9', color: 'Quiet Shade' } },
    ],
    images: [
      'https://placehold.co/600x600?text=Puma+RS-X+1',
    ],
  },
  {
    name: 'OnePlus 12 5G',
    slug: 'oneplus-12-5g',
    description: 'OnePlus 12 with Snapdragon 8 Gen 3, 50MP Sony LYT-808 camera, 5400mAh battery with 100W SUPERVOOC charging, and 2K 120Hz ProXDR display.',
    shortDescription: 'Flagship killer with Snapdragon 8 Gen 3',
    brandSlug: 'oneplus',
    categorySlug: 'smartphones',
    sellerIndex: 0,
    sku: 'OP-12-001',
    isFeatured: true,
    tags: ['oneplus', 'smartphone', '5g', 'flagship'],
    specifications: [
      { name: 'Display', value: '6.82-inch 2K 120Hz LTPO', groupId: 'Display' },
      { name: 'Processor', value: 'Snapdragon 8 Gen 3', groupId: 'Performance' },
      { name: 'RAM', value: '12GB', groupId: 'Performance' },
      { name: 'Storage', value: '256GB', groupId: 'Storage' },
      { name: 'Rear Camera', value: '50MP + 48MP + 64MP', groupId: 'Camera' },
      { name: 'Battery', value: '5400mAh', groupId: 'Battery' },
    ],
    variants: [
      { name: '256GB - Silky Black', sku: 'OP-12-256-SB', price: 64999, compareAtPrice: 69999, stock: 25, attributes: { storage: '256GB', color: 'Silky Black' } },
      { name: '512GB - Flowy Emerald', sku: 'OP-12-512-FE', price: 69999, compareAtPrice: 74999, stock: 15, attributes: { storage: '512GB', color: 'Flowy Emerald' } },
    ],
    images: [
      'https://placehold.co/600x600?text=OnePlus+12+1',
      'https://placehold.co/600x600?text=OnePlus+12+2',
    ],
  },
  {
    name: 'LG 8kg Front Load Washing Machine',
    slug: 'lg-8kg-front-load-washing-machine',
    description: 'AI DD technology detects fabric type and optimizes wash settings. Steam function for hygienic cleaning. 6 Motion DD for gentle yet effective washing.',
    shortDescription: '8kg front load washer with AI DD technology',
    brandSlug: 'lg',
    categorySlug: 'electronics',
    sellerIndex: 2,
    sku: 'LG-WM8FL-001',
    isFeatured: false,
    tags: ['lg', 'washing-machine', 'front-load', 'home-appliance'],
    specifications: [
      { name: 'Capacity', value: '8 kg', groupId: 'Capacity' },
      { name: 'Motor', value: 'Inverter Direct Drive', groupId: 'Performance' },
      { name: 'RPM', value: '1400', groupId: 'Performance' },
      { name: 'Energy Rating', value: '5 Star', groupId: 'Efficiency' },
      { name: 'Wash Programs', value: '10', groupId: 'Features' },
    ],
    variants: [
      { name: '8kg - Middle Free Silver', sku: 'LG-WM8FL-MFS', price: 35990, compareAtPrice: 44990, stock: 8, attributes: { capacity: '8kg', color: 'Middle Free Silver' } },
    ],
    images: [
      'https://placehold.co/600x600?text=LG+Washing+Machine+1',
    ],
  },
  {
    name: 'Maybelline New York Fit Me Foundation',
    slug: 'maybelline-fit-me-foundation',
    description: 'Lightweight foundation with medium buildable coverage. Matte + Poreless formula for normal to oily skin. Available in 20+ shades for every skin tone.',
    shortDescription: 'Matte foundation with medium buildable coverage',
    brandSlug: 'maybelline',
    categorySlug: 'makeup',
    sellerIndex: 1,
    sku: 'MAY-FMF-001',
    isFeatured: false,
    tags: ['maybelline', 'foundation', 'makeup', 'face'],
    specifications: [
      { name: 'Volume', value: '30ml', groupId: 'Product Info' },
      { name: 'Coverage', value: 'Medium Buildable', groupId: 'Product Info' },
      { name: 'Finish', value: 'Matte', groupId: 'Product Info' },
      { name: 'Skin Type', value: 'Normal to Oily', groupId: 'Product Info' },
    ],
    variants: [
      { name: '128 Warm Nude', sku: 'MAY-FMF-128', price: 549, compareAtPrice: 699, stock: 45, attributes: { shade: '128 Warm Nude' } },
      { name: '228 Soft Tan', sku: 'MAY-FMF-228', price: 549, compareAtPrice: 699, stock: 40, attributes: { shade: '228 Soft Tan' } },
      { name: '310 Sun Beige', sku: 'MAY-FMF-310', price: 549, compareAtPrice: 699, stock: 35, attributes: { shade: '310 Sun Beige' } },
    ],
    images: [
      'https://placehold.co/600x600?text=Maybelline+Fit+Me+1',
    ],
  },
  {
    name: 'HarperCollins The Alchemist',
    slug: 'harpercollins-the-alchemist',
    description: 'Paulo Coelho\'s magical story of Santiago, an Andalusian shepherd boy who yearns to travel in search of a worldly treasure. A timeless classic about following your dreams.',
    shortDescription: 'A magical story about following your dreams',
    brandSlug: 'harpercollins',
    categorySlug: 'fiction',
    sellerIndex: 1,
    sku: 'HC-ALC-001',
    isFeatured: false,
    tags: ['books', 'fiction', 'classic', 'bestseller'],
    specifications: [
      { name: 'Author', value: 'Paulo Coelho', groupId: 'Product Info' },
      { name: 'Pages', value: '208', groupId: 'Product Info' },
      { name: 'Language', value: 'English', groupId: 'Product Info' },
      { name: 'Format', value: 'Paperback', groupId: 'Product Info' },
    ],
    variants: [
      { name: 'Paperback', sku: 'HC-ALC-PB', price: 299, compareAtPrice: 399, stock: 75, attributes: { format: 'Paperback' } },
    ],
    images: [
      'https://placehold.co/600x600?text=The+Alchemist+1',
    ],
  },
  {
    name: 'Bajaj Majesty TCX 3 Toaster',
    slug: 'bajaj-majesty-tcx-3-toaster',
    description: '2-slice pop-up toaster with variable browning control. Cool touch body for safety. Auto shut-off and removable crumb tray for easy cleaning.',
    shortDescription: '2-slice toaster with variable browning control',
    brandSlug: 'bajaj',
    categorySlug: 'kitchen',
    sellerIndex: 2,
    sku: 'BAJ-TCX3-001',
    isFeatured: false,
    tags: ['bajaj', 'toaster', 'kitchen-appliance'],
    specifications: [
      { name: 'Slices', value: '2', groupId: 'Capacity' },
      { name: 'Power', value: '800W', groupId: 'Performance' },
      { name: 'Browning Levels', value: '7', groupId: 'Features' },
    ],
    variants: [
      { name: 'White', sku: 'BAJ-TCX3-WHT', price: 1199, compareAtPrice: 1599, stock: 35, attributes: { color: 'White' } },
    ],
    images: [
      'https://placehold.co/600x600?text=Bajaj+Toaster+1',
    ],
  },
  {
    name: 'Zara Floral Print Dress',
    slug: 'zara-floral-print-dress',
    description: 'Beautiful floral print midi dress with V-neckline and short sleeves. Relaxed fit with tie waist belt. Perfect for casual outings and brunch.',
    shortDescription: 'Floral midi dress with V-neckline',
    brandSlug: 'zara',
    categorySlug: 'womens-clothing',
    sellerIndex: 1,
    sku: 'ZRA-FPD-001',
    isFeatured: false,
    tags: ['zara', 'dress', 'womens-fashion', 'floral'],
    specifications: [
      { name: 'Length', value: 'Midi', groupId: 'Design' },
      { name: 'Sleeve', value: 'Short Sleeves', groupId: 'Design' },
      { name: 'Material', value: '100% Viscose', groupId: 'Material' },
      { name: 'Closure', value: 'Back Zip', groupId: 'Design' },
    ],
    variants: [
      { name: 'S - Multi', sku: 'ZRA-FPD-S-MT', price: 3990, compareAtPrice: 4990, stock: 10, attributes: { size: 'S', color: 'Multi' } },
      { name: 'M - Multi', sku: 'ZRA-FPD-M-MT', price: 3990, compareAtPrice: 4990, stock: 15, attributes: { size: 'M', color: 'Multi' } },
      { name: 'L - Multi', sku: 'ZRA-FPD-L-MT', price: 3990, compareAtPrice: 4990, stock: 12, attributes: { size: 'L', color: 'Multi' } },
    ],
    images: [
      'https://placehold.co/600x600?text=Zara+Floral+Dress+1',
    ],
  },
  {
    name: 'H&M Oversized Hoodie',
    slug: 'hm-oversized-hoodie',
    description: 'Comfortable oversized hoodie in soft cotton blend. Kangaroo pocket and adjustable drawstring hood. Relaxed fit for a laid-back look.',
    shortDescription: 'Soft cotton blend oversized hoodie',
    brandSlug: 'hm',
    categorySlug: 'mens-clothing',
    sellerIndex: 1,
    sku: 'HM-OVHD-001',
    isFeatured: false,
    tags: ['hm', 'hoodie', 'mens-fashion', 'casual'],
    specifications: [
      { name: 'Material', value: '60% Cotton, 40% Polyester', groupId: 'Material' },
      { name: 'Fit', value: 'Oversized', groupId: 'Design' },
      { name: 'Pocket', value: 'Kangaroo Pocket', groupId: 'Features' },
    ],
    variants: [
      { name: 'M - Grey Melange', sku: 'HM-OVHD-M-GM', price: 1999, compareAtPrice: 2499, stock: 30, attributes: { size: 'M', color: 'Grey Melange' } },
      { name: 'L - Black', sku: 'HM-OVHD-L-BK', price: 1999, compareAtPrice: 2499, stock: 25, attributes: { size: 'L', color: 'Black' } },
      { name: 'XL - Navy Blue', sku: 'HM-OVHD-XL-NB', price: 1999, compareAtPrice: 2499, stock: 20, attributes: { size: 'XL', color: 'Navy Blue' } },
    ],
    images: [
      'https://placehold.co/600x600?text=HM+Hoodie+1',
    ],
  },
  {
    name: 'Lenovo IdeaPad Slim 3 Laptop',
    slug: 'lenovo-ideapad-slim-3',
    description: '15.6-inch FHD laptop with Intel Core i5-1335U, 8GB RAM, 512GB SSD. Dolby Audio speakers, privacy shutter camera, and up to 10 hours battery life.',
    shortDescription: '15.6" FHD laptop with Intel Core i5',
    brandSlug: 'samsung',
    categorySlug: 'laptops',
    sellerIndex: 0,
    sku: 'LEN-IS3-001',
    isFeatured: true,
    tags: ['laptop', 'lenovo', 'intel', 'student'],
    specifications: [
      { name: 'Display', value: '15.6-inch FHD IPS', groupId: 'Display' },
      { name: 'Processor', value: 'Intel Core i5-1335U', groupId: 'Performance' },
      { name: 'RAM', value: '8GB DDR4', groupId: 'Performance' },
      { name: 'Storage', value: '512GB NVMe SSD', groupId: 'Storage' },
      { name: 'Battery', value: 'Up to 10 hours', groupId: 'Battery' },
      { name: 'OS', value: 'Windows 11 Home', groupId: 'Software' },
    ],
    variants: [
      { name: '8GB/512GB - Cloud Grey', sku: 'LEN-IS3-8-512-CG', price: 52990, compareAtPrice: 62990, stock: 12, attributes: { ram: '8GB', storage: '512GB', color: 'Cloud Grey' } },
      { name: '16GB/512GB - Abyss Blue', sku: 'LEN-IS3-16-512-AB', price: 59990, compareAtPrice: 69990, stock: 8, attributes: { ram: '16GB', storage: '512GB', color: 'Abyss Blue' } },
    ],
    images: [
      'https://placehold.co/600x600?text=Lenovo+IdeaPad+1',
      'https://placehold.co/600x600?text=Lenovo+IdeaPad+2',
    ],
  },
];

export async function seedProducts(prisma: PrismaClient) {
  console.log('Seeding products...');

  const sellers = await prisma.seller.findMany();
  const brands = await prisma.brand.findMany();
  const categories = await prisma.category.findMany();

  const brandMap = new Map(brands.map((b) => [b.slug, b.id]));
  const categoryMap = new Map(categories.map((c) => [c.slug, c.id]));

  let count = 0;

  for (const productData of PRODUCTS) {
    const brandId = brandMap.get(productData.brandSlug) || null;
    const categoryId = categoryMap.get(productData.categorySlug) || null;
    const sellerId = sellers[productData.sellerIndex]?.id || null;

    const existing = await prisma.product.findUnique({
      where: { slug: productData.slug },
    });

    if (existing) {
      continue;
    }

    const product = await prisma.product.create({
      data: {
        name: productData.name,
        slug: productData.slug,
        description: productData.description,
        shortDescription: productData.shortDescription,
        brandId,
        categoryId,
        sellerId,
        sku: productData.sku,
        isFeatured: productData.isFeatured,
        isActive: true,
        tags: productData.tags.join(','),
      },
    });

    for (const variantData of productData.variants) {
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          name: variantData.name,
          sku: variantData.sku,
          price: variantData.price,
          compareAtPrice: variantData.compareAtPrice || null,
          stock: variantData.stock,
          attributes: variantData.attributes,
          isActive: true,
        },
      });
    }

    for (let i = 0; i < productData.images.length; i++) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: productData.images[i],
          alt: productData.name,
          sortOrder: i,
          isPrimary: i === 0,
        },
      });
    }

    for (const spec of productData.specifications) {
      await prisma.productSpecification.create({
        data: {
          productId: product.id,
          name: spec.name,
          value: spec.value,
          groupId: spec.groupId || null,
        },
      });
    }

    count++;
    console.log(`  ├─ ${productData.name}`);
  }

  console.log(`  Total products seeded: ${count}`);
}
