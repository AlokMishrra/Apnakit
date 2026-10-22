import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";

// next.config.ts is evaluated before Next.js loads .env files, so BACKEND_URL
// from .env.local would otherwise be invisible here and the rewrites would
// silently fall back to the wrong host. Values already present in the real
// environment (Vercel) always win, since loadEnvConfig does not override them.
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

const isProd = process.env.NODE_ENV === "production";

/**
 * Origin of the backend API (no trailing slash).
 *
 * Production must supply this via BACKEND_URL (used at build time for the
 * proxy rewrites) or NEXT_PUBLIC_BACKEND_URL. It previously fell back to a
 * hardcoded Render host, which made repointing the API a code change.
 */
const backendUrl = (
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  (isProd ? "" : "http://localhost:3000")
).replace(/\/+$/, "");

if (isProd && !backendUrl) {
  throw new Error(
    "BACKEND_URL is not set. Add it to the Vercel project environment " +
      "(e.g. https://apnakit-api.vercel.app) so API traffic can be proxied.",
  );
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: `${backendUrl}/uploads/:path*`,
      },
      // Proxy all API calls through Next.js so the frontend never has to
      // talk to a different origin. If the backend is down, you'll see a
      // clear 502 from Next.js instead of ERR_CONNECTION_REFUSED.
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      // Partner referral links were once built as
      // https://apnakit.in/product/product/<slug>, because the referral base
      // URL already ended in /product. Those links must still land on the
      // product page.
      {
        source: "/product/product/:slug*",
        destination: "/product/:slug*",
        permanent: true,
      },
    ];
  },
  images: {
    // The Vercel image optimizer on this project answers 404 for every
    // remote host, which left every catalogue photo broken. The catalogue is
    // third-party imagery anyway, so the images are served straight from
    // their origin.
    unoptimized: true,
    // The real catalogue points at ~80 third-party image hosts. The custom
    // loader optimises the ones we control and passes the rest straight through,
    // so remotePatterns only needs to cover the optimised set.
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "*.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  env: {
    // Relative by design: same-origin requests hit the rewrite above, so the
    // browser never makes a cross-origin call to the API.
    NEXT_PUBLIC_API_URL: "/api/v1",
    NEXT_PUBLIC_BACKEND_URL: backendUrl,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
    NEXT_PUBLIC_APP_NAME: "ApnaKit",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "",
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },
};

export default nextConfig;
