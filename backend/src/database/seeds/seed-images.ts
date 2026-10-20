/**
 * Real product photography for the demo catalogue.
 *
 * Previously every seeded image was a `placehold.co` link, which renders as a
 * flat grey box with the product name typed into it — so the storefront looked
 * empty even though the data underneath was correct. These are real
 * photographs instead.
 *
 * Every ID below was verified to return HTTP 200 from the Unsplash CDN.
 * `images.unsplash.com` is already permitted by `images.remotePatterns` in
 * frontend/next.config.ts.
 */

const U = (id: string, w = 600, h = 600): string =>
  `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=crop&auto=format&q=80`;

/** Product images keyed by product slug. */
export const PRODUCT_IMAGES: Record<string, string[]> = {
  // Smartphones
  'samsung-galaxy-s24-ultra': [U('photo-1610945415295-d9bbf067e59c'), U('photo-1511707171634-5f897ff02aa9')],
  'apple-iphone-15-pro-max': [U('photo-1511707171634-5f897ff02aa9'), U('photo-1610945415295-d9bbf067e59c')],
  'xiaomi-redmi-note-13-pro': [U('photo-1610945415295-d9bbf067e59c'), U('photo-1511707171634-5f897ff02aa9')],
  'oneplus-12-5g': [U('photo-1511707171634-5f897ff02aa9'), U('photo-1610945415295-d9bbf067e59c')],

  // Audio
  'sony-wh-1000xm5-headphones': [
    U('photo-1546435770-a3e426bf472b'),
    U('photo-1505740420928-5e560c06d30e'),
    U('photo-1583394838336-acd977736f90'),
  ],

  // Footwear
  'nike-air-max-270': [
    U('photo-1542291026-7eec264c27ff'),
    U('photo-1597892657493-6847b9640bac'),
    U('photo-1491553895911-0055eca6402d'),
  ],
  'adidas-ultraboost-23': [U('photo-1571008887538-b36bb32f4571'), U('photo-1600185365483-26d7a4cc7519')],
  'puma-rs-x-reinvention': [U('photo-1549298916-b41d501d3772'), U('photo-1560769629-975ec94e6a86')],

  // Electronics
  'samsung-55-crystal-4k-uhd-tv': [U('photo-1593359677879-a4bb92f829d1'), U('photo-1593784991095-a205069470b6')],
  'lenovo-ideapad-slim-3': [U('photo-1517336714731-489689fd1ca8'), U('photo-1587829741301-dc798b83add3')],
  'lg-8kg-front-load-washing-machine': [U('photo-1626806787461-102c1bfaaea1')],

  // Kitchen appliances
  'prestige-iris-750w-mixer-grinder': [U('photo-1570222094114-d054a817e56b')],
  'philips-air-fryer-hd9200': [U('photo-1605518216938-7c31b7b14ad0')],
  'bajaj-majesty-tcx-3-toaster': [U('photo-1585237672814-8f85a8118bf6')],
  'havells-skylight-15w-led-panel': [U('photo-1507473885765-e6ed057f782c')],

  // Apparel
  'levis-511-slim-fit-jeans': [U('photo-1523205771623-e0faa4d2813d'), U('photo-1616761512547-ea151d8a56d5')],
  'zara-floral-print-dress': [U('photo-1603805785279-da750208c094'), U('photo-1604506847073-4a8e18e07d92')],
  'hm-oversized-hoodie': [U('photo-1467043237213-65f2da53396f'), U('photo-1632469188022-b5db09a70fbc')],

  // Beauty
  'loreal-paris-revitalift-cream': [U('photo-1629732047847-50219e9c5aef'), U('photo-1679394042175-717ca34ef0f2')],
  'nivea-soft-moisturizing-cream': [U('photo-1629051192954-55d807199226'), U('photo-1583334529937-bc4761d2cdad')],
  'maybelline-fit-me-foundation': [U('photo-1605204768985-81bad5fd9d79'), U('photo-1668025757022-a75458371576')],

  // Books
  'penguin-think-and-grow-rich': [U('photo-1544716278-ca5e3f4abd8c'), U('photo-1512820790803-83ca734da794')],
  'harpercollins-the-alchemist': [U('photo-1544716278-ca5e3f4abd8c'), U('photo-1512820790803-83ca734da794')],
};

/** Category tile images keyed by category slug (400x400). */
const C = (id: string): string => U(id, 400, 400);

export const CATEGORY_IMAGES: Record<string, string> = {
  electronics: C('photo-1498049794561-7780e7231661'),
  smartphones: C('photo-1511707171634-5f897ff02aa9'),
  laptops: C('photo-1517336714731-489689fd1ca8'),
  tablets: C('photo-1544244015-0df4b3ffc6b0'),
  accessories: C('photo-1583394838336-acd977736f90'),
  audio: C('photo-1546435770-a3e426bf472b'),
  cameras: C('photo-1526170375885-4d8ecf77b99f'),

  fashion: C('photo-1445205170230-053b83016050'),
  'mens-clothing': C('photo-1616761512547-ea151d8a56d5'),
  'womens-clothing': C('photo-1603805785279-da750208c094'),
  'kids-clothing': C('photo-1556905055-8f358a7a47b2'),
  footwear: C('photo-1542291026-7eec264c27ff'),
  'fashion-accessories': C('photo-1603805752838-aa579d77da72'),

  'home-kitchen': C('photo-1556909211-36987daf7b4d'),
  furniture: C('photo-1555041469-a586c61ea9bc'),
  kitchen: C('photo-1600489000022-c2086d79f9d4'),
  'home-decor': C('photo-1616486338812-3dadae4b4ace'),
  bedding: C('photo-1631679706909-1844bbd07221'),
  lighting: C('photo-1507473885765-e6ed057f782c'),

  beauty: C('photo-1596462502278-27bfdc403348'),
  skincare: C('photo-1629732047847-50219e9c5aef'),
  makeup: C('photo-1596462502278-27bfdc403348'),
  haircare: C('photo-1522338242992-e1a54906a8da'),
  'personal-care': C('photo-1583334529937-bc4761d2cdad'),

  books: C('photo-1544716278-ca5e3f4abd8c'),
  fiction: C('photo-1512820790803-83ca734da794'),
  'non-fiction': C('photo-1544716278-ca5e3f4abd8c'),
  academic: C('photo-1544716278-ca5e3f4abd8c'),
  'childrens-books': C('photo-1512820790803-83ca734da794'),

  sports: C('photo-1461896836934-ffe607ba8211'),
  fitness: C('photo-1534438327276-14e5300c3a48'),
  outdoor: C('photo-1461896836934-ffe607ba8211'),
  cricket: C('photo-1531415074968-036ba1b575da'),
  football: C('photo-1579952363873-27f3bade9f55'),

  grocery: C('photo-1619566636858-adf3ef46400b'),
  fruits: C('photo-1610832958506-aa56368176cf'),
  vegetables: C('photo-1540420773420-3366772f4999'),
  dairy: C('photo-1628088062854-d1870b4553da'),
  snacks: C('photo-1621939514649-280e2ee25f60'),
  beverages: C('photo-1544145945-f90425340c7e'),

  toys: C('photo-1594787318286-3d835c1d207f'),
  'board-games': C('photo-1610890716171-6b1bb98ffd09'),
  puzzles: C('photo-1611996575749-79a3a250f948'),
  'action-figures': C('photo-1594787318286-3d835c1d207f'),
  'educational-toys': C('photo-1596461404969-9ae70f2830c1'),
};

/** Hero / promo banner images keyed by the banner's seed title. */
export const BANNER_IMAGES: Record<string, string> = {
  // Hero — the live catalogue is grocery/FMCG, so the artwork matches.
  'Fresh Groceries, Delivered Fast': U('photo-1604719312566-8912e9227c6a', 1600, 600),
  'Snacks & Drinks Deals': U('photo-1621447504864-d8686e12698c', 1600, 600),
  'Beauty & Personal Care': U('photo-1608248543803-ba4f8c70ae0b', 1600, 600),
  'Instant Food & Frozen Treats': U('photo-1578916171728-46686eac8d58', 1600, 600),

  // Promo tiles
  'Free Delivery': U('photo-1607082348824-0a96f2a4b9da', 800, 400),
  'Bank Offers': U('photo-1563013544-824ae1b704d3', 800, 400),
  'Refer & Earn': U('photo-1556742049-0cfed4f6a45d', 800, 400),
  'Sell on ApnaKit': U('photo-1556740758-90de374c12ad', 800, 400),
};

/**
 * Banners that sit directly beneath the Quick / Shop All toggle, keyed by
 * section. The live catalogue is grocery/FMCG, so the artwork is grocery-flavoured.
 * Admin can replace these at runtime from Admin → Banners.
 */
export const SECTION_BANNERS: Record<string, { title: string; subtitle: string; image: string; link: string }[]> = {
  QUICK: [
    {
      title: 'Groceries delivered in minutes',
      subtitle: 'Fresh produce, dairy and staples from local stores near you',
      image: U('photo-1604719312566-8912e9227c6a', 1200, 460),
      link: '/products',
    },
    {
      title: 'Snacks & munchies, sorted',
      subtitle: 'Chips, chocolates and drinks at everyday low prices',
      image: U('photo-1621447504864-d8686e12698c', 1200, 460),
      link: '/products',
    },
  ],
  SHOP_ALL: [
    {
      title: 'Everything for the whole month',
      subtitle: 'Over 200 products across 35+ categories',
      image: U('photo-1578916171728-46686eac8d58', 1200, 460),
      link: '/products',
    },
    {
      title: 'Beauty, care and hygiene',
      subtitle: 'Shampoo, skincare and personal care from brands you trust',
      image: U('photo-1608248543803-ba4f8c70ae0b', 1200, 460),
      link: '/products',
    },
  ],
};