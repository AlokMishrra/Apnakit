/**
 * Custom image loader for next/image.
 *
 * The catalogue holds imagery from ~80 different hosts (retailer CDNs, Google
 * image thumbnails, Amazon media, Cloudinary...). `images.remotePatterns`
 * cannot enumerate that many, and an unlisted host would otherwise render as a
 * broken image.
 *
 * So: hosts we control go through the Next.js optimizer, everything else is
 * returned untouched and served straight from its origin.
 */

const OPTIMIZED_HOSTS = new Set([
  "images.unsplash.com",
  "res.cloudinary.com",
  "*.supabase.co",
  "*.amazonaws.com",
]);

function hostMatches(hostname: string, pattern: string): boolean {
  if (!pattern.startsWith("*.")) return hostname === pattern;
  const suffix = pattern.slice(1); // ".supabase.co"
  return hostname === pattern.slice(2) || hostname.endsWith(suffix);
}

export default function apnakitImageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  // Relative paths are served by Next from our own origin.
  if (src.startsWith("/")) {
    return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality ?? 75}`;
  }

  if (!src.startsWith("http://") && !src.startsWith("https://")) {
    return src;
  }

  let hostname: string;
  try {
    hostname = new URL(src).hostname;
  } catch {
    return src;
  }

  const shouldOptimize = [...OPTIMIZED_HOSTS].some((pattern) =>
    hostMatches(hostname, pattern),
  );

  if (!shouldOptimize) {
    // Bypass the optimizer entirely for third-party hosts.
    return src;
  }

  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality ?? 75}`;
}