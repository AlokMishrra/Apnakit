"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import { setUser, setTokens } from "@/store/slices/authSlice";
import { setAuthCookies } from "@/lib/utils";
import { api } from "@/services/api";
import { toast } from "sonner";
import { getSafeErrorMessage, isAuthError } from "@/lib/safe-error";
import type { User } from "@/types";

/**
 * Google OAuth 2.0 redirect callback. The backend redirects the browser
 * here with the ApnaKit access/refresh tokens in the URL hash. We:
 *  1. Read the tokens from `window.location.hash`
 *  2. GET /auth/me with the new access token to load the user
 *  3. Dispatch Redux, set cookies, redirect to home (or admin dashboard)
 *
 * If the backend redirected here with an `?error=` query param
 * (e.g. user denied consent, or the OAuth code expired), we surface
 * the error and send the user back to /login.
 */
function getRedirectPath(role: string): string {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard";
    case "SELLER":
      return "/seller/dashboard";
    case "DELIVERY":
      return "/delivery/dashboard";
    default:
      return "/";
  }
}

export default function GoogleCallbackPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const [status, setStatus] = React.useState<"working" | "success" | "error">(
    "working"
  );
  const [errorMsg, setErrorMsg] = React.useState<string>("");

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Surface any error the backend redirected here with
        const errCode = searchParams.get("error");
        if (errCode) {
          throw new Error(decodeURIComponent(errCode));
        }

        // 1) Read the ApnaKit tokens from the URL hash that the backend
        //    appended during the redirect.
        let accessToken: string | null = null;
        let refreshToken: string | null = null;
        if (typeof window !== "undefined" && window.location.hash) {
          const hash = window.location.hash.replace(/^#/, "");
          const params = new URLSearchParams(hash);
          accessToken = params.get("access_token");
          refreshToken = params.get("refresh_token");
        }
        if (!accessToken) {
          throw new Error(
            "Google sign-in did not return an access token. Please try again."
          );
        }

        // 2) Load the user profile via our own backend
        try {
          localStorage.setItem("accessToken", accessToken);
          if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
          setAuthCookies(accessToken, refreshToken || "");
          const res = await api.get("/users/profile");
          const payload =
            (res.data as any)?.data?.data ||
            (res.data as any)?.data ||
            res.data;
          const user = payload?.user || payload;
          if (!user?.id) {
            throw new Error("Could not load your profile after Google sign-in.");
          }
          if (cancelled) return;
          dispatch(setUser(user as User));
          dispatch(
            setTokens({ accessToken, refreshToken: refreshToken || "" } as any)
          );
          setStatus("success");
          toast.success(`Welcome, ${user.firstName || "friend"}!`, {
            description: "Signed in with Google",
          });
          // Clean the URL hash so a refresh doesn't replay the flow
          try {
            window.history.replaceState(null, "", window.location.pathname);
          } catch {
            // ignore
          }
          const role = String(user.role || "CUSTOMER").toUpperCase();
          setTimeout(() => router.push(getRedirectPath(role)), 300);
        } catch (profileErr: any) {
          if (isAuthError(profileErr)) {
            // Tokens were invalid (expired) — clean up
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
          }
          throw profileErr;
        }
      } catch (err: any) {
        if (cancelled) return;
        const msg = getSafeErrorMessage(
          err,
          "Google sign-in failed. Please try again."
        );
        setErrorMsg(msg);
        setStatus("error");
        toast.error("Google sign-in failed", { description: msg });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch, router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50/50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        {status === "working" && (
          <>
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-indigo-600" />
            <h2 className="text-lg font-semibold text-foreground">
              Finishing Google sign-in…
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We're exchanging the Google response for an ApnaKit account.
            </p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Signed in!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Redirecting you to your dashboard…
            </p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Google sign-in failed
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{errorMsg}</p>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="mt-6 inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Back to login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
