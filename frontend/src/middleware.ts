import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function getTokenFromRequest(request: NextRequest): string | null {
  const token = request.cookies.get("accessToken")?.value;
  if (token) return token;
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const raw = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = raw + "=".repeat((4 - (raw.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const text = new TextDecoder("utf-8").decode(bytes);
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = getTokenFromRequest(request);

  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  const isSellerRoute = pathname === "/seller" || pathname.startsWith("/seller/");
  const isDeliveryRoute = pathname === "/delivery" || pathname.startsWith("/delivery/");

  const isAccount = pathname === "/account" || pathname.startsWith("/account/");
  const isCheckout = pathname === "/checkout" || pathname.startsWith("/checkout/");

  if (isAdminRoute || isSellerRoute || isDeliveryRoute || isAccount || isCheckout) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = decodeJwtPayload(token);
    const role = (payload?.role as string) || "";

    if (isAdminRoute && role !== "ADMIN") {
      if (role === "SELLER") return NextResponse.redirect(new URL("/seller/dashboard", request.url));
      if (role === "DELIVERY") return NextResponse.redirect(new URL("/delivery/dashboard", request.url));
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (isSellerRoute && role !== "SELLER" && role !== "ADMIN") {
      if (role === "DELIVERY") return NextResponse.redirect(new URL("/delivery/dashboard", request.url));
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (isDeliveryRoute && role !== "DELIVERY" && role !== "ADMIN") {
      if (role === "SELLER") return NextResponse.redirect(new URL("/seller/dashboard", request.url));
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/seller/:path*",
    "/delivery/:path*",
    "/account/:path*",
    "/checkout/:path*",
  ],
};
