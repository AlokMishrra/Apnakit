"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setUser, setTokens } from "@/store/slices/authSlice";
import { setAuthCookies } from "@/lib/utils";
import { Loader2 } from "lucide-react";

function mapUser(user: any) {
  return {
    _id: user.id || user._id,
    name: user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    role:
      user.role === "ADMIN"
        ? "admin"
        : user.role === "SELLER"
        ? "seller"
        : user.role === "DELIVERY"
        ? "delivery"
        : "user",
    isVerified: user.isVerified ?? true,
    addresses: [],
    createdAt: user.createdAt || new Date().toISOString(),
    updatedAt: user.updatedAt || new Date().toISOString(),
  };
}

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
  const [error, setError] = useState("");

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) {
      setError("No authentication data received from Google.");
      return;
    }

    const params = new URLSearchParams(hash.replace(/^#\/?/, ""));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (!accessToken) {
      setError("No access token received. Please try again.");
      return;
    }

    localStorage.setItem("accessToken", accessToken);
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }
    setAuthCookies(accessToken, refreshToken || "");

    // Fetch user profile using the access token
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1"}/auth/me`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch user profile");
        return res.json();
      })
      .then((response) => {
        const user = response?.data || response;
        if (user) {
          const mapped = mapUser(user);
          dispatch(setUser(mapped as any));
          dispatch(setTokens({ accessToken, refreshToken: refreshToken || "" }));
          router.push(getRedirectPath(user.role));
        } else {
          router.push("/");
        }
      })
      .catch(() => {
        // Token is stored, just redirect to home and let auth guard handle it
        router.push("/");
      });
  }, [router, dispatch]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-red-600">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="text-sm font-medium text-primary hover:underline"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Signing you in with Google...</span>
      </div>
    </div>
  );
}
