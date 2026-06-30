import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ReduxProvider } from "@/providers/redux-provider";
import { QueryProvider } from "@/providers/query-provider";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ApnaKit - Your One-Stop Online Shopping Destination",
    template: "%s | ApnaKit",
  },
  description:
    "Discover amazing deals on electronics, fashion, home & kitchen essentials. Shop now with free delivery on orders above ₹999.",
  keywords: [
    "online shopping",
    "ecommerce",
    "electronics",
    "fashion",
    "home appliances",
    "ApnaKit",
    "best deals",
    "free delivery",
  ],
  authors: [{ name: "ApnaKit" }],
  creator: "ApnaKit",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon-16x16.png",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "ApnaKit",
    title: "ApnaKit - Your One-Stop Online Shopping Destination",
    description:
      "Discover amazing deals on electronics, fashion, home & kitchen essentials.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "ApnaKit" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ApnaKit - Your One-Stop Online Shopping Destination",
    description:
      "Discover amazing deals on electronics, fashion, home & kitchen essentials.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ReduxProvider>
          <QueryProvider>
            {children}
            <Toaster />
            <SonnerToaster
              position="top-right"
              richColors
              closeButton
              duration={3000}
            />
          </QueryProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}