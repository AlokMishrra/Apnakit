"use client";

import { useDispatch } from "react-redux";
import { setUser, setTokens } from "@/store/slices/authSlice";
import { setAuthCookies } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCallback } from "react";

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

export function useAuthActions() {
  const dispatch = useDispatch();
  const router = useRouter();

  const applyAuth = useCallback(
    (user: any, accessToken: string, refreshToken: string, redirect: boolean = true) => {
      if (!accessToken) return;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      setAuthCookies(accessToken, refreshToken);

      if (user) {
        const mappedUser = {
          _id: user.id || user._id,
          name: user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          role: (user.role === "ADMIN" || user.role === "SELLER" || user.role === "DELIVERY" || user.role === "CUSTOMER")
            ? (user.role === "ADMIN" ? "admin" : user.role === "SELLER" ? "seller" : user.role === "DELIVERY" ? "delivery" : "user")
            : "user",
          isVerified: user.isVerified ?? true,
          addresses: [],
          createdAt: user.createdAt || new Date().toISOString(),
          updatedAt: user.updatedAt || new Date().toISOString(),
        };
        dispatch(setUser(mappedUser as any));
        dispatch(setTokens({ accessToken, refreshToken }));
        if (redirect) {
          const displayName = mappedUser.name || "User";
          toast.success(`Welcome, ${displayName}!`);
          const redirectPath = getRedirectPath(user.role);
          router.push(redirectPath);
        }
      }
    },
    [dispatch, router]
  );

  return { applyAuth };
}
