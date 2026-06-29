"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OtpPage() {
  const router = useRouter();

  useEffect(() => {
    // OTP flow is now integrated into /login and /register pages
    router.replace("/login");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-sm text-muted-foreground">Redirecting to login...</div>
    </div>
  );
}
