"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";

/**
 * Partner referral capture.
 *
 * A partner shares a link like /product/<slug>?ref=APK-XXXXX. When a visitor
 * lands on it we:
 *   1. keep a visitor session id in a cookie (30 days, like the partner app's
 *      attribution window),
 *   2. remember the code + product, and
 *   3. tell the backend, which records the click in the partner app's Supabase
 *      tables (referral_events / referral_attributions).
 *
 * The same session id is sent with the order so the backend can attribute it.
 */

const SESSION_COOKIE = "apnakit_ref_session";
const CODE_COOKIE = "apnakit_ref_code";
const PRODUCT_COOKIE = "apnakit_ref_product";
const DAYS = 30;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + DAYS * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function newSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

/** The visitor session id used for referral attribution. */
export function getReferralSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = readCookie(SESSION_COOKIE);
  if (!id) {
    id = newSessionId();
    writeCookie(SESSION_COOKIE, id);
  }
  return id;
}

export function getReferralCode(): string | null {
  return readCookie(CODE_COOKIE);
}

/**
 * Records the click for a partner link. Safe to call on every render: the
 * backend is idempotent per session and product.
 */
export async function trackReferralClick(
  code: string,
  productSlug: string,
  landingUrl?: string
): Promise<boolean> {
  try {
    const sessionId = getReferralSessionId();
    const res = await api.post("/referrals/track", {
      code,
      productSlug,
      sessionId,
      landingUrl: landingUrl ?? (typeof window !== "undefined" ? window.location.href : undefined),
    });
    const attributed = (res as any)?.data?.attributed ?? false;
    if (attributed) {
      writeCookie(CODE_COOKIE, code.toUpperCase());
      writeCookie(PRODUCT_COOKIE, productSlug);
    }
    return !!attributed;
  } catch {
    // A failed tracking call must never break the product page.
    return false;
  }
}

export interface ReferralState {
  code: string | null;
  discountPercent: number;
  loading: boolean;
}

/**
 * Reads the referral the current visitor is attributed to. Used to show the
 * discount banner and to warn the customer before checkout.
 */
export function useReferral(): ReferralState {
  const [state, setState] = useState<ReferralState>({
    code: null,
    discountPercent: 0,
    loading: true,
  });

  useEffect(() => {
    const code = getReferralCode();
    if (!code) {
      setState({ code: null, discountPercent: 0, loading: false });
      return;
    }
    const sessionId = getReferralSessionId();
    api
      .get("/referrals/preview", { params: { sessionId } })
      .then((res) => {
        const data = (res as any)?.data;
        setState({
          code: data?.attributed ? data.referralCode : null,
          discountPercent: Number(data?.discountPercent) || 0,
          loading: false,
        });
      })
      .catch(() => setState({ code: null, discountPercent: 0, loading: false }));
  }, []);

  return state;
}
