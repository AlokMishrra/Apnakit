/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://apnakit.com',
  generateRobotsTxt: true,
  sitemapSize: 5000,
  transform: async (config, path) => {
    if (path === '/') {
      return {
        loc: path,
        lastmod: new Date().toISOString(),
        changefreq: 'daily',
        priority: 1.0,
      };
    }

    if (path.startsWith('/category/')) {
      return {
        loc: path,
        lastmod: new Date().toISOString(),
        changefreq: 'weekly',
        priority: 0.8,
      };
    }

    if (path.startsWith('/products/')) {
      return {
        loc: path,
        lastmod: new Date().toISOString(),
        changefreq: 'daily',
        priority: 0.9,
      };
    }

    return {
      loc: path,
      lastmod: new Date().toISOString(),
      changefreq: 'monthly',
      priority: 0.5,
    };
  },
  exclude: [
    '/account/*',
    '/cart',
    '/checkout/*',
    '/wishlist',
    '/orders/*',
    '/api/*',
  ],
  robotsTxtOptions: {
    additionalSitemaps: [],
  },
};
