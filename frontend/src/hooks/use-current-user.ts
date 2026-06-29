"use client";

import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";

export function useCurrentUser() {
  const user = useSelector((state: RootState) => state.auth.user);
  const isLoading = useSelector((state: RootState) => state.auth.loading);
  return { user, isLoading };
}
