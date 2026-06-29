import { getSupabase } from "@/lib/supabase-client";
import type { User } from "@/types";
import type { ApiResponse, AuthTokens } from "@/types";

export interface SupabaseSessionResponse {
  user: {
    id: string;
    email: string;
    user_metadata?: {
      name?: string;
      full_name?: string;
      avatar_url?: string;
      picture?: string;
      email?: string;
    };
    app_metadata?: Record<string, any>;
  };
  access_token: string;
  refresh_token: string;
  expires_in?: number;
}

/**
 * Sign in with Google via Supabase's built-in OAuth flow.
 *
 * This is the recommended approach: Supabase handles the entire OAuth
 * handshake with Google, and we just exchange the resulting Supabase
 * access token for our own ApnaKit JWTs.
 *
 * No need to configure Authorized JS Origins on the Google OAuth
 * client — Supabase does that on the server side.
 */
export async function signInWithGoogleViaSupabase(
  redirectTo: string
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error(
      "Supabase client not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  // Triggers a full-page redirect to Supabase's OAuth handler, which
  // redirects to Google, then back to our app at the configured
  // redirectTo URL.
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}${redirectTo}`,
    },
  });
  if (error) {
    throw new Error(
      error.message || "Could not start Google sign-in. Please try again."
    );
  }
}

/**
 * Complete the Google sign-in after the Supabase OAuth redirect.
 * Reads the Supabase session (which Supabase stored automatically) and
 * exchanges it for our own JWTs.
 */
export async function completeSupabaseOAuthLogin(
  sbAccessToken: string,
  sbRefreshToken: string,
  sbUser: { id: string; email?: string; phone?: string; user_metadata?: any }
): Promise<{ accessToken: string; refreshToken: string; user: User }> {
  const fullName =
    (sbUser.user_metadata as any)?.full_name ||
    (sbUser.user_metadata as any)?.name;
  const avatarUrl =
    (sbUser.user_metadata as any)?.avatar_url ||
    (sbUser.user_metadata as any)?.picture;

  const body: Record<string, unknown> = {
    supabaseAccessToken: sbAccessToken,
  };
  if (sbRefreshToken) body.supabaseRefreshToken = sbRefreshToken;
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
    throw new Error(
      `Could not reach the auth server: ${err?.message || "network error"}`
    );
  }
  const raw = await res.json();
  if (!res.ok) {
    const msg =
      raw?.message?.message ||
      raw?.message ||
      raw?.error?.message ||
      "Google sign-in failed on the server";
    throw new Error(
      typeof msg === "string" ? msg : "Google sign-in failed"
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

export async function signInWithSupabaseSession(
  accessToken: string
): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
  const res = await fetch(`${apiBase}/auth/supabase`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ supabaseAccessToken: accessToken }),
  });
  const raw = await res.json();
  return (raw as any)?.data?.data || raw;
}
