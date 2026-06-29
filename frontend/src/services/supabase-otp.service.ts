import { getSupabase } from "@/lib/supabase-client";
import type { User } from "@/types";

export type OtpChannel = "sms" | "whatsapp";

/**
 * Normalise a phone number to E.164. If the user entered a 10-digit
 * Indian mobile number we assume +91. Adjust the default country code
 * here if your customer base is elsewhere.
 */
export function toE164(phone: string, defaultCountry = "91"): string {
  const digits = phone.replace(/\D/g, "");
  if (phone.trim().startsWith("+")) return `+${digits}`;
  if (digits.length === 10) return `+${defaultCountry}${digits}`;
  return `+${digits}`;
}

export interface SupabaseOtpChallenge {
  phoneId: string;
  expiresAt?: number;
}

/**
 * Send a one-time password to the user's phone via Supabase Auth.
 * Supabase's Phone provider is backed by Twilio Verify when configured
 * in the Supabase dashboard under Authentication → Providers → Phone.
 */
export async function sendPhoneOtp(
  phone: string,
  options: { channel?: OtpChannel } = {}
): Promise<SupabaseOtpChallenge> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error(
      "Supabase client not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  const normalized = toE164(phone);
  const { data, error } = await supabase.auth.signInWithOtp({
    phone: normalized,
    options: {
      channel: options.channel ?? "sms",
      shouldCreateUser: true,
    },
  });
  if (error) {
    throw new Error(error.message || "Could not send OTP via Supabase");
  }
  return {
    phoneId: (data as any)?.phone_id || "",
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 min
  };
}

/**
 * Verify the OTP against Supabase, then exchange the resulting Supabase
 * session for ApnaKit JWTs via our `/auth/supabase` backend endpoint.
 */
export async function verifyPhoneOtpAndSignIn(
  phone: string,
  code: string
): Promise<{ accessToken: string; refreshToken: string; user: User }> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Supabase client not configured.");
  }
  const normalized = toE164(phone);

  // 1) Verify the OTP with Supabase (Twilio Verify under the hood)
  const { data, error } = await supabase.auth.verifyOtp({
    phone: normalized,
    token: code,
    type: "sms",
  });
  if (error || !data?.session || !data?.user) {
    throw new Error(
      error?.message || "Invalid or expired OTP. Please try again."
    );
  }
  const { session, user: sbUser } = data;
  if (!session?.access_token) {
    throw new Error("Supabase returned an empty session.");
  }

  // 2) Exchange the Supabase session for our own JWTs
  return exchangeSupabaseSessionForApnaKit(
    session.access_token,
    session.refresh_token || "",
    sbUser as any
  );
}

async function exchangeSupabaseSessionForApnaKit(
  supabaseAccessToken: string,
  supabaseRefreshToken: string,
  sbUser: {
    id: string;
    email?: string;
    phone?: string;
    user_metadata?: any;
  }
): Promise<{ accessToken: string; refreshToken: string; user: User }> {
  // Build a body with only the fields that actually have a value. This
  // avoids sending `null`/`undefined` for things like `email` on
  // phone-only Supabase users — and the backend DTO will not have to
  // accept null/empty for every field.
  const fullName =
    (sbUser.user_metadata as any)?.full_name ||
    (sbUser.user_metadata as any)?.name;
  const avatarUrl =
    (sbUser.user_metadata as any)?.avatar_url ||
    (sbUser.user_metadata as any)?.picture;
  const body: Record<string, unknown> = {
    supabaseAccessToken,
  };
  if (supabaseRefreshToken) body.supabaseRefreshToken = supabaseRefreshToken;
  if (sbUser.id) body.supabaseUserId = sbUser.id;
  if (sbUser.email) body.email = sbUser.email;
  if (sbUser.phone) body.phone = sbUser.phone;
  if (fullName) body.fullName = fullName;
  if (avatarUrl) body.avatarUrl = avatarUrl;

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
  let res: Response;
  try {
    res = await fetch(`${apiBase}/auth/supabase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err: any) {
    // Network failures (backend down, DNS error, CORS, etc.) throw here
    // rather than returning a Response. Surface a clear message instead
    // of the cryptic "Failed to fetch" the browser produces.
    const code = err?.cause?.code || err?.code || "";
    if (code === "ECONNREFUSED" || /connection refused/i.test(String(err?.message))) {
      throw new Error(
        "Our auth server is not reachable on localhost:3000. " +
          "Please make sure the backend is running (`npm run start:dev` in the backend folder) and try again."
      );
    }
    if (code === "ENOTFOUND" || /getaddrinfo/i.test(String(err?.message))) {
      throw new Error(
        "Could not resolve the auth server hostname. Check your network connection."
      );
    }
    throw new Error(
      `Could not reach the auth server: ${err?.message || "network error"}`
    );
  }
  const raw = await res.json();
  if (!res.ok) {
    const serverMsg =
      raw?.message?.message ||
      raw?.message ||
      raw?.error?.message ||
      `Phone sign-in failed (HTTP ${res.status})`;
    throw new Error(
      typeof serverMsg === "string" ? serverMsg : "Phone sign-in failed"
    );
  }
  const payload = (raw as any)?.data?.data || (raw as any)?.data || raw;
  const user = payload?.user as User;
  // Backend spreads `{accessToken, refreshToken}` from `generateTokens()`
  // at the top level of the returned object (after the global
  // TransformInterceptor wraps it in `data`).
  const accessToken =
    (payload as any)?.accessToken ||
    (payload as any)?.tokens?.accessToken;
  const refreshToken =
    (payload as any)?.refreshToken ||
    (payload as any)?.tokens?.refreshToken;
  if (!user || !accessToken) {
    throw new Error(
      "Server returned an invalid response (missing user or accessToken)"
    );
  }
  return {
    accessToken,
    refreshToken: refreshToken || "",
    user,
  };
}
