"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * Google Sign-In via the OAuth 2.0 REDIRECT flow.
 *
 * Why the redirect flow (not GIS)?
 *   - The Google Identity Services (GIS) popup requires the OAuth
 *     client's **Authorized JavaScript origins** to include your
 *     frontend origin. That's a 403 ("The given origin is not allowed")
 *     if the OAuth client was created without that origin.
 *   - The redirect flow is governed by **Authorized redirect URIs**
 *     instead, which are much easier to add in Google Cloud Console.
 *
 * Flow:
 *   1. User clicks "Continue with Google"
 *   2. Frontend calls our backend's `GET /api/v1/auth/google/redirect`
 *   3. Backend returns the Google OAuth URL
 *   4. Frontend navigates the browser to that URL → Google auth page
 *   5. Google redirects back to `GET /api/v1/auth/google/callback`
 *   6. Backend exchanges the `code` for tokens, finds/creates the
 *      local user, mints our ApnaKit JWTs, and redirects the browser
 *      to `/auth/google-callback#access_token=…&refresh_token=…`
 *   7. The callback page reads the tokens from the URL hash, stores
 *      them, and routes the user to `/` (or `/admin/dashboard`)
 *
 * No GIS, no "origin not allowed" — only the redirect URI must be
 * allowlisted in Google Cloud Console:
 *   `http://localhost:3000/api/v1/auth/google/callback`
 *
 * (The frontend's `/auth/google-callback` URL is purely a client-side
 * route and doesn't need to be added.)
 */

export interface GoogleProfile {
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

interface GoogleSignInButtonProps {
  /** Optional: render a custom button instead of the default. */
  renderCustomButton?: (props: { onClick: () => void; disabled: boolean }) => React.ReactNode;
  /** Disable the button. */
  disabled?: boolean;
  className?: string;
  /** Custom label for the button. */
  label?: string;
}

export function GoogleSignInButton({
  renderCustomButton,
  disabled = false,
  className,
  label = "Continue with Google",
}: GoogleSignInButtonProps) {
  const [working, setWorking] = React.useState(false);

  const handleClick = React.useCallback(async () => {
    if (working || disabled) return;
    setWorking(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
      // 1) Ask our backend for the Google OAuth URL
      const res = await fetch(`${apiBase}/auth/google/redirect`, {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(
          `Could not start Google sign-in (HTTP ${res.status})`
        );
      }
      const json = (await res.json()) as any;
      const url = json?.url || json?.data?.url;
      if (!url) {
        throw new Error("Server did not return a Google OAuth URL");
      }
      // 2) Navigate the browser to Google
      window.location.href = url;
    } catch (err: any) {
      setWorking(false);
      const msg = err?.message || "Google sign-in failed. Please try again.";
      toast.error("Google sign-in failed", { description: msg });
    }
  }, [working, disabled]);

  if (renderCustomButton) {
    return (
      <div className={cn("w-full", className)}>
        {renderCustomButton({ onClick: handleClick, disabled: disabled || working })}
        {working && (
          <div className="mt-1 flex items-center justify-center text-xs text-muted-foreground">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Redirecting to Google…
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || working}
      className={cn(
        "inline-flex w-full items-center justify-center gap-3 rounded-md border border-input bg-white px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors",
        "hover:bg-gray-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
    >
      {working ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
      )}
      <span>{working ? "Redirecting…" : label}</span>
    </button>
  );
}
