export const STORE_NAME = "ApnaKit";

export const CATEGORIES = [
  { name: "Electronics", slug: "electronics", icon: "Laptop" },
  { name: "Fashion", slug: "fashion", icon: "Shirt" },
  { name: "Home & Kitchen", slug: "home-kitchen", icon: "Home" },
  { name: "Beauty & Health", slug: "beauty-health", icon: "Sparkles" },
  { name: "Groceries", slug: "groceries", icon: "Apple" },
  { name: "Sports", slug: "sports", icon: "Dumbbell" },
  { name: "Books", slug: "books", icon: "BookOpen" },
  { name: "Toys & Games", slug: "toys-games", icon: "Gamepad2" },
  { name: "Automotive", slug: "automotive", icon: "Car" },
  { name: "Baby & Kids", slug: "baby-kids", icon: "Baby" },
] as const;

export const PAYMENT_METHODS = [
  "Credit Card",
  "Debit Card",
  "UPI",
  "Net Banking",
  "Cash on Delivery",
  "Wallet",
] as const;

export const ORDER_STATUSES = [
  "placed",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export const TOP_BAR_LINKS = {
  deliverTo: "Deliver to",
  help: "Help",
  trackOrder: "Track Order",
  sellOn: "Sell on ApnaKit",
};

export const FOOTER_LINKS = {
  about: [
    { label: "About Us", href: "/about" },
    { label: "Help Center", href: "/help" },
  ],
  customerPolicy: [
    { label: "Return Policy", href: "/about" },
    { label: "Terms of Use", href: "/terms" },
    { label: "Privacy", href: "/privacy" },
    { label: "Sitemap", href: "/sitemap" },
  ],
  quickLinks: [
    { label: "Contact Us", href: "/contact" },
    { label: "Track Order", href: "/track-order" },
    { label: "Help Center", href: "/help" },
  ],
};

export const SOCIAL_LINKS = [
  { name: "Facebook", url: "#" },
  { name: "Twitter", url: "#" },
  { name: "Instagram", url: "#" },
  { name: "YouTube", url: "#" },
];
