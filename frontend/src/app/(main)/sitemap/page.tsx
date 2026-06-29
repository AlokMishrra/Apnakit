import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sitemap | ApnaKit',
  description: 'Explore all pages, categories, and policies on ApnaKit.',
};

const categories = [
  { name: 'Electronics', href: '/category/electronics' },
  { name: 'Fashion', href: '/category/fashion' },
  { name: 'Home & Kitchen', href: '/category/home-kitchen' },
  { name: 'Beauty & Health', href: '/category/beauty-health' },
  { name: 'Sports & Outdoors', href: '/category/sports-outdoors' },
  { name: 'Books & Stationery', href: '/category/books-stationery' },
  { name: 'Toys & Games', href: '/category/toys-games' },
  { name: 'Groceries', href: '/category/groceries' },
];

const popularProducts = [
  { name: 'Trending Products', href: '/products?sort=trending' },
  { name: 'New Arrivals', href: '/products?sort=newest' },
  { name: 'Best Sellers', href: '/products?sort=bestseller' },
  { name: 'Top Rated', href: '/products?sort=rating' },
  { name: 'Deals of the Day', href: '/deals' },
  { name: 'Under ₹999', href: '/products?maxPrice=999' },
];

const policies = [
  { name: 'About Us', href: '/about' },
  { name: 'Contact Us', href: '/contact' },
  { name: 'Privacy Policy', href: '/privacy-policy' },
  { name: 'Terms & Conditions', href: '/terms' },
  { name: 'Shipping Policy', href: '/shipping-policy' },
  { name: 'Return & Refund Policy', href: '/return-policy' },
  { name: 'Cancellation Policy', href: '/cancellation-policy' },
  { name: 'FAQ', href: '/faq' },
];

const account = [
  { name: 'My Account', href: '/account' },
  { name: 'My Orders', href: '/account/orders' },
  { name: 'My Wishlist', href: '/wishlist' },
  { name: 'My Addresses', href: '/account/addresses' },
  { name: 'Track Order', href: '/track-order' },
  { name: 'Loyalty Points', href: '/account/loyalty' },
  { name: 'Wallet', href: '/account/wallet' },
];

const sitemapSections = [
  { title: 'Categories', links: categories },
  { title: 'Popular', links: popularProducts },
  { title: 'Policies', links: policies },
  { title: 'My Account', links: account },
];

export default function SitemapPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Sitemap</h1>
          <p className="mt-2 text-gray-600">
            Find everything you need on ApnaKit
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {sitemapSections.map((section) => (
            <div key={section.title}>
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                {section.title}
              </h2>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-600 transition-colors hover:text-blue-600"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t pt-8 text-center">
          <p className="text-sm text-gray-500">
            Can&apos;t find what you&apos;re looking for?{' '}
            <Link href="/contact" className="text-blue-600 hover:underline">
              Contact our support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
